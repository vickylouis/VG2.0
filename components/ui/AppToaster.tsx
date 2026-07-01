"use client";

import { Toaster } from "sonner";

export default function AppToaster() {
  return (
    <Toaster
      theme="dark"
      position="top-right"
      closeButton
      toastOptions={{
        style: {
          background: "#171717",
          border: "1px solid rgba(212, 175, 55, 0.25)",
          color: "#F5F5F5",
        },
        classNames: {
          description: "text-[#A3A3A3]",
          success: "!border-[#22C55E]/40",
          error: "!border-[#EF4444]/40",
        },
      }}
    />
  );
}
