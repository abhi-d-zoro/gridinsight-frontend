export default function Header({ title, onLogout }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        backgroundColor: "#1f2937",
        color: "white",
      }}
    >
      <h2 style={{ margin: 0 }}>{title}</h2>

      {onLogout && (
        <button
          onClick={onLogout}
          style={{
            padding: "8px 12px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      )}
    </div>
  );
}
