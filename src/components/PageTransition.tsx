import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface PageTransitionProps {
    children: ReactNode;
    isActive: boolean;
}

const PageTransition = ({ children, isActive }: PageTransitionProps) => {
    const [shouldRender, setShouldRender] = useState(isActive);

    useEffect(() => {
        if (isActive) {
            setShouldRender(true);
        } else {
            const timer = setTimeout(() => setShouldRender(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isActive]);

    if (!shouldRender) return null;

    return (
        <div
            className={`
                transition-all duration-500 ease-in-out
                ${isActive 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
                }
            `}
        >
            {children}
        </div>
    );
};

export default PageTransition;
