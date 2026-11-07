// Lonceng notifikasi di stage topbar workspace (customer + admin).
// Isi panel berasal dari lib/notifications.js — kejadian nyata dari API,
// bukan notifikasi karangan:
//   customer: scan selesai / gagal / diproses (riwayat) + pengingat
//     menyelesaikan verifikasi akun sendiri.
//   admin: akun baru mendaftar tapi belum verifikasi + akun yang baru
//     saja terverifikasi (blok verification dashboard admin) + audit scan.
// Status dibaca tersimpan di localStorage per user; panel dihitung ulang
// tiap pindah halaman, tiap dibuka, dan tiap scan selesai.
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCircle2, AlertCircle, Clock, ShieldCheck, ShieldAlert, Smartphone } from "lucide-react";
import { getMe, getHistory, getAdminScans, getAdminDashboard, pickArray, pickObject } from "../lib/api";
import {
  buildNotificationsFromScans,
  buildNotificationsFromVerification,
  timeAgo,
  loadReadIds,
  saveReadIds,
  NOTIFICATIONS_REFRESH_EVENT,
} from "../lib/notifications";

function TypeIcon({ type }) {
  if (type === "scan-success") return <CheckCircle2 size={18} />;
  if (type === "scan-failed") return <AlertCircle size={18} />;
  if (type === "verify-done") return <ShieldCheck size={18} />;
  if (type === "verify-otp") return <Smartphone size={18} />;
  if (type === "verify-pending") return <ShieldAlert size={18} />;
  return <Clock size={18} />;
}

export default function NotificationBell() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [readIds, setReadIds] = useState(() => new Set());
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const fetchItems = useCallback(async () => {
    try {
      const me = await getMe();
      const u = me?.user || me;
      if (!u) return;
      setUser(u);
      setReadIds(loadReadIds(u.id));
      if (u.role === "admin") {
        const [dashRes, scansRes] = await Promise.allSettled([
          getAdminDashboard(),
          getAdminScans({ per_page: 10 }),
        ]);
        const verification =
          dashRes.status === "fulfilled" ? pickObject(dashRes.value)?.verification || null : null;
        const scans =
          scansRes.status === "fulfilled" ? pickArray(scansRes.value?.scans ?? scansRes.value) : [];
        // Verifikasi dulu (paling penting buat admin), lalu scan terbaru.
        setItems([
          ...buildNotificationsFromVerification(verification, { admin: true }),
          ...buildNotificationsFromScans(scans, { admin: true }),
        ]);
      } else {
        const d = await getHistory();
        setItems([
          ...buildNotificationsFromVerification(null, { admin: false, user: u }),
          ...buildNotificationsFromScans(pickArray(d), { admin: false }),
        ]);
      }
    } catch {
      // Belum login / API tidak bisa dijangkau: lonceng disembunyikan.
    }
  }, []);

  // Hitung ulang tiap pindah halaman (termasuk saat pertama dimuat).
  useEffect(() => {
    fetchItems();
  }, [pathname, fetchItems]);

  // Halaman scan memberi tahu saat satu scan selesai.
  useEffect(() => {
    const onRefresh = () => fetchItems();
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, onRefresh);
  }, [fetchItems]);

  // Tutup panel saat klik di luar atau tekan Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const unread = items.filter((i) => !readIds.has(i.id)).length;

  const persistRead = (next) => {
    setReadIds(next);
    saveReadIds(user.id, next);
  };

  const markRead = (id) => {
    const next = new Set(readIds);
    next.add(id);
    persistRead(next);
  };

  const markAllRead = () => {
    persistRead(new Set([...readIds, ...items.map((i) => i.id)]));
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchItems();
  };

  return (
    <div className="notif-bell-wrap" ref={wrapRef}>
      <button
        type="button"
        className="notif-bell-btn"
        onClick={toggle}
        aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}
        aria-expanded={open}
      >
        <Bell size={18} />
        {unread > 0 && <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label="Notifikasi">
          <div className="notif-panel-head">
            <strong>Notifikasi</strong>
            {unread > 0 && (
              <button type="button" className="notif-mark-all" onClick={markAllRead}>
                Tandai semua dibaca
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="notif-empty">
              <Bell size={22} />
              <p>Belum ada notifikasi.</p>
              <p className="muted">Notifikasi scan dan verifikasi akun akan muncul di sini.</p>
              {user.role !== "admin" && (
                <Link href="/scan" className="btn btn-amber btn-sm" onClick={() => setOpen(false)}>
                  Mulai Scan
                </Link>
              )}
            </div>
          ) : (
            <ul className="notif-list">
              {items.map((n) => {
                const isUnread = !readIds.has(n.id);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={`notif-item${isUnread ? " is-unread" : ""}`}
                      onClick={() => {
                        markRead(n.id);
                        setOpen(false);
                        router.push(n.href);
                      }}
                    >
                      <span className={`notif-item-icon notif-${n.type}`}>
                        <TypeIcon type={n.type} />
                      </span>
                      <span className="notif-item-text">
                        <span className="notif-item-title">
                          {n.title}
                          {isUnread && <span className="notif-dot" aria-label="Belum dibaca" />}
                        </span>
                        <span className="notif-item-body">{n.body}</span>
                        {n.createdAt && <span className="notif-item-time">{timeAgo(n.createdAt)}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
