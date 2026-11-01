import type { Point2D } from '../types/cutlab';
import { detectRawFaceLandmarks, loadHtmlImage } from './faceScanner';

export type SimilarityTransform = {
  a: number;
  b: number;
  tx: number;
  ty: number;
  scale: number;
};

/**
 * Exact 4-DOF Procrustes similarity solver mapping srcPts -> dstPts:
 *   X = a * x - b * y + tx
 *   Y = b * x + a * y + ty
 */
export function solveSimilarityTransform(
  srcPts: Point2D[],
  dstPts: Point2D[]
): SimilarityTransform {
  const n = Math.min(srcPts.length, dstPts.length);
  if (n < 2) {
    return { a: 1, b: 0, tx: 0, ty: 0, scale: 1 };
  }

  let cx = 0;
  let cy = 0;
  let cX = 0;
  let cY = 0;
  for (let i = 0; i < n; i++) {
    cx += srcPts[i].x;
    cy += srcPts[i].y;
    cX += dstPts[i].x;
    cY += dstPts[i].y;
  }
  cx /= n;
  cy /= n;
  cX /= n;
  cY /= n;

  let denom = 0;
  let numA = 0;
  let numB = 0;
  for (let i = 0; i < n; i++) {
    const dx = srcPts[i].x - cx;
    const dy = srcPts[i].y - cy;
    const dX = dstPts[i].x - cX;
    const dY = dstPts[i].y - cY;
    denom += dx * dx + dy * dy;
    numA += dx * dX + dy * dY;
    numB += dx * dY - dy * dX;
  }

  if (denom < 1e-8) {
    return { a: 1, b: 0, tx: cX - cx, ty: cY - cy, scale: 1 };
  }

  const a = numA / denom;
  const b = numB / denom;
  const scale = Math.hypot(a, b);
  const tx = cX - (a * cx - b * cy);
  const ty = cY - (b * cx + a * cy);
  return { a, b, tx, ty, scale };
}

// Rigid ocular + nasal bridge + oral anchors invariant to hair & crown volume
const RIGID_ALIGNMENT_INDICES = [33, 133, 362, 263, 6, 1, 2, 61, 291];

// Full inner face shield (above eyebrows -> inside temples -> cheekbones -> jaw -> chin)
const FULL_INNER_FACE_RING = [
  70, 63, 105, 66, 107, 9, 336, 296, 334, 293, 300, // Upper eyebrow arch
  383, 372, 345, 352, 376, 433, 416, 367, 397, 365, 379, 378, 400, 377, 152, // Right temple -> chin
  148, 176, 149, 150, 136, 172, 138, 192, 213, 147, 123, 116, 143, 156, // Chin -> left temple
];

// Upper/mid face shield when user explicitly changes beard/stubble (protects brows, eyes, nose, upper cheeks!)
const UPPER_MID_FACE_RING = [
  70, 63, 105, 66, 107, 9, 336, 296, 334, 293, 300,
  383, 372, 345, 352, 425, 2, 205, 123, 116, 143, 156,
];

