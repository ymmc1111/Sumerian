import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { ChevronDown, Cpu, Sparkles, Zap, Brain, AlertTriangle } from 'lucide-react';

const ModelSelector: React.FC = () => {
    const { agent, setModel, refreshModels } = useAppStore();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        refreshModels();
    }, []);

    const getIconForModel = (id: string) => {
        if (id.includes('thinking') || id.includes('opus')) return Brain;
        if (id.includes('sonnet')) return Sparkles;
        if (id.includes('haiku')) return Zap;
        return Sparkles;
    };

    // Add 'Auto' at the top if not present in CLI models
    const displayModels = [
        { id: 'auto', name: 'Auto (Default)', description: 'Let Claude CLI decide the best model' },
        ...agent.availableModels
    ];

    const currentModel = displayModels.find(m => m.id === agent.model) || displayModels[0];
    const CurrentIcon = getIconForModel(currentModel.id);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-nexus-bg-primary border border-nexus-border hover:border-nexus-accent/50 transition-all active:scale-95"
            >
                <CurrentIcon className="w-3.5 h-3.5 text-nexus-accent" />
                <span className="text-[11px] font-bold text-nexus-fg-secondary uppercase tracking-wider flex items-center">
                    {currentModel.id === 'auto' ? currentModel.name : currentModel.name.replace('Claude ', '')}
                    {currentModel.id.includes('thinking') && <AlertTriangle className="w-2.5 h-2.5 text-amber-400 ml-1.5" />}
                </span>
                <ChevronDown className={`w-3 h-3 text-nexus-fg-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
                    <div className="absolute bottom-full right-0 mb-2 w-64 bg-nexus-bg-tertiary backdrop-blur-xl border border-nexus-border rounded-xl shadow-2xl z-[101] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                        <div className="p-2 space-y-1">
                            {displayModels.map((model) => {
                                const ModelIcon = getIconForModel(model.id);
                                return (
                                    <button
                                        key={model.id}
                                        onClick={() => {
                                            setModel(model.id);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all ${agent.model === model.id
                                            ? 'bg-nexus-accent text-white'
                                            : 'hover:bg-nexus-bg-primary text-nexus-fg-secondary'}`}
                                    >
                                        <ModelIcon className={`w-4 h-4 mt-0.5 ${agent.model === model.id ? 'text-white' : 'text-nexus-accent'}`} />
                                        <div>
                                            <div className="text-xs font-bold flex items-center gap-1.5">
                                                {model.name}
                                                {model.id.includes('thinking') && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                                            </div>
                                            <div className={`text-[10px] ${agent.model === model.id ? 'text-white/70' : 'text-nexus-fg-muted'}`}>
                                                {model.description}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ModelSelector;
