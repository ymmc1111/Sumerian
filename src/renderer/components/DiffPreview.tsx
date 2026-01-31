import React, { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';

interface DiffPreviewProps {
  original: string;
  modified: string;
  language: string;
  filePath: string;
  onAccept: (finalContent: string) => void;
  onReject: () => void;
}

const DiffPreview: React.FC<DiffPreviewProps> = ({
  original,
  modified,
  language,
  filePath,
  onAccept,
  onReject
}) => {
  const diffEditorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const diffEditor = monaco.editor.createDiffEditor(containerRef.current, {
      theme: 'vs-dark',
      readOnly: false,
      renderSideBySide: true,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 13,
      lineNumbers: 'on',
      glyphMargin: false,
      folding: false,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
    });

    const originalModel = monaco.editor.createModel(original, language);
    const modifiedModel = monaco.editor.createModel(modified, language);

    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel
    });

    diffEditorRef.current = diffEditor;

    return () => {
      originalModel.dispose();
      modifiedModel.dispose();
      diffEditor.dispose();
    };
  }, [original, modified, language]);

  const handleAccept = () => {
    const modifiedModel = diffEditorRef.current?.getModifiedEditor().getModel();
    if (modifiedModel) {
      onAccept(modifiedModel.getValue());
    }
  };

  const fileName = filePath.split('/').pop() || 'file';

  return (
    <div className="flex flex-col h-full bg-nexus-bg-secondary">
      {/* Header */}
      <div className="px-4 py-3 border-b border-nexus-border">
        <h3 className="text-sm font-bold text-nexus-fg-primary mb-1">Review Changes</h3>
        <p className="text-xs text-nexus-fg-secondary font-mono">{fileName}</p>
      </div>

      {/* Diff Editor */}
      <div ref={containerRef} className="flex-1 min-h-0" />

      {/* Actions */}
      <div className="flex gap-2 p-4 border-t border-nexus-border">
        <button
          onClick={handleAccept}
          className="flex-1 px-4 py-2 rounded bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors"
        >
          ACCEPT CHANGES
        </button>
        <button
          onClick={onReject}
          className="flex-1 px-4 py-2 rounded bg-nexus-bg-tertiary text-nexus-fg-primary text-xs font-bold hover:bg-nexus-bg-quaternary transition-colors border border-nexus-border"
        >
          REJECT
        </button>
      </div>
    </div>
  );
};

export default DiffPreview;
