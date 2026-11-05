"use client";
import { useEffect, useState } from "react";
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deactivateAdminProduct,
  pickObject,
  pickArray,
} from "../../../lib/api";
import { ErrorBox, Loading } from "../../../components/Notice";
import AdminDenied from "../../../components/AdminDenied";
import { useToast } from "../../../components/Toast";

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid var(--border-subtle)",
  background: "#fff",
  fontSize: "14px",
};
const thStyle = { textAlign: "left", padding: "10px 12px", fontSize: "12px", color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)" };
const tdStyle = { padding: "10px 12px", fontSize: "14px", borderBottom: "1px solid var(--border-subtle)", verticalAlign: "top" };

const emptyForm = {
  brand: "",
  name: "",
  category: "serum",
  description: "",
  ingredients: "",
  skin_concern: "",
  usage_guidance: "",
  shopee_link: "",
  tokopedia_link: "",
  status: "active",
};

export default function AdminProductsPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [qDraft, setQDraft] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function load(p = page) {
    setLoading(true);
    setError(null);
    try {
      const d = await getAdminProducts({ q, status, page: p, per_page: 10 });
      const obj = pickObject(d);
      setRows(pickArray(obj.products ?? d));
      setTotal(obj.total ?? 0);
      setTotalPages(obj.total_pages ?? 1);
      setPage(obj.page ?? p);
    } catch (e) {
      if (e.status === 401 || e.status === 403) setDenied(true);
      else setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [q, status]);

  if (denied) return <AdminDenied />;
  if (loading && rows.length === 0) {
    return (
      <div className="page-shell-wrap">
        <div className="glass-panel" style={{ padding: "48px", textAlign: "center" }}>
          <Loading label="Memuat produk…" />
        </div>
      </div>
    );
  }

  function toBody(f) {
    const split = (s) => s.split(",").map((v) => v.trim()).filter(Boolean);
    return {
      brand: f.brand,
      name: f.name,
      category: f.category,
      description: f.description || null,
      ingredients: split(f.ingredients),
      skin_concern: split(f.skin_concern),
      usage_guidance: f.usage_guidance || null,
      shopee_link: f.shopee_link || null,
      tokopedia_link: f.tokopedia_link || null,
      status: f.status,
    };
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (form.id) {
        await updateAdminProduct(form.id, toBody(form));
        toast.success("Produk diperbarui.");
      } else {
        await createAdminProduct(toBody(form));
        toast.success("Produk ditambahkan.");
      }
      setForm(null);
      load(page);
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan produk.");
    } finally {
      setBusy(false);
    }
  }

  async function onDeactivate(p) {
    if (!window.confirm(`Nonaktifkan produk "${p.name}"? Produk tidak dihapus — status menjadi inactive dan tidak tampil di marketplace.`)) return;
    try {
      await deactivateAdminProduct(p.id);
      toast.success("Produk dinonaktifkan.");
      load(page);
    } catch (err) {
      toast.error(err.message || "Gagal menonaktifkan produk.");
    }
  }

  const joinList = (v) => (Array.isArray(v) ? v.join(", ") : (v || ""));

  return (
    <div className="page-shell-wrap">
      <div className="admin-hero-header">
        <h1 className="admin-page-title">Produk</h1>
        <p className="admin-page-subtitle">
          {total} produk di katalog (semua status). Bahan aktif dan target kulit dipisahkan koma — inilah data yang dibaca chatbot saat merekomendasikan produk.
        </p>
      </div>

      {error && <ErrorBox error={error} />}

      <div className="glass-panel" style={{ padding: "18px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <input
          style={{ ...inputStyle, maxWidth: "320px" }}
          placeholder="Cari nama / brand…"
          value={qDraft}
          onChange={(e) => setQDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") setQ(qDraft); }}
        />
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setQ(qDraft)}>Cari</button>
        <select style={{ ...inputStyle, maxWidth: "180px" }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua status</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
        <span style={{ marginLeft: "auto" }}>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setForm({ ...emptyForm })}>+ Tambah Produk</button>
        </span>
      </div>

      {form && (
        <form onSubmit={onSubmit} className="glass-panel" style={{ padding: "20px", display: "grid", gap: "12px" }}>
          <h3 style={{ margin: 0 }}>{form.id ? "Edit Produk" : "Tambah Produk"}</h3>
          <input style={inputStyle} placeholder="Brand" required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          <input style={inputStyle} placeholder="Nama produk" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input style={inputStyle} placeholder="Kategori (cleanser, toner, serum, moisturizer, sunscreen…)" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <textarea style={{ ...inputStyle, minHeight: "70px" }} placeholder="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input style={inputStyle} placeholder="Bahan aktif, pisahkan koma (mis. Niacinamide, Salicylic Acid)" value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} />
          <input style={inputStyle} placeholder="Target kulit, pisahkan koma (mis. Acne, Dry Skin)" value={form.skin_concern} onChange={(e) => setForm({ ...form, skin_concern: e.target.value })} />
          <textarea style={{ ...inputStyle, minHeight: "60px" }} placeholder="Petunjuk pemakaian" value={form.usage_guidance} onChange={(e) => setForm({ ...form, usage_guidance: e.target.value })} />
          <input style={inputStyle} placeholder="Link Shopee (opsional)" value={form.shopee_link} onChange={(e) => setForm({ ...form, shopee_link: e.target.value })} />
          <input style={inputStyle} placeholder="Link Tokopedia (opsional)" value={form.tokopedia_link} onChange={(e) => setForm({ ...form, tokopedia_link: e.target.value })} />
          <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(null)}>Batal</button>
          </div>
        </form>
      )}

      <div className="glass-panel" style={{ padding: "8px 12px", overflowX: "auto" }}>
        {rows.length === 0 ? (
          <p className="muted" style={{ padding: "20px", textAlign: "center" }}>Tidak ada produk yang cocok.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "720px" }}>
            <thead>
              <tr>
                <th style={thStyle}>Produk</th>
                <th style={thStyle}>Kategori</th>
                <th style={thStyle}>Target kulit</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td style={tdStyle}>
                    <strong>{p.name}</strong>
                    <div className="muted" style={{ fontSize: "12px" }}>{p.brand}</div>
                  </td>
                  <td style={tdStyle}>{p.category}</td>
                  <td style={tdStyle}>{joinList(p.skin_concern) || "—"}</td>
                  <td style={tdStyle}><span className="badge badge-navy">{p.status}</span></td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setForm({
                        id: p.id,
                        brand: p.brand || "",
                        name: p.name || "",
                        category: p.category || "",
                        description: p.description || "",
                        ingredients: joinList(p.ingredients),
                        skin_concern: joinList(p.skin_concern),
                        usage_guidance: p.usage_guidance || "",
                        shopee_link: p.shopee_link || "",
                        tokopedia_link: p.tokopedia_link || "",
                        status: p.status || "active",
                      })}
                    >
                      Edit
                    </button>{" "}
                    {p.status !== "inactive" && (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDeactivate(p)}>Nonaktifkan</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center" }}>
        <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => load(page - 1)}>← Sebelumnya</button>
        <span className="muted" style={{ fontSize: "13px" }}>Halaman {page} / {totalPages}</span>
        <button type="button" className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => load(page + 1)}>Berikutnya →</button>
      </div>
    </div>
  );
}
