import React, { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { sumerianDarkTheme } from '../themes/monacoTheme';
import { useAppStore } from '../stores/useAppStore';
import { X, SplitSquareHorizontal, SplitSquareVertical, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { EditorGroup as EditorGroupType } from '../stores/types';

interface EditorGroupProps {
  group: EditorGroupType;
  isActive: boolean;
  canClose: boolean;
  onSplit?: (direction: 'horizontal' | 'vertical') => void;
  onClose?: () => void;
}

export const EditorGroup: React.FC<EditorGroupProps> = ({
  group,
  isActive,
  canClose,
  onSplit,
  onClose,
}) => {
  const { ui, setFileContent, saveFile, closeFile, setActiveGroup } = useAppStore();
  const { settings } = ui;
  const editorRef = useRef<any>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const activeFile = group.openFiles.find(f => f.id === group.activeFileId);

  const updateScrollButtons = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  React.useEffect(() => {
    updateScrollButtons();
    const container = tabsContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, [group.openFiles]);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = 200;
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const closeAllTabs = () => {
    group.openFiles.forEach(file => closeFile(file.id));
    setShowDropdown(false);
  };

  const closeSavedTabs = () => {
    group.openFiles.filter(f => !f.isDirty).forEach(file => closeFile(file.id));
    setShowDropdown(false);
  };

  const handleEditorWillMount = (monaco: any) => {
    monaco.editor.defineTheme('sumerian-dark', sumerianDarkTheme);
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value: string | undefined) => {
    if (group.activeFileId && value !== undefined) {
      setFileContent(group.activeFileId, value);
    }
  };

  const handleTabClick = (fileId: string) => {
    setActiveGroup(group.id);
    // Update active file in this group
    useAppStore.setState((state) => ({
      editor: {
        ...state.editor,
        groups: state.editor.groups.map(g =>
          g.id === group.id ? { ...g, activeFileId: fileId } : g
        ),
      },
    }));
  };

  const handleTabClose = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    closeFile(fileId);
  };

  return (
    <div 
      className={`flex flex-col h-full bg-nexus-bg-primary ${
        isActive ? 'ring-2 ring-blue-500/30 ring-inset' : ''
      }`}
      onClick={() => setActiveGroup(group.id)}
    >
      {/* Group Header with Tabs */}
      <div className="flex items-center h-10 border-b border-nexus-border bg-nexus-bg-secondary">
        {/* Tabs Container */}
        <div 
          ref={tabsContainerRef}
          className="flex-1 flex overflow-x-hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {group.openFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => handleTabClick(file.id)}
              className={`
                group flex items-center gap-2 px-3 h-full min-w-[120px] max-w-[200px] flex-shrink-0
                border-r border-nexus-border cursor-pointer transition-colors
                ${file.id === group.activeFileId
                  ? 'bg-nexus-bg-primary text-nexus-fg-primary'
                  : 'text-nexus-fg-muted hover:bg-nexus-bg-tertiary'
                }
              `}
            >
              <span className="text-xs truncate flex-1">{file.name}</span>
              {file.isDirty && <span className="text-blue-400">●</span>}
              <button
                onClick={(e) => handleTabClose(e, file.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-nexus-border rounded transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Navigation and Actions */}
        <div className="flex items-center border-l border-nexus-border">
          {/* Scroll Navigation */}
          {group.openFiles.length > 0 && (
            <>
              <button
                onClick={() => scrollTabs('left')}
                disabled={!canScrollLeft}
                className={`p-1.5 hover:bg-nexus-bg-tertiary transition-colors ${
                  !canScrollLeft ? 'opacity-30 cursor-not-allowed' : 'text-nexus-fg-muted hover:text-nexus-fg-primary'
                }`}
                title="Scroll Left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => scrollTabs('right')}
                disabled={!canScrollRight}
                className={`p-1.5 hover:bg-nexus-bg-tertiary transition-colors ${
                  !canScrollRight ? 'opacity-30 cursor-not-allowed' : 'text-nexus-fg-muted hover:text-nexus-fg-primary'
                }`}
                title="Scroll Right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1.5 hover:bg-nexus-bg-tertiary rounded text-nexus-fg-muted hover:text-nexus-fg-primary transition-colors"
              title="More Options"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            
            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-lg z-20 py-1">
                  {onSplit && (
                    <>
                      <button
                        onClick={() => { onSplit('horizontal'); setShowDropdown(false); }}
                        className="w-full px-3 py-2 text-left text-xs text-white hover:bg-[#222222] transition-colors flex items-center gap-2"
                      >
                        <SplitSquareHorizontal className="w-3.5 h-3.5" />
                        Split Horizontally
                      </button>
                      <button
                        onClick={() => { onSplit('vertical'); setShowDropdown(false); }}
                        className="w-full px-3 py-2 text-left text-xs text-white hover:bg-[#222222] transition-colors flex items-center gap-2"
                      >
                        <SplitSquareVertical className="w-3.5 h-3.5" />
                        Split Vertically
                      </button>
                      <div className="h-px bg-[#2a2a2a] my-1" />
                    </>
                  )}
                  <button
                    onClick={closeAllTabs}
                    className="w-full px-3 py-2 text-left text-xs text-white hover:bg-[#222222] transition-colors"
                  >
                    Close All Tabs
                  </button>
                  <button
                    onClick={closeSavedTabs}
                    className="w-full px-3 py-2 text-left text-xs text-white hover:bg-[#222222] transition-colors"
                  >
                    Close Saved Tabs
                  </button>
                  {canClose && onClose && (
                    <>
                      <div className="h-px bg-[#2a2a2a] my-1" />
                      <button
                        onClick={() => { onClose(); setShowDropdown(false); }}
                        className="w-full px-3 py-2 text-left text-xs text-white hover:bg-[#222222] transition-colors"
                      >
                        Close Group
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 relative">
        {activeFile ? (
          <Editor
            height="100%"
            language={activeFile.language === 'ts' || activeFile.language === 'tsx' ? 'typescript' : 'javascript'}
            value={activeFile.content}
            theme="sumerian-dark"
            beforeMount={handleEditorWillMount}
            onMount={handleEditorDidMount}
            onChange={handleEditorChange}
            options={{
              fontSize: settings.fontSize,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontLigatures: true,
              lineNumbers: 'on',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              tabSize: 2,
              insertSpaces: true,
              automaticLayout: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true,
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true }
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-nexus-fg-muted text-sm">
            No file selected
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorGroup;
