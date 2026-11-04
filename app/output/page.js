"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getHistory, getDashboard, pickArray, pickObject } from "../../lib/api";
import { ErrorBox, Loading } from "../../components/Notice";
import Seal from "../../components/Seal";
import { SCORE_KEYS, averageScores, latestAnalyzedScan, fmtScore, fmtDate } from "../../lib/scores";

// Halaman Output VGG — dossier laporan, bukan lagi card tersebar
// di atas foto fullscreen (arah lama sudah dibatalkan user
// 2026-11-04) dan bukan lagi laporan editorial panel putaran 2
// (dirombak total lagi putaran 3: dossier terpusat, stempel besar,
// angka raksasa, ledger skala, chapter buka-tutup).
// Skema buka/tutup section (dipertahankan dari sebelumnya):
// - Masuk lewat scan (URL mengandung ?from=scan): section "5 output
//   scan terakhir" TERBUKA sejak awal, section lain tertutup.
// - Masuk langsung ke /output (tanpa ?from=scan): SEMUA section
//   tertutup, masing-masing hanya terbuka kalau diklik.
function Chapter({ id, title, subtitle, open, onToggle, children }) {
  return (
    <div className="gx-chapter">
      <button
        type="button"
        className="gx-chapter-head"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`output-section-${id}`}
      >
        <span>
          <strong>{title}</strong>
          <span className="muted">{subtitle}</span>
        </span>
        <span className="gx-chapter-icon" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="gx-chapter-body" id={`output-section-${id}`}>
          {children}
        </div>
      )}
    </div>
  );
}

