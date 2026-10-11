/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Preset } from '../types/darkroom';

export const BUILTIN_PRESETS: Preset[] = [
  {
    id: 'preset_classic_chrome',
    name: 'Classic Chrome',
    category: 'Film',
    description: 'Subtle documentary film palette with muted greens and rich contrast',
    adjustments: {
      contrast: 15,
      highlights: -12,
      shadows: 8,
      whites: 10,
      blacks: -14,
      temp: 5600,
      tint: 4,
      vibrance: -8,
      saturation: -12,
      colorGrading: {
        shadows: { hue: 205, sat: 18, lum: -5 },
        midtones: { hue: 38, sat: 12, lum: 0 },
        highlights: { hue: 42, sat: 15, lum: 4 },
        blending: 50,
        balance: -5
      },
      vignette: { amount: -15, midpoint: 55, feather: 60 }
    }
  },
  {
    id: 'preset_portra_400',
    name: 'Portra 400 Warmth',
    category: 'Film',
    description: 'Pastel highlight roll-off, flattering portrait tones, and creamy grain',
    adjustments: {
      exposure: 0.2,
      contrast: -8,
      highlights: -18,
      shadows: 22,
      whites: 6,
      blacks: 12,
      temp: 6150,
      tint: 6,
      vibrance: 14,
      saturation: -4,
      colorGrading: {
        shadows: { hue: 30, sat: 14, lum: 4 },
        midtones: { hue: 45, sat: 18, lum: 0 },
        highlights: { hue: 50, sat: 22, lum: 6 },
        blending: 65,
        balance: 10
      },
      vignette: { amount: -10, midpoint: 60, feather: 70 }
    }
  },
  {
    id: 'preset_moody_noir',
    name: 'Moody Noir',
    category: 'Monochrome',
    description: 'High dynamic black and white with deep crushed shadows and crisp silver whites',
    adjustments: {
      exposure: 0.1,
      contrast: 32,
      highlights: -24,
      shadows: -15,
      whites: 28,
      blacks: -35,
      temp: 5500,
      tint: 0,
      vibrance: -100,
      saturation: -100,
      sharpness: 45,
      vignette: { amount: -28, midpoint: 40, feather: 50 }
    }
  },
  {
    id: 'preset_teal_orange',
    name: 'Cinema Teal & Orange',
    category: 'Creative',
    description: 'Blockbuster color separation with deep cyan shadows and radiant warm highlights',
    adjustments: {
      contrast: 18,
      highlights: -10,
      shadows: 14,
      whites: 12,
      blacks: -8,
      temp: 5800,
      tint: -2,
      vibrance: 22,
      saturation: 8,
      colorGrading: {
        shadows: { hue: 198, sat: 48, lum: -8 },
        midtones: { hue: 28, sat: 25, lum: 2 },
        highlights: { hue: 36, sat: 52, lum: 12 },
        blending: 55,
        balance: -8
      },
      vignette: { amount: -22, midpoint: 45, feather: 65 }
    }
  },
  {
    id: 'preset_golden_hour',
    name: 'Golden Hour Glow',
    category: 'Landscape',
    description: 'Radiant amber sunset glow with lifted shadows and warm horizon hues',
    adjustments: {
      exposure: 0.35,
      contrast: 10,
      highlights: -25,
      shadows: 30,
      whites: 15,
      blacks: -4,
      temp: 6850,
      tint: 12,
      vibrance: 28,
      saturation: 6,
      colorGrading: {
        shadows: { hue: 34, sat: 30, lum: 5 },
        midtones: { hue: 42, sat: 35, lum: 4 },
        highlights: { hue: 48, sat: 40, lum: 15 },
        blending: 60,
        balance: 15
      },
      vignette: { amount: -18, midpoint: 50, feather: 60 }
    }
  },
  {
    id: 'preset_clean_digital',
    name: 'Clean Digital Studio',
    category: 'Creative',
    description: 'Neutral color-calibrated baseline for commercial product and studio photography',
    adjustments: {
      exposure: 0.0,
      contrast: 0,
      highlights: 0,
      shadows: 0,
      whites: 0,
      blacks: 0,
      temp: 5500,
      tint: 0,
      vibrance: 0,
      saturation: 0,
      colorGrading: {
        shadows: { hue: 0, sat: 0, lum: 0 },
        midtones: { hue: 0, sat: 0, lum: 0 },
        highlights: { hue: 0, sat: 0, lum: 0 },
        blending: 50,
        balance: 0
      },
      vignette: { amount: 0, midpoint: 50, feather: 50 }
    }
  }
];
