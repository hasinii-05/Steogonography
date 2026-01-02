
import React from 'react';
import { Mode } from '../types';
import { KeyIcon, LockIcon } from './IconComponents';

interface TabsProps {
    activeMode: Mode;
    onModeChange: (mode: Mode) => void;
}

const Tabs: React.FC<TabsProps> = ({ activeMode, onModeChange }) => {
    const getTabClass = (mode: Mode) => {
        const baseClass = "flex-1 text-center px-4 py-3 rounded-md font-semibold transition-all duration-300 flex items-center justify-center gap-2";
        if (mode === activeMode) {
            if (mode === Mode.Encode) {
                 return `${baseClass} bg-cyan-500 text-white shadow-lg`;
            }
            return `${baseClass} bg-teal-500 text-white shadow-lg`;
        }
        return `${baseClass} bg-gray-700 text-gray-300 hover:bg-gray-600`;
    };

    return (
        <div className="flex bg-gray-900/70 p-1.5 rounded-lg space-x-2">
            <button
                className={getTabClass(Mode.Encode)}
                onClick={() => onModeChange(Mode.Encode)}
            >
                <LockIcon />
                Encode
            </button>
            <button
                className={getTabClass(Mode.Decode)}
                onClick={() => onModeChange(Mode.Decode)}
            >
                <KeyIcon />
                Decode
            </button>
        </div>
    );
};

export default Tabs;
