export type FaceShape =
  | 'oval'
  | 'square'
  | 'diamond'
  | 'round'
  | 'heart'
  | 'oblong';

export type Point2D = { x: number; y: number };

export type FaceAnalysis = {
  shape: FaceShape;
  label: string;
  confidence: number;
  lengthToWidthRatio: number;
  jawToCheekRatio: number;
  foreheadToCheekRatio: number;
  upperThirdPct: number;
  middleThirdPct: number;
  lowerThirdPct: number;
  jawDefinition: 'Sharp & Angular' | 'Balanced' | 'Soft & Rounded';
  barberSummary: string;
  avoidNote: string;
  landmarks2D: Point2D[];
  contourIndices: number[];
};

export type HaircutCategory =
  | 'all'
  | 'fades'
  | 'textured'
  | 'curls_flow'
  | 'short_classic';

export type FadeOption =
  | 'preset_default'
  | 'low_taper'
  | 'mid_fade'
  | 'high_skin_fade'
  | 'drop_fade'
  | 'burst_fade';

export type BeardOption =
  | 'keep_current'
  | 'clean_shaven'
  | 'light_stubble'
  | 'sharp_boxed_beard'
  | 'goatee_mustache';

export type HairColorOption =
  | 'natural'
  | 'jet_black'
  | 'espresso_brown'
  | 'platinum_blonde'
  | 'ash_silver'
  | 'copper_auburn';

export type BarberSpecs = {
  sides: string;
  top: string;
  beard: string;
  product: string;
};

export type HaircutPreset = {
  id: string;
  name: string;
  tagline: string;
  category: Exclude<HaircutCategory, 'all'>;
  maintenance: 'Low' | 'Medium' | 'Styled';
  idealFaceShapes: FaceShape[];
  goodFaceShapes: FaceShape[];
  barberSpecs: BarberSpecs;
  promptCore: string;
};

export type GeneratedLook = {
  id: string;
  title: string;
  imageUrl: string;
  sourceImageUrl: string;
  createdAt: string;
  presetId: string | null;
  barberSpecs: BarberSpecs;
  isFavorite: boolean;
  matchScore: number | null;
  promptUsed: string;
  engineUsed: string;
};

export type BarberChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedPresetIds?: string[];
  triggeredLookId?: string;
  createdAt: string;
};
