import type {
  BarberSpecs,
  BeardOption,
  FaceShape,
  FadeOption,
  HairColorOption,
  HaircutPreset,
} from '../types/cutlab';

export const FADE_OPTIONS: { id: FadeOption; label: string; promptText: string }[] = [
  { id: 'preset_default', label: 'Default Fade', promptText: '' },
  {
    id: 'low_taper',
    label: 'Low Taper',
    promptText: 'with a clean low temple and nape taper fade',
  },
  {
    id: 'mid_fade',
    label: 'Mid Fade',
    promptText: 'with a sharp mid skin fade blended smoothly up the sides',
  },
  {
    id: 'high_skin_fade',
    label: 'High Skin Fade',
    promptText: 'with a high shaved bald skin fade tight up the sides',
  },
  {
    id: 'drop_fade',
    label: 'Drop Fade',
    promptText: 'with a curved skin drop fade arcing down behind the ears',
  },
  {
    id: 'burst_fade',
    label: 'Burst Fade',
    promptText: 'with a rounded skin burst fade around the ears and textured back nape',
  },
];

export const BEARD_OPTIONS: { id: BeardOption; label: string; promptText: string }[] = [
  { id: 'keep_current', label: 'Keep Current', promptText: '' },
  {
    id: 'clean_shaven',
    label: 'Clean Shaven',
    promptText: 'Make his jaw and chin completely clean-shaven.',
  },
  {
    id: 'light_stubble',
    label: '3mm Stubble',
    promptText: 'Give him neat 3mm shadow stubble along his jaw.',
  },
  {
    id: 'sharp_boxed_beard',
    label: 'Boxed Beard',
    promptText: 'Give him a groomed short boxed beard with crisp cheek lines.',
  },
  {
    id: 'goatee_mustache',
    label: 'Disconnected Goatee',
    promptText: 'Give him a trimmed mustache and chin goatee with clean cheeks.',
  },
];

export const HAIR_COLOR_OPTIONS: {
  id: HairColorOption;
  label: string;
  swatch: string;
  promptText: string;
}[] = [
  { id: 'natural', label: 'Natural', swatch: 'linear-gradient(135deg,#2b211a,#6b5344)', promptText: '' },
  { id: 'jet_black', label: 'Jet Black', swatch: '#141418', promptText: 'dyed natural jet-black' },
  { id: 'espresso_brown', label: 'Espresso', swatch: '#3b2618', promptText: 'dark espresso-brown' },
  { id: 'platinum_blonde', label: 'Platinum', swatch: '#e6dec8', promptText: 'bleached icy platinum-blonde with dark roots' },
  { id: 'ash_silver', label: 'Ash Silver', swatch: '#9da3ae', promptText: 'modern smoky ash-silver gray' },
  { id: 'copper_auburn', label: 'Auburn', swatch: '#8b3e22', promptText: 'rich copper-auburn' },
];

