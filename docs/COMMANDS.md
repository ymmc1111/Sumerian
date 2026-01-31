# Sumerian Command Reference

## Slash Commands

### Agent Control

#### `/loop`
Start an autonomous iteration loop with promise-based completion detection.

**Syntax:**
```
/loop "<prompt>" --promise "<completion_word>" --max <iterations>
```

**Parameters:**
- `prompt` - Task description for the agent to iterate on
- `--promise` - Word or phrase that signals completion (default: "DONE")
- `--max` - Maximum iterations before auto-stop (default: 20)

**Examples:**
```
/loop "Implement feature using TDD" --promise "COMPLETE" --max 50
/loop "Fix bug in auth module" --promise "FIXED" --max 15
```

#### `/cancel-loop`
Cancel the currently active loop.

**Syntax:**
```
/cancel-loop
```

#### `/spawn`
Spawn a specialized sub-agent for a specific task.

**Syntax:**
```
/spawn <persona> "<task>" [--model <model>]
```

**Personas:**
- `conductor` - High-level orchestration and planning (Opus)
- `architect` - Codebase analysis and design (Sonnet, read-only)
- `builder` - Implementation and file operations (Sonnet)
- `tester` - Test generation and debugging (Sonnet)
- `documenter` - Documentation updates (Haiku)

**Examples:**
```
/spawn builder "Implement user authentication"
/spawn tester "Write unit tests for UserService"
/spawn architect "Analyze codebase structure"
```

### Context Management

#### `/compact`
Summarize and prune conversation history to reduce context usage.

**Syntax:**
```
/compact
```

#### `/context`
Display current context usage with visual gauge.

**Syntax:**
```
/context
```

#### `/review`
Request structured code review with template.

**Syntax:**
```
/review
```

### Checkpoints & Memory

#### `/checkpoint`
Create a labeled checkpoint for rollback.

**Syntax:**
```
/checkpoint "<label>"
```

**Examples:**
```
/checkpoint "before auth refactor"
/checkpoint "working state v1.2"
```

### Task Queue

#### `/batch`
Queue a task for overnight batch processing.

**Syntax:**
```
/batch "<prompt>" --promise "<completion>" --max <iterations>
```

**Examples:**
```
/batch "Complete feature implementation" --promise "DONE" --max 30
```

## CLI Flags

### Budget & Cost Control

#### `--max-budget-usd`
Set maximum cost limit for agent operations.

**Example:**
```
claude --max-budget-usd 5.00
```

### Configuration

#### `--mcp-config`
Load MCP (Model Context Protocol) servers from config file.

**Example:**
```
claude --mcp-config /path/to/mcp-config.json
```

#### `--add-dir`
Add additional directories to context (monorepo support).

**Example:**
```
claude --add-dir ../shared-lib --add-dir ../utils
```

### Tool Restrictions

#### `--allowedTools`
Pre-approve specific tools for agent use.

**Example:**
```
claude --allowedTools read_file,list_dir,grep_search
```

#### `--disallowedTools`
Restrict specific tools from agent use.

**Example:**
```
claude --disallowedTools write_to_file,edit
```

### Thinking Modes

Use prompt prefixes to enable extended thinking:

- `[think]` - Basic extended thinking
- `[think hard]` - Moderate extended thinking
- `[think harder]` - Deep extended thinking
- `[ultrathink]` - Maximum extended thinking

**Example:**
```
[think hard] Analyze the performance bottleneck in this algorithm
```

## Project Management

### `/project-switch` or `Cmd+O`
Open the project switcher to view recent projects and switch between them.

**Features:**
- View up to 10 most recent projects
- Search/filter projects by name or path
- Keyboard navigation with arrow keys
- Remove projects from recent list
- Browse for new projects

**Keyboard Navigation:**
- `Cmd+O` - Open project switcher
- `↑/↓` - Navigate project list
- `Enter` - Open selected project
- `Escape` - Close switcher
- Type to search in real-time

**Project Registry:**
Projects are tracked in `~/.sumerian/projects.json` with:
- Absolute path
- Display name
- Last opened timestamp
- Session ID (for history restoration)
- Configuration overrides

### Per-Project Configuration

Create `.sumerian/config.json` in your project root:

```json
{
  "version": 1,
  "name": "Custom Project Name",
  "braveMode": true,
  "model": "claude-opus",
  "mcpConfigPath": "./mcp-config.json",
  "additionalDirs": ["../shared-lib"],
  "allowedTools": ["read_file", "write_file"],
  "disallowedTools": ["run_command"]
}
```

**Configuration Hierarchy:**
1. Global settings (from Settings panel)
2. Project config (`.sumerian/config.json`)
3. Registry overrides (from projects.json)

**See Also:** [Multi-Project Workspaces Guide](./guides/multi-project-workspaces.md)

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Open command palette |
| `Cmd+O` | Open project / Project switcher |
| `Cmd+P` | Quick file open |
| `Cmd+Shift+P` | Command palette |
| `Cmd+/` | Toggle terminal |
| `Cmd+B` | Toggle sidebar |
| `Cmd+\` | Split editor |
| `Cmd+W` | Close file |
| `Cmd+S` | Save file |
| `Cmd+Z` | Undo agent action |
| `Cmd+Shift+Z` | Redo |
| `Cmd+,` | Open settings |
| `Cmd+?` | Show shortcuts help |

## Brave Mode

Toggle autonomous operation mode where agent can execute commands and modify files without per-action approval.

**Safety Features:**
- Automatic file snapshots before modifications
- Command blocklist (destructive operations)
- Project directory sandboxing
- Audit log of all actions (`~/.sumerian/audit.log`)

**Enable:**
- UI toggle in agent header
- Settings panel

## Workforce Management

### Agent Status Indicators

- 🟢 **Active** - Agent is working
- 🔵 **Idle** - Agent waiting for task
- ✅ **Complete** - Task finished successfully
- ❌ **Error** - Task failed

### Resource Monitoring

Each agent card displays:
- CPU usage sparkline (last 60 seconds)
- Memory usage sparkline
- Real-time resource updates every 2 seconds

### File Locking

Files being edited by agents show:
- 🔒 Lock icon in file tree
- Agent ID on hover
- Prevents concurrent edits

## Security Boundaries

Agents are sandboxed to the project directory by default. Access to system paths requires explicit user approval via security modal.

**Audit Trail:**
All agent actions logged to `~/.sumerian/audit.log` with:
- Timestamp
- Action type
- Actor (user/agent)
- Target path
- Result (success/blocked/error)
- Reversibility metadata

---

*For more information, see the full documentation in `/docs`*
