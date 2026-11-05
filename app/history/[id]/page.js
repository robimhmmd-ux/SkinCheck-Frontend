"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Scan, 
  ArrowLeft, 
  Calendar, 
  Sparkles, 
  Activity, 
  BarChart2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Layers,
  ChevronRight
} from "lucide-react";
import { getScanDetail, getHistory, pickObject, pickArray } from "../../../lib/api";
import { ErrorBox, Loading } from "../../../components/Notice";
import { SCORE_KEYS, averageScores, latestAnalyzedScan, fmtScore, fmtDate } from "../../../lib/scores";

function MetricRow({ label, value, colorClass = "amber" }) {
  const num = Number(value);
  const finite = value != null && Number.isFinite(num);
  const pct = finite ? Math.max(0, Math.min(100, num)) : 0;

  return (
    <div className="detail-metric-row">
      <div className="detail-metric-labels">
        <span className="metric-label-text">{label}</span>
        <strong className="metric-value-text">{finite ? `${num}%` : "—"}</strong>
      </div>
      <div className="detail-meter-track" aria-hidden="true">
        <div 
          className={`detail-meter-fill fill-${colorClass}`} 
          style={{ width: `${pct}%` }} 
        />
      </div>
    </div>
  );
}

function LedgerCard({ title, subtitle, analysis, icon: Icon = Activity }) {
  const colorMap = {
    overall_score: "navy",
    acne_score: "amber",
    dryness_score: "blue",
    oiliness_score: "peach",
    darkspots_score: "purple",
    wrinkles_score: "sage",
  };

  return (
    <div className="glass-panel detail-card">
      <div className="detail-card-head">
        <div className="detail-card-icon-wrap">
          <Icon size={18} />
        </div>
        <div>
          <h3 className="detail-card-title">{title}</h3>
          {subtitle && <p className="detail-card-subtitle">{subtitle}</p>}
        </div>
      </div>

      {!analysis ? (
        <div className="detail-empty-state">
          <Clock size={20} className="text-muted" />
          <p className="muted">Belum ada metrik untuk ditampilkan.</p>
        </div>
      ) : (
        <div className="detail-ledger-stack">
          {SCORE_KEYS.map(([key, label]) => (
            <MetricRow 
              key={key} 
              label={label} 
              value={analysis[key]} 
              colorClass={colorMap[key] || "amber"} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScanDetailPage({ params }) {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [d, h] = await Promise.allSettled([getScanDetail(params.id), getHistory()]);
        if (!alive) return;
        if (d.status === "fulfilled") setData(pickObject(d.value));
        if (h.status === "fulfilled") setHistory(pickArray(h.value));
        if (d.status === "rejected") setError(d.reason);
      } catch (e) {
        if (alive) setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [params.id]);

  if (loading) {
    return (
      <div className="page-shell-wrap">
        <div className="glass-panel" style={{ padding: "48px 32px", textAlign: "center" }}>
          <Loading label="Memuat detail sesi scan…" />
        </div>
      </div>
    );
  }

  const scan = data ? (data.scan || data) : {};
  const result = data ? (data.result || data.analysis || data.analysis_result || scan) : null;
  const analysis = result && result.acne_score != null ? result : (scan.analysis || null);
  const avg = averageScores(history);
  const latest = latestAnalyzedScan(history);
  const latestAnalysis = latest ? (latest.analysis || latest.analysis_result || latest.result) : null;

  const statusLabel = { completed: "Selesai", processing: "Diproses", failed: "Gagal" }[scan.status] || scan.status || "—";
  const statusBadge = scan.status === "completed" ? "badge-success" : scan.status === "failed" ? "badge-danger" : "badge-warning";

  return (
    <div className="page-shell-wrap">
      {/* ── Breadcrumb & Top Bar ── */}
      <div className="detail-top-bar">
        <Link href="/history" className="back-link-btn">
          <ArrowLeft size={16} /> Kembali ke Riwayat
        </Link>
        <div className="detail-actions-cluster">
          <Link href="/scan" className="btn btn-primary btn-sm">
            <Scan size={14} /> Scan Baru
          </Link>
          <Link href="/output" className="btn btn-secondary btn-sm">
            Dossier Laporan
          </Link>
        </div>
      </div>

      {/* ── Scan Header Info ── */}
      <div className="glass-panel detail-header-panel">
        <div className="detail-header-row">
          <div>
            <div className="detail-tag-row">
              <span className={`badge ${statusBadge}`}>
                {scan.status === "completed" ? <CheckCircle2 size={13} /> : <Clock size={13} />} {statusLabel}
              </span>
              <span className="badge badge-navy">ID #{params.id}</span>
            </div>
            <h1 className="detail-page-title">Sesi Pemindaian #{params.id}</h1>
            <p className="detail-page-date">
              <Calendar size={15} /> Dilakukan pada {fmtDate(scan.created_at || scan.created)}
            </p>
          </div>
          {analysis && analysis.overall_score != null && (
            <div className="detail-grand-score">
              <span className="grand-score-number">{fmtScore(analysis.overall_score)}%</span>
              <span className="grand-score-caption">Skor Keseluruhan</span>
            </div>
          )}
        </div>
      </div>

      <ErrorBox error={error} />

      {!error && (
        <div className="detail-content-layout">
          {scan.status === "processing" && (
            <div className="glass-panel detail-notice-box warning">
              <AlertTriangle size={20} className="notice-icon" />
              <div>
                <strong>Scan Masih Dalam Antrean Pemrosesan</strong>
                <p className="muted" style={{ margin: "4px 0 0" }}>
                  Foto scan tersimpan di server. Metrik VGG akan terisi secara otomatis setelah model neural menyelesaikan kalkulasi.
                </p>
              </div>
            </div>
          )}

          {scan.status === "failed" && (
            <div className="glass-panel detail-notice-box danger">
              <AlertTriangle size={20} className="notice-icon" />
              <div>
                <strong>Evaluasi Citra Tidak Selesai</strong>
                <p className="muted" style={{ margin: "4px 0 0" }}>
                  Kualitas foto mungkin buram atau pencahayaan kurang optimal saat pemindaian. Disarankan untuk mengambil foto ulang.
                </p>
              </div>
            </div>
          )}

          {/* ── Main Scan Output Card ── */}
          <LedgerCard 
            title="Hasil Analisis VGG Sesi Ini"
            subtitle="5 metrik kondisi kulit dari model deep learning"
            analysis={analysis}
            icon={Sparkles}
          />

          {/* AI Clinical Recommendation Note */}
          {(analysis && (analysis.ai_response || analysis.recommendation)) && (
            <div className="glass-panel detail-recommendation-card">
              <div className="recommendation-header">
                <Sparkles size={18} className="text-amber" />
                <h4>Catatan Analisis Klinis AI</h4>
              </div>
              <p className="recommendation-body">
                {analysis.ai_response || analysis.recommendation}
              </p>
            </div>
          )}

          {/* ── Comparative Dual Columns ── */}
          <div className="detail-dual-grid">
            <LedgerCard 
              title="Rata-rata Seluruh Riwayat"
              subtitle={avg ? `Dihitung dari ${avg.count} sesi sukses` : "Data agregat belum ada"}
              analysis={avg}
              icon={BarChart2}
            />
            <LedgerCard 
              title="Perbandingan Scan Terakhir"
              subtitle={latest ? fmtDate(latest.created_at) : "Belum ada scan lain"}
              analysis={latestAnalysis}
              icon={Activity}
            />
          </div>

          {/* Technical Raw Payload Collapse */}
          <details className="detail-debug-accordion">
            <summary className="detail-debug-summary">
              <Layers size={14} /> Inspeksi Payload Teknis (JSON Raw)
            </summary>
            <div className="detail-debug-code">
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
