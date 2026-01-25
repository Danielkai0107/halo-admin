import { useEffect, useState } from "react";
import { X, Shield, Trash2, RefreshCw } from "lucide-react";
import { tenantService } from "../services/tenantService";

interface AppMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantName: string;
}

export const AppMembersModal = ({
  isOpen,
  onClose,
  tenantId,
  tenantName,
}: AppMembersModalProps) => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && tenantId) {
      loadMembers();
    }
  }, [isOpen, tenantId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      console.log("Loading members for tenant:", tenantId);
      const response: any = await tenantService.getAppMembers(tenantId);
      console.log("Members response:", response);
      // response 結構是 { data: members[] }
      setMembers(response.data || []);
    } catch (error) {
      console.error("Failed to load app members:", error);
      alert("載入成員失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (
    memberId: string,
    currentRole: string,
    memberName: string,
    appUserId: string,
  ) => {
    const newRole = currentRole === "ADMIN" ? "MEMBER" : "ADMIN";
    const action = newRole === "ADMIN" ? "設為管理員" : "取消管理員";

    if (!confirm(`確定要將「${memberName}」${action}嗎？`)) return;

    try {
      // 如果是虛擬記錄（還沒有在 members 集合中），先創建真實的 member 記錄
      if (memberId.startsWith("virtual_")) {
        await tenantService.addMember(tenantId, appUserId, newRole);
        alert(`已${action}`);
        loadMembers();
      } else {
        // 如果是真實的 member 記錄，直接更新角色
        await tenantService.setMemberRole(tenantId, memberId, newRole);
        alert(`已${action}`);
        loadMembers();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "操作失敗");
    }
  };

  const handleRemoveMember = async (
    memberId: string,
    memberName: string,
    appUserId: string,
  ) => {
    if (!confirm(`確定要移除「${memberName}」嗎？此操作無法復原。`)) return;

    try {
      // 如果是虛擬記錄（還沒有在 members 集合中），只需要從 appUsers 中移除 joinedFromTenantId
      if (memberId.startsWith("virtual_")) {
        const { updateDocument } = await import("../lib/firestore");
        await updateDocument("line_users", appUserId, {
          joinedFromTenantId: null,
        });
        alert("已移除成員");
        loadMembers();
      } else {
        // 如果是真實的 member 記錄，從 members 集合中刪除
        await tenantService.removeMember(tenantId, memberId);
        alert("已移除成員");
        loadMembers();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "移除失敗");
    }
  };

  if (!isOpen) return null;

  const getRoleBadge = (role: string) => {
    return role === "ADMIN" ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center space-x-1">
        <Shield className="w-3 h-3" />
        <span>管理員</span>
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        一般成員
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">App 成員管理</h2>
            <p className="text-sm text-gray-500 mt-1">{tenantName}</p>
            <p className="text-xs text-gray-400 mt-1">
              成員列表從 LINE OA 自動同步，可設定管理員權限
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadMembers}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg disabled:opacity-50"
              title="重新從 LINE 載入成員"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span>重新整理</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {loading ? (
            <div className="text-center py-8">載入中...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暫無 App 成員</div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {/* LINE 頭像 */}
                      {member.appUser?.linePictureUrl ? (
                        <img
                          src={member.appUser.linePictureUrl}
                          alt={
                            member.appUser?.lineDisplayName ||
                            member.appUser?.name
                          }
                          className="w-12 h-12 rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold flex-shrink-0">
                          {member.appUser?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">
                            {member.appUser?.name}
                          </h3>
                          {member.appUser?.lineDisplayName &&
                            member.appUser.lineDisplayName !==
                              member.appUser.name && (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                LINE: {member.appUser.lineDisplayName}
                              </span>
                            )}
                          {getRoleBadge(member.role || "MEMBER")}
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Email: {member.appUser?.email}</div>
                          {member.appUser?.phone && (
                            <div>電話: {member.appUser.phone}</div>
                          )}
                          {member.appUser?.lineUserId && (
                            <div className="flex items-center space-x-2">
                              <span>LINE ID:</span>
                              <code className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-mono">
                                {member.appUser.lineUserId.substring(0, 16)}...
                              </code>
                            </div>
                          )}
                          {member.createdAt && (
                            <div>
                              加入時間:{" "}
                              {member.createdAt.toDate
                                ? new Date(
                                    member.createdAt.toDate(),
                                  ).toLocaleString("zh-TW")
                                : new Date(member.createdAt).toLocaleString(
                                    "zh-TW",
                                  )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* 顯示管理員切換按鈕 */}
                      <button
                        onClick={() =>
                          handleToggleRole(
                            member.id,
                            member.role || "MEMBER",
                            member.appUser?.name || "",
                            member.appUserId,
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                          (member.role || "MEMBER") === "ADMIN"
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                        title={
                          (member.role || "MEMBER") === "ADMIN"
                            ? "取消管理員"
                            : "設為管理員"
                        }
                      >
                        {(member.role || "MEMBER") === "ADMIN"
                          ? "取消管理員"
                          : "設為管理員"}
                      </button>
                      <button
                        onClick={() =>
                          handleRemoveMember(
                            member.id,
                            member.appUser?.name || "",
                            member.appUserId,
                          )
                        }
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="移除成員"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="btn-secondary">
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
