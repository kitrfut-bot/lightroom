/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ExifMetadata {
  camera?: string;
  lens?: string;
  iso?: number;
  aperture?: string;
  shutter?: string;
  focalLength?: string;
  dateTaken?: string;
  colorSpace?: string;
}

export interface CurvePoint {
  x: number; // 0 to 1
  y: number; // 0 to 1
}

export interface ChannelCurves {
  rgb: CurvePoint[];
  red: CurvePoint[];
  green: CurvePoint[];
  blue: CurvePoint[];
}

export interface ColorWheelState {
  hue: number;        // 0 to 360
  sat: number;        // 0 to 100
  lum: number;        // -100 to +100
}

export interface ColorGradingState {
  shadows: ColorWheelState;
  midtones: ColorWheelState;
  highlights: ColorWheelState;
  blending: number;   // 0 to 100 (default 50)
  balance: number;    // -100 to +100 (default 0)
}

export interface BrushStroke {
  points: { x: number; y: number }[]; // Normalized 0..1
  size: number;                        // In percentage of width (0.01 to 0.2)
  feather: number;                     // 0 to 1
  flow: number;                        // 0.1 to 1.0
}

export interface LocalMask {
  id: string;
  name: string;
  type: 'brush' | 'linear_gradient' | 'radial_gradient';
  enabled: boolean;
  inverted: boolean;
  adjustments: {
    exposure: number;     // -3 to +3
    contrast: number;     // -100 to +100
    highlights: number;   // -100 to +100
    shadows: number;      // -100 to +100
    temp: number;         // -100 to +100
    saturation: number;   // -100 to +100
    clarity: number;      // -100 to +100
  };
  brushStrokes?: BrushStroke[];
  linearGradient?: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  };
  radialGradient?: {
    centerX: number;
    centerY: number;
    radiusX: number;
    radiusY: number;
    rotation: number;
    feather: number;
  };
}

export interface PhotoAdjustments {
  // Basic Tone
  exposure: number;       // -5.0 to +5.0 EV (default 0)
  contrast: number;       // -100 to +100
  highlights: number;     // -100 to +100
  shadows: number;        // -100 to +100
  whites: number;         // -100 to +100
  blacks: number;         // -100 to +100

  // White Balance & Presence
  temp: number;           // 2000 to 10000 Kelvin (default 5500)
  tint: number;           // -100 to +100 (default 0)
  vibrance: number;       // -100 to +100
  saturation: number;     // -100 to +100

  // Tone Curve
  curveMode: 'point' | 'parametric';
  curves: ChannelCurves;
  parametricCurve: {
    highlights: number; // -100 to 100
    lights: number;     // -100 to 100
    darks: number;      // -100 to 100
    shadows: number;    // -100 to 100
  };

  // Color Grading
  colorGrading: ColorGradingState;

  // Detail & Optics
  sharpness: number;      // 0 to 100
  noiseReduction: number; // 0 to 100
  vignette: {
    amount: number;       // -100 to +100
    midpoint: number;     // 0 to 100
    feather: number;      // 0 to 100
  };

  // Local Masking Layers
  masks: LocalMask[];
}

export interface HistoryStep {
  id: string;
  timestamp: number;
  label: string;
  adjustments: PhotoAdjustments;
}

export interface PhotoItem {
  id: string;
  name: string;
  fileSize: number;
  width: number;
  height: number;
  format: 'DNG' | 'RAW' | 'TIFF' | 'JPEG' | 'PNG';
  url: string;
  thumbnailUrl: string;
  rating: number; // 0 to 5
  flag: 'none' | 'pick' | 'reject';
  exif: ExifMetadata;
  adjustments: PhotoAdjustments;
  history: HistoryStep[];
  dateAdded: number;
}

export interface Preset {
  id: string;
  name: string;
  category: 'Film' | 'Creative' | 'Monochrome' | 'Landscape' | 'Portrait' | 'Custom';
  description: string;
  adjustments: Partial<PhotoAdjustments>;
}

export type ViewMode = 'library' | 'develop';
export type CompareMode = 'off' | 'split' | 'side_by_side';

export const DEFAULT_ADJUSTMENTS: PhotoAdjustments = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temp: 5500,
  tint: 0,
  vibrance: 0,
  saturation: 0,
  curveMode: 'point',
  curves: {
    rgb: [
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ],
    red: [
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ],
    green: [
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ],
    blue: [
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ]
  },
  parametricCurve: {
    highlights: 0,
    lights: 0,
    darks: 0,
    shadows: 0
  },
  colorGrading: {
    shadows: { hue: 0, sat: 0, lum: 0 },
    midtones: { hue: 0, sat: 0, lum: 0 },
    highlights: { hue: 0, sat: 0, lum: 0 },
    blending: 50,
    balance: 0
  },
  sharpness: 25,
  noiseReduction: 10,
  vignette: {
    amount: 0,
    midpoint: 50,
    feather: 50
  },
  masks: []
};
