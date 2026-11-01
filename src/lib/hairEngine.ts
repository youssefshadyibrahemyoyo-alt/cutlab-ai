import type { BarberSpecs } from '../types/cutlab';
import { applyBiometricFaceLock } from './biometricFaceLock';

const CUTLAB_EDGE_URL =
  'https://zavtplsoyomtkxqldsnr.supabase.co/functions/v1/cutlab-agent';

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, b64] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(b64);
  const ab = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(ab);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([ab], { type: mime });
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed reading generated image'));
    reader.readAsDataURL(blob);
  });
}

async function uploadPortraitToGradio(
  spaceBaseUrl: string,
  sourceDataUrl: string,
  hfToken?: string
): Promise<{ path: string; url: string }> {
  const blob = dataUrlToBlob(sourceDataUrl);
  const form = new FormData();
  form.append('files', blob, 'portrait.jpg');

  const headers: Record<string, string> = {};
  if (hfToken?.trim()) {
    headers['Authorization'] = `Bearer ${hfToken.trim()}`;
  }

  const upRes = await fetch(`${spaceBaseUrl}/gradio_api/upload`, {
    method: 'POST',
    headers,
    body: form,
  });
  if (!upRes.ok) {
    throw new Error(`Upload returned HTTP ${upRes.status}`);
  }
  const uploadedPaths: string[] = await upRes.json();
  if (!uploadedPaths?.[0]) {
    throw new Error('Missing uploaded file handle from GPU node.');
  }
  return {
    path: uploadedPaths[0],
    url: `${spaceBaseUrl}/gradio_api/file=${uploadedPaths[0]}`,
  };
}