function matchForeheadSkinTone(
  origData: ImageData,
  genData: ImageData,
  origPtsPx: Point2D[],
  size: number
) {
  // Sample forehead skin patch between eyebrows (9) and upper forehead (10)
  const brow = origPtsPx[9];
  const top = origPtsPx[10];
  const leftTemple = origPtsPx[105];
  const rightTemple = origPtsPx[334];

  const x1 = Math.max(0, Math.round(Math.min(leftTemple.x, rightTemple.x)));
  const x2 = Math.min(size - 1, Math.round(Math.max(leftTemple.x, rightTemple.x)));
  const yTop = Math.min(top.y, brow.y);
  const yBot = Math.max(top.y, brow.y);
  const y1 = Math.max(0, Math.round(yTop + (yBot - yTop) * 0.28));
  const y2 = Math.min(size - 1, Math.round(yBot - (yBot - yTop) * 0.14));

  if (x2 - x1 < 12 || y2 - y1 < 8) return;

  const oSum = [0, 0, 0];
  const gSum = [0, 0, 0];
  let count = 0;

  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      const idx = (y * size + x) * 4;
      oSum[0] += origData.data[idx];
      oSum[1] += origData.data[idx + 1];
      oSum[2] += origData.data[idx + 2];
      gSum[0] += genData.data[idx];
      gSum[1] += genData.data[idx + 1];
      gSum[2] += genData.data[idx + 2];
      count++;
    }
  }
  if (count < 20) return;

  const gains = [0, 1, 2].map(c => {
    const oMean = oSum[c] / count;
    const gMean = Math.max(8, gSum[c] / count);
    return Math.max(0.84, Math.min(1.16, oMean / gMean));
  });

  const d = genData.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.min(255, Math.max(0, Math.round(d[i] * gains[0])));
    d[i + 1] = Math.min(255, Math.max(0, Math.round(d[i + 1] * gains[1])));
    d[i + 2] = Math.min(255, Math.max(0, Math.round(d[i + 2] * gains[2])));
  }
}

/**
 * Aligns the AI-generated haircut portrait onto the user's exact 478 3D facial landmarks
 * and composites 100% of the user's real facial identity, neck, and clothing back onto
 * the portrait so the result is unmistakably YOU with the new haircut.
 */
