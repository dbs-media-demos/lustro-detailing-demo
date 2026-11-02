import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.legalName}: car detailing, paint correction and ceramic coating`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share card: the mark, the name and the promise on studio black with one band of light. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#07080a", color: "#eef0f2", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", background: "linear-gradient(105deg, rgba(7,8,10,0) 40%, rgba(255,255,255,0.10) 52%, rgba(212,250,76,0.10) 55%, rgba(7,8,10,0) 66%)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 32 32">
            <rect x="1.5" y="1.5" width="29" height="29" rx="9" fill="#eef0f2" />
            <path d="M7 24.5 21.5 7.5h4L11 24.5z" fill="#d4fa4c" />
          </svg>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>{site.legalName}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 800, letterSpacing: -4, lineHeight: 1 }}>Like it just left</div>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 800, letterSpacing: -4, lineHeight: 1.05, color: "#d4fa4c" }}>the showroom.</div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 30, color: "#9aa2ab" }}>Hand wash · Paint correction · Ceramic coating · Dallas</div>
        </div>
      </div>
    ),
    size,
  );
}
