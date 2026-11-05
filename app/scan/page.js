"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Camera,
  Layers,
  UploadCloud,
  RotateCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileImage,
  ArrowRight,
  Eye,
  Activity,
  Play,
  Square,
  RefreshCw,
} from "lucide-react";
import { uploadScan, uploadMultiScan, pickObject, getMe } from "../../lib/api";
import { ErrorBox } from "../../components/Notice";

const SCORES = [
  ["acne_score", "Jerawat"],
  ["dry_skin_score", "Kulit kering"],
  ["oily_skin_score", "Kulit berminyak"],
  ["dark_spots_score", "Dark spots"],
  ["wrinkles_score", "Kerutan"],
  ["redness_score", "Kemerahan"],
  ["texture_score", "Tekstur"],
  ["hyperpigmentation_score", "Hiperpigmentasi"],
  ["overall_score", "Skor keseluruhan"],
];

const POSES = [
  { key: "center", label: "Hadap Depan (Center)", sec: 4 },
  { key: "left", label: "Tengok Kiri Sedikit (Pipi Kiri)", sec: 8 },
  { key: "right", label: "Tengok Kanan Sedikit (Pipi Kanan)", sec: 12 },
  { key: "up", label: "Dongak Sedikit (Area Dagu)", sec: 16 },
  { key: "down", label: "Nunduk Sedikit (Area Dahi)", sec: 20 },
  { key: "close", label: "Maju Sedikit (Detail Tekstur)", sec: 24 },
];

