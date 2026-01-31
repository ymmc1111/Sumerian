# Using MCP Tools in Sumerian

## Overview

Once MCP servers are configured, the agent can automatically use their tools to accomplish tasks. This guide shows you how to leverage MCP tools effectively.

---

## How Agents Use MCP Tools

### Automatic Tool Selection

The agent automatically chooses appropriate tools based on your request:

**You:** "Search for the latest TypeScript features"  
**Agent:** *Uses Google Search MCP server* → Returns current results

**You:** "Break down this complex algorithm step by step"  
**Agent:** *Uses Sequential Thinking MCP server* → Provides detailed reasoning

**You:** "Create an issue on GitHub for this bug"  
**Agent:** *Uses GitHub MCP server* → Creates issue with details

### No Special Syntax Required

You don't need to explicitly invoke tools. Just ask naturally:

✅ **Good:**
- "What's the weather in San Francisco?"
- "Search for React 19 migration guides"
- "Query the users table in the database"

❌ **Don't do this:**
- "Use the google-search tool to find..."
- "Execute MCP server github..."
- "@google-search what is..."

The agent knows which tools are available and when to use them.

---

## Common Use Cases

### 1. Web Research

**Available Tools:**
- Google Search
- Brave Search

**Example Prompts:**

```
"Search for best practices for Next.js 14 server actions"

"Find recent articles about TypeScript 5.3 features"

"Look up the latest npm package for state management"

"What are developers saying about the new React compiler?"
```

**Agent Behavior:**
1. Searches the web using configured search server
2. Reads top results
3. Synthesizes information
4. Provides summary with sources

---

### 2. Complex Problem Solving

**Available Tools:**
- Sequential Thinking

**Example Prompts:**

```
"Design a scalable architecture for a real-time chat application"

"Debug this performance issue step by step"

"Plan the migration from Redux to Zustand"

"Analyze the tradeoffs between these three approaches"
```

**Agent Behavior:**
1. Activates sequential thinking mode
2. Breaks problem into steps
3. Reasons through each step
4. Provides structured solution

---

### 3. GitHub Integration

**Available Tools:**
- GitHub MCP Server

**Example Prompts:**

```
"Create an issue for the login bug we just found"

"List all open PRs in the main repository"

"Show me recent commits by @username"

"Create a PR for the feature branch"
```

**Agent Behavior:**
1. Authenticates with GitHub using token
2. Performs requested action
3. Returns confirmation with links

---

### 4. Database Operations

**Available Tools:**
- PostgreSQL
- SQLite

**Example Prompts:**

```
"Query the users table for accounts created this week"

"Show me the schema for the orders table"

"Count how many active subscriptions we have"

"Find all products with low inventory"
```

**Agent Behavior:**
1. Connects to configured database
2. Executes safe read queries
3. Formats results in readable table
4. Asks for confirmation before write operations

---

### 5. File System Access

**Available Tools:**
- Filesystem MCP Server

**Example Prompts:**

```
"Read the config file from /etc/myapp/config.json"

"List all markdown files in ~/Documents/notes"

"Copy the template from ~/templates to the project"

"Check if the backup directory exists"
```

**Agent Behavior:**
1. Accesses only allowed directories (configured in MCP)
2. Performs file operations
3. Returns content or confirmation

---

### 6. Browser Automation

**Available Tools:**
- Puppeteer

**Example Prompts:**

```
"Take a screenshot of https://example.com"

"Scrape the pricing table from their website"

"Fill out the form and submit it"

"Check if the login page loads correctly"
```

**Agent Behavior:**
1. Launches headless browser
2. Navigates to URL
3. Performs actions
4. Returns results or screenshots

---

## Best Practices

### Be Specific

❌ **Vague:** "Search for something"  
✅ **Specific:** "Search for TypeScript utility types documentation"

❌ **Vague:** "Check the database"  
✅ **Specific:** "Query the users table for accounts created in the last 7 days"

### Provide Context

**Good:**
```
I'm debugging a performance issue. Search for common causes 
of React re-renders in large component trees.
```

**Better:**
```
I'm seeing excessive re-renders in a React dashboard with 50+ 
components. Search for solutions specific to React 18 and 
large-scale applications.
```

### Chain Operations

The agent can use multiple tools in sequence:

```
"Search for the latest Prisma migration best practices, 
then create a GitHub issue with a summary of what we should 
implement in our project."
```

**Agent will:**
1. Use Google Search to find articles
2. Read and synthesize information
3. Use GitHub to create issue
4. Format with links and recommendations

### Verify Sensitive Operations

For operations that modify data, the agent will ask for confirmation:

