import React, { useMemo, useRef, useState } from 'react';
import {
  Camera,
  Columns2,
  Download,
  Heart,
  Info,
  KeyRound,
  Layers,
  MessageSquare,
  RotateCcw,
  ScanFace,
  Scissors,
  Send,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
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

const GEMINI_KEY_STORAGE = 'cutlab_gemini_api_key_v1';

const CATEGORY_TABS: { id: HaircutCategory; label: string }[] = [
  { id: 'all', label: 'Top Matches' },
  { id: 'fades', label: 'Fades & Crops' },
  { id: 'textured', label: 'Textured' },
  { id: 'curls_flow', label: 'Curls & Flow' },
  { id: 'short_classic', label: 'Buzz & Classic' },
];

const QUICK_BARBER_PROMPTS = [
  'Which 3 cuts suit my face shape best?',
  'Give me a low taper with messy textured fringe',
  'Try a #2 buzz cut with mid skin fade & 3mm stubble',
  'Give me Old Money classic scissor flow',
];

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

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

  // Modals & Mobile Tabs
  const [showWebcam, setShowWebcam] = useState(false);
  const [showCompareGrid, setShowCompareGrid] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'mirror' | 'cuts' | 'barber'>('mirror');

  // Optional BYOK Pro Key
  const [geminiApiKey, setGeminiApiKey] = useState<string>(
    () => localStorage.getItem(GEMINI_KEY_STORAGE) || ''
  );
  const [draftGeminiKey, setDraftGeminiKey] = useState<string>(geminiApiKey);

  // AI Master Barber Chat
  const [chatMessages, setChatMessages] = useState<BarberChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Welcome to CutLab Studio — I'm Marco, your AI Master Barber. Drop a portrait photo (or load the Studio Demo) and I'll scan your jawline & facial thirds, rank your highest-match cuts, and render any hairstyle directly on your photo.",
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

  const ingestPortrait = async (rawSourceUrl: string) => {
    setErrorBanner(null);
    setIsScanningFace(true);
    try {
      const squareDataUrl = await normalizePortraitToSquare(rawSourceUrl);
      setOriginalPhotoUrl(squareDataUrl);
      setLooks([]);
      setActiveLookId(null);
      setShowMesh(true);

      const analysis = await analyzePortraitFace(squareDataUrl);
      setFaceAnalysis(analysis);

      // Compute top 3 cuts for this exact face shape
      const topCuts = [...HAIRCUT_PRESETS]
        .map(p => ({ p, s: computeSuitabilityScore(p, analysis.shape).score }))
        .sort((a, b) => b.s - a.s)
        .slice(0, 3);

      setChatMessages([
        {
          id: uid(),
          role: 'assistant',
          content: `Biometric scan locked: **${analysis.label} Face** (${analysis.jawDefinition} jawline, L/W ratio ${analysis.lengthToWidthRatio}). ${analysis.barberSummary}\n\nTap one of my top recommendations below or tell me any cut, guard length, or beard style you want to test.`,
          suggestedPresetIds: topCuts.map(x => x.p.id),
          createdAt: new Date().toISOString(),
        },
      ]);

      // Auto-hide mesh overlay after 3.2s so portrait stays crisp
      setTimeout(() => setShowMesh(false), 3200);
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

    const matchScore = opts.preset
      ? computeSuitabilityScore(opts.preset, faceAnalysis?.shape ?? null).score
      : faceAnalysis
      ? 92
      : null;

    try {
      const { imageDataUrl, engineUsed } = await generateHaircutTransformation({
        sourceDataUrl,
        prompt: finalPrompt,
        geminiApiKey,
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
          : 'Haircut generation encountered a GPU queue error. Please try again.'
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
        : 'User has not uploaded a photo yet — advise them warmly and invite them to upload or click Studio Demo.';

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

      // Automatically trigger live haircut render if the user has a portrait loaded and asked to try/change a look!
      if (agentRes.shouldGenerate && originalPhotoUrl && agentRes.imagePrompt) {
        const rendered = await executeHaircutGeneration({
          overrideTitle: agentRes.cutTitle,
          overrideSpecs: agentRes.barberSpecs,
          rawEnginePrompt: agentRes.imagePrompt,
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
              ? `Heads up: ${err.message}`
              : 'My consultation line glitched briefly — try sending that again!',
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
    const trimmed = draftGeminiKey.trim();
    setGeminiApiKey(trimmed);
    if (trimmed) {
      localStorage.setItem(GEMINI_KEY_STORAGE, trimmed);
    } else {
      localStorage.removeItem(GEMINI_KEY_STORAGE);
    }
    setShowSettingsModal(false);
  };

  return (
    <div className="cutlab-shell">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Top Studio Header */}
      <header className="cutlab-topbar">
        <div className="brand-cluster">
          <div className="brand-mark">
            <Scissors size={18} />
          </div>
          <div>
            <div className="brand-title">CutLab AI</div>
            <div className="brand-subtitle">Men’s Virtual Barber Studio</div>
          </div>
        </div>

        <div className="topbar-center-controls">
          {faceAnalysis && (
            <button
              type="button"
              className="biometric-status-pill"
              onClick={() => setShowBiometricDrawer(v => !v)}
              title="Click for full 3D facial ratio breakdown"
            >
              <ScanFace size={15} />
              <span>
                <strong>{faceAnalysis.label} Face</strong> · {faceAnalysis.jawDefinition}
              </span>
              <Info size={13} className="muted-icon" />
            </button>
          )}

          {originalPhotoUrl && looks.length > 0 && (
            <div className="edit-mode-segmented" title="Choose whether new edits apply to your original photo or stack onto the current haircut">
              <button
                type="button"
                className={editSourceMode === 'original' ? 'active' : ''}
                onClick={() => setEditSourceMode('original')}
              >
                From Original
              </button>
              <button
                type="button"
                className={editSourceMode === 'chain' ? 'active' : ''}
                onClick={() => setEditSourceMode('chain')}
              >
                <Layers size={13} />
                Refine Current
              </button>
            </div>
          )}
        </div>

        <div className="topbar-actions">
          {originalPhotoUrl && (
            <button
              type="button"
              className="topbar-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Upload a different portrait"
            >
              <Upload size={15} />
              <span className="hide-sm">New Photo</span>
            </button>
          )}

          {looks.length > 0 && (
            <button
              type="button"
              className="topbar-btn highlight"
              onClick={() => setShowCompareGrid(true)}
            >
              <Columns2 size={15} />
              <span>Compare ({looks.length})</span>
            </button>
          )}

          <button
            type="button"
            className="topbar-btn"
            onClick={() => {
              setDraftGeminiKey(geminiApiKey);
              setShowSettingsModal(true);
            }}
            title="AI Engine Settings (Free Built-In + Optional Pro Key)"
          >
            <KeyRound size={15} />
            <span className="hide-sm">
              {geminiApiKey ? 'Pro Key Active' : 'Free GPU Ready'}
            </span>
          </button>
        </div>
      </header>

      {/* Expandable Biometric Face Breakdown Popover */}
      {showBiometricDrawer && faceAnalysis && (
        <div className="biometric-Popover">
          <div className="biometric-popover-head">
            <div>
              <h4>3D Facial Proportion Report — {faceAnalysis.label} Structure</h4>
              <p>{faceAnalysis.barberSummary}</p>
            </div>
            <button
              type="button"
              className="icon-close-btn"
              onClick={() => setShowBiometricDrawer(false)}
            >
              <X size={16} />
            </button>
          </div>
          <div className="biometric-metrics-row">
            <div className="bio-stat">
              <span>Length / Width</span>
              <strong>{faceAnalysis.lengthToWidthRatio}</strong>
            </div>
            <div className="bio-stat">
              <span>Jaw / Cheekbone</span>
              <strong>{faceAnalysis.jawToCheekRatio}</strong>
            </div>
            <div className="bio-stat">
              <span>Forehead / Cheek</span>
              <strong>{faceAnalysis.foreheadToCheekRatio}</strong>
            </div>
            <div className="bio-stat">
              <span>Facial Thirds</span>
              <strong>
                {faceAnalysis.upperThirdPct}% · {faceAnalysis.middleThirdPct}% ·{' '}
                {faceAnalysis.lowerThirdPct}%
              </strong>
            </div>
          </div>
          <div className="bio-caution-note">
            <strong>Barber Watchout:</strong> {faceAnalysis.avoidNote}
          </div>
        </div>
      )}

      {/* Main 3-Column Studio Workspace */}
      <main className="studio-grid">
        {/* LEFT COLUMN: Barbershop Haircut Catalog & Modifiers */}
        <aside
          className={`studio-panel catalog-panel ${
            mobilePanel === 'cuts' ? 'mobile-visible' : ''
          }`}
        >
          <div className="panel-header-row">
            <div>
              <h2>Barbershop Cuts</h2>
              <p>
                {faceAnalysis
                  ? `Ranked for your ${faceAnalysis.label} bone structure`
                  : '16 signature men’s cuts with guard specs'}
              </p>
            </div>
            <button
              type="button"
              className={`modifier-toggle-btn ${
                showModifiers ||
                fade !== 'preset_default' ||
                beard !== 'keep_current' ||
                hairColor !== 'natural'
                  ? 'active'
                  : ''
              }`}
              onClick={() => setShowModifiers(v => !v)}
            >
              <SlidersHorizontal size={14} />
              <span>Customize</span>
            </button>
          </div>

          {/* Collapsible Fade / Beard / Color Fine-Tuning */}
          {showModifiers && (
            <div className="modifiers-drawer">
              <div className="mod-group">
                <label>Side Fade Override</label>
                <div className="mod-chips">
                  {FADE_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`mod-chip ${fade === opt.id ? 'selected' : ''}`}
                      onClick={() => setFade(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mod-group">
                <label>Beard &amp; Stubble</label>
                <div className="mod-chips">
                  {BEARD_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`mod-chip ${beard === opt.id ? 'selected' : ''}`}
                      onClick={() => setBeard(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mod-group">
                <label>Hair Color</label>
                <div className="color-swatches-row">
                  {HAIR_COLOR_OPTIONS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className={`color-swatch-pill ${
                        hairColor === c.id ? 'selected' : ''
                      }`}
                      onClick={() => setHairColor(c.id)}
                    >
                      <span
                        className="swatch-dot"
                        style={{ background: c.swatch }}
                      />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Category Filter Bar */}
          <div className="category-scroll-bar">
            {CATEGORY_TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`cat-pill ${category === tab.id ? 'active' : ''}`}
                onClick={() => setCategory(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Ranked Preset Cards */}
          <div className="presets-list">
            {rankedPresets.map(({ preset, suitability }) => {
              const isCurrent = activeLook?.presetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  disabled={isGenerating}
                  className={`preset-card ${isCurrent ? 'active-preset' : ''}`}
                  onClick={() => {
                    if (!originalPhotoUrl) {
                      ingestPortrait('/demo-portrait.jpg');
                      return;
                    }
                    executeHaircutGeneration({ preset });
                  }}
                >
                  <div className="preset-card-top">
                    <span className="preset-name">{preset.name}</span>
                    <span
                      className={`match-pill ${
                        suitability.score >= 92 ? 'ideal' : ''
                      }`}
                    >
                      {faceAnalysis ? `${suitability.score}% Fit` : preset.maintenance}
                    </span>
                  </div>
                  <p className="preset-tagline">{preset.tagline}</p>
                  <div className="preset-guard-meta">
                    <span>{preset.barberSpecs.sides}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* CENTER COLUMN: Interactive Barber Mirror & Lookbook */}
        <section
          className={`studio-center ${
            mobilePanel === 'mirror' ? 'mobile-visible' : ''
          }`}
        >
          {errorBanner && (
            <div className="studio-error-banner">
              <span>{errorBanner}</span>
              <button type="button" onClick={() => setErrorBanner(null)}>
                <X size={15} />
              </button>
            </div>
          )}

          {!originalPhotoUrl ? (
            <div
              className="intake-dropzone"
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
            >
              <div className="intake-emblem">
                <Scissors size={28} />
              </div>
              <h1>Find the Haircut Built for Your Face</h1>
              <p className="intake-lead">
                Upload a front-facing photo or snap a live selfie. CutLab scans your
                jawline &amp; facial proportions, lets you try unlimited fades, crops,
                curls &amp; beards with real AI, and prints a Guard Spec Card for your
                barber.
              </p>

              <div className="intake-cta-row">
                <button
                  type="button"
                  className="gold-primary-btn lg"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={17} />
                  <span>Upload Your Photo</span>
                </button>

                <button
                  type="button"
                  className="secondary-studio-btn lg"
                  onClick={() => setShowWebcam(true)}
                >
                  <Camera size={17} />
                  <span>Use Camera</span>
                </button>

                <button
                  type="button"
                  className="demo-portrait-btn lg"
                  onClick={() => ingestPortrait('/demo-portrait.jpg')}
                >
                  <UserCheck size={17} />
                  <span>Try Studio Demo</span>
                </button>
              </div>

              <div className="intake-trust-note">
                100% Free out of the box · Preserves your exact facial identity · Drag &amp; drop supported
              </div>
            </div>
          ) : (
            <>
              <SplitCompareCanvas
                originalPhotoUrl={originalPhotoUrl}
                activeLook={activeLook}
                faceAnalysis={faceAnalysis}
                showMesh={showMesh || isScanningFace}
                onToggleMesh={() => setShowMesh(v => !v)}
                isGenerating={isGenerating}
                generationStatus={generationStatus}
              />

              {/* Active Cut Spec Bar + Export Barber Card */}
              {activeLook ? (
                <div className="active-spec-bar">
                  <div className="spec-bar-main">
                    <div className="spec-bar-title-row">
                      <h3>{activeLook.title}</h3>
                      {activeLook.matchScore && (
                        <span className="match-pill ideal">
                          {activeLook.matchScore}% Face Match
                        </span>
                      )}
                    </div>
                    <div className="spec-bar-guards">
                      <span>
                        <strong>Sides:</strong> {activeLook.barberSpecs.sides}
                      </span>
                      <span>
                        <strong>Top:</strong> {activeLook.barberSpecs.top}
                      </span>
                      <span>
                        <strong>Beard:</strong> {activeLook.barberSpecs.beard}
                      </span>
                    </div>
                  </div>

                  <div className="spec-bar-actions">
                    <button
                      type="button"
                      className={`icon-action-btn ${
                        activeLook.isFavorite ? 'fav-active' : ''
                      }`}
                      onClick={() => toggleFavorite(activeLook.id)}
                      title="Save to Favorites"
                    >
                      <Heart
                        size={16}
                        fill={activeLook.isFavorite ? 'currentColor' : 'none'}
                      />
                    </button>

                    <button
                      type="button"
                      className="gold-primary-btn"
                      onClick={() =>
                        downloadBarberReferenceCard({
                          look: activeLook,
                          originalPhotoUrl,
                          faceAnalysis,
                        })
                      }
                    >
                      <Download size={15} />
                      <span>Show My Barber Card</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="active-spec-bar prompt-hint-bar">
                  <div>
                    <strong>Ready to style:</strong> Pick any cut on the left or ask
                    Marco on the right to preview your first transformation.
                  </div>
                  <button
                    type="button"
                    className="secondary-studio-btn"
                    onClick={() => setShowWebcam(true)}
                  >
                    <Camera size={14} />
                    <span>Retake Camera</span>
                  </button>
                </div>
              )}

              {/* Lookbook Filmstrip */}
              <div className="lookbook-strip">
                <button
                  type="button"
                  className={`film-thumb ${activeLookId === null ? 'selected' : ''}`}
                  onClick={() => setActiveLookId(null)}
                >
                  <img src={originalPhotoUrl} alt="Original hair" />
                  <span>Original</span>
                </button>

                {looks.map(look => (
                  <div
                    key={look.id}
                    className={`film-thumb ${
                      activeLookId === look.id ? 'selected' : ''
                    }`}
                    onClick={() => setActiveLookId(look.id)}
                  >
                    <img src={look.imageUrl} alt={look.title} />
                    <span>{look.title}</span>
                    <button
                      type="button"
                      className="thumb-delete"
                      title="Remove look"
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
            </>
          )}
        </section>

        {/* RIGHT COLUMN: Conversational AI Master Barber Agent */}
        <aside
          className={`studio-panel barber-chat-panel ${
            mobilePanel === 'barber' ? 'mobile-visible' : ''
          }`}
        >
          <div className="panel-header-row">
            <div className="barber-persona">
              <div className="persona-avatar">
                <Sparkles size={15} />
              </div>
              <div>
                <h2>Marco · AI Barber</h2>
                <p>Consultation + Live Hair Sculpting</p>
              </div>
            </div>
            {looks.length > 0 && (
              <button
                type="button"
                className="reset-chat-btn"
                title="View original starting hair"
                onClick={() => setActiveLookId(null)}
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          <div className="chat-messages-scroll">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`chat-bubble-row ${msg.role}`}>
                <div className="chat-bubble">
                  <p className="chat-text">{msg.content}</p>

                  {msg.suggestedPresetIds && msg.suggestedPresetIds.length > 0 && (
                    <div className="chat-suggested-cuts">
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
                            className="chat-cut-chip"
                            onClick={() => executeHaircutGeneration({ preset })}
                          >
                            <Scissors size={12} />
                            <span>
                              Try {preset.name} ({fit.score}%)
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {msg.triggeredLookId && (
                    <button
                      type="button"
                      className="chat-view-look-chip"
                      onClick={() => {
                        setActiveLookId(msg.triggeredLookId || null);
                        setMobilePanel('mirror');
                      }}
                    >
                      <Sparkles size={12} />
                      <span>Applied to Mirror — Click to Inspect</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isAgentThinking && (
              <div className="chat-bubble-row assistant">
                <div className="chat-bubble thinking-bubble">
                  <span>Marco is sizing up your proportions…</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="quick-prompts-strip">
            {QUICK_BARBER_PROMPTS.map(q => (
              <button
                key={q}
                type="button"
                disabled={isAgentThinking || isGenerating}
                className="quick-prompt-chip"
                onClick={() => handleSendChat(q)}
              >
                {q}
              </button>
            ))}
          </div>

          <form
            className="chat-composer"
            onSubmit={e => {
              e.preventDefault();
              handleSendChat();
            }}
          >
            <input
              type="text"
              placeholder={
                originalPhotoUrl
                  ? 'Ask Marco or describe any haircut (“burst fade curls + 3mm stubble”)…'
                  : 'Ask Marco for advice or upload a photo first…'
              }
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isAgentThinking}
              className="chat-send-btn"
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </form>
        </aside>
      </main>

      {/* Mobile Studio Bottom Tab Switcher */}
      <nav className="mobile-studio-dock">
        <button
          type="button"
          className={mobilePanel === 'cuts' ? 'active' : ''}
          onClick={() => setMobilePanel('cuts')}
        >
          <Scissors size={17} />
          <span>Cuts</span>
        </button>
        <button
          type="button"
          className={mobilePanel === 'mirror' ? 'active' : ''}
          onClick={() => setMobilePanel('mirror')}
        >
          <ScanFace size={17} />
          <span>Mirror</span>
        </button>
        <button
          type="button"
          className={mobilePanel === 'barber' ? 'active' : ''}
          onClick={() => setMobilePanel('barber')}
        >
          <MessageSquare size={17} />
          <span>AI Barber</span>
        </button>
      </nav>

      {/* Live Webcam Modal */}
      {showWebcam && (
        <WebcamModal
          onCapture={dataUrl => {
            setShowWebcam(false);
            ingestPortrait(dataUrl);
          }}
          onClose={() => setShowWebcam(false)}
        />
      )}

      {/* Side-by-Side Winner Showdown Modal */}
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

      {/* Engine Settings Modal (Zero-Key Default + Optional BYOK Gemini Pro) */}
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
                <h3>AI Barber Engine Settings</h3>
                <p>CutLab works 100% free out-of-the-box — no paid key needed</p>
              </div>
              <button
                type="button"
                className="icon-close-btn"
                onClick={() => setShowSettingsModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="settings-body">
              <div className="engine-status-box">
                <div>
                  <strong>Default Free Studio Engine (Active)</strong>
                  <p>
                    Uses <code>FLUX.1-Kontext</code> identity-preserving portrait
                    editing + MediaPipe 478-point 3D facial geometry + Marco AI
                    Barber Agent with zero API keys required.
                  </p>
                </div>
              </div>

              <label className="settings-field-label">
                Optional Google Gemini API Key (Pro Multimodal Mode)
                <input
                  type="password"
                  placeholder="AIzaSy... (leave blank to use free built-in engine)"
                  value={draftGeminiKey}
                  onChange={e => setDraftGeminiKey(e.target.value)}
                />
              </label>
              <p className="settings-help-note">
                Stored strictly in your browser’s <code>localStorage</code>. Adding a
                free Google AI Studio key unlocks direct multimodal Gemini 2.5 Flash
                photo inspection &amp; Gemini Image Studio priority rendering.
              </p>
            </div>

            <div className="webcam-footer">
              <button
                type="button"
                className="secondary-studio-btn"
                onClick={() => {
                  setDraftGeminiKey('');
                }}
              >
                Clear Key
              </button>
              <button
                type="button"
                className="gold-primary-btn"
                onClick={saveSettings}
              >
                Save Engine Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
