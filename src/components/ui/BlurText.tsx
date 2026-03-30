// BlurText - Animated blur-in text effect (Apple-style)
import { useEffect, useState } from 'react';

interface BlurTextProps {
    text: string;
    delay?: number;
    className?: string;
}

const BlurText = ({ text, delay = 0, className = '' }: BlurTextProps) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <span
            className={`inline-block transition-all duration-1000 ${
                isVisible
                    ? 'blur-0 opacity-100'
                    : 'blur-md opacity-0'
            } ${className}`}
        >
            {text}
        </span>
    );
};

export default BlurText;
