// TiltCard - 3D tilt effect card (Apple-style)
import { useState, useRef } from 'react';
import type { MouseEvent } from 'react';

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    maxTilt?: number;
}

const TiltCard = ({ children, className = '', maxTilt = 10 }: TiltCardProps) => {
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const tiltX = ((y - centerY) / centerY) * maxTilt;
        const tiltY = ((centerX - x) / centerX) * maxTilt;

        setTilt({ x: tiltX, y: tiltY });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`transition-transform duration-300 ease-out ${className}`}
            style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            }}
        >
            {children}
        </div>
    );
};

export default TiltCard;
