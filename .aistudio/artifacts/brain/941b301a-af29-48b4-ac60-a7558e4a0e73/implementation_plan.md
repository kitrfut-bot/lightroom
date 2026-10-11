# Lumina Darkroom — Non-Destructive RAW & Photo Studio

Lumina Darkroom is a pro-tier, privacy-first, non-destructive photo catalog and editing application designed in the spirit of Adobe Lightroom and darkroom software. It executes a GPU-accelerated WebGL/WebAssembly image processing pipeline entirely inside the client sandbox, providing instant live feedback, 16-bit processing precision, raw format support (DNG, TIFF, high-res JPEG, and camera RAW preview pipelines), parametric adjustment trees, local masking (brush, linear, and radial gradients), 3-way color grading, tone curves, and desktop PWA installability across macOS, Windows, and Linux.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and user experience specifications have been confirmed based on user feedback and will govern the development:

- **Confirmed Architecture & Platform**: High-performance WebGL and WebAssembly pipeline running locally in the browser and as an installable standalone desktop PWA (macOS, Windows, Linux) with 100% private, on-device processing.
- **Confirmed Formats**: DNG (Digital Negative), TIFF, JPEG, and common camera RAW formats (using embedded high-res preview and linear DNG decoding pipelines).
- **Confirmed Interface**: Classic darkroom dual-mode layout featuring a **Library** mode (grid catalog, collection filtering, star ratings, pick/reject flags, EXIF inspector) and a **Develop** mode (cinematic darkroom canvas, live RGB histogram, collapsible tool inspector, tone curves, color grading wheels, local masks, and before/after views).
- **Zero Cloud / Zero Telemetry Privacy**: All file data remains strictly within local memory and client IndexedDB; no images or telemetry leave the user's machine.

---

### 1. Overview & Core Concept

- **What It Does**: Lumina Darkroom provides professional photographers and enthusiasts with a high-speed, non-destructive darkroom workflow. Users import photo collections from disk, organize and flag shots in a high-density Library grid, and jump into the Develop module to manipulate RAW sensor exposures, white balance, tone curves, 3-way color wheels, and localized brush/gradient masks with real-time 60fps GPU preview rendering.
- **Target Audience & Persona**: Professional photographers, content creators, and hobbyists who demand Lightroom-level color science and local privacy without subscription locks, heavy cloud sync overhead, or privacy concerns.
- **Key Value**: Instantaneous live adjustments via GLSL fragment shaders, non-destructive parametric sidecar storage (the original image bytes are immutable), responsive masking tools, and high-fidelity export to JPEG, PNG, and TIFF.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Import & Cataloging (Library Mode)**:
   - User drags and drops RAW/DNG/TIFF/JPEG files or selects a sample photography batch.
   - Files are parsed, EXIF metadata extracted (Camera, Lens, ISO, Aperture, Shutter Speed, Focal Length), and thumbnails generated.
   - User navigates the grid using keyboard arrows, applies Star Ratings (1–5), Pick (`P`) / Reject (`X`) flags, and filters by rating or search tags.
