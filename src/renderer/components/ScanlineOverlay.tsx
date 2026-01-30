import React from 'react';
import { useTheme } from '../themes';

export const ScanlineOverlay: React.FC = () => {
  const { themeId, reducedMotion } = useTheme();

  if (themeId !== 'grid' || reducedMotion) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      style={{
        background: `
          linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
          linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))
        `,
        backgroundSize: '100% 2px, 3px 100%',
      }}
    />
  );
};

export default ScanlineOverlay;
