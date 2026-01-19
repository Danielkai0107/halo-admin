import { ReactNode } from 'react';
import { TabBar } from './TabBar';
import { useAuth } from '../hooks/useAuth';
import { useTenantStore } from '../store/tenantStore';
import { ArrowLeftRight } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { profile, isAdmin, memberships } = useAuth();
  const { selectedTenant, clearTenant } = useTenantStore();
  
  const handleChangeTenant = () => {
    if (memberships.length > 1) {
      clearTenant();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {profile?.pictureUrl && (
                <img
                  src={profile.pictureUrl}
                  alt={profile.displayName}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {selectedTenant?.name || '長者照護系統'}
                </h1>
                <p className="text-xs text-gray-500">
                  {profile?.displayName}
                  {isAdmin && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      管理員
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {memberships.length > 1 && (
                <button
                  onClick={handleChangeTenant}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  title="切換社區"
                >
                  <ArrowLeftRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="px-4 py-4">
        {children}
      </main>

      {/* Tab Bar */}
      <TabBar />
    </div>
  );
};
