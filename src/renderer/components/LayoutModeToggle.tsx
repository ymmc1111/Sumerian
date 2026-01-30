import React, { useEffect } from 'react';
import { LayoutMode } from '../types/layout';
import { useLayoutStore } from '../stores/layoutStore';

const LAYOUT_MODE_INFO: Record<LayoutMode, { label: string; icon: string; description: string }> = {
  standard: {
    label: 'Standard',
    icon: '⊞',
    description: 'All panels visible',
  },
  'hyper-focus': {
    label: 'Hyper-Focus',
    icon: '◉',
    description: 'Editor maximized',
  },
  'agent-first': {
    label: 'Agent-First',
    icon: '⊟',
    description: 'Editor + Agent split',
  },
};

interface LayoutModeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export const LayoutModeToggle: React.FC<LayoutModeToggleProps> = ({
  showLabel = true,
  className = '',
}) => {
  const { mode, cycleLayoutMode, setLayoutMode } = useLayoutStore();
  const modeInfo = LAYOUT_MODE_INFO[mode];

  // Keyboard shortcut: Cmd+\ to cycle modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        cycleLayoutMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleLayoutMode]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={cycleLayoutMode}
        className="
          flex items-center gap-2 px-2 py-1
          bg-[#1a1a1a] hover:bg-[#252525]
          border border-[#2a2a2a] rounded-md
          text-gray-300 text-sm
          transition-colors duration-150
        "
        title={`${modeInfo.description} (⌘\\)`}
      >
        <span className="text-base">{modeInfo.icon}</span>
        {showLabel && <span>{modeInfo.label}</span>}
      </button>
    </div>
  );
};

// Dropdown variant for more control
export const LayoutModeDropdown: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { mode, setLayoutMode } = useLayoutStore();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 px-3 py-1.5
          bg-[#1a1a1a] hover:bg-[#252525]
          border border-[#2a2a2a] rounded-md
          text-gray-300 text-sm
          transition-colors duration-150
        "
      >
        <span>{LAYOUT_MODE_INFO[mode].icon}</span>
        <span>{LAYOUT_MODE_INFO[mode].label}</span>
        <span className="text-gray-500 ml-1">▾</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="
            absolute top-full left-0 mt-1 z-50
            bg-[#1a1a1a] border border-[#2a2a2a] rounded-md
            shadow-lg overflow-hidden min-w-[180px]
          ">
            {(Object.keys(LAYOUT_MODE_INFO) as LayoutMode[]).map((layoutMode) => {
              const info = LAYOUT_MODE_INFO[layoutMode];
              const isActive = mode === layoutMode;

              return (
                <button
                  key={layoutMode}
                  onClick={() => {
                    setLayoutMode(layoutMode);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2
                    text-left text-sm
                    ${isActive ? 'bg-blue-500/20 text-blue-400' : 'text-gray-300 hover:bg-[#252525]'}
                    transition-colors duration-150
                  `}
                >
                  <span className="text-base w-5">{info.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{info.label}</div>
                    <div className="text-xs text-gray-500">{info.description}</div>
                  </div>
                  {isActive && <span className="text-blue-400">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default LayoutModeToggle;
