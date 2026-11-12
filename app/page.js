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
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import FeedbackModal from "../components/FeedbackModal";
import CinematicOrbitStage from "../components/CinematicOrbitStage";
import CinematicFooter from "../components/CinematicFooter";
import AuroraWaves from "../components/AuroraWaves";

// ── 1. LIMA OUTPUT KLASIFIKASI VGG UNTUK ORBIT HERO STAGE ──
const ORBIT_NODES = [
  {
    id: "orbit-acne",
    outputIndex: "01",
    title: "Acne Vulgaris",
    subtitle: "Jerawat & Inflamasi",
    color: "#e9957d",
  },
  {
    id: "orbit-dry",
    outputIndex: "02",
    title: "Dehydration",
    subtitle: "Kulit Kering & Barrier",
    color: "#3a8a6d",
  },
  {
    id: "orbit-oily",
    outputIndex: "03",
    title: "Excess Sebum",
    subtitle: "Minyak T-Zone Berlebih",
    color: "#d9882a",
  },
  {
    id: "orbit-pigment",
    outputIndex: "04",
    title: "Hyperpigmentation",
    subtitle: "Dark Spots & Flek UV",
    color: "#68758e",
  },
  {
    id: "orbit-wrinkle",
    outputIndex: "05",
    title: "Fine Lines",
    subtitle: "Garis Halus & Penuaan",
    color: "#c53030",
  },
];

