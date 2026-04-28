import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Star, TrendingUp, Shield, ArrowRight } from 'lucide-react';
import { getActiveProducts } from '../services/productService';
import { getSellerById } from '../services/sellerService';
import type { Product, Seller } from '../types/marketplace';
import { FadeIn, TiltCard } from './ui';

interface ProductWithSeller extends Product {
  seller?: Seller;
}

const Marketplace = () => {
  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('all');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await getActiveProducts(20);
      
      // Load seller info for each product
      const productsWithSellers = await Promise.all(
        productsData.map(async (product) => {
          const seller = await getSellerById(product.seller_id);
          return { ...product, seller: seller || undefined };
        })
      );
      
      setProducts(productsWithSellers);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique models from all products
  const allModels = Array.from(
    new Set(products.flatMap(p => p.models))
  );

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModel = selectedModel === 'all' || product.models.includes(selectedModel);
    return matchesSearch && matchesModel;
  });

  return (
    <div className="min-h-screen bg-black text-white py-24 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <FadeIn direction="up" delay={0.1}>
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-7xl font-sans tracking-tight mb-6">
              API <span className="font-serif italic text-white/80">Marketplace</span>
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              发现并购买来自全球卖家的高质量 AI API 接入
            </p>
          </div>
        </FadeIn>

        {/* Search and Filter */}
        <FadeIn direction="up" delay={0.2}>
          <div className="flex flex-col md:flex-row gap-4 mb-12">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type="text"
                placeholder="搜索 API 产品..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            {/* Model Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl pl-12 pr-8 py-3 text-white focus:outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer min-w-[200px]"
              >
                <option value="all" className="bg-neutral-900">所有模型</option>
                {allModels.map(model => (
                  <option key={model} value={model} className="bg-neutral-900">{model}</option>
                ))}
              </select>
            </div>
          </div>
        </FadeIn>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-white/30" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">未找到产品</h3>
            <p className="text-white/50">尝试调整搜索条件或筛选器</p>
          </div>
        )}

        {/* Products Grid */}
        {!loading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, index) => (
              <FadeIn key={product.id} direction="up" delay={0.1 * (index % 6)}>
                <TiltCard className="h-full">
                  <Link to={`/product/${product.id}`}>
                    <div className="liquid-glass rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 h-full flex flex-col group">
                      
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-violet-400 transition-colors">
                            {product.name}
                          </h3>
                          {product.seller && (
                            <p className="text-sm text-white/50">
                              by {product.seller.name}
                            </p>
                          )}
                        </div>
                        {product.is_verified && (
                          <div className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs">
                            <Shield size={12} />
                            <span>已验证</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-white/60 mb-4 line-clamp-2 flex-1">
                        {product.description}
                      </p>

                      {/* Models */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {product.models.slice(0, 3).map(model => (
                          <span
                            key={model}
                            className="text-xs bg-white/5 text-white/70 px-2 py-1 rounded-lg border border-white/10"
                          >
                            {model}
                          </span>
                        ))}
                        {product.models.length > 3 && (
                          <span className="text-xs text-white/40 px-2 py-1">
                            +{product.models.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex items-center gap-4">
                          {/* Rating */}
                          <div className="flex items-center gap-1">
                            <Star size={14} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-sm text-white/80">{product.rating.toFixed(1)}</span>
                            <span className="text-xs text-white/40">({product.review_count})</span>
                          </div>
                          
                          {/* Sales */}
                          <div className="flex items-center gap-1">
                            <TrendingUp size={14} className="text-green-400" />
                            <span className="text-sm text-white/80">{product.total_sales}</span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <div className="text-xs text-white/40">起价</div>
                          <div className="text-sm font-mono text-white/90">
                            ${product.pricing.input_per_1k.toFixed(3)}/1K
                          </div>
                        </div>
                      </div>

                      {/* View Details */}
                      <div className="mt-4 flex items-center justify-end text-violet-400 text-sm group-hover:gap-2 transition-all">
                        <span>查看详情</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </TiltCard>
              </FadeIn>
            ))}
          </div>
        )}

        {/* Load More */}
        {!loading && filteredProducts.length > 0 && filteredProducts.length >= 20 && (
          <div className="text-center mt-12">
            <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl transition-colors duration-200 border border-white/10">
              加载更多
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Marketplace;
