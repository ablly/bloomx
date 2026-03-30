// GridPattern - Animated grid background (Apple-style)
interface GridPatternProps {
    className?: string;
    strokeColor?: string;
    strokeWidth?: number;
    cellSize?: number;
    fade?: boolean;
}

const GridPattern = ({
    className = '',
    strokeColor = 'rgba(255,255,255,0.05)',
    strokeWidth = 1,
    cellSize = 50,
    fade = true,
}: GridPatternProps) => {
    return (
        <div className={`absolute inset-0 ${className}`}>
            <svg
                className="w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <pattern
                        id="grid-pattern"
                        width={cellSize}
                        height={cellSize}
                        patternUnits="userSpaceOnUse"
                    >
                        <path
                            d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                        />
                    </pattern>
                    {fade && (
                        <radialGradient id="grid-fade">
                            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="white" stopOpacity="0" />
                        </radialGradient>
                    )}
                </defs>
                <rect
                    width="100%"
                    height="100%"
                    fill="url(#grid-pattern)"
                    mask={fade ? 'url(#grid-fade)' : undefined}
                />
            </svg>
        </div>
    );
};

export default GridPattern;