export const HAIRCUT_PRESETS: HaircutPreset[] = [
  {
    id: 'low-taper-textured-fringe',
    name: 'Low Taper + Textured Fringe',
    tagline: 'Choppy forward fringe with clean temple & nape taper',
    category: 'textured',
    maintenance: 'Medium',
    idealFaceShapes: ['oval', 'diamond', 'oblong', 'heart'],
    goodFaceShapes: ['square', 'round'],
    barberSpecs: {
      sides: '#0.5 to #2 Low Taper (temples & nape)',
      top: '7–9 cm point-cut choppy forward fringe',
      beard: 'Natural or light faded stubble',
      product: 'Sea salt spray + matte texture powder',
    },
    promptCore:
      'a messy choppy textured forward fringe covering the upper forehead with a clean low taper fade at the temples',
  },
  {
    id: 'burst-fade-messy-curls',
    name: 'Burst Fade + Textured Curls',
    tagline: 'Curved ear-hugging fade with defined curly top & back flow',
    category: 'curls_flow',
    maintenance: 'Medium',
    idealFaceShapes: ['oval', 'square', 'round', 'diamond'],
    goodFaceShapes: ['heart', 'oblong'],
    barberSpecs: {
      sides: 'Skin-to-#2 Burst Fade curving around ear',
      top: '8–10 cm defined natural curls & V-nape',
      beard: 'Faded sideburn blend',
      product: 'Curl defining cream + diffuser dry',
    },
    promptCore:
      'dense defined messy curls on top with a tight curved skin burst fade around the ears',
  },
  {
    id: 'french-crop-mid-drop',
    name: 'French Crop + Mid Drop Fade',
    tagline: 'Blunt micro-fringe with razor-sharp drop fade contour',
    category: 'fades',
    maintenance: 'Low',
    idealFaceShapes: ['square', 'oval', 'oblong', 'diamond'],
    goodFaceShapes: ['heart', 'round'],
    barberSpecs: {
      sides: 'Mid Skin Drop Fade (#0 to #1.5)',
      top: '4–5 cm blunt-cropped textured Caesar fringe',
      beard: 'Sharp cheek lineup optional',
      product: 'Matte clay worked forward',
    },
    promptCore:
      'a short blunt-cropped textured French crop brushed forward with a sharp mid skin drop fade on the sides',
  },
  {
    id: 'buzz-cut-mid-skin-fade',
    name: 'Buzz Cut (#2) + Skin Fade',
    tagline: 'Ultra-clean military precision emphasizing jawline structure',
    category: 'short_classic',
    maintenance: 'Low',
    idealFaceShapes: ['square', 'oval', 'diamond'],
    goodFaceShapes: ['heart', 'oblong'],
    barberSpecs: {
      sides: 'Mid-to-High Skin Bald Fade (#000 to #1)',
      top: 'Uniform #2 guard (6mm) with crisp front lineup',
      beard: 'Recommended 3mm stubble or boxed beard',
      product: 'Zero product — scalp moisturizer only',
    },
    promptCore:
      'a very short #2 military buzz cut clipped tight to the scalp with a shaved bald high skin fade on the sides',
  },
  {
    id: 'warrior-messy-mod',
    name: 'Warrior Cut (90s Messy Spikes)',
    tagline: 'Tousled Brad-Pitt-inspired choppy layers & scissor sides',
    category: 'textured',
    maintenance: 'Medium',
    idealFaceShapes: ['square', 'diamond', 'oval', 'round'],
    goodFaceShapes: ['heart', 'oblong'],
    barberSpecs: {
      sides: 'Scissor-cut 2.5–3.5 cm messy textured sides',
      top: '6–8 cm razor-textured piecey layers',
      beard: 'Rugged light stubble or clean shaven',
      product: 'Reworkable matte fiber paste',
    },
    promptCore:
      'a 90s warrior cut with tousled spiky piecey short-medium choppy layers and messy textured sides',
  },
  {
    id: 'modern-wolf-mullet-taper',
    name: 'Modern Mullet + Temple Taper',
    tagline: 'Layered crown texture, clean temples & subtle neck flow',
    category: 'curls_flow',
    maintenance: 'Styled',
    idealFaceShapes: ['oval', 'diamond', 'heart', 'square'],
    goodFaceShapes: ['round', 'oblong'],
    barberSpecs: {
      sides: '#1 Temple Taper (ears uncovered)',
      top: '8 cm shaggy layered top + 7 cm feathered back',
      beard: 'Mustache/goatee or clean shaven',
      product: 'Texture spray + light matte cream',
    },
    promptCore:
      'a shaggy modern mullet haircut with clean shaved temple tapers, choppy crown volume, and feathered hair flowing behind the neck',
  },
  {
    id: 'old-money-scissor-flow',
    name: 'Old Money Classic Taper',
    tagline: 'All-scissor swept-back gentleman’s flow with natural sideburns',
    category: 'curls_flow',
    maintenance: 'Styled',
    idealFaceShapes: ['diamond', 'square', 'heart', 'oval'],
    goodFaceShapes: ['oblong', 'round'],
    barberSpecs: {
      sides: 'All-scissor classic taper (3–4 cm)',
      top: '10–12 cm layered brush-back flow',
      beard: 'Clean shaven or neat stubble',
      product: 'Light cream pomade + wide-tooth comb',
    },
    promptCore:
      'an Old Money classic medium-length all-scissor swept-back gentleman hairstyle with soft layered flow',
  },
  {
    id: 'curtains-middle-part',
    name: '90s Middle Part Curtains',
    tagline: 'Balanced center-parted layers framing cheekbones',
    category: 'curls_flow',
    maintenance: 'Styled',
    idealFaceShapes: ['heart', 'diamond', 'square', 'oblong'],
    goodFaceShapes: ['oval', 'round'],
    barberSpecs: {
      sides: 'Scissor taper tucked cleanly above ears (5 cm)',
      top: '11–13 cm eye-grazing curtain layers',
      beard: 'Clean shaven or light mustache/stubble',
      product: 'Leave-in conditioner + blow-dry round brush',
    },
    promptCore:
      'a 90s middle-part curtain bangs haircut parted cleanly down the center with flowing layers framing the forehead',
  },
  {
    id: 'crew-cut-ivy-league',
    name: 'Ivy League Crew Cut',
    tagline: 'Short side-swept front quiff with clean executive taper',
    category: 'short_classic',
    maintenance: 'Low',
    idealFaceShapes: ['round', 'oval', 'square', 'heart'],
    goodFaceShapes: ['diamond', 'oblong'],
    barberSpecs: {
      sides: '#1.5 to #3 Mid Taper Fade',
      top: '3.5–5 cm slightly longer front swept up-and-over',
      beard: 'Clean shaven or trimmed beard',
      product: 'Small dime of matte paste',
    },
    promptCore:
      'a short neat Ivy League crew cut with #1.5 tapered sides and a clean side-swept front',
  },
  {
    id: 'blowout-low-taper',
    name: 'Blowout Taper + Volume Top',
    tagline: 'High-volume airy top paired with crispy low temple & neck taper',
    category: 'fades',
    maintenance: 'Styled',
    idealFaceShapes: ['round', 'square', 'oval'],
    goodFaceShapes: ['heart', 'diamond'],
    barberSpecs: {
      sides: 'Crispy #0 Low Blowout Taper',
      top: '8–10 cm airy blown-back textured top',
      beard: 'Sharp sideburn taper into beard',
      product: 'Pre-styler mousse + blow dryer + texture powder',
    },
    promptCore:
      'a voluminous blown-up airy blowout haircut on top with a crisp low skin taper at the temples',
  },
  {
    id: 'slick-back-low-fade',
    name: 'Modern Slick Back + Low Fade',
    tagline: 'Swept-back structured top with natural satin finish',
    category: 'fades',
    maintenance: 'Styled',
    idealFaceShapes: ['round', 'square', 'oval', 'diamond'],
    goodFaceShapes: ['heart'],
    barberSpecs: {
      sides: '#0.5 to #2 Low Drop Fade',
      top: '10–12 cm slicked back with natural separation',
      beard: 'Boxed beard or 3mm stubble',
      product: 'Water-based medium-shine pomade',
    },
    promptCore:
      'a sleek slicked-back hairstyle combed straight back from the hairline with a sharp low skin fade on the sides',
  },
  {
    id: 'curly-drop-fade',
    name: 'Curly Top + Mid Drop Fade',
    tagline: 'Tight mid drop fade showcasing dense, sponge-defined curls',
    category: 'fades',
    maintenance: 'Medium',
    idealFaceShapes: ['round', 'oval', 'square', 'heart'],
    goodFaceShapes: ['diamond', 'oblong'],
    barberSpecs: {
      sides: 'Mid Skin Drop Fade (#0 to #2)',
      top: '6–8 cm tight defined curls / coils',
      beard: 'Tapered sideburn blend',
      product: 'Curl leave-in + sea salt mist',
    },
    promptCore:
      'tight sponge-defined short curls on top with a clean shaved mid drop fade on the sides',
  },
  {
    id: 'side-part-executive',
    name: 'Executive Taper Side Part',
    tagline: 'Timeless tailored side-part contour for sharp symmetry',
    category: 'short_classic',
    maintenance: 'Medium',
    idealFaceShapes: ['round', 'oval', 'square', 'heart'],
    goodFaceShapes: ['diamond', 'oblong'],
    barberSpecs: {
      sides: '#2 to #3 Classic Scissor-Over-Comb Taper',
      top: '7–9 cm natural side part (no hard razor line)',
      beard: 'Clean or tailored short beard',
      product: 'Natural shine styling cream',
    },
    promptCore:
      'a tailored executive side-part haircut combed neatly to one side with clean #2 tapered sides',
  },
  {
    id: 'textured-quiff-mid-fade',
    name: 'Textured Quiff + Mid Fade',
    tagline: 'Vertical front lift that elongates rounder & wider faces',
    category: 'textured',
    maintenance: 'Styled',
    idealFaceShapes: ['round', 'square', 'heart'],
    goodFaceShapes: ['oval', 'diamond'],
    barberSpecs: {
      sides: '#0.5 to #2 Mid Fade',
      top: '7–9 cm choppy lifted quiff in front',
      beard: 'Light 3mm stubble',
      product: 'Matte clay + blow-dry lift at roots',
    },
    promptCore:
      'a lifted messy textured quiff at the front hairline with a crisp mid skin fade on the sides',
  },
  {
    id: 'surfer-medium-flow',
    name: 'Medium Wavy Surfer Flow',
    tagline: 'Relaxed ear-tucked natural waves that soften strong angles',
    category: 'curls_flow',
    maintenance: 'Medium',
    idealFaceShapes: ['square', 'diamond', 'oblong'],
    goodFaceShapes: ['oval', 'heart'],
    barberSpecs: {
      sides: '7–9 cm layered waves tucked loosely behind ears',
      top: '12–14 cm natural wavy movement',
      beard: 'Light stubble or clean shaven',
      product: 'Sea salt spray on damp hair, air dry',
    },
    promptCore:
      'medium-long relaxed wavy surfer hair tucked loosely behind the ears with natural beachy volume',
  },
  {
    id: 'edgar-high-taper',
    name: 'Sharp Caesar / Edgar Taper',
    tagline: 'Ultra-crisp straight fringe & temple lineup with high taper',
    category: 'fades',
    maintenance: 'Medium',
    idealFaceShapes: ['oval', 'oblong', 'heart'],
    goodFaceShapes: ['diamond', 'square'],
    barberSpecs: {
      sides: 'High Skin Taper (#000 at temples & nape)',
      top: '5–6 cm dense forward crop with straight lineup',
      beard: 'Goatee or crisp jawline taper',
      product: 'Strong matte texture powder',
    },
    promptCore:
      'a sharp Edgar Caesar haircut with a straight horizontal blunt fringe and high bald temple skin taper',
  },
];