function ScaleLedger({ analysis }) {
  if (!analysis) return <p className="muted">Belum ada skor untuk ditampilkan.</p>;
  return (
    <div className="gx-ledger">
      {SCORE_KEYS.map(([key, label]) => {
        const raw = Number(analysis[key]);
        const finite = Number.isFinite(raw);
        return (
          <div key={key} className="gx-row">
            <span className="gx-label">{label}</span>
            <b>{finite ? `${analysis[key]}%` : "—"}</b>
            {finite && (
              <span className="gx-scale" aria-hidden="true">
                <i style={{ left: `${Math.max(0, Math.min(100, raw))}%` }} />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OutputPage() {
  const [history, setHistory] = useState([]);
  const [dash, setDash] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState(null); // null | "latest" | "all" | "count"

  useEffect(() => {
    // Baca penanda asal di client saja (tanpa useSearchParams,
    // supaya tidak butuh Suspense boundary): kalau URL-nya
    // ?from=scan, berarti user baru saja menyelesaikan scan.
    try {
      const from = new URLSearchParams(window.location.search).get("from");
      if (from === "scan") setOpenSection("latest");
    } catch {}
    let alive = true;
    (async () => {
      try {
        const [h, d] = await Promise.allSettled([getHistory(), getDashboard()]);
        if (!alive) return;
        if (h.status === "fulfilled") setHistory(pickArray(h.value));
        if (d.status === "fulfilled") setDash(pickObject(d.value));
        const firstErr = [h, d].find((r) => r.status === "rejected");
        if (firstErr) setError(firstErr.reason);
      } catch (e) { if (alive) setError(e); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  function toggle(id) {
    setOpenSection((cur) => (cur === id ? null : id));
  }

  if (loading) return <div className="gx-page"><Loading label="Memuat hasil…" /></div>;

  const scans = history.length ? history : pickArray(dash && (dash.recent_scans || dash.scans || dash));
  const avg = averageScores(scans);
  const latest = latestAnalyzedScan(scans);
  const latestAnalysis = latest ? (latest.analysis || latest.analysis_result || latest.result) : null;
  const totalScans = scans.length;
  const analyzedCount = avg ? avg.count : 0;
  const latestStatus = latest ? ({ completed: "Selesai", processing: "Diproses", failed: "Gagal" }[latest.status] || latest.status || "—") : null;

  return (
    <div className="gx-page">
      <div className="gx-dossier">
        <div className="gx-dossier-hero gx-rise">
          <Seal big />
          <h1>Output</h1>
          <p className="gx-lead" style={{ margin: "0 auto 16px" }}>Laporan kulit wajahmu dari analisis VGG. Klik sebuah bab untuk membuka atau menutupnya.</p>
          <div className="gx-actions" style={{ justifyContent: "center" }}>
            <Link className="btn" href="/scan">Scan baru</Link>
            <Link className="btn secondary" href="/dashboard">Dashboard</Link>
          </div>
        </div>
        <ErrorBox error={error} />
        {error && error.status === 401 && <p className="muted">Sepertinya kamu belum masuk. <Link href="/login">Masuk dulu</Link> untuk melihat hasilmu.</p>}

        <div className="gx-dossier-hero">
          <div className="gx-arch-img">
            <Image src="/output-face.jpg" alt="Ilustrasi wajah" width={560} height={700} priority={false} />
          </div>
          <h2>{latest ? `Scan terakhir #${latest.id}` : "Belum ada hasil scan"}</h2>
          <p className="muted" style={{ margin: "0 auto" }}>{latest ? `${fmtDate(latest.created_at)}, status ${latestStatus}` : "Lakukan scan dulu, lalu hasilnya akan tampil di sini."}</p>
          <div className="gx-result-num" style={{ justifyContent: "center" }}>
            <b>{latestAnalysis && latestAnalysis.overall_score != null ? fmtScore(latestAnalysis.overall_score) : "—"}</b>
            <span>skor keseluruhan</span>
          </div>
        </div>

        <div className="gx-ledger">
          {SCORE_KEYS.filter(([key]) => key !== "overall_score").map(([key, label]) => {
            const raw = latestAnalysis ? Number(latestAnalysis[key]) : NaN;
            const finite = Number.isFinite(raw);
            return (
              <div key={key} className="gx-row">
                <span className="gx-label">{label}</span>
                <b>{finite ? `${latestAnalysis[key]}%` : "—"}</b>
                {finite && (
                  <span className="gx-scale" aria-hidden="true">
                    <i style={{ left: `${Math.max(0, Math.min(100, raw))}%` }} />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <Chapter
          id="latest"
          title="5 output scan terakhir"
          subtitle={latest ? `Scan #${latest.id}, ${fmtDate(latest.created_at)}` : "Belum ada scan terakhir"}
          open={openSection === "latest"}
          onToggle={() => toggle("latest")}
        >
          <ScaleLedger analysis={latestAnalysis} />
          {latest && <p><Link href={`/history/${latest.id}`}>Lihat detail scan ini</Link></p>}
        </Chapter>

        <Chapter
          id="all"
          title="Rata-rata 5 output seluruh scan"
          subtitle={avg ? `Dari ${avg.count} scan yang selesai dianalisis` : "Belum bisa dihitung"}
          open={openSection === "all"}
          onToggle={() => toggle("all")}
        >
          <ScaleLedger analysis={avg} />
        </Chapter>

        <Chapter
          id="count"
          title="Berapa kali scan"
          subtitle={totalScans ? `${totalScans} kali scan di riwayat` : "Belum ada scan"}
          open={openSection === "count"}
          onToggle={() => toggle("count")}
        >
          <p><strong>{totalScans || "—"}</strong> kali scan di riwayat.</p>
          <p><strong>{analyzedCount || "—"}</strong> di antaranya sudah selesai dianalisis dan masuk hitungan rata-rata.</p>
          <p className="muted">Scan yang masih processing atau gagal tidak punya skor, jadi tidak masuk rata-rata.</p>
        </Chapter>

        <p className="muted">Skor di atas berasal dari backend, bukan angka contoh. Kalau masih strip (—), berarti belum ada scan yang selesai dianalisis. <Link href="/history">Lihat riwayat lengkap</Link></p>
      </div>
    </div>
  );
}
