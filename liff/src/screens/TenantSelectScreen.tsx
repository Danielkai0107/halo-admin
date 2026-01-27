import { Building2, ChevronRight } from "lucide-react";
import type { Tenant, TenantMember } from "../types";

interface TenantSelectScreenProps {
  memberships: TenantMember[];
  onSelectTenant: (tenantId: string, tenant: Tenant) => void;
}

export const TenantSelectScreen = ({
  memberships,
  onSelectTenant,
}: TenantSelectScreenProps) => {
  if (memberships.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">尚未加入社區</h2>
          <p className="text-gray-600 text-sm mb-4">您目前還沒有加入任何社區</p>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800 text-left">
              <strong>如何加入社區？</strong>
              <br />
              1. 如果您已經加入了社區的 LINE OA，系統會自動將您加入社區
              <br />
              2. 如果仍未看到社區，請聯絡Line OA 管理員
              <br />
              3. 管理員會在後台「App 成員管理」中新增您為成員
              <br />
              4. 新增後即可使用本系統
              <br />
              <br />
              <strong>提示：</strong>請確認您已加入該社區的 LINE Official
              Account
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 如果只有一個社區，直接進入
  if (memberships.length === 1 && memberships[0].tenant) {
    onSelectTenant(memberships[0].tenantId, memberships[0].tenant);
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">選擇社區</h1>
          <p className="text-gray-600 text-sm">
            您共加入了 {memberships.length} 個社區
          </p>
        </div>

        <div className="space-y-3">
          {memberships.map((membership) => (
            <button
              key={membership.id}
              onClick={() =>
                membership.tenant &&
                onSelectTenant(membership.tenantId, membership.tenant)
              }
              className="w-full bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {membership.tenant?.name || "社區"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {membership.role === "ADMIN" ? "管理員" : "一般成員"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
