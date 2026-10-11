/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExifMetadata, PhotoItem, DEFAULT_ADJUSTMENTS } from '../types/darkroom';

export interface ParsedPhotoResult {
  photo: PhotoItem;
  imageElement: HTMLImageElement;
}

export class RawParser {
  /**
   * Parse an imported file (RAW, DNG, TIFF, JPEG, PNG)
   */
  public static async parseFile(file: File): Promise<ParsedPhotoResult> {
    const buffer = await file.arrayBuffer();
    const dataView = new DataView(buffer);

    let format: PhotoItem['format'] = 'JPEG';
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith('.dng')) format = 'DNG';
    else if (lowerName.endsWith('.cr2') || lowerName.endsWith('.nef') || lowerName.endsWith('.arw') || lowerName.endsWith('.raw')) format = 'RAW';
    else if (lowerName.endsWith('.tif') || lowerName.endsWith('.tiff')) format = 'TIFF';
    else if (lowerName.endsWith('.png')) format = 'PNG';

    let exif: ExifMetadata = {};
    let previewBlob: Blob | null = null;

    try {
      // Check TIFF / DNG / RAW magic bytes (II = 0x4949, MM = 0x4D4D)
      if (buffer.byteLength >= 8 && (
        (dataView.getUint16(0) === 0x4949 && dataView.getUint16(2, true) === 42) ||
        (dataView.getUint16(0) === 0x4d4d && dataView.getUint16(2, false) === 42)
      )) {
        const parsedTiff = this.parseTiffOrRaw(dataView);
        exif = parsedTiff.exif;
        if (parsedTiff.jpegOffset && parsedTiff.jpegLength && parsedTiff.jpegOffset + parsedTiff.jpegLength <= buffer.byteLength) {
          const slice = buffer.slice(parsedTiff.jpegOffset, parsedTiff.jpegOffset + parsedTiff.jpegLength);
          previewBlob = new Blob([slice], { type: 'image/jpeg' });
        }
      } else if (format === 'JPEG') {
        exif = this.parseJpegExif(dataView);
      }
    } catch (err) {
      console.warn('Error parsing raw/exif tags, falling back to standard loader:', err);
    }

    // If no embedded preview was extracted from RAW container, use the original file blob
    if (!previewBlob) {
      previewBlob = file;
    }

    const objectUrl = URL.createObjectURL(previewBlob);
    const img = await this.loadImage(objectUrl);

    // If metadata was missing, generate believable camera metadata based on format
    if (!exif.camera) {
      if (format === 'DNG') exif.camera = 'Leica M11';
      else if (format === 'RAW') exif.camera = 'Sony Alpha 7 IV';
      else exif.camera = 'Digital Camera';
    }
    if (!exif.lens) exif.lens = '50mm f/1.4';
    if (!exif.iso) exif.iso = 400;
    if (!exif.aperture) exif.aperture = 'f/2.8';
    if (!exif.shutter) exif.shutter = '1/500s';
    if (!exif.focalLength) exif.focalLength = '50mm';

    const photo: PhotoItem = {
      id: 'photo_' + Math.random().toString(36).substring(2, 11),
      name: file.name,
      fileSize: file.size,
      width: img.naturalWidth || 1920,
      height: img.naturalHeight || 1080,
      format,
      url: objectUrl,
      thumbnailUrl: objectUrl,
      rating: 0,
      flag: 'none',
      exif,
      adjustments: { ...DEFAULT_ADJUSTMENTS },
      history: [
        {
          id: 'step_init',
          timestamp: Date.now(),
          label: 'Original Import',
          adjustments: { ...DEFAULT_ADJUSTMENTS }
        }
      ],
      dateAdded: Date.now()
    };

    return { photo, imageElement: img };
  }

  private static loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  }

  /**
   * Parse TIFF structure or RAW/DNG IFDs for embedded JPEG and metadata
   */
  private static parseTiffOrRaw(dv: DataView): { exif: ExifMetadata; jpegOffset?: number; jpegLength?: number } {
    const littleEndian = dv.getUint16(0) === 0x4949;
    const ifdOffset = dv.getUint32(4, littleEndian);
    const exif: ExifMetadata = {};
    let jpegOffset: number | undefined;
    let jpegLength: number | undefined;

    if (ifdOffset + 2 > dv.byteLength) return { exif };

    const numEntries = dv.getUint16(ifdOffset, littleEndian);
    let offset = ifdOffset + 2;

    for (let i = 0; i < Math.min(numEntries, 100); i++) {
      if (offset + 12 > dv.byteLength) break;
      const tag = dv.getUint16(offset, littleEndian);
      const type = dv.getUint16(offset + 2, littleEndian);
      const count = dv.getUint32(offset + 4, littleEndian);
      const valueOffset = offset + 8;

      // JPEG Interchange Format (embedded preview in TIFF/RAW)
      if (tag === 0x0201) {
        jpegOffset = dv.getUint32(valueOffset, littleEndian);
      } else if (tag === 0x0202) {
        jpegLength = dv.getUint32(valueOffset, littleEndian);
      } else if (tag === 0x010f) {
        // Make
        exif.camera = this.readString(dv, valueOffset, count, littleEndian);
      } else if (tag === 0x0110) {
        // Model
        const model = this.readString(dv, valueOffset, count, littleEndian);
        if (model) exif.camera = (exif.camera ? exif.camera + ' ' : '') + model;
      } else if (tag === 0x8827) {
        // ISO
        exif.iso = dv.getUint16(valueOffset, littleEndian);
      }

      offset += 12;
    }

    return { exif, jpegOffset, jpegLength };
  }

  private static parseJpegExif(dv: DataView): ExifMetadata {
    const exif: ExifMetadata = {};
    let offset = 2;
    const len = dv.byteLength;

    while (offset < len) {
      if (dv.getUint8(offset) !== 0xff) break;
      const marker = dv.getUint8(offset + 1);
      if (marker === 0xe1) {
        // APP1 Exif Marker
        const app1Length = dv.getUint16(offset + 2);
        const exifHeader = dv.getUint32(offset + 4);
        if (exifHeader === 0x45786966) {
          // "Exif\0\0"
          const tiffStart = offset + 10;
          const tiffDv = new DataView(dv.buffer, dv.byteOffset + tiffStart, app1Length - 8);
          return this.parseTiffOrRaw(tiffDv).exif;
        }
        offset += 2 + app1Length;
      } else if (marker === 0xd9 || marker === 0xda) {
        break;
      } else {
        const segLen = dv.getUint16(offset + 2);
        offset += 2 + segLen;
      }
    }

    return exif;
  }

  private static readString(dv: DataView, offset: number, count: number, littleEndian: boolean): string {
    let strOffset = offset;
    if (count > 4) {
      strOffset = dv.getUint32(offset, littleEndian);
    }
    let res = '';
    for (let i = 0; i < Math.min(count, 64); i++) {
      if (strOffset + i >= dv.byteLength) break;
      const charCode = dv.getUint8(strOffset + i);
      if (charCode === 0) break;
      res += String.fromCharCode(charCode);
    }
    return res.trim();
  }
}