```
You: "Delete all test users from the database"

Agent: "I found 47 test users. This will permanently delete:
- test_user_1@example.com
- test_user_2@example.com
- ... (45 more)

Should I proceed? (yes/no)"
```

---

## Tool Limitations

### Rate Limits

**Search APIs:**
- Google Search: 100 queries/day (free tier)
- Brave Search: 2,000 queries/month (free tier)

**GitHub:**
- 5,000 requests/hour (authenticated)

**Solution:** Monitor usage, upgrade to paid tiers if needed

### Permissions

**Database:**
- Only granted permissions work (read-only vs read-write)

**Filesystem:**
- Only configured directories accessible

**GitHub:**
- Token permissions determine available actions

### Timeouts

Long-running operations may timeout:
- Web scraping: 30 seconds
- Database queries: 10 seconds
- API calls: 15 seconds

**Solution:** Break into smaller operations

---

## Debugging Tool Usage

### Check Tool Availability

Ask the agent:
```
"What MCP tools do you have access to?"
```

Agent will list all available servers and their capabilities.

### Verify Tool Execution

Enable verbose mode to see tool calls:

1. Settings → Agent → Advanced
2. Enable "Show Tool Calls"
3. Agent output will show:
   ```
   🔧 Using tool: google-search
   📥 Input: { query: "TypeScript 5.3 features" }
   📤 Output: [search results...]
   ```

### Check Server Logs

If a tool fails:
```bash
tail -f ~/.sumerian/logs/mcp-google-search.log
```

Look for error messages or API failures.

---

## Advanced Patterns

### Multi-Step Workflows

**Example: Research → Document → Share**

```
"Search for best practices on API rate limiting, create a 
markdown document summarizing the findings, and create a 
GitHub issue linking to the document."
```

**Agent executes:**
1. Google Search MCP → Find articles
2. File Write → Create `rate-limiting-research.md`
3. GitHub MCP → Create issue with link

### Conditional Logic

```
"Check if the database has any pending migrations. If yes, 
search for migration guides and create a checklist."
```

**Agent decides:**
- If migrations found → Use search + create file
- If no migrations → Report status only

### Parallel Operations

```
"Search Google and Brave for 'Next.js 14 caching' and 
compare the results."
```

**Agent may:**
- Call both search servers simultaneously
- Aggregate and compare results
- Highlight differences

---

## Examples by Role

### For Developers

```
"Search for the latest security vulnerabilities in Express.js, 
check our package.json version, and create a GitHub issue if 
we're affected."
```

### For Designers

```
"Search for 2024 design trends in SaaS dashboards, take 
screenshots of the top 3 examples, and save them to 
~/Documents/inspiration."
```

### For Product Managers

```
"Query the database for user signups this month, search for 
industry benchmarks, and create a comparison report."
```

### For DevOps

```
"Check the server logs in /var/log/app, search for common 
causes of the error pattern, and suggest fixes."
```

---

## Troubleshooting

### Tool Not Being Used

**Possible causes:**
1. Server not configured correctly
2. Agent doesn't recognize the need
3. Tool failed silently

**Solutions:**
- Explicitly mention the tool: "Use Google Search to find..."
- Check server status in Settings → MCP Tools
- Review server logs for errors

### Incorrect Results

**Possible causes:**
1. Ambiguous prompt
2. Tool limitations (e.g., search API quality)
3. Stale data

**Solutions:**
- Rephrase more specifically
- Try alternative tool (Brave vs Google)
- Verify tool configuration

### Permission Errors

**Possible causes:**
1. Invalid API key
2. Insufficient token permissions
3. Directory not in allowed list

**Solutions:**
- Verify credentials in MCP config
- Check token scopes (GitHub, etc.)
- Add directory to filesystem server config

---

## Tips for Power Users

### Create Custom Workflows

Save common patterns as lore files:

```markdown
# Research Workflow

When I ask you to "research X":
1. Search Google and Brave for X
2. Read top 5 results
3. Create markdown summary in ~/research/
4. Create GitHub issue with findings
```

### Combine with Loop Mode

```
/loop "Search for daily tech news, summarize top 3 stories, 
and append to ~/daily-digest.md" --promise "DONE" --max 30
```

Runs daily research automatically.

### Use Memory Server

```
"Remember that our API rate limit is 1000 req/min"

[Later...]

"Search for rate limiting libraries that work with our limit"
```

Agent recalls context from memory server.

---

## Resources

- [MCP Setup Guide](./mcp-setup.md)
- [Available MCP Servers](https://github.com/modelcontextprotocol/servers)
- [MCP Protocol Docs](https://modelcontextprotocol.io)

---

*Last Updated: January 2026*
