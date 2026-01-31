import React from 'react';
import { useAppStore } from '../stores/useAppStore';
import PanelHeader from '../components/PanelHeader';
import EditorGroup from '../components/EditorGroup';
import { Code } from 'lucide-react';
import { PanelSlotId } from '../types/layout';

interface EditorPanelProps {
    slotId?: PanelSlotId;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ slotId = 'B' }) => {
    const { editor, splitEditor, closeEditorGroup } = useAppStore();
    const { groups, activeGroupId, layout } = editor;

    const handleSplit = (direction: 'horizontal' | 'vertical') => {
        splitEditor(direction);
    };

    const handleCloseGroup = (groupId: string) => {
        closeEditorGroup(groupId);
    };

    return (
        <div className="flex-1 h-full bg-nexus-bg-primary flex flex-col overflow-hidden">
            <PanelHeader
                title="Editor"
                panelType="editor"
                slotId={slotId}
                icon={<Code className="w-4 h-4" />}
            />
            
            {/* Editor Groups Container */}
            <div className={`flex-1 flex ${
                layout === 'split-horizontal' ? 'flex-row' : 
                layout === 'split-vertical' ? 'flex-col' : 
                'flex-col'
            }`}>
                {groups.map((group, index) => (
                    <div 
                        key={group.id} 
                        className={`flex-1 ${
                            index > 0 && layout === 'split-horizontal' ? 'border-l border-nexus-border' :
                            index > 0 && layout === 'split-vertical' ? 'border-t border-nexus-border' :
                            ''
                        }`}
                    >
                        <EditorGroup
                            group={group}
                            isActive={group.id === activeGroupId}
                            canClose={groups.length > 1}
                            onSplit={handleSplit}
                            onClose={() => handleCloseGroup(group.id)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EditorPanel;


