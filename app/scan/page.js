"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
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

// Helper: Kompres foto dari HP sebelum di-upload agar tidak melebihi batas 4.5MB Vercel / server
async function compressImageForMobile(file, maxDimension = 1280, quality = 0.85) {
  if (!file || !file.type.startsWith("image/")) return file;
  if (file.size < 600 * 1024) return file; // File sudah cukup ringan

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
  const [facingMode, setFacingMode] = useState("user"); // "user" (depan) | "environment" (belakang)
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
    // Cek status sesi login (opsional)
    getMe()
      .then((user) => setCurrentUser(user))
      .catch(() => setCurrentUser(null));

    return () => {
      stopCamera();
    };
  }, []);

  // Pasang stream ke elemen <video> saat webcam aktif
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
        // Fallback jika orientasi / resolusi spesifik ditolak perangkat HP
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
      let msg = "Tidak dapat mengakses kamera. Pastikan izin kamera aktif di browser HP/laptop kamu.";
      if (err && err.name === "NotAllowedError") {
        msg = "Izin kamera ditolak browser. Izinkan akses kamera di pengaturan browser/HP, lalu coba lagi.";
      } else if (err && err.name === "NotFoundError") {
        msg = "Tidak ada kamera yang ditemukan pada perangkat ini.";
      } else if (err && err.name === "NotReadableError") {
        msg = "Kamera sedang dipakai oleh aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.";
      } else if (err && err.name === "SecurityError") {
        msg = "Kamera hanya dapat diakses melalui koneksi aman (HTTPS) atau localhost.";
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

  // Mulai perekaman frame pose (1 frame per 1.5 detik, ramah memori HP & kuota)
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
    // Label pose sejajar dengan urutan frame — inilah yang membuat backend
    // bisa mengelompokkan skor per pose (sebelumnya frame dikirim polos
    // tanpa label, jadi backend tidak tahu frame mana dari pose mana).
    const framePoses = [];
    const startTime = Date.now();
    let lastCaptureSec = -1;

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimer(elapsed);

      // Tentukan panduan pose aktif
      const p = POSES.find((pos) => elapsed <= pos.sec) || POSES[POSES.length - 1];
      setCurrentPose(p.label);

      // Ambil 1 frame setiap 1.5 - 2 detik untuk efisiensi transfer data HP
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

      // Selesai otomatis di detik ke-24 (atau dihentikan manual oleh user)
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
      // Kompres otomatis gambar HP sebelum kirim
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
  const status = result && result.status;

  return (
    <div className="card" style={{ maxWidth: 800, margin: "20px auto", padding: "20px 16px" }}>
      <h1>Scan Wajah & Analisis Kulit</h1>
      <p className="muted" style={{ marginBottom: 14 }}>
        Analisis kondisi kulit wajah (jerawat, minyak, kekeringan, noda hitam, dan kerutan) menggunakan deteksi wajah YuNet dan model VGG16.
      </p>

      {/* Info status akun / tamu */}
      {!currentUser && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: 8, fontSize: 13, color: "#166534", marginBottom: 16 }}>
          💡 <b>Mode Pengujian Aktif:</b> Anda dapat langsung memindai wajah tanpa login. Hasil analisis AI akan langsung muncul di halaman ini. (
          <Link href="/login" style={{ textDecoration: "underline", fontWeight: 600 }}>
            Login
          </Link>{" "}
          jika ingin menyimpan riwayat ke akun).
        </div>
      )}

      {/* Mode Selector */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => {
            setMode("single");
            stopCamera();
          }}
          className={`btn ${mode === "single" ? "" : "secondary"}`}
          style={{ flex: "1 1 180px", minHeight: 44 }}
        >
          Foto Tunggal (Upload/Kamera)
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("multi");
          }}
          className={`btn ${mode === "multi" ? "" : "secondary"}`}
          style={{ flex: "1 1 180px", minHeight: 44 }}
        >
          Kamera Multi-Pose (Realtime)
        </button>
      </div>

      <ErrorBox error={error} />

      {mode === "single" ? (
        <form onSubmit={onSubmitSingle}>
          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>Pilih atau Ambil Foto Wajah</span>
            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={onFile}
              style={{ width: "100%", padding: "10px 8px", fontSize: 15 }}
            />
          </label>
          {preview && (
            <div style={{ textAlign: "center", margin: "14px 0" }}>
              <img
                className="preview"
                src={preview}
                alt="Pratinjau foto wajah"
                style={{ maxHeight: 320, maxWidth: "100%", borderRadius: 10, objectFit: "contain" }}
              />
            </div>
          )}
          <button className="btn" disabled={busy} style={{ width: "100%", minHeight: 46, fontSize: 16, marginTop: 8 }}>
            {busy ? "Menganalisis Foto..." : "Mulai Analisis Foto"}
          </button>
        </form>
      ) : (
        <div>
          {!webcamActive ? (
            <div style={{ textAlign: "center", padding: "26px 16px", background: "var(--cream)", borderRadius: 12 }}>
              <p style={{ margin: "0 0 14px 0", fontSize: 15 }}>
                Aktifkan kamera untuk panduan pemindaian multi-sudut wajah interaktif.
              </p>
              <button type="button" onClick={() => startCamera(facingMode)} className="btn" style={{ minHeight: 46, minWidth: 160 }}>
                Buka Kamera
              </button>
            </div>
          ) : (
            <div>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: 540,
                  margin: "0 auto",
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "#000",
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  webkit-playsinline="true"
                  muted
                  style={{
                    width: "100%",
                    display: "block",
                    aspectRatio: "4 / 3",
                    objectFit: "cover",
                    transform: flipPreview ? "scaleX(-1)" : "none",
                  }}
                />
                <canvas ref={canvasRef} style={{ display: "none" }} />

                {recording && (
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      right: 10,
                      background: "rgba(0,0,0,0.72)",
                      color: "#fff",
                      padding: "8px 12px",
                      borderRadius: 10,
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700 }}>
                      <span style={{ color: "#ff5252" }}>● Merekam: {timer}s / 24s</span>
                      <span>{recordedFrames.length} Frame</span>
                    </div>
                    <div style={{ fontSize: 15, marginTop: 4, color: "#a7f3d0", fontWeight: 600 }}>
                      Panduan Pose: {currentPose}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 14 }}>
                {!recording ? (
                  <button type="button" onClick={startMultiCapture} className="btn" disabled={busy} style={{ minHeight: 44, flex: "1 1 160px" }}>
                    Mulai Scan Multi-Pose (24 Detik)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => finishRecording()}
                    className="btn"
                    style={{ background: "var(--danger)", minHeight: 44, flex: "1 1 160px" }}
                  >
                    Selesai & Analisis ({recordedFrames.length} frame)
                  </button>
                )}
                <button type="button" onClick={toggleCamera} className="btn secondary" disabled={recording} style={{ minHeight: 44 }}>
                  Ganti Kamera (Depan/Belakang)
                </button>
                <button type="button" onClick={() => setFlipPreview((f) => !f)} className="btn secondary" disabled={recording} style={{ minHeight: 44 }}>
                  Balik Pratinjau
                </button>
                <button type="button" onClick={stopCamera} className="btn secondary" disabled={recording} style={{ minHeight: 44 }}>
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {busy && (
        <div className="notice" style={{ marginTop: 20, textAlign: "center", padding: "14px", fontWeight: 600 }}>
          ⏳ Sedang memproses analisis wajah & 5 kondisi kulit di backend... Mohon tunggu.
        </div>
      )}

      {result && (
        <div className="card" style={{ marginTop: 24, padding: "16px" }}>
          <h2>Hasil Analisis Wajah</h2>
          <p>
            Status: <b>{status || result.message || "terkirim"}</b>
          </p>
          {result.message && status !== "failed" && <p className="muted">{result.message}</p>}

          {/* Statistik multi-pose */}
          {(result.frames_captured || result.frames_passed_yunet) && (
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                padding: "10px 14px",
                background: "var(--cream)",
                borderRadius: 10,
                margin: "14px 0",
                fontSize: 13,
              }}
            >
              <span>
                Total Frame: <b>{result.frames_captured}</b>
              </span>
              <span>
                Lolos Deteksi Wajah: <b>{result.frames_passed_yunet}</b>
              </span>
              <span>
                Dianalisis AI VGG16: <b>{result.frames_used_vgg}</b>
              </span>
            </div>
          )}

          {status === "failed" && (
            <>
              {/* Alasan asli dari backend tampil utama — jangan lagi selalu
                  menuduh wajah/pencahayaan, karena gagal bisa juga dari
                  error kode atau server AI (dulu: NameError image_path). */}
              <p style={{ color: "var(--danger)", fontWeight: 500 }}>
                Analisis gagal: {result.message || "backend tidak mengembalikan alasan."}
              </p>
              {(!result.message || /wajah|terdeteksi|deteksi/i.test(result.message)) && (
                <p className="muted">
                  Kalau penyebabnya deteksi wajah: pastikan wajah tegak, menghadap kamera, dan terlihat jelas dengan pencahayaan cukup.
                </p>
              )}
            </>
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

          {result.per_pose && Object.keys(result.per_pose).length > 0 && (
            <>
              <h3>Skor per pose</h3>
              <p className="muted">
                Perbandingan ini berdasarkan pose saat perekaman — sudut wajah yang paling dominan terlihat,
                bukan pengukuran tiap wilayah wajah secara terpisah.
              </p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "8px 8px 8px 0" }}>Pose</th>
                      <th style={{ textAlign: "left", padding: 8 }}>Frame lolos</th>
                      <th style={{ textAlign: "right", padding: 8 }}>Jerawat</th>
                      <th style={{ textAlign: "right", padding: 8 }}>Kering</th>
                      <th style={{ textAlign: "right", padding: 8 }}>Berminyak</th>
                      <th style={{ textAlign: "right", padding: 8 }}>Dark spots</th>
                      <th style={{ textAlign: "right", padding: 8 }}>Kerutan</th>
                      <th style={{ textAlign: "right", padding: 8 }}>Keseluruhan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...POSES.map((p) => p.key), ...Object.keys(result.per_pose).filter((k) => !POSES.some((p) => p.key === k))].map((key) => {
                      const entry = result.per_pose[key];
                      if (!entry) return null;
                      const label = (POSES.find((p) => p.key === key) || {}).label || key;
                      const fmt = (v) => (v != null ? `${v}%` : "—");
                      return (
                        <tr key={key}>
                          <td style={{ padding: "8px 8px 8px 0" }}>{label}</td>
                          <td style={{ padding: 8 }}>{entry.frames_passed ?? "—"}/{entry.frames_captured ?? "—"}</td>
                          <td style={{ textAlign: "right", padding: 8 }}>{fmt(entry.acne_score)}</td>
                          <td style={{ textAlign: "right", padding: 8 }}>{fmt(entry.dry_skin_score)}</td>
                          <td style={{ textAlign: "right", padding: 8 }}>{fmt(entry.oily_skin_score)}</td>
                          <td style={{ textAlign: "right", padding: 8 }}>{fmt(entry.dark_spots_score)}</td>
                          <td style={{ textAlign: "right", padding: 8 }}>{fmt(entry.wrinkles_score)}</td>
                          <td style={{ textAlign: "right", padding: 8 }}>{fmt(entry.overall_score)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {result.statements && result.statements.length > 0 && (
            <>
              <h3>Yang terlihat dari perbandingan pose</h3>
              <ul>
                {result.statements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </>
          )}

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
