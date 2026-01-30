export interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    size?: number;
    extension?: string;
    children?: FileEntry[];
}

export interface FileEvent {
    path: string;
    type: 'create' | 'modify' | 'delete';
}

export interface IFileService {
    read(path: string): Promise<string>;
    write(path: string, content: string): Promise<void>;
    list(path: string): Promise<FileEntry[]>;
    delete(path: string): Promise<void>;
    watch(path: string, callback: (event: FileEvent) => void): () => void;
}
