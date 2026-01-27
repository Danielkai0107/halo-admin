import { ReactNode, useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  titleBadge?: ReactNode;
  children: ReactNode;
}

export const Modal = ({ isOpen, onClose, title, titleBadge, children }: ModalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    
    const deltaY = e.touches[0].clientY - startYRef.current;
    if (deltaY > 0) {
      containerRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    
    const deltaY = e.changedTouches[0].clientY - startYRef.current;
    if (deltaY > 100) {
      onClose();
    } else {
      containerRef.current.style.transform = '';
    }
    isDraggingRef.current = false;
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay show" onClick={handleOverlayClick}>
      <div
        ref={containerRef}
        className="modal-container"
      >
        <div
          ref={dragHandleRef}
          className="modal-drag-handle"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        <div className="modal-content">
          {title && (
            <div className="modal-title-wrapper">
              <h2 className="modal-title">{title}</h2>
              {titleBadge && <div className="modal-title-badge">{titleBadge}</div>}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};
