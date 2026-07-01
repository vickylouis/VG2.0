import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0B0B",
          color: "#D4AF37",
          fontSize: 72,
          fontWeight: 700,
          borderRadius: 36,
          border: "4px solid #D4AF37",
        }}
      >
        V
      </div>
    ),
    { ...size }
  );
}
