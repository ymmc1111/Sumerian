# MCP Setup Guide

## What is MCP?

**Model Context Protocol (MCP)** is a standardized protocol that allows Claude to use external tools and services. MCP servers provide capabilities like:

- **Web Search** - Google Search, Brave Search
- **Enhanced Reasoning** - Sequential Thinking for complex problems
- **External Data** - Databases, APIs, file systems
- **Automation** - Browser control, GitHub integration

## How MCP Works in Sumerian

```
┌─────────────────────────────────────┐
│         Sumerian IDE                │
│  ┌───────────────────────────────┐ │
│  │  Settings → MCP Tools         │ │
│  │  Configure servers            │ │
│  └───────────────┬───────────────┘ │
│                  │                  │
│  ┌───────────────▼───────────────┐ │
│  │  CLIManager                   │ │
│  │  Passes --mcp-config flag     │ │
│  └───────────────┬───────────────┘ │
└──────────────────┼──────────────────┘
                   │
        ┌──────────▼──────────┐
        │   Claude CLI        │
        │   Manages servers   │
        └──────────┬──────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
   ┌────▼───┐ ┌───▼────┐ ┌──▼─────┐
   │ Google │ │Sequential│ │GitHub │
   │ Search │ │Thinking │ │       │
   └────────┘ └─────────┘ └────────┘
```

**Key Points:**
- Sumerian manages the configuration file
- Claude CLI spawns and manages the actual server processes
- Servers run locally on your machine
- No additional API costs (uses your Claude Max subscription)

---

## Quick Start

### 1. Open MCP Settings

1. Click the **Settings** icon (⚙️) in the top-right
2. Navigate to the **MCP Tools** tab
3. You'll see the MCP configuration interface

### 2. Add a Server from Templates

**Easiest option:** Use pre-configured templates

1. Click **Add Server** button
2. Browse available templates:
   - **Sequential Thinking** - No setup required
   - **Google Search** - Requires API key
   - **Brave Search** - Requires API key
   - **GitHub** - Requires personal access token
   - **Filesystem** - Requires directory path
   - **Memory** - No setup required
3. Click **Add** on your chosen template

### 3. Configure Environment Variables

If the server requires API keys or configuration:

1. Find the server in the "Configured Servers" list
2. Note the `Env:` section showing required variables
3. Click **Edit JSON** at the bottom
4. Replace placeholder values like `<YOUR_API_KEY>` with actual values
5. Click **Save**

### 4. Restart Agent

MCP servers are loaded when the agent starts:

1. Clear the current agent session (if active)
2. Start a new agent session
3. The agent will now have access to MCP tools

---

## Example: Adding Google Search

