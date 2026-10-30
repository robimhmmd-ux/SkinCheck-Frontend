"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getHistory, getDashboard, pickArray, pickObject } from "../../lib/api";
import { ErrorBox, Loading } from "../../components/Notice";
import { SCORE_KEYS, averageScores, latestAnalyzedScan, fmtScore, fmtDate } from "../../lib/scores";

// Halaman Output VGG.
// Skema buka/tutup card (sesuai permintaan user):
// - Masuk lewat scan (URL mengandung ?from=scan): card "5 output
//   scan terakhir" TERBUKA sejak awal, card lain tertutup.
// - Masuk langsung ke /output (tanpa ?from=scan): SEMUA card
//   tertutup, masing-masing hanya terbuka kalau diklik.
// Card dibuat kecil dan ringkas, bukan panel besar yang memenuhi
// layar: satu baris header yang bisa diklik + isi skor yang ringkas.
// Gambar wajah dot dipakai sebagai background besar di tengah
// halaman (section .output-hero), dengan overlay gelap supaya
// teks tetap terbaca. File: public/output-face.jpg.
function MiniCard({ id, title, subtitle, open, onToggle, children, posClass }) {
  return (
    <div className={`output-card ${posClass || ""} ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="output-card-head"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`output-card-${id}`}
      >
        <span>
          <strong>{title}</strong>
          <span className="muted">{subtitle}</span>
        </span>
        <span className="output-card-icon" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="output-card-body" id={`output-card-${id}`}>
          {children}
        </div>
      )}
    </div>
  );
}

function ScoreList({ analysis }) {
  if (!analysis) return <p className="muted">Belum ada skor untuk ditampilkan.</p>;
  return (
    <div>
      {SCORE_KEYS.map(([key, label]) => {
        const raw = Number(analysis[key]);
        const hasBar = Number.isFinite(raw) && raw >= 0 && raw <= 100;
        return (
          <div key={key} className="me-score-row out-score-row">
            <div className="out-score-top"><span>{label}</span><b>{fmtScore(analysis[key])}</b></div>
            {hasBar && (
              <div className="out-bar" aria-hidden="true"><span style={{ width: `${raw}%` }} /></div>
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
  const [openCard, setOpenCard] = useState(null); // null | "latest" | "all" | "count"

  useEffect(() => {
    // Baca penanda asal di client saja (tanpa useSearchParams,
    // supaya tidak butuh Suspense boundary): kalau URL-nya
    // ?from=scan, berarti user baru saja menyelesaikan scan.
    try {
      const from = new URLSearchParams(window.location.search).get("from");
      if (from === "scan") setOpenCard("latest");
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
    setOpenCard((cur) => (cur === id ? null : id));
  }

  if (loading) return <div className="card"><Loading label="Memuat hasil…" /></div>;

  const scans = history.length ? history : pickArray(dash && (dash.recent_scans || dash.scans || dash));
  const avg = averageScores(scans);
  const latest = latestAnalyzedScan(scans);
  const latestAnalysis = latest ? (latest.analysis || latest.analysis_result || latest.result) : null;
  const totalScans = scans.length;
  const analyzedCount = avg ? avg.count : 0;

  return (
    <div className="output-full">
      {/* Gambar manusia jadi background FULLSCREEN halaman ini,
          bukan lagi card di tengah. Overlay gelap tipis supaya
          teks dan card tetap terbaca di atas gambar. */}
      <div className="output-full-top">
        <div>
          <h1>Output</h1>
          <p>Hasil analisis VGG untuk kulit wajahmu. Klik sebuah card untuk membuka atau menutupnya.</p>
        </div>
        <div className="output-full-actions">
          <Link className="me-cta" href="/scan">Scan baru</Link>
          <Link className="me-cta ghost light" href="/dashboard">Dashboard</Link>
        </div>
      </div>
      <ErrorBox error={error} />
      {error && error.status === 401 && <p className="output-full-note">Sepertinya kamu belum masuk. <Link href="/login">Masuk dulu</Link> untuk melihat hasilmu.</p>}

      <div className="output-full-headline">
        <p className="output-brand">SkinCheck untuk analisis wajah</p>
        <h2>{latest ? `Scan terakhir #${latest.id}` : "Belum ada hasil scan"}</h2>
        <p>{latest ? `${fmtDate(latest.created_at)}, status ${latest.status || "—"}` : "Lakukan scan dulu, lalu hasilnya akan tampil di sini."}</p>
      </div>

      {/* Card kecil, TIDAK dijejer rapi: disebar zigzag di atas
          background — atas kanan kepala, tengah kiri samping pipi,
          bawah kanan samping dagu. Di layar kecil, card kembali
          tersusun vertikal supaya tetap terbaca. */}
      <div className="output-scatter">
        <MiniCard
          id="latest"
          posClass="pos-latest"
          title="5 output scan terakhir"
          subtitle={latest ? `Scan #${latest.id} · ${fmtDate(latest.created_at)}` : "Belum ada scan terakhir"}
          open={openCard === "latest"}
          onToggle={() => toggle("latest")}
        >
          <ScoreList analysis={latestAnalysis} />
          {latest && <p className="muted"><Link href={`/history/${latest.id}`}>Lihat detail scan ini</Link></p>}
        </MiniCard>

        <MiniCard
          id="all"
          posClass="pos-all"
          title="Rata-rata 5 output seluruh scan"
          subtitle={avg ? `Dari ${avg.count} scan yang selesai dianalisis` : "Belum bisa dihitung"}
          open={openCard === "all"}
          onToggle={() => toggle("all")}
        >
          <ScoreList analysis={avg} />
        </MiniCard>

        <MiniCard
          id="count"
          posClass="pos-count"
          title="Berapa kali scan"
          subtitle={totalScans ? `${totalScans} kali scan di riwayat` : "Belum ada scan"}
          open={openCard === "count"}
          onToggle={() => toggle("count")}
        >
          <p><strong>{totalScans || "—"}</strong> kali scan di riwayat.</p>
          <p><strong>{analyzedCount || "—"}</strong> di antaranya sudah selesai dianalisis dan masuk hitungan rata-rata.</p>
          <p className="muted">Scan yang masih processing atau gagal tidak punya skor, jadi tidak masuk rata-rata.</p>
        </MiniCard>
      </div>

      <p className="output-full-foot">Skor di atas berasal dari backend, bukan angka contoh. Kalau masih strip (—), berarti belum ada scan yang selesai dianalisis. <Link href="/history">Lihat riwayat lengkap</Link></p>
    </div>
  );
}
