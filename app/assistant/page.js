"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";

export default function AssistantPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-laomera-chat"));
      window.dispatchEvent(new CustomEvent("open-skincheck-chat"));
    }
    router.replace("/dashboard?openChat=1");
  }, [router]);

  return (
    <div className="content-canvas" style={{ padding: "80px 0", textAlign: "center" }}>
      <Bot size={36} color="var(--brand-amber)" style={{ margin: "0 auto 12px" }} className="animate-pulse" />
      <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>Membuka Laomera Asisten…</p>
    </div>
  );
}