async function streamGradioEventResult(params: {
  spaceBaseUrl: string;
  endpoint: string;
  eventId: string;
  hfToken?: string;
  onStatus?: (msg: string) => void;
}): Promise<string> {
  const { spaceBaseUrl, endpoint, eventId, hfToken, onStatus } = params;
  const headers: Record<string, string> = {};
  if (hfToken?.trim()) {
    headers['Authorization'] = `Bearer ${hfToken.trim()}`;
  }

  const sseRes = await fetch(
    `${spaceBaseUrl}/gradio_api/call${endpoint}/${eventId}`,
    { headers }
  );
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
          onStatus?.(`Sculpting hair strands & fade (${heartbeats * 3}s)…`);
        }
      } else if (line.startsWith('data:')) {
        const dataStr = line.slice(5).trim();
        if (currentEvent === 'error') {
          throw new Error(
            dataStr && dataStr !== 'null'
              ? dataStr
              : 'GPU node busy — switching to backup barber GPU…'
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

  const imgRes = await fetch(resultUrl);
  if (!imgRes.ok) {
    throw new Error(`Failed fetching rendered portrait (HTTP ${imgRes.status})`);
  }
  return blobToDataUrl(await imgRes.blob());
}

/**
 * Engine 1: Qwen-Edit-2511 Rapid-AIO (4-step Lightning — ~4s GPU time, allows 12-15+ free edits/hr!)
 */
async function runQwenRapidAio(params: {
  sourceDataUrl: string;
  prompt: string;
  hfToken?: string;
  onStatus?: (msg: string) => void;
}): Promise<string> {
  const spaceBaseUrl = 'https://kulkas2pintu-qwen-edit-image.hf.space';
  params.onStatus?.('Uploading portrait to Rapid Barber GPU…');
  const uploaded = await uploadPortraitToGradio(
    spaceBaseUrl,
    params.sourceDataUrl,
    params.hfToken
  );

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (params.hfToken?.trim()) {
    headers['Authorization'] = `Bearer ${params.hfToken.trim()}`;
  }

  params.onStatus?.('Sculpting new haircut silhouette…');
  const callRes = await fetch(`${spaceBaseUrl}/gradio_api/call/edit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      data: [
        {
          path: uploaded.path,
          url: uploaded.url,
          orig_name: 'portrait.jpg',
          meta: { _type: 'gradio.FileData' },
        },
        params.prompt,
        '',
        null,
        0,
        true,
        1.5,
        4,
        false, // false so Space doesn't inject "keep same hairstyle"; our 478-landmark FaceLock locks the real face!
        0,
        1024,
        false,
        false,
      ],
    }),
  });
  if (!callRes.ok) {
    throw new Error(`Rapid GPU HTTP ${callRes.status}`);
  }
  const { event_id: eventId } = await callRes.json();
  return streamGradioEventResult({
    spaceBaseUrl,
    endpoint: '/edit',
    eventId,
    hfToken: params.hfToken,
    onStatus: params.onStatus,
  });
}

/**
 * Engine 2: FLUX.1-Kontext-Dev (Guidance 3.5 + Full FileData URL + 26 steps)
 */
async function runFluxKontext(params: {
  sourceDataUrl: string;
  prompt: string;
  hfToken?: string;
  onStatus?: (msg: string) => void;
}): Promise<string> {
  const spaceBaseUrl = 'https://black-forest-labs-flux-1-kontext-dev.hf.space';
  params.onStatus?.('Uploading portrait to FLUX Kontext GPU…');
  const uploaded = await uploadPortraitToGradio(
    spaceBaseUrl,
    params.sourceDataUrl,
    params.hfToken
  );

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (params.hfToken?.trim()) {
    headers['Authorization'] = `Bearer ${params.hfToken.trim()}`;
  }

  params.onStatus?.('Rendering high-detail hair & fade…');
  const callRes = await fetch(`${spaceBaseUrl}/gradio_api/call/infer`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      data: [
        {
          path: uploaded.path,
          url: uploaded.url,
          orig_name: 'portrait.jpg',
          meta: { _type: 'gradio.FileData' },
        },
        params.prompt,
        0,
        true,
        3.5, // Stronger haircut prompt adherence (was 2.5); FaceLock restores 100% real face afterward!
        26,
      ],
    }),
  });
  if (!callRes.ok) {
    throw new Error(`Kontext HTTP ${callRes.status}`);
  }
  const { event_id: eventId } = await callRes.json();
  return streamGradioEventResult({
    spaceBaseUrl,
    endpoint: '/infer',
    eventId,
    hfToken: params.hfToken,
    onStatus: params.onStatus,
  });
}

/**
 * Engine 3: Official Qwen-Image-Edit Space
 */
async function runQwenOfficialEdit(params: {
  sourceDataUrl: string;
  prompt: string;
  hfToken?: string;
  onStatus?: (msg: string) => void;
}): Promise<string> {
  const spaceBaseUrl = 'https://qwen-qwen-image-edit.hf.space';
  params.onStatus?.('Connecting to Qwen Studio GPU…');
  const uploaded = await uploadPortraitToGradio(
    spaceBaseUrl,
    params.sourceDataUrl,
    params.hfToken
  );

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (params.hfToken?.trim()) {
    headers['Authorization'] = `Bearer ${params.hfToken.trim()}`;
  }

  const callRes = await fetch(`${spaceBaseUrl}/gradio_api/call/infer`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      data: [
        {
          path: uploaded.path,
          url: uploaded.url,
          orig_name: 'portrait.jpg',
          meta: { _type: 'gradio.FileData' },
        },
        params.prompt,
        0,
        true,
        4.0,
        36,
        true,
      ],
    }),
  });
  if (!callRes.ok) {
    throw new Error(`Qwen Official HTTP ${callRes.status}`);
  }
  const { event_id: eventId } = await callRes.json();
  return streamGradioEventResult({
    spaceBaseUrl,
    endpoint: '/infer',
    eventId,
    hfToken: params.hfToken,
    onStatus: params.onStatus,
  });
}

/**
 * Engine 4: Cloud Worker Relay Fallback (uses Edge Function egress pool)
 */
async function runCloudRelayEdit(params: {
  sourceDataUrl: string;
  prompt: string;
  hfToken?: string;
  onStatus?: (msg: string) => void;
}): Promise<{ rawDataUrl: string; label: string }> {
  params.onStatus?.('Routing via CutLab Cloud Barber Relay…');
  const res = await fetch(CUTLAB_EDGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'hair_edit_relay',
      sourceDataUrl: params.sourceDataUrl,
      prompt: params.prompt,
      guidanceScale: 3.5,
      hfToken: params.hfToken || '',
    }),
  });
  const data = await res.json();
  if (!res.ok || !data?.ok || !data?.imageDataUrl) {
    throw new Error(data?.error || 'Cloud Barber Relay busy');
  }
  return {
    rawDataUrl: String(data.imageDataUrl),
    label: String(data.engineUsed || 'CutLab Cloud GPU'),
  };
}

export async function generateHaircutTransformation(params: {
  originalIdentityDataUrl: string;
  sourceDataUrl: string;
  prompt: string;
  preserveBeard: boolean;
  geminiApiKey?: string;
  hfToken?: string;
  onStatus?: (msg: string) => void;
}): Promise<{ imageDataUrl: string; engineUsed: string }> {
  const {
    originalIdentityDataUrl,
    sourceDataUrl,
    prompt,
    preserveBeard,
    geminiApiKey,
    hfToken,
    onStatus,
  } = params;

  const lockToUserIdentity = async (rawDataUrl: string, label: string) => {
    onStatus?.('Locking 478 facial landmarks to preserve 100% your real face…');
    const lockedDataUrl = await applyBiometricFaceLock({
      originalDataUrl: originalIdentityDataUrl,
      generatedDataUrl: rawDataUrl,
      preserveBeard,
    });
    return { imageDataUrl: lockedDataUrl, engineUsed: label };
  };

  // Optional BYOK Gemini Pro Studio first if user configured a key
  if (geminiApiKey && geminiApiKey.trim()) {
    try {
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
        return await lockToUserIdentity(
          String(data.imageDataUrl),
          'Gemini Pro + FaceLock'
        );
      }
    } catch {
      // Smoothly continue into multi-GPU cascade
    }
  }

  // Zero-Key Multi-GPU Cascade:
  // 1) FLUX.1 Kontext (guidance 3.5) -> 2) Qwen-2511 Rapid-AIO (4-step ultra-low-quota) -> 3) Qwen Official -> 4) Cloud Worker Relay
  const attempts: {
    label: string;
    run: () => Promise<string>;
  }[] = [
    {
      label: 'FLUX.1 Kontext + FaceLock',
      run: () => runFluxKontext({ sourceDataUrl, prompt, hfToken, onStatus }),
    },
    {
      label: 'Qwen-2511 Rapid + FaceLock',
      run: () => runQwenRapidAio({ sourceDataUrl, prompt, hfToken, onStatus }),
    },
    {
      label: 'Qwen Studio + FaceLock',
      run: () => runQwenOfficialEdit({ sourceDataUrl, prompt, hfToken, onStatus }),
    },
    {
      label: 'Cloud Relay + FaceLock',
      run: async () => {
        const r = await runCloudRelayEdit({
          sourceDataUrl,
          prompt,
          hfToken,
          onStatus,
        });
        return r.rawDataUrl;
      },
    },
  ];

  let lastErr: Error | null = null;
  for (const candidate of attempts) {
    try {
      const rawOut = await candidate.run();
      return await lockToUserIdentity(rawOut, candidate.label);
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw (
    lastErr ||
    new Error(
      'All free barber GPUs are momentarily at capacity — add a free Hugging Face token or Gemini key in Settings for instant priority runs.'
    )
  );
}

export type BarberAgentResponse = {
  reply: string;
  shouldGenerate: boolean;
  changeBeard: boolean;
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
      changeBeard: Boolean(parsed.changeBeard),
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
      changeBeard: false,
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
