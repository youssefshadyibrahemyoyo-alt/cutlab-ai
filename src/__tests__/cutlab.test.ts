import { describe, expect, it } from 'vitest';
import { classifyFaceGeometry } from '../lib/faceScanner';
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

describe('Men’s Barbershop Catalog & Prompt Compiler', () => {
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

  it('compiles identity-preserving prompts with fade, beard, and hair color modifiers', () => {
    const preset = HAIRCUT_PRESETS[0];
    const compiled = compileHaircutPrompt({
      preset,
      fade: 'burst_fade',
      beard: 'light_stubble',
      color: 'platinum_blonde',
    });

    expect(compiled.prompt).toContain('keeping his exact facial features');
    expect(compiled.prompt).toContain('burst fade');
    expect(compiled.prompt).toContain('3mm designer shadow stubble');
    expect(compiled.prompt).toContain('platinum-blonde');
    expect(compiled.specs.sides).toBe('Burst Fade');
    expect(compiled.specs.beard).toBe('3mm Stubble');
  });
});

describe('Marco AI Barber JSON Parser', () => {
  it('extracts structured barber specs and generation triggers even when wrapped in markdown fences', () => {
    const raw = `\`\`\`json
    {
      "reply": "With your square jawline, a French crop with a mid drop fade will look razor-sharp.",
      "shouldGenerate": true,
      "cutTitle": "French Crop + Mid Drop Fade",
      "barberSpecs": {
        "sides": "#0 to #1.5 Mid Drop Fade",
        "top": "4.5cm choppy textured crop",
        "beard": "3mm faded stubble",
        "product": "Matte styling clay"
      },
      "imagePrompt": "Change ONLY this man's hairstyle to a French crop with mid drop fade while keeping his face identical."
    }
    \`\`\``;

    const parsed = parseBarberAgentJson(raw);
    expect(parsed.shouldGenerate).toBe(true);
    expect(parsed.cutTitle).toBe('French Crop + Mid Drop Fade');
    expect(parsed.barberSpecs.sides).toContain('Drop Fade');
  });
});
