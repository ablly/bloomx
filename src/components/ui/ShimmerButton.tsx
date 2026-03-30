// ShimmerButton - Animated shimmer button (Apple-style)
import type { ButtonHTMLAttributes } from 'react';

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    shimmerColor?: string;
}

const ShimmerButton = ({ 
    children, 
    className = '', 
    shimmerColor = 'rgba(255,255,255,0.3)',
    ...props 
}: ShimmerButtonProps) => {
    return (
        <button
            className={`relative overflow-hidden group ${className}`}
            {...props}
        >
            {/* Shimmer effect */}
            <div 
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"
                style={{
                    background: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)`,
                }}
            />
            
            {/* Content */}
            <span className="relative z-10">{children}</span>
        </button>
    );
};

export default ShimmerButton;
