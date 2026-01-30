import * as monaco from 'monaco-editor';

export const sumerianDarkTheme: monaco.editor.IStandaloneThemeData = {
    base: 'vs-dark',
    inherit: true,
    rules: [
        { token: '', foreground: 'ffffff' },
        { token: 'comment', foreground: '666666', fontStyle: 'italic' },
        { token: 'keyword', foreground: '3b82f6' },
        { token: 'string', foreground: '22c55e' },
        { token: 'number', foreground: 'eab308' },
        { token: 'type', foreground: '60a5fa' },
        { token: 'function', foreground: '60a5fa' },
    ],
    colors: {
        'editor.background': '#0a0a0a',
        'editor.foreground': '#ffffff',
        'editor.lineHighlightBackground': '#141414',
        'editorCursor.foreground': '#3b82f6',
        'editorWhitespace.foreground': '#2a2a2a',
        'editorIndentGuide.background': '#1a1a1a',
        'editorIndentGuide.activeBackground': '#2a2a2a',
        'editor.selectionBackground': '#3b82f644',
        'editorLineNumber.foreground': '#666666',
        'editorLineNumber.activeForeground': '#a0a0a0',
        'editorWidget.background': '#141414',
        'editorWidget.border': '#2a2a2a',
    }
};
