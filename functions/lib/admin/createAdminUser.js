"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminUser = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
exports.createAdminUser = (0, https_1.onRequest)({
    cors: true,
    timeoutSeconds: 60,
    memory: '256MiB',
}, async (req, res) => {
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
    const { email, password, name, role } = req.body;
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
        }
        catch (error) {
            if (error.code === 'auth/user-not-found') {
                // 2. 在 Firebase Auth 創建用戶
                console.log('Creating user in Firebase Auth...');
                firebaseUser = await auth.createUser({
                    email: email,
                    password: password,
                    displayName: name,
                });
                console.log(`User created in Firebase Auth, UID: ${firebaseUser.uid}`);
            }
            else {
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
    }
    catch (error) {
        console.error('Error creating admin user:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create admin user',
        });
    }
});
//# sourceMappingURL=createAdminUser.js.map