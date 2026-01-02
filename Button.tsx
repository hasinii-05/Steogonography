
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
    return (
        <button
            className={`
                inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent 
                text-base font-medium rounded-md text-white 
                bg-gradient-to-r from-cyan-600 to-teal-600
                hover:from-cyan-700 hover:to-teal-700
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500
                focus:ring-offset-gray-800
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-300
                shadow-lg
                ${className}
            `}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