2. **Develop Module & Canvas**:
   - Double-clicking an image or clicking the "Develop" tab transitions to the darkroom studio.
   - Canvas supports smooth zoom (Fit, Fill, 100%, 200%), interactive panning, and split-screen before/after comparison (`\` or `Y` key).
   - Live interactive RGB & Luminance histogram displays clipping warnings for highlight burn-out (red) and shadow crush (blue).
3. **Parametric Adjustments**:
   - **Basic Tone**: Exposure (-5.0 to +5.0 EV), Contrast, Highlights, Shadows, Whites, Blacks.
   - **Color & White Balance**: Temperature (Kelvin 2000K–10000K), Tint (-100 to +100), Eyedropper neutral picker, Vibrance, Saturation.
   - **Tone Curves**: Interactive spline curve editor with 4 tone zones (Highlights, Lights, Darks, Shadows) and RGB/Red/Green/Blue point curve handles.
   - **3-Way Color Grading**: Dedicated color wheels for Shadows, Midtones, and Highlights with Hue, Saturation, Luminance sliders, and Blending/Balance controls.
   - **Detail & Optics**: Sharpness, Luminance Noise Reduction, Vignette amount, midpoint, and feather.
4. **Local Masking Engine**:
   - User creates targeted adjustment layers: **Brush Mask** (size, feather, flow), **Linear Gradient**, or **Radial Gradient**.
   - Mask overlay displays red ruby tint (`O` toggle) with real-time feathering.
   - Dedicated local sliders: Exposure, Contrast, Saturation, Clarity, and Temperature applied strictly within the mask region.
5. **Presets & History**:
   - One-click darkroom presets (Classic Chrome, Portra 400 Warmth, Moody Monochrome, Cine Teal & Orange, Golden Hour, Clean Digital).
   - User can save custom presets and export/import them as JSON.
   - Step-by-step History undo/redo stack recording every slider interaction non-destructively.
6. **Export**:
   - High-resolution rendering to JPEG (with quality slider), PNG, or TIFF, plus export of XMP-compatible adjustment JSON sidecars.

#### Visual Identity & Theme
- **Aesthetic Direction**: Professional utilitarian darkroom aesthetic inspired by classic darkrooms and precision optical instruments. Deep neutral charcoal backdrop (`#121316` / `#1a1b1f`) providing neutral luminance context for accurate color grading.
- **Color Palette & Discipline**:
  - Canvas & Neutral Field: `#0e0f12` (pure neutral background)
  - Panel Surfaces: `#18191e` (structural cards and sidebars), `#22242b` (control tracks)
  - Text: `#f4f4f6` (primary labels), `#9ca3af` (secondary metadata)
  - Focal Accents: `#3b82f6` (electric cobalt active indicator), `#ef4444` (ruby mask overlay), `#10b981` (pick flag)
- **Typography & Hierarchy**:
  - Display & Headings: `Plus Jakarta Sans` for clean, contemporary interface headers.
  - Controls & Numbers: `JetBrains Mono` / `tabular-nums` for precise EV, Kelvin, and percentage values.
  - Zero-Pill Discipline: Metadata (ISO 400 · 35mm · f/1.8 · 1/500s) presented as unboxed text with subtle typographic separators (`·`).
- **Interactive Feedback & Motion**:
  - Snappy slider feedback with 60fps GPU shader updates.
  - Smooth Loupe zoom and split-slider wipe handle.
  - Discrete keyboard shortcuts (Library: `G`, Develop: `D`, Before/After: `\`, Mask Overlay: `O`, Reset: `Cmd+R`).

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: WebGL GLSL Shader Pipeline vs 2D Canvas Context**:
  - *Chosen Approach*: Multi-pass WebGL shader pipeline processing 32-bit floating point color textures.
  - *Why*: Allows real-time live manipulation of exposure, tone curves, and 3-way color grading at 60fps even with 4K+ images without stutter. Canvas2D pixel iteration is far too slow for real-time slider scrubbing.
  - *Fallback*: Clean 2D canvas fallback if WebGL is unavailable.
- **Decision 2: Non-Destructive Parametric State Model**:
  - *Chosen Approach*: The original image pixels are never overwritten. All slider states, curve knots, and mask vector definitions exist as a pure JSON state object.
  - *Why*: True darkroom principle. Enables infinite undo/redo, sidecar saving, instant preset application, and A/B before/after rendering from source.
- **Decision 3: PWA & Local Storage Strategy**:
  - *Chosen Approach*: IndexedDB stores image blobs and parametric adjustments locally with `vite-plugin-pwa` configuration for desktop installation.
  - *Why*: Fast loading, full offline readiness, total privacy, and desktop-class window management on macOS, Windows, and Linux.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LUMINA DARKROOM UI                              │
├──────────────────────────────────┬─────────────────────────────────────┤
│        TOP BAR (NAV & MODE)      │ Library (G) | Develop (D) | Export  │
├─────────────────┬────────────────┴──────────────────┬──────────────────┤
│ LEFT PANEL      │             CENTER VIEWPORT       │ RIGHT INSPECTOR  │
│ - Collections   │  [LIBRARY MODE]                   │ - Histogram      │
│ - Presets       │  - Masonry / Grid photo catalog   │ - Basic Tone     │
│ - History Stack │  - Badges (Rating, Pick, Edit)    │ - Curves         │
│ - Sample Photos │  [DEVELOP MODE]                   │ - Color Grading  │
│                 │  - Hardware-accelerated Canvas    │ - Detail/Optics  │
│                 │  - Before/After Split Slider      │ - Masking Layers │
│                 │  - Loupe Pan & Zoom (25%-400%)    │ - EXIF Data      │
├─────────────────┴───────────────────────────────────┴──────────────────┤
│ BOTTOM FILMSTRIP (Quick photo switching, ratings, star quick-filters) │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   IMAGE PROCESSING ENGINE (WebGL / GLSL)               │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Texture Loader (Raw/DNG/TIFF/JPEG decode -> WebGL RGBA Texture)     │
│ 2. Color Balance & EV Shader (Exposure, White Balance, Tint)           │
│ 3. Tone Mapping & Zone Shader (Contrast, Highlights, Shadows, Whites)  │
│ 4. Spline Curve Texture & Lookup (RGB + Point Curves)                  │
│ 5. 3-Way Color Grading Shader (Shadows / Midtones / Highlights)        │
│ 6. Local Mask Compositor (Brush Stencil, Linear/Radial Gradients)      │
│ 7. Detail & Post (Sharpness, Vignette, Noise)                          │
│ 8. Real-time Histogram Generator (Compute luminance & RGB bin counts)  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Data Model & Parametric State
```typescript
interface PhotoItem {
  id: string;
  name: string;
  fileSize: number;
  width: number;
  height: number;
  format: 'DNG' | 'RAW' | 'TIFF' | 'JPEG' | 'PNG';
  url: string;              // Object URL or Blob
  thumbnailUrl: string;     // Fast cached preview
  rating: number;           // 0 to 5 stars
  flag: 'none' | 'pick' | 'reject';
  exif: {
    camera?: string;
    lens?: string;
    iso?: number;
    aperture?: string;
    shutter?: string;
    focalLength?: string;
    dateTaken?: string;
  };
  adjustments: PhotoAdjustments;
  history: AdjustmentHistoryStep[];
}

interface PhotoAdjustments {
  // Basic
  exposure: number;       // -5.0 to +5.0 EV
  contrast: number;       // -100 to +100
  highlights: number;     // -100 to +100
  shadows: number;        // -100 to +100
  whites: number;         // -100 to +100
  blacks: number;         // -100 to +100
  // Color
  temp: number;           // 2000 to 10000 Kelvin
  tint: number;           // -100 to +100
  vibrance: number;       // -100 to +100
  saturation: number;     // -100 to +100
  // Curves
  toneCurve: CurveChannel;
  // Color Grading
  colorGrading: {
    shadows: { hue: number; sat: number; lum: number };
    midtones: { hue: number; sat: number; lum: number };
    highlights: { hue: number; sat: number; lum: number };
    blending: number;
    balance: number;
  };
  // Detail
  sharpness: number;
  noiseReduction: number;
  vignette: number;
  // Local Masks
  masks: LocalMask[];
}
```

#### Step-by-Step Implementation Sequence
1. **PWA & Environment Scaffolding**: Configure Web App Manifest, offline worker, and desktop standalone metadata.
2. **WebGL Shaders & Image Engine**: Implement the multi-pass GLSL processing pipeline (Exposure, Tone mapping, Curves LUT, 3-way color wheels, Vignette, and dynamic Masking).
3. **Histogram Engine**: GPU/Worker calculation generating live red/green/blue/luminance histograms with clipping flags.
4. **Library Module**: Grid catalog, import dropzone, sample photo library (architectural, portrait, golden hour, moody landscape), star ratings, flags, and search.
5. **Develop Studio Module**: Interactive canvas with pan/zoom, split-screen wipe handle, before/after toggle, and Loupe view.
6. **Adjustment Panels & Controls**: Precision sliders, interactive spline tone curve SVG, 3-way color grading wheels, eyedropper neutral picker, and preset library.
7. **Local Masking Tools**: Interactive canvas brush, linear gradient vector, radial gradient ellipse with ruby overlay and localized sliders.
8. **Export & Sidecar Engine**: Full-resolution export to JPEG/PNG/TIFF and XMP JSON sidecar download.
