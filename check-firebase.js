// 快速检查 Firebase 配置
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 检查 Firebase 配置...\n');

// 1. 检查 .env 文件
try {
    const envPath = join(__dirname, '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    console.log('✅ .env 文件存在\n');
    console.log('📋 环境变量:');
    
    const requiredVars = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_STORAGE_BUCKET',
        'VITE_FIREBASE_MESSAGING_SENDER_ID',
        'VITE_FIREBASE_APP_ID'
    ];
    
    requiredVars.forEach(varName => {
        const line = lines.find(l => l.startsWith(varName));
        if (line) {
            const value = line.split('=')[1]?.trim();
            if (value && value !== 'your_api_key_here' && !value.startsWith('your_')) {
                console.log(`  ✅ ${varName}: 已配置`);
            } else {
                console.log(`  ❌ ${varName}: 未配置或使用默认值`);
            }
        } else {
            console.log(`  ❌ ${varName}: 缺失`);
        }
    });
    
    // 提取 PROJECT_ID
    const projectIdLine = lines.find(l => l.startsWith('VITE_FIREBASE_PROJECT_ID'));
    if (projectIdLine) {
        const projectId = projectIdLine.split('=')[1]?.trim();
        console.log(`\n🎯 Firebase Project ID: ${projectId}`);
        console.log(`\n📖 下一步操作:`);
        console.log(`1. 访问 Firebase Console: https://console.firebase.google.com/project/${projectId}/authentication/providers`);
        console.log(`2. 启用以下登录方式:`);
        console.log(`   - Email/Password`);
        console.log(`   - Google (可选)`);
        console.log(`   - Anonymous (可选)`);
        console.log(`3. 在 Settings 标签添加授权域名: localhost`);
        console.log(`\n4. 访问诊断页面测试: http://localhost:5173/diagnostic`);
    }
    
} catch (error) {
    console.log('❌ .env 文件不存在或无法读取');
    console.log('💡 请复制 .env.example 并填入 Firebase 配置');
}

console.log('\n' + '='.repeat(60));
