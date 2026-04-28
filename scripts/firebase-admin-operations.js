/**
 * Firebase Admin 数据库操作脚本
 * 直接使用 Admin SDK 操作 Firestore
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// 初始化 Firebase Admin
// 注意：需要下载 service account key 并放在项目根目录
// 文件名：serviceAccountKey.json
try {
  const serviceAccount = JSON.parse(
    readFileSync('./serviceAccountKey.json', 'utf8')
  );
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'bloomx-core-infra-26'
  });
  
  console.log('✅ Firebase Admin 初始化成功');
} catch (error) {
  console.error('❌ Firebase Admin 初始化失败:', error.message);
  console.log('\n请按照以下步骤获取 Service Account Key:');
  console.log('1. 访问: https://console.firebase.google.com/project/bloomx-core-infra-26/settings/serviceaccounts/adminsdk');
  console.log('2. 点击 "Generate new private key"');
  console.log('3. 下载 JSON 文件');
  console.log('4. 重命名为 serviceAccountKey.json');
  console.log('5. 放在项目根目录');
  process.exit(1);
}

const db = admin.firestore();

// ==================== 用户操作 ====================

/**
 * 创建用户
 */
export async function createUser(uid, email, role = 'buyer') {
  try {
    await db.collection('users').doc(uid).set({
      uid,
      email,
      role,
      credits_balance: 0,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ 用户创建成功: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ 用户创建失败:', error);
    return false;
  }
}

/**
 * 获取用户信息
 */
export async function getUser(uid) {
  try {
    const doc = await db.collection('users').doc(uid).get();
    if (doc.exists) {
      console.log('✅ 用户信息:', doc.data());
      return doc.data();
    } else {
      console.log('⚠️ 用户不存在');
      return null;
    }
  } catch (error) {
    console.error('❌ 获取用户失败:', error);
    return null;
  }
}

/**
 * 更新用户 Credits
 */
export async function updateUserCredits(uid, amount) {
  try {
    await db.collection('users').doc(uid).update({
      credits_balance: admin.firestore.FieldValue.increment(amount),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ Credits 更新成功: ${amount > 0 ? '+' : ''}${amount}`);
    return true;
  } catch (error) {
    console.error('❌ Credits 更新失败:', error);
    return false;
  }
}

/**
 * 列出所有用户
 */
export async function listUsers(limit = 10) {
  try {
    const snapshot = await db.collection('users').limit(limit).get();
    console.log(`\n📋 用户列表 (共 ${snapshot.size} 个):`);
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.email} (${data.role}) - Credits: ${data.credits_balance}`);
    });
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('❌ 列出用户失败:', error);
    return [];
  }
}

// ==================== API Key 操作 ====================

/**
 * 创建 API Key
 */
export async function createApiKey(uid, keyPrefix, keyHash) {
  try {
    const keyRef = db.collection('users').doc(uid).collection('api_keys').doc();
    await keyRef.set({
      id: keyRef.id,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      uid,
      is_active: true,
      last_used: null,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ API Key 创建成功: ${keyPrefix}`);
    return keyRef.id;
  } catch (error) {
    console.error('❌ API Key 创建失败:', error);
    return null;
  }
}

/**
 * 列出用户的 API Keys
 */
export async function listApiKeys(uid) {
  try {
    const snapshot = await db.collection('users').doc(uid).collection('api_keys').get();
    console.log(`\n🔑 API Keys (共 ${snapshot.size} 个):`);
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.key_prefix} (${data.is_active ? '启用' : '禁用'})`);
    });
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('❌ 列出 API Keys 失败:', error);
    return [];
  }
}

// ==================== Seller Application 操作 ====================

/**
 * 列出 Seller 申请
 */
export async function listSellerApplications(status = null) {
  try {
    let query = db.collection('seller_applications');
    if (status) {
      query = query.where('status', '==', status);
    }
    const snapshot = await query.get();
    console.log(`\n📝 Seller 申请 (共 ${snapshot.size} 个):`);
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.name} (${data.email}) - ${data.status}`);
    });
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('❌ 列出申请失败:', error);
    return [];
  }
}

/**
 * 审核 Seller 申请
 */
export async function reviewSellerApplication(applicationId, approved, reviewerId) {
  try {
    await db.collection('seller_applications').doc(applicationId).update({
      status: approved ? 'approved' : 'rejected',
      reviewed_by: reviewerId,
      reviewed_at: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ 申请审核成功: ${approved ? '通过' : '拒绝'}`);
    return true;
  } catch (error) {
    console.error('❌ 审核失败:', error);
    return false;
  }
}

// ==================== 统计操作 ====================

/**
 * 获取数据库统计
 */
export async function getStats() {
  try {
    const usersCount = (await db.collection('users').count().get()).data().count;
    const sellersCount = (await db.collection('seller_applications').count().get()).data().count;
    
    console.log('\n📊 数据库统计:');
    console.log(`  - 用户总数: ${usersCount}`);
    console.log(`  - Seller 申请: ${sellersCount}`);
    
    return { usersCount, sellersCount };
  } catch (error) {
    console.error('❌ 获取统计失败:', error);
    return null;
  }
}

// ==================== 主函数 ====================

async function main() {
  console.log('\n🔥 Firebase Admin 操作脚本\n');
  
  // 示例：获取统计
  await getStats();
  
  // 示例：列出用户
  await listUsers(5);
  
  // 示例：列出 Seller 申请
  await listSellerApplications();
  
  console.log('\n✅ 操作完成\n');
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().then(() => process.exit(0)).catch(error => {
    console.error('❌ 错误:', error);
    process.exit(1);
  });
}
