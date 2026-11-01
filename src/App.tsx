import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Camera,
  Columns2,
  Download,
  Heart,
  Info,
  KeyRound,
  Layers,
  MessageSquare,
  Moon,
  RotateCcw,
  ScanFace,
  Scissors,
  Send,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type {
  BarberChatMessage,
  BarberSpecs,
  BeardOption,
  FaceAnalysis,
  FadeOption,
  GeneratedLook,
  HairColorOption,
  HaircutCategory,
  HaircutPreset,
} from './types/cutlab';
import {
  BEARD_OPTIONS,
  FADE_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HAIRCUT_PRESETS,
  compileHaircutPrompt,
  computeSuitabilityScore,
} from './lib/haircutCatalog';
import { analyzePortraitFace, normalizePortraitToSquare } from './lib/faceScanner';
import { askBarberAgent, generateHaircutTransformation } from './lib/hairEngine';
import { downloadBarberReferenceCard } from './lib/barberCardExport';
import { SplitCompareCanvas } from './components/SplitCompareCanvas';
import { WebcamModal } from './components/WebcamModal';
import { CompareGridModal } from './components/CompareGridModal';
import { HaircutSilhouette } from './components/HaircutSilhouette';
import { HeroShowcaseMirror } from './components/HeroShowcaseMirror';

const GEMINI_KEY_STORAGE = 'cutlab_gemini_api_key_v1';
const HF_TOKEN_STORAGE = 'cutlab_hf_token_v1';
const THEME_STORAGE = 'cutlab_atelier_theme_v1';

type StudioTheme = 'noir' | 'alabaster';

const CATEGORY_TABS: { id: HaircutCategory; label: string }[] = [
  { id: 'all', label: 'Ranked Fits' },
  { id: 'fades', label: 'Fades & Crops' },
  { id: 'textured', label: 'Textured' },
  { id: 'curls_flow', label: 'Curls & Flow' },
  { id: 'short_classic', label: 'Buzz & Classic' },
];

const QUICK_BARBER_PROMPTS = [
  'What top 3 cuts fit my jawline?',
  'Low taper + messy textured fringe',
  '#2 buzz cut + high skin fade',
  'Old Money classic scissor flow',
];

