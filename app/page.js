"use client";
import { useEffect, useState } from "react";
import {
  Camera,
  Bot,
  HeartPulse,
  Activity,
  Droplets,
  Sun,
  Flame,
  Zap,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import FeedbackModal from "../components/FeedbackModal";
import CinematicOrbitStage from "../components/CinematicOrbitStage";

const ORBIT_NODES = [
  {
    id: "node-1",
    title: "FULL-STACK INNOVATION",
    subtitle: "Hardware + AI-powered software",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="4.5" r="2.8" />
        <circle cx="4.5" cy="12" r="2.8" />
        <circle cx="19.5" cy="12" r="2.8" />
        <circle cx="12" cy="19.5" r="2.8" />
      </svg>
    ),
  },
  {
    id: "node-2",
    title: "DAILY RITUAL REIMAGINED",
    subtitle: "Save time, unlock pro-level results",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <rect x="4.5" y="7" width="3.5" height="10" rx="1.75" />
        <rect x="10.25" y="4" width="3.5" height="16" rx="1.75" />
        <rect x="16" y="7" width="3.5" height="10" rx="1.75" />
      </svg>
    ),
  },
  {
    id: "node-3",
    title: "BEAUTY + TECH",
    subtitle: "Premium industrial design meets personalization",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3.5 2.5" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    id: "node-4",
    title: "SAFE & EFFORTLESS",
    subtitle: "Designed for the face, built with care",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2.5L13.5 7.5L18.5 6L16.5 10.5L21.5 12L16.5 13.5L18.5 18L13.5 16.5L12 21.5L10.5 16.5L5.5 18L7.5 13.5L2.5 12L7.5 10.5L5.5 6L10.5 7.5Z" />
      </svg>
    ),
  },
];

const HISTORICAL_CARDS = [
  {
    id: "hist-1",
    era: "PRASEJARAH",
    title: "Pigmen Ochre Alami",
    desc: "Perlindungan kulit mineral tertua",
    img: "/history/1-indigenous.jpg",
    cardClass: "vision-card-1",
  },
  {
    id: "hist-2",
    era: "MESIR KUNO",
    title: "Kohl & Minyak Teratai",
    desc: "Simbol keagungan dan pelindung mata dari debu gurun",
    img: "/history/2-egyptian.jpg",
    cardClass: "vision-card-2",
  },
  {
    id: "hist-3",
    era: "UPACARA TRADISI",
    title: "Tanah Liat & Skinguard",
    desc: "Perlindungan mikrobiom berbasis lempung putih kaolin",
    img: "/history/3-tribal.jpg",
    cardClass: "vision-card-3",
  },
  {
    id: "hist-4",
    era: "RENAISANS",
    title: "Air Mawar & Cermin Kaca",
    desc: "Awal mula ritual perawatan estetik personal",
    img: "/history/4-renaissance.jpg",
    cardClass: "vision-card-4",
  },
  {
    id: "hist-5",
    era: "YUNANI KLASIK",
    title: "Ekstrak Minyak Murni",
    desc: "Formulasi herbal dan minyak zaitun untuk elastisitas",
    img: "/history/5-classical.jpg",
    cardClass: "vision-card-5",
  },
];

const CONDITIONS = [
  {
    name: "Jerawat",
    sub: "Acne Vulgaris",
    desc: "Deteksi inflamasi, komedo, dan pustula pada zona wajah.",
    icon: Flame,
    color: "#e9957d",
  },
  {
    name: "Kulit Kering",
    sub: "Dehydration",
    desc: "Tingkat kelembapan epidermis dan tanda kekeringan lapisan pelindung.",
    icon: Droplets,
    color: "#3a8a6d",
  },
  {
    name: "Berminyak",
    sub: "Excess Sebum",
    desc: "Kelebihan produksi sebum pada area T-Zone dan pipi.",
    icon: Zap,
    color: "#d9882a",
  },
  {
    name: "Dark Spots",
    sub: "Hyperpigmentation",
    desc: "Bercak bekas jerawat, paparan UV, dan hiperpigmentasi melanin.",
    icon: Sun,
    color: "#68758e",
  },
  {
    name: "Kerutan",
    sub: "Fine Lines",
    desc: "Garis halus ekspresi dan elastisitas kolagen kulit.",
    icon: Sparkles,
    color: "#c53030",
  },
];

