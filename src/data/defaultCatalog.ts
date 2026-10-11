/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PhotoItem, DEFAULT_ADJUSTMENTS } from '../types/darkroom';

/**
 * Procedurally synthesizes high-fidelity photographic canvas scenes
 * with authentic tonal ranges, highlights, and shadow gradients.
 */
function createScenicPhotoUrl(type: 'landscape' | 'portrait' | 'street' | 'seascape'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1067;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const w = canvas.width;
  const h = canvas.height;

  if (type === 'landscape') {
    // Dramatic Arctic Nordic Fjord with mountain ridges & sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
    skyGrad.addColorStop(0, '#2d4059');
    skyGrad.addColorStop(0.3, '#4f6d7a');
    skyGrad.addColorStop(0.6, '#d69e7a');
    skyGrad.addColorStop(1, '#ecc39d');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Sun disc highlight
    const sunGrad = ctx.createRadialGradient(w * 0.65, h * 0.45, 10, w * 0.65, h * 0.45, 220);
    sunGrad.addColorStop(0, 'rgba(255, 252, 235, 0.95)');
    sunGrad.addColorStop(0.3, 'rgba(255, 220, 160, 0.6)');
    sunGrad.addColorStop(1, 'rgba(255, 200, 140, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(w * 0.65, h * 0.45, 220, 0, Math.PI * 2);
    ctx.fill();

    // Far mountain range
    ctx.fillStyle = '#3a4454';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.55);
    ctx.lineTo(w * 0.2, h * 0.42);
    ctx.lineTo(w * 0.45, h * 0.48);
    ctx.lineTo(w * 0.7, h * 0.38);
    ctx.lineTo(w * 0.9, h * 0.46);
    ctx.lineTo(w, h * 0.52);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();

    // Foreground dark jagged peaks & water reflection
    ctx.fillStyle = '#1e242d';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.65);
    ctx.lineTo(w * 0.28, h * 0.5);
    ctx.lineTo(w * 0.52, h * 0.62);
    ctx.lineTo(w * 0.78, h * 0.46);
    ctx.lineTo(w, h * 0.64);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();

    // Deep water fjord
    const waterGrad = ctx.createLinearGradient(0, h * 0.68, 0, h);
    waterGrad.addColorStop(0, '#131b24');
    waterGrad.addColorStop(0.5, '#1e2d3d');
    waterGrad.addColorStop(1, '#0e151e');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, h * 0.68, w, h * 0.32);

    // Water sun sheen
    const sheenGrad = ctx.createLinearGradient(w * 0.55, 0, w * 0.75, 0);
    sheenGrad.addColorStop(0, 'rgba(236, 195, 157, 0)');
    sheenGrad.addColorStop(0.5, 'rgba(236, 195, 157, 0.35)');
    sheenGrad.addColorStop(1, 'rgba(236, 195, 157, 0)');
    ctx.fillStyle = sheenGrad;
    ctx.fillRect(w * 0.55, h * 0.68, w * 0.2, h * 0.32);
  } else if (type === 'portrait') {
    // Warm editorial studio portrait with shallow depth bokeh
    const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.4, 50, w * 0.5, h * 0.5, 900);
    bgGrad.addColorStop(0, '#8c6853');
    bgGrad.addColorStop(0.5, '#4a342a');
    bgGrad.addColorStop(1, '#1b120e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Creamy bokeh spheres
    for (let i = 0; i < 28; i++) {
      const bx = (Math.sin(i * 1.7) * 0.45 + 0.5) * w;
      const by = (Math.cos(i * 2.3) * 0.45 + 0.5) * h;
      const br = 40 + (i % 7) * 25;
      const bGrad = ctx.createRadialGradient(bx, by, br * 0.1, bx, by, br);
      bGrad.addColorStop(0, 'rgba(245, 190, 140, 0.18)');
      bGrad.addColorStop(1, 'rgba(180, 100, 60, 0)');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }

    // Elegant profile silhouette / warm rim light
    ctx.fillStyle = '#221714';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.85, w * 0.28, h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head form
    ctx.fillStyle = '#3a241b';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.46, w * 0.16, h * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Soft key light on cheek & forehead
    const keyGrad = ctx.createRadialGradient(w * 0.44, h * 0.42, 10, w * 0.44, h * 0.42, 180);
    keyGrad.addColorStop(0, 'rgba(235, 175, 140, 0.7)');
    keyGrad.addColorStop(0.6, 'rgba(180, 110, 80, 0.35)');
    keyGrad.addColorStop(1, 'rgba(80, 40, 20, 0)');
    ctx.fillStyle = keyGrad;
    ctx.beginPath();
    ctx.ellipse(w * 0.44, h * 0.42, w * 0.14, h * 0.2, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Golden rim light edge
    const rimGrad = ctx.createLinearGradient(w * 0.62, 0, w * 0.68, 0);
    rimGrad.addColorStop(0, 'rgba(255, 215, 160, 0.85)');
    rimGrad.addColorStop(1, 'rgba(255, 215, 160, 0)');
    ctx.fillStyle = rimGrad;
    ctx.fillRect(w * 0.6, h * 0.3, w * 0.08, h * 0.35);
  } else if (type === 'street') {
    // Tokyo Cyber Rain / Neon Street Reflections
    const darkGrad = ctx.createLinearGradient(0, 0, 0, h);
    darkGrad.addColorStop(0, '#0a0d14');
    darkGrad.addColorStop(0.6, '#101726');
    darkGrad.addColorStop(1, '#07090f');
    ctx.fillStyle = darkGrad;
    ctx.fillRect(0, 0, w, h);

    // Neon signs (Cyan, Magenta, Amber)
    const neonCyan = ctx.createRadialGradient(w * 0.25, h * 0.3, 10, w * 0.25, h * 0.3, 260);
    neonCyan.addColorStop(0, 'rgba(56, 217, 245, 0.85)');
    neonCyan.addColorStop(0.5, 'rgba(20, 110, 180, 0.4)');
    neonCyan.addColorStop(1, 'rgba(10, 30, 60, 0)');
    ctx.fillStyle = neonCyan;
    ctx.fillRect(w * 0.1, h * 0.1, w * 0.3, h * 0.45);

    const neonPink = ctx.createRadialGradient(w * 0.75, h * 0.25, 10, w * 0.75, h * 0.25, 280);
    neonPink.addColorStop(0, 'rgba(244, 63, 134, 0.85)');
    neonPink.addColorStop(0.5, 'rgba(160, 20, 90, 0.35)');
    neonPink.addColorStop(1, 'rgba(40, 10, 30, 0)');
    ctx.fillStyle = neonPink;
    ctx.fillRect(w * 0.6, h * 0.05, w * 0.35, h * 0.45);

    // Wet asphalt reflections
    const wetGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
    wetGrad.addColorStop(0, '#0c111a');
    wetGrad.addColorStop(0.3, '#141d2c');
    wetGrad.addColorStop(1, '#080c14');
    ctx.fillStyle = wetGrad;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);

    // Streaks of wet street reflections
    ctx.fillStyle = 'rgba(56, 217, 245, 0.28)';
    ctx.fillRect(w * 0.2, h * 0.65, w * 0.12, h * 0.35);
    ctx.fillStyle = 'rgba(244, 63, 134, 0.24)';
    ctx.fillRect(w * 0.7, h * 0.62, w * 0.15, h * 0.38);
    ctx.fillStyle = 'rgba(255, 200, 60, 0.32)';
    ctx.fillRect(w * 0.48, h * 0.7, w * 0.08, h * 0.3);
  } else {
    // Pacific Coast Seastack & Long Exposure Mist
    const oceanSky = ctx.createLinearGradient(0, 0, 0, h * 0.7);
    oceanSky.addColorStop(0, '#374151');
    oceanSky.addColorStop(0.4, '#6b7280');
    oceanSky.addColorStop(0.8, '#d1d5db');
    oceanSky.addColorStop(1, '#e5e7eb');
    ctx.fillStyle = oceanSky;
    ctx.fillRect(0, 0, w, h);

    // Monolithic basalt seastack rock
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.moveTo(w * 0.42, h * 0.28);
    ctx.lineTo(w * 0.48, h * 0.22);
    ctx.lineTo(w * 0.54, h * 0.25);
    ctx.lineTo(w * 0.6, h * 0.55);
    ctx.lineTo(w * 0.64, h * 0.75);
    ctx.lineTo(w * 0.36, h * 0.75);
    ctx.lineTo(w * 0.38, h * 0.5);
    ctx.closePath();
    ctx.fill();

    // Silky mist water (long exposure effect)
    const mistGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
    mistGrad.addColorStop(0, 'rgba(229, 231, 235, 0.85)');
    mistGrad.addColorStop(0.4, 'rgba(156, 163, 175, 0.7)');
    mistGrad.addColorStop(1, 'rgba(55, 65, 81, 0.9)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, h * 0.65, w, h * 0.35);

    // Wet sand foreground
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.88);
    ctx.bezierCurveTo(w * 0.3, h * 0.82, w * 0.7, h * 0.94, w, h * 0.86);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}

