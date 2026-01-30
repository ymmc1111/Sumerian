/**
 * CLI Output Types for Claude CLI stream-json messages
 * These types enable type-safe parsing of Claude CLI output
 */

// ============ Content Types ============

export interface TextContent {
    type: 'text';
    text: string;
}

export interface ToolUseContent {
    type: 'tool_use';
    id: string;
    name: string;
    input: Record<string, unknown>;
}

export interface ToolResultContent {
    type: 'tool_result';
    tool_use_id: string;
    content: string;
    is_error?: boolean;
}

export type ContentBlock = TextContent | ToolUseContent | ToolResultContent;

// ============ Message Types ============

export interface SystemMessage {
    type: 'system';
    subtype: 'init' | 'status';
    session_id?: string;
    tools?: string[];
    mcp_servers?: string[];
    model?: string;
}

export interface AssistantMessage {
    type: 'assistant';
    message: {
        id: string;
        role: 'assistant';
        content: ContentBlock[];
        model?: string;
        stop_reason?: 'end_turn' | 'tool_use' | 'max_tokens';
        usage?: UsageInfo;
    };
}

export interface UserMessage {
    type: 'user';
    message: {
        role: 'user';
        content: string;
    };
}

export interface ResultMessage {
    type: 'result';
    result: string;
    usage?: UsageInfo;
    cost_usd?: number;
    duration_ms?: number;
    is_error?: boolean;
}

export interface ErrorMessage {
    type: 'error';
    error: {
        type: string;
        message: string;
    };
}

export interface StatusMessage {
    type: 'status';
    status: 'thinking' | 'tool_use' | 'complete';
    tool_name?: string;
}

// ============ Supporting Types ============

export interface UsageInfo {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
}

// ============ Discriminated Union ============

export type CLIMessage =
    | SystemMessage
    | AssistantMessage
    | UserMessage
    | ResultMessage
    | ErrorMessage
    | StatusMessage;

// ============ Type Guards ============

export function isSystemMessage(msg: CLIMessage): msg is SystemMessage {
    return msg.type === 'system';
}

export function isAssistantMessage(msg: CLIMessage): msg is AssistantMessage {
    return msg.type === 'assistant';
}

export function isUserMessage(msg: CLIMessage): msg is UserMessage {
    return msg.type === 'user';
}

export function isResultMessage(msg: CLIMessage): msg is ResultMessage {
    return msg.type === 'result';
}

export function isErrorMessage(msg: CLIMessage): msg is ErrorMessage {
    return msg.type === 'error';
}

export function isStatusMessage(msg: CLIMessage): msg is StatusMessage {
    return msg.type === 'status';
}

// ============ Content Type Guards ============

export function isTextContent(content: ContentBlock): content is TextContent {
    return content.type === 'text';
}

export function isToolUseContent(content: ContentBlock): content is ToolUseContent {
    return content.type === 'tool_use';
}

export function isToolResultContent(content: ContentBlock): content is ToolResultContent {
    return content.type === 'tool_result';
}
