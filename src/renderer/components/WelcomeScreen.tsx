import React from 'react';
import { FolderOpen, History, Plus } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

const WelcomeScreen: React.FC = () => {
    const { selectProject, project, setRootPath } = useAppStore();
    const { recentProjects } = project;

    return (
        <div className="flex-1 h-full bg-nexus-bg-primary flex flex-col items-center justify-center p-8">
            <div className="max-w-md w-full space-y-8">
                {/* Logo/Hero */}
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-nexus-bg-tertiary border border-nexus-border rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                        <Plus className="w-10 h-10 text-nexus-accent" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tighter text-nexus-fg-primary">Sumerian</h1>
                    <p className="text-nexus-fg-secondary text-sm">A high-autonomy minimalist IDE powered by Claude.</p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 gap-3">
                    <button
                        onClick={selectProject}
                        className="flex items-center space-x-3 p-4 bg-nexus-bg-tertiary border border-nexus-border rounded-2xl hover:border-nexus-accent hover:bg-nexus-bg-secondary transition-all group"
                    >
                        <div className="p-2 rounded-xl bg-nexus-bg-primary border border-nexus-border group-hover:border-nexus-accent transition-colors">
                            <FolderOpen className="w-5 h-5 text-nexus-accent" />
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-bold text-nexus-fg-primary">Open Folder</div>
                            <div className="text-[10px] text-nexus-fg-muted uppercase tracking-wider">Choose a project directory</div>
                        </div>
                    </button>
                </div>

                {/* Recent Projects */}
                {recentProjects.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2 px-1">
                            <History className="w-3 h-3 text-nexus-fg-muted" />
                            <h2 className="text-[10px] font-bold uppercase tracking-widest text-nexus-fg-muted">Recent Projects</h2>
                        </div>
                        <div className="space-y-2">
                            {recentProjects.map((path) => (
                                <button
                                    key={path}
                                    onClick={() => setRootPath(path)}
                                    className="w-full flex items-center justify-between p-3 bg-nexus-bg-tertiary/50 border border-nexus-border rounded-xl hover:border-nexus-accent hover:bg-nexus-bg-tertiary transition-all group"
                                >
                                    <div className="flex flex-col items-start overflow-hidden">
                                        <div className="text-xs font-medium text-nexus-fg-primary truncate w-full">
                                            {path.split(/[/\\]/).pop()}
                                        </div>
                                        <div className="text-[10px] text-nexus-fg-muted truncate w-full">
                                            {path}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="text-center">
                    <span className="text-[10px] text-nexus-fg-muted uppercase tracking-[0.2em]">Press Cmd+O to open</span>
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
