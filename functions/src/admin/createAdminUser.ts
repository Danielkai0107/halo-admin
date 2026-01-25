import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';

/**
 * 創建 Admin 用戶 API
 * 
 * 調用方式：
 * POST https://createadminuser-xxxxx.a.run.app
 * Header: x-admin-key: CREATE_ADMIN_2024
 * Body: {
 *   "email": "admin@test.com",
 *   "password": "123456",
 *   "name": "超級管理員",
 *   "role": "SUPER_ADMIN"
 * }
 */

interface CreateAdminUserRequest {
  email: string;
  password: string;
  name: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'STAFF';
}

export const createAdminUser = onRequest(
  {
    cors: true,
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (req, res) => {
    // 僅允許 POST 請求
    if (req.method !== 'POST') {
      res.status(405).json({
        success: false,
        error: 'Method not allowed. Use POST.',
      });
      return;
    }

    // 安全檢查
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== 'CREATE_ADMIN_2024') {
      res.status(401).json({
        success: false,
        error: 'Unauthorized. Please provide valid x-admin-key header.',
      });
      return;
    }

    const { email, password, name, role } = req.body as CreateAdminUserRequest;

    // 驗證必填欄位
    if (!email || !password || !name || !role) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: email, password, name, role',
      });
      return;
    }

    // 驗證角色
    const validRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
      return;
    }

    console.log('Creating admin user:', { email, name, role });

    try {
      const auth = admin.auth();
      const db = admin.firestore();

      // 1. 檢查用戶是否已存在
      let firebaseUser;
      let userExists = false;

      try {
        firebaseUser = await auth.getUserByEmail(email);
        userExists = true;
        console.log(`User ${email} already exists in Firebase Auth, UID: ${firebaseUser.uid}`);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          // 2. 在 Firebase Auth 創建用戶
          console.log('Creating user in Firebase Auth...');
          firebaseUser = await auth.createUser({
            email: email,
            password: password,
            displayName: name,
          });
          console.log(`User created in Firebase Auth, UID: ${firebaseUser.uid}`);
        } else {
          throw error;
        }
      }

      // 3. 檢查/創建 Firestore 記錄
      const existingDoc = await db.collection('admin_users').doc(firebaseUser.uid).get();
      let firestoreCreated = false;

      if (!existingDoc.exists) {
        // 4. 在 Firestore 創建用戶記錄
        console.log('Creating user record in Firestore...');
        const now = new Date().toISOString();
        await db.collection('admin_users').doc(firebaseUser.uid).set({
          email: email,
          name: name,
          role: role,
          tenantId: null,
          phone: null,
          avatar: null,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        firestoreCreated = true;
        console.log('Firestore record created');
      }

      res.json({
        success: true,
        message: userExists ? 'User already existed, Firestore record updated' : 'User created successfully',
        user: {
          uid: firebaseUser.uid,
          email: email,
          name: name,
          role: role,
        },
        details: {
          authUserExisted: userExists,
          firestoreRecordCreated: firestoreCreated,
        },
      });

    } catch (error: any) {
      console.error('Error creating admin user:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create admin user',
      });
    }
  }
);
