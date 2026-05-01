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

const Dashboard = lazy(() => import('./components/Dashboard'));
const Marketplace = lazy(() => import('./components/Marketplace'));
const ProductDetail = lazy(() => import('./components/ProductDetail'));
const MyPurchases = lazy(() => import('./components/MyPurchases'));
const SellerDashboard = lazy(() => import('./components/seller/SellerDashboard'));
const SellerProductForm = lazy(() => import('./components/seller/SellerProductForm'));
const AdminOperations = lazy(() => import('./components/admin/AdminOperations'));

function RouteFallback() {
    return (
        <div className="min-h-screen grid place-items-center px-6 text-white">
            <div className="glass-apple rounded-3xl px-6 py-4 text-sm tracking-wide text-white/70">
                Loading workspace...
            </div>
        </div>
    );
}

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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

function App() {
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        window.location.href = '/';
    };

    return (
        <BrowserRouter>
            <div className="relative min-h-screen bg-[#050807] font-sans scroll-smooth overflow-x-hidden">
                <BackgroundVideo />

                <div className="relative z-10">
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

                        {/* Admin operations */}
                        <Route
                            path="/admin"
                            element={<AdminOperations />}
                        />
                        <Route
                            path="/admin/:section"
                            element={<AdminOperations />}
                        />

                        {/* 404 */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </div>
            </div>
        </BrowserRouter>
    );
}

export default App;