const FEATURES = [
  {
    title: "Analisis Komprehensif Satu Foto",
    desc: "Cukup ambil satu foto wajah dengan pencahayaan cukup. Model AI menganalisis tekstur mikro secara menyeluruh.",
    icon: Camera,
  },
  {
    title: "Asisten Dermatologi AI Pintar",
    desc: "Konsultasikan hasil analisis dengan chatbot cerdas kami untuk memahami bahan aktif skincare yang aman.",
    icon: Bot,
  },
  {
    title: "Marketplace Skincare Terkurasi",
    desc: "Temukan produk perawatan terverifikasi yang langsung sesuai dengan kebutuhan kulitmu tanpa coba-coba.",
    icon: HeartPulse,
  },
  {
    title: "Jejak Perkembangan Berkala",
    desc: "Pantau efektivitas skincare harianmu dengan grafik perbandingan skor dari scan ke scan.",
    icon: Activity,
  },
];

const FAQS = [
  {
    q: "Bagaimana cara kerja deteksi AI pada Laomera?",
    a: "Laomera memproses foto wajah menggunakan arsitektur deep learning yang dilatih mengenali karakteristik mikroskopis kulit: pori sebum, inflamasi jerawat, tingkat dehidrasi epidermis, deposisi melanin (noda), dan garis halus elastisitas.",
  },
  {
    q: "Apakah foto wajah saya aman dan privasi terjaga?",
    a: "Keamanan privasi adalah prioritas utama kami. Gambar hanya dianalisis sementara oleh inference engine dan tidak pernah dijual atau dibagikan ke pihak ketiga.",
  },
  {
    q: "Seberapa sering saya harus melakukan scan kulit?",
    a: "Disarankan melakukan scan berkala 1-2 minggu sekali setelah memulai rutinitas skincare baru untuk memantau perubahan skor kelembapan dan inflamasi pada menu Riwayat.",
  },
  {
    q: "Bisakah saya berkonsultasi mengenai hasil dengan Laomera Asisten?",
    a: "Tentu! Setelah scan, kamu bisa langsung membuka fitur Laomera Asisten untuk menanyakan arti skor, kandungan skincare yang cocok, dan tips perawatan harian.",
  },
];

