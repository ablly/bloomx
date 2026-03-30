// ComponentShowcase - Demo page for all UI components
import { 
    GridPattern, 
    GradientText, 
    FadeIn, 
    BlurText, 
    TiltCard, 
    ShimmerButton,
    NumberTicker 
} from './ui';

const ComponentShowcase = () => {
    return (
        <div className="min-h-screen bg-black text-white p-8 relative overflow-hidden">
            {/* Grid Background */}
            <GridPattern className="opacity-30" />

            <div className="relative z-10 max-w-7xl mx-auto space-y-24">
                
                {/* Header */}
                <FadeIn className="text-center py-20">
                    <h1 className="text-6xl font-bold mb-4">
                        <GradientText>React Bits Components</GradientText>
                    </h1>
                    <p className="text-white/60 text-xl">
                        <BlurText text="Animated UI components for BloomX" delay={300} />
                    </p>
                </FadeIn>

                {/* Number Tickers */}
                <FadeIn delay={200}>
                    <h2 className="text-3xl font-semibold mb-8">Number Tickers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="glass-apple p-8 rounded-3xl text-center">
                            <div className="text-5xl font-bold mb-2">
                                <NumberTicker value={247} />
                            </div>
                            <div className="text-white/50">Active Nodes</div>
                        </div>
                        <div className="glass-apple p-8 rounded-3xl text-center">
                            <div className="text-5xl font-bold mb-2">
                                <NumberTicker value={99.9} suffix="%" />
                            </div>
                            <div className="text-white/50">Uptime</div>
                        </div>
                        <div className="glass-apple p-8 rounded-3xl text-center">
                            <div className="text-5xl font-bold mb-2">
                                <NumberTicker value={124} suffix="ms" />
                            </div>
                            <div className="text-white/50">Response Time</div>
                        </div>
                    </div>
                </FadeIn>

                {/* Tilt Cards */}
                <FadeIn delay={400}>
                    <h2 className="text-3xl font-semibold mb-8">Tilt Cards</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <TiltCard key={i}>
                                <div className="glass-apple p-8 rounded-3xl hover:bg-white/10 transition-colors">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">Feature {i}</h3>
                                    <p className="text-white/60">
                                        Hover over this card to see the 3D tilt effect in action.
                                    </p>
                                </div>
                            </TiltCard>
                        ))}
                    </div>
                </FadeIn>

                {/* Shimmer Buttons */}
                <FadeIn delay={600}>
                    <h2 className="text-3xl font-semibold mb-8">Shimmer Buttons</h2>
                    <div className="flex flex-wrap gap-4">
                        <ShimmerButton className="px-8 py-4 rounded-full bg-white text-black font-medium">
                            Primary Button
                        </ShimmerButton>
                        <ShimmerButton className="px-8 py-4 rounded-full glass-apple text-white font-medium">
                            Secondary Button
                        </ShimmerButton>
                        <ShimmerButton className="px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium">
                            Gradient Button
                        </ShimmerButton>
                    </div>
                </FadeIn>

                {/* Gradient Text */}
                <FadeIn delay={800}>
                    <h2 className="text-3xl font-semibold mb-8">Gradient Text</h2>
                    <div className="space-y-4">
                        <p className="text-4xl font-bold">
                            <GradientText>Default Gradient</GradientText>
                        </p>
                        <p className="text-4xl font-bold">
                            <GradientText 
                                from="from-violet-400" 
                                via="via-fuchsia-400" 
                                to="to-pink-400"
                            >
                                Custom Gradient
                            </GradientText>
                        </p>
                        <p className="text-4xl font-bold">
                            <GradientText 
                                from="from-blue-400" 
                                via="via-cyan-400" 
                                to="to-teal-400"
                                animate={true}
                            >
                                Animated Gradient
                            </GradientText>
                        </p>
                    </div>
                </FadeIn>

                {/* Fade In Directions */}
                <div className="space-y-8">
                    <h2 className="text-3xl font-semibold mb-8">Fade In Directions</h2>
                    <FadeIn direction="up" delay={0}>
                        <div className="glass-apple p-6 rounded-2xl">
                            <p className="text-white/80">Fade in from bottom (up)</p>
                        </div>
                    </FadeIn>
                    <FadeIn direction="down" delay={100}>
                        <div className="glass-apple p-6 rounded-2xl">
                            <p className="text-white/80">Fade in from top (down)</p>
                        </div>
                    </FadeIn>
                    <FadeIn direction="left" delay={200}>
                        <div className="glass-apple p-6 rounded-2xl">
                            <p className="text-white/80">Fade in from right (left)</p>
                        </div>
                    </FadeIn>
                    <FadeIn direction="right" delay={300}>
                        <div className="glass-apple p-6 rounded-2xl">
                            <p className="text-white/80">Fade in from left (right)</p>
                        </div>
                    </FadeIn>
                </div>

            </div>
        </div>
    );
};

export default ComponentShowcase;