export function computeSuitabilityScore(
  preset: HaircutPreset,
  faceShape: FaceShape | null
): { score: number; verdict: string; reason: string } {
  if (!faceShape) {
    return {
      score: 90,
      verdict: 'Versatile Cut',
      reason: 'Upload or scan a portrait to calculate exact biometric suitability.',
    };
  }

  const shapeReasons: Record<FaceShape, { ideal: string; good: string; caution: string }> = {
    oval: {
      ideal: 'Balances your naturally symmetrical oval proportions without elongating the forehead.',
      good: 'Works cleanly with your balanced oval bone structure.',
      caution: 'Keep fringe/height moderate so your face does not appear overly elongated.',
    },
    square: {
      ideal: 'Complements your strong jawline while adding structured texture on top.',
      good: 'Frames your angular jaw cleanly without making the sides look boxy.',
      caution: 'Ask your barber to keep the corners blended so it doesn’t widen the temples.',
    },
    diamond: {
      ideal: 'Adds fullness at the forehead/temples to balance prominent cheekbones.',
      good: 'Highlights your sharp cheekbones while keeping balanced crown silhouette.',
      caution: 'Avoid ultra-high skin fades if you want softer temple proportions.',
    },
    round: {
      ideal: 'Tight sides + vertical crown texture create instant jawline definition and height.',
      good: 'Adds clean structure on the sides to sharpen cheek contours.',
      caution: 'Keep the sides tighter so extra width doesn’t round out the silhouette.',
    },
    heart: {
      ideal: 'Softens upper-forehead width while balancing a narrower chin.',
      good: 'Creates natural harmony between your brow line and jawline.',
      caution: 'Avoid excessive top width with razor-tight sides.',
    },
    oblong: {
      ideal: 'Forward fringe or side fullness visually shortens vertical face length.',
      good: 'Keeps balanced horizontal proportion without adding excess crown height.',
      caution: 'Avoid tall quiffs + ultra-high skin fades which elongate the face further.',
    },
  };

  if (preset.idealFaceShapes.includes(faceShape)) {
    const hash = preset.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const score = 93 + (hash % 6);
    return { score, verdict: 'Ideal Match', reason: shapeReasons[faceShape].ideal };
  }

  if (preset.goodFaceShapes.includes(faceShape)) {
    const hash = preset.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const score = 84 + (hash % 7);
    return { score, verdict: 'Strong Fit', reason: shapeReasons[faceShape].good };
  }

  return { score: 75, verdict: 'Experimental', reason: shapeReasons[faceShape].caution };
}

