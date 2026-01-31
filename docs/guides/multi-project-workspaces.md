# Multi-Project Workspaces

Sumerian supports working with multiple projects simultaneously, each with isolated CLI sessions, configurations, and conversation history. This guide explains how to use the multi-project workspace feature effectively.

## Overview

The multi-project workspace feature allows you to:
- Switch between projects quickly with `Cmd+O`
- Maintain separate agent sessions per project
- Configure project-specific settings
- Track recent projects (up to 10)
- Search and filter your project list

## Opening Projects

### First Time

When you first launch Sumerian, you'll see a welcome screen with an "Open Folder" button. Click it to select your project directory.

### Switching Projects

Press `Cmd+O` to open the Project Switcher modal. This shows:
- **Recent Projects**: Your 10 most recently opened projects, sorted by last access
- **Search Bar**: Filter projects by name or path
- **Browse Button**: Open a new project not in your recent list

### Keyboard Navigation

The Project Switcher supports full keyboard navigation:
- `Cmd+O` - Open project switcher
- `↑/↓` - Navigate through project list
- `Enter` - Open selected project
- `Escape` - Close switcher
- Type to search projects in real-time

## Project Registry

Sumerian maintains a registry of recent projects at `~/.sumerian/projects.json`. This file tracks:
- Project path (absolute)
- Display name (folder name by default)
- Last opened timestamp
- Last active session ID
- Project-specific configuration overrides

### Registry Format

```json
{
  "version": 1,
  "projects": [
    {
      "path": "/Users/you/projects/my-app",
      "name": "my-app",
      "lastOpened": 1706745600000,
      "lastSessionId": "session-abc123",
      "configOverrides": {
        "braveMode": true,
        "model": "claude-opus"
      }
    }
  ]
}
```

### Managing the Registry

- **Maximum Projects**: Registry stores up to 10 recent projects
- **Automatic Cleanup**: Oldest projects are removed when limit is reached
- **Manual Removal**: Click the X icon next to any project in the switcher
- **Reset Registry**: Delete `~/.sumerian/projects.json` to start fresh

## Per-Project Configuration

Each project can have its own configuration file at `.sumerian/config.json` within the project directory.

### Configuration Options

```json
{
  "version": 1,
  "name": "Custom Project Name",
  "braveMode": true,
  "model": "claude-opus",
  "mcpConfigPath": "./mcp-config.json",
  "additionalDirs": ["../shared-lib", "../utils"],
  "allowedTools": ["read_file", "write_file", "list_dir"],
  "disallowedTools": ["run_command"]
}
```

### Configuration Hierarchy

Settings are applied in this order (later overrides earlier):
1. **Global Settings**: From Sumerian's main settings panel
2. **Project Config**: From `.sumerian/config.json`
3. **Registry Overrides**: From the project entry in the registry

### Configuration Fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | `1` | Config format version (required) |
| `name` | `string` | Custom display name for the project |
| `braveMode` | `boolean` | Enable/disable Brave Mode by default |
| `model` | `string` | Default Claude model (`claude-opus`, `claude-sonnet`, `claude-haiku`) |
| `mcpConfigPath` | `string` | Path to MCP server configuration (relative or absolute) |
| `additionalDirs` | `string[]` | Additional directories to include in context (for monorepos) |
| `allowedTools` | `string[]` | Whitelist of tools the agent can use |
| `disallowedTools` | `string[]` | Blacklist of tools the agent cannot use |

## Session Isolation

Each project maintains its own isolated agent session:

### What's Isolated
- **CLI Instance**: Separate Claude CLI process per project
- **Conversation History**: Each project has its own chat history
- **File Context**: Agent only sees files in the current project (unless `additionalDirs` is configured)
- **Lore Files**: Project-specific lore from `.sumerian/lore/`

