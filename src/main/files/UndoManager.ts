import * as fs from 'fs/promises';
import { SnapshotManager } from './SnapshotManager';

export interface UndoAction {
    type: 'file_edit' | 'file_delete';
    path: string;
    snapshotPath?: string;
    timestamp: number;
}

export class UndoManager {
    private stack: UndoAction[] = [];
    private readonly MAX_STACK_SIZE = 50;

    public push(action: UndoAction): void {
        this.stack.push(action);
        if (this.stack.length > this.MAX_STACK_SIZE) {
            this.stack.shift();
        }
    }

    public async undo(): Promise<boolean> {
        const action = this.stack.pop();
        if (!action) return false;

        try {
            if (action.type === 'file_edit' && action.snapshotPath) {
                const content = await fs.readFile(action.snapshotPath);
                await fs.writeFile(action.path, content);
                return true;
            }
            // Add other undo logic as needed
            return false;
        } catch (error) {
            console.error('Undo failed:', error);
            return false;
        }
    }

    public getHistory(): UndoAction[] {
        return [...this.stack];
    }
}
