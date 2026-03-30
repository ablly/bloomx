// DotPattern - Animated dot pattern background (Apple-style)
interface DotPatternProps {
    className?: string;
    dotColor?: string;
    dotSize?: number;
    spacing?: number;
    fade?: boolean;
    animate?: boolean;
}

const DotPattern = ({
    className = '',
    dotColor = 'rgba(255,255,255,0.1)',
    dotSize = 1,
    spacing = 20,
    fade = true,
    animate = false,
}: DotPatternProps) => {
    return (
        <div className={`absolute inset-0 ${className}`}>
            <svg
                className="w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <pattern
                        id="dot-pattern"
                        width={spacing}
                        height={spacing}
                        patternUnits="userSpaceOnUse"
                    >
                        <circle
                            cx={spacing / 2}
                            cy={spacing / 2}
                            r={dotSize}
                            fill={dotColor}
                            className={animate ? 'animate-pulse' : ''}
                        />
                    </pattern>
                    {fade && (
                        <radialGradient id="dot-fade">
                            <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="white" stopOpacity="0" />
                        </radialGradient>
                    )}
                </defs>
                <rect
                    width="100%"
                    height="100%"
                    fill="url(#dot-pattern)"
                    mask={fade ? 'url(#dot-fade)' : undefined}
                />
            </svg>
        </div>
    );
};

export default DotPattern;
