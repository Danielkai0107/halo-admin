/**
 * 清空 Firestore 所有集合資料腳本
 * 
 * 使用方法：
 * 1. 確保已安裝 firebase-admin: npm install firebase-admin
 * 2. 設置環境變數或下載服務帳戶金鑰
 * 3. 執行: node scripts/clear-firestore.js
 * 
 * 警告：此腳本會刪除所有資料，請謹慎使用！
 */

const admin = require('firebase-admin');

// 初始化 Firebase Admin（使用環境變數或服務帳戶金鑰）
// 如果在 Cloud Functions 環境中，會自動初始化
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// 需要清空的集合列表
const collectionsToDelete = [
  // 新的集合名稱
  'line_users',           // 原 appUsers → line_users
  'app_users',            // 原 mapAppUsers → app_users
  'appUserNotificationPoints', // 原 mapUserNotificationPoints → appUserNotificationPoints
  'admin_users',          // 原 users → admin_users
  'uuids',                // 原 beacon_uuids → uuids
  
  // 舊的集合名稱（也一併清空，確保完全移除舊資料）
  'appUsers',
  'mapAppUsers', 
  'mapUserNotificationPoints',
  'users',
  'beacon_uuids',
  
  // 其他集合
  'tenants',
  'elders',
  'devices',
  'gateways',
  'alerts',
  'anonymousActivities',
  'error_logs',
  'latest_locations',
];

// 需要清空子集合的父集合
const collectionsWithSubcollections = {
  'tenants': ['members'],
  'devices': ['activities'],
};

async function deleteCollection(collectionPath) {
  console.log(`正在刪除集合: ${collectionPath}`);
  
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.limit(500);
  
  let deleted = 0;
  
  while (true) {
    const snapshot = await query.get();
    
    if (snapshot.size === 0) {
      break;
    }
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    deleted += snapshot.size;
    
    console.log(`  已刪除 ${deleted} 筆文件...`);
  }
  
  console.log(`✓ 集合 ${collectionPath} 已清空 (共 ${deleted} 筆)`);
  return deleted;
}

async function deleteSubcollections(parentCollection, subcollections) {
  console.log(`\n正在處理 ${parentCollection} 的子集合...`);
  
  const parentDocs = await db.collection(parentCollection).get();
  
  for (const parentDoc of parentDocs.docs) {
    for (const subName of subcollections) {
      const subPath = `${parentCollection}/${parentDoc.id}/${subName}`;
      await deleteCollection(subPath);
    }
  }
}

async function clearAllData() {
  console.log('========================================');
  console.log('開始清空 Firestore 資料');
  console.log('警告：所有資料將被永久刪除！');
  console.log('========================================\n');
  
  let totalDeleted = 0;
  
  try {
    // 1. 先刪除有子集合的集合的子集合
    for (const [parent, subs] of Object.entries(collectionsWithSubcollections)) {
      await deleteSubcollections(parent, subs);
    }
    
    // 2. 刪除所有主集合
    for (const collectionName of collectionsToDelete) {
      const count = await deleteCollection(collectionName);
      totalDeleted += count;
    }
    
    console.log('\n========================================');
    console.log(`✓ 清空完成！共刪除 ${totalDeleted} 筆文件`);
    console.log('========================================');
    
  } catch (error) {
    console.error('清空資料時發生錯誤:', error);
    process.exit(1);
  }
}

// 執行
clearAllData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
