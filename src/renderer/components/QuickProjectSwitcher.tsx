import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, FolderOpen } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { ProjectEntry } from '../../preload/types';
import Tooltip from './Tooltip';

interface QuickProjectSwitcherProps {
    hasUnsavedChanges?: boolean;
}

const QuickProjectSwitcher: React.FC<QuickProjectSwitcherProps> = ({ hasUnsavedChanges = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [recentProjects, setRecentProjects] = useState<ProjectEntry[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [showTooltip, setShowTooltip] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const { project, setRootPath } = useAppStore();

    const currentProjectName = project.rootPath 
        ? project.rootPath.split(/[/\\]/).pop() || 'Unknown'
        : 'No Project';

    // Load recent projects
    useEffect(() => {
        loadRecentProjects();
    }, []);

    const loadRecentProjects = async () => {
        try {
            const recent = await window.sumerian.project.listRecent(5);
            setRecentProjects(recent);
        } catch (error) {
            console.error('Failed to load recent projects:', error);
        }
    };

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIndex(prev => 
                    prev < recentProjects.length ? prev + 1 : prev
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightedIndex === recentProjects.length) {
                    handleOpenProject();
                } else if (recentProjects[highlightedIndex]) {
                    handleSelectProject(recentProjects[highlightedIndex].path);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setIsOpen(false);
                buttonRef.current?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, highlightedIndex, recentProjects]);

    // Reset highlighted index when dropdown opens
    useEffect(() => {
        if (isOpen) {
            setHighlightedIndex(0);
        }
    }, [isOpen]);

    const handleSelectProject = async (path: string) => {
        setIsOpen(false);
        await setRootPath(path);
        await loadRecentProjects();
    };

    const handleOpenProject = async () => {
        setIsOpen(false);
        const path = await window.sumerian.project.select();
        if (path) {
            await setRootPath(path);
            await loadRecentProjects();
        }
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={toggleDropdown}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-nexus-bg-tertiary transition-colors group"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-label="Switch project"
            >
                <span className="text-xs font-medium text-nexus-fg-primary">
                    {currentProjectName}
                </span>
                {hasUnsavedChanges && (
                    <span 
                        className="unsaved-indicator"
                        aria-label="Unsaved changes"
                    >
                        ●
                    </span>
                )}
                <ChevronDown 
                    className={`w-3.5 h-3.5 text-nexus-fg-muted transition-transform duration-150 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                />
            </button>

            {showTooltip && !isOpen && project.rootPath && (
                <Tooltip text={project.rootPath} />
            )}

            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="project-switcher-dropdown"
                    role="menu"
                    aria-label="Recent projects"
                    aria-activedescendant={
                        highlightedIndex < recentProjects.length 
                            ? recentProjects[highlightedIndex]?.path 
                            : 'open-project-action'
                    }
                >
                    {recentProjects.map((proj, index) => {
                        const isActive = proj.path === project.rootPath;
                        const isHighlighted = index === highlightedIndex;

                        return (
                            <div
                                key={proj.path}
                                id={proj.path}
                                role="menuitem"
                                tabIndex={-1}
                                aria-current={isActive ? 'true' : undefined}
                                data-active={isActive}
                                className={`project-item ${isHighlighted ? 'highlighted' : ''}`}
                                onClick={() => handleSelectProject(proj.path)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                            >
                                {isActive && (
                                    <Check className="w-3.5 h-3.5 text-nexus-accent shrink-0" />
                                )}
                                <span className="flex-1 truncate">
                                    {proj.name}
                                </span>
                            </div>
                        );
                    })}

                    {recentProjects.length > 0 && (
                        <div className="project-divider" />
                    )}

                    <div
                        id="open-project-action"
                        role="menuitem"
                        tabIndex={-1}
                        className={`project-item ${
                            highlightedIndex === recentProjects.length ? 'highlighted' : ''
                        }`}
                        onClick={handleOpenProject}
                        onMouseEnter={() => setHighlightedIndex(recentProjects.length)}
                    >
                        <FolderOpen className="w-3.5 h-3.5 text-nexus-fg-muted shrink-0" />
                        <span className="flex-1">Open Project...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuickProjectSwitcher;
