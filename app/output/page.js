"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  Scan, 
  Activity, 
  BarChart3,
  ExternalLink
} from "lucide-react";
import { getHistory, getDashboard, pickArray, pickObject } from "../../lib/api";
import { ErrorBox, Loading } from "../../components/Notice";
import { SCORE_KEYS, averageScores, latestAnalyzedScan, fmtScore, fmtDate } from "../../lib/scores";

function Chapter({ id, title, subtitle, open, onToggle, children }) {
  return (
    <div className={`output-accordion-item ${open ? "open" : ""}`}>
      <button
        type="button"
        className="output-accordion-header"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`output-section-${id}`}
      >
        <div className="output-header-content">
          <div className="output-header-title-row">
            <span className="output-section-tag">BAB {id.toUpperCase()}</span>
            <strong className="output-accordion-title">{title}</strong>
          </div>
          {subtitle && <span className="output-accordion-subtitle">{subtitle}</span>}
        </div>
        <div className="output-header-chevron">
          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      {open && (
        <div className="output-accordion-body" id={`output-section-${id}`}>
          {children}
        </div>
      )}
    </div>
  );
}

function MetricScaleBar({ label, value, colorClass = "amber" }) {
  const num = Number(value);
  const finite = Number.isFinite(num);
  const pct = finite ? Math.max(0, Math.min(100, num)) : 0;

  return (
    <div className="output-metric-row">
      <div className="output-metric-info">
        <span className="output-metric-name">{label}</span>
        <span className="output-metric-val">{finite ? `${num}%` : "—"}</span>
      </div>
      <div className="output-meter-track" aria-hidden="true">
        <div 
          className={`output-meter-fill fill-${colorClass}`} 
          style={{ width: `${pct}%` }} 
        />
      </div>
    </div>
  );
}

function ScaleLedger({ analysis }) {
  if (!analysis) {
    return (
      <div className="empty-ledger-box">
        <Clock size={20} className="text-muted" />
        <p className="muted">Belum ada data skor yang terekam.</p>
      </div>
    );
  }

  const colorMap = {
    acne_score: "amber",
    dryness_score: "blue",
    oiliness_score: "peach",
    darkspots_score: "purple",
    wrinkles_score: "navy",
  };

  return (
    <div className="output-ledger-stack">
      {SCORE_KEYS.map(([key, label]) => (
        <MetricScaleBar 
          key={key} 
          label={label} 
          value={analysis[key]} 
          colorClass={colorMap[key] || "amber"} 
        />
      ))}
    </div>
  );
}

