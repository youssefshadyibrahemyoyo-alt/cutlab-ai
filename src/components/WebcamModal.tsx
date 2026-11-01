import React, { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

type Props = {
  onCapture: (rawDataUrl: string) => void;
  onClose: () => void;
};

export const WebcamModal: React.FC<Props> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1080 }, height: { ideal: 1080 }, facingMode: 'user' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        setError(
          'Camera access was declined or unavailable. You can upload a portrait photo instead.'
        );
      }
    })();

    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const snapPhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth || 1024;
    const h = video.videoHeight || 1024;
    const side = Math.min(w, h);
    const sx = Math.round((w - side) / 2);
    const sy = Math.round((h - side) / 2);

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror horizontally so selfie matches what user sees in mirror
    ctx.translate(1024, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, side, side, 0, 0, 1024, 1024);
    onCapture(canvas.toDataURL('image/jpeg', 0.92));
  };

  return (
    <div className="studio-modal-backdrop" onClick={onClose}>
      <div className="studio-modal webcam-modal" onClick={e => e.stopPropagation()}>
        <div className="studio-modal-header">
          <div>
            <h3>Barber Mirror Camera</h3>
            <p>Look straight ahead with even lighting and forehead visible</p>
          </div>
          <button type="button" className="icon-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="webcam-stage">
          {error ? (
            <div className="webcam-error">{error}</div>
          ) : (
            <>
              <video ref={videoRef} playsInline muted className="webcam-video" />
              <div className="webcam-oval-guide" />
            </>
          )}
        </div>

        <div className="webcam-footer">
          <button type="button" className="secondary-studio-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="gold-primary-btn"
            disabled={!ready}
            onClick={snapPhoto}
          >
            <Camera size={16} />
            <span>Snap Portrait</span>
          </button>
        </div>
      </div>
    </div>
  );
};
