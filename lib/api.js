// Laomera API client — berbicara ke backend Python (FastAPI) di /api/v2.
// Backend URL TIDAK diketahui saat repo ini dibuat; user mengisi .env sendiri.
// Jika NEXT_PUBLIC_API_URL kosong, semua helper melempar error dengan
// code "BACKEND_NOT_CONFIGURED" — halaman menangkapnya dan menampilkan
// pesan "backend belum dikonfigurasi", bukan crash.

export function getApiBase() {
  let base = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/$/, "");
  if (typeof window !== "undefined") {
    // If NEXT_PUBLIC_API_URL points to localhost, but page is opened on mobile via LAN IP (e.g. 192.168.x.x)
    if (base && (base.includes("localhost") || base.includes("127.0.0.1"))) {
      const hostname = window.location.hostname;
      if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
        base = base.replace(/localhost|127\.0\.0\.1/, hostname);
      }
    }
    // Fallback if not configured in production Vercel
    if (!base && window.location.hostname.endsWith(".vercel.app")) {
      base = "https://skincheck-backend-robimhmmd-uxs-projects.vercel.app";
    }
  }
  return base;
}

export function isBackendConfigured() {
  return Boolean(getApiBase());
}

export function backendNotConfiguredError() {
  const err = new Error(
    "Backend belum dikonfigurasi. Isi NEXT_PUBLIC_API_URL di .env.local (lokal) atau di Environment Variables Vercel, lalu muat ulang halaman ini."
  );
  err.code = "BACKEND_NOT_CONFIGURED";
  return err;
}

export function isBackendNotConfigured(err) {
  return err && err.code === "BACKEND_NOT_CONFIGURED";
}

