import React from 'react';
import { File, Folder, FileCode, FileJson, FileText, FileImage } from 'lucide-react';

interface FileIconProps {
    name: string;
    isDirectory: boolean;
    className?: string;
    isOpen?: boolean;
}

const FileIcon: React.FC<FileIconProps> = ({ name, isDirectory, className = "w-4 h-4", isOpen }) => {
    if (isDirectory) {
        return <Folder className={`${className} ${isOpen ? 'text-nexus-accent' : 'text-nexus-fg-secondary'}`} />;
    }

    const extension = name.split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'ts':
        case 'tsx':
        case 'js':
        case 'jsx':
            return <FileCode className={`${className} text-blue-400`} />;
        case 'json':
            return <FileJson className={`${className} text-yellow-500`} />;
        case 'md':
            return <FileText className={`${className} text-nexux-fg-secondary`} />;
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'svg':
            return <FileImage className={`${className} text-purple-400`} />;
        default:
            return <File className={`${className} text-nexus-fg-muted`} />;
    }
};

export default FileIcon;
