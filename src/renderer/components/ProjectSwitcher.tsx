import React, { useState, useEffect, useRef } from 'react';
import { X, Folder, Search, Clock, ChevronRight } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { ProjectEntry } from '../../preload/types';

interface ProjectSwitcherProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({ isOpen, onClose }) => {
    const [projects, setProjects] = useState<ProjectEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const { setRootPath } = useAppStore();

    useEffect(() => {
        if (isOpen) {
            loadProjects();
            setSearchQuery('');
            setSelectedIndex(0);
            // Focus search input when modal opens
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const loadProjects = async () => {
        setIsLoading(true);
        try {
            const recentProjects = await window.sumerian.project.listRecent(10);
            setProjects(recentProjects);
        } catch (error) {
            console.error('Failed to load recent projects:', error);
            setProjects([]);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredProjects = projects.filter(project => {
        const query = searchQuery.toLowerCase();
        return (
            project.name.toLowerCase().includes(query) ||
            project.path.toLowerCase().includes(query)
        );
    });

    const handleSelectProject = async (project: ProjectEntry) => {
        onClose();
        await setRootPath(project.path);
    };

    const handleBrowse = async () => {
        onClose();
        const path = await window.sumerian.project.select();
        if (path) {
            await setRootPath(path);
        }
    };

    const handleRemoveProject = async (e: React.MouseEvent, projectPath: string) => {
        e.stopPropagation();
        try {
            await window.sumerian.project.remove(projectPath);
            await loadProjects();
            if (selectedIndex >= filteredProjects.length - 1) {
                setSelectedIndex(Math.max(0, filteredProjects.length - 2));
            }
        } catch (error) {
            console.error('Failed to remove project:', error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, filteredProjects.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredProjects[selectedIndex]) {
                handleSelectProject(filteredProjects[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    useEffect(() => {
        if (listRef.current && filteredProjects.length > 0) {
            const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [selectedIndex, filteredProjects.length]);

    const formatLastOpened = (timestamp: number): string => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days}d ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-32 p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl bg-nexus-bg-secondary border border-nexus-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                {/* Header */}
                <div className="h-14 px-6 border-b border-nexus-border flex items-center justify-between shrink-0 bg-nexus-bg-tertiary">
                    <div className="flex items-center space-x-3">
                        <Folder className="w-4 h-4 text-nexus-accent" />
                        <h2 className="text-sm font-bold text-nexus-fg-primary">Switch Project</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-nexus-bg-primary rounded-lg text-nexus-fg-muted hover:text-nexus-fg-primary transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Search Input */}
                <div className="px-6 py-4 border-b border-nexus-border bg-nexus-bg-primary">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nexus-fg-muted" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setSelectedIndex(0);
                            }}
                            placeholder="Search projects..."
                            className="w-full pl-10 pr-4 py-2 bg-nexus-bg-tertiary border border-nexus-border rounded-xl text-sm text-nexus-fg-primary placeholder-nexus-fg-muted focus:outline-none focus:border-nexus-accent transition-colors"
                        />
                    </div>
                </div>

                {/* Project List */}
                <div
                    ref={listRef}
                    className="max-h-96 overflow-y-auto bg-nexus-bg-primary"
                >
                    {isLoading ? (
                        <div className="px-6 py-12 text-center text-nexus-fg-muted text-sm">
                            Loading projects...
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <Folder className="w-12 h-12 mx-auto mb-3 text-nexus-fg-muted opacity-50" />
                            <p className="text-sm text-nexus-fg-muted">
                                {searchQuery ? 'No projects match your search' : 'No recent projects'}
                            </p>
                        </div>
                    ) : (
                        filteredProjects.map((project, index) => (
                            <button
                                key={project.path}
                                onClick={() => handleSelectProject(project)}
                                className={`w-full px-6 py-4 flex items-center justify-between border-b border-nexus-border last:border-b-0 transition-all ${
                                    index === selectedIndex
                                        ? 'bg-nexus-accent/10 border-l-2 border-l-nexus-accent'
                                        : 'hover:bg-nexus-bg-tertiary border-l-2 border-l-transparent'
                                }`}
                            >
                                <div className="flex items-start space-x-4 flex-1 min-w-0">
                                    <Folder className="w-5 h-5 text-nexus-accent shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="text-sm font-medium text-nexus-fg-primary truncate">
                                            {project.name}
                                        </div>
                                        <div className="text-xs text-nexus-fg-muted truncate mt-1">
                                            {project.path}
                                        </div>
                                        <div className="flex items-center space-x-2 mt-2">
                                            <Clock className="w-3 h-3 text-nexus-fg-muted" />
                                            <span className="text-xs text-nexus-fg-muted">
                                                {formatLastOpened(project.lastOpened)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 shrink-0">
                                    <button
                                        onClick={(e) => handleRemoveProject(e, project.path)}
                                        className="p-1.5 hover:bg-nexus-bg-secondary rounded-lg text-nexus-fg-muted hover:text-red-500 transition-all"
                                        title="Remove from recent"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                    <ChevronRight className="w-4 h-4 text-nexus-fg-muted" />
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-nexus-border bg-nexus-bg-tertiary">
                    <button
                        onClick={handleBrowse}
                        className="w-full px-4 py-2.5 bg-nexus-accent hover:bg-nexus-accent-hover text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center space-x-2"
                    >
                        <Folder className="w-4 h-4" />
                        <span>Browse...</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectSwitcher;