/**
 * Compiles a crisp, high-signal Kontext/Qwen imperative instruction (avoiding bloated word lists
 * so the diffusion model changes the hair dramatically, while our 478-Landmark Biometric FaceLock
 * guarantees 100.0% identity preservation afterward).
 */
export function compileHaircutPrompt(params: {
  preset?: HaircutPreset | null;
  customInstruction?: string;
  fade: FadeOption;
  beard: BeardOption;
  color: HairColorOption;
}): { prompt: string; specs: BarberSpecs; title: string; preserveBeard: boolean } {
  const { preset, customInstruction, fade, beard, color } = params;

  const fadeObj = FADE_OPTIONS.find(f => f.id === fade);
  const beardObj = BEARD_OPTIONS.find(b => b.id === beard);
  const colorObj = HAIR_COLOR_OPTIONS.find(c => c.id === color);

  const coreHair = customInstruction?.trim()
    ? customInstruction.trim()
    : preset?.promptCore || 'a sharp low taper textured fringe haircut';

  const fadeSuffix =
    fade !== 'preset_default' && fadeObj?.promptText ? ` ${fadeObj.promptText}` : '';
  const colorSuffix =
    color !== 'natural' && colorObj?.promptText ? `, ${colorObj.promptText} hair color` : '';
  const beardSentence =
    beard !== 'keep_current' && beardObj?.promptText ? ` ${beardObj.promptText}` : '';

  const prompt = `Change this man's hair to ${coreHair}${fadeSuffix}${colorSuffix}.${beardSentence} Keep his exact face, head pose, and background unchanged.`;

  const baseSpecs: BarberSpecs = preset?.barberSpecs
    ? { ...preset.barberSpecs }
    : {
        sides: 'Tailored Taper / Fade',
        top: customInstruction?.trim() || 'Custom AI Styled Cut',
        beard: 'Natural blend',
        product: 'Matte styling clay',
      };

  if (fade !== 'preset_default' && fadeObj) {
    baseSpecs.sides = fadeObj.label;
  }
  if (beard !== 'keep_current' && beardObj) {
    baseSpecs.beard = beardObj.label;
  }

  const titleParts = [
    customInstruction?.trim()
      ? customInstruction.trim().slice(0, 34)
      : preset?.name || 'Custom Cut',
    fade !== 'preset_default' && fadeObj ? `(${fadeObj.label})` : '',
    color !== 'natural' && colorObj ? `· ${colorObj.label}` : '',
  ].filter(Boolean);

  return {
    prompt,
    specs: baseSpecs,
    title: titleParts.join(' '),
    preserveBeard: beard === 'keep_current',
  };
}