async function compressImageForMobile(file, maxDimension = 1280, quality = 0.85) {
  if (!file || !file.type.startsWith("image/")) return file;
  if (file.size < 600 * 1024) return file;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxDimension || h > maxDimension) {
        if (w > h) {
          h = Math.round((h * maxDimension) / w);
          w = maxDimension;
        } else {
          w = Math.round((w * maxDimension) / h);
          h = maxDimension;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

const POSE_SCORE_KEYS = [
  ["acne_score", "Jerawat"],
  ["dry_skin_score", "Kering"],
  ["oily_skin_score", "Berminyak"],
  ["dark_spots_score", "Dark spots"],
  ["wrinkles_score", "Kerutan"],
];

function topCondition(entry) {
  let best = null;
  for (const [key, label] of POSE_SCORE_KEYS) {
    const v = Number(entry[key]);
    if (Number.isFinite(v) && (best === null || v > best.value)) best = { label, value: v };
  }
  return best;
}

export default function ScanPage() {
  const [mode, setMode] = useState("single"); // "single" | "multi"
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Webcam multi-pose capture state
  const [webcamActive, setWebcamActive] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [flipPreview, setFlipPreview] = useState(true);
  const [recording, setRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [currentPose, setCurrentPose] = useState("");
  const [recordedFrames, setRecordedFrames] = useState([]);
  const [recordedPoses, setRecordedPoses] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    getMe()
      .then((user) => setCurrentUser(user))
      .catch(() => setCurrentUser(null));

    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (webcamActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [webcamActive]);

  async function startCamera(desiredFacing = facingMode) {
    setError(null);
    stopCamera();

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: desiredFacing,
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: desiredFacing },
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setFacingMode(desiredFacing);
      setFlipPreview(desiredFacing === "user");
      setWebcamActive(true);
    } catch (err) {
      let msg = "Tidak dapat mengakses kamera. Pastikan izin kamera aktif di browser.";
      if (err && err.name === "NotAllowedError") {
        msg = "Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.";
      }
      setError(new Error(msg));
    }
  }

  function toggleCamera() {
    const nextFacing = facingMode === "user" ? "environment" : "user";
    startCamera(nextFacing);
  }

  function stopCamera() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setWebcamActive(false);
    setRecording(false);
    setTimer(0);
  }

  function startMultiCapture() {
    if (!videoRef.current) return;
    setRecordedFrames([]);
    setRecordedPoses([]);
    setResult(null);
    setError(null);
    setRecording(true);
    setTimer(0);
    setCurrentPose(POSES[0].label);

    const frames = [];
    const framePoses = [];
    const startTime = Date.now();
    let lastCaptureSec = -1;

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimer(elapsed);

      const p = POSES.find((pos) => elapsed <= pos.sec) || POSES[POSES.length - 1];
      setCurrentPose(p.label);

      if (videoRef.current && canvasRef.current && elapsed > lastCaptureSec + 1) {
        lastCaptureSec = elapsed;
        const vid = videoRef.current;
        const cvs = canvasRef.current;
        const maxW = 640;
        const maxH = 480;
        cvs.width = Math.min(vid.videoWidth || maxW, maxW);
        cvs.height = Math.min(vid.videoHeight || maxH, maxH);
        const ctx = cvs.getContext("2d");
        ctx.drawImage(vid, 0, 0, cvs.width, cvs.height);

        cvs.toBlob(
          (blob) => {
            if (blob) {
              const frameFile = new File([blob], `frame_${Date.now()}.jpg`, { type: "image/jpeg" });
              frames.push(frameFile);
              framePoses.push(p.key);
              setRecordedFrames([...frames]);
              setRecordedPoses([...framePoses]);
            }
          },
          "image/jpeg",
          0.80
        );
      }

      if (elapsed >= 24) {
        clearInterval(intervalRef.current);
        finishRecording(frames, framePoses);
      }
    }, 500);
  }

  async function finishRecording(framesToUpload, posesToUpload) {
    setRecording(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const validFrames = framesToUpload && framesToUpload.length > 0 ? framesToUpload : recordedFrames;
    const validPoses = posesToUpload && posesToUpload.length > 0 ? posesToUpload : recordedPoses;
    if (validFrames.length === 0) {
      setError(new Error("Tidak ada frame yang berhasil direkam. Silakan ulangi."));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await uploadMultiScan(validFrames, validPoses);
      setResult(pickObject(res));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  function onFile(e) {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
    setPreview(f ? URL.createObjectURL(f) : "");
    setResult(null);
    setError(null);
  }

  async function onSubmitSingle(e) {
    e.preventDefault();
    if (!file) {
      setError(new Error("Pilih foto wajah terlebih dahulu."));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const readyFile = await compressImageForMobile(file);
      const res = await uploadScan(readyFile);
      setResult(pickObject(res));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const scanId = result && (result.scan_id || result.id);
  const analysis = result && (result.analysis || result.analysis_result || null);
  // Status dari backend: "completed" / "failed" / "processing". Backend selalu
  // membalas 201 bahkan saat analisis gagal (analysis = null) — jadi hasil
  // gagal HARUS ditampilkan sendiri, bukan disembunyikan. Versi halaman ini
  // sebelumnya hanya merender panel sukses (result && analysis), sehingga
  // scan yang gagal tampak seperti "tidak ada loading dan tidak ada output".
  const resultStatus = result && (result.status || "");
  const resultFailed = Boolean(result) && !analysis;

  return (
    <div className="scanner-stage-wrap">
      {/* Header */}
      <div>
        <div className="badge badge-amber" style={{ marginBottom: "8px" }}>
          <Camera size={13} aria-hidden="true" />
          <span>PEMINDAI WAJAH AI</span>
        </div>
        <h1>Scan Wajah & Deteksi Kondisi Kulit</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14.5px", margin: "4px 0 0" }}>
          Posisikan wajahmu tegak dengan pencahayaan merata. Sistem mendeteksi tanda jerawat, minyak, kekeringan, noda gelap, dan garis halus.
        </p>
      </div>

      {!currentUser && (
        <div className="glass-panel" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", background: "var(--amber-100)", borderColor: "rgba(217, 136, 42, 0.3)" }}>
          <Sparkles size={18} color="var(--amber-700)" />
          <span style={{ fontSize: "13.5px", color: "var(--amber-700)" }}>
            <strong>Mode Uji Coba Cepat:</strong> Kamu bisa langsung memindai tanpa login. Hasil akan langsung tampil di sini. <Link href="/login" style={{ textDecoration: "underline", fontWeight: 700 }}>Masuk</Link> jika ingin menyimpan ke riwayat akun.
          </span>
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div style={{ display: "inline-flex", background: "var(--sand-200)", padding: "4px", borderRadius: "var(--radius-pill)", width: "fit-content", gap: "4px" }}>
        <button
          type="button"
          onClick={() => {
            setMode("single");
            stopCamera();
          }}
          className={`btn btn-sm ${mode === "single" ? "btn-primary" : "btn-ghost"}`}
        >
          <FileImage size={15} />
          <span>Upload Foto</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("multi")}
          className={`btn btn-sm ${mode === "multi" ? "btn-primary" : "btn-ghost"}`}
        >
          <Camera size={15} />
          <span>Kamera Live Pose</span>
        </button>
      </div>

      <ErrorBox error={error} />

      {/* ── MODE 1: FOTO TUNGGAL (UPLOAD) ── */}
      {mode === "single" && (
        <div className="glass-panel" style={{ padding: "36px" }}>
          <form onSubmit={onSubmitSingle}>
            <label
              htmlFor="skin-file-input"
              className="dropzone-upload-panel"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
            >
              {preview ? (
                <div style={{ position: "relative" }}>
                  <img
                    src={preview}
                    alt="Preview wajah terpilih"
                    style={{ maxWidth: "320px", maxHeight: "320px", borderRadius: "16px", objectFit: "cover", boxShadow: "var(--shadow-md)" }}
                  />
                  <div style={{ marginTop: "14px", fontSize: "13px", color: "var(--brand-amber)", fontWeight: 600 }}>
                    Klik untuk mengganti foto
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "var(--sand-100)", color: "var(--brand-amber)", display: "grid", placeItems: "center", marginBottom: "14px" }}>
                    <UploadCloud size={28} />
                  </div>
                  <strong style={{ fontSize: "16px", color: "var(--brand-navy)", marginBottom: "4px" }}>
                    Pilih atau Geser Foto Wajah ke Sini
                  </strong>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    Format JPG atau PNG (Maks 10MB). Kompresi otomatis saat upload.
                  </span>
                </>
              )}
              <input
                id="skin-file-input"
                type="file"
                accept="image/*"
                onChange={onFile}
                style={{ display: "none" }}
              />
            </label>

            <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              {preview && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setFile(null);
                    setPreview("");
                  }}
                  disabled={busy}
                >
                  Hapus
                </button>
              )}
              <button
                type="submit"
                className="btn btn-amber"
                disabled={busy || !file}
                style={{ minWidth: "160px" }}
              >
                {busy ? (
                  <>
                    <Activity className="animate-spin" size={16} />
                    <span>Menganalisis…</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Mulai Analisis AI</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODE 2: KAMERA LIVE MULTI-POSE ── */}
      {mode === "multi" && (
        <div className="glass-panel" style={{ padding: "32px" }}>
          {!webcamActive ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "var(--sand-100)", color: "var(--brand-amber)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
                <Camera size={28} />
              </div>
              <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>Aktifkan Kamera Perangkat</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", maxWidth: "480px", margin: "0 auto 24px" }}>
                Kamera akan membantumu merekam pose wajah dari sudut depan, pipi kiri, pipi kanan, dahi, dan dagu secara otomatis.
              </p>
              <button type="button" className="btn btn-amber" onClick={() => startCamera("user")}>
                Buka Kamera Sekarang
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div className="scanner-viewfinder-box">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="scanner-video-feed"
                  style={{ transform: flipPreview ? "scaleX(-1)" : "none" }}
                />

                {/* Oval Guide & Beam */}
                <div className="viewfinder-face-reticle">
                  {recording && <div className="reticle-scanning-beam" />}
                </div>

                {/* Status Bar inside Camera */}
                <div style={{ position: "absolute", top: "14px", left: "14px", right: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="badge badge-amber" style={{ background: "rgba(0,0,0,0.65)", color: "#ffffff", backdropFilter: "blur(6px)" }}>
                    {recording ? `Merekam: ${timer}s / 24s` : "Kamera Siap"}
                  </span>
                  <button
                    type="button"
                    onClick={toggleCamera}
                    className="btn btn-secondary btn-sm"
                    style={{ background: "rgba(0,0,0,0.65)", color: "#ffffff", border: 0 }}
                    title="Ganti kamera depan/belakang"
                  >
                    <RotateCw size={14} />
                    <span>Putar</span>
                  </button>
                </div>

                {/* Pose Instruction Prompt */}
                {recording && (
                  <div style={{ position: "absolute", bottom: "16px", left: "16px", right: "16px", textAlign: "center", background: "rgba(23, 32, 51, 0.85)", backdropFilter: "blur(8px)", color: "#ffffff", padding: "10px 16px", borderRadius: "var(--radius-pill)" }}>
                    <strong style={{ color: "var(--amber-400)", fontSize: "14px" }}>
                      Panduan Pose: {currentPose}
                    </strong>
                  </div>
                )}
              </div>

              {/* Indikator upload: selama busy, tombol di bawah hanya
                  nonaktif tanpa teks apa pun — inilah kenapa mode kamera
                  terasa "tidak ada loading". Banner ini tampil selama
                  upload/analisis berjalan. */}
              {busy && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--sand-100)", border: "1px solid var(--border-subtle)", padding: "12px 16px", borderRadius: "var(--radius-md)", fontSize: "14px", color: "var(--brand-navy)" }}>
                  <Activity className="animate-spin" size={18} />
                  <span><strong>Menganalisis frame…</strong> Mohon tunggu, proses ini bisa memakan waktu beberapa detik.</span>
                </div>
              )}

              {/* Camera Controls */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={stopCamera}>
                  Matikan Kamera
                </button>

                <div style={{ display: "flex", gap: "10px" }}>
                  {!recording ? (
                    <button type="button" className="btn btn-amber" onClick={startMultiCapture} disabled={busy}>
                      <Play size={16} />
                      <span>Mulai Perekaman (24 Detik)</span>
                    </button>
                  ) : (
                    <button type="button" className="btn btn-primary" onClick={() => finishRecording()} disabled={busy}>
                      <Square size={16} />
                      <span>Selesaikan Sekarang ({recordedFrames.length} frame)</span>
                    </button>
                  )}
                </div>
              </div>

              <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>
          )}
        </div>
      )}

      {/* ── 3b. HASIL GAGAL / MASIH DIPROSES (JANGAN DISEMBUNYIKAN) ── */}
      {resultFailed && (
        <div className="glass-panel" style={{ padding: "32px", border: "1.5px solid rgba(217, 136, 42, 0.5)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <AlertCircle size={24} color="#b45309" />
            <h2 style={{ fontSize: "22px" }}>
              {resultStatus === "processing" ? "Scan masih diproses" : "Analisis belum berhasil"}
            </h2>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "14.5px", marginBottom: "20px" }}>
            {result.message || "Analisis AI gagal diproses."}
            {scanId ? ` (Scan #${scanId})` : ""}
          </p>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "20px", fontSize: "14px" }}>
            {result.frames_captured != null && (
              <span>Frame direkam: <strong>{result.frames_captured}</strong></span>
            )}
            {result.frames_passed_yunet != null && (
              <span>Lolos deteksi wajah: <strong>{result.frames_passed_yunet}</strong></span>
            )}
            {result.frames_used_vgg != null && (
              <span>Dianalisis: <strong>{result.frames_used_vgg}</strong></span>
            )}
          </div>
          <p style={{ fontSize: "13.5px", color: "var(--text-muted)" }}>
            Silakan coba lagi dengan pencahayaan merata dan wajah menghadap kamera. Kalau pesan di atas menyebut wajah tidak terdeteksi, itu alasan aslinya dari backend, bukan sekadar tebakan.
          </p>
          {scanId && (
            <div style={{ marginTop: "16px" }}>
              <Link href={`/history/${scanId}`} className="btn btn-secondary">
                <span>Lihat scan ini di Riwayat</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── 3. HASIL ANALISIS REAL-TIME (JIKA SELESAI) ── */}
      {result && analysis && (
        <div className="glass-panel" style={{ padding: "36px", border: "1.5px solid var(--brand-amber)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <CheckCircle2 size={24} color="var(--sage-600)" />
            <h2 style={{ fontSize: "24px" }}>Hasil Analisis AI Berhasil Diterbitkan</h2>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "16px", margin: "16px 0 24px" }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "72px", fontWeight: 700, color: "var(--brand-navy)", lineHeight: 1 }}>
              {analysis.overall_score != null ? `${analysis.overall_score}%` : "—"}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "15px" }}>
              <strong>Skor Kesehatan Keseluruhan</strong>
              <div>Scan #{scanId || "Baru"} telah selesai diproses.</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
            {SCORES.map(([key, label]) => {
              if (key === "overall_score") return null;
              const val = analysis[key];
              return (
                <div key={key} style={{ background: "var(--sand-50)", padding: "14px 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{label}</div>
                  <strong style={{ fontSize: "20px", color: "var(--brand-navy)" }}>
                    {val != null ? `${val}%` : "—"}
                  </strong>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href={`/history/${scanId}`} className="btn btn-primary">
              <span>Buka Detail Diagnosis</span>
              <ArrowRight size={16} />
            </Link>
            <Link href="/assistant" className="btn btn-secondary">
              <span>Diskusikan dengan Asisten AI</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
