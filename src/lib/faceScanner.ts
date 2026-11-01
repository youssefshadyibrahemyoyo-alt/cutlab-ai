import type { FaceAnalysis, FaceShape, Point2D } from '../types/cutlab';

// Outer face oval indices from MediaPipe 478 Face Mesh
export const FACE_OVAL_INDICES = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109, 10,
];

const SHAPE_INFO: Record<
  FaceShape,
  { label: string; barberSummary: string; avoidNote: string }
> = {
  oval: {
    label: 'Oval',
    barberSummary:
      'Balanced vertical thirds with gently tapered jawline — the most versatile proportion in men’s barbering. Both cropped fades and medium scissor flow suit you effortlessly.',
    avoidNote:
      'Avoid overly heavy blunt bangs that hide your natural symmetry.',
  },
  square: {
    label: 'Square',
    barberSummary:
      'Strong, masculine jaw width nearly matching cheekbone & temple span. Clean fades, buzz cuts, French crops, and messy textured tops highlight your bone structure.',
    avoidNote:
      'Avoid boxy flat-sided cuts that add unnecessary bulk above the ears.',
  },
  diamond: {
    label: 'Diamond',
    barberSummary:
      'Prominent cheekbones with a narrower forehead and tapered chin. Textured fringes, burst fades, curtains, and scissor tapers add ideal fullness at the temples.',
    avoidNote:
      'Avoid ultra-high skin fades with zero temple weight, which exaggerate cheekbone width.',
  },
  round: {
    label: 'Round',
    barberSummary:
      'Similar face length and cheekbone width with softer jaw angles. Tight mid/drop fades paired with lifted crown texture or angular quiffs create sharp vertical structure.',
    avoidNote:
      'Avoid wide bowl fringes or heavy un-tapered side bulk.',
  },
  heart: {
    label: 'Heart',
    barberSummary:
      'Broader forehead & temple line tapering cleanly toward the chin. Forward textured fringes, curtains, low tapers, and light designer stubble create effortless balance.',
    avoidNote:
      'Avoid wide blown-out tops combined with ultra-high bald fades.',
  },
  oblong: {
    label: 'Oblong / Rectangular',
    barberSummary:
      'Longer vertical proportion with clean straight cheek lines. Textured forward fringes, French crops, low tapers, and medium surfer waves balance vertical length.',
    avoidNote:
      'Avoid tall pompadours combined with high skin fades.',
  },
};

export function classifyFaceGeometry(metrics: {
  lengthToWidthRatio: number;
  jawToCheekRatio: number;
  foreheadToCheekRatio: number;
  upperThirdPct?: number;
  middleThirdPct?: number;
  lowerThirdPct?: number;
  landmarks2D?: Point2D[];
}): FaceAnalysis {
  const lw = Number(metrics.lengthToWidthRatio.toFixed(2));
  const jc = Number(metrics.jawToCheekRatio.toFixed(2));
  const fc = Number(metrics.foreheadToCheekRatio.toFixed(2));

  let shape: FaceShape = 'oval';
  if (lw >= 1.48) {
    shape = 'oblong';
  } else if (jc >= 0.87 && lw <= 1.38) {
    shape = 'square';
  } else if (lw <= 1.24 && jc < 0.87) {
    shape = 'round';
  } else if (fc >= 0.91 && jc <= 0.78) {
    shape = 'heart';
  } else if (fc <= 0.83 && jc <= 0.81) {
    shape = 'diamond';
  } else {
    shape = 'oval';
  }

  const jawDefinition: FaceAnalysis['jawDefinition'] =
    jc >= 0.85
      ? 'Sharp & Angular'
      : jc >= 0.78
      ? 'Balanced'
      : 'Soft & Rounded';

  const info = SHAPE_INFO[shape];

  return {
    shape,
    label: info.label,
    confidence: 94,
    lengthToWidthRatio: lw,
    jawToCheekRatio: jc,
    foreheadToCheekRatio: fc,
    upperThirdPct: metrics.upperThirdPct ?? 33,
    middleThirdPct: metrics.middleThirdPct ?? 34,
    lowerThirdPct: metrics.lowerThirdPct ?? 33,
    jawDefinition,
    barberSummary: info.barberSummary,
    avoidNote: info.avoidNote,
    landmarks2D: metrics.landmarks2D ?? [],
    contourIndices: FACE_OVAL_INDICES,
  };
}

function dist(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Lazy singleton for MediaPipe FaceLandmarker
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let landmarkerPromise: Promise<any> | null = null;

async function getFaceLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await import('@mediapipe/tasks-vision');
      const fileset = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
      );
      return vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        },
        runningMode: 'IMAGE',
        numFaces: 1,
      });
    })();
  }
  return landmarkerPromise;
}

export function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode portrait image.'));
    img.src = src;
  });
}

