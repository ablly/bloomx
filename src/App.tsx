import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useState } from 'react';
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
import AuthModal from './components/AuthModal';
import { useAuth } from './contexts/AuthContext';
import { Particles, DotPattern } from './components/ui';

const Dashboard = lazy(() => import('./components/Dashboard'));
const Marketplace = lazy(() => import('./components/Marketplace'));
const ProductDetail = lazy(() => import('./components/ProductDetail'));
const MyPurchases = lazy(() => import('./components/MyPurchases'));
const SellerDashboard = lazy(() => import('./components/seller/SellerDashboard'));
const SellerProductForm = lazy(() => import('./components/seller/SellerProductForm'));
const DiagnosticPage = lazy(() => import('./components/DiagnosticPage'));

function RouteFallback() {
    return (
        <div className="min-h-screen grid place-items-center px-6 text-white">
            <div className="glass-apple rounded-3xl px-6 py-4 text-sm tracking-wide text-white/70">
                Loading workspace...
            </div>
        </div>
    );
}

// Landing Page Component
function LandingPage() {
    const { currentUser } = useAuth();
    const [authOpen, setAuthOpen] = useState(false);

    const handleDashboardEnter = () => {
        if (currentUser) {
            window.location.href = '/dashboard';
        } else {
            setAuthOpen(true);
        }
    };

    return (
        <>
            <HeroLanding onDashboardEnter={handleDashboardEnter} />
            <Features />
            <HowItWorks />
            <ModelCatalog />
            <Pricing />
            <Testimonials />
            <SellerApplyForm />
            <CTABanner onDashboardEnter={handleDashboardEnter} />
            <Footer />
            <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        </>
    );
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth(); // 移除 loading 检查

    // 如果没有用户，重定向到首页
    if (!currentUser) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

function App() {
    const { logout } = useAuth(); // 移除 loading 检查

    const handleLogout = async () => {
        await logout();
        window.location.href = '/';
    };

    // 直接渲染，不等待 Auth 初始化
    return (
        <BrowserRouter>
            <div className="relative min-h-screen bg-black font-sans scroll-smooth overflow-hidden">
                <BackgroundVideo />
                
                {/* Particles effect */}
                <Particles count={80} color="rgba(255,255,255,0.3)" size={2} speed={0.3} />
                
                {/* Dot pattern overlay */}
                <DotPattern className="opacity-20" spacing={30} dotSize={1.5} fade={true} />

                <Suspense fallback={<RouteFallback />}>
                    <Routes>
                        {/* Landing Page */}
                        <Route path="/" element={<LandingPage />} />

                        {/* Buyer Dashboard */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard onLogout={handleLogout} />
                                </ProtectedRoute>
                            }
                        />

                        {/* Marketplace */}
                        <Route path="/marketplace" element={<Marketplace />} />

                        {/* Product Detail */}
                        <Route path="/product/:productId" element={<ProductDetail />} />

                        {/* My Purchases */}
                        <Route
                            path="/my-purchases"
                            element={
                                <ProtectedRoute>
                                    <MyPurchases />
                                </ProtectedRoute>
                            }
                        />

                        {/* Seller Dashboard */}
                        <Route
                            path="/seller/dashboard"
                            element={
                                <ProtectedRoute>
                                    <SellerDashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* Seller Product Form - New */}
                        <Route
                            path="/seller/products/new"
                            element={
                                <ProtectedRoute>
                                    <SellerProductForm />
                                </ProtectedRoute>
                            }
                        />

                        {/* Seller Product Form - Edit */}
                        <Route
                            path="/seller/products/:productId"
                            element={
                                <ProtectedRoute>
                                    <SellerProductForm />
                                </ProtectedRoute>
                            }
                        />

                        {/* Diagnostic Page */}
                        <Route path="/diagnostic" element={<DiagnosticPage />} />

                        {/* 404 */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </div>
        </BrowserRouter>
    );
}

export default App;
