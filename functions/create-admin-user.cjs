/**
 * 創建 Admin 用戶腳本
 * 
 * 使用方式：
 * cd functions && node ../scripts/create-admin-user.js
 * 
 * 此腳本會：
 * 1. 在 Firebase Auth 創建用戶
 * 2. 在 Firestore admin_users collection 創建對應記錄
 */

const admin = require('firebase-admin');

// 初始化 Firebase Admin（使用預設憑證）
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'safe-net-tw',
  });
}

const auth = admin.auth();
const db = admin.firestore();

// ========================================
// 設定要創建的用戶資料
// ========================================
const userData = {
  email: 'admin@test.com',
  password: '123456',
  name: '超級管理員',
  role: 'SUPER_ADMIN',  // SUPER_ADMIN | TENANT_ADMIN | STAFF
};

async function createAdminUser() {
  console.log('========================================');
  console.log('創建 Admin 用戶');
  console.log('========================================\n');
  console.log('用戶資料：');
  console.log(`  Email: ${userData.email}`);
  console.log(`  姓名: ${userData.name}`);
  console.log(`  角色: ${userData.role}`);
  console.log('');

  try {
    // 1. 檢查用戶是否已存在
    let firebaseUser;
    try {
      firebaseUser = await auth.getUserByEmail(userData.email);
      console.log(`⚠️  用戶 ${userData.email} 已存在於 Firebase Auth`);
      console.log(`   UID: ${firebaseUser.uid}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // 2. 在 Firebase Auth 創建用戶
        console.log('1. 在 Firebase Auth 創建用戶...');
        firebaseUser = await auth.createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.name,
        });
        console.log(`   ✓ 創建成功，UID: ${firebaseUser.uid}`);
      } else {
        throw error;
      }
    }

    // 3. 檢查 Firestore 中是否已有記錄
    const existingDoc = await db.collection('admin_users').doc(firebaseUser.uid).get();
    
    if (existingDoc.exists) {
      console.log('\n⚠️  Firestore admin_users 中已存在此用戶記錄');
      console.log('   是否要更新？（當前腳本會跳過）');
    } else {
      // 4. 在 Firestore 創建用戶記錄
      console.log('\n2. 在 Firestore admin_users 創建記錄...');
      const now = new Date().toISOString();
      await db.collection('admin_users').doc(firebaseUser.uid).set({
        email: userData.email,
        name: userData.name,
        role: userData.role,
        tenantId: null,
        phone: null,
        avatar: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      console.log('   ✓ Firestore 記錄創建成功');
    }

    console.log('\n========================================');
    console.log('✓ 用戶創建完成！');
    console.log('========================================');
    console.log(`\n登入資訊：`);
    console.log(`  Email: ${userData.email}`);
    console.log(`  Password: ${userData.password}`);
    console.log(`  UID: ${firebaseUser.uid}`);

  } catch (error) {
    console.error('\n❌ 創建失敗：', error.message);
    process.exit(1);
  }

  process.exit(0);
}

// 執行
createAdminUser();
