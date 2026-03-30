// ShimmerText - Animated shimmer text effect (Apple-style)
interface ShimmerTextProps {
    children: React.ReactNode;
    className?: string;
    shimmerWidth?: number;
    duration?: number;
}

const ShimmerText = ({ 
    children, 
    className = '',
    shimmerWidth = 100,
    duration = 2000
}: ShimmerTextProps) => {
    return (
        <span className={`relative inline-block ${className}`}>
            <span className="relative z-10">{children}</span>
            <span 
                className="absolute inset-0 -z-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-text"
                style={{
                    backgroundSize: `${shimmerWidth}% 100%`,
                    animationDuration: `${duration}ms`,
                }}
            />
        </span>
    );
};

export default ShimmerText;