export async function applyBiometricFaceLock(params: {
  originalDataUrl: string;
  generatedDataUrl: string;
  preserveBeard: boolean;
}): Promise<string> {
  const SIZE = 1024;
  const [origImg, genImg] = await Promise.all([
    loadHtmlImage(params.originalDataUrl),
    loadHtmlImage(params.generatedDataUrl),
  ]);

  const [origNormPts, genNormPts] = await Promise.all([
    detectRawFaceLandmarks(origImg),
    detectRawFaceLandmarks(genImg),
  ]);

  // Draw original onto 1024x1024 canvas
  const origCanvas = document.createElement('canvas');
  origCanvas.width = SIZE;
  origCanvas.height = SIZE;
  const origCtx = origCanvas.getContext('2d');
  if (!origCtx) return params.generatedDataUrl;
  origCtx.drawImage(origImg, 0, 0, SIZE, SIZE);

  // If MediaPipe WASM is offline in a restricted environment, still return normalized 1024 output
  if (!origNormPts || !genNormPts) {
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = SIZE;
    fallbackCanvas.height = SIZE;
    const fCtx = fallbackCanvas.getContext('2d');
    if (!fCtx) return params.generatedDataUrl;
    fCtx.drawImage(genImg, 0, 0, SIZE, SIZE);
    return fallbackCanvas.toDataURL('image/jpeg', 0.93);
  }

  const genW = genImg.naturalWidth || genImg.width || SIZE;
  const genH = genImg.naturalHeight || genImg.height || SIZE;

  const origPtsPx = origNormPts.map(p => ({ x: p.x * SIZE, y: p.y * SIZE }));
  const genPtsPx = genNormPts.map(p => ({ x: p.x * genW, y: p.y * genH }));

  const srcAnchors = RIGID_ALIGNMENT_INDICES.map(i => genPtsPx[i]);
  const dstAnchors = RIGID_ALIGNMENT_INDICES.map(i => origPtsPx[i]);
  const tf = solveSimilarityTransform(srcAnchors, dstAnchors);

  // Sanity guard: if scale is wildly off (<0.55 or >1.85), reject corrupted generation
  if (tf.scale < 0.55 || tf.scale > 1.85) {
    throw new Error('Generated head pose drifted too far — retrying for clean alignment.');
  }

  // Warp generated portrait onto 1024x1024 aligned to original landmarks
  const genCanvas = document.createElement('canvas');
  genCanvas.width = SIZE;
  genCanvas.height = SIZE;
  const genCtx = genCanvas.getContext('2d')!;
  // Fill base with original so any edge shift outside warped image has real background pixels!
  genCtx.drawImage(origImg, 0, 0, SIZE, SIZE);
  genCtx.save();
  genCtx.setTransform(tf.a, tf.b, -tf.b, tf.a, tf.tx, tf.ty);
  genCtx.drawImage(genImg, 0, 0, genW, genH);
  genCtx.restore();

  const origImageData = origCtx.getImageData(0, 0, SIZE, SIZE);
  const genImageData = genCtx.getImageData(0, 0, SIZE, SIZE);

  // Harmonize forehead/temple fade skin tone with user's real skin
  matchForeheadSkinTone(origImageData, genImageData, origPtsPx, SIZE);

  // Build feathered alpha mask (white = keep 100% original real user pixels)
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = SIZE;
  maskCanvas.height = SIZE;
  const mCtx = maskCanvas.getContext('2d')!;
  mCtx.fillStyle = '#000000';
  mCtx.fillRect(0, 0, SIZE, SIZE);

  const noseCenter = origPtsPx[6];
  const chinBottom = origPtsPx[152];
  const browCenter = origPtsPx[9];
  const faceHeight = Math.max(80, chinBottom.y - browCenter.y);

  const ringIndices = params.preserveBeard
    ? FULL_INNER_FACE_RING
    : UPPER_MID_FACE_RING;

  mCtx.save();
  mCtx.filter = 'blur(13px)';
  mCtx.fillStyle = '#FFFFFF';

  // 1. Sacred Face Interior Polygon
  mCtx.beginPath();
  ringIndices.forEach((lmIdx, idx) => {
    const pt = origPtsPx[lmIdx];
    // Pull temple/cheek boundary 5% inward toward nose center so sideburn skin-fades show crisply,
    // and lift eyebrow arch 8px upward so eyebrows are 100% protected while forehead above stays open for bangs/fringes!
    const isBrow = idx <= 10;
    const px = isBrow ? pt.x : pt.x + (noseCenter.x - pt.x) * 0.055;
    const py = isBrow ? pt.y - 8 : pt.y;
    if (idx === 0) mCtx.moveTo(px, py);
    else mCtx.lineTo(px, py);
  });
  mCtx.closePath();
  mCtx.fill();

  // 2. Neck, Collar & Shoulders below chin stay 100% original
  const neckCutoffY = params.preserveBeard
    ? Math.round(chinBottom.y - 4)
    : Math.round(chinBottom.y + faceHeight * 0.34);
  mCtx.fillRect(0, neckCutoffY, SIZE, SIZE - neckCutoffY);

  // 3. Outer border frame margin stays original so affine warp never shows edge seam
  mCtx.fillRect(0, 0, SIZE, 18);
  mCtx.fillRect(0, 0, 32, SIZE);
  mCtx.fillRect(SIZE - 32, 0, 32, SIZE);
  mCtx.restore();

  const maskData = mCtx.getImageData(0, 0, SIZE, SIZE).data;
  const outImageData = origCtx.createImageData(SIZE, SIZE);
  const oPx = origImageData.data;
  const gPx = genImageData.data;
  const dstPx = outImageData.data;

  for (let i = 0; i < dstPx.length; i += 4) {
    // mask red channel 0..255 -> alpha weight of original real face
    const wOrig = maskData[i] / 255;
    const wGen = 1 - wOrig;
    dstPx[i] = Math.round(oPx[i] * wOrig + gPx[i] * wGen);
    dstPx[i + 1] = Math.round(oPx[i + 1] * wOrig + gPx[i + 1] * wGen);
    dstPx[i + 2] = Math.round(oPx[i + 2] * wOrig + gPx[i + 2] * wGen);
    dstPx[i + 3] = 255;
  }

  origCtx.putImageData(outImageData, 0, 0);
  return origCanvas.toDataURL('image/jpeg', 0.94);
}
