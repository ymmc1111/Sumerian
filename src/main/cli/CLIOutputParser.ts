import { EventEmitter } from 'events';
import {
    CLIMessage,
    AssistantMessage,
    ResultMessage,
    isAssistantMessage,
    isResultMessage,
    isErrorMessage,
    isTextContent,
    isToolUseContent,
    isToolResultContent,
    ContentBlock
} from './CLIOutputTypes';

export interface ParsedEvents {
    onAssistantText: (text: string, isStreaming: boolean) => void;
    onToolUse: (name: string, id: string, input: Record<string, unknown>) => void;
    onToolResult: (toolUseId: string, content: string, isError: boolean) => void;
    onError: (type: string, message: string) => void;
    onComplete: (result: string, usage?: { input: number; output: number }) => void;
}

export class CLIOutputParser extends EventEmitter {
    private buffer: string = '';
    private accumulatedText: string = '';

    constructor() {
        super();
    }

    public parse(rawData: string): void {
        this.buffer += rawData;
        const lines = this.buffer.split('\n');

        // Keep incomplete last line in buffer
        this.buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            this.parseLine(trimmed);
        }
    }

    private parseLine(line: string): void {
        try {
            const msg = JSON.parse(line) as CLIMessage;
            this.handleMessage(msg);
        } catch {
            // Not valid JSON - ignore (could be ANSI escape sequences, etc.)
        }
    }

    private handleMessage(msg: CLIMessage): void {
        if (isAssistantMessage(msg)) {
            this.handleAssistant(msg);
        } else if (isResultMessage(msg)) {
            this.handleResult(msg);
        } else if (isErrorMessage(msg)) {
            this.emit('error', msg.error.type, msg.error.message);
        }
        // Ignore system, user, status messages for now
    }

    private handleAssistant(msg: AssistantMessage): void {
        for (const block of msg.message.content) {
            this.handleContentBlock(block);
        }
    }

    private handleContentBlock(block: ContentBlock): void {
        if (isTextContent(block)) {
            this.accumulatedText += block.text;
            this.emit('assistantText', block.text, true);
        } else if (isToolUseContent(block)) {
            this.emit('toolUse', block.name, block.id, block.input);
        } else if (isToolResultContent(block)) {
            this.emit('toolResult', block.tool_use_id, block.content, !!block.is_error);
        }
    }

    private handleResult(msg: ResultMessage): void {
        const usage = msg.usage
            ? { input: msg.usage.input_tokens, output: msg.usage.output_tokens }
            : undefined;
        this.emit('complete', msg.result, usage);
        this.accumulatedText = '';
    }

    public flush(): void {
        if (this.buffer.trim()) {
            this.parseLine(this.buffer.trim());
        }
        this.buffer = '';
    }

    public reset(): void {
        this.buffer = '';
        this.accumulatedText = '';
    }

    public getAccumulatedText(): string {
        return this.accumulatedText;
    }
}