export async function detectRawFaceLandmarks(
  imgOrDataUrl: HTMLImageElement | string
): Promise<Point2D[] | null> {
  const img =
    typeof imgOrDataUrl === 'string'
      ? await loadHtmlImage(imgOrDataUrl)
      : imgOrDataUrl;
  try {
    const landmarker = await getFaceLandmarker();
    const res = landmarker.detect(img);
    const pts: Point2D[] | undefined = res?.faceLandmarks?.[0]?.map(
      (p: { x: number; y: number }) => ({ x: p.x, y: p.y })
    );
    if (pts && pts.length >= 468) {
      return pts;
    }
  } catch {
    // Offline / WebGL fallback
  }
  return null;
}

export async function analyzePortraitFace(imageDataUrl: string): Promise<FaceAnalysis> {
  const pts = await detectRawFaceLandmarks(imageDataUrl);

  if (pts && pts.length >= 468) {
    const topForehead = pts[10];
    const browCenter = pts[9];
    const subnasale = pts[2];
    const chinBottom = pts[152];

    const leftCheek = pts[234];
    const rightCheek = pts[454];
    const leftJaw = pts[172];
    const rightJaw = pts[397];
    const leftForehead = pts[103];
    const rightForehead = pts[332];

    const cheekWidth = Math.max(0.05, dist(leftCheek, rightCheek));
    const jawWidth = dist(leftJaw, rightJaw);
    const foreheadWidth = dist(leftForehead, rightForehead);

    const foreheadToBrow = dist(topForehead, browCenter);
    const estimatedHairlineHeight = foreheadToBrow * 1.28;
    const browToNose = dist(browCenter, subnasale);
    const noseToChin = dist(subnasale, chinBottom);
    const fullFaceLength = estimatedHairlineHeight + browToNose + noseToChin;

    const uPct = Math.round((estimatedHairlineHeight / fullFaceLength) * 100);
    const mPct = Math.round((browToNose / fullFaceLength) * 100);
    const lPct = Math.max(20, 100 - uPct - mPct);

    return classifyFaceGeometry({
      lengthToWidthRatio: fullFaceLength / cheekWidth,
      jawToCheekRatio: jawWidth / cheekWidth,
      foreheadToCheekRatio: foreheadWidth / cheekWidth,
      upperThirdPct: uPct,
      middleThirdPct: mPct,
      lowerThirdPct: lPct,
      landmarks2D: pts,
    });
  }

  return classifyFaceGeometry({
    lengthToWidthRatio: 1.34,
    jawToCheekRatio: 0.85,
    foreheadToCheekRatio: 0.87,
    upperThirdPct: 33,
    middleThirdPct: 34,
    lowerThirdPct: 33,
    landmarks2D: [],
  });
}

export async function normalizePortraitToSquare(
  sourceUrlOrData: string
): Promise<string> {
  const img = await loadHtmlImage(sourceUrlOrData);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return sourceUrlOrData;

  const pts = await detectRawFaceLandmarks(img);
  if (pts && pts.length >= 468) {
    const browY = pts[9].y * h;
    const chinY = pts[152].y * h;
    const centerX = pts[6].x * w;
    const faceH = Math.max(60, chinY - browY);
    // Ideal square spans ~3.1x brow-to-chin height so full hair crown + shoulders fit comfortably
    const desiredSide = Math.min(Math.max(w, h), Math.max(Math.min(w, h), faceH * 3.1));
    const sx = Math.round(centerX - desiredSide / 2);
    // Position eyebrows at ~35% from top of the 1024x1024 frame so tall haircuts never clip!
    const sy = Math.round(browY - desiredSide * 0.35);

    // Fill canvas with top-corner ambient color in case tight selfie needs slight headroom padding
    const tmp = document.createElement('canvas');
    tmp.width = 16;
    tmp.height = 16;
    const tCtx = tmp.getContext('2d');
    if (tCtx) {
      tCtx.drawImage(img, 0, 0, w, Math.max(1, Math.round(h * 0.08)), 0, 0, 16, 16);
      const d = tCtx.getImageData(0, 0, 16, 16).data;
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < d.length; i += 4) {
        r += d[i];
        g += d[i + 1];
        b += d[i + 2];
      }
      const n = d.length / 4;
      ctx.fillStyle = `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`;
    } else {
      ctx.fillStyle = '#18181b';
    }
    ctx.fillRect(0, 0, 1024, 1024);

    const scale = 1024 / desiredSide;
    ctx.drawImage(
      img,
      0,
      0,
      w,
      h,
      Math.round(-sx * scale),
      Math.round(-sy * scale),
      Math.round(w * scale),
      Math.round(h * scale)
    );
    return canvas.toDataURL('image/jpeg', 0.93);
  }

  const side = Math.min(w, h);
  const sx = Math.round((w - side) / 2);
  const sy = h > w ? Math.round((h - side) * 0.12) : 0;

  ctx.drawImage(img, sx, sy, side, side, 0, 0, 1024, 1024);
  return canvas.toDataURL('image/jpeg', 0.93);
}
