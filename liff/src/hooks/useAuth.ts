import { useState, useEffect } from "react";
import { initLiff, getProfile, type LiffProfile } from "../lib/liff";
import {
  query,
  collection,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useTenantStore } from "../store/tenantStore";
import { MOCK_MODE } from "../config/mockMode";
import { useMockAuth } from "./useMockAuth";
import type { Tenant, TenantMember } from "../types";

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  profile: LiffProfile | null;
  appUserId: string | null;
  memberships: TenantMember[];
  currentMembership: TenantMember | null;
  isAdmin: boolean;
  error: string | null;
}

// 全局 LIFF ID（所有社區共用）
const GLOBAL_LIFF_ID = "2008889284-MuPboxSM"; // 請替換為您的實際 LIFF ID

export const useAuth = () => {
  // 如果是切版模式，直接返回假資料
  if (MOCK_MODE) {
    return useMockAuth();
  }

  const selectedTenant = useTenantStore((state) => state.selectedTenant);
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    profile: null,
    appUserId: null,
    memberships: [],
    currentMembership: null,
    isAdmin: false,
    error: null,
  });

  useEffect(() => {
    const authenticate = async () => {
      try {
        console.log("Starting authentication...");

        // 0. 從 URL 參數獲取 tenantId（如果有的話）
        const urlParams = new URLSearchParams(window.location.search);
        const urlTenantId = urlParams.get("tenantId");
        console.log("URL tenantId:", urlTenantId);

        // 1. 初始化 LIFF（使用全局 LIFF ID）
        await initLiff(GLOBAL_LIFF_ID);
        console.log("LIFF initialized");

        // 2. 獲取 Line 用戶管理資訊
        const profile = await getProfile();
        console.log("Profile:", profile);

        // 3. 查詢或創建 appUser 記錄
        const appUsersQuery = query(
          collection(db, "line_users"),
          where("lineUserId", "==", profile.userId),
        );

        const appUsersSnap = await getDocs(appUsersQuery);

        let appUserId: string;

        if (appUsersSnap.empty) {
          // 創建新的 appUser 記錄（首次使用）
          const newUserData: any = {
            lineUserId: profile.userId,
            lineDisplayName: profile.displayName,
            linePictureUrl: profile.pictureUrl || null, // 防止 undefined 值
            name: profile.displayName,
            email: profile.email || null,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          };

          if (urlTenantId) {
            newUserData.joinedFromTenantId = urlTenantId;
            newUserData.lastAccessTenantId = urlTenantId;
          }

          const docRef = await addDoc(
            collection(db, "line_users"),
            newUserData,
          );
          appUserId = docRef.id;
          console.log("Created new appUser:", appUserId);
        } else {
          appUserId = appUsersSnap.docs[0].id;
          // 更新 LINE 資訊和最後登入時間
          const updateData: any = {
            lineDisplayName: profile.displayName,
            linePictureUrl: profile.pictureUrl || null, // 防止 undefined 值
            lastLoginAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          if (urlTenantId) {
            updateData.lastAccessTenantId = urlTenantId;
          }

          await updateDoc(doc(db, "line_users", appUserId), updateData);
          console.log("Updated appUser:", appUserId);
        }

        // 4. 獲取成員資格

        // 如果 URL 有 tenantId，確保用戶是該社區成員
        if (urlTenantId) {
          const memberQuery = query(
            collection(db, "tenants", urlTenantId, "members"),
            where("appUserId", "==", appUserId),
          );
          const memberSnap = await getDocs(memberQuery);

          if (memberSnap.empty) {
            console.log(`Auto-adding user to URL tenant: ${urlTenantId}`);
            await addDoc(collection(db, "tenants", urlTenantId, "members"), {
              appUserId,
              role: "MEMBER",
              status: "APPROVED",
              approvedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          } else {
            const memberData = memberSnap.docs[0].data();
            if (memberData.status !== "APPROVED") {
              console.log(
                `User member status in ${urlTenantId} is ${memberData.status}, auto-approving...`,
              );
              await updateDoc(
                doc(
                  db,
                  "tenants",
                  urlTenantId,
                  "members",
                  memberSnap.docs[0].id,
                ),
                {
                  status: "APPROVED",
                  approvedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              );
            }
          }
        }

        // 查詢用戶所屬的所有社區（APPROVED 狀態）
        const allMemberships: TenantMember[] = [];
        const tenantsSnap = await getDocs(collection(db, "tenants"));

        for (const tenantDoc of tenantsSnap.docs) {
          const memberQuery = query(
            collection(db, "tenants", tenantDoc.id, "members"),
            where("appUserId", "==", appUserId),
            where("status", "==", "APPROVED"),
          );
          const memberSnap = await getDocs(memberQuery);

          if (!memberSnap.empty) {
            const memberData = memberSnap.docs[0].data();
            const tenant = { id: tenantDoc.id, ...tenantDoc.data() } as Tenant;

            allMemberships.push({
              id: memberSnap.docs[0].id,
              tenantId: tenantDoc.id,
              ...memberData,
              tenant,
            } as TenantMember);
          }
        }

        console.log("Found APPROVED memberships:", allMemberships.length);

        // 5. 如果還是沒有成員資格，嘗試通過 LINE API 驗證用戶是哪個社區的好友
        if (allMemberships.length === 0) {
          console.log(
            "No memberships found. Verifying user through LINE API...",
          );

          let matchedTenants: string[] = [];

          try {
            const { httpsCallable } = await import("firebase/functions");
            const { functions } = await import("../config/firebase");
            const verifyUserTenant = httpsCallable(
              functions,
              "verifyUserTenant",
            );

            const result: any = await verifyUserTenant({
              lineUserId: profile.userId,
            });
            matchedTenants = result.data?.matchedTenants || [];

            console.log("Matched tenants from LINE API:", matchedTenants);
          } catch (error: any) {
            console.error("Error verifying user tenant:", error);
          }

          for (const tenantId of matchedTenants) {
            // 再次檢查並添加
            const tenantDocSnap = await getDoc(doc(db, "tenants", tenantId));
            if (tenantDocSnap.exists()) {
              await addDoc(collection(db, "tenants", tenantId, "members"), {
                appUserId,
                role: "MEMBER",
                status: "APPROVED",
                approvedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });

              const tenantData = tenantDocSnap.data();
              allMemberships.push({
                tenantId,
                appUserId,
                role: "MEMBER",
                status: "APPROVED",
                tenant: { id: tenantId, ...tenantData } as Tenant,
              } as any);
            }
          }
        }

        // 6. 確定當前角色
        let currentMembership: TenantMember | null = null;
        let isAdmin = false;

        if (selectedTenant) {
          currentMembership =
            allMemberships.find((m) => m.tenantId === selectedTenant.id) ||
            null;
          isAdmin = currentMembership?.role === "ADMIN";
        }

        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          profile,
          appUserId,
          memberships: allMemberships,
          currentMembership,
          isAdmin,
          error: null,
        });
      } catch (error: any) {
        console.error("Authentication error:", error);

        let errorMessage = "身份驗證失敗";
        if (error.message?.includes("LIFF ID")) {
          errorMessage = "LIFF ID 配置錯誤，請聯繫管理員";
        } else if (error.message?.includes("network")) {
          errorMessage = "網路連接失敗，請檢查網路";
        } else if (error.message?.includes("permission")) {
          errorMessage = "權限不足，請確認已授權 LINE 登入";
        } else if (error.message) {
          errorMessage = error.message;
        }

        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          profile: null,
          appUserId: null,
          memberships: [],
          currentMembership: null,
          isAdmin: false,
          error: errorMessage,
        });
      }
    };

    authenticate();
  }, [selectedTenant]);

  return { ...authState, tenant: selectedTenant };
};
