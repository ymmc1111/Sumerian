import { useState, useCallback } from 'react';
import { useAppStore } from '../stores/useAppStore';
import * as path from 'path';

export const useImageSupport = () => {
    const { project } = useAppStore();
    const [pendingImages, setPendingImages] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    await processFile(file);
                }
            }
        }
    }, [project.rootPath]);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (!files) return;

        for (let i = 0; i < files.length; i++) {
            if (files[i].type.indexOf('image') !== -1) {
                await processFile(files[i]);
            }
        }
    }, [project.rootPath]);

    const processFile = async (file: File) => {
        if (!project.rootPath) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            const pureBase64 = base64.split(',')[1];

            const fileName = `attach_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const targetPath = `${project.rootPath}/.sumerian/attachments/${fileName}`;

            try {
                await window.sumerian.files.saveImage(targetPath, pureBase64);
                setPendingImages(prev => [...prev, targetPath]);
            } catch (err) {
                console.error('Failed to save pasted image:', err);
            }
        };
        reader.readAsDataURL(file);
    };

    const removeImage = (path: string) => {
        setPendingImages(prev => prev.filter(p => p !== path));
    };

    const clearPendingImages = () => {
        setPendingImages([]);
    };

    return {
        pendingImages,
        isDragging,
        setIsDragging,
        handlePaste,
        handleDrop,
        removeImage,
        clearPendingImages
    };
};
