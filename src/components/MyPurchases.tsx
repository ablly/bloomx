import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ExternalLink, Calendar, CheckCircle } from 'lucide-react';
import { getUserPurchases } from '../services/purchaseService';
import { useAuth } from '../contexts/AuthContext';
import type { Purchase } from '../types/marketplace';
import { FadeIn } from './ui';

const MyPurchases = () => {
  const { currentUser } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadPurchases();
    }
  }, [currentUser]);

  const loadPurchases = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const data = await getUserPurchases(currentUser.uid);
      setPurchases(data);
    } catch (error) {
      console.error('Failed to load purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-24 px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <FadeIn direction="up" delay={0.1}>
          <div className="mb-12">
            <h1 className="text-5xl font-sans tracking-tight mb-4">我的购买</h1>
            <p className="text-white/60">管理您购买的所有 API 产品</p>
          </div>
        </FadeIn>

        {/* Empty State */}
        {purchases.length === 0 && (
          <FadeIn direction="up" delay={0.2}>
            <div className="liquid-glass rounded-3xl p-12 border border-white/10 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={32} className="text-white/30" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">还没有购买记录</h3>
              <p className="text-white/50 mb-6">浏览市场，发现优质的 API 产品</p>
              <Link
                to="/marketplace"
                className="inline-block bg-white hover:bg-white/90 text-black px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
              >
                前往市场
              </Link>
            </div>
          </FadeIn>
        )}

        {/* Purchases List */}
        {purchases.length > 0 && (
          <div className="space-y-4">
            {purchases.map((purchase, index) => (
              <FadeIn key={purchase.id} direction="up" delay={0.1 * index}>
                <div className="liquid-glass rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    
                    {/* Left: Product Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-white/10">
                          <CheckCircle size={20} className="text-violet-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {purchase.product_name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-white/50">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>购买于 {formatDate(purchase.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${
                                purchase.status === 'active' ? 'bg-green-400' : 'bg-red-400'
                              }`} />
                              <span>{purchase.status === 'active' ? '有效' : '已过期'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* API URL */}
                      <div className="bg-black/40 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-white/40 mb-1">API 端点</div>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-sm text-white/80 font-mono truncate">
                            {purchase.product_url}
                          </code>
                          <a
                            href={purchase.product_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-400 hover:text-violet-300 transition-colors shrink-0"
                          >
                            <ExternalLink size={16} />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col gap-2 md:w-40">
                      <Link
                        to={`/product/${purchase.product_id}`}
                        className="bg-white/10 hover:bg-white/20 text-white text-center px-4 py-2 rounded-lg text-sm transition-colors duration-200 border border-white/10"
                      >
                        查看详情
                      </Link>
                      <button className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-center px-4 py-2 rounded-lg text-sm transition-colors duration-200 border border-white/10">
                        使用文档
                      </button>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        )}

        {/* Stats */}
        {purchases.length > 0 && (
          <FadeIn direction="up" delay={0.3}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
              <div className="liquid-glass rounded-xl p-4 border border-white/10">
                <div className="text-sm text-white/50 mb-1">总购买数</div>
                <div className="text-2xl font-sans text-white">{purchases.length}</div>
              </div>
              <div className="liquid-glass rounded-xl p-4 border border-white/10">
                <div className="text-sm text-white/50 mb-1">有效产品</div>
                <div className="text-2xl font-sans text-white">
                  {purchases.filter(p => p.status === 'active').length}
                </div>
              </div>
              <div className="liquid-glass rounded-xl p-4 border border-white/10">
                <div className="text-sm text-white/50 mb-1">总花费</div>
                <div className="text-2xl font-sans text-white">
                  ${(purchases.length * 10).toFixed(2)}
                </div>
              </div>
            </div>
          </FadeIn>
        )}

      </div>
    </div>
  );
};

export default MyPurchases;
