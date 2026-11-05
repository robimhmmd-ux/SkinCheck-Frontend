import Image from "next/image";
import { Sparkles, ShieldCheck } from "lucide-react";

export default function AuthVisual({ title, text }) {
  return (
    <div className="auth-visual-side-panel">
      <div className="auth-portrait-arch">
        <Image 
          src="/hero-face.png" 
          alt="Ilustrasi Wajah Sehat" 
          width={440} 
          height={520} 
          className="auth-portrait-image"
          priority 
        />
        <div className="auth-portrait-badge">
          <Sparkles size={14} /> Dermatologically Guided AI
        </div>
      </div>
      <div className="auth-visual-copy">
        <h2 className="auth-visual-heading">{title}</h2>
        <p className="auth-visual-subtext">{text}</p>
      </div>
    </div>
  );
}
