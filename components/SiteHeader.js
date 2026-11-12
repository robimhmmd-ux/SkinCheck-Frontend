"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Camera,
  History,
  ShoppingBag,
  Bot,
  User,
  LogIn,
  LogOut,
  Menu,
  X,
  Sparkles,
  ArrowRight,
  MessageSquareHeart,
  HelpCircle,
  Info,
  ShieldCheck,
} from "lucide-react";
import LoginModal from "./LoginModal";
import FeedbackModal from "./FeedbackModal";
import { getMe, logout, pickUser, clearAssistantHistory } from "../lib/api";
import { useToast } from "./Toast";

// Navigation links for inner workspace pages (scan, history, etc.)
const INNER_NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scan", label: "Scan Kulit", icon: Camera },
  { href: "/history", label: "Riwayat & Diagnosis", icon: History },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/assistant", label: "Laomera Asisten", icon: Bot },
  { href: "/profile", label: "Profil", icon: User },
];

export default function SiteHeader() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);
  // Apakah status login sudah dipastikan (getMe selesai)? Dipakai tombol
  // Scan supaya tidak salah membuka login saat sesi sebenarnya masih ada.
  const [authChecked, setAuthChecked] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  const isLandingPage = pathname === "/";

  useEffect(() => {
    let alive = true;
    getMe()
      .then((d) => {
        if (alive) setUser(pickUser(d));
      })
      .catch(() => {
        if (alive) setUser(null);
      })
      .finally(() => {
        if (alive) setAuthChecked(true);
      });
    return () => {
      alive = false;
    };
  }, [pathname]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Tombol Scan di bar atas landing: kalau belum login, suruh login dulu
  // (buka modal login) — jangan langsung masuk workspace/dashboard.
  // Kalau sudah login, lanjut ke /scan seperti biasa.
  function handleScanClick(e) {
    if (e) e.preventDefault();
    if (!authChecked) return; // tunggu status login dipastikan dulu
    setMobileMenuOpen(false);
    if (user) {
      router.push("/scan");
    } else {
      setLoginOpen(true);
    }
  }

  async function onLogout() {
    if (busy) return;
    setBusy(true);
    // Hapus percakapan chatbot saat logout (roboy 2026-11-12): selagi sesi
    // masih aktif, hapus riwayat di backend; lalu beri tahu widget lewat
    // event supaya state lokalnya ikut terhapus. Best-effort: kalau hapus
    // riwayat gagal, logout tetap jalan.
    try {
      await clearAssistantHistory();
    } catch {}
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("laomera-chat-clear"));
    }
    try {
      await logout();
      setUser(null);
      toast.success("Berhasil keluar.");
      router.push("/");
      router.refresh();
    } catch {
      setUser(null);
      toast.success("Berhasil keluar.");
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Di landing page tidak ada bar atas (roboy 2026-11-12): header jadi
          transparan + absolute (melayang di atas hero lalu ikut ter-scroll,
          bukan sticky). Logo, nav, tombol Scan/Masuk tetap ada dan
          berfungsi; hanya latar/bayangan "bar"-nya yang dihilangkan.
          LoginModal/drawer tetap ter-render di bawah. */}
      <header className={`fullscreen-topbar${isLandingPage ? " topbar-landing" : ""}`}>
        <div className="content-canvas topbar-inner-row">
          {/* Brand Emblem & Logo */}
          <Link className="brand-emblem-wrap" href="/">
            <div className="brand-emblem-icon" aria-hidden="true">
              L
            </div>
            <span className="brand-title-text">Laomera</span>
          </Link>

          {/* ── LANDING PAGE TASKBAR LINKS ── */}
          {isLandingPage ? (
            <nav className="nav-links-cluster" aria-label="Navigasi Halaman Utama">
              <a href="#tentang" className="nav-pill-item">
                <Info size={15} aria-hidden="true" />
                <span>Tentang</span>
              </a>
              <a href="#visi" className="nav-pill-item">
                <Sparkles size={15} aria-hidden="true" />
                <span>5 Output AI</span>
              </a>
              <a href="#fitur" className="nav-pill-item">
                <ShieldCheck size={15} aria-hidden="true" />
                <span>Fitur AI</span>
              </a>
              <button
                type="button"
                className="nav-pill-item nav-pill-btn"
                onClick={() => setFeedbackOpen(true)}
              >
                <MessageSquareHeart size={15} aria-hidden="true" />
                <span>Feedback</span>
              </button>
            </nav>
          ) : (
            /* ── INNER APP PAGES TASKBAR LINKS ── */
            <nav className="nav-links-cluster" aria-label="Navigasi Aplikasi">
              {INNER_NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                const isChat = href === "/assistant";
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`nav-pill-item ${active ? "active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    onClick={(e) => {
                      if (isChat) {
                        e.preventDefault();
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(new CustomEvent("open-laomera-chat"));
                          window.dispatchEvent(new CustomEvent("open-skincheck-chat"));
                        }
                      }
                    }}
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Actions: Scan CTA & Auth/Dashboard Button */}
          <div className="nav-action-cluster">
            <button type="button" onClick={handleScanClick} className="btn btn-amber btn-sm nav-scan-btn">
              <Camera size={15} aria-hidden="true" />
              <span>Scan Kulit</span>
            </button>

            {user ? (
              isLandingPage ? (
                <>
                  <Link href="/dashboard" className="btn btn-secondary btn-sm nav-auth-btn">
                    <LayoutDashboard size={15} aria-hidden="true" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm nav-auth-btn"
                    onClick={onLogout}
                    disabled={busy}
                    title="Keluar akun"
                  >
                    <LogOut size={15} aria-hidden="true" />
                    <span>{busy ? "…" : "Keluar"}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm nav-auth-btn"
                  onClick={onLogout}
                  disabled={busy}
                  title="Keluar akun"
                >
                  <LogOut size={15} aria-hidden="true" />
                  <span>{busy ? "…" : "Keluar"}</span>
                </button>
              )
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm nav-auth-btn"
                onClick={() => setLoginOpen(true)}
              >
                <LogIn size={15} aria-hidden="true" />
                <span>Masuk</span>
              </button>
            )}

            {/* Mobile Nav Toggle Button */}
            <button
              type="button"
              className="mobile-nav-toggle"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Fullscreen Slide-over Sheet */}
        {mobileMenuOpen && (
          <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)}>
            <div className="mobile-drawer-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-drawer-header">
                <div className="brand-emblem-wrap">
                  <div className="brand-emblem-icon">L</div>
                  <span className="brand-title-text">Laomera</span>
                </div>
                <button
                  type="button"
                  className="mobile-drawer-close"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Tutup menu"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mobile-drawer-body">
                {isLandingPage ? (
                  /* Landing Mobile Links */
                  <nav className="mobile-drawer-nav">
                    <a
                      href="#tentang"
                      className="mobile-nav-item"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="mobile-nav-icon-wrap">
                        <Info size={18} />
                      </div>
                      <span className="mobile-nav-label">Tentang Platform</span>
                    </a>
                    <a
                      href="#visi"
                      className="mobile-nav-item"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="mobile-nav-icon-wrap">
                        <Sparkles size={18} />
                      </div>
                      <span className="mobile-nav-label">5 Output AI (VGG)</span>
                    </a>
                    <a
                      href="#fitur"
                      className="mobile-nav-item"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="mobile-nav-icon-wrap">
                        <ShieldCheck size={18} />
                      </div>
                      <span className="mobile-nav-label">Fitur AI & Inovasi</span>
                    </a>
                    <button
                      type="button"
                      className="mobile-nav-item mobile-nav-btn-action"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setFeedbackOpen(true);
                      }}
                    >
                      <div className="mobile-nav-icon-wrap">
                        <MessageSquareHeart size={18} />
                      </div>
                      <span className="mobile-nav-label">Beri Feedback & Ulasan</span>
                    </button>
                  </nav>
                ) : (
                  /* Inner App Mobile Links */
                  <nav className="mobile-drawer-nav">
                    {INNER_NAV_LINKS.map(({ href, label, icon: Icon }) => {
                      const active = pathname === href;
                      const isChat = href === "/assistant";
                      return (
                        <Link
                          key={href}
                          href={href}
                          className={`mobile-nav-item ${active ? "active" : ""}`}
                          onClick={(e) => {
                            setMobileMenuOpen(false);
                            if (isChat) {
                              e.preventDefault();
                              if (typeof window !== "undefined") {
                                window.dispatchEvent(new CustomEvent("open-laomera-chat"));
                                window.dispatchEvent(new CustomEvent("open-skincheck-chat"));
                              }
                            }
                          }}
                        >
                          <div className="mobile-nav-icon-wrap">
                            <Icon size={18} />
                          </div>
                          <span className="mobile-nav-label">{label}</span>
                          {active && <span className="mobile-active-dot" />}
                        </Link>
                      );
                    })}
                  </nav>
                )}

                <div className="mobile-drawer-footer">
                  <button
                    type="button"
                    className="btn btn-amber"
                    style={{ width: "100%", justifyContent: "center" }}
                    onClick={handleScanClick}
                  >
                    <Camera size={18} />
                    <span>Mulai Scan Kulit</span>
                    <ArrowRight size={16} />
                  </button>

                  {user ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="btn btn-secondary"
                        style={{ width: "100%", justifyContent: "center" }}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LayoutDashboard size={16} />
                        <span>Buka Dashboard</span>
                      </Link>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ width: "100%", justifyContent: "center" }}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onLogout();
                        }}
                        disabled={busy}
                      >
                        <LogOut size={16} />
                        <span>Keluar ({user.name || "Akun"})</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: "100%", justifyContent: "center" }}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setLoginOpen(true);
                      }}
                    >
                      <LogIn size={16} />
                      <span>Masuk ke Akun</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
}
