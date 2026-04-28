import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  DollarSign, 
  CreditCard,
  Settings,
  LogOut,
  Star,
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getSellerByUid } from '../../services/sellerService';
import { getSellerProducts } from '../../services/productService';
import type { Seller, Product } from '../../types/marketplace';
import { useTranslation } from 'react-i18next';

const SellerDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (currentUser) {
      loadSellerData();
    }
  }, [currentUser]);

  const loadSellerData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const sellerData = await getSellerByUid(currentUser.uid);
      setSeller(sellerData);
      if (sellerData) {
        const productsData = await getSellerProducts(sellerData.id);
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Failed to load seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { id: 'overview', label: t('seller.dashboard.overview') || 'Overview', icon: LayoutDashboard },
    { id: 'products', label: t('seller.dashboard.products') || 'Products', icon: Package },
    { id: 'earnings', label: t('seller.dashboard.earnings') || 'Earnings', icon: DollarSign },
    { id: 'withdraw', label: t('seller.dashboard.withdraw') || 'Withdraw', icon: CreditCard },
    { id: 'settings', label: t('seller.dashboard.settings') || 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="liquid-glass rounded-2xl p-8 max-w-md text-center">
          <Package size={48} className="mx-auto mb-4 text-white/30" />
          <h2 className="text-2xl font-semibold text-white mb-4">
            {t('seller.dashboard.notSeller') || 'Not a Seller Yet'}
          </h2>
          <p className="text-white/60 mb-6">
            {t('seller.dashboard.becomeSellerDesc') || 'Apply to become a seller and start selling your API.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors"
          >
            {t('seller.dashboard.applyNow') || 'Apply Now'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black font-sans text-white flex">
      <aside className="w-64 border-r border-white/10 bg-black/50 p-6 flex flex-col justify-between">
        <div>
          <div 
            className="flex items-center gap-2 mb-12 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black">
              <span className="font-bold text-lg">B</span>
            </div>
            <span className="font-semibold text-xl tracking-tighter">BloomX</span>
          </div>

          <nav className="space-y-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          {t('common.signOut') || 'Sign Out'}
        </button>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto w-full max-w-6xl">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-medium tracking-tight">
            {navItems.find(i => i.id === activeTab)?.label}
          </h1>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="liquid-glass rounded-2xl p-6">
                <div className="text-white/50 text-xs uppercase tracking-widest mb-2">
                  {t('seller.dashboard.totalProducts') || 'Total Products'}
                </div>
                <div className="text-4xl font-sans font-medium">
                  {products.length}
                </div>
              </div>
              <div className="liquid-glass rounded-2xl p-6">
                <div className="text-white/50 text-xs uppercase tracking-widest mb-2">
                  {t('seller.dashboard.totalEarnings') || 'Total Earnings'}
                </div>
                <div className="text-4xl font-sans font-medium">
                  ${seller.total_earnings?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="liquid-glass rounded-2xl p-6">
                <div className="text-white/50 text-xs uppercase tracking-widest mb-2">
                  {t('seller.dashboard.availableBalance') || 'Available'}
                </div>
                <div className="text-4xl font-sans font-medium text-green-400">
                  ${seller.available_balance?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="liquid-glass rounded-2xl p-6">
                <div className="text-white/50 text-xs uppercase tracking-widest mb-2">
                  {t('seller.dashboard.pendingBalance') || 'Pending'}
                </div>
                <div className="text-4xl font-sans font-medium text-amber-400">
                  ${seller.pending_balance?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="liquid-glass rounded-2xl p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Star size={18} className="text-yellow-400" />
                  {t('seller.dashboard.kycStatus') || 'KYC Status'}
                </h3>
                <div className={`inline-flex px-3 py-1 rounded-full text-sm ${
                  seller.kyc_status === 'approved' 
                    ? 'bg-green-500/20 text-green-400'
                    : seller.kyc_status === 'pending'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-white/10 text-white/60'
                }`}>
                  {seller.kyc_status || 'none'}
                </div>
              </div>
              <div className="liquid-glass rounded-2xl p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-blue-400" />
                  {t('seller.dashboard.accountStatus') || 'Account Status'}
                </h3>
                <div className={`inline-flex px-3 py-1 rounded-full text-sm ${
                  seller.status === 'approved' 
                    ? 'bg-green-500/20 text-green-400'
                    : seller.status === 'pending'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {seller.status}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-white/60">{t('seller.dashboard.manageProducts') || 'Manage your products'}</p>
              <button
                onClick={() => navigate('/seller/products/new')}
                className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors"
              >
                {t('seller.dashboard.addProduct') || 'Add Product'}
              </button>
            </div>

            {products.length === 0 ? (
              <div className="liquid-glass rounded-2xl p-12 text-center">
                <Package size={48} className="mx-auto mb-4 text-white/20" />
                <h3 className="text-lg font-medium text-white mb-2">
                  {t('seller.dashboard.noProducts') || 'No Products Yet'}
                </h3>
                <p className="text-white/50 text-sm mb-6">
                  {t('seller.dashboard.addFirstProduct') || 'Add your first product to start selling.'}
                </p>
              </div>
            ) : (
              <div className="liquid-glass rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-xs tracking-wider text-white/50 uppercase bg-white/5">
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Models</th>
                      <th className="px-6 py-4">Pricing</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {products.map(product => (
                      <tr 
                        key={product.id} 
                        className="hover:bg-white/5 cursor-pointer"
                        onClick={() => navigate(`/seller/products/${product.id}`)}
                      >
                        <td className="px-6 py-4 font-medium">{product.name}</td>
                        <td className="px-6 py-4 text-white/60">
                          {product.models?.slice(0, 2).join(', ')}
                          {product.models?.length > 2 && ` +${product.models.length - 2}`}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm">
                          ${product.pricing?.input_per_1k} / ${product.pricing?.output_per_1k}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                            product.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : product.status === 'pending_review'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-white/10 text-white/60'
                          }`}>
                            {product.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">{product.total_sales || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SellerDashboard;
