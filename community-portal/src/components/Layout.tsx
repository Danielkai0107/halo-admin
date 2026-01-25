import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Smartphone,
  Bell,
  MapPin,
  LogOut,
  Menu,
  X,
  Building2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const { user, tenant } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
    } catch (error) {
      console.error("登出失敗:", error);
    }
  };

  const navigationItems = [
    { path: "/dashboard", label: "社區概況", icon: LayoutDashboard },
    { path: "/elders", label: "長者管理", icon: Users },
    { path: "/devices", label: "設備清單", icon: Smartphone },
    { path: "/notification-logs", label: "通知記錄", icon: Bell },
    { path: "/notification-points", label: "通知點", icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部欄 */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          {/* 左側：選單按鈕 + 標題 */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            <div className="flex items-center space-x-2">
              <Building2 className="w-6 h-6 text-primary-600" />
              <h1 className="text-xl font-bold text-gray-900">社區管理後台</h1>
            </div>
          </div>

          {/* 右側：社區名稱 + 用戶資訊 */}
          <div className="flex items-center space-x-4">
            {tenant && (
              <div className="hidden sm:block text-sm">
                <p className="text-gray-500">社區</p>
                <p className="font-medium text-gray-900">{tenant.name}</p>
              </div>
            )}

            {user && (
              <div className="flex items-center space-x-3">
                <div className="hidden md:block text-sm">
                  <p className="text-gray-500">
                    {user.role === "ADMIN" ? "管理員" : "成員"}
                  </p>
                  <p className="font-medium text-gray-900">{user.name}</p>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">登出</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 側邊欄 */}
      <aside
        className={`
          fixed top-14 left-0 bottom-0 w-64 bg-white shadow-lg z-20 transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <nav className="p-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary-50 text-primary-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* 遮罩層 (手機版) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 主內容區 */}
      <main className="pt-14 lg:pl-64">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};