export default function Home() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  // Animasi scroll: memunculkan card saat scroll ke bawah dan membuang card saat scroll ke atas
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const windowHeight = window.innerHeight;

          // 1. Vision section cards (5 foto)
          const visionEl = document.getElementById("visi");
          if (visionEl) {
            const rect = visionEl.getBoundingClientRect();
            if (rect.top <= windowHeight * 0.85 && rect.bottom >= windowHeight * 0.15) {
              visionEl.classList.add("cards-in-view");
              visionEl.classList.remove("cards-discard-up", "cards-hidden-down");
            } else if (rect.top > windowHeight * 0.85) {
              visionEl.classList.remove("cards-in-view", "cards-discard-up");
              visionEl.classList.add("cards-hidden-down");
            } else if (rect.bottom < windowHeight * 0.15) {
              visionEl.classList.remove("cards-in-view", "cards-hidden-down");
              visionEl.classList.add("cards-discard-up");
            }
          }

          // 2. Section cards lainnya (kondisi, fitur, faq)
          const sections = ["kondisi", "fitur", "faq"];
          sections.forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            const rect = el.getBoundingClientRect();
            if (rect.top <= windowHeight * 0.88 && rect.bottom >= windowHeight * 0.12) {
              el.classList.add("scroll-revealed");
              el.classList.remove("scroll-discarded");
            } else if (rect.bottom < windowHeight * 0.12) {
              el.classList.add("scroll-discarded");
              el.classList.remove("scroll-revealed");
            } else {
              el.classList.remove("scroll-revealed", "scroll-discarded");
            }
          });

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="landing-fullscreen-flow">
      {/* ── 1. HERO SHOWCASE (EDITORIAL HIGH-FASHION MINIMALIST STAGE) ── */}
      <section id="tentang" className="landing-hero-fullscreen">
        <div className="hero-ambient-glow" aria-hidden="true" />
        
        <div className="hero-editorial-header">
          <h1 className="hero-editorial-title">
            The Future of<br />Beauty is Automated
          </h1>
        </div>

        {/* ── CINEMATIC 3D ORBITAL STAGE DENGAN ANIMASI ROTASI & FADE GRADASI TRANSPARAN ── */}
        <CinematicOrbitStage nodes={ORBIT_NODES} />

        {/* Mobile Satellites: Clean 2x2 grid on smartphones */}
        <div className="orbit-mobile-grid">
          {ORBIT_NODES.map((node) => (
            <div key={node.id} className="orbit-mobile-card">
              <div className="orbit-mobile-icon-row">
                <div className="orbit-dock-glyph-mobile">{node.icon}</div>
                <span className="orbit-mobile-tag">{node.title}</span>
              </div>
              <p className="orbit-mobile-desc">{node.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. OUR VISION SECTION (FLOATING HISTORICAL RITUAL CARDS IN CURVED ARC) ── */}
      <section id="visi" className="landing-vision-section">
        <div className="content-canvas vision-container">
          <div className="vision-pill-badge">
            <span>OUR VISION</span>
          </div>

          {/* Arc of 5 Historical Cards */}
          <div className="vision-arc-track">
            {HISTORICAL_CARDS.map((card) => (
              <div key={card.id} className={`vision-card ${card.cardClass}`} title={`${card.era}: ${card.title}`}>
                <img src={card.img} alt={`${card.era} - ${card.title}`} className="vision-card-img" />
              </div>
            ))}
          </div>

          {/* Center Geometric Glyph Divider */}
          <div className="vision-center-glyph" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="4.5" r="2.8" />
              <circle cx="4.5" cy="12" r="2.8" />
              <circle cx="19.5" cy="12" r="2.8" />
              <circle cx="12" cy="19.5" r="2.8" />
            </svg>
          </div>

          {/* Editorial Serif Quote Statement */}
          <h2 className="vision-statement-serif">
            The daily ritual of applying makeup has remained a manual process for centuries, until now.
          </h2>

          <p className="vision-statement-sub">
            Selama berabad-abad, merawat dan memahami kebutuhan kulit selalu bergantung pada coba-coba tanpa kepastian.
            Laomera mentransformasikan tradisi ini dengan kecerdasan visi komputer deep learning yang objektif, instan, dan presisi.
          </p>
        </div>
      </section>

      {/* ── 3. LIMA KONDISI KULIT (UNBOXED OPEN CANVAS) ── */}
      <section id="kondisi" className="landing-section-unboxed">
        <div className="content-canvas">
          <div className="landing-section-head">
            <span className="badge badge-amber" style={{ marginBottom: "12px" }}>
              5 PILAR DIAGNOSIS
            </span>
            <h2>Kondisi Kulit yang Terdeteksi Presisi</h2>
            <p>
              Bukan sekadar perkiraan umum. Setiap indikator dianalisis dalam skala persentase objektif yang menentukan saran bahan aktif dan rutinitas harian.
            </p>
          </div>

          <div className="conditions-fluid-grid">
            {CONDITIONS.map((cond) => {
              const Icon = cond.icon;
              return (
                <article key={cond.name} className="condition-fluid-item">
                  <div className="condition-icon-badge" style={{ color: cond.color }}>
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <div className="condition-body">
                    <span className="condition-code-tag">{cond.sub}</span>
                    <h3 className="condition-title">{cond.name}</h3>
                    <p className="condition-desc">{cond.desc}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4. KENAPA LAOMERA BERBEDA ── */}
      <section id="fitur" className="landing-section-unboxed">
        <div className="content-canvas">
          <div className="landing-section-head">
            <span className="badge badge-navy" style={{ marginBottom: "12px" }}>
              KEUNGGULAN SISTEM
            </span>
            <h2>Kenapa Laomera Terasa Berbeda</h2>
            <p>Dirancang memadukan estetika holistik dengan teknologi visi komputer terkini.</p>
          </div>

          <div className="feature-fluid-grid">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="feature-fluid-card">
                  <div className="feature-icon-bubble">
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <h3>{feat.title}</h3>
                  <p>{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. PUSAT BANTUAN & FAQ ── */}
      <section id="faq" className="landing-section-unboxed">
        <div className="content-canvas">
          <div className="landing-section-head">
            <span className="badge badge-navy" style={{ marginBottom: "12px" }}>
              PUSAT BANTUAN
            </span>
            <h2>Pertanyaan yang Sering Diajukan</h2>
            <p>Segala hal yang perlu kamu ketahui tentang pemindaian wajah, privasi, dan kecerdasan buatan kami.</p>
          </div>

          <div className="faq-fluid-stack">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={faq.q} className={`faq-card-item ${isOpen ? "open" : ""}`}>
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    aria-expanded={isOpen}
                  >
                    <span className="faq-q-text">{faq.q}</span>
                    <ChevronDown size={18} className={`faq-chevron ${isOpen ? "rotate" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="faq-answer-body">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
