import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createProduct, getSellerProducts, updateProductStatus, deleteProduct } from '../../services/productService';
import { getSellerByUid } from '../../services/sellerService';

const SellerProductForm = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { productId } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!productId);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_url: '',
    auth_type: 'bearer' as 'bearer' | 'api_key' | 'basic',
    auth_value: '',
    models: [] as string[],
    pricing: {
      input_per_1k: 0,
      output_per_1k: 0,
    },
  });
  const [modelInput, setModelInput] = useState('');

  useEffect(() => {
    if (productId && currentUser) {
      loadProduct();
    }
  }, [productId, currentUser]);

  const loadProduct = async () => {
    if (!currentUser || !productId) return;
    setInitialLoading(true);
    try {
      const seller = await getSellerByUid(currentUser.uid);
      if (seller) {
        const products = await getSellerProducts(seller.id);
        const product = products.find(p => p.id === productId);
        if (product) {
          setFormData({
            name: product.name,
            description: product.description,
            base_url: product.base_url,
            auth_type: product.auth_type,
            auth_value: '',
            models: product.models,
            pricing: product.pricing,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('pricing.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        pricing: { ...prev.pricing, [key]: parseFloat(value) || 0 },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddModel = () => {
    if (modelInput.trim() && !formData.models.includes(modelInput.trim())) {
      setFormData(prev => ({
        ...prev,
        models: [...prev.models, modelInput.trim()],
      }));
      setModelInput('');
    }
  };

  const handleRemoveModel = (model: string) => {
    setFormData(prev => ({
      ...prev,
      models: prev.models.filter(m => m !== model),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const seller = await getSellerByUid(currentUser.uid);
      if (!seller) {
        alert('No seller profile found. Please apply to become a seller first.');
        navigate('/');
        return;
      }

      if (productId) {
        await updateProductStatus(seller.id, productId, 'inactive');
        alert('Product updated successfully!');
      } else {
        await createProduct(seller.id, {
          name: formData.name,
          description: formData.description,
          base_url: formData.base_url,
          auth_type: formData.auth_type,
          auth_value: formData.auth_value,
          models: formData.models,
          pricing: formData.pricing,
        });
        alert('Product created successfully!');
      }
      
      navigate('/seller/dashboard');
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !productId) return;
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    setLoading(true);
    try {
      const seller = await getSellerByUid(currentUser.uid);
      if (seller) {
        await deleteProduct(seller.id, productId);
        alert('Product deleted successfully!');
        navigate('/seller/dashboard');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/seller/dashboard')}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="liquid-glass rounded-2xl p-8 border border-white/10">
          <h2 className="text-2xl font-semibold text-white mb-6">
            {productId ? 'Edit Product' : 'Add New Product'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-white/60 mb-2">Product Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                placeholder="My API Product"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 resize-none transition-colors"
                placeholder="Describe your API product..."
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Base URL</label>
              <input
                name="base_url"
                value={formData.base_url}
                onChange={handleChange}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 font-mono text-sm transition-colors"
                placeholder="https://api.yourprovider.com/v1"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Auth Type</label>
              <select
                name="auth_type"
                value={formData.auth_type}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
              >
                <option value="bearer">Bearer Token</option>
                <option value="api_key">API Key</option>
                <option value="basic">Basic Auth</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Auth Value</label>
              <input
                name="auth_value"
                type="password"
                value={formData.auth_value}
                onChange={handleChange}
                required={!productId}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 font-mono text-sm transition-colors"
                placeholder={productId ? 'Leave empty to keep existing' : 'Your API key or token'}
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Supported Models</label>
              <div className="flex gap-2 mb-2">
                <input
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddModel())}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="e.g., gpt-4o"
                />
                <button
                  type="button"
                  onClick={handleAddModel}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.models.map(model => (
                  <span
                    key={model}
                    className="inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-sm"
                  >
                    {model}
                    <button
                      type="button"
                      onClick={() => handleRemoveModel(model)}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Input Price (per 1K tokens)</label>
                <input
                  name="pricing.input_per_1k"
                  type="number"
                  step="0.001"
                  value={formData.pricing.input_per_1k}
                  onChange={handleChange}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 font-mono transition-colors"
                  placeholder="0.015"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Output Price (per 1K tokens)</label>
                <input
                  name="pricing.output_per_1k"
                  type="number"
                  step="0.001"
                  value={formData.pricing.output_per_1k}
                  onChange={handleChange}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 font-mono transition-colors"
                  placeholder="0.015"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin mx-auto" />
                ) : (
                  <>
                    <Save size={18} className="inline mr-2" />
                    {productId ? 'Update Product' : 'Create Product'}
                  </>
                )}
              </button>
              {productId && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="bg-red-500/20 text-red-400 px-6 py-3 rounded-xl font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SellerProductForm;