const HERO_SIGNATURE_IDS = [
  'french-crop-mid-drop',
  'low-taper-textured-fringe',
  'buzz-cut-mid-skin-fade',
  'burst-fade-messy-curls',
];

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Studio Theme ('noir' Carbon Atelier | 'alabaster' Aesop Stone)
  const [theme, setTheme] = useState<StudioTheme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE);
    return saved === 'alabaster' ? 'alabaster' : 'noir';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE, theme);
  }, [theme]);

  // Portrait & Biometrics
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);
  const [faceAnalysis, setFaceAnalysis] = useState<FaceAnalysis | null>(null);
  const [isScanningFace, setIsScanningFace] = useState(false);
  const [showMesh, setShowMesh] = useState(false);
  const [showBiometricDrawer, setShowBiometricDrawer] = useState(false);

  // Modifiers & Catalog
  const [category, setCategory] = useState<HaircutCategory>('all');
  const [fade, setFade] = useState<FadeOption>('preset_default');
  const [beard, setBeard] = useState<BeardOption>('keep_current');
  const [hairColor, setHairColor] = useState<HairColorOption>('natural');
  const [showModifiers, setShowModifiers] = useState(false);
  const [editSourceMode, setEditSourceMode] = useState<'original' | 'chain'>('original');

  // Generated Lookbook
  const [looks, setLooks] = useState<GeneratedLook[]>([]);
  const [activeLookId, setActiveLookId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Modals & Mobile Tabs
  const [showWebcam, setShowWebcam] = useState(false);
  const [showCompareGrid, setShowCompareGrid] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'mirror' | 'cuts' | 'barber'>('mirror');

  // Optional BYOK Pro Keys
  const [geminiApiKey, setGeminiApiKey] = useState<string>(
    () => localStorage.getItem(GEMINI_KEY_STORAGE) || ''
  );
  const [draftGeminiKey, setDraftGeminiKey] = useState<string>(geminiApiKey);
  const [hfToken, setHfToken] = useState<string>(
    () => localStorage.getItem(HF_TOKEN_STORAGE) || ''
  );
  const [draftHfToken, setDraftHfToken] = useState<string>(hfToken);

  // AI Master Barber Chat
  const [chatMessages, setChatMessages] = useState<BarberChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "I'm Marco, Master Barber at CutLab Atelier. Once your portrait is on the mirror, I'll read your jaw-to-cheekbone geometry and sculpt any cut directly onto your head while locking 100% of your real face.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAgentThinking, setIsAgentThinking] = useState(false);

  const activeLook = useMemo(
    () => looks.find(l => l.id === activeLookId) || null,
    [looks, activeLookId]
  );

  const rankedPresets = useMemo(() => {
    const filtered =
      category === 'all'
        ? HAIRCUT_PRESETS
        : HAIRCUT_PRESETS.filter(p => p.category === category);

    return [...filtered]
      .map(preset => ({
        preset,
        suitability: computeSuitabilityScore(preset, faceAnalysis?.shape ?? null),
      }))
      .sort((a, b) => b.suitability.score - a.suitability.score);
  }, [category, faceAnalysis]);

  const scrollChatBottom = () => {
    requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  const ingestPortrait = async (
    rawSourceUrl: string,
    opts?: { preloadDemoCut?: boolean }
  ) => {
    setErrorBanner(null);
    setIsScanningFace(true);
    try {
      const squareDataUrl = await normalizePortraitToSquare(rawSourceUrl);
      setOriginalPhotoUrl(squareDataUrl);

      const analysis = await analyzePortraitFace(squareDataUrl);
      setFaceAnalysis(analysis);

      if (opts?.preloadDemoCut) {
        const frenchPreset = HAIRCUT_PRESETS.find(
          p => p.id === 'french-crop-mid-drop'
        )!;
        const fit = computeSuitabilityScore(frenchPreset, analysis.shape).score;
        const demoLook: GeneratedLook = {
          id: uid(),
          title: frenchPreset.name,
          imageUrl: '/demo-after.jpg',
          sourceImageUrl: squareDataUrl,
          createdAt: new Date().toISOString(),
          presetId: frenchPreset.id,
          barberSpecs: frenchPreset.barberSpecs,
          isFavorite: true,
          matchScore: fit,
          promptUsed: frenchPreset.promptCore,
          engineUsed: 'FaceLock Studio',
        };
        setLooks([demoLook]);
        setActiveLookId(demoLook.id);
      } else {
        setLooks([]);
        setActiveLookId(null);
        setShowMesh(true);
        setTimeout(() => setShowMesh(false), 2800);
      }

      const topCuts = [...HAIRCUT_PRESETS]
        .map(p => ({ p, s: computeSuitabilityScore(p, analysis.shape).score }))
        .sort((a, b) => b.s - a.s)
        .slice(0, 3);

      setChatMessages([
        {
          id: uid(),
          role: 'assistant',
          content: `Cranial scan complete — **${analysis.label} Structure** (${analysis.jawDefinition} jaw, L/W ${analysis.lengthToWidthRatio}). ${analysis.barberSummary}`,
          suggestedPresetIds: topCuts.map(x => x.p.id),
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setErrorBanner(
        err instanceof Error ? err.message : 'Failed reading portrait image.'
      );
    } finally {
      setIsScanningFace(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        ingestPortrait(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        ingestPortrait(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const executeHaircutGeneration = async (opts: {
    preset?: HaircutPreset | null;
    customPrompt?: string;
    overrideTitle?: string;
    overrideSpecs?: BarberSpecs;
    rawEnginePrompt?: string;
    overridePreserveBeard?: boolean;
  }): Promise<GeneratedLook | null> => {
    if (!originalPhotoUrl || isGenerating) return null;

    setErrorBanner(null);
    setIsGenerating(true);
    setMobilePanel('mirror');

    const sourceDataUrl =
      editSourceMode === 'chain' && activeLook
        ? activeLook.imageUrl
        : originalPhotoUrl;

    const compiled = compileHaircutPrompt({
      preset: opts.preset,
      customInstruction: opts.customPrompt,
      fade,
      beard,
      color: hairColor,
    });

    const finalPrompt = opts.rawEnginePrompt || compiled.prompt;
    const finalTitle = opts.overrideTitle || compiled.title;
    const finalSpecs = opts.overrideSpecs || compiled.specs;
    const preserveBeard =
      opts.overridePreserveBeard !== undefined
        ? opts.overridePreserveBeard
        : compiled.preserveBeard;

    const matchScore = opts.preset
      ? computeSuitabilityScore(opts.preset, faceAnalysis?.shape ?? null).score
      : faceAnalysis
      ? 92
      : null;

    try {
      const { imageDataUrl, engineUsed } = await generateHaircutTransformation({
        originalIdentityDataUrl: originalPhotoUrl,
        sourceDataUrl,
        prompt: finalPrompt,
        preserveBeard,
        geminiApiKey,
        hfToken,
        onStatus: msg => setGenerationStatus(msg),
      });

      const created: GeneratedLook = {
        id: uid(),
        title: finalTitle,
        imageUrl: imageDataUrl,
        sourceImageUrl: sourceDataUrl,
        createdAt: new Date().toISOString(),
        presetId: opts.preset?.id ?? null,
        barberSpecs: finalSpecs,
        isFavorite: false,
        matchScore,
        promptUsed: finalPrompt,
        engineUsed,
      };

      setLooks(prev => [created, ...prev]);
      setActiveLookId(created.id);
      return created;
    } catch (err) {
      setErrorBanner(
        err instanceof Error
          ? err.message
          : 'Barber GPU queue busy — try again in a few seconds.'
      );
      return null;
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };

  const handleSendChat = async (overrideText?: string) => {
    const text = (overrideText ?? chatInput).trim();
    if (!text || isAgentThinking) return;

    setChatInput('');
    const userMsg: BarberChatMessage = {
      id: uid(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    const nextHistory = [...chatMessages, userMsg];
    setChatMessages(nextHistory);
    scrollChatBottom();

    setIsAgentThinking(true);
    try {
      const faceContext = faceAnalysis
        ? `Detected Face Shape: ${faceAnalysis.label} (${faceAnalysis.jawDefinition} jaw, Length/Width=${faceAnalysis.lengthToWidthRatio}, Jaw/Cheek=${faceAnalysis.jawToCheekRatio}, Forehead/Cheek=${faceAnalysis.foreheadToCheekRatio}). ${faceAnalysis.barberSummary}. Currently viewing cut: ${
            activeLook ? activeLook.title : 'Original Starting Hair'
          }.`
        : 'User has not uploaded a photo yet — advise them warmly and invite them to upload or open the Demo Studio.';

      const agentRes = await askBarberAgent({
        messages: nextHistory.map(m => ({ role: m.role, content: m.content })),
        faceContext,
        imageBase64:
          editSourceMode === 'chain' && activeLook
            ? activeLook.imageUrl
            : originalPhotoUrl || undefined,
        geminiApiKey,
      });

      const botMsgId = uid();
      setChatMessages(prev => [
        ...prev,
        {
          id: botMsgId,
          role: 'assistant',
          content: agentRes.reply,
          createdAt: new Date().toISOString(),
        },
      ]);
      scrollChatBottom();

      if (agentRes.shouldGenerate && originalPhotoUrl && agentRes.imagePrompt) {
        const rendered = await executeHaircutGeneration({
          overrideTitle: agentRes.cutTitle,
          overrideSpecs: agentRes.barberSpecs,
          rawEnginePrompt: agentRes.imagePrompt,
          overridePreserveBeard: !agentRes.changeBeard && beard === 'keep_current',
        });
        if (rendered) {
          setChatMessages(prev =>
            prev.map(m =>
              m.id === botMsgId ? { ...m, triggeredLookId: rendered.id } : m
            )
          );
        }
      }
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content:
            err instanceof Error
              ? `Note: ${err.message}`
              : 'Consultation briefly interrupted — send that once more.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsAgentThinking(false);
      scrollChatBottom();
    }
  };

  const toggleFavorite = (id: string) => {
    setLooks(prev =>
      prev.map(l => (l.id === id ? { ...l, isFavorite: !l.isFavorite } : l))
    );
  };

  const deleteLook = (id: string) => {
    setLooks(prev => {
      const remaining = prev.filter(l => l.id !== id);
      if (activeLookId === id) {
        setActiveLookId(remaining[0]?.id ?? null);
      }
      return remaining;
    });
  };

  const saveSettings = () => {
    const trimmedGemini = draftGeminiKey.trim();
    const trimmedHf = draftHfToken.trim();
    setGeminiApiKey(trimmedGemini);
    setHfToken(trimmedHf);
    if (trimmedGemini) localStorage.setItem(GEMINI_KEY_STORAGE, trimmedGemini);
    else localStorage.removeItem(GEMINI_KEY_STORAGE);

    if (trimmedHf) localStorage.setItem(HF_TOKEN_STORAGE, trimmedHf);
    else localStorage.removeItem(HF_TOKEN_STORAGE);

    setShowSettingsModal(false);
  };

  return (
    <div className="atelier-app">
      <div className="ambient-grain" aria-hidden="true" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Precision Atelier Header */}
      <header className="atelier-header">
        <div className="brand-lockup" onClick={() => setOriginalPhotoUrl(null)} style={{ cursor: 'pointer' }}>
          <div className="brand-glyph">
            <Scissors size={16} strokeWidth={2.2} />
          </div>
          <div className="brand-wordmark">
            <span className="brand-name">CUTLAB</span>
            <span className="brand-tag">ATELIER // 02</span>
          </div>
        </div>

        <div className="header-center-hud">
          {originalPhotoUrl && faceAnalysis && (
            <button
              type="button"
              className="cranial-hud-pill"
              onClick={() => setShowBiometricDrawer(v => !v)}
            >
              <ScanFace size={14} className="teal-accent" />
              <span>
                <strong>{faceAnalysis.label}</strong> · {faceAnalysis.jawDefinition}
              </span>
              <span className="hud-ratio-chip">L/W {faceAnalysis.lengthToWidthRatio}</span>
              <Info size={13} className="dim-icon" />
            </button>
          )}

          {originalPhotoUrl && looks.length > 0 && (
            <div className="segmented-switch" title="Apply new cuts to starting photo or refine current look">
              <button
                type="button"
                className={editSourceMode === 'original' ? 'on' : ''}
                onClick={() => setEditSourceMode('original')}
              >
                Original Base
              </button>
              <button
                type="button"
                className={editSourceMode === 'chain' ? 'on' : ''}
                onClick={() => setEditSourceMode('chain')}
              >
                <Layers size={12} />
                Refine Stack
              </button>
            </div>
          )}
        </div>

        <div className="header-right-controls">
          {originalPhotoUrl && (
            <button
              type="button"
              className="atelier-nav-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} />
              <span className="hide-sm">Change Photo</span>
            </button>
          )}

          {looks.length > 0 && (
            <button
              type="button"
              className="atelier-nav-btn ember-outline"
              onClick={() => setShowCompareGrid(true)}
            >
              <Columns2 size={14} />
              <span>Showdown ({looks.length})</span>
            </button>
          )}

          <button
            type="button"
            className="atelier-icon-btn"
            onClick={() => setTheme(t => (t === 'noir' ? 'alabaster' : 'noir'))}
            title={
              theme === 'noir'
                ? 'Switch to Alabaster Salon (Light Theme)'
                : 'Switch to Noir Atelier (Dark Theme)'
            }
          >
            {theme === 'noir' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button
            type="button"
            className="atelier-nav-btn"
            onClick={() => {
              setDraftGeminiKey(geminiApiKey);
              setDraftHfToken(hfToken);
              setShowSettingsModal(true);
            }}
          >
            <KeyRound size={14} />
            <span className="hide-sm">
              {geminiApiKey || hfToken ? 'Pro Boost' : 'Engine'}
            </span>
          </button>
        </div>
      </header>

      {/* Cranial Biometric Popover */}
      {showBiometricDrawer && faceAnalysis && (
        <div className="cranial-popover">
          <div className="cranial-popover-top">
            <div>
              <span className="mono-eyebrow">478-LANDMARK CRANIAL TELEMETRY</span>
              <h4>{faceAnalysis.label} Bone Structure</h4>
              <p>{faceAnalysis.barberSummary}</p>
            </div>
            <button
              type="button"
              className="icon-close-btn"
              onClick={() => setShowBiometricDrawer(false)}
            >
              <X size={15} />
            </button>
          </div>
          <div className="cranial-stats-grid">
            <div className="cranial-stat-card">
              <span>LENGTH / WIDTH</span>
              <strong>{faceAnalysis.lengthToWidthRatio}</strong>
            </div>
            <div className="cranial-stat-card">
              <span>JAW / CHEEK</span>
              <strong>{faceAnalysis.jawToCheekRatio}</strong>
            </div>
            <div className="cranial-stat-card">
              <span>BROW / CHEEK</span>
              <strong>{faceAnalysis.foreheadToCheekRatio}</strong>
            </div>
            <div className="cranial-stat-card">
              <span>FACIAL THIRDS</span>
              <strong>
                {faceAnalysis.upperThirdPct}·{faceAnalysis.middleThirdPct}·
                {faceAnalysis.lowerThirdPct}%
              </strong>
            </div>
          </div>
          <div className="cranial-watchout">
            <span>BARBER NOTE:</span> {faceAnalysis.avoidNote}
          </div>
        </div>
      )}

      {/* STAGE 1: Editorial Landing & Intake (when no portrait loaded yet) */}
      {!originalPhotoUrl ? (
        <main className="editorial-landing">
          <div className="editorial-hero-grid">
            <div className="hero-copy-col">
              <div className="hero-eyebrow-pill">
                <span className="ember-dot" />
                <span>BIOMETRIC MEN’S BARBER ATELIER · ZERO IDENTITY DRIFT</span>
              </div>

              <h1 className="hero-display-title">
                Preview every cut on <em>your actual face</em> before the clippers touch.
              </h1>

              <p className="hero-lead-copy">
                CutLab maps 478 3D cranial landmarks to rank 16 signature barbershop
                cuts for your jawline, sculpts realistic fades &amp; fringes onto your
                portrait, and prints an exact Guard Spec Card for your barber.
              </p>

              {/* Viewfinder Drop & Action Card */}
              <div
                className={`hero-intake-deck ${dragActive ? 'drag-over' : ''}`}
                onDragOver={e => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <div className="intake-primary-actions">
                  <button
                    type="button"
                    className="btn-atelier-primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={16} />
                    <span>Upload Your Portrait</span>
                  </button>

                  <button
                    type="button"
                    className="btn-atelier-surface"
                    onClick={() => setShowWebcam(true)}
                  >
                    <Camera size={16} />
                    <span>Mirror Camera</span>
                  </button>

                  <button
                    type="button"
                    className="btn-atelier-ember-ghost"
                    onClick={() =>
                      ingestPortrait('/demo-portrait.jpg', { preloadDemoCut: true })
                    }
                  >
                    <span>Try Demo Model</span>
                    <ArrowUpRight size={15} />
                  </button>
                </div>

                <div className="intake-sub-caption">
                  Drag &amp; drop any front-facing selfie · Works 100% free out of the box ·{' '}
                  <strong>478-Point FaceLock</strong> keeps your real eyes &amp; face untouched
                </div>
              </div>

              {/* Signature Cut Preview Strip */}
              <div className="hero-signature-strip">
                <div className="strip-label">POPULAR STUDIO PRESETS — CLICK TO TEST</div>
                <div className="signature-mini-grid">
                  {HERO_SIGNATURE_IDS.map(id => {
                    const p = HAIRCUT_PRESETS.find(x => x.id === id)!;
                    return (
                      <button
                        key={id}
                        type="button"
                        className="signature-mini-card"
                        onClick={() =>
                          ingestPortrait('/demo-portrait.jpg', { preloadDemoCut: true })
                        }
                      >
                        <div className="mini-silhouette-box">
                          <HaircutSilhouette presetId={p.id} />
                        </div>
                        <div className="mini-card-meta">
                          <strong>{p.name.split('+')[0].trim()}</strong>
                          <span>{p.barberSpecs.sides.split('(')[0].trim()}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive 60fps Draggable Salon Mirror */}
            <div className="hero-visual-col">
              <HeroShowcaseMirror
                onLaunchDemo={() =>
                  ingestPortrait('/demo-portrait.jpg', { preloadDemoCut: true })
                }
              />
            </div>
          </div>
        </main>
      ) : (
        /* STAGE 2: Full Interactive 3-Zone Atelier Studio */
        <main className="studio-workspace">
          {/* LEFT ZONE: Visual Cut Catalog & Clipper Modifiers */}
          <aside
            className={`atelier-column catalog-col ${
              mobilePanel === 'cuts' ? 'mob-active' : ''
            }`}
          >
            <div className="col-head">
              <div>
                <span className="mono-eyebrow">16 SIGNATURE CUTS</span>
                <h2>Style Index</h2>
              </div>

              <button
                type="button"
                className={`tuner-pill-btn ${
                  showModifiers ||
                  fade !== 'preset_default' ||
                  beard !== 'keep_current' ||
                  hairColor !== 'natural'
                    ? 'active'
                    : ''
                }`}
                onClick={() => setShowModifiers(v => !v)}
              >
                <SlidersHorizontal size={13} />
                <span>Clipper &amp; Dye</span>
              </button>
            </div>

            {showModifiers && (
              <div className="clipper-tuner-drawer">
                <div className="tuner-section">
                  <label>SIDE FADE OVERRIDE</label>
                  <div className="tuner-chip-grid">
                    {FADE_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`tuner-chip ${fade === opt.id ? 'on' : ''}`}
                        onClick={() => setFade(opt.id)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="tuner-section">
                  <label>FACIAL HAIR</label>
                  <div className="tuner-chip-grid">
                    {BEARD_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`tuner-chip ${beard === opt.id ? 'on' : ''}`}
                        onClick={() => setBeard(opt.id)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="tuner-section">
                  <label>TONE / DYE</label>
                  <div className="tuner-chip-grid">
                    {HAIR_COLOR_OPTIONS.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        className={`tuner-chip swatch-chip ${
                          hairColor === c.id ? 'on' : ''
                        }`}
                        onClick={() => setHairColor(c.id)}
                      >
                        <span
                          className="color-dot"
                          style={{ background: c.swatch }}
                        />
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="cat-filter-strip">
              {CATEGORY_TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  className={`cat-tab ${category === tab.id ? 'on' : ''}`}
                  onClick={() => setCategory(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="visual-cuts-scroll">
              {rankedPresets.map(({ preset, suitability }) => {
                const isSelected = activeLook?.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={isGenerating}
                    className={`visual-cut-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => executeHaircutGeneration({ preset })}
                  >
                    <div className="cut-avatar-frame">
                      <HaircutSilhouette presetId={preset.id} />
                    </div>

                    <div className="cut-card-info">
                      <div className="cut-card-title-row">
                        <span className="cut-title">{preset.name}</span>
                        <span
                          className={`fit-score-badge ${
                            suitability.score >= 92 ? 'prime' : ''
                          }`}
                        >
                          {faceAnalysis ? `${suitability.score}%` : preset.maintenance}
                        </span>
                      </div>

                      <p className="cut-desc">{preset.tagline}</p>

                      <div className="cut-spec-foot">
                        <span className="guard-code">{preset.barberSpecs.sides}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* CENTER ZONE: Illuminated Salon Mirror & Spec Ticket */}
          <section
            className={`atelier-stage-col ${
              mobilePanel === 'mirror' ? 'mob-active' : ''
            }`}
          >
            {errorBanner && (
              <div className="atelier-alert">
                <span>{errorBanner}</span>
                <button type="button" onClick={() => setErrorBanner(null)}>
                  <X size={14} />
                </button>
              </div>
            )}

            <SplitCompareCanvas
              originalPhotoUrl={originalPhotoUrl}
              activeLook={activeLook}
              faceAnalysis={faceAnalysis}
              showMesh={showMesh || isScanningFace}
              onToggleMesh={() => setShowMesh(v => !v)}
              isGenerating={isGenerating}
              generationStatus={generationStatus}
            />

            {/* Precision Barber Prescription Dock */}
            {activeLook ? (
              <div className="prescription-dock">
                <div className="prescription-details">
                  <div className="prescription-head">
                    <h3>{activeLook.title}</h3>
                    {activeLook.matchScore && (
                      <span className="fit-score-badge prime">
                        {activeLook.matchScore}% CRANIAL MATCH
                      </span>
                    )}
                  </div>

                  <div className="prescription-specs-grid">
                    <div>
                      <span>SIDES</span>
                      <strong>{activeLook.barberSpecs.sides}</strong>
                    </div>
                    <div>
                      <span>TOP</span>
                      <strong>{activeLook.barberSpecs.top}</strong>
                    </div>
                    <div>
                      <span>STYLING</span>
                      <strong>{activeLook.barberSpecs.product}</strong>
                    </div>
                  </div>
                </div>

                <div className="prescription-cta-group">
                  <button
                    type="button"
                    className={`atelier-icon-btn lg ${
                      activeLook.isFavorite ? 'hearted' : ''
                    }`}
                    onClick={() => toggleFavorite(activeLook.id)}
                    title="Favorite Look"
                  >
                    <Heart
                      size={16}
                      fill={activeLook.isFavorite ? 'currentColor' : 'none'}
                    />
                  </button>

                  <button
                    type="button"
                    className="btn-atelier-primary"
                    onClick={() =>
                      downloadBarberReferenceCard({
                        look: activeLook,
                        originalPhotoUrl,
                        faceAnalysis,
                      })
                    }
                  >
                    <Download size={15} />
                    <span>Barber Spec Card</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="prescription-dock idle-dock">
                <div>
                  <span className="mono-eyebrow">READY ON THE CHAIR</span>
                  <p>
                    Select any cut from the <strong>Style Index</strong> or tell{' '}
                    <strong>Marco</strong> how you want your sides &amp; top styled.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-atelier-surface"
                  onClick={() => setShowWebcam(true)}
                >
                  <Camera size={14} />
                  <span>Retake Selfie</span>
                </button>
              </div>
            )}

            {/* Contact-Sheet Lookbook Strip */}
            <div className="contact-sheet-strip">
              <button
                type="button"
                className={`contact-frame ${activeLookId === null ? 'active' : ''}`}
                onClick={() => setActiveLookId(null)}
              >
                <img src={originalPhotoUrl} alt="Original" />
                <span>00 · BASE</span>
              </button>

              {looks.map((look, index) => (
                <div
                  key={look.id}
                  className={`contact-frame ${
                    activeLookId === look.id ? 'active' : ''
                  }`}
                  onClick={() => setActiveLookId(look.id)}
                >
                  <img src={look.imageUrl} alt={look.title} />
                  <span>
                    {String(looks.length - index).padStart(2, '0')} · {look.title}
                  </span>
                  <button
                    type="button"
                    className="contact-remove"
                    title="Delete frame"
                    onClick={e => {
                      e.stopPropagation();
                      deleteLook(look.id);
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* RIGHT ZONE: Marco AI Master Barber Concierge */}
          <aside
            className={`atelier-column concierge-col ${
              mobilePanel === 'barber' ? 'mob-active' : ''
            }`}
          >
            <div className="col-head">
              <div className="concierge-id">
                <div className="concierge-badge">
                  <Sparkles size={14} />
                </div>
                <div>
                  <span className="mono-eyebrow">LIVE CONSULTATION</span>
                  <h2>Marco · Master Barber</h2>
                </div>
              </div>

              {looks.length > 0 && (
                <button
                  type="button"
                  className="atelier-icon-btn"
                  title="Reset mirror to original hair"
                  onClick={() => setActiveLookId(null)}
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>

            <div className="concierge-feed">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`msg-row ${msg.role}`}>
                  <div className="msg-card">
                    <p className="msg-body">{msg.content}</p>

                    {msg.suggestedPresetIds && msg.suggestedPresetIds.length > 0 && (
                      <div className="msg-prescription-list">
                        {msg.suggestedPresetIds.map(pid => {
                          const preset = HAIRCUT_PRESETS.find(x => x.id === pid);
                          if (!preset) return null;
                          const fit = computeSuitabilityScore(
                            preset,
                            faceAnalysis?.shape ?? null
                          );
                          return (
                            <button
                              key={pid}
                              type="button"
                              disabled={isGenerating}
                              className="prescription-action-ticket"
                              onClick={() => executeHaircutGeneration({ preset })}
                            >
                              <div className="ticket-avatar">
                                <HaircutSilhouette presetId={preset.id} />
                              </div>
                              <div className="ticket-meta">
                                <strong>{preset.name}</strong>
                                <span>{preset.barberSpecs.sides}</span>
                              </div>
                              <span className="ticket-fit">{fit.score}%</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {msg.triggeredLookId && (
                      <button
                        type="button"
                        className="applied-mirror-badge"
                        onClick={() => {
                          setActiveLookId(msg.triggeredLookId || null);
                          setMobilePanel('mirror');
                        }}
                      >
                        <Sparkles size={12} />
                        <span>Rendered on Mirror — Inspect Look</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isAgentThinking && (
                <div className="msg-row assistant">
                  <div className="msg-card pulsing-msg">
                    Assessing cranial proportions &amp; clipper guards…
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="prompt-pills-bar">
              {QUICK_BARBER_PROMPTS.map(q => (
                <button
                  key={q}
                  type="button"
                  disabled={isAgentThinking || isGenerating}
                  className="prompt-suggestion"
                  onClick={() => handleSendChat(q)}
                >
                  {q}
                </button>
              ))}
            </div>

            <form
              className="concierge-input-bar"
              onSubmit={e => {
                e.preventDefault();
                handleSendChat();
              }}
            >
              <input
                type="text"
                placeholder="Describe any cut, fade height, or beard tweak…"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isAgentThinking}
                className="send-ember-btn"
                aria-label="Send"
              >
                <Send size={14} />
              </button>
            </form>
          </aside>
        </main>
      )}

      {/* Mobile Bottom Dock (only when portrait is loaded on mobile) */}
      {originalPhotoUrl && (
        <nav className="mobile-atelier-dock">
          <button
            type="button"
            className={mobilePanel === 'cuts' ? 'on' : ''}
            onClick={() => setMobilePanel('cuts')}
          >
            <Scissors size={16} />
            <span>Style Index</span>
          </button>
          <button
            type="button"
            className={mobilePanel === 'mirror' ? 'on' : ''}
            onClick={() => setMobilePanel('mirror')}
          >
            <ScanFace size={16} />
            <span>Mirror</span>
          </button>
          <button
            type="button"
            className={mobilePanel === 'barber' ? 'on' : ''}
            onClick={() => setMobilePanel('barber')}
          >
            <MessageSquare size={16} />
            <span>Marco AI</span>
          </button>
        </nav>
      )}

      {showWebcam && (
        <WebcamModal
          onCapture={dataUrl => {
            setShowWebcam(false);
            ingestPortrait(dataUrl);
          }}
          onClose={() => setShowWebcam(false)}
        />
      )}

      {showCompareGrid && originalPhotoUrl && (
        <CompareGridModal
          looks={looks}
          originalPhotoUrl={originalPhotoUrl}
          faceAnalysis={faceAnalysis}
          activeLookId={activeLookId}
          onSelectLook={id => setActiveLookId(id)}
          onToggleFavorite={toggleFavorite}
          onClose={() => setShowCompareGrid(false)}
        />
      )}

      {showSettingsModal && (
        <div
          className="studio-modal-backdrop"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="studio-modal settings-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="studio-modal-header">
              <div>
                <span className="mono-eyebrow">RENDER PIPELINE</span>
                <h3>Atelier Engine Configuration</h3>
              </div>
              <button
                type="button"
                className="icon-close-btn"
                onClick={() => setShowSettingsModal(false)}
              >
                <X size={17} />
              </button>
            </div>

            <div className="settings-body">
              <div className="engine-status-box">
                <strong>478-Landmark Biometric FaceLock + Multi-GPU Cascade</strong>
                <p>
                  Every render aligns hair &amp; temple fades onto your exact ocular
                  coordinates and restores 100% of your real face so it never
                  replaces you with a stranger.
                </p>
              </div>

              <label className="settings-field-label">
                Optional Free Hugging Face Token (25× Priority GPU Quota)
                <input
                  type="password"
                  placeholder="hf_... (optional — huggingface.co/settings/tokens)"
                  value={draftHfToken}
                  onChange={e => setDraftHfToken(e.target.value)}
                />
              </label>

              <label className="settings-field-label">
                Optional Google Gemini API Key (Gemini Pro Multimodal Studio)
                <input
                  type="password"
                  placeholder="AIzaSy... (optional — leave blank for free built-in GPUs)"
                  value={draftGeminiKey}
                  onChange={e => setDraftGeminiKey(e.target.value)}
                />
              </label>
              <p className="settings-help-note">
                Stored locally in your browser only. Works out-of-the-box with zero
                keys required.
              </p>
            </div>

            <div className="webcam-footer">
              <button
                type="button"
                className="btn-atelier-surface"
                onClick={() => {
                  setDraftGeminiKey('');
                  setDraftHfToken('');
                }}
              >
                Clear
              </button>
              <button
                type="button"
                className="btn-atelier-primary"
                onClick={saveSettings}
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
