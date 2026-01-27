/**
 * 建立 SaaS 用戶腳本
 *
 * 此腳本用於建立Line OA 管理網頁版的測試帳號
 *
 * 使用方法：
 * node create-saas-user.cjs <email> <password> <name> <tenantId>
 *
 * 範例：
 * node create-saas-user.cjs admin@test.com test123456 "測試管理員" tenant_001
 */

const admin = require("firebase-admin");

// 初始化 Firebase Admin SDK
const serviceAccount = require("./service-account-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

async function createSaasUser(email, password, name, tenantId, phone = null) {
  try {
    console.log("\n========================================");
    console.log("建立 SaaS 用戶");
    console.log("========================================\n");

    // 1. 檢查社區是否存在
    console.log(`步驟 1/3: 檢查社區 ${tenantId} 是否存在...`);
    const tenantDoc = await db.collection("tenants").doc(tenantId).get();

    if (!tenantDoc.exists) {
      console.error(`❌ 錯誤：社區 ${tenantId} 不存在`);
      console.log("\n可用的社區列表：");
      const tenantsSnapshot = await db.collection("tenants").get();
      if (tenantsSnapshot.empty) {
        console.log("  （沒有任何社區）");
        console.log("\n請先在 Firestore Console 建立社區記錄");
      } else {
        tenantsSnapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`  - ID: ${doc.id}, 名稱: ${data.name}`);
        });
      }
      process.exit(1);
    }

    const tenantData = tenantDoc.data();
    console.log(`✅ 社區找到: ${tenantData.name}`);

    // 2. 在 Firebase Auth 建立用戶
    console.log(`\n步驟 2/3: 在 Firebase Auth 建立用戶 ${email}...`);

    let userRecord;
    try {
      // 檢查用戶是否已存在
      userRecord = await auth.getUserByEmail(email);
      console.log(`⚠️  用戶已存在，UID: ${userRecord.uid}`);

      // 詢問是否更新密碼
      console.log("將使用現有用戶並更新其資料");

      // 更新密碼
      await auth.updateUser(userRecord.uid, {
        password: password,
        displayName: name,
      });
      console.log("✅ 已更新用戶密碼");
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        // 用戶不存在，建立新用戶
        userRecord = await auth.createUser({
          email: email,
          password: password,
          displayName: name,
        });
        console.log(`✅ Firebase Auth 用戶建立成功，UID: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }

    // 3. 在 Firestore 建立 saas_users 記錄
    console.log(`\n步驟 3/3: 在 Firestore 建立 saas_users 記錄...`);

    const saasUserData = {
      firebaseUid: userRecord.uid,
      email: email,
      name: name,
      phone: phone,
      avatar: null,
      tenantId: tenantId,
      role: "ADMIN", // 預設為管理員
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // 使用 Firebase UID 作為文件 ID
    await db.collection("saas_users").doc(userRecord.uid).set(saasUserData);
    console.log("✅ saas_users 記錄建立成功");

    // 完成
    console.log("\n========================================");
    console.log("✅ SaaS 用戶建立完成！");
    console.log("========================================");
    console.log("\n登入資訊：");
    console.log(`  Email: ${email}`);
    console.log(`  密碼: ${password}`);
    console.log(`  姓名: ${name}`);
    console.log(`  社區: ${tenantData.name} (${tenantId})`);
    console.log(`  角色: 管理員 (ADMIN)`);
    console.log(`  Firebase UID: ${userRecord.uid}`);
    console.log("\n登入 URL:");
    console.log("  開發環境: http://localhost:3002/community/login");
    console.log("  生產環境: https://safe-net-tw.web.app/community/login");
    console.log("\n");
  } catch (error) {
    console.error("\n❌ 建立用戶失敗：", error.message);
    console.error(error);
    process.exit(1);
  }
}

// 從命令列參數讀取
const args = process.argv.slice(2);

if (args.length < 4) {
  console.log("\n使用方法：");
  console.log(
    "  node create-saas-user.cjs <email> <password> <name> <tenantId> [phone]",
  );
  console.log("\n範例：");
  console.log(
    '  node create-saas-user.cjs admin@test.com test123456 "測試管理員" tenant_001',
  );
  console.log(
    '  node create-saas-user.cjs admin@test.com test123456 "測試管理員" tenant_001 0912345678',
  );
  console.log("\n");
  process.exit(1);
}

const [email, password, name, tenantId, phone] = args;

createSaasUser(email, password, name, tenantId, phone)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
