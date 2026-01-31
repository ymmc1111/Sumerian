import React from 'react';

interface TooltipProps {
    text: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text }) => {
    return (
        <div className="project-tooltip">
            {text}
        </div>
    );
};

export default Tooltip;
