import React, { useState, useEffect } from 'react';
import { Server, Plus, Trash2, FileJson, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

interface MCPTemplate {
  id: string;
  name: string;
  displayName: string;
  description: string;
  config: MCPServerConfig;
  setup: string;
  requiredEnv: string[];
  category: string;
}

const MCPSettings: React.FC = () => {
  const [config, setConfig] = useState<MCPConfig>({ mcpServers: {} });
  const [jsonText, setJsonText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configPath, setConfigPath] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const content = await window.sumerian.files.read(
        `${process.env.HOME}/.sumerian/mcp-config.json`
      ).catch(() => '{"mcpServers":{}}');
      
      const parsed = JSON.parse(content);
      setConfig(parsed);
      setJsonText(JSON.stringify(parsed, null, 2));
      setConfigPath(`${process.env.HOME}/.sumerian/mcp-config.json`);
      setError(null);
    } catch (err) {
      setError('Failed to load MCP config');
      setConfig({ mcpServers: {} });
      setJsonText('{"mcpServers":{}}');
    }
  };

  const saveConfig = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      await window.sumerian.files.write(
        `${process.env.HOME}/.sumerian/mcp-config.json`,
        JSON.stringify(parsed, null, 2)
      );
      setConfig(parsed);
      setError(null);
      setIsEditing(false);
      
      // Update CLI config path
      await window.sumerian.cli.setMcpConfigPath(`${process.env.HOME}/.sumerian/mcp-config.json`);
    } catch (err) {
      setError('Invalid JSON format');
    }
  };

  const addTemplate = (template: { name: string; config: MCPServerConfig }) => {
    const newConfig = {
      ...config,
      mcpServers: {
        ...config.mcpServers,
        [template.name]: template.config
      }
    };
    setConfig(newConfig);
    setJsonText(JSON.stringify(newConfig, null, 2));
  };

  const removeServer = (name: string) => {
    const newServers = { ...config.mcpServers };
    delete newServers[name];
    const newConfig = { mcpServers: newServers };
    setConfig(newConfig);
    setJsonText(JSON.stringify(newConfig, null, 2));
  };

  // Load templates from JSON (in production, this would be loaded via IPC)
  const templates: MCPTemplate[] = [
    {
      id: 'sequential-thinking',
      name: 'sequential-thinking',
      displayName: 'Sequential Thinking',
      description: 'Enhanced step-by-step reasoning for complex problems',
      config: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sequential-thinking']
      },
      setup: 'No setup required - works out of the box',
      requiredEnv: [],
      category: 'reasoning'
    },
    {
      id: 'google-search',
      name: 'google-search',
      displayName: 'Google Search',
      description: 'Search Google and get real-time web results',
      config: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-google-search'],
        env: {
          GOOGLE_API_KEY: '<YOUR_API_KEY>',
          GOOGLE_CSE_ID: '<YOUR_CSE_ID>'
        }
      },
      setup: '1. Go to https://console.cloud.google.com/apis/credentials\n2. Create API key\n3. Enable Custom Search API',
      requiredEnv: ['GOOGLE_API_KEY', 'GOOGLE_CSE_ID'],
      category: 'search'
    },
    {
      id: 'brave-search',
      name: 'brave-search',
      displayName: 'Brave Search',
      description: 'Search the web using Brave Search API',
      config: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-brave-search'],
        env: {
          BRAVE_API_KEY: '<YOUR_API_KEY>'
        }
      },
      setup: 'Get API key from https://brave.com/search/api/',
      requiredEnv: ['BRAVE_API_KEY'],
      category: 'search'
    },
    {
      id: 'github',
      name: 'github',
      displayName: 'GitHub',
      description: 'Interact with GitHub repositories, issues, and PRs',
      config: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: {
          GITHUB_TOKEN: '<YOUR_PERSONAL_ACCESS_TOKEN>'
        }
      },
      setup: 'Create a personal access token at https://github.com/settings/tokens',
      requiredEnv: ['GITHUB_TOKEN'],
      category: 'development'
    },
    {
      id: 'filesystem',
      name: 'filesystem',
      displayName: 'Filesystem Access',
      description: 'Read and write files outside the project directory',
      config: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/allowed/directory']
      },
      setup: 'Replace /path/to/allowed/directory with the actual path',
      requiredEnv: [],
      category: 'filesystem'
    },
    {
      id: 'memory',
      name: 'memory',
      displayName: 'Memory',
      description: 'Persistent key-value storage for agent memory',
      config: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-memory']
      },
      setup: 'No setup required - stores data in ~/.mcp/memory',
      requiredEnv: [],
      category: 'storage'
    }
  ];

  const serverCount = Object.keys(config.mcpServers).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-nexus-fg-primary">MCP Tool Servers</h3>
        <p className="text-xs text-nexus-fg-muted mt-1">
          Configure Model Context Protocol servers to extend agent capabilities
        </p>
      </div>

      {/* Config Path Info */}
      <div className="p-3 rounded-xl bg-nexus-bg-tertiary border border-nexus-border">
        <div className="flex items-start gap-2">
          <FileJson className="w-4 h-4 text-nexus-accent mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-nexus-fg-muted mb-1">Config File</p>
            <p className="text-xs text-nexus-fg-primary font-mono truncate">{configPath}</p>
          </div>
        </div>
      </div>

      {/* Server Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-nexus-fg-muted" />
          <span className="text-xs text-nexus-fg-secondary">
            {serverCount} {serverCount === 1 ? 'server' : 'servers'} configured
          </span>
        </div>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nexus-accent text-white text-xs font-bold hover:bg-nexus-accent/80 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Server
        </button>
      </div>

      {/* Template Library */}
      {showTemplates && (
        <div className="space-y-2 p-4 rounded-xl bg-nexus-bg-tertiary border border-nexus-border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-nexus-fg-primary">Server Templates</h4>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-xs text-nexus-fg-muted hover:text-nexus-fg-primary"
            >
              Close
            </button>
          </div>
          
          {templates.map((template) => (
            <div
              key={template.id}
              className="p-3 rounded-lg bg-nexus-bg-primary border border-nexus-border"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h5 className="text-xs font-bold text-nexus-fg-primary">{template.displayName}</h5>
                  <p className="text-[10px] text-nexus-fg-muted mt-0.5">{template.description}</p>
                </div>
                <button
                  onClick={() => {
                    addTemplate({ name: template.name, config: template.config });
                    setShowTemplates(false);
                  }}
                  disabled={template.name in config.mcpServers}
                  className="px-2 py-1 rounded bg-blue-500/20 text-blue-500 text-[10px] font-bold hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {template.name in config.mcpServers ? 'Added' : 'Add'}
                </button>
              </div>
              <div className="flex items-start gap-1.5 mt-2">
                <AlertCircle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-nexus-fg-muted">{template.setup}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Server List */}
      {serverCount > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-nexus-fg-muted">
            Configured Servers
          </h4>
          {Object.entries(config.mcpServers).map(([name, serverConfig]) => (
            <div
              key={name}
              className="p-3 rounded-xl bg-nexus-bg-tertiary border border-nexus-border"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-nexus-accent" />
                  <span className="text-xs font-bold text-nexus-fg-primary">{name}</span>
                </div>
                <button
                  onClick={() => removeServer(name)}
                  className="p-1 rounded hover:bg-nexus-bg-primary text-nexus-fg-muted hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <div className="space-y-1.5 mt-2">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-nexus-fg-muted w-16 flex-shrink-0">Command:</span>
                  <span className="text-[10px] text-nexus-fg-secondary font-mono">{serverConfig.command}</span>
                </div>
                
                {serverConfig.args && serverConfig.args.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-nexus-fg-muted w-16 flex-shrink-0">Args:</span>
                    <span className="text-[10px] text-nexus-fg-secondary font-mono">
                      {serverConfig.args.join(' ')}
                    </span>
                  </div>
                )}
                
                {serverConfig.env && Object.keys(serverConfig.env).length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-nexus-fg-muted w-16 flex-shrink-0">Env:</span>
                    <div className="flex-1 space-y-0.5">
                      {Object.entries(serverConfig.env).map(([key, value]) => (
                        <div key={key} className="text-[10px] text-nexus-fg-secondary font-mono">
                          {key}={value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* JSON Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-nexus-fg-muted">
            Raw Configuration
          </h4>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-nexus-accent hover:underline font-bold"
            >
              Edit JSON
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setJsonText(JSON.stringify(config, null, 2));
                  setError(null);
                }}
                className="text-xs text-nexus-fg-muted hover:text-nexus-fg-primary"
              >
                Cancel
              </button>
              <button
                onClick={saveConfig}
                className="px-3 py-1 rounded-lg bg-nexus-accent text-white text-xs font-bold hover:bg-nexus-accent/80"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-xs text-red-500">{error}</span>
          </div>
        )}

        <div className="relative">
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            disabled={!isEditing}
            className="w-full h-64 px-3 py-2 rounded-xl bg-nexus-bg-primary border border-nexus-border text-xs text-nexus-fg-primary font-mono focus:outline-none focus:border-nexus-accent resize-none disabled:opacity-60"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Help Text */}
      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-blue-500 font-bold mb-1">How MCP Works</p>
            <p className="text-[10px] text-blue-400 leading-relaxed">
              MCP servers are managed by the Claude CLI. Sumerian passes the config file path when starting the agent. 
              Servers are spawned automatically and provide tools like Google Search or Sequential Thinking.
            </p>
            <a
              href="https://modelcontextprotocol.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-[10px] text-blue-500 hover:underline"
            >
              Learn more about MCP
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCPSettings;
