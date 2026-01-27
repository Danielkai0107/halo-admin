import { ReactNode } from 'react';

interface BottomSheetProps {
  children: ReactNode;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

export const BottomSheet = ({ 
  children, 
  isExpanded = false, 
  onToggle,
}: BottomSheetProps) => {
  const handleBackdropClick = () => {
    if (isExpanded && onToggle) {
      onToggle(false);
    }
  };

  return (
    <>
      {/* 背景遮罩 - 只在展開時顯示 */}
      {isExpanded && (
        <div 
          className="bottom-sheet-backdrop show"
          onClick={handleBackdropClick}
        />
      )}
      
      {/* 底部彈窗 */}
      <div className={`bottom-sheet ${isExpanded ? 'expanded' : ''}`}>
        {children}
      </div>
    </>
  );
};
