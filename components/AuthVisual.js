import Image from "next/image";

// Panel visual di sisi kiri layar split auth: potret arch + judul serif besar.
export default function AuthVisual({ title, text }) {
  return (
    <div className="gx-auth-visual">
      <div className="gx-arch-img">
        <Image src="/hero-face.png" alt="Ilustrasi wajah" width={480} height={600} />
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
