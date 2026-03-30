import { useState } from 'react';
import BackgroundVideo from './components/BackgroundVideo';
import HeroLanding from './components/HeroLanding';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import ModelCatalog from './components/ModelCatalog';
import Pricing from './components/Pricing';
import Testimonials from './components/Testimonials';
import SellerApplyForm from './components/SellerApplyForm';
import CTABanner from './components/CTABanner';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import AuthModal from './components/AuthModal';
import PageTransition from './components/PageTransition';
import { useAuth } from './contexts/AuthContext';
import { Particles, DotPattern } from './components/ui';

function App() {
    const { currentUser, loading, logout } = useAuth();
    const [view, setView] = useState<'landing' | 'dashboard'>('landing');
    const [authOpen, setAuthOpen] = useState(false);

    // If user is logged in and wants to enter the dashboard
    const handleDashboardEnter = () => {
        if (currentUser) {
            setView('dashboard');
        } else {
            setAuthOpen(true);
        }
    };

    // After successful login, go to dashboard
    const handleAuthClose = () => {
        setAuthOpen(false);
        if (currentUser) {
            setView('dashboard');
        }
    };

    const handleLogout = async () => {
        await logout();
        setView('landing');
    };

    // Show a loading spinner while Firebase checks auth state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-fuchsia-500 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1s'}} />
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-black font-sans scroll-smooth overflow-hidden">
            <BackgroundVideo />
            
            {/* Particles effect */}
            <Particles count={80} color="rgba(255,255,255,0.3)" size={2} speed={0.3} />
            
            {/* Dot pattern overlay */}
            <DotPattern className="opacity-20" spacing={30} dotSize={1.5} fade={true} />

            <PageTransition isActive={view === 'dashboard' && !!currentUser}>
                <Dashboard onLogout={handleLogout} />
            </PageTransition>

            <PageTransition isActive={view === 'landing'}>
                <div>
                    <HeroLanding onDashboardEnter={handleDashboardEnter} />
                    <Features />
                    <HowItWorks />
                    <ModelCatalog />
                    <Pricing />
                    <Testimonials />
                    <SellerApplyForm />
                    <CTABanner onDashboardEnter={handleDashboardEnter} />
                    <Footer />
                </div>
            </PageTransition>

            {/* Auth Modal */}
            <AuthModal isOpen={authOpen} onClose={handleAuthClose} />
        </div>
    );
}

export default App;
