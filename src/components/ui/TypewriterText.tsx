// TypewriterText - Typewriter effect (Apple-style)
import { useState, useEffect } from 'react';

interface TypewriterTextProps {
    text: string;
    delay?: number;
    speed?: number;
    className?: string;
    showCursor?: boolean;
    onComplete?: () => void;
}

const TypewriterText = ({ 
    text, 
    delay = 0,
    speed = 50,
    className = '',
    showCursor = true,
    onComplete
}: TypewriterTextProps) => {
    const [displayText, setDisplayText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        const startTimer = setTimeout(() => {
            if (currentIndex < text.length) {
                const timer = setTimeout(() => {
                    setDisplayText(prev => prev + text[currentIndex]);
                    setCurrentIndex(prev => prev + 1);
                }, speed);
                return () => clearTimeout(timer);
            } else if (!isComplete) {
                setIsComplete(true);
                onComplete?.();
            }
        }, delay);

        return () => clearTimeout(startTimer);
    }, [currentIndex, text, speed, delay, isComplete, onComplete]);

    return (
        <span className={className}>
            {displayText}
            {showCursor && !isComplete && (
                <span className="inline-block w-0.5 h-[1em] bg-current ml-0.5 animate-pulse" />
            )}
        </span>
    );
};

export default TypewriterText;
