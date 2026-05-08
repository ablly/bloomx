export interface Seller {
  id: string;
  uid: string;
  name: string;
  description: string;
  logo_url: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  kyc_status: 'none' | 'pending' | 'approved' | 'rejected';
  asset_verified: boolean;
  total_products: number;
  total_earnings: number;
  available_balance: number;
  pending_balance: number;
  bank_account?: {
    last4: string;
    bank_name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  seller_id: string;
  name: string;
  description: string;
  base_url: string;
  auth_type: 'bearer' | 'api_key' | 'basic';
  auth_value_encrypted?: string;
  provider_type?: string;
  models: string[];
  pricing: {
    input_per_1k: number;
    output_per_1k: number;
  };
  status: 'active' | 'inactive' | 'pending_test' | 'pending_review' | 'test_failed' | 'rejected' | 'suspended';
  last_test_log_id?: string;
  rating: number;
  total_sales: number;
  review_count: number;
  is_verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Earning {
  id: string;
  seller_id: string;
  product_id: string;
  buyer_id: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  gross_amount: number;
  platform_fee: number;
  seller_earnings: number;
  status: 'pending' | 'available' | 'withdrawn';
  createdAt: Date;
}

export interface Withdrawal {
  id: string;
  seller_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bank_account_last4: string;
  bank_name: string;
  transaction_id?: string;
  failure_reason?: string;
  processedAt?: Date;
  createdAt: Date;
}

export interface Purchase {
  id: string;
  uid: string;
  product_id: string;
  seller_id: string;
  product_name: string;
  product_url: string;
  status: 'active' | 'expired' | 'revoked';
  createdAt: Date;
  expiresAt: Date;
}

export interface Review {
  id: string;
  product_id: string;
  buyer_id: string;
  buyer_email: string;
  rating: number;
  comment: string;
  createdAt: Date;
}
