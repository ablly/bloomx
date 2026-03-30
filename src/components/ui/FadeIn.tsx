// FadeIn - Intersection Observer fade-in animation
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface FadeInProps {
    children: ReactNode;
    delay?: number;
    duration?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    className?: string;
}

const FadeIn = ({ 
    children, 
    delay = 0, 
    duration = 600,
    direction = 'up',
    className = '' 
}: FadeInProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => setIsVisible(true), delay);
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
    }, [delay]);

    const getTransform = () => {
        if (!isVisible) {
            switch (direction) {
                case 'up': return 'translateY(30px)';
                case 'down': return 'translateY(-30px)';
                case 'left': return 'translateX(30px)';
                case 'right': return 'translateX(-30px)';
                default: return 'none';
            }
        }
        return 'none';
    };

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: getTransform(),
                transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
            }}
        >
            {children}
        </div>
    );
};

export default FadeIn;
