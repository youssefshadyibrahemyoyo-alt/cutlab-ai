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
    promptText: 'clean low taper fade strictly around the sideburns and nape keeping fullness above the ears',
  },
  {
    id: 'mid_fade',
    label: 'Mid Fade',
    promptText: 'seamless mid skin-to-#2 fade blending smoothly up the temples and back',
  },
  {
    id: 'high_skin_fade',
    label: 'High Skin Fade',
    promptText: 'crisp high skin bald fade tight up the sides for strong vertical contrast',
  },
  {
    id: 'drop_fade',
    label: 'Drop Fade',
    promptText: 'curved drop fade that arcs naturally downward behind the ear following the occipital bone',
  },
  {
    id: 'burst_fade',
    label: 'Burst Fade',
    promptText: 'rounded semi-circular burst fade tight around the ear while leaving textured flow at the back nape',
  },
];

export const BEARD_OPTIONS: { id: BeardOption; label: string; promptText: string }[] = [
  {
    id: 'keep_current',
    label: 'Keep Current',
    promptText: 'keep his existing facial hair / jawline exactly as in the photo',
  },
  {
    id: 'clean_shaven',
    label: 'Clean Shaven',
    promptText: 'make his face cleanly shaven with smooth natural jawline skin texture',
  },
  {
    id: 'light_stubble',
    label: '3mm Stubble',
    promptText: 'give him neat, natural 3mm designer shadow stubble faded into the sideburns',
  },
  {
    id: 'sharp_boxed_beard',
    label: 'Boxed Beard',
    promptText: 'give him a well-groomed short boxed beard (#3 guard) with crisp cheek lineup and tapered sideburns',
  },
  {
    id: 'goatee_mustache',
    label: 'Disconnected Goatee',
    promptText: 'give him a clean modern mustache and trimmed chin goatee with clean-shaven cheeks',
  },
];

export const HAIR_COLOR_OPTIONS: {
  id: HairColorOption;
  label: string;
  swatch: string;
  promptText: string;
}[] = [
  { id: 'natural', label: 'Natural', swatch: 'linear-gradient(135deg,#2b211a,#6b5344)', promptText: 'keep his natural hair color' },
  { id: 'jet_black', label: 'Jet Black', swatch: '#141418', promptText: 'rich natural jet-black hair color' },
  { id: 'espresso_brown', label: 'Espresso', swatch: '#3b2618', promptText: 'deep dark espresso-brown hair color' },
  { id: 'platinum_blonde', label: 'Platinum', swatch: '#e6dec8', promptText: 'bleached icy platinum-blonde hair color with realistic dark roots' },
  { id: 'ash_silver', label: 'Ash Silver', swatch: '#9da3ae', promptText: 'modern smoky ash-silver gray hair color' },
  { id: 'copper_auburn', label: 'Auburn', swatch: '#8b3e22', promptText: 'warm rich copper-auburn hair color' },
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
      'a modern men’s low taper fade haircut with a messy, choppy point-cut textured fringe falling naturally over the upper forehead, clean temple taper, natural matte volume on top',
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
      'a stylish men’s burst fade haircut with tight curved skin fade around the ears, textured natural curls with volume on top and soft tapered V-flow at the back nape',
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
      'a sharp men’s French crop haircut with a mid skin drop fade curving behind the ears and a short cropped textured fringe brushed forward cleanly across the top',
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
      'a crisp #2 guard men’s buzz cut on top paired with a seamless mid-to-high skin fade on the sides and a natural clean hairline lineup',
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
      'a 90s warrior cut men’s hairstyle with tousled, piecey medium-short choppy layers all over, scissor-textured sides, effortless masculine volume',
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
      'a modern men’s textured mullet wolf-cut hairstyle with clean temple tapers, choppy layered crown volume, soft fringe, and tasteful feathered length behind the neck',
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
      'an Old Money classic men’s all-scissor haircut with medium-length softly swept-back hair, natural sideburns, refined gentleman’s volume and effortless flow',
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
      'a 90s middle-part curtain bangs men’s haircut with soft flowing layers parted in the center framing the forehead and cheekbones, neat tapered back and sides',
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
      'a refined Ivy League crew cut men’s hairstyle with neat #1.5 tapered sides and a short, clean side-swept front with subtle lift',
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
      'a men’s blowout taper haircut featuring voluminous, airy brushed-up textured hair on top and a crisp low skin taper at the temples and neckline',
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
      'a modern men’s slick back haircut with medium-long hair combed cleanly backward with natural strand texture and a sharp low drop fade on the sides',
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
      'a crisp men’s curly top mid drop fade haircut with dense, defined curls on top and clean faded sides dropping smoothly behind the ear',
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
      'a tailored executive side-part men’s haircut with neat #2 tapered sides and cleanly combed side-parted hair with classic volume',
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
      'a modern textured quiff men’s haircut with lifted messy volume at the front hairline and a clean mid skin fade on the sides',
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
      'a relaxed men’s medium-length wavy surfer flow hairstyle with natural movement, soft layers pushed loosely back around the ears',
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
      'a sharp modern Caesar Edgar men’s haircut with a straight horizontal textured fringe, dense bulk on top, and a crisp high skin taper at the temples',
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
    // Deterministic high match 93..98 based on id hash
    const hash = preset.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const score = 93 + (hash % 6);
    return {
      score,
      verdict: 'Ideal Match',
      reason: shapeReasons[faceShape].ideal,
    };
  }

  if (preset.goodFaceShapes.includes(faceShape)) {
    const hash = preset.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const score = 84 + (hash % 7);
    return {
      score,
      verdict: 'Strong Fit',
      reason: shapeReasons[faceShape].good,
    };
  }

  return {
    score: 75,
    verdict: 'Experimental',
    reason: shapeReasons[faceShape].caution,
  };
}

export function compileHaircutPrompt(params: {
  preset?: HaircutPreset | null;
  customInstruction?: string;
  fade: FadeOption;
  beard: BeardOption;
  color: HairColorOption;
}): { prompt: string; specs: BarberSpecs; title: string } {
  const { preset, customInstruction, fade, beard, color } = params;

  const fadeObj = FADE_OPTIONS.find(f => f.id === fade);
  const beardObj = BEARD_OPTIONS.find(b => b.id === beard);
  const colorObj = HAIR_COLOR_OPTIONS.find(c => c.id === color);

  const coreHair = customInstruction?.trim()
    ? customInstruction.trim()
    : preset?.promptCore || 'a sharp modern men’s low taper textured haircut';

  const clauses: string[] = [
    "Change ONLY this man's hairstyle",
    beard !== 'keep_current' ? 'and facial hair as specified' : '',
    'while keeping his exact facial features, eyes, nose, mouth, skin tone, head pose, clothing, lighting, and background 100% identical.',
    `Give him ${coreHair}.`,
  ].filter(Boolean);

  if (fade !== 'preset_default' && fadeObj?.promptText) {
    clauses.push(`On the sides and back, apply a ${fadeObj.promptText}.`);
  }

  if (beardObj?.promptText) {
    clauses.push(`For facial hair: ${beardObj.promptText}.`);
  }

  if (color !== 'natural' && colorObj?.promptText) {
    clauses.push(`Hair color: ${colorObj.promptText}.`);
  } else {
    clauses.push('Keep his natural hair color and realistic individual hair strand texture.');
  }

  clauses.push('Photorealistic studio barbershop quality, seamless natural hairline.');

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
    prompt: clauses.join(' '),
    specs: baseSpecs,
    title: titleParts.join(' '),
  };
}