// ── 2. LIMA KARTU KLASIFIKASI VGG DENGAN DETAIL POPUP DI SECTION VISION (#visi) ──
const VGG_OUTPUT_CARDS = [
  {
    id: "vgg-acne",
    outputIndex: "01",
    title: "Jerawat",
    sub: "Acne Vulgaris",
    shortDesc: "Deteksi inflamasi papula, pustula, dan komedo pada epidermis wajah.",
    fullDesc:
      "Arsitektur deep learning VGG mengekstraksi representasi fitur konvolusional multi-skala untuk membedakan eritema aktif (kemerahan peradangan), komedo terbuka/tertutup, dan kolonisasi Cutibacterium acnes dengan presisi tinggi.",
    symptoms: [
      "Peradangan merah dan benjolan sensitif pada zona T maupun pipi",
      "Penyumbatan pori akibat tumpukan keratin dan sebum",
      "Potensi timbul bekas noda pasca-inflamasi jika tidak ditangani tepat",
    ],
    recommendations: [
      "Salicylic Acid (BHA 1-2%) untuk penetrasi eksfoliasi ke dalam pori",
      "Niacinamide (4-5%) guna menenangkan inflamasi dan mengontrol sebum",
      "Pembersih gel ber-pH seimbang (5.5) bebas sulfat dan non-komedogenik",
    ],
    img: "/history/1-indigenous.jpg",
    cardClass: "vision-card-1",
    badgeColor: "#e9957d",
  },
  {
    id: "vgg-dry",
    outputIndex: "02",
    title: "Kulit Kering",
    sub: "Dehydration & Barrier Impairment",
    shortDesc: "Tingkat kelembapan epidermis dan tanda kekeringan stratum korneum.",
    fullDesc:
      "Model menganalisis hilangnya pantulan difus cahaya dan pola deskuamasi mikro epidermis. VGG mendeteksi defisiensi Natural Moisturizing Factor (NMF) serta kelemahan sawar pelindung kulit (skin barrier).",
    symptoms: [
      "Sensasi kulit tertarik kencang dan kaku setelah mencuci wajah",
      "Tekstur permukaan bersisik mikro dan kehilangan kilau sehat",
      "Garis-garis dehidrasi halus tampak jelas di area pipi dan bawah mata",
    ],
    recommendations: [
      "Hyaluronic Acid multi-molekul untuk hidrasi lintas lapisan epidermis",
      "Ceramide NP, AP, EOP untuk mereparasi matriks lipid pelindung",
      "Pelembap beremolien kaya squalane untuk mencegah Transepidermal Water Loss (TEWL)",
    ],
    img: "/history/2-egyptian.jpg",
    cardClass: "vision-card-2",
    badgeColor: "#3a8a6d",
  },
  {
    id: "vgg-oily",
    outputIndex: "03",
    title: "Berminyak",
    sub: "Excess Sebum Production",
    shortDesc: "Kuantifikasi hipersekresi kelenjar sebasea pada area T-Zone dan pipi.",
    fullDesc:
      "Jaringan saraf tiruan mendeteksi specular reflection (kilau pantulan cahaya berlebih) dan dilatasi folikel pori. Sistem mengukur persentase keaktifan kelenjar minyak secara objektif tanpa bias pencahayaan.",
    symptoms: [
      "Kilap berminyak berlebih muncul kembali dalam waktu 1-2 jam setelah dibersihkan",
      "Pori-pori tampak membesar dan rentan tersumbat kotoran",
      "Lapisan foundation atau sunscreen mudah teroksidasi dan bergeser",
    ],
    recommendations: [
      "Zinc PCA untuk regulasi fisiologis laju sekresi kelenjar sebasea",
      "Clay mask (Kaolin/Bentonite) berkala 1-2 kali seminggu untuk detoksifikasi pori",
      "Moisturizer oil-free berbahan dasar air (water-gel) yang cepat meresap",
    ],
    img: "/history/3-tribal.jpg",
    cardClass: "vision-card-3",
    badgeColor: "#d9882a",
  },
  {
    id: "vgg-pigment",
    outputIndex: "04",
    title: "Dark Spots",
    sub: "Hyperpigmentation & Melanin Deposition",
    shortDesc: "Pemetaan noda bekas jerawat (PIH/PIE) dan deposisi pigmen melanin.",
    fullDesc:
      "Lapisan konvolusi dalam mendeteksi kontras kromatik pada lapisan basal kulit, memisahkan noda eritema vaskular (PIE) dari akumulasi melanin epidermal (PIH atau sun spots akibat radiasi UV).",
    symptoms: [
      "Bercak kecokelatan atau kemerahan sisa inflamasi jerawat masa lalu",
      "Diskolorasi warna kulit tidak merata pada area tonjolan wajah (tulang pipi, dahi)",
      "Peningkatan intensitas noda saat terpapar sinar matahari langsung",
    ],
    recommendations: [
      "Alpha Arbutin & Tranexamic Acid untuk menghambat enzim tirosinase penyebab flek",
      "Vitamin C murni (L-Ascorbic Acid) sebagai penangkal radikal bebas dan pencerah",
      "Sunscreen broad-spectrum SPF 50+ PA++++ wajib digunakan setiap hari",
    ],
    img: "/history/4-renaissance.jpg",
    cardClass: "vision-card-4",
    badgeColor: "#68758e",
  },
  {
    id: "vgg-wrinkle",
    outputIndex: "05",
    title: "Kerutan",
    sub: "Fine Lines & Structural Aging",
    shortDesc: "Analisis degradasi serat kolagen dan garis ekspresi mikro dinamis.",
    fullDesc:
      "Model VGG mengidentifikasi pola lipatan mikro mikro-alur kulit pada sudut lateral mata (crow's feet), glabella (dahi), dan sulkus nasolabial guna mengukur elastisitas struktural serta penuaan dini.",
    symptoms: [
      "Garis halus dinamis yang mulai menetap menjadi garis statis saat wajah rileks",
      "Berkurangnya daya pantul dan kepadatan jaringan kolagen wajah",
      "Tekstur kulit tampak lebih tipis dan rentan terhadap kerapuhan lingkungan",
    ],
    recommendations: [
      "Retinol atau Retinoid terenkapsulasi di malam hari untuk merangsang sintesis kolagen baru",
      "Peptida tembaga (Copper Tripeptide-1) guna mempercepat peremajaan seluler",
      "Krim malam kaya antioksidan dan asam lemak esensial",
    ],
    img: "/history/5-classical.jpg",
    cardClass: "vision-card-5",
    badgeColor: "#c53030",
  },
];

