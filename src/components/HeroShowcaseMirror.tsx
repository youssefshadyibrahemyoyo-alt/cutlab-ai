import React, { useCallback, useRef, useState } from 'react';
import { MoveHorizontal } from 'lucide-react';

type Props = {
  onLaunchDemo: () => void;
};

/**
 * Interactive 60fps draggable Before / After showcase right on the Landing Hero
 * using our pixel-locked /demo-portrait.jpg <-> /demo-after.jpg pair.
 */
export const HeroShowcaseMirror: React.FC<Props> = ({ onLaunchDemo }) => {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [split, setSplit] = useState(50);
  const [dragging, setDragging] = useState(false);

  const updateFromX = useCallback((clientX: number) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplit(Math.max(6, Math.min(94, pct)));
  }, []);

  return (
    <div className="hero-showcase-card">
      <div className="hero-showcase-hud-top">
        <span className="hud-dot-live" />
        <span className="hud-mono">LIVE FACELOCK DEMO · DRAG TO INSPECT</span>
        <span className="hud-fit-tag">97% FIT</span>
      </div>

      <div
        ref={frameRef}
        className="hero-mirror-frame"
        onPointerDown={e => {
          setDragging(true);
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          updateFromX(e.clientX);
        }}
        onPointerMove={e => {
          if (dragging) updateFromX(e.clientX);
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        <img
          src="/demo-after.jpg"
          alt="After French Crop and Mid Drop Fade"
          className="hero-mirror-img"
          draggable={false}
        />

        <div
          className="hero-mirror-before"
          style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
        >
          <img
            src="/demo-portrait.jpg"
            alt="Original starting hair"
            className="hero-mirror-img"
            draggable={false}
          />
        </div>

        {/* Corner Viewfinder Ticks */}
        <span className="vf-tick vf-tl" />
        <span className="vf-tick vf-tr" />
        <span className="vf-tick vf-bl" />
        <span className="vf-tick vf-br" />

        <div className="hero-split-label left">BEFORE</div>
        <div className="hero-split-label right">FRENCH CROP · #0.5 DROP</div>

        <div className="hero-split-line" style={{ left: `${split}%` }}>
          <div className="hero-split-handle">
            <MoveHorizontal size={15} />
          </div>
        </div>
      </div>

      <div className="hero-showcase-footer">
        <div className="hero-spec-readout">
          <div>
            <span>SIDES</span>
            <strong>#0 → #1.5 Mid Drop</strong>
          </div>
          <div>
            <span>TOP</span>
            <strong>4.5cm Point-Cut Crop</strong>
          </div>
          <div>
            <span>IDENTITY</span>
            <strong>100% FaceLock</strong>
          </div>
        </div>

        <button
          type="button"
          className="hero-open-model-btn"
          onClick={onLaunchDemo}
        >
          Open in Studio →
        </button>
      </div>
    </div>
  );
};
