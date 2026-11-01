import React from 'react';

type Props = {
  presetId: string;
};

/**
 * Bespoke architectural men's head + hair vector illustrations for all 16 barbershop cuts.
 * Uses currentColor so it adapts seamlessly between Noir Atelier and Alabaster Salon themes.
 */
export const HaircutSilhouette: React.FC<Props> = ({ presetId }) => {
  const uid = `fade-${presetId}`;

  const renderHairPath = () => {
    switch (presetId) {
      case 'buzz-cut-mid-skin-fade':
        return (
          <>
            <path
              d="M19 27C19 16.5 24.5 12 32 12C39.5 12 45 16.5 45 27C43.2 24.2 38 22.8 32 22.8C26 22.8 20.8 24.2 19 27Z"
              fill="currentColor"
              fillOpacity="0.88"
            />
            <path
              d="M19.5 27C19.5 31 19.5 33 20.5 34.5M44.5 27C44.5 31 44.5 33 43.5 34.5"
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="1.5"
              strokeDasharray="1.5 2"
            />
          </>
        );

      case 'french-crop-mid-drop':
      case 'edgar-high-taper':
        return (
          <path
            d="M18.5 27.5C18 16 23.5 10.5 32 10.5C40.5 10.5 46 16 45.5 27.5L43 24.8L40.5 25.5L37.5 24.5L34.5 25.5L32 24.5L29.5 25.5L26.5 24.5L23.5 25.5L21 24.8L18.5 27.5Z"
            fill="currentColor"
          />
        );

      case 'low-taper-textured-fringe':
        return (
          <path
            d="M18 29C17 16 22.5 9.5 32 9.5C41.5 9.5 47 16 46 29L43.2 26L40.2 28.2L37.5 25.5L34.5 28.8L31.5 25.8L28.5 28.8L25.5 25.6L22.2 28L18 29Z"
            fill="currentColor"
          />
        );

      case 'burst-fade-messy-curls':
      case 'curly-drop-fade':
        return (
          <path
            d="M18.5 27.5C16.5 24 17 19.5 19.8 17C19.5 13 23 10 26.8 11C28.8 8.2 35.2 8.2 37.2 11C41 10 44.5 13 44.2 17C47 19.5 47.5 24 45.5 27.5C43 24.8 40.5 26.5 37.5 25C35 27.2 29 27.2 26.5 25C23.5 26.5 21 24.8 18.5 27.5Z"
            fill="currentColor"
          />
        );

      case 'warrior-messy-mod':
        return (
          <path
            d="M17.5 31L16.5 24L19.5 20L18.5 15L23.5 14L25.5 9L29.8 12L32.5 7.5L35.8 12L40 9.5L41 14.2L45.5 15.5L44.2 20.5L47.5 24.5L46.2 31L43.5 25.5L38 23.2L32 24.5L26 23.2L20.5 25.5L17.5 31Z"
            fill="currentColor"
          />
        );

      case 'modern-wolf-mullet-taper':
        return (
          <>
            <path
              d="M18 27C17.2 15.5 22.8 9.2 32 9.2C41.2 9.2 46.8 15.5 46 27L42.5 24.5L37.5 26.5L32 24.2L26.5 26.5L21.5 24.5L18 27Z"
              fill="currentColor"
            />
            {/* Mullet neck wings */}
            <path
              d="M18.5 39L15 47L20.5 46.5L21 41ZM45.5 39L49 47L43.5 46.5L43 41Z"
              fill="currentColor"
              fillOpacity="0.85"
            />
          </>
        );

      case 'curtains-middle-part':
        return (
          <path
            d="M32 10.5C22 10.5 16 17.5 16.5 31.5C20.5 29.5 26.8 25.2 31.3 18.5L32 15.5L32.7 18.5C37.2 25.2 43.5 29.5 47.5 31.5C48 17.5 42 10.5 32 10.5Z"
            fill="currentColor"
          />
        );

      case 'old-money-scissor-flow':
      case 'surfer-medium-flow':
        return (
          <path
            d="M16.5 33C15 19.5 21 10 32.5 10C43 10 48.5 18.5 47.2 33L44.2 30.5C44.5 23.5 40 20.5 32 20.5C24 20.5 19.8 23.5 19.8 30.5L16.5 33Z"
            fill="currentColor"
          />
        );

      case 'blowout-low-taper':
      case 'textured-quiff-mid-fade':
        return (
          <path
            d="M19 28C17.5 19 19.5 10.5 28 8.5C35.5 6.8 44.5 10 45.8 18.5C46.5 22.5 45.8 25.5 45 28C42.5 23.5 37.5 21.5 31.5 21.5C25.5 21.5 21 23.8 19 28Z"
            fill="currentColor"
          />
        );

      case 'slick-back-low-fade':
      case 'side-part-executive':
      case 'crew-cut-ivy-league':
      default:
        return (
          <path
            d="M18.5 28.5C18 17 23 11 33 10.5C41.5 10 45.8 15.5 45.5 28.5C43 23.2 38.5 21.2 29.5 21.5C24.5 21.7 20.8 24.2 18.5 28.5Z"
            fill="currentColor"
          />
        );
    }
  };

  return (
    <svg
      className="cut-silhouette-svg"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={uid} x1="32" y1="18" x2="32" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.04" />
        </linearGradient>
      </defs>

      {/* Subtle ear contours */}
      <path
        d="M18.5 32.5C16.8 32.5 16 34.2 16.4 36.8C16.8 39.2 18 40.5 19.5 40.2M45.5 32.5C47.2 32.5 48 34.2 47.6 36.8C47.2 39.2 46 40.5 44.5 40.2"
        stroke="currentColor"
        strokeOpacity="0.32"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* Cranial & Jawline Architectural Contour */}
      <path
        d="M19.5 27.5C19.5 19 24.5 14.5 32 14.5C39.5 14.5 44.5 19 44.5 27.5V35.5C44.5 43.2 39.2 50.5 32 52C24.8 50.5 19.5 43.2 19.5 35.5V27.5Z"
        fill={`url(#${uid})`}
        stroke="currentColor"
        strokeOpacity="0.38"
        strokeWidth="1.4"
      />

      {/* Neckline */}
      <path
        d="M25.5 50.5V55.5M38.5 50.5V55.5"
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* Bespoke Haircut Layer */}
      {renderHairPath()}
    </svg>
  );
};
