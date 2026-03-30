// NumberTicker - Animated number counter (Apple-style)
import { useEffect, useRef, useState } from 'react';

interface NumberTickerProps {
    value: number;
    duration?: number;
    className?: string;
    prefix?: string;
    suffix?: string;
}

const NumberTicker = ({ 
    value, 
    duration = 2000, 
    className = '',
    prefix = '',
    suffix = ''
}: NumberTickerProps) => {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isVisible) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const startTime = Date.now();
        const endTime = startTime + duration;

        const updateCount = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            setCount(Math.floor(easeOut * value));

            if (now < endTime) {
                requestAnimationFrame(updateCount);
            } else {
                setCount(value);
            }
        };

        requestAnimationFrame(updateCount);
    }, [isVisible, value, duration]);

    return (
        <span ref={ref} className={className}>
            {prefix}{count.toLocaleString()}{suffix}
        </span>
    );
};

export default NumberTicker;
