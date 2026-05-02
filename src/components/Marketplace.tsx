import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Filter, Search, Shield, Star, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getActiveProducts } from '../services/productService';
import { getSellerById } from '../services/sellerService';
import type { Product, Seller } from '../types/marketplace';
import { FadeIn, TiltCard } from './ui';

interface ProductWithSeller extends Product {
  seller?: Seller;
}

const copy = {
  zh: {
    title: '模型 API 市场',
    subtitle: '发现已通过连通性测试的商家模型，按积分订阅、按调用结算。',
    search: '搜索模型、商家或用途...',
    allModels: '全部模型',
    verified: '已验证',
    noProducts: '没有找到匹配的 API',
    noProductsDesc: '换一个关键词或清空模型筛选再试试。',
    loading: '正在加载市场供给...',
    startPrice: '起价',
    reviews: '评价',
    sales: '销量',
    details: '查看详情',
    supply: '商家供给',
    health: '测试通过',
    loadMore: '加载更多',
  },
  en: {
    title: 'Model API marketplace',
    subtitle: 'Discover merchant models that passed connection tests. Subscribe with credits and settle by call.',
    search: 'Search models, merchants, or use cases...',
    allModels: 'All models',
    verified: 'Verified',
    noProducts: 'No matching APIs found',
    noProductsDesc: 'Try another keyword or clear the model filter.',
    loading: 'Loading marketplace supply...',
    startPrice: 'Starts at',
    reviews: 'reviews',
    sales: 'sales',
    details: 'View details',
    supply: 'Merchant supply',
    health: 'Test passed',
    loadMore: 'Load more',
  },
} as const;

const Marketplace = () => {
  const { i18n } = useTranslation();
  const zh = i18n.language?.startsWith('zh');
  const c = zh ? copy.zh : copy.en;
  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('all');

  useEffect(() => {
    void loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await getActiveProducts(20);
      const productsWithSellers = await Promise.all(
        productsData.map(async (product) => {
          const seller = await getSellerById(product.seller_id);
          return { ...product, seller: seller || undefined };
        }),
      );

      setProducts(productsWithSellers);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const allModels = useMemo(() => Array.from(new Set(products.flatMap((product) => product.models))).sort(), [products]);

  const filteredProducts = products.filter((product) => {
    const normalizedQuery = searchQuery.toLowerCase();
    const matchesSearch =
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.description.toLowerCase().includes(normalizedQuery) ||
      product.seller?.name.toLowerCase().includes(normalizedQuery);
    const matchesModel = selectedModel === 'all' || product.models.includes(selectedModel);
    return matchesSearch && matchesModel;
  });

  return (
    <div className="min-h-screen bg-[#070b0d] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <FadeIn direction="up" delay={0.1}>
          <header className="mb-10 border-b border-white/10 pb-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#2f6f5e]/40 bg-[#2f6f5e]/12 px-3 py-1 text-xs font-medium text-[#9be2c8]">
              <Shield size={14} />
              {c.supply}
            </div>
            <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">{c.title}</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/58">{c.subtitle}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                  <div className="text-xs uppercase tracking-widest text-white/42">{c.supply}</div>
                  <div className="mt-2 text-3xl font-semibold">{products.length}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                  <div className="text-xs uppercase tracking-widest text-white/42">{c.health}</div>
                  <div className="mt-2 text-3xl font-semibold">{products.filter((product) => product.is_verified).length}</div>
                </div>
              </div>
            </div>
          </header>
        </FadeIn>

        <FadeIn direction="up" delay={0.2}>
          <div className="mb-8 grid gap-3 md:grid-cols-[1fr_260px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/38" size={20} />
              <input
                type="text"
                placeholder={c.search}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="min-h-12 w-full rounded-lg border border-white/10 bg-[#0b1213] pl-12 pr-4 text-white placeholder:text-white/34 transition focus:border-[#d76f37]/60 focus:outline-none"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-white/38" size={20} />
              <select
                value={selectedModel}
                onChange={(event) => setSelectedModel(event.target.value)}
                className="min-h-12 w-full cursor-pointer appearance-none rounded-lg border border-white/10 bg-[#0b1213] pl-12 pr-8 text-white transition focus:border-[#d76f37]/60 focus:outline-none"
              >
                <option value="all" className="bg-[#0b1213]">{c.allModels}</option>
                {allModels.map((model) => (
                  <option key={model} value={model} className="bg-[#0b1213]">{model}</option>
                ))}
              </select>
            </div>
          </div>
        </FadeIn>

        {loading && (
          <div className="grid place-items-center rounded-xl border border-white/10 bg-white/[0.035] py-20 text-white/58">
            {c.loading}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.035] py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-white/[0.05]">
              <Search size={32} className="text-white/30" />
            </div>
            <h2 className="text-xl font-semibold">{c.noProducts}</h2>
            <p className="mt-2 text-sm text-white/50">{c.noProductsDesc}</p>
          </div>
        )}

        {!loading && filteredProducts.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product, index) => (
              <FadeIn key={product.id} direction="up" delay={0.06 * (index % 6)}>
                <TiltCard className="h-full">
                  <Link to={`/product/${product.id}`} className="block h-full">
                    <article className="flex h-full flex-col rounded-xl border border-white/10 bg-[#0b1213]/88 p-5 transition hover:border-[#d76f37]/45">
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-semibold transition group-hover:text-[#f2b36d]">{product.name}</h2>
                          {product.seller && <p className="mt-1 truncate text-sm text-white/48">by {product.seller.name}</p>}
                        </div>
                        {product.is_verified && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#2f6f5e]/16 px-2 py-1 text-xs text-[#9be2c8]">
                            <Shield size={12} />
                            {c.verified}
                          </span>
                        )}
                      </div>

                      <p className="mb-5 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-white/58">{product.description}</p>

                      <div className="mb-5 flex flex-wrap gap-2">
                        {product.models.slice(0, 3).map((model) => (
                          <span key={model} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white/68">{model}</span>
                        ))}
                        {product.models.length > 3 && <span className="px-2 py-1 text-xs text-white/36">+{product.models.length - 3}</span>}
                      </div>

                      <div className="mt-auto border-t border-white/10 pt-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-4">
                            <span className="inline-flex items-center gap-1 text-sm text-white/76">
                              <Star size={14} className="fill-[#f2b36d] text-[#f2b36d]" />
                              {product.rating.toFixed(1)}
                              <span className="text-xs text-white/38">({product.review_count})</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-sm text-white/76">
                              <TrendingUp size={14} className="text-[#9be2c8]" />
                              {product.total_sales}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-[11px] uppercase tracking-widest text-white/35">{c.startPrice}</div>
                            <div className="font-mono text-sm text-white/90">{product.pricing.input_per_1k.toFixed(3)}/1K</div>
                          </div>
                        </div>
                        <div className="flex min-h-10 items-center justify-end gap-2 rounded-lg border border-white/10 px-3 text-sm text-white/72">
                          {c.details}
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    </article>
                  </Link>
                </TiltCard>
              </FadeIn>
            ))}
          </div>
        )}

        {!loading && filteredProducts.length >= 20 && (
          <div className="mt-10 text-center">
            <button className="min-h-11 rounded-lg border border-white/10 px-6 text-sm text-white/72 hover:border-[#d76f37]/50 hover:text-white">
              {c.loadMore}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