// ── 3. FITUR UTAMA SISTEM ──
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

export default function Home() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedVggCard, setSelectedVggCard] = useState(null);

  // Animasi scroll: memunculkan card saat scroll ke bawah dan membuang card saat scroll ke atas
  useEffect(() => {
    let ticking = false;

    function handleScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY || window.pageYOffset;
          const heroSection = document.getElementById("tentang");
          const visionSection = document.getElementById("visi");
          const featureSection = document.getElementById("fitur");

          // Discard Hero Elements
          if (heroSection) {
            const heroHeight = heroSection.offsetHeight;
            if (scrollY > heroHeight * 0.28) {
              heroSection.classList.add("scroll-discarded");
            } else {
              heroSection.classList.remove("scroll-discarded");
            }
          }

          // Animate Vision Cards In & Out
          if (visionSection) {
            const rect = visionSection.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            if (rect.top <= windowHeight * 0.75 && rect.bottom >= windowHeight * 0.25) {
              visionSection.classList.add("cards-in-view");
              visionSection.classList.remove("cards-discard-up", "cards-hidden-down");
            } else if (rect.bottom < windowHeight * 0.25) {
              visionSection.classList.add("cards-discard-up");
              visionSection.classList.remove("cards-in-view", "cards-hidden-down");
            } else {
              visionSection.classList.add("cards-hidden-down");
              visionSection.classList.remove("cards-in-view", "cards-discard-up");
            }
          }

          // Animate Feature Cards In
          if (featureSection) {
            const rect = featureSection.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            if (rect.top <= windowHeight * 0.85) {
              featureSection.classList.add("scroll-revealed");
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="landing-fullscreen-flow">
      {/* ── 1. HERO SHOWCASE: LAOMERA GIANT TITLE + ORBITAL STAGE ── */}
      <section id="tentang" className="landing-hero-fullscreen">
        <div className="hero-ambient-glow" aria-hidden="true" />

        <div className="hero-editorial-header">
          <h1 className="hero-editorial-title">LAOMERA</h1>
        </div>

        {/* ── CINEMATIC 3D ORBITAL STAGE: 5 OUTPUT VGG BERPUTAR KONTINU ── */}
        <CinematicOrbitStage nodes={ORBIT_NODES} />

        {/* Mobile Satellites: Clean 2x2 grid on smartphones */}
        <div className="orbit-mobile-grid">
          {ORBIT_NODES.map((node) => (
            <div key={node.id} className="orbit-mobile-card">
              <div className="orbit-mobile-icon-row">
                <span className="orbit-vgg-tag-badge" style={{ color: node.color }}>
                  VGG #{node.outputIndex}
                </span>
                <span className="orbit-mobile-tag">{node.title}</span>
              </div>
              <p className="orbit-mobile-desc">{node.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. SECTION 5 OUTPUT VGG (#visi) DENGAN AURORA WAVES & INTERACTIVE POPUP ── */}
      <section id="visi" className="landing-vision-section">
        {/* Ethereal Aurora Waves WebGL Shader Canvas: Multi-Ribbon Phase Flowing to Right Corner */}
        <AuroraWaves speed={0.85} glow={15} theme="dark" />

        {/* Gradasi Lembut Atas & Bawah (Transisi Biru Muda <-> Midnight Navy) */}
        <div className="vision-top-gradient-bridge" aria-hidden="true" />
        <div className="vision-bottom-gradient-bridge" aria-hidden="true" />

        <div className="content-canvas vision-container">
          <div className="vision-pill-badge">
            <span>5 PILAR OUTPUT VGG DEEP LEARNING</span>
          </div>

          {/* Arc of 5 VGG Classification Cards */}
          <div className="vision-arc-track">
            {VGG_OUTPUT_CARDS.map((card) => (
              <div
                key={card.id}
                className={`vision-card vision-card-clickable ${card.cardClass}`}
                title={`Klik untuk detail analisis: ${card.title} (${card.sub})`}
                onClick={() => setSelectedVggCard(card)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedVggCard(card);
                  }
                }}
              >
                <img
                  src={card.img}
                  alt={`${card.title} - ${card.sub}`}
                  className="vision-card-img"
                />
                <div className="vision-card-interactive-pill">
                  <span>{card.title}</span>
                  <span style={{ color: "var(--sunflower-yellow)" }}>✦ Detail</span>
                </div>
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
            Klik pada salah satu dari 5 kartu di atas untuk membaca evaluasi klinis mendalam, parameter deteksi konvolusi AI, dan panduan bahan aktif terkurasi.
          </p>
        </div>
      </section>

      {/* ── 3. KENAPA LAOMERA BERBEDA ── */}
      <section id="fitur" className="landing-section-unboxed" style={{ position: "relative" }}>
        {/* Gradasi Lembut Menuju Cinematic Footer (Biru Muda -> Midnight Navy) */}
        <div className="faq-bottom-gradient-bridge" aria-hidden="true" />

        <div className="content-canvas" style={{ position: "relative", zIndex: 2 }}>
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

      {/* ── 4. CINEMATIC CURTAIN REVEAL FOOTER ── */}
      <CinematicFooter />

      {/* ── 5. POPUP MODAL PENJELASAN OUTPUT VGG ── */}
      {selectedVggCard && (
        <div
          className="vgg-modal-backdrop"
          onClick={() => setSelectedVggCard(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="vgg-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="vgg-modal-close-btn"
              onClick={() => setSelectedVggCard(null)}
              aria-label="Tutup jendela penjelasan"
            >
              <X size={20} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  backgroundColor: `${selectedVggCard.badgeColor}25`,
                  color: selectedVggCard.badgeColor,
                  border: `1px solid ${selectedVggCard.badgeColor}45`,
                }}
              >
                VGG OUTPUT #{selectedVggCard.outputIndex}
              </span>
              <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "600" }}>
                Klasifikasi Deep Learning
              </span>
            </div>

            <h3 style={{ fontSize: "24px", fontWeight: "800", color: "#ffffff", margin: "0 0 4px" }}>
              {selectedVggCard.title}
            </h3>
            <p style={{ fontSize: "14px", color: "#acc8ec", fontWeight: "600", margin: "0 0 16px" }}>
              {selectedVggCard.sub}
            </p>

            <div className="vgg-modal-media-wrap">
              <img
                src={selectedVggCard.img}
                alt={`${selectedVggCard.title} diagnosis`}
              />
            </div>

            <p style={{ fontSize: "14px", lineHeight: "1.65", color: "#E2E8F0", marginBottom: "20px" }}>
              {selectedVggCard.fullDesc}
            </p>

            <div style={{ marginBottom: "20px" }}>
              <div className="vgg-modal-section-title">
                <AlertCircle size={15} /> Karakteristik & Gejala Visual
              </div>
              <ul className="vgg-modal-list">
                {selectedVggCard.symptoms.map((sym, i) => (
                  <li key={i}>{sym}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div className="vgg-modal-section-title">
                <CheckCircle2 size={15} /> Panduan Formulasi & Bahan Aktif
              </div>
              <ul className="vgg-modal-list">
                {selectedVggCard.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>

            <div style={{ textAlign: "right", marginTop: "24px" }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  borderRadius: "12px",
                  padding: "10px 22px",
                  fontSize: "13.5px",
                  fontWeight: "700",
                }}
                onClick={() => setSelectedVggCard(null)}
              >
                Tutup Penjelasan
              </button>
            </div>
          </div>
        </div>
      )}

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
