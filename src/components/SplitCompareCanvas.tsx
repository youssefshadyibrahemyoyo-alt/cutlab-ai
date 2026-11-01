import React, { useCallback, useRef, useState } from 'react';
import { Eye, Sparkles, ScanFace } from 'lucide-react';
import type { FaceAnalysis, GeneratedLook } from '../types/cutlab';

type Props = {
  originalPhotoUrl: string;
  activeLook: GeneratedLook | null;
  faceAnalysis: FaceAnalysis | null;
  showMesh: boolean;
  onToggleMesh: () => void;
  isGenerating: boolean;
  generationStatus: string;
};

export const SplitCompareCanvas: React.FC<Props> = ({
  originalPhotoUrl,
  activeLook,
  faceAnalysis,
  showMesh,
  onToggleMesh,
  isGenerating,
  generationStatus,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [splitPct, setSplitPct] = useState<number>(52);
  const [dragging, setDragging] = useState(false);
  const [holdOriginal, setHoldOriginal] = useState(false);

  const updateSplitFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplitPct(Math.max(4, Math.min(96, pct)));
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!activeLook || isGenerating) return;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updateSplitFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    updateSplitFromClientX(e.clientX);
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  const renderBiometricOverlay = () => {
    if (!showMesh || !faceAnalysis || faceAnalysis.landmarks2D.length < 400) {
      return null;
    }
    const pts = faceAnalysis.landmarks2D;
    const contourPath = faceAnalysis.contourIndices
      .map((idx, i) => {
        const p = pts[idx];
        if (!p) return '';
        return `${i === 0 ? 'M' : 'L'} ${(p.x * 1000).toFixed(1)} ${(p.y * 1000).toFixed(1)}`;
      })
      .join(' ');

    const leftCheek = pts[234];
    const rightCheek = pts[454];
    const leftJaw = pts[172];
    const rightJaw = pts[397];
    const leftForehead = pts[103];
    const rightForehead = pts[332];
    const topForehead = pts[10];
    const chin = pts[152];

    return (
      <svg
        className="biometric-svg-overlay"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
      >
        <path
          d={contourPath}
          fill="rgba(212, 168, 83, 0.06)"
          stroke="rgba(229, 193, 112, 0.78)"
          strokeWidth="2.4"
          strokeDasharray="8 5"
        />
        {/* Forehead span */}
        <line
          x1={leftForehead.x * 1000}
          y1={leftForehead.y * 1000}
          x2={rightForehead.x * 1000}
          y2={rightForehead.y * 1000}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1.8"
          strokeDasharray="4 4"
        />
        {/* Cheekbone span */}
        <line
          x1={leftCheek.x * 1000}
          y1={leftCheek.y * 1000}
          x2={rightCheek.x * 1000}
          y2={rightCheek.y * 1000}
          stroke="#E5C170"
          strokeWidth="2.4"
        />
        {/* Jaw width span */}
        <line
          x1={leftJaw.x * 1000}
          y1={leftJaw.y * 1000}
          x2={rightJaw.x * 1000}
          y2={rightJaw.y * 1000}
          stroke="rgba(96, 165, 250, 0.8)"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
        {/* Vertical symmetry axis */}
        <line
          x1={topForehead.x * 1000}
          y1={topForehead.y * 1000}
          x2={chin.x * 1000}
          y2={chin.y * 1000}
          stroke="rgba(229, 193, 112, 0.45)"
          strokeWidth="1.5"
        />
        {[leftCheek, rightCheek, leftJaw, rightJaw, leftForehead, rightForehead, topForehead, chin].map(
          (p, idx) => (
            <circle
              key={idx}
              cx={p.x * 1000}
              cy={p.y * 1000}
              r="5.5"
              fill="#09090B"
              stroke="#E5C170"
              strokeWidth="2.5"
            />
          )
        )}
      </svg>
    );
  };

  const hasComparison = Boolean(activeLook && !holdOriginal);

  return (
    <div className="mirror-stage-wrap">
      <div
        ref={containerRef}
        className={`mirror-viewport ${activeLook ? 'interactive-split' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Base Layer: Either Generated After Look (when active) or Original Portrait */}
        <img
          src={hasComparison && activeLook ? activeLook.imageUrl : originalPhotoUrl}
          alt={hasComparison && activeLook ? activeLook.title : 'Original portrait'}
          className="mirror-img"
          draggable={false}
        />

        {/* Clipped Left Curtain: Original Before Photo when comparing */}
        {hasComparison && activeLook && (
          <div
            className="mirror-before-curtain"
            style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
          >
            <img
              src={originalPhotoUrl}
              alt="Before original hair"
              className="mirror-img"
              draggable={false}
            />
          </div>
        )}

        {/* Biometric Face Mesh Overlay */}
        {renderBiometricOverlay()}

        {/* Split Divider Handle */}
        {hasComparison && activeLook && !isGenerating && (
          <>
            <div className="split-badge split-badge-left">BEFORE</div>
            <div className="split-badge split-badge-right">AFTER · {activeLook.engineUsed}</div>
            <div
              className="split-divider-line"
              style={{ left: `${splitPct}%` }}
            >
              <div className="split-divider-knob" title="Drag left/right to compare">
                <span>◀</span>
                <span>▶</span>
              </div>
            </div>
          </>
        )}

        {/* Floating Corner Controls */}
        <div className="mirror-floating-controls">
          {faceAnalysis && faceAnalysis.landmarks2D.length > 0 && (
            <button
              type="button"
              className={`mirror-pill-btn ${showMesh ? 'active' : ''}`}
              onClick={e => {
                e.stopPropagation();
                onToggleMesh();
              }}
            >
              <ScanFace size={14} />
              <span>{showMesh ? 'Hide Face Mesh' : 'Face Mesh'}</span>
            </button>
          )}

          {activeLook && (
            <button
              type="button"
              className={`mirror-pill-btn ${holdOriginal ? 'active' : ''}`}
              onPointerDown={e => {
                e.stopPropagation();
                setHoldOriginal(true);
              }}
              onPointerUp={e => {
                e.stopPropagation();
                setHoldOriginal(false);
              }}
              onPointerLeave={() => setHoldOriginal(false)}
            >
              <Eye size={14} />
              <span>Hold Original</span>
            </button>
          )}
        </div>

        {/* Live AI Sculpting Overlay */}
        {isGenerating && (
          <div className="mirror-generating-overlay">
            <div className="scanner-laser-line" />
            <div className="generating-status-card">
              <Sparkles size={20} className="spin-pulse" />
              <div>
                <div className="generating-title">AI Master Barber Working…</div>
                <div className="generating-sub">{generationStatus}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
