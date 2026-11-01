import { describe, expect, it } from 'vitest';
import { classifyFaceGeometry } from '../lib/faceScanner';
import { solveSimilarityTransform } from '../lib/biometricFaceLock';
import {
  HAIRCUT_PRESETS,
  compileHaircutPrompt,
  computeSuitabilityScore,
} from '../lib/haircutCatalog';
import { parseBarberAgentJson } from '../lib/hairEngine';

describe('CutLab 3D Face Geometry Classifier', () => {
  it('classifies Square, Round, Oblong, Heart, Diamond, and Oval structures accurately', () => {
    expect(
      classifyFaceGeometry({
        lengthToWidthRatio: 1.31,
        jawToCheekRatio: 0.9,
        foreheadToCheekRatio: 0.88,
      }).shape
    ).toBe('square');

    expect(
      classifyFaceGeometry({
        lengthToWidthRatio: 1.18,
        jawToCheekRatio: 0.8,
        foreheadToCheekRatio: 0.84,
      }).shape
    ).toBe('round');

    expect(
      classifyFaceGeometry({
        lengthToWidthRatio: 1.54,
        jawToCheekRatio: 0.82,
        foreheadToCheekRatio: 0.85,
      }).shape
    ).toBe('oblong');

    expect(
      classifyFaceGeometry({
        lengthToWidthRatio: 1.33,
        jawToCheekRatio: 0.74,
        foreheadToCheekRatio: 0.93,
      }).shape
    ).toBe('heart');

    expect(
      classifyFaceGeometry({
        lengthToWidthRatio: 1.35,
        jawToCheekRatio: 0.77,
        foreheadToCheekRatio: 0.8,
      }).shape
    ).toBe('diamond');

    expect(
      classifyFaceGeometry({
        lengthToWidthRatio: 1.35,
        jawToCheekRatio: 0.83,
        foreheadToCheekRatio: 0.87,
      }).shape
    ).toBe('oval');
  });
});

describe('Biometric 478-Landmark Procrustes FaceLock Solver', () => {
  it('recovers exact sub-pixel scale, rotation, and translation to align generated hair onto user face', () => {
    const dst = [
      { x: 430, y: 360 },
      { x: 594, y: 360 },
      { x: 512, y: 445 },
      { x: 512, y: 585 },
    ];
    // Simulate AI model shifting head 38px left, 24px up, and scaling 1.06x
    const src = dst.map(p => ({
      x: (p.x - 38) / 1.06,
      y: (p.y - 24) / 1.06,
    }));

    const tf = solveSimilarityTransform(src, dst);
    expect(tf.scale).toBeCloseTo(1.06, 4);

    for (let i = 0; i < src.length; i++) {
      const mappedX = tf.a * src[i].x - tf.b * src[i].y + tf.tx;
      const mappedY = tf.b * src[i].x + tf.a * src[i].y + tf.ty;
      expect(mappedX).toBeCloseTo(dst[i].x, 4);
      expect(mappedY).toBeCloseTo(dst[i].y, 4);
    }
  });
});

describe('Men’s Barbershop Catalog & Crisp Prompt Compiler', () => {
  it('contains 16 complete barbershop presets with guard specifications', () => {
    expect(HAIRCUT_PRESETS.length).toBe(16);
    for (const preset of HAIRCUT_PRESETS) {
      expect(preset.barberSpecs.sides.length).toBeGreaterThan(3);
      expect(preset.barberSpecs.top.length).toBeGreaterThan(3);
    }
  });

  it('scores ideal cuts higher than experimental cuts for a given face shape', () => {
    const buzz = HAIRCUT_PRESETS.find(p => p.id === 'buzz-cut-mid-skin-fade')!;
    const squareScore = computeSuitabilityScore(buzz, 'square');
    const roundScore = computeSuitabilityScore(buzz, 'round');

    expect(squareScore.score).toBeGreaterThanOrEqual(93);
    expect(squareScore.score).toBeGreaterThan(roundScore.score);
  });

  it('compiles crisp imperative haircut prompts and tracks preserveBeard accurately', () => {
    const preset = HAIRCUT_PRESETS[0];
    const defaultBeard = compileHaircutPrompt({
      preset,
      fade: 'preset_default',
      beard: 'keep_current',
      color: 'natural',
    });
    expect(defaultBeard.preserveBeard).toBe(true);

    const modified = compileHaircutPrompt({
      preset,
      fade: 'burst_fade',
      beard: 'light_stubble',
      color: 'platinum_blonde',
    });
    expect(modified.preserveBeard).toBe(false);
    expect(modified.prompt).toContain("Change this man's hair to");
    expect(modified.prompt).toContain('burst fade');
    expect(modified.prompt).toContain('3mm shadow stubble');
    expect(modified.prompt).toContain('platinum-blonde');
  });
});

describe('Marco AI Barber JSON Parser', () => {
  it('extracts structured barber specs, changeBeard flag, and generation triggers', () => {
    const raw = `\`\`\`json
    {
      "reply": "With your square jawline, a French crop with a mid drop fade will look razor-sharp.",
      "shouldGenerate": true,
      "changeBeard": false,
      "cutTitle": "French Crop + Mid Drop Fade",
      "barberSpecs": {
        "sides": "#0 to #1.5 Mid Drop Fade",
        "top": "4.5cm choppy textured crop",
        "beard": "Keep current",
        "product": "Matte styling clay"
      },
      "imagePrompt": "Change this man's hair to a short textured French crop with a mid skin drop fade. Keep his exact face, head position, and background unchanged."
    }
    \`\`\``;

    const parsed = parseBarberAgentJson(raw);
    expect(parsed.shouldGenerate).toBe(true);
    expect(parsed.changeBeard).toBe(false);
    expect(parsed.cutTitle).toBe('French Crop + Mid Drop Fade');
    expect(parsed.barberSpecs.sides).toContain('Drop Fade');
  });
});
