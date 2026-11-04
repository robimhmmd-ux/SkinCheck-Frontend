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
    <div className="gx-page">
      <div className="gx-head">
        <h1 className="gx-title">Scan wajah</h1>
        <p className="gx-lead">
          Analisis kondisi kulit wajah (jerawat, minyak, kekeringan, noda hitam, dan kerutan) menggunakan deteksi wajah YuNet dan model VGG16.
        </p>
      </div>

      {!currentUser && (
        <div className="gx-note">
          <p><strong>Mode pengujian aktif.</strong> Kamu bisa langsung memindai wajah tanpa login. Hasil analisis AI akan langsung muncul di halaman ini. <Link href="/login">Login</Link> jika ingin menyimpan riwayat ke akun.</p>
        </div>
      )}

      <div className="gx-seg" role="tablist" aria-label="Mode scan">
        <button
          type="button"
          onClick={() => {
            setMode("single");
            stopCamera();
          }}
          className={`gx-seg-btn ${mode === "single" ? "on" : ""}`}
        >
          Foto Tunggal
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("multi");
          }}
          className={`gx-seg-btn ${mode === "multi" ? "on" : ""}`}
        >
          Kamera Multi-Pose
        </button>
      </div>

      <ErrorBox error={error} />

      {mode === "single" ? (
        <div className="gx-drop">
          <form onSubmit={onSubmitSingle}>
            <label>
              Pilih atau ambil foto wajah
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={onFile}
              />
            </label>
            {preview && (
              <img
                className="preview"
                src={preview}
                alt="Pratinjau foto wajah"
              />
            )}
            <button className="btn" disabled={busy} style={{ width: "100%" }}>
              {busy ? "Menganalisis Foto..." : "Mulai Analisis Foto"}
            </button>
          </form>
        </div>
      ) : (
        <div>
          {!webcamActive ? (
            <div className="gx-drop">
              <p>
                Aktifkan kamera untuk panduan pemindaian multi-sudut wajah interaktif.
              </p>
              <button type="button" onClick={() => startCamera(facingMode)} className="btn">
                Buka Kamera
              </button>
            </div>
          ) : (
            <div>
              <div className="gx-camera">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  webkit-playsinline="true"
                  muted
                  className="gx-camera-video"
                  style={{ transform: flipPreview ? "scaleX(-1)" : "none" }}
                />
                <canvas ref={canvasRef} style={{ display: "none" }} />
                <span className="gx-oval" aria-hidden="true" />

                {recording && (
                  <div className="gx-rec">
                    <div className="gx-rec-row">
                      <span>Merekam: {timer}s / 24s</span>
                      <span>{recordedFrames.length} Frame</span>
                    </div>
                    <div className="gx-rec-pose">
                      Panduan Pose: {currentPose}
                    </div>
                  </div>
                )}

                <div className="gx-chips">
                  {POSES.map((p) => (
                    <span key={p.key} className={`gx-chip ${currentPose === p.label ? "on" : ""}`}>{p.label}</span>
                  ))}
                </div>
              </div>

              <div className="gx-progress" aria-hidden="true">
                <span style={{ width: `${recording ? Math.min(100, (timer / 24) * 100) : 0}%` }} />
              </div>

              <div className="gx-btn-row">
                {!recording ? (
                  <button type="button" onClick={startMultiCapture} className="btn" disabled={busy}>
                    Mulai Scan Multi-Pose (24 Detik)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => finishRecording()}
                    className="btn danger"
                  >
                    Selesai dan Analisis ({recordedFrames.length} frame)
                  </button>
                )}
                <button type="button" onClick={toggleCamera} className="btn secondary" disabled={recording}>
                  Ganti Kamera (Depan/Belakang)
                </button>
                <button type="button" onClick={() => setFlipPreview((f) => !f)} className="btn secondary" disabled={recording}>
                  Balik Pratinjau
                </button>
                <button type="button" onClick={stopCamera} className="btn secondary" disabled={recording}>
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {busy && (
        <p className="gx-busy">
          Sedang memproses analisis wajah dan 5 kondisi kulit di backend... Mohon tunggu.
        </p>
      )}

      {result && (
        <div>
          <section className="gx-section" aria-labelledby="result-heading">
            <h2 id="result-heading">Hasil Analisis Wajah</h2>
            <p className="muted">Status: <b>{status || result.message || "terkirim"}</b></p>
            {result.message && status !== "failed" && <p className="muted">{result.message}</p>}

            {analysis && analysis.overall_score != null && (
              <div className="gx-result-num">
                <b>{analysis.overall_score}<span className="gx-unit">%</span></b>
                <span>skor keseluruhan</span>
              </div>
            )}

            {(result.frames_captured || result.frames_passed_yunet) && (
              <div className="gx-stats">
                <div className="gx-stat"><b>{result.frames_captured}</b><span>Total Frame</span></div>
                <div className="gx-stat"><b>{result.frames_passed_yunet}</b><span>Lolos Deteksi Wajah</span></div>
                <div className="gx-stat"><b>{result.frames_used_vgg}</b><span>Dianalisis AI VGG16</span></div>
              </div>
            )}

            {status === "failed" && (
              <>
                {/* Alasan asli dari backend tampil utama — jangan lagi selalu
                    menuduh wajah/pencahayaan, karena gagal bisa juga dari
                    error kode atau server AI (dulu: NameError image_path). */}
                <p className="error">
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
                <div className="gx-ledger">
                  {SCORES.map(([key, label]) => {
                    const v = analysis[key];
                    const finite = v != null && Number.isFinite(Number(v));
                    return (
                      <div key={key} className="gx-row">
                        <span className="gx-label">{label}</span>
                        <b className={finite ? "" : "muted"}>{finite ? `${v}%` : "—"}</b>
                        {finite && (
                          <span className="gx-scale" aria-hidden="true">
                            <i style={{ left: `${Math.max(0, Math.min(100, Number(v)))}%` }} />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          </section>

          {result.per_pose && Object.keys(result.per_pose).length > 0 && (
            <section className="gx-section" aria-labelledby="perpose-heading">
              <h2 id="perpose-heading">Skor per pose</h2>
              <p className="gx-section-lead">
                Perbandingan ini berdasarkan pose saat perekaman — sudut wajah yang paling dominan terlihat,
                bukan pengukuran tiap wilayah wajah secara terpisah. Geser ke samping untuk melihat pose lainnya.
              </p>
              <div className="gx-strip">
                {[...POSES.map((p) => p.key), ...Object.keys(result.per_pose).filter((k) => !POSES.some((p) => p.key === k))].map((key) => {
                  const entry = result.per_pose[key];
                  if (!entry) return null;
                  const label = (POSES.find((p) => p.key === key) || {}).label || key;
                  const top = topCondition(entry);
                  return (
                    <article key={key} className="gx-pose-card">
                      <h3>{label}</h3>
                      <b>{entry.overall_score != null ? entry.overall_score : "—"}</b>
                      <p>skor keseluruhan</p>
                      {top && <p>Tertinggi: {top.label} {top.value}%</p>}
                      <p className="muted">Frame lolos {entry.frames_passed ?? "—"} dari {entry.frames_captured ?? "—"}</p>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {result.statements && result.statements.length > 0 && (
            <section className="gx-section" aria-labelledby="statements-heading">
              <h2 id="statements-heading">Yang terlihat dari perbandingan pose</h2>
              {result.statements.map((s, i) => (
                <p key={i} className="gx-quote">{s}</p>
              ))}
            </section>
          )}

          {scanId && (
            <>
              <p><Link href={`/history/${scanId}`}>Lihat detail scan #{scanId}</Link></p>
              <p><Link href="/output?from=scan">Lihat di halaman Output</Link></p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