export function getDefaultPhotos(): PhotoItem[] {
  const landscapeUrl = createScenicPhotoUrl('landscape');
  const portraitUrl = createScenicPhotoUrl('portrait');
  const streetUrl = createScenicPhotoUrl('street');
  const seascapeUrl = createScenicPhotoUrl('seascape');

  return [
    {
      id: 'photo_nordic_fjord',
      name: 'DSC08492_Lofoten_Fjord.DNG',
      fileSize: 48234120,
      width: 1600,
      height: 1067,
      format: 'DNG',
      url: landscapeUrl,
      thumbnailUrl: landscapeUrl,
      rating: 5,
      flag: 'pick',
      exif: {
        camera: 'Sony Alpha 7 IV',
        lens: 'FE 24-70mm F2.8 GM II',
        iso: 100,
        aperture: 'f/8.0',
        shutter: '1/160s',
        focalLength: '35mm',
        dateTaken: '2026-09-18 17:42:10',
        colorSpace: 'ProPhoto RGB'
      },
      adjustments: {
        ...DEFAULT_ADJUSTMENTS,
        exposure: 0.15,
        contrast: 12,
        highlights: -18,
        shadows: 24,
        whites: 8,
        blacks: -12,
        temp: 5750,
        tint: 3,
        vibrance: 18,
        saturation: 4,
        vignette: { amount: -15, midpoint: 55, feather: 60 }
      },
      history: [
        {
          id: 'step_init_1',
          timestamp: Date.now() - 3600000,
          label: 'Original Import',
          adjustments: { ...DEFAULT_ADJUSTMENTS }
        },
        {
          id: 'step_tone_1',
          timestamp: Date.now() - 1800000,
          label: 'Fjord Sunset Grade',
          adjustments: {
            ...DEFAULT_ADJUSTMENTS,
            exposure: 0.15,
            contrast: 12,
            highlights: -18,
            shadows: 24,
            whites: 8,
            blacks: -12,
            temp: 5750,
            tint: 3,
            vibrance: 18,
            saturation: 4
          }
        }
      ],
      dateAdded: Date.now() - 86400000
    },
    {
      id: 'photo_golden_portrait',
      name: 'L1002341_Editorial_Portrait.RAW',
      fileSize: 62410200,
      width: 1600,
      height: 1067,
      format: 'RAW',
      url: portraitUrl,
      thumbnailUrl: portraitUrl,
      rating: 4,
      flag: 'pick',
      exif: {
        camera: 'Leica M11',
        lens: 'Noctilux-M 50mm f/0.95 ASPH',
        iso: 64,
        aperture: 'f/1.2',
        shutter: '1/2500s',
        focalLength: '50mm',
        dateTaken: '2026-08-24 19:15:02',
        colorSpace: 'Adobe RGB'
      },
      adjustments: {
        ...DEFAULT_ADJUSTMENTS,
        exposure: 0.25,
        contrast: -6,
        highlights: -14,
        shadows: 18,
        temp: 6100,
        tint: 8,
        vibrance: 14,
        saturation: -2,
        colorGrading: {
          shadows: { hue: 35, sat: 15, lum: 2 },
          midtones: { hue: 42, sat: 20, lum: 0 },
          highlights: { hue: 52, sat: 22, lum: 5 },
          blending: 60,
          balance: 8
        },
        vignette: { amount: -20, midpoint: 60, feather: 70 }
      },
      history: [
        {
          id: 'step_init_2',
          timestamp: Date.now() - 7200000,
          label: 'Original Import',
          adjustments: { ...DEFAULT_ADJUSTMENTS }
        }
      ],
      dateAdded: Date.now() - 172800000
    },
    {
      id: 'photo_tokyo_cyber',
      name: 'DSCF4901_Shinjuku_Rain.RAW',
      fileSize: 41200150,
      width: 1600,
      height: 1067,
      format: 'RAW',
      url: streetUrl,
      thumbnailUrl: streetUrl,
      rating: 5,
      flag: 'none',
      exif: {
        camera: 'Fujifilm X-T5',
        lens: 'XF 33mm F1.4 R LM WR',
        iso: 1600,
        aperture: 'f/1.4',
        shutter: '1/60s',
        focalLength: '33mm',
        dateTaken: '2026-10-02 21:04:40',
        colorSpace: 'sRGB'
      },
      adjustments: {
        ...DEFAULT_ADJUSTMENTS,
        exposure: 0.1,
        contrast: 22,
        highlights: -12,
        shadows: 10,
        whites: 14,
        blacks: -18,
        temp: 5400,
        tint: -6,
        vibrance: 25,
        saturation: 10,
        colorGrading: {
          shadows: { hue: 200, sat: 35, lum: -5 },
          midtones: { hue: 320, sat: 20, lum: 2 },
          highlights: { hue: 38, sat: 40, lum: 8 },
          blending: 50,
          balance: -10
        },
        vignette: { amount: -24, midpoint: 48, feather: 65 }
      },
      history: [
        {
          id: 'step_init_3',
          timestamp: Date.now() - 14400000,
          label: 'Original Import',
          adjustments: { ...DEFAULT_ADJUSTMENTS }
        }
      ],
      dateAdded: Date.now() - 259200000
    },
    {
      id: 'photo_pacific_mist',
      name: 'CR5_01928_Cannon_Beach_Seastack.TIFF',
      fileSize: 72900400,
      width: 1600,
      height: 1067,
      format: 'TIFF',
      url: seascapeUrl,
      thumbnailUrl: seascapeUrl,
      rating: 4,
      flag: 'pick',
      exif: {
        camera: 'Canon EOS R5',
        lens: 'RF 15-35mm F2.8 L IS USM',
        iso: 200,
        aperture: 'f/11',
        shutter: '1/4s',
        focalLength: '24mm',
        dateTaken: '2026-07-14 06:18:22',
        colorSpace: 'ProPhoto RGB'
      },
      adjustments: {
        ...DEFAULT_ADJUSTMENTS,
        exposure: 0.05,
        contrast: 16,
        highlights: -25,
        shadows: 20,
        whites: 6,
        blacks: -10,
        temp: 5200,
        tint: -2,
        vibrance: 8,
        saturation: -6,
        sharpness: 35,
        vignette: { amount: -18, midpoint: 52, feather: 55 }
      },
      history: [
        {
          id: 'step_init_4',
          timestamp: Date.now() - 21600000,
          label: 'Original Import',
          adjustments: { ...DEFAULT_ADJUSTMENTS }
        }
      ],
      dateAdded: Date.now() - 345600000
    }
  ];
}
