import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Shield, Star, TrendingUp, ArrowLeft, Check, ExternalLink, Loader2 } from 'lucide-react';
import { getProductById } from '../services/productService';
import { getSellerById } from '../services/sellerService';
import { hasProductAccess, createPurchase } from '../services/purchaseService';
import { useAuth } from '../contexts/AuthContext';
import type { Product, Seller } from '../types/marketplace';
import { FadeIn, ShimmerButton } from './ui';

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    if (productId) {
      loadProductData();
    }
  }, [productId]);

  const loadProductData = async () => {
    if (!productId) return;
    
    try {
      setLoading(true);
      const productData = await getProductById(productId);
      
      if (!productData) {
        navigate('/marketplace');
        return;
      }
      
      setProduct(productData);
      
      // Load seller info
      const sellerData = await getSellerById(productData.seller_id);
      setSeller(sellerData);
      
      // Check if user already has access
      if (currentUser) {
        const access = await hasProductAccess(currentUser.uid, productId);
        setHasAccess(access);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!currentUser || !product) return;
    
    // Check credits balance (假设每个产品 $10)
    const productPrice = 10;
    if ((userProfile?.credits || 0) < productPrice) {
      alert('余额不足，请先充值');
      navigate('/dashboard');
      return;
    }
    
    setPurchasing(true);
    try {
      await createPurchase(currentUser.uid, {
        product_id: product.id,
        seller_id: product.seller_id,
        product_name: product.name,
        product_url: product.base_url,
      });
      
      setHasAccess(true);
      setShowPurchaseModal(false);
      alert('购买成功！');
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('购买失败，请重试');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white py-24 px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Back Button */}
        <FadeIn direction="left" delay={0.1}>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft size={20} />
            <span>返回市场</span>
          </Link>
        </FadeIn>

        {/* Product Header */}
        <FadeIn direction="up" delay={0.2}>
          <div className="liquid-glass rounded-3xl p-8 border border-white/10 mb-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              
              {/* Left: Product Info */}
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-4">
                  <h1 className="text-4xl font-sans tracking-tight">{product.name}</h1>
                  {product.is_verified && (
                    <div className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                      <Shield size={14} />
                      <span>已验证</span>
                    </div>
                  )}
                </div>
                
                {seller && (
                  <p className="text-white/60 mb-4">
                    by <span className="text-white/80 font-medium">{seller.name}</span>
                  </p>
                )}
                
                <p className="text-white/70 leading-relaxed mb-6">
                  {product.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Star size={18} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-white/90 font-medium">{product.rating.toFixed(1)}</span>
                    <span className="text-white/50 text-sm">({product.review_count} 评价)</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-green-400" />
                    <span className="text-white/90 font-medium">{product.total_sales}</span>
                    <span className="text-white/50 text-sm">销量</span>
                  </div>
                </div>
              </div>

              {/* Right: Purchase Card */}
              <div className="md:w-80 liquid-glass-strong rounded-2xl p-6 border border-white/10">
                <div className="text-center mb-6">
                  <div className="text-sm text-white/50 mb-2">一次性购买</div>
                  <div className="text-4xl font-sans tracking-tight mb-1">$10.00</div>
                  <div className="text-xs text-white/40">永久访问权限</div>
                </div>

                {hasAccess ? (
                  <div className="bg-green-500/20 text-green-400 rounded-xl p-4 text-center">
                    <Check size={24} className="mx-auto mb-2" />
                    <p className="text-sm font-medium">您已拥有此产品</p>
                  </div>
                ) : (
                  <ShimmerButton
                    onClick={() => setShowPurchaseModal(true)}
                    className="w-full"
                    disabled={!currentUser}
                  >
                    {currentUser ? '立即购买' : '登录后购买'}
                  </ShimmerButton>
                )}

                <div className="mt-4 space-y-2 text-xs text-white/50">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-green-400" />
                    <span>永久访问权限</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-green-400" />
                    <span>按使用量计费</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-green-400" />
                    <span>7天退款保证</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Models */}
        <FadeIn direction="up" delay={0.3}>
          <div className="liquid-glass rounded-2xl p-6 border border-white/10 mb-8">
            <h2 className="text-xl font-semibold mb-4">支持的模型</h2>
            <div className="flex flex-wrap gap-3">
              {product.models.map(model => (
                <div
                  key={model}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white/80"
                >
                  {model}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Pricing */}
        <FadeIn direction="up" delay={0.4}>
          <div className="liquid-glass rounded-2xl p-6 border border-white/10 mb-8">
            <h2 className="text-xl font-semibold mb-4">定价详情</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-sm text-white/50 mb-1">输入 Token</div>
                <div className="text-2xl font-mono text-white/90">
                  ${product.pricing.input_per_1k.toFixed(3)}
                  <span className="text-sm text-white/50 ml-1">/ 1K tokens</span>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-sm text-white/50 mb-1">输出 Token</div>
                <div className="text-2xl font-mono text-white/90">
                  ${product.pricing.output_per_1k.toFixed(3)}
                  <span className="text-sm text-white/50 ml-1">/ 1K tokens</span>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* API Endpoint */}
        {hasAccess && (
          <FadeIn direction="up" delay={0.5}>
            <div className="liquid-glass rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold mb-4">API 端点</h2>
              <div className="bg-black/40 rounded-xl p-4 border border-white/10 flex items-center justify-between">
                <code className="text-sm text-white/80 font-mono">{product.base_url}</code>
                <a
                  href={product.base_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <ExternalLink size={18} />
                </a>
              </div>
              <p className="text-xs text-white/50 mt-3">
                请在 Dashboard 中查看完整的 API 凭证和使用文档
              </p>
            </div>
          </FadeIn>
        )}

      </div>

      {/* Purchase Confirmation Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <FadeIn direction="up" delay={0}>
            <div className="liquid-glass-strong rounded-3xl p-8 max-w-md w-full border border-white/20">
              <h3 className="text-2xl font-semibold mb-4">确认购买</h3>
              
              <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/60">产品</span>
                  <span className="text-white font-medium">{product.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/60">价格</span>
                  <span className="text-white font-medium">$10.00</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-white/60">当前余额</span>
                  <span className="text-white font-mono">${userProfile?.credits?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  disabled={purchasing}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-colors duration-200 disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="flex-1 bg-white hover:bg-white/90 text-black px-6 py-3 rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {purchasing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>处理中...</span>
                    </>
                  ) : (
                    '确认购买'
                  )}
                </button>
              </div>
            </div>
          </FadeIn>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
