import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <main className="px-4 py-4">
        {children}
      </main>
    </div>
  );
};
