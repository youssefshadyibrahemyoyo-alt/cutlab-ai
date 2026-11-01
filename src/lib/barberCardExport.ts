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

  // Obsidian studio canvas
  ctx.fillStyle = '#09090B';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle gold hairline frame
  ctx.strokeStyle = 'rgba(212, 168, 83, 0.35)';
  ctx.lineWidth = 2;
  roundRect(ctx, 28, 28, canvas.width - 56, canvas.height - 56, 28);
  ctx.stroke();

  // Top Header
  ctx.fillStyle = '#D4A853';
  ctx.font = '600 20px Inter, sans-serif';
  ctx.fillText('CUTLAB AI · BARBERSHOP SPECIFICATION CARD', 68, 88);

  ctx.fillStyle = '#F4F4F6';
  ctx.font = '700 44px Inter, sans-serif';
  ctx.fillText(look.title.slice(0, 38), 68, 146);

  if (faceAnalysis) {
    ctx.fillStyle = '#9A9AA6';
    ctx.font = '500 22px Inter, sans-serif';
    ctx.fillText(
      `Face Shape: ${faceAnalysis.label}${
        look.matchScore ? ` · ${look.matchScore}% Suitability Match` : ''
      }`,
      68,
      184
    );
  }

  // Main After Portrait + Inset Before Portrait
  const imgX = 68;
  const imgY = 216;
  const mainSize = 780;

  ctx.save();
  roundRect(ctx, imgX, imgY, mainSize, mainSize, 24);
  ctx.clip();
  ctx.drawImage(afterImg, imgX, imgY, mainSize, mainSize);
  ctx.restore();

  // Right-side Before Thumbnail + Quick Tag
  const sideX = 876;
  const sideSize = 256;
  ctx.save();
  roundRect(ctx, sideX, imgY, sideSize, sideSize, 18);
  ctx.clip();
  ctx.drawImage(beforeImg, sideX, imgY, sideSize, sideSize);
  ctx.restore();

  ctx.fillStyle = '#9A9AA6';
  ctx.font = '600 18px Inter, sans-serif';
  ctx.fillText('BEFORE (STARTING HAIR)', sideX, imgY + sideSize + 34);

  // Barber Clipper & Scissor Spec Grid at Bottom
  const boxY = 1034;
  ctx.fillStyle = '#121217';
  roundRect(ctx, 68, boxY, 1064, 418, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#D4A853';
  ctx.font = '700 19px Inter, sans-serif';
  ctx.fillText('INSTRUCTIONS FOR YOUR BARBER', 104, boxY + 52);

  const specs: [string, string][] = [
    ['SIDES & FADE', look.barberSpecs.sides],
    ['TOP & FRINGE', look.barberSpecs.top],
    ['FACIAL HAIR / BEARD', look.barberSpecs.beard],
    ['STYLING PRODUCT', look.barberSpecs.product],
  ];

  specs.forEach(([label, val], idx) => {
    const rowY = boxY + 112 + idx * 78;
    ctx.fillStyle = '#8B8B98';
    ctx.font = '600 17px Inter, sans-serif';
    ctx.fillText(label, 104, rowY);

    ctx.fillStyle = '#F4F4F6';
    ctx.font = '600 24px Inter, sans-serif';
    ctx.fillText(val.slice(0, 62), 360, rowY);
  });

  const link = document.createElement('a');
  const slug = look.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  link.download = `cutlab-barber-card-${slug || 'haircut'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