export default function OutputPage() {
  const [history, setHistory] = useState([]);
  const [dash, setDash] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState(null);

  useEffect(() => {
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
      } catch (e) {
        if (alive) setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  function toggle(id) {
    setOpenSection((cur) => (cur === id ? null : id));
  }

  if (loading) {
    return (
      <div className="page-shell-wrap">
        <div className="glass-panel" style={{ padding: "48px 32px", textAlign: "center" }}>
          <Loading label="Menyiapkan berkas dossier klinis…" />
        </div>
      </div>
    );
  }

  const scans = history.length ? history : pickArray(dash && (dash.recent_scans || dash.scans || dash));
  const avg = averageScores(scans);
  const latest = latestAnalyzedScan(scans);
  const latestAnalysis = latest ? (latest.analysis || latest.analysis_result || latest.result) : null;
  const totalScans = scans.length;
  const analyzedCount = avg ? avg.count : 0;
  const latestStatus = latest ? ({ completed: "Selesai", processing: "Diproses", failed: "Gagal" }[latest.status] || latest.status || "—") : null;

  return (
    <div className="page-shell-wrap">
      {/* ── Page Hero Header ── */}
      <div className="dossier-hero-header">
        <div className="badge badge-amber" style={{ margin: "0 auto 12px" }}>
          <FileText size={14} /> DOSSIER KLINIS VGG
        </div>
        <h1 className="dossier-title">Laporan Analisis Kulit</h1>
        <p className="dossier-subtitle">
          Rekapitulasi komprehensif metrik kulit wajah berdasarkan model convolutional VGG.
        </p>
        <div className="dossier-actions-row">
          <Link className="btn btn-primary btn-sm" href="/scan">
            <Scan size={15} /> Scan Baru
          </Link>
          <Link className="btn btn-secondary btn-sm" href="/dashboard">
            <Activity size={15} /> Dashboard
          </Link>
          <Link className="btn btn-secondary btn-sm" href="/history">
            <Clock size={15} /> Riwayat
          </Link>
        </div>
      </div>

      <ErrorBox error={error} />
      {error && error.status === 401 && (
        <div className="glass-panel" style={{ padding: "20px", marginBottom: "24px", textAlign: "center" }}>
          <p className="muted" style={{ margin: 0 }}>
            Sepertinya kamu belum masuk. <Link href="/login" style={{ fontWeight: 600 }}>Masuk dulu</Link> untuk melihat hasil lengkapmu.
          </p>
        </div>
      )}

      {/* ── Main Highlight Dossier Card ── */}
      <div className="glass-panel dossier-main-card">
        <div className="dossier-grid">
          {/* Visual Portrait Column */}
          <div className="dossier-visual-col">
            <div className="dossier-portrait-frame">
              <Image 
                src="/output-face.jpg" 
                alt="Ilustrasi Wajah Dermatologis" 
                width={400} 
                height={480} 
                className="dossier-portrait-img"
                priority={false} 
              />
              <div className="portrait-badge-overlay">
                <Sparkles size={14} /> AI Evaluated
              </div>
            </div>
          </div>

          {/* Metric Details Column */}
          <div className="dossier-details-col">
            <div className="dossier-status-bar">
              <span className="badge badge-navy">
                {latest ? `Scan Terakhir #${latest.id}` : "Belum Ada Riwayat"}
              </span>
              {latestStatus && (
                <span className={`badge ${latestStatus === "Selesai" ? "badge-success" : latestStatus === "Gagal" ? "badge-danger" : "badge-warning"}`}>
                  {latestStatus}
                </span>
              )}
            </div>

            <div className="dossier-overall-score-box">
              <div className="score-number-display">
                <span className="score-giant-val">
                  {latestAnalysis && latestAnalysis.overall_score != null 
                    ? fmtScore(latestAnalysis.overall_score) 
                    : "—"}
                </span>
                <span className="score-giant-unit">%</span>
              </div>
              <div className="score-desc-block">
                <strong>Skor Kesehatan Kulit Keseluruhan</strong>
                <p className="muted">
                  {latest ? `Dianalisis pada ${fmtDate(latest.created_at)}` : "Lakukan pemindaian wajah untuk mengaktifkan kalkulasi skor."}
                </p>
              </div>
            </div>

            {/* Top finding alert */}
            {(() => {
              if (!latestAnalysis) return null;
              let top = null;
              for (const [key, label] of SCORE_KEYS) {
                if (key === "overall_score") continue;
                const v = Number(latestAnalysis[key]);
                if (Number.isFinite(v) && (top === null || v > top.value)) top = { label, value: v };
              }
              if (!top) return null;
              return (
                <div className="dossier-highlight-finding">
                  <span className="finding-indicator" />
                  <span>
                    Fokus Utama: <strong>{top.label} ({top.value}%)</strong> menunjukkan persentase tertinggi yang membutuhkan perawatan tertarget.
                  </span>
                </div>
              );
            })()}

            {/* Quick 5 metric overview */}
            <div className="dossier-quick-ledger">
              <h4 className="ledger-title">
                <BarChart3 size={16} /> Distribusi Kondisi Kulit
              </h4>
              <ScaleLedger analysis={latestAnalysis} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Accordion Chapters ── */}
      <div className="dossier-chapters-wrapper">
        <Chapter
          id="latest"
          title="Detail 5 Metrik Scan Terakhir"
          subtitle={latest ? `Scan #${latest.id} • ${fmtDate(latest.created_at)}` : "Belum ada scan terakhir"}
          open={openSection === "latest"}
          onToggle={() => toggle("latest")}
        >
          <div className="chapter-inner-content">
            <ScaleLedger analysis={latestAnalysis} />
            {latest && (
              <div className="chapter-actions-footer">
                <Link className="btn btn-secondary btn-sm" href={`/history/${latest.id}`}>
                  Inspeksi Scan Ini <ExternalLink size={14} />
                </Link>
              </div>
            )}
          </div>
        </Chapter>

        <Chapter
          id="all"
          title="Rata-rata Akumulatif Seluruh Scan"
          subtitle={avg ? `Dihitung dari ${avg.count} sesi scan terverifikasi` : "Data agregat belum mencukupi"}
          open={openSection === "all"}
          onToggle={() => toggle("all")}
        >
          <div className="chapter-inner-content">
            <p className="muted" style={{ marginBottom: "16px" }}>
              Perbandingan tren kulit kamu dari total pemindaian yang telah berhasil diselesaikan:
            </p>
            <ScaleLedger analysis={avg} />
          </div>
        </Chapter>

        <Chapter
          id="count"
          title="Audit Volume Pemindaian"
          subtitle={totalScans ? `${totalScans} sesi tercatat di database` : "Belum ada sesi scan"}
          open={openSection === "count"}
          onToggle={() => toggle("count")}
        >
          <div className="chapter-inner-content audit-counts-grid">
            <div className="audit-stat-card">
              <span className="audit-stat-num">{totalScans || "0"}</span>
              <span className="audit-stat-lbl">Total Pemindaian Tercatat</span>
            </div>
            <div className="audit-stat-card">
              <span className="audit-stat-num">{analyzedCount || "0"}</span>
              <span className="audit-stat-lbl">Tuntas Teranalisis (VGG)</span>
            </div>
            <div className="audit-stat-card">
              <span className="audit-stat-num">
                {totalScans && analyzedCount ? `${Math.round((analyzedCount / totalScans) * 100)}%` : "0%"}
              </span>
              <span className="audit-stat-lbl">Tingkat Keberhasilan Sesi</span>
            </div>
          </div>
        </Chapter>
      </div>

      <div className="dossier-footer-note">
        <p className="muted">
          Semua metrik diekstrak langsung dari pemrosesan AI convolutional backend Laomera.
          Kunjungi <Link href="/history" style={{ fontWeight: 600 }}>Riwayat Scan</Link> untuk melihat seluruh lini masa pemindaianmu.
        </p>
      </div>
    </div>
  );
}
