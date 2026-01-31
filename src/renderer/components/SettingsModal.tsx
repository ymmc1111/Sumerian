import React from 'react';
import { X, Settings, Monitor, Type, Shield, Info, Sparkles, Server, Folder } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { useTheme } from '../themes';
import MCPSettings from './MCPSettings';

const SettingsModal: React.FC = () => {
    const { ui, updateSettings, toggleSettings, forceRefreshModels, project, toggleDocsViewer } = useAppStore();
    const { settings } = ui;
    const { themeId, setTheme, availableThemes, reducedMotion, setReducedMotion } = useTheme();
    const [activeTab, setActiveTab] = React.useState<'appearance' | 'editor' | 'agent' | 'mcp' | 'project' | 'security' | 'about'>('appearance');
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [projectConfig, setProjectConfig] = React.useState<any>(null);
    const [configLoading, setConfigLoading] = React.useState(false);
    const [configSaving, setConfigSaving] = React.useState(false);

    const getTabTooltip = (tabId: string): string => {
        const tooltips: Record<string, string> = {
            'appearance': 'Customize theme and visual preferences',
            'editor': 'Configure editor font size and terminal settings',
            'agent': 'Manage Claude CLI models and advanced flags',
            'mcp': 'Configure Model Context Protocol tools and servers',
            'project': 'Project-specific settings and overrides',
            'security': 'Configure brave mode and security preferences',
            'about': 'View app information and documentation'
        };
        return tooltips[tabId] || '';
    };

    const handleRefreshModels = async () => {
        setIsRefreshing(true);
        try {
            await forceRefreshModels();
            // The store will be updated via onModelsUpdated event
        } finally {
            // Give it a tiny bit of visual feedback even if fast
            setTimeout(() => setIsRefreshing(false), 800);
        }
    };

    React.useEffect(() => {
        if (activeTab === 'project' && project.rootPath) {
            loadProjectConfig();
        }
    }, [activeTab, project.rootPath]);

    const loadProjectConfig = async () => {
        if (!project.rootPath) return;
        setConfigLoading(true);
        try {
            const config = await window.sumerian.project.loadConfig(project.rootPath);
            setProjectConfig(config || { version: 1 });
        } catch (error) {
            console.error('Failed to load project config:', error);
            setProjectConfig({ version: 1 });
        } finally {
            setConfigLoading(false);
        }
    };

    const saveProjectConfig = async () => {
        if (!project.rootPath || !projectConfig) return;
        setConfigSaving(true);
        try {
            await window.sumerian.project.saveConfig(project.rootPath, projectConfig);
        } catch (error) {
            console.error('Failed to save project config:', error);
        } finally {
            setConfigSaving(false);
        }
    };

    const updateProjectConfig = (updates: any) => {
        setProjectConfig((prev: any) => ({ ...prev, ...updates }));
    };

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
        { id: 'agent', label: 'Agent', icon: Sparkles },
        { id: 'mcp', label: 'MCP Tools', icon: Server },
        { id: 'project', label: 'Project', icon: Folder },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'about', label: 'About', icon: Info },
    ] as const;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-2xl h-[480px] bg-nexus-bg-primary border border-nexus-border rounded-3xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
                style={{ backgroundColor: 'var(--color-bg-primary)' }}
            >
                {/* Sidebar */}
                <div className="w-48 bg-nexus-bg-tertiary border-r border-nexus-border flex flex-col p-4 space-y-1" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                    <div className="flex items-center space-x-2 px-2 mb-6">
                        <Settings className="w-4 h-4 text-nexus-accent" />
                        <span className="text-xs font-bold uppercase tracking-widest text-nexus-fg-primary">Settings</span>
                    </div>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            title={getTabTooltip(tab.id)}
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
                            title="Close Settings (Esc)"
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
                                                    title={`Switch to ${theme.name} theme`}
                                                    className={`p-4 rounded-2xl bg-nexus-bg-tertiary flex flex-col items-center justify-center space-y-2 transition-all ${isSelected
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
                                        title={`${reducedMotion ? 'Disable' : 'Enable'} reduced motion mode`}
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
                                        title={`Adjust editor font size (current: ${settings.fontSize}px)`}
                                        className="w-full accent-nexus-accent bg-nexus-bg-tertiary h-1.5 rounded-full appearance-none cursor-pointer"
                                    />
                                    <div className="p-4 rounded-xl bg-nexus-bg-tertiary border border-nexus-border">
                                        <pre className="text-xs font-mono text-nexus-fg-secondary" style={{ fontSize: `${settings.fontSize}px` }}>
                                            const sumerian = () =&gt; 'magic';
                                        </pre>
                                    </div>
                                </div>
                                <div className="space-y-4 pt-4 border-t border-nexus-border">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-nexus-fg-muted">Terminal Mirroring</label>
                                    <p className="text-[10px] text-nexus-fg-muted">How agent actions appear in your terminal tabs</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['none', 'formatted', 'raw'] as const).map((mode) => (
                                            <button
                                                key={mode}
                                                onClick={() => updateSettings({ terminalMirroring: mode })}
                                                title={mode === 'none' ? 'No terminal output' : mode === 'formatted' ? 'Show formatted agent commands' : 'Show raw CLI output'}
                                                className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${settings.terminalMirroring === mode
                                                    ? 'bg-nexus-accent text-white border-nexus-accent'
                                                    : 'bg-nexus-bg-tertiary text-nexus-fg-muted border-nexus-border hover:text-nexus-fg-primary'
                                                    }`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'mcp' && (
                            <MCPSettings />
                        )}

                        {activeTab === 'project' && (
                            <div className="space-y-6">
                                {!project.rootPath ? (
                                    <div className="p-4 rounded-2xl bg-nexus-bg-tertiary border border-nexus-border text-center">
                                        <p className="text-xs text-nexus-fg-muted">No project open. Open a project to configure per-project settings.</p>
                                    </div>
                                ) : configLoading ? (
                                    <div className="p-4 rounded-2xl bg-nexus-bg-tertiary border border-nexus-border text-center">
                                        <p className="text-xs text-nexus-fg-muted">Loading project configuration...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="p-4 rounded-2xl bg-nexus-bg-tertiary border border-nexus-border space-y-3">
                                            <div className="space-y-1">
                                                <h3 className="text-xs font-bold text-nexus-fg-primary">Project Path</h3>
                                                <p className="text-[10px] text-nexus-fg-muted font-mono break-all">{project.rootPath}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-nexus-fg-muted">Project Settings</label>
                                            <p className="text-[10px] text-nexus-fg-muted">Override global settings for this project. Leave empty to use global defaults.</p>

                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <label className="text-xs text-nexus-fg-primary">Project Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Auto-detected from folder name"
                                                        value={projectConfig?.name || ''}
                                                        onChange={(e) => updateProjectConfig({ name: e.target.value || undefined })}
                                                        title="Custom display name for this project"
                                                        className="w-full px-3 py-2 rounded-xl bg-nexus-bg-primary border border-nexus-border text-xs text-nexus-fg-primary focus:outline-none focus:border-nexus-accent"
                                                    />
                                                    <p className="text-[10px] text-nexus-fg-muted">Custom display name for this project</p>
                                                </div>

                                                <div className="p-4 rounded-2xl bg-nexus-bg-tertiary border border-nexus-border flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <h3 className="text-xs font-bold text-nexus-fg-primary">Brave Mode</h3>
                                                        <p className="text-[10px] text-nexus-fg-muted">Override global brave mode setting</p>
                                                    </div>
                                                    <select
                                                        value={projectConfig?.braveMode === undefined ? 'default' : projectConfig.braveMode ? 'true' : 'false'}
                                                        onChange={(e) => {
                                                            const value = e.target.value === 'default' ? undefined : e.target.value === 'true';
                                                            updateProjectConfig({ braveMode: value });
                                                        }}
                                                        title="Override global brave mode setting for this project"
                                                        className="px-3 py-1.5 rounded-xl bg-nexus-bg-primary border border-nexus-border text-xs text-nexus-fg-primary focus:outline-none focus:border-nexus-accent"
                                                    >
                                                        <option value="default">Use Global</option>
                                                        <option value="true">Enabled</option>
                                                        <option value="false">Disabled</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs text-nexus-fg-primary">Default Model</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Use global model setting"
                                                        value={projectConfig?.model || ''}
                                                        onChange={(e) => updateProjectConfig({ model: e.target.value || undefined })}
                                                        title="Override default Claude model for this project (e.g., claude-3-5-sonnet-20241022)"
                                                        className="w-full px-3 py-2 rounded-xl bg-nexus-bg-primary border border-nexus-border text-xs text-nexus-fg-primary focus:outline-none focus:border-nexus-accent font-mono"
                                                    />
                                                    <p className="text-[10px] text-nexus-fg-muted">Override default Claude model for this project</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs text-nexus-fg-primary">MCP Config Path</label>
                                                    <input
                                                        type="text"
                                                        placeholder="/path/to/mcp-config.json"
                                                        value={projectConfig?.mcpConfigPath || ''}
                                                        onChange={(e) => updateProjectConfig({ mcpConfigPath: e.target.value || undefined })}
                                                        title="Path to project-specific MCP configuration file"
                                                        className="w-full px-3 py-2 rounded-xl bg-nexus-bg-primary border border-nexus-border text-xs text-nexus-fg-primary focus:outline-none focus:border-nexus-accent font-mono"
                                                    />
                                                    <p className="text-[10px] text-nexus-fg-muted">Project-specific MCP configuration file</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs text-nexus-fg-primary">Additional Directories</label>
                                                    <input
                                                        type="text"
                                                        placeholder="/path/to/dir1,/path/to/dir2"
                                                        value={projectConfig?.additionalDirs?.join(',') || ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                                            updateProjectConfig({ additionalDirs: value.length > 0 ? value : undefined });
                                                        }}
                                                        title="Comma-separated paths for monorepo or multi-directory support"
                                                        className="w-full px-3 py-2 rounded-xl bg-nexus-bg-primary border border-nexus-border text-xs text-nexus-fg-primary focus:outline-none focus:border-nexus-accent font-mono"
                                                    />
                                                    <p className="text-[10px] text-nexus-fg-muted">Comma-separated paths for monorepo support</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs text-nexus-fg-primary">Allowed Tools</label>
                                                    <input
                                                        type="text"
                                                        placeholder="tool1,tool2,tool3"
                                                        value={projectConfig?.allowedTools?.join(',') || ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                                            updateProjectConfig({ allowedTools: value.length > 0 ? value : undefined });
                                                        }}
                                                        title="Whitelist of allowed MCP tools (comma-separated). Only these tools will be available."
                                                        className="w-full px-3 py-2 rounded-xl bg-nexus-bg-primary border border-nexus-border text-xs text-nexus-fg-primary focus:outline-none focus:border-nexus-accent font-mono"
                                                    />
                                                    <p className="text-[10px] text-nexus-fg-muted">Whitelist of allowed MCP tools (comma-separated)</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs text-nexus-fg-primary">Disallowed Tools</label>
                                                    <input
                                                        type="text"
                                                        placeholder="tool1,tool2,tool3"
                                                        value={projectConfig?.disallowedTools?.join(',') || ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                                            updateProjectConfig({ disallowedTools: value.length > 0 ? value : undefined });
                                                        }}
                                                        title="Blacklist of disallowed MCP tools (comma-separated). These tools will be blocked."
                                                        className="w-full px-3 py-2 rounded-xl bg-nexus-bg-primary border border-nexus-border text-xs text-nexus-fg-primary focus:outline-none focus:border-nexus-accent font-mono"
                                                    />
                                                    <p className="text-[10px] text-nexus-fg-muted">Blacklist of disallowed MCP tools (comma-separated)</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-nexus-border flex justify-end">
                                            <button
                                                onClick={saveProjectConfig}
                                                disabled={configSaving}
                                                title="Save project configuration to .sumerian/config.json"
                                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                                    configSaving
                                                        ? 'bg-nexus-bg-primary text-nexus-fg-muted border-nexus-border cursor-wait'
                                                        : 'bg-nexus-accent text-white border-nexus-accent hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                                                }`}
                                            >
                                                {configSaving ? 'Saving...' : 'Save Config'}
                                            </button>
                                        </div>
                                    </>
                                )}
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
                                        title={`${settings.braveModeByDefault ? 'Disable' : 'Enable'} brave mode by default for new sessions`}
                                        className={`w-10 h-5 rounded-full p-1 transition-all ${settings.braveModeByDefault ? 'bg-nexus-accent' : 'bg-nexus-bg-primary'}`}
                                    >
                                        <div className={`w-3 h-3 rounded-full bg-white transition-all ${settings.braveModeByDefault ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'agent' && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-nexus-fg-muted">Claude CLI Models</label>
                                    <div className="p-4 rounded-2xl bg-nexus-bg-tertiary border border-nexus-border space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <h3 className="text-xs font-bold text-nexus-fg-primary">Model List Cache</h3>
                                                <p className="text-[10px] text-nexus-fg-muted">Models are cached to improve boot time. Auto-refreshes weekly.</p>
                                            </div>
                                            <button
                                                onClick={handleRefreshModels}
                                                disabled={isRefreshing}
                                                title="Fetch latest Claude models from CLI"
                                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${isRefreshing
                                                        ? 'bg-nexus-bg-primary text-nexus-fg-muted border-nexus-border cursor-wait'
                                                        : 'bg-nexus-accent text-white border-nexus-accent hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                                                    }`}
                                            >
                                                {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-nexus-border">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-nexus-fg-muted">Advanced CLI Flags</label>
                                    
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <label className="text-xs text-nexus-fg-primary">Max Budget (USD)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="No limit"
                                                value={settings.maxBudgetUsd || ''}
                                                onChange={(e) => {
                                                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                                    updateSettings({ maxBudgetUsd: value });
                                                    if (value !== undefined) {
                                                        window.sumerian.cli.setMaxBudgetUsd(value);
                                                    } else {
                                                        window.sumerian.cli.setMaxBudgetUsd(null);
                                                    }
                                                }}
                                                title="Set a cost limit for agent operations in USD"
                                                className="w-full px-3 py-2 rounded-xl bg-nexus-bg-primary border border-nexus-border text-xs text-nexus-fg-primary focus:outline-none focus:border-nexus-accent"
                                            />
                                            <p className="text-[10px] text-nexus-fg-muted">Set a cost limit for agent operations</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs text-nexus-fg-primary">MCP Config Path</label>
                                            <input
                                                type="text"
                                                placeholder="/path/to/mcp-config.json"
                                                value={settings.mcpConfigPath || ''}
                                                onChange={(e) => {
                                                    const value = e.target.value || undefined;
                                                    updateSettings({ mcpConfigPath: value });
                                                    window.sumerian.cli.setMcpConfigPath(value || null);
                                                }}
                                                title="Path to global MCP configuration file"
                                                className="w-full px-3 py-2 rounded-xl bg-nexus-bg-primary border border-nexus-border text-xs text-nexus-fg-primary focus:outline-none focus:border-nexus-accent font-mono"
                                            />
                                            <p className="text-[10px] text-nexus-fg-muted">Path to MCP configuration file</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs text-nexus-fg-primary">Additional Directories</label>
                                            <input
                                                type="text"
                                                placeholder="/path/to/dir1,/path/to/dir2"
                                                value={settings.additionalDirs?.join(',') || ''}
                                                onChange={(e) => {
                                                    const value = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                                    updateSettings({ additionalDirs: value.length > 0 ? value : undefined });
                                                    window.sumerian.cli.setAdditionalDirs(value);
                                                }}
                                                title="Comma-separated paths for monorepo or multi-directory support"
                                                className="w-full px-3 py-2 rounded-xl bg-nexus-bg-primary border border-nexus-border text-xs text-nexus-fg-primary focus:outline-none focus:border-nexus-accent font-mono"
                                            />
                                            <p className="text-[10px] text-nexus-fg-muted">Comma-separated paths for monorepo support</p>
                                        </div>
                                    </div>
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
                                    <button 
                                        onClick={toggleDocsViewer}
                                        title="Open documentation viewer"
                                        className="text-[10px] text-nexus-accent hover:underline uppercase tracking-widest font-bold"
                                    >
                                        Docs
                                    </button>
                                    <button 
                                        onClick={() => window.open('https://github.com/ymmc1111/Sumerian', '_blank')}
                                        title="Open Sumerian GitHub repository"
                                        className="text-[10px] text-nexus-accent hover:underline uppercase tracking-widest font-bold"
                                    >
                                        GitHub
                                    </button>
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
