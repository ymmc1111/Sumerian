import { ProjectConfig, ProjectConfigOverrides } from './types';

export class ProjectConfigManager {
    validateConfig(config: any): config is ProjectConfig {
        if (!config || typeof config !== 'object') {
            return false;
        }

        if (config.version !== 1) {
            return false;
        }

        if (config.name !== undefined && typeof config.name !== 'string') {
            return false;
        }

        if (config.braveMode !== undefined && typeof config.braveMode !== 'boolean') {
            return false;
        }

        if (config.model !== undefined && typeof config.model !== 'string') {
            return false;
        }

        if (config.mcpConfigPath !== undefined && typeof config.mcpConfigPath !== 'string') {
            return false;
        }

        if (config.additionalDirs !== undefined) {
            if (!Array.isArray(config.additionalDirs)) {
                return false;
            }
            if (!config.additionalDirs.every((dir: any) => typeof dir === 'string')) {
                return false;
            }
        }

        if (config.allowedTools !== undefined) {
            if (!Array.isArray(config.allowedTools)) {
                return false;
            }
            if (!config.allowedTools.every((tool: any) => typeof tool === 'string')) {
                return false;
            }
        }

        if (config.disallowedTools !== undefined) {
            if (!Array.isArray(config.disallowedTools)) {
                return false;
            }
            if (!config.disallowedTools.every((tool: any) => typeof tool === 'string')) {
                return false;
            }
        }

        return true;
    }

    mergeWithGlobal(
        projectConfig: ProjectConfig | null,
        globalSettings: {
            braveMode?: boolean;
            model?: string;
            mcpConfigPath?: string;
            additionalDirs?: string[];
        }
    ): ProjectConfigOverrides {
        const merged: ProjectConfigOverrides = {};

        if (projectConfig) {
            if (projectConfig.braveMode !== undefined) {
                merged.braveMode = projectConfig.braveMode;
            } else if (globalSettings.braveMode !== undefined) {
                merged.braveMode = globalSettings.braveMode;
            }

            if (projectConfig.model !== undefined) {
                merged.model = projectConfig.model;
            } else if (globalSettings.model !== undefined) {
                merged.model = globalSettings.model;
            }

            if (projectConfig.mcpConfigPath !== undefined) {
                merged.mcpConfigPath = projectConfig.mcpConfigPath;
            } else if (globalSettings.mcpConfigPath !== undefined) {
                merged.mcpConfigPath = globalSettings.mcpConfigPath;
            }

            if (projectConfig.additionalDirs !== undefined) {
                merged.additionalDirs = projectConfig.additionalDirs;
            } else if (globalSettings.additionalDirs !== undefined) {
                merged.additionalDirs = globalSettings.additionalDirs;
            }

            if (projectConfig.allowedTools !== undefined) {
                merged.allowedTools = projectConfig.allowedTools;
            }

            if (projectConfig.disallowedTools !== undefined) {
                merged.disallowedTools = projectConfig.disallowedTools;
            }
        } else {
            if (globalSettings.braveMode !== undefined) {
                merged.braveMode = globalSettings.braveMode;
            }
            if (globalSettings.model !== undefined) {
                merged.model = globalSettings.model;
            }
            if (globalSettings.mcpConfigPath !== undefined) {
                merged.mcpConfigPath = globalSettings.mcpConfigPath;
            }
            if (globalSettings.additionalDirs !== undefined) {
                merged.additionalDirs = globalSettings.additionalDirs;
            }
        }

        return merged;
    }

    createDefaultConfig(): ProjectConfig {
        return {
            version: 1
        };
    }

    sanitizeConfig(config: Partial<ProjectConfig>): ProjectConfig {
        const sanitized: ProjectConfig = {
            version: 1
        };

        if (config.name !== undefined && typeof config.name === 'string') {
            sanitized.name = config.name;
        }

        if (config.braveMode !== undefined && typeof config.braveMode === 'boolean') {
            sanitized.braveMode = config.braveMode;
        }

        if (config.model !== undefined && typeof config.model === 'string') {
            sanitized.model = config.model;
        }

        if (config.mcpConfigPath !== undefined && typeof config.mcpConfigPath === 'string') {
            sanitized.mcpConfigPath = config.mcpConfigPath;
        }

        if (config.additionalDirs !== undefined && Array.isArray(config.additionalDirs)) {
            sanitized.additionalDirs = config.additionalDirs.filter(dir => typeof dir === 'string');
        }

        if (config.allowedTools !== undefined && Array.isArray(config.allowedTools)) {
            sanitized.allowedTools = config.allowedTools.filter(tool => typeof tool === 'string');
        }

        if (config.disallowedTools !== undefined && Array.isArray(config.disallowedTools)) {
            sanitized.disallowedTools = config.disallowedTools.filter(tool => typeof tool === 'string');
        }

        return sanitized;
    }
}

export const projectConfigManager = new ProjectConfigManager();
