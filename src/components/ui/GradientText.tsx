// GradientText - Animated gradient text (Apple-style)
interface GradientTextProps {
    children: React.ReactNode;
    className?: string;
    from?: string;
    via?: string;
    to?: string;
    animate?: boolean;
}

const GradientText = ({ 
    children, 
    className = '',
    from = 'from-white',
    via = 'via-white/80',
    to = 'to-white/60',
    animate = true
}: GradientTextProps) => {
    return (
        <span
            className={`bg-gradient-to-r ${from} ${via} ${to} bg-clip-text text-transparent ${
                animate ? 'animate-gradient' : ''
            } ${className}`}
        >
            {children}
        </span>
    );
};

export default GradientText;