### What's Shared
- **Global Settings**: Settings from the main Settings panel (unless overridden)
- **Credentials**: OAuth tokens and API keys
- **Audit Log**: All projects log to `~/.sumerian/audit.log`
- **Snapshots**: File backups are project-specific but stored in project's `.sumerian/snapshots/`

## Best Practices

### Organizing Projects

1. **Use Descriptive Names**: Rename projects in config if folder names aren't clear
2. **Group Related Projects**: Use `additionalDirs` for monorepo setups
3. **Project-Specific Settings**: Configure `braveMode` per project based on trust level

### Performance Considerations

1. **Memory Usage**: Each project maintains a CLI instance (~100-200MB per project)
2. **Switching Speed**: First switch to a project may take 2-3 seconds to initialize CLI
3. **Concurrent Projects**: Keep 2-3 projects open for best performance

### Security

1. **Sensitive Projects**: Disable `braveMode` for projects with sensitive data
2. **Tool Restrictions**: Use `allowedTools`/`disallowedTools` for restricted environments
3. **Audit Trail**: Review `~/.sumerian/audit.log` for cross-project activity

## Common Workflows

### Monorepo Development

```json
{
  "version": 1,
  "name": "Frontend App",
  "additionalDirs": [
    "../shared-components",
    "../api-types"
  ]
}
```

This gives the agent context from multiple directories while keeping the project root focused.

### Client Projects

```json
{
  "version": 1,
  "name": "Client XYZ - Dashboard",
  "braveMode": false,
  "disallowedTools": ["run_command", "bash"]
}
```

Safer configuration for client work where you want more control.

### Personal Projects

```json
{
  "version": 1,
  "braveMode": true,
  "model": "claude-opus",
  "mcpConfigPath": "./mcp-config.json"
}
```

Full autonomy with MCP tools for personal experimentation.

## Troubleshooting

### Project Not Appearing in Recent List

- Check that you've opened the project at least once
- Verify `~/.sumerian/projects.json` exists and is valid JSON
- Registry may be full (max 10 projects) - remove old ones

### Configuration Not Applied

- Verify `.sumerian/config.json` has correct format
- Check that `version: 1` is present
- Look for JSON syntax errors
- Restart Sumerian after config changes

### Session Not Preserved

- Session preservation requires `lastSessionId` in registry
- Check that project path hasn't changed
- Verify `.sumerian/` directory has write permissions

### Slow Project Switching

- First switch initializes CLI (2-3s is normal)
- Subsequent switches should be faster
- Close unused projects to free memory
- Check system resources (CPU/RAM)

## Advanced Usage

### Programmatic Access

The project registry can be read/modified programmatically:

```bash
# View registry
cat ~/.sumerian/projects.json | jq

# Add project manually
jq '.projects += [{"path": "/new/project", "name": "new-project", "lastOpened": 1706745600000}]' \
  ~/.sumerian/projects.json > temp.json && mv temp.json ~/.sumerian/projects.json
```

### Backup and Sync

To sync projects across machines:

```bash
# Backup
cp ~/.sumerian/projects.json ~/Dropbox/sumerian-backup/

# Restore
cp ~/Dropbox/sumerian-backup/projects.json ~/.sumerian/
```

Note: Paths must be valid on the target machine.

### Custom Project Templates

Create template configs for new projects:

```bash
# Create template
mkdir -p ~/.sumerian/templates/
cat > ~/.sumerian/templates/safe-project.json << EOF
{
  "version": 1,
  "braveMode": false,
  "disallowedTools": ["run_command", "bash"]
}
EOF

# Apply to new project
cp ~/.sumerian/templates/safe-project.json /path/to/project/.sumerian/config.json
```

## Related Documentation

- [MCP Setup Guide](./mcp-setup.md) - Configure MCP servers per project
- [MCP Usage Guide](./mcp-usage.md) - Use MCP tools in your projects
- [Commands Reference](../COMMANDS.md) - All available commands and shortcuts

---

*For more information, see the [PRD](../PRD_Sumarian.md) and [SPEC](../SPEC.md) documentation.*
