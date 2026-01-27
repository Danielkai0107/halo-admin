import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import haloLogo from "../assets/halo_logo.png";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMapPage = location.pathname === "/map";
  const isElderListPage = location.pathname === "/elders";
  
  // 決定是否顯示返回按鈕
  const showBackButton = !isMapPage && !isElderListPage;

  return (
    <div className="fixed inset-0 overflow-hidden bg-gray-50">
      {/* Navbar - 所有頁面都顯示 Logo 和返回按鈕 */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="flex items-center justify-between">
          {/* 左側：返回按鈕或佔位 */}
          <div className="w-10">
            {showBackButton && (
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-white border border-gray-300 flex items-center justify-center active:scale-95 transition shadow-sm"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
          
          {/* 中間：Logo */}
          <div className="flex-1 flex justify-center">
            <img src={haloLogo} alt="Halo Logo" className="h-8" />
          </div>

          {/* 右側：佔位保持平衡 */}
          <div className="w-10"></div>
        </div>
      </nav>

      {/* Content - 根據頁面類型決定滾動行為 */}
      <main
        className={`absolute inset-0 top-[57px] ${isMapPage ? "overflow-hidden" : "overflow-y-auto"}`}
      >
        {children}
      </main>
    </div>
  );
};
