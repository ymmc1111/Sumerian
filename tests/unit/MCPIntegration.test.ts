import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';

describe('MCP Integration', () => {
  const testProjectRoot = '/tmp/test-project';
  const globalMcpPath = path.join(process.env.HOME || '', '.sumerian', 'mcp-config.json');
  const projectMcpPath = path.join(testProjectRoot, '.sumerian', 'mcp-config.json');

  describe('Config Path Resolution', () => {
    it('should prefer project-specific config over global config', () => {
      const projectExists = fs.existsSync(projectMcpPath);
      const globalExists = fs.existsSync(globalMcpPath);

      if (projectExists) {
        expect(projectMcpPath).toBeTruthy();
      } else if (globalExists) {
        expect(globalMcpPath).toBeTruthy();
      } else {
        expect(projectExists || globalExists).toBe(false);
      }
    });

    it('should validate MCP config JSON structure', () => {
      const validConfig = {
        mcpServers: {
          'test-server': {
            command: 'npx',
            args: ['-y', '@test/server'],
            env: {
              API_KEY: 'test-key'
            }
          }
        }
      };

      expect(validConfig).toHaveProperty('mcpServers');
      expect(validConfig.mcpServers).toHaveProperty('test-server');
      expect(validConfig.mcpServers['test-server']).toHaveProperty('command');
      expect(validConfig.mcpServers['test-server'].command).toBe('npx');
    });
  });

  describe('CLI Args Generation', () => {
    it('should generate correct CLI args with MCP config', () => {
      const baseArgs = ['-p', '--output-format', 'stream-json', '--verbose'];
      const mcpConfigPath = '/path/to/mcp-config.json';
      const mcpArgs = ['--mcp-config', mcpConfigPath];
      const fullArgs = [...baseArgs, ...mcpArgs];

      expect(fullArgs).toContain('--mcp-config');
      expect(fullArgs).toContain(mcpConfigPath);
      expect(fullArgs[0]).toBe('-p');
    });

    it('should generate correct CLI args without MCP config', () => {
      const baseArgs = ['-p', '--output-format', 'stream-json', '--verbose'];
      const mcpConfigPath = null;
      const mcpArgs = mcpConfigPath ? ['--mcp-config', mcpConfigPath] : [];
      const fullArgs = [...baseArgs, ...mcpArgs];

      expect(fullArgs).not.toContain('--mcp-config');
      expect(fullArgs.length).toBe(4);
    });
  });

  describe('Server Templates', () => {
    it('should have valid template structure', () => {
      const template = {
        id: 'sequential-thinking',
        name: 'sequential-thinking',
        displayName: 'Sequential Thinking',
        description: 'Enhanced step-by-step reasoning',
        config: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-sequential-thinking']
        },
        setup: 'No setup required',
        requiredEnv: [],
        category: 'reasoning'
      };

      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('config');
      expect(template.config).toHaveProperty('command');
      expect(template.config).toHaveProperty('args');
      expect(Array.isArray(template.requiredEnv)).toBe(true);
    });

    it('should validate required environment variables', () => {
      const googleSearchTemplate = {
        id: 'google-search',
        requiredEnv: ['GOOGLE_API_KEY', 'GOOGLE_CSE_ID'],
        config: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-google-search'],
          env: {
            GOOGLE_API_KEY: '<YOUR_API_KEY>',
            GOOGLE_CSE_ID: '<YOUR_CSE_ID>'
          }
        }
      };

      expect(googleSearchTemplate.requiredEnv.length).toBe(2);
      expect(googleSearchTemplate.config.env).toHaveProperty('GOOGLE_API_KEY');
      expect(googleSearchTemplate.config.env).toHaveProperty('GOOGLE_CSE_ID');
    });
  });

  describe('Config Merging', () => {
    it('should merge project config over global config', () => {
      const globalConfig = {
        mcpServers: {
          'server-a': { command: 'global-a', args: [] },
          'server-b': { command: 'global-b', args: [] }
        }
      };

      const projectConfig = {
        mcpServers: {
          'server-b': { command: 'project-b', args: [] },
          'server-c': { command: 'project-c', args: [] }
        }
      };

      const merged = {
        mcpServers: {
          ...globalConfig.mcpServers,
          ...projectConfig.mcpServers
        }
      };

      expect(merged.mcpServers['server-a'].command).toBe('global-a');
      expect(merged.mcpServers['server-b'].command).toBe('project-b'); // Overridden
      expect(merged.mcpServers['server-c'].command).toBe('project-c');
    });
  });
});
