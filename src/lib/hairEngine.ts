import type { BarberSpecs } from '../types/cutlab';

const CUTLAB_EDGE_URL =
  'https://zavtplsoyomtkxqldsnr.supabase.co/functions/v1/cutlab-agent';

const KONTEXT_SPACES = [
  'https://black-forest-labs-flux-1-kontext-dev.hf.space',
];

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, b64] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed reading generated image'));
    reader.readAsDataURL(blob);
  });
}

async function runFluxKontextOnSpace(params: {
  spaceBaseUrl: string;
  sourceDataUrl: string;
  prompt: string;
  onStatus?: (msg: string) => void;
}): Promise<string> {
  const { spaceBaseUrl, sourceDataUrl, prompt, onStatus } = params;

  onStatus?.('Uploading portrait to AI Barber GPU…');
  const blob = dataUrlToBlob(sourceDataUrl);
  const form = new FormData();
  form.append('files', blob, 'portrait.jpg');

  const upRes = await fetch(`${spaceBaseUrl}/gradio_api/upload`, {
    method: 'POST',
    body: form,
  });
  if (!upRes.ok) {
    throw new Error(`Upload returned HTTP ${upRes.status}`);
  }
  const uploadedPaths: string[] = await upRes.json();
  if (!uploadedPaths?.[0]) {
    throw new Error('Missing uploaded file handle from GPU node.');
  }

  onStatus?.('Sculpting haircut while locking facial identity…');
  const callRes = await fetch(`${spaceBaseUrl}/gradio_api/call/infer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: [
        { path: uploadedPaths[0], meta: { _type: 'gradio.FileData' } },
        prompt,
        0,
        true,
        2.5,
        24,
      ],
    }),
  });
  if (!callRes.ok) {
    throw new Error(`Inference queue returned HTTP ${callRes.status}`);
  }
  const { event_id: eventId } = await callRes.json();
  if (!eventId) {
    throw new Error('Missing inference event_id.');
  }

  const sseRes = await fetch(`${spaceBaseUrl}/gradio_api/call/infer/${eventId}`);
  if (!sseRes.ok || !sseRes.body) {
    throw new Error(`Stream returned HTTP ${sseRes.status}`);
  }

  const reader = sseRes.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let currentEvent = '';
  let resultUrl: string | null = null;
  let heartbeats = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim();
        if (currentEvent === 'heartbeat') {
          heartbeats += 1;
          onStatus?.(`Rendering hair strands & fade (${heartbeats * 3}s)…`);
        }
      } else if (line.startsWith('data:')) {
        const dataStr = line.slice(5).trim();
        if (currentEvent === 'error') {
          throw new Error(
            dataStr && dataStr !== 'null'
              ? dataStr
              : 'Free GPU queue is busy right now — retry in a few seconds or add a free Gemini API key in Settings.'
          );
        }
        if (currentEvent === 'complete') {
          const parsed = JSON.parse(dataStr);
          const first = Array.isArray(parsed) ? parsed[0] : parsed;
          if (first?.url) {
            resultUrl = String(first.url);
          } else if (first?.path) {
            resultUrl = `${spaceBaseUrl}/gradio_api/file=${first.path}`;
          }
        }
      }
    }
  }

  if (!resultUrl) {
    throw new Error('GPU finished without returning an image URL.');
  }

  onStatus?.('Finalizing studio portrait…');
  const imgRes = await fetch(resultUrl);
  if (!imgRes.ok) {
    throw new Error(`Failed fetching rendered portrait (HTTP ${imgRes.status})`);
  }
  const outBlob = await imgRes.blob();
  // Normalize back onto 1024x1024 JPEG so Before/After split slider matches 1:1
  const rawOutDataUrl = await blobToDataUrl(outBlob);
  return ensureExact1024DataUrl(rawOutDataUrl);
}

async function ensureExact1024DataUrl(srcDataUrl: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 1024;
      c.height = 1024;
      const ctx = c.getContext('2d');
      if (!ctx) {
        resolve(srcDataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, 1024, 1024);
      resolve(c.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => resolve(srcDataUrl);
    img.src = srcDataUrl;
  });
}

export async function generateHaircutTransformation(params: {
  sourceDataUrl: string;
  prompt: string;
  geminiApiKey?: string;
  onStatus?: (msg: string) => void;
}): Promise<{ imageDataUrl: string; engineUsed: string }> {
  const { sourceDataUrl, prompt, geminiApiKey, onStatus } = params;

  if (geminiApiKey && geminiApiKey.trim()) {
    onStatus?.('Generating HD edit with Gemini Image Studio…');
    const res = await fetch(CUTLAB_EDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'gemini_image',
        geminiApiKey: geminiApiKey.trim(),
        imageBase64: sourceDataUrl,
        prompt,
      }),
    });
    const data = await res.json();
    if (res.ok && data?.ok && data?.imageDataUrl) {
      const normalized = await ensureExact1024DataUrl(String(data.imageDataUrl));
      return { imageDataUrl: normalized, engineUsed: 'Gemini Pro Studio' };
    }
    // If Gemini image model isn't enabled on their free key, fall back smoothly to FLUX.1 Kontext!
  }

  let lastErr: Error | null = null;
  for (const space of KONTEXT_SPACES) {
    try {
      const out = await runFluxKontextOnSpace({
        spaceBaseUrl: space,
        sourceDataUrl,
        prompt,
        onStatus,
      });
      return { imageDataUrl: out, engineUsed: 'FLUX.1 Kontext' };
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw (
    lastErr ||
    new Error('Could not generate haircut right now. Please try again in a moment.')
  );
}

export type BarberAgentResponse = {
  reply: string;
  shouldGenerate: boolean;
  cutTitle: string;
  barberSpecs: BarberSpecs;
  imagePrompt: string;
};

export function parseBarberAgentJson(rawText: string): BarberAgentResponse {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const candidate =
    firstBrace >= 0 && lastBrace > firstBrace
      ? cleaned.slice(firstBrace, lastBrace + 1)
      : cleaned;

  try {
    const parsed = JSON.parse(candidate);
    return {
      reply:
        String(parsed.reply || '').trim() ||
        "Let's dial that cut in on your portrait right now.",
      shouldGenerate: Boolean(parsed.shouldGenerate),
      cutTitle: String(parsed.cutTitle || 'AI Custom Barber Cut').trim(),
      barberSpecs: {
        sides: String(parsed.barberSpecs?.sides || 'Tailored Taper / Fade'),
        top: String(parsed.barberSpecs?.top || 'Textured scissor work'),
        beard: String(parsed.barberSpecs?.beard || 'Natural blend'),
        product: String(parsed.barberSpecs?.product || 'Matte styling clay'),
      },
      imagePrompt: String(parsed.imagePrompt || '').trim(),
    };
  } catch {
    return {
      reply:
        cleaned ||
        'Got it — tell me how short you want the sides or how much texture you want on top!',
      shouldGenerate: false,
      cutTitle: 'Custom Cut',
      barberSpecs: {
        sides: 'Tailored Taper',
        top: 'Custom Scissor Top',
        beard: 'Natural',
        product: 'Matte Clay',
      },
      imagePrompt: '',
    };
  }
}

export async function askBarberAgent(params: {
  messages: { role: 'user' | 'assistant'; content: string }[];
  faceContext: string;
  imageBase64?: string;
  geminiApiKey?: string;
}): Promise<BarberAgentResponse> {
  const res = await fetch(CUTLAB_EDGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'chat',
      messages: params.messages.slice(-8),
      faceContext: params.faceContext,
      imageBase64: params.geminiApiKey ? params.imageBase64 : undefined,
      geminiApiKey: params.geminiApiKey || '',
    }),
  });

  const data = await res.json();
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || 'AI Barber consultation unavailable.');
  }
  return parseBarberAgentJson(String(data.raw || ''));
}
