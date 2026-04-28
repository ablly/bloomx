import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

// 加载环境变量
dotenv.config({ path: '.env' });

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;
const API_KEY = process.env.VITE_FIREBASE_API_KEY;

if (!PROJECT_ID || !API_KEY) {
  console.error('❌ 缺少 Firebase 配置');
  process.exit(1);
}

const FIRESTORE_API = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function addDocument(collection: string, data: any) {
  const url = `${FIRESTORE_API}/${collection}?key=${API_KEY}`;
  
  // 转换数据为 Firestore 格式
  const firestoreData: any = { fields: {} };
  
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    
    if (typeof value === 'string') {
      firestoreData.fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        firestoreData.fields[key] = { integerValue: value.toString() };
      } else {
        firestoreData.fields[key] = { doubleValue: value };
      }
    } else if (typeof value === 'boolean') {
      firestoreData.fields[key] = { booleanValue: value };
    } else if (Array.isArray(value)) {
      firestoreData.fields[key] = {
        arrayValue: {
          values: value.map(v => 
            typeof v === 'string' ? { stringValue: v } : { stringValue: String(v) }
          )
        }
      };
    } else if (value === 'TIMESTAMP') {
      firestoreData.fields[key] = { timestampValue: new Date().toISOString() };
    }
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(firestoreData)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to add document: ${error}`);
  }
  
  const result = await response.json();
  return result;
}

async function initProductionData() {
  console.log('🚀 开始初始化生产环境数据（使用 REST API）...\n');

  try {
    // 1. 创建积分套餐
    console.log('📦 创建积分套餐...');
    const packages = [
      {
        name: 'Starter Pack',
        name_zh: '入门套餐',
        credits: 100,
        price: 10,
        currency: 'USD',
        description: 'Perfect for trying out our API services',
        description_zh: '适合试用我们的 API 服务',
        popular: false,
        discount: 0,
        features: ['100 API Credits', 'Access to all models', 'Email support', 'Valid for 30 days'],
        features_zh: ['100 API 积分', '访问所有模型', '邮件支持', '30 天有效期'],
        status: 'active',
        createdAt: 'TIMESTAMP',
        updatedAt: 'TIMESTAMP'
      },
      {
        name: 'Professional Pack',
        name_zh: '专业套餐',
        credits: 500,
        price: 45,
        currency: 'USD',
        description: 'Best value for regular users',
        description_zh: '最适合常规用户的选择',
        popular: true,
        discount: 10,
        features: ['500 API Credits', 'Access to all models', 'Priority email support', 'Valid for 60 days', '10% discount'],
        features_zh: ['500 API 积分', '访问所有模型', '优先邮件支持', '60 天有效期', '10% 折扣'],
        status: 'active',
        createdAt: 'TIMESTAMP',
        updatedAt: 'TIMESTAMP'
      },
      {
        name: 'Enterprise Pack',
        name_zh: '企业套餐',
        credits: 2000,
        price: 160,
        currency: 'USD',
        description: 'For teams and high-volume usage',
        description_zh: '适合团队和高频使用',
        popular: false,
        discount: 20,
        features: ['2000 API Credits', 'Access to all models', '24/7 priority support', 'Valid for 90 days', '20% discount', 'Dedicated account manager'],
        features_zh: ['2000 API 积分', '访问所有模型', '7x24 优先支持', '90 天有效期', '20% 折扣', '专属客户经理'],
        status: 'active',
        createdAt: 'TIMESTAMP',
        updatedAt: 'TIMESTAMP'
      }
    ];

    for (const pkg of packages) {
      await addDocument('credit_packages', pkg);
      console.log(`  ✅ ${pkg.name}`);
    }

    // 2. 创建 API 产品
    console.log('\n🛍️ 创建 API 产品...');
    const products = [
      {
        name: 'GPT-4o API Access',
        name_zh: 'GPT-4o API 访问',
        provider: 'OpenAI',
        model: 'gpt-4o',
        category: 'chat',
        description: 'Access to OpenAI\'s most advanced GPT-4o model with vision capabilities',
        description_zh: '访问 OpenAI 最先进的 GPT-4o 模型，支持视觉功能',
        price_per_1k_tokens: 0.005,
        input_price: 0.005,
        output_price: 0.015,
        currency: 'USD',
        features: ['Context window: 128K tokens', 'Vision capabilities', 'Function calling', 'JSON mode', 'Low latency'],
        features_zh: ['上下文窗口：128K tokens', '视觉功能', '函数调用', 'JSON 模式', '低延迟'],
        status: 'active',
        seller_id: 'platform',
        seller_name: 'BloomX Platform',
        rating: 4.9,
        total_calls: 0,
        createdAt: 'TIMESTAMP',
        updatedAt: 'TIMESTAMP'
      },
      {
        name: 'Claude 3.5 Sonnet API',
        name_zh: 'Claude 3.5 Sonnet API',
        provider: 'Anthropic',
        model: 'claude-3-5-sonnet-20241022',
        category: 'chat',
        description: 'Anthropic\'s most intelligent model with superior reasoning',
        description_zh: 'Anthropic 最智能的模型，具有卓越的推理能力',
        price_per_1k_tokens: 0.003,
        input_price: 0.003,
        output_price: 0.015,
        currency: 'USD',
        features: ['Context window: 200K tokens', 'Superior reasoning', 'Code generation', 'Long context understanding', 'Safe and helpful'],
        features_zh: ['上下文窗口：200K tokens', '卓越推理能力', '代码生成', '长文本理解', '安全可靠'],
        status: 'active',
        seller_id: 'platform',
        seller_name: 'BloomX Platform',
        rating: 4.8,
        total_calls: 0,
        createdAt: 'TIMESTAMP',
        updatedAt: 'TIMESTAMP'
      },
      {
        name: 'Gemini 1.5 Pro API',
        name_zh: 'Gemini 1.5 Pro API',
        provider: 'Google',
        model: 'gemini-1.5-pro',
        category: 'chat',
        description: 'Google\'s multimodal AI with massive context window',
        description_zh: 'Google 的多模态 AI，拥有超大上下文窗口',
        price_per_1k_tokens: 0.00125,
        input_price: 0.00125,
        output_price: 0.005,
        currency: 'USD',
        features: ['Context window: 2M tokens', 'Multimodal capabilities', 'Video understanding', 'Code execution', 'Cost effective'],
        features_zh: ['上下文窗口：2M tokens', '多模态能力', '视频理解', '代码执行', '性价比高'],
        status: 'active',
        seller_id: 'platform',
        seller_name: 'BloomX Platform',
        rating: 4.7,
        total_calls: 0,
        createdAt: 'TIMESTAMP',
        updatedAt: 'TIMESTAMP'
      },
      {
        name: 'DALL-E 3 Image Generation',
        name_zh: 'DALL-E 3 图像生成',
        provider: 'OpenAI',
        model: 'dall-e-3',
        category: 'image',
        description: 'Generate high-quality images from text descriptions',
        description_zh: '从文本描述生成高质量图像',
        price_per_1k_tokens: 0.04,
        input_price: 0.04,
        output_price: 0.08,
        currency: 'USD',
        features: ['High resolution: 1024x1024', 'Natural language prompts', 'Style control', 'Safe content', 'Commercial use'],
        features_zh: ['高分辨率：1024x1024', '自然语言提示', '风格控制', '内容安全', '商业使用'],
        status: 'active',
        seller_id: 'platform',
        seller_name: 'BloomX Platform',
        rating: 4.6,
        total_calls: 0,
        createdAt: 'TIMESTAMP',
        updatedAt: 'TIMESTAMP'
      },
      {
        name: 'Whisper Speech-to-Text',
        name_zh: 'Whisper 语音转文字',
        provider: 'OpenAI',
        model: 'whisper-1',
        category: 'audio',
        description: 'Convert audio to text with high accuracy',
        description_zh: '高精度音频转文字',
        price_per_1k_tokens: 0.006,
        input_price: 0.006,
        output_price: 0,
        currency: 'USD',
        features: ['Multiple languages', 'High accuracy', 'Timestamps', 'Speaker diarization', 'Fast processing'],
        features_zh: ['多语言支持', '高准确度', '时间戳', '说话人识别', '快速处理'],
        status: 'active',
        seller_id: 'platform',
        seller_name: 'BloomX Platform',
        rating: 4.8,
        total_calls: 0,
        createdAt: 'TIMESTAMP',
        updatedAt: 'TIMESTAMP'
      }
    ];

    for (const product of products) {
      await addDocument('products', product);
      console.log(`  ✅ ${product.name}`);
    }

    console.log('\n✅ 生产环境数据初始化完成！');
    console.log('\n📊 已创建:');
    console.log(`  - ${packages.length} 个积分套餐`);
    console.log(`  - ${products.length} 个 API 产品`);
    console.log('\n🎉 数据库已准备就绪，可以开始使用！');

  } catch (error: any) {
    console.error('❌ 初始化失败:', error.message);
    throw error;
  }

  process.exit(0);
}

initProductionData().catch(console.error);
