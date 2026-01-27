interface FullScreenLoadingProps {
  isOpen: boolean;
  message?: string;
}

export const FullScreenLoading = ({ isOpen, message = "處理中..." }: FullScreenLoadingProps) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "32px 48px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
        }}
      >
        {/* Loading Spinner */}
        <div
          style={{
            width: "50px",
            height: "50px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #4ECDC4",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        
        {/* Loading Message */}
        <div
          style={{
            fontSize: "16px",
            fontWeight: "500",
            color: "#2c3e50",
            textAlign: "center",
          }}
        >
          {message}
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};
