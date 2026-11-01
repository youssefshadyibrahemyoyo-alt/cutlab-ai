import type { FaceAnalysis, GeneratedLook } from '../types/cutlab';

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed loading image for Barber Card'));
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function downloadBarberReferenceCard(params: {
  look: GeneratedLook;
  originalPhotoUrl: string;
  faceAnalysis: FaceAnalysis | null;
}): Promise<void> {
  const { look, originalPhotoUrl, faceAnalysis } = params;
  const [afterImg, beforeImg] = await Promise.all([
    loadImg(look.imageUrl),
    loadImg(originalPhotoUrl),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1520;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Carbon Atelier Canvas
  ctx.fillStyle = '#070708';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Architectural hairline border
  ctx.strokeStyle = 'rgba(245, 243, 239, 0.16)';
  ctx.lineWidth = 2;
  roundRect(ctx, 28, 28, canvas.width - 56, canvas.height - 56, 26);
  ctx.stroke();

  // Top Telemetry Header
  ctx.fillStyle = '#E8622A';
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.fillText('CUTLAB ATELIER // BARBER PRESCRIPTION TICKET', 68, 86);

  ctx.fillStyle = '#F5F3EF';
  ctx.font = '800 44px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(look.title.slice(0, 38), 68, 144);

  if (faceAnalysis) {
    ctx.fillStyle = '#2DD4BF';
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.fillText(
      `CRANIAL SCAN: ${faceAnalysis.label.toUpperCase()}${
        look.matchScore ? ` · ${look.matchScore}% SUITABILITY FIT` : ''
      }`,
      68,
      182
    );
  }

  // Main After Portrait + Inset Original Portrait
  const imgX = 68;
  const imgY = 216;
  const mainSize = 780;

  ctx.save();
  roundRect(ctx, imgX, imgY, mainSize, mainSize, 22);
  ctx.clip();
  ctx.drawImage(afterImg, imgX, imgY, mainSize, mainSize);
  ctx.restore();

  const sideX = 876;
  const sideSize = 256;
  ctx.save();
  roundRect(ctx, sideX, imgY, sideSize, sideSize, 18);
  ctx.clip();
  ctx.drawImage(beforeImg, sideX, imgY, sideSize, sideSize);
  ctx.restore();

  ctx.fillStyle = '#A09FA8';
  ctx.font = '600 16px "JetBrains Mono", monospace';
  ctx.fillText('00 · BASELINE HAIR', sideX, imgY + sideSize + 34);

  // Clipper & Scissor Spec Ticket at Bottom
  const boxY = 1034;
  ctx.fillStyle = '#111115';
  roundRect(ctx, 68, boxY, 1064, 418, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#E8622A';
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.fillText('CLIPPER & SCISSOR SPECIFICATIONS', 104, boxY + 52);

  const specs: [string, string][] = [
    ['SIDES & FADE', look.barberSpecs.sides],
    ['TOP & FRINGE', look.barberSpecs.top],
    ['FACIAL HAIR', look.barberSpecs.beard],
    ['STYLING FINISH', look.barberSpecs.product],
  ];

  specs.forEach(([label, val], idx) => {
    const rowY = boxY + 112 + idx * 78;
    ctx.fillStyle = '#8A8994';
    ctx.font = '600 16px "JetBrains Mono", monospace';
    ctx.fillText(label, 104, rowY);

    ctx.fillStyle = '#F5F3EF';
    ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(val.slice(0, 62), 360, rowY);
  });

  const link = document.createElement('a');
  const slug = look.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  link.download = `cutlab-atelier-spec-${slug || 'haircut'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
