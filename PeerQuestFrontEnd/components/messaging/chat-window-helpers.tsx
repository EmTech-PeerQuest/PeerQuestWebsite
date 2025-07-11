import React from "react";

// Messenger-style image preview (like Facebook Messenger)
export function MessengerImage({ url, filename }: { url: string, filename?: string }) {
  const [open, setOpen] = React.useState(false);
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) throw new Error("Network error");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || "image";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 500);
    } catch (err) {
      window.open(url, "_blank");
    }
  };
  return (
    <>
      <img
        src={url}
        alt={filename || "image"}
        style={{
          maxWidth: 180,
          maxHeight: 180,
          borderRadius: 12,
          border: "1px solid var(--tavern-gold)",
          objectFit: "cover",
          background: "#eee",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
          margin: 2,
          display: "block"
        }}
        onClick={() => setOpen(true)}
        title="Click to enlarge"
        onError={e => { e.currentTarget.style.display = 'none'; }}
      />
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.7)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out"
          }}
        >
          <img
            src={url}
            alt={filename || "image"}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: 16,
              boxShadow: "0 4px 32px rgba(0,0,0,0.25)",
              background: "#fff"
            }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={handleDownload}
            style={{
              position: "absolute",
              top: 24,
              right: 40,
              background: "var(--tavern-gold)",
              color: "var(--tavern-dark)",
              borderRadius: 6,
              padding: "8px 16px",
              fontWeight: 600,
              fontSize: 15,
              border: "1px solid var(--tavern-purple)",
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
              cursor: "pointer"
            }}
            title="Download image"
          >
            Download
          </button>
        </div>
      )}
      <div style={{ fontSize: 12, color: "var(--tavern-dark)", marginTop: 2, textAlign: "center", wordBreak: "break-all" }}>{filename}</div>
    </>
  );
}

// Messenger-style file download link
export function MessengerFile({ url, filename }: { url: string, filename?: string }) {
  const handleDownload = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) throw new Error("Network error");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || "file";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 500);
    } catch (err) {
      window.open(url, "_blank");
    }
  };
  return (
    <a
      href={url}
      className="underline font-medium hover:opacity-80"
      style={{ color: "var(--tavern-purple)", position: "relative", display: "inline-block", cursor: "pointer", wordBreak: "break-all" }}
      title="Click to download file"
      onClick={handleDownload}
      rel="noopener noreferrer"
    >
      {filename || 'Download'}
    </a>
  );
}
