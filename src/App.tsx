import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useState } from 'react';
import BackgroundVideo from './components/BackgroundVideo';
import HeroLanding from './components/HeroLanding';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import { useAuth } from './contexts/AuthContext';
import {
    closeStripeCheckoutWindow,
    createStripeCheckout,
    navigateStripeCheckoutWindow,
    openStripeCheckoutWindow,
    type CreditPlanId,
} from './services/checkoutService';

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
    const { currentUser, loading: authLoading } = useAuth();
    const [authOpen, setAuthOpen] = useState(false);
    const [pendingCreditPlan, setPendingCreditPlan] = useState<CreditPlanId | null>(null);

    const handleDashboardEnter = () => {
        if (currentUser) {
            window.location.href = '/dashboard';
        } else {
            setAuthOpen(true);
        }
    };

    const openCreditCheckout = async (planId: CreditPlanId) => {
        if (authLoading) {
            throw new Error('正在确认登录状态，请稍后再试。');
        }

        if (!currentUser) {
            setPendingCreditPlan(planId);
            setAuthOpen(true);
            throw new Error('请先登录。登录成功后会自动继续打开 Stripe 支付窗口。');
        }

        const checkoutWindow = openStripeCheckoutWindow(planId);
        try {
            const checkout = await createStripeCheckout(planId);
            navigateStripeCheckoutWindow(checkoutWindow, checkout.checkoutUrl);
        } catch (error) {
            closeStripeCheckoutWindow(checkoutWindow);
            throw error;
        }
    };

    const continuePendingCheckout = async () => {
        if (!pendingCreditPlan) return;
        const planId = pendingCreditPlan;
        setPendingCreditPlan(null);
        const checkoutWindow = openStripeCheckoutWindow(planId);
        try {
            const checkout = await createStripeCheckout(planId);
            navigateStripeCheckoutWindow(checkoutWindow, checkout.checkoutUrl);
        } catch (error) {
            closeStripeCheckoutWindow(checkoutWindow);
            console.error('Failed to continue Stripe checkout:', error);
        }
    };

    return (
        <>
            <HeroLanding onDashboardEnter={handleDashboardEnter} onCreditCheckout={openCreditCheckout} />
            <Footer />
            <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} onAuthSuccess={() => void continuePendingCheckout()} />
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
            <div className="relative min-h-screen bg-[#050807] font-sans scroll-smooth [overflow-x:clip]">
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
