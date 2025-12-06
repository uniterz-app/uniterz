// app/web/layout.tsx
"use client";

const MAINTENANCE = true;

export default function WebLayout({ children }: { children: React.ReactNode }) {
  if (MAINTENANCE) {
    return (
      <div
        style={{
          backgroundColor: "#000",
          color: "#fff",
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}>
            現在、大幅な仕様変更中です
          </h1>
          <p style={{ fontSize: "14px", opacity: 0.8, lineHeight: 1.6 }}>
            ご意見を受けて、より良いアプリにするため作業を進めています。
            <br />
            完了まで <strong>1週間ほど</strong> お時間をいただきます。
          </p>
          <p style={{ fontSize: "14px", opacity: 0.8, marginTop: "16px", lineHeight: 1.6 }}>
            少しだけ時間をください。
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
