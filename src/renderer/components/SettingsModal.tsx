import React from 'react';
import { X, Settings, Monitor, Type, Shield, Info, Sparkles } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { useTheme } from '../themes';

const SettingsModal: React.FC = () => {
    const { ui, updateSettings, toggleSettings } = useAppStore();
    const { settings } = ui;
    const { themeId, setTheme, availableThemes, reducedMotion, setReducedMotion } = useTheme();
    const [activeTab, setActiveTab] = React.useState<'appearance' | 'editor' | 'security' | 'about'>('appearance');

    if (!settings.isSettingsOpen) return null;

    const themePreviewColors: Record<string, { bg: string; accent: string }> = {
        'nexus': { bg: '#0a0a0a', accent: '#3b82f6' },
        'grid': { bg: '#000808', accent: '#00E5FF' },
        'love-dark': { bg: '#1D1D1F', accent: '#0A84FF' },
        'love-light': { bg: '#F5F5F7', accent: '#007AFF' },
    };

    const tabs = [
        { id: 'appearance', label: 'Appearance', icon: Monitor },
        { id: 'editor', label: 'Editor', icon: Type },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'about', label: 'About', icon: Info },
    ] as const;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-2xl h-[480px] bg-nexus-bg-secondary border border-nexus-border rounded-3xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Sidebar */}
                <div className="w-48 bg-nexus-bg-tertiary border-r border-nexus-border flex flex-col p-4 space-y-1">
                    <div className="flex items-center space-x-2 px-2 mb-6">
                        <Settings className="w-4 h-4 text-nexus-accent" />
                        <span className="text-xs font-bold uppercase tracking-widest text-nexus-fg-primary">Settings</span>
                    </div>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs transition-all ${activeTab === tab.id
                                    ? 'bg-nexus-bg-primary text-nexus-accent shadow-sm border border-nexus-border'
                                    : 'text-nexus-fg-muted hover:text-nexus-fg-primary hover:bg-nexus-bg-primary/50'
                                }`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col min-w-0 bg-nexus-bg-primary">
                    <div className="h-12 px-6 border-b border-nexus-border flex items-center justify-between shrink-0">
                        <h2 className="text-sm font-bold text-nexus-fg-primary">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h2>
                        <button
                            onClick={toggleSettings}
                            className="p-1 hover:bg-nexus-bg-tertiary rounded-lg text-nexus-fg-muted hover:text-nexus-fg-primary transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {activeTab === 'appearance' && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-nexus-fg-muted">Theme</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {availableThemes.map((theme) => {
                                            const colors = themePreviewColors[theme.id] || { bg: '#0a0a0a', accent: '#3b82f6' };
                                            const isSelected = themeId === theme.id;
                                            return (
                                                <button
                                                    key={theme.id}
                                                    onClick={() => setTheme(theme.id)}
                                                    className={`p-4 rounded-2xl bg-nexus-bg-tertiary flex flex-col items-center justify-center space-y-2 transition-all ${
                                                        isSelected 
                                                            ? 'border-2 border-nexus-accent' 
                                                            : 'border border-nexus-border hover:border-nexus-fg-muted'
                                                    }`}
                                                >
                                                    <div 
                                                        className="w-full h-12 rounded-lg border border-nexus-border relative overflow-hidden"
                                                        style={{ backgroundColor: colors.bg }}
                                                    >
                                                        <div 
                                                            className="absolute bottom-0 left-0 right-0 h-1"
                                                            style={{ backgroundColor: colors.accent }}
                                                        />
                                                        {theme.id === 'grid' && (
                                                            <Sparkles className="absolute top-2 right-2 w-3 h-3" style={{ color: colors.accent }} />
                                                        )}
                                                    </div>
                                                    <span className={`text-xs font-medium ${isSelected ? 'text-nexus-fg-primary' : 'text-nexus-fg-muted'}`}>
                                                        {theme.name}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-nexus-bg-tertiary border border-nexus-border flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-xs font-bold text-nexus-fg-primary">Reduce Motion</h3>
                                        <p className="text-[10px] text-nexus-fg-muted">Disable animations and effects</p>
                                    </div>
                                    <button
                                        onClick={() => setReducedMotion(!reducedMotion)}
                                        className={`w-10 h-5 rounded-full p-1 transition-all ${reducedMotion ? 'bg-nexus-accent' : 'bg-nexus-bg-primary'}`}
                                    >
                                        <div className={`w-3 h-3 rounded-full bg-white transition-all ${reducedMotion ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'editor' && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-nexus-fg-muted">Font Size</label>
                                        <span className="text-xs text-nexus-accent font-mono">{settings.fontSize}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="24"
                                        step="1"
                                        value={settings.fontSize}
                                        onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                                        className="w-full accent-nexus-accent bg-nexus-bg-tertiary h-1.5 rounded-full appearance-none cursor-pointer"
                                    />
                                    <div className="p-4 rounded-xl bg-nexus-bg-tertiary border border-nexus-border">
                                        <pre className="text-xs font-mono text-nexus-fg-secondary" style={{ fontSize: `${settings.fontSize}px` }}>
                                            const sumerian = () =&gt; 'magic';
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div className="p-4 rounded-2xl bg-nexus-bg-tertiary border border-nexus-border flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-xs font-bold text-nexus-fg-primary">Brave Mode by Default</h3>
                                        <p className="text-[10px] text-nexus-fg-muted">Automatically skip permission prompts for agent actions</p>
                                    </div>
                                    <button
                                        onClick={() => updateSettings({ braveModeByDefault: !settings.braveModeByDefault })}
                                        className={`w-10 h-5 rounded-full p-1 transition-all ${settings.braveModeByDefault ? 'bg-nexus-accent' : 'bg-nexus-bg-primary'}`}
                                    >
                                        <div className={`w-3 h-3 rounded-full bg-white transition-all ${settings.braveModeByDefault ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'about' && (
                            <div className="flex flex-col items-center justify-center space-y-4 py-8">
                                <div className="w-16 h-16 bg-nexus-bg-tertiary border border-nexus-border rounded-2xl flex items-center justify-center">
                                    <Settings className="w-8 h-8 text-nexus-accent" />
                                </div>
                                <div className="text-center space-y-1">
                                    <h3 className="text-sm font-bold text-nexus-fg-primary">Sumerian IDE</h3>
                                    <p className="text-xs text-nexus-fg-muted">Version 1.0.0 Experimental</p>
                                </div>
                                <div className="pt-4 flex space-x-4">
                                    <button className="text-[10px] text-nexus-accent hover:underline uppercase tracking-widest font-bold">Docs</button>
                                    <button className="text-[10px] text-nexus-accent hover:underline uppercase tracking-widest font-bold">GitHub</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
