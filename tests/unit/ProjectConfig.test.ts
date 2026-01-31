import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectConfigManager } from '../../src/main/projects/ProjectConfig';
import { ProjectConfig } from '../../src/main/projects/types';

describe('ProjectConfigManager', () => {
    let configManager: ProjectConfigManager;

    beforeEach(() => {
        configManager = new ProjectConfigManager();
    });

    describe('validateConfig', () => {
        it('should validate correct config', () => {
            const config: ProjectConfig = {
                version: 1,
                braveMode: true,
                model: 'claude-opus'
            };

            expect(configManager.validateConfig(config)).toBe(true);
        });

        it('should reject config without version', () => {
            const config = {
                braveMode: true
            };

            expect(configManager.validateConfig(config)).toBe(false);
        });

        it('should reject config with wrong version', () => {
            const config = {
                version: 2,
                braveMode: true
            };

            expect(configManager.validateConfig(config)).toBe(false);
        });

        it('should reject config with invalid braveMode type', () => {
            const config = {
                version: 1,
                braveMode: 'true'
            };

            expect(configManager.validateConfig(config)).toBe(false);
        });

        it('should reject config with invalid model type', () => {
            const config = {
                version: 1,
                model: 123
            };

            expect(configManager.validateConfig(config)).toBe(false);
        });

        it('should reject config with invalid additionalDirs type', () => {
            const config = {
                version: 1,
                additionalDirs: 'not-an-array'
            };

            expect(configManager.validateConfig(config)).toBe(false);
        });

        it('should reject config with non-string items in additionalDirs', () => {
            const config = {
                version: 1,
                additionalDirs: ['/path/one', 123, '/path/two']
            };

            expect(configManager.validateConfig(config)).toBe(false);
        });

        it('should accept config with valid additionalDirs', () => {
            const config: ProjectConfig = {
                version: 1,
                additionalDirs: ['/path/one', '/path/two']
            };

            expect(configManager.validateConfig(config)).toBe(true);
        });

        it('should accept config with valid allowedTools', () => {
            const config: ProjectConfig = {
                version: 1,
                allowedTools: ['read_file', 'write_file']
            };

            expect(configManager.validateConfig(config)).toBe(true);
        });

        it('should reject config with invalid allowedTools', () => {
            const config = {
                version: 1,
                allowedTools: ['read_file', 123]
            };

            expect(configManager.validateConfig(config)).toBe(false);
        });

        it('should accept config with valid disallowedTools', () => {
            const config: ProjectConfig = {
                version: 1,
                disallowedTools: ['delete_file', 'run_command']
            };

            expect(configManager.validateConfig(config)).toBe(true);
        });

        it('should accept minimal config with only version', () => {
            const config: ProjectConfig = {
                version: 1
            };

            expect(configManager.validateConfig(config)).toBe(true);
        });
    });

    describe('mergeWithGlobal', () => {
        it('should use project config over global settings', () => {
            const projectConfig: ProjectConfig = {
                version: 1,
                braveMode: true,
                model: 'claude-opus'
            };

            const globalSettings = {
                braveMode: false,
                model: 'claude-sonnet'
            };

            const merged = configManager.mergeWithGlobal(projectConfig, globalSettings);

            expect(merged.braveMode).toBe(true);
            expect(merged.model).toBe('claude-opus');
        });

        it('should fall back to global settings if project config is empty', () => {
            const projectConfig: ProjectConfig = {
                version: 1
            };

            const globalSettings = {
                braveMode: true,
                model: 'claude-sonnet'
            };

            const merged = configManager.mergeWithGlobal(projectConfig, globalSettings);

            expect(merged.braveMode).toBe(true);
            expect(merged.model).toBe('claude-sonnet');
        });

        it('should use global settings if project config is null', () => {
            const globalSettings = {
                braveMode: true,
                model: 'claude-opus',
                mcpConfigPath: '/path/to/mcp.json'
            };

            const merged = configManager.mergeWithGlobal(null, globalSettings);

            expect(merged.braveMode).toBe(true);
            expect(merged.model).toBe('claude-opus');
            expect(merged.mcpConfigPath).toBe('/path/to/mcp.json');
        });

        it('should merge additionalDirs from project config', () => {
            const projectConfig: ProjectConfig = {
                version: 1,
                additionalDirs: ['/project/lib']
            };

            const globalSettings = {
                additionalDirs: ['/global/lib']
            };

            const merged = configManager.mergeWithGlobal(projectConfig, globalSettings);

            expect(merged.additionalDirs).toEqual(['/project/lib']);
        });

        it('should include allowedTools from project config', () => {
            const projectConfig: ProjectConfig = {
                version: 1,
                allowedTools: ['read_file', 'write_file']
            };

            const globalSettings = {};

            const merged = configManager.mergeWithGlobal(projectConfig, globalSettings);

            expect(merged.allowedTools).toEqual(['read_file', 'write_file']);
        });

        it('should include disallowedTools from project config', () => {
            const projectConfig: ProjectConfig = {
                version: 1,
                disallowedTools: ['delete_file']
            };

            const globalSettings = {};

            const merged = configManager.mergeWithGlobal(projectConfig, globalSettings);

            expect(merged.disallowedTools).toEqual(['delete_file']);
        });

        it('should handle partial project config', () => {
            const projectConfig: ProjectConfig = {
                version: 1,
                braveMode: true
            };

            const globalSettings = {
                braveMode: false,
                model: 'claude-sonnet',
                mcpConfigPath: '/path/to/mcp.json'
            };

            const merged = configManager.mergeWithGlobal(projectConfig, globalSettings);

            expect(merged.braveMode).toBe(true);
            expect(merged.model).toBe('claude-sonnet');
            expect(merged.mcpConfigPath).toBe('/path/to/mcp.json');
        });
    });

    describe('createDefaultConfig', () => {
        it('should create minimal valid config', () => {
            const config = configManager.createDefaultConfig();

            expect(config.version).toBe(1);
            expect(config.braveMode).toBeUndefined();
            expect(config.model).toBeUndefined();
        });

        it('should pass validation', () => {
            const config = configManager.createDefaultConfig();
            expect(configManager.validateConfig(config)).toBe(true);
        });
    });

    describe('sanitizeConfig', () => {
        it('should remove invalid fields', () => {
            const dirtyConfig: any = {
                version: 1,
                braveMode: true,
                invalidField: 'should be removed',
                anotherInvalid: 123
            };

            const sanitized = configManager.sanitizeConfig(dirtyConfig);

            expect(sanitized.version).toBe(1);
            expect(sanitized.braveMode).toBe(true);
            expect((sanitized as any).invalidField).toBeUndefined();
            expect((sanitized as any).anotherInvalid).toBeUndefined();
        });

        it('should filter out invalid types', () => {
            const dirtyConfig: any = {
                version: 1,
                braveMode: 'not a boolean',
                model: 123,
                additionalDirs: ['/valid', 123, '/another-valid']
            };

            const sanitized = configManager.sanitizeConfig(dirtyConfig);

            expect(sanitized.braveMode).toBeUndefined();
            expect(sanitized.model).toBeUndefined();
            expect(sanitized.additionalDirs).toEqual(['/valid', '/another-valid']);
        });

        it('should preserve valid fields', () => {
            const validConfig: any = {
                version: 1,
                name: 'My Project',
                braveMode: true,
                model: 'claude-opus',
                mcpConfigPath: '/path/to/mcp.json',
                additionalDirs: ['/lib', '/utils'],
                allowedTools: ['read_file', 'write_file'],
                disallowedTools: ['delete_file']
            };

            const sanitized = configManager.sanitizeConfig(validConfig);

            expect(sanitized.version).toBe(1);
            expect(sanitized.name).toBe('My Project');
            expect(sanitized.braveMode).toBe(true);
            expect(sanitized.model).toBe('claude-opus');
            expect(sanitized.mcpConfigPath).toBe('/path/to/mcp.json');
            expect(sanitized.additionalDirs).toEqual(['/lib', '/utils']);
            expect(sanitized.allowedTools).toEqual(['read_file', 'write_file']);
            expect(sanitized.disallowedTools).toEqual(['delete_file']);
        });

        it('should always include version', () => {
            const emptyConfig = {};
            const sanitized = configManager.sanitizeConfig(emptyConfig);

            expect(sanitized.version).toBe(1);
        });

        it('should filter non-string items from tool arrays', () => {
            const dirtyConfig: any = {
                version: 1,
                allowedTools: ['read_file', 123, null, 'write_file', undefined],
                disallowedTools: ['delete_file', false, 'run_command']
            };

            const sanitized = configManager.sanitizeConfig(dirtyConfig);

            expect(sanitized.allowedTools).toEqual(['read_file', 'write_file']);
            expect(sanitized.disallowedTools).toEqual(['delete_file', 'run_command']);
        });

        it('should handle empty arrays', () => {
            const config: any = {
                version: 1,
                additionalDirs: [],
                allowedTools: [],
                disallowedTools: []
            };

            const sanitized = configManager.sanitizeConfig(config);

            expect(sanitized.additionalDirs).toEqual([]);
            expect(sanitized.allowedTools).toEqual([]);
            expect(sanitized.disallowedTools).toEqual([]);
        });
    });
});