async function request(path, options = {}) {
  const base = getApiBase();
  if (!base) throw backendNotConfiguredError();

  let res;
  try {
    res = await fetch(`${base}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
  } catch (e) {
    const err = new Error(`Tidak bisa menghubungi backend (${base}). Periksa URL backend dan koneksi internet.`);
    err.code = "BACKEND_UNREACHABLE";
    err.cause = e;
    throw err;
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      (data && (data.detail || data.message || data.error)) ||
      `Backend mengembalikan status ${res.status}`;
    const err = new Error(typeof message === "string" ? message : JSON.stringify(message));
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function postJson(path, body) {
  return request(path, { method: "POST", body: JSON.stringify(body || {}) });
}

// --- Planned /api/v2 contract (backend repo terpisah) ---
export function apiHealth() {
  return request("/api/v2/health");
}
export function login(email, password) {
  return postJson("/api/v2/auth/login", { email, password });
}
export function register(name, email, password, phone) {
  const body = { name, email, password };
  if (phone) body.phone = phone;
  return postJson("/api/v2/auth/register", body);
}
export function logout() {
  return postJson("/api/v2/auth/logout", {});
}
export function requestFonnteOtp(phone, name) {
  return postJson("/api/v2/auth/otp/request", { phone, name });
}
export function verifyFonnteOtp(phone, code) {
  return postJson("/api/v2/auth/otp/verify", { phone, code });
}
export function getMe() {
  return request("/api/v2/me");
}
export function getDashboard() {
  return request("/api/v2/dashboard");
}
export function getHistory() {
  return request("/api/v2/history");
}
export function getScanDetail(id) {
  return request(`/api/v2/history/${encodeURIComponent(id)}`);
}
export function getProducts() {
  return request("/api/v2/products");
}
export function getAdminSummary() {
  return request("/api/v2/admin/summary");
}

export function assistantChat(message, scan_id = null) {
  return postJson("/api/v2/assistant/chat", { message, scan_id });
}

// Streaming chat (SSE): memanggil /assistant/chat/stream dan memanggil
// onDelta tiap potongan jawaban tiba, sehingga kata-kata muncul satu per
// satu, bukan menunggu jawaban utuh. Mengembalikan teks lengkap. Melempar
// error dengan .status seperti request() agar halaman bisa fallback ke
// endpoint lama saat stream gagal sebelum potongan pertama tiba.
export async function assistantChatStream(message, onDelta, scan_id = null) {
  const base = getApiBase();
  if (!base) throw backendNotConfiguredError();
  let res;
  try {
    res = await fetch(`${base}/api/v2/assistant/chat/stream`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, scan_id }),
    });
  } catch (e) {
    const err = new Error(`Tidak bisa menghubungi backend (${base}). Periksa URL backend dan koneksi internet.`);
    err.code = "BACKEND_UNREACHABLE";
    err.cause = e;
    throw err;
  }
  if (!res.ok) {
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    const err = new Error(
      (data && (data.detail || data.message || data.error)) || `Backend mengembalikan status ${res.status}`
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }
  if (!res.body || typeof res.body.getReader !== "function") {
    throw new Error("Streaming tidak didukung browser ini.");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const event = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      for (const line of event.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        let data;
        try { data = JSON.parse(payload); } catch { continue; }
        if (data.delta) {
          full += data.delta;
          onDelta(data.delta, full);
        }
        if (data.done) return full;
        if (data.error) throw new Error(data.error);
      }
    }
  }
  return full;
}

export function getAssistantHistory() {
  return request("/api/v2/assistant/history");
}

export function clearAssistantHistory() {
  return postJson("/api/v2/assistant/clear", {});
}

export async function uploadMultiScan(files, poses) {
  const base = getApiBase();
  if (!base) throw backendNotConfiguredError();
  const form = new FormData();
  for (const f of files) {
    form.append("files", f);
  }
  // Label pose sejajar dengan urutan file; backend mengabaikannya kalau
  // jumlahnya tidak cocok, jadi pengiriman lama (tanpa label) tetap jalan.
  if (poses && poses.length === files.length) {
    for (const pose of poses) {
      form.append("poses", pose);
    }
  }
  let res;
  try {
    res = await fetch(`${base}/api/v2/scan/multi-upload`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
  } catch (e) {
    const err = new Error(`Tidak bisa menghubungi backend (${base}). Periksa URL backend dan koneksi internet.`);
    err.code = "BACKEND_UNREACHABLE";
    err.cause = e;
    throw err;
  }
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const message = (data && (data.detail || data.message || data.error)) || `Backend mengembalikan status ${res.status}`;
    const err = new Error(typeof message === "string" ? message : JSON.stringify(message));
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Upload scan: FormData (jangan set Content-Type manual — browser yang
// mengisi boundary multipart). Field "file" mengikuti konvensi umum;
// sesuaikan nama field dengan backend jika kontrak final berbeda.
export async function uploadScan(file) {
  const base = getApiBase();
  if (!base) throw backendNotConfiguredError();
  const form = new FormData();
  form.append("file", file);
  let res;
  try {
    res = await fetch(`${base}/api/v2/scan/upload`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
  } catch (e) {
    const err = new Error(`Tidak bisa menghubungi backend (${base}). Periksa URL backend dan koneksi internet.`);
    err.code = "BACKEND_UNREACHABLE";
    err.cause = e;
    throw err;
  }
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const message = (data && (data.detail || data.message || data.error)) || `Backend mengembalikan status ${res.status}`;
    const err = new Error(typeof message === "string" ? message : JSON.stringify(message));
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Helpers defensif: backend boleh mengembalikan {data: ...} atau langsung.
export function pickArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.scans)) return data.scans;
  if (data && Array.isArray(data.history)) return data.history;
  if (data && Array.isArray(data.products)) return data.products;
  return [];
}
export function pickObject(data) {
  if (!data) return {};
  if (data.data && typeof data.data === "object") return data.data;
  return data;
}
export function pickUser(data) {
  const obj = pickObject(data);
  return obj.user || obj.me || obj;
}
