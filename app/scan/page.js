"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { uploadScan, uploadMultiScan, pickObject } from "../../lib/api";
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
  { label: "Hadap Depan (Center)", sec: 10 },
  { label: "Tengok Kiri Sedikit (Pipi Kiri)", sec: 20 },
  { label: "Tengok Kanan Sedikit (Pipi Kanan)", sec: 30 },
  { label: "Dongak Sedikit (Area Dagu)", sec: 40 },
  { label: "Nunduk Sedikit (Area Dahi)", sec: 50 },
  { label: "Maju & Mundur Sedikit", sec: 60 },
];

export default function ScanPage() {
  const [mode, setMode] = useState("single"); // "single" | "multi"
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  // Webcam multi-pose capture state
  const [webcamActive, setWebcamActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [currentPose, setCurrentPose] = useState("");
  const [recordedFrames, setRecordedFrames] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setWebcamActive(true);
    } catch (err) {
      setError(new Error("Tidak dapat mengakses kamera webcam. Pastikan izin kamera aktif."));
    }
  }

  function stopCamera() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setWebcamActive(false);
    setRecording(false);
  }

  function startMultiCapture() {
    setRecordedFrames([]);
    setResult(null);
    setError(null);
    setRecording(true);
    setTimer(0);
    setCurrentPose(POSES[0].label);

    const frames = [];
    const startTime = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimer(elapsed);

      // Determine current pose prompt
      const p = POSES.find((pos) => elapsed <= pos.sec) || POSES[POSES.length - 1];
      setCurrentPose(p.label);

      // Capture frame onto hidden canvas
      if (videoRef.current && canvasRef.current) {
        const vid = videoRef.current;
        const cvs = canvasRef.current;
        cvs.width = vid.videoWidth || 640;
        cvs.height = vid.videoHeight || 480;
        const ctx = cvs.getContext("2d");
        ctx.drawImage(vid, 0, 0, cvs.width, cvs.height);

        cvs.toBlob(
          (blob) => {
            if (blob) {
              const frameFile = new File([blob], `frame_${Date.now()}.png`, { type: "image/png" });
              frames.push(frameFile);
              setRecordedFrames([...frames]);
            }
          },
          "image/png",
          0.85
        );
      }

      // Finish at 60 seconds (or early stop if user clicks)
      if (elapsed >= 60) {
        clearInterval(intervalRef.current);
        finishRecording(frames);
      }
    }, 250); // capture 4-5 fps to keep memory safe in browser
  }

  async function finishRecording(framesToUpload) {
    setRecording(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const validFrames = framesToUpload && framesToUpload.length > 0 ? framesToUpload : recordedFrames;
    if (validFrames.length === 0) {
      setError(new Error("Tidak ada frame yang berhasil direkam."));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await uploadMultiScan(validFrames);
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
      setError(new Error("Pilih foto wajah dulu."));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await uploadScan(file);
      setResult(pickObject(res));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const scanId = result && (result.scan_id || result.id);
  const analysis = result && (result.analysis || result.analysis_result || null);
  const status = result && result.status;

  return (
    <div className="card" style={{ maxWidth: 800, margin: "20px auto" }}>
      <h1>Scan Wajah & Analisis Kulit</h1>
      <p className="muted">
        Analisis kondisi kulit wajah (jerawat, minyak, kekeringan, noda hitam, dan kerutan) menggunakan deteksi wajah YuNet dan model VGG16.
      </p>

      {/* Mode Selector */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => { setMode("single"); stopCamera(); }}
          className={`btn ${mode === "single" ? "" : "secondary"}`}
        >
          Foto Tunggal (Upload)
        </button>
        <button
          type="button"
          onClick={() => { setMode("multi"); }}
          className={`btn ${mode === "multi" ? "" : "secondary"}`}
        >
          Webcam Multi-Pose (Realtime)
        </button>
      </div>

      <ErrorBox error={error} />

      {mode === "single" ? (
        <form onSubmit={onSubmitSingle}>
          <label>
            Foto wajah
            <input type="file" accept="image/*" onChange={onFile} />
          </label>
          {preview && <img className="preview" src={preview} alt="Pratinjau foto wajah" style={{ maxHeight: 320, objectFit: "contain" }} />}
          <button className="btn" disabled={busy} style={{ marginTop: 10 }}>
            {busy ? "Menganalisis Foto..." : "Analisis Foto"}
          </button>
        </form>
      ) : (
        <div>
          {!webcamActive ? (
            <div style={{ textAlign: "center", padding: "30px 20px", background: "var(--cream)", borderRadius: 12 }}>
              <p>Aktifkan webcam untuk memulai panduan pemindaian multi-sudut wajah (60 detik).</p>
              <button type="button" onClick={startCamera} className="btn">
                Buka Kamera
              </button>
            </div>
          ) : (
            <div>
              <div style={{ position: "relative", width: "100%", maxWidth: 540, margin: "0 auto", borderRadius: 14, overflow: "hidden", background: "#000" }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", display: "block" }} />
                <canvas ref={canvasRef} style={{ display: "none" }} />

                {recording && (
                  <div
                    style={{
                      position: "absolute",
                      top: 14,
                      left: 14,
                      right: 14,
                      background: "rgba(0,0,0,0.65)",
                      color: "#fff",
                      padding: "8px 14px",
                      borderRadius: 10,
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700 }}>
                      <span style={{ color: "#ff5252" }}>● Merekam: {timer}s / 60s</span>
                      <span>{recordedFrames.length} Frame</span>
                    </div>
                    <div style={{ fontSize: 15, marginTop: 4, color: "#a7f3d0", fontWeight: 600 }}>
                      Panduan Pose: {currentPose}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                {!recording ? (
                  <button type="button" onClick={startMultiCapture} className="btn" disabled={busy}>
                    Mulai Scan Multi-Pose (60 Detik)
                  </button>
                ) : (
                  <button type="button" onClick={() => finishRecording()} className="btn" style={{ background: "var(--danger)" }}>
                    Selesai & Analisis Sekarang ({recordedFrames.length} frame)
                  </button>
                )}
                <button type="button" onClick={stopCamera} className="btn secondary" disabled={recording}>
                  Tutup Kamera
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {busy && (
        <div className="notice" style={{ marginTop: 20, textAlign: "center" }}>
          Memproses analisis YuNet & VGG16 di backend... Harap tunggu sebentar.
        </div>
      )}

      {result && (
        <div className="card" style={{ marginTop: 24 }}>
          <h2>Hasil Analisis Wajah</h2>
          <p>
            Status: <b>{status || result.message || "terkirim"}</b>
          </p>
          {result.message && <p className="muted">{result.message}</p>}

          {/* Multi-pose stats */}
          {(result.frames_captured || result.frames_passed_yunet) && (
            <div style={{ display: "flex", gap: 14, padding: "10px 14px", background: "var(--cream)", borderRadius: 10, margin: "14px 0", fontSize: 13 }}>
              <span>Total Frame: <b>{result.frames_captured}</b></span>
              <span>Lolos YuNet: <b>{result.frames_passed_yunet}</b></span>
              <span>Diproses VGG16: <b>{result.frames_used_vgg}</b></span>
            </div>
          )}

          {status === "failed" && (
            <p className="muted" style={{ color: "var(--danger)" }}>
              Analisis gagal di backend. Wajah tidak terdeteksi atau gambar tidak memenuhi syarat.
            </p>
          )}

          {analysis ? (
            <>
              <h3>Skor Kondisi Kulit</h3>
              <div className="score-grid">
                {SCORES.map(([key, label]) => (
                  <div className="score" key={key}>
                    <span className="muted">{label}</span>
                    <b>{analysis[key] != null ? `${analysis[key]}%` : "—"}</b>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {scanId && (
            <p style={{ marginTop: 16 }}>
              <Link href={`/history/${scanId}`}>Lihat detail scan #{scanId}</Link>
              {" · "}
              <Link href="/output?from=scan">Lihat di halaman Output</Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
