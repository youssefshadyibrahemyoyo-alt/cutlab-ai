import React from 'react';
import { Check, Download, Heart, X } from 'lucide-react';
import type { FaceAnalysis, GeneratedLook } from '../types/cutlab';
import { downloadBarberReferenceCard } from '../lib/barberCardExport';

type Props = {
  looks: GeneratedLook[];
  originalPhotoUrl: string;
  faceAnalysis: FaceAnalysis | null;
  activeLookId: string | null;
  onSelectLook: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
};

export const CompareGridModal: React.FC<Props> = ({
  looks,
  originalPhotoUrl,
  faceAnalysis,
  activeLookId,
  onSelectLook,
  onToggleFavorite,
  onClose,
}) => {
  return (
    <div className="studio-modal-backdrop" onClick={onClose}>
      <div
        className="studio-modal compare-grid-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="studio-modal-header">
          <div>
            <h3>Side-by-Side Haircut Showdown</h3>
            <p>
              Compare every cut on your exact bone structure &amp; export your winner for your barber
            </p>
          </div>
          <button type="button" className="icon-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="compare-cards-grid">
          {/* Always include Starting Photo first for clear baseline reference */}
          <div className="compare-card baseline-card">
            <div className="compare-img-wrap">
              <img src={originalPhotoUrl} alt="Original starting look" />
              <span className="compare-tag">STARTING PHOTO</span>
            </div>
            <div className="compare-card-body">
              <h4>Your Current Hair</h4>
              <p className="compare-spec-line">
                {faceAnalysis
                  ? `Detected ${faceAnalysis.label} Face · ${faceAnalysis.jawDefinition} Jaw`
                  : 'Baseline Reference'}
              </p>
            </div>
          </div>

          {looks.map(look => {
            const isSelected = look.id === activeLookId;
            return (
              <div
                key={look.id}
                className={`compare-card ${isSelected ? 'selected-winner' : ''}`}
              >
                <div className="compare-img-wrap">
                  <img src={look.imageUrl} alt={look.title} />
                  {look.matchScore && (
                    <span className="compare-match-badge">
                      {look.matchScore}% Match
                    </span>
                  )}
                  <button
                    type="button"
                    className={`compare-fav-btn ${look.isFavorite ? 'fav-on' : ''}`}
                    onClick={() => onToggleFavorite(look.id)}
                    title="Favorite this look"
                  >
                    <Heart size={15} fill={look.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <div className="compare-card-body">
                  <h4>{look.title}</h4>
                  <p className="compare-spec-line">
                    <strong>Sides:</strong> {look.barberSpecs.sides}
                  </p>
                  <p className="compare-spec-line">
                    <strong>Top:</strong> {look.barberSpecs.top}
                  </p>
                  <div className="compare-card-actions">
                    <button
                      type="button"
                      className="secondary-studio-btn"
                      onClick={() => {
                        onSelectLook(look.id);
                        onClose();
                      }}
                    >
                      <Check size={14} />
                      <span>Inspect in Mirror</span>
                    </button>
                    <button
                      type="button"
                      className="gold-outline-btn"
                      onClick={() =>
                        downloadBarberReferenceCard({
                          look,
                          originalPhotoUrl,
                          faceAnalysis,
                        })
                      }
                    >
                      <Download size={14} />
                      <span>Barber Card</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