### Step 1: Get API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or select existing)
3. Enable **Custom Search API**
4. Create an **API Key** (copy it)
5. Go to [Google Custom Search Engine](https://cse.google.com)
6. Create a new search engine
7. Copy the **Search Engine ID** (CSE ID)

### Step 2: Add to Sumerian

1. Open Settings → MCP Tools
2. Click **Add Server**
3. Select **Google Search** template
4. Click **Add**

### Step 3: Configure Credentials

1. Click **Edit JSON** at the bottom
2. Find the `google-search` section:

```json
{
  "mcpServers": {
    "google-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-google-search"],
      "env": {
        "GOOGLE_API_KEY": "AIzaSyD...",
        "GOOGLE_CSE_ID": "a1b2c3d4e5..."
      }
    }
  }
}
```

3. Replace `<YOUR_API_KEY>` with your actual API key
4. Replace `<YOUR_CSE_ID>` with your search engine ID
5. Click **Save**

### Step 4: Test It

Start a new agent session and ask:

```
Search Google for "latest React 19 features"
```

The agent will use the Google Search MCP server to fetch real-time results.

---

## Example: Adding Sequential Thinking

**No setup required!**

1. Open Settings → MCP Tools
2. Click **Add Server**
3. Select **Sequential Thinking**
4. Click **Add**
5. Click **Save** (no configuration needed)

That's it! The agent can now use enhanced reasoning for complex problems.

---

## Manual Configuration

### Global Config

Edit `~/.sumerian/mcp-config.json`:

```json
{
  "mcpServers": {
    "my-custom-server": {
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": {
        "API_KEY": "your-key-here"
      }
    }
  }
}
```

### Project-Specific Config

Create `.sumerian/mcp-config.json` in your project root:

```json
{
  "mcpServers": {
    "project-database": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://localhost/mydb"
      }
    }
  }
}
```

**Note:** Project config overrides global config for matching server names.

---

## Available Templates

### No Setup Required

- **Sequential Thinking** - Enhanced reasoning
- **Memory** - Persistent key-value storage
- **Filesystem** - Access to specific directories (requires path)

### Requires API Keys

- **Google Search** - Google API Key + CSE ID
- **Brave Search** - Brave API Key
- **GitHub** - Personal Access Token
- **Slack** - Bot Token + Team ID

### Requires Configuration

- **PostgreSQL** - Connection string
- **SQLite** - Database file path
- **Puppeteer** - No config, downloads Chromium on first use

---

## Troubleshooting

### Server Not Starting

**Check the logs:**
```bash
tail -f ~/.sumerian/logs/mcp-{server-name}.log
```

**Common issues:**
- Missing API key or invalid credentials
- Server package not installed (npx will install on first use)
- Port conflicts (if server uses specific ports)

### Agent Can't Use Tools

**Verify:**
1. Server is listed in Settings → MCP Tools
2. JSON configuration is valid (no syntax errors)
3. Agent was restarted after adding server
4. Check Claude CLI version supports `--mcp-config` flag

### Environment Variables Not Working

**Try:**
1. Use absolute paths, not `~` or relative paths
2. Escape special characters in values
3. Check for typos in variable names (case-sensitive)

### Server Crashes Repeatedly

**Solutions:**
1. Check server logs for error messages
2. Verify all required dependencies are installed
3. Test the server command manually in terminal
4. Check if server has rate limits or usage quotas

---

## Best Practices

### Security

- **Never commit API keys** to version control
- Use project-specific configs for sensitive credentials
- Grant minimal permissions (e.g., read-only database access)
- Review server source code before using untrusted servers

### Performance

- Only enable servers you actively use
- Disable unused servers to reduce startup time
- Use local servers (SQLite, Filesystem) when possible
- Monitor server resource usage in Activity Monitor

### Organization

- Use descriptive server names
- Group related servers (e.g., `db-production`, `db-staging`)
- Document custom server configurations
- Keep global config for personal tools, project config for team tools

---

## Advanced: Custom MCP Servers

### Creating Your Own Server

MCP servers are Node.js applications that implement the MCP protocol.

**Example: Simple Echo Server**

```javascript
// echo-server.js
const { Server } = require('@modelcontextprotocol/sdk/server');

const server = new Server({
  name: 'echo-server',
  version: '1.0.0'
});

server.tool('echo', {
  description: 'Echo back the input',
  parameters: {
    message: { type: 'string', description: 'Message to echo' }
  },
  handler: async ({ message }) => {
    return { content: [{ type: 'text', text: message }] };
  }
});

server.start();
```

**Add to Sumerian:**

```json
{
  "mcpServers": {
    "echo": {
      "command": "node",
      "args": ["/path/to/echo-server.js"]
    }
  }
}
```

### Publishing Your Server

1. Create npm package: `@your-org/mcp-server-name`
2. Implement MCP SDK interfaces
3. Publish to npm
4. Users can add via: `npx -y @your-org/mcp-server-name`

---

## Resources

- [MCP Official Documentation](https://modelcontextprotocol.io)
- [MCP SDK on GitHub](https://github.com/modelcontextprotocol/sdk)
- [Available MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Sumerian Documentation](../README.md)

---

## Support

If you encounter issues:

1. Check server logs: `~/.sumerian/logs/mcp-*.log`
2. Verify JSON syntax in config file
3. Test server command manually in terminal
4. Review [Troubleshooting](#troubleshooting) section
5. Open an issue on GitHub with logs and config

---

*Last Updated: January 2026*
