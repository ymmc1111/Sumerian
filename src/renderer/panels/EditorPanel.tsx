import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { sumerianDarkTheme } from '../themes/monacoTheme';
import TabBar from '../components/TabBar';
import { useAppStore } from '../stores/useAppStore';
import PanelHeader from '../components/PanelHeader';
import { Code } from 'lucide-react';
import { PanelSlotId } from '../types/layout';

interface EditorPanelProps {
    slotId?: PanelSlotId;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ slotId = 'B' }) => {
    const { editor, ui, setFileContent, saveFile } = useAppStore();
    const { openFiles, activeFileId } = editor;
    const { settings } = ui;
    const activeFile = openFiles.find(f => f.id === activeFileId);

    const editorRef = useRef<any>(null);

    const handleEditorWillMount = (monaco: any) => {
        monaco.editor.defineTheme('sumerian-dark', sumerianDarkTheme);
    };

    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor;
    };

    const handleEditorChange = (value: string | undefined) => {
        if (activeFileId && value !== undefined) {
            setFileContent(activeFileId, value);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                if (activeFileId) {
                    saveFile(activeFileId);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeFileId, saveFile]);

    if (!activeFile) {
        return (
            <div className="flex-1 h-full bg-nexus-bg-primary flex flex-col items-center justify-center text-nexus-fg-muted">
                <div className="text-sm">No file selected</div>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full bg-nexus-bg-primary flex flex-col overflow-hidden">
            <PanelHeader
                title={activeFile.name}
                panelType="editor"
                slotId={slotId}
                icon={<Code className="w-4 h-4" />}
                actions={<TabBar />}
            />
            <div className="flex-1 relative">
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
            </div>
        </div>
    );
};

export default EditorPanel;


