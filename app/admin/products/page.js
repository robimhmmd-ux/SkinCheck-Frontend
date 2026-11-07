"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Package,
  PackagePlus,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit2,
  ExternalLink,
  X,
  RefreshCw,
  ShoppingBag
} from "lucide-react";
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deactivateAdminProduct,
  pickObject,
  pickArray
} from "../../../lib/api";
import { ErrorBox, Loading } from "../../../components/Notice";
import AdminDenied from "../../../components/AdminDenied";
import { useToast, ConfirmDialog } from "../../../components/Toast";
import {
  PRODUCT_CATEGORIES,
  normalizeCategory,
  categoryLabel
} from "../../../lib/productCategories";

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
  status: "active"
};

export default function AdminProductsPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [qDraft, setQDraft] = useState("");
  const [status, setStatus] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("semua");
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pendingDeactivate, setPendingDeactivate] = useState(null);
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

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status]);

  function toBody(f) {
    const split = (s) =>
      typeof s === "string"
        ? s.split(",").map((v) => v.trim()).filter(Boolean)
        : Array.isArray(s) ? s : [];

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
      status: f.status
    };
  }

  function joinList(val) {
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === "string") return val;
    return "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = toBody(form);
      if (form.id) {
        await updateAdminProduct(form.id, body);
        toast.success("Produk berhasil diperbarui.");
      } else {
        await createAdminProduct(body);
        toast.success("Produk baru berhasil ditambahkan.");
      }
      setForm(null);
      load(page);
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan formulasi produk.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeactivate() {
    const p = pendingDeactivate;
    if (!p) return;
    setPendingDeactivate(null);
    try {
      await deactivateAdminProduct(p.id);
      toast.success(`Produk "${p.name}" dinonaktifkan.`);
      load(page);
    } catch (err) {
      toast.error(err.message || "Gagal menonaktifkan produk.");
    }
  }

  const displayedRows = useMemo(() => {
    if (categoryFilter === "semua") return rows;
    return rows.filter((r) => normalizeCategory(r.category) === categoryFilter);
  }, [rows, categoryFilter]);

  if (denied) return <AdminDenied />;

  return (
    <div className="admin-stage-container">
      {/* ── Page Header ── */}
      <div className="admin-view-header">
        <div className="admin-title-group">
          <h1>Katalog Produk & Formulasi</h1>
          <p>
            {total} formula skincare terdaftar • Direktori bahan aktif dan pemetaan produk rekomendasi AI.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => load(page)}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Segarkan
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setForm({ ...emptyForm })}
          >
            <PackagePlus size={14} /> Tambah Produk
          </button>
        </div>
      </div>

      {error && <ErrorBox error={error} />}

      {/* ── Form Modal / Inline Card ── */}
      {form && (
        <form onSubmit={onSubmit} className="admin-form-card">
          <div className="admin-form-header">
            <h3 className="admin-form-title">
              {form.id ? "Edit Formulasi Produk" : "Tambah Produk Baru"}
            </h3>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setForm(null)}
            >
              <X size={16} />
            </button>
          </div>

          <div className="admin-form-grid-2">
            <div className="admin-field-group">
              <label className="admin-field-label">Nama Merek / Brand</label>
              <input
                className="admin-input-styled"
                placeholder="mis. Somethinc, Skintific"
                required
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">Nama Produk Lengkap</label>
              <input
                className="admin-input-styled"
                placeholder="mis. 5% Niacinamide Moisture Serum"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">Kategori Produk</label>
              <select
                className="admin-input-styled"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} ({cat.group})
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">Status Visibilitas</label>
              <select
                className="admin-input-styled"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Active (Tampil di Rekomendasi)</option>
                <option value="inactive">Inactive (Disembunyikan)</option>
              </select>
            </div>

            <div className="admin-field-group col-span-2">
              <label className="admin-field-label">Bahan Aktif (Pisahkan Koma)</label>
              <input
                className="admin-input-styled"
                placeholder="mis. Niacinamide 5%, Centella Asiatica, Ceramide NP"
                value={form.ingredients}
                onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
              />
            </div>

            <div className="admin-field-group col-span-2">
              <label className="admin-field-label">Target Masalah Kulit (Pisahkan Koma)</label>
              <input
                className="admin-input-styled"
                placeholder="mis. Jerawat, Kulit Kering, Dark Spots"
                value={form.skin_concern}
                onChange={(e) => setForm({ ...form, skin_concern: e.target.value })}
              />
            </div>

            <div className="admin-field-group col-span-2">
              <label className="admin-field-label">Deskripsi & Karakteristik</label>
              <textarea
                className="admin-input-styled"
                style={{ minHeight: "70px" }}
                placeholder="Karakteristik tekstur dan manfaat utama formula..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="admin-field-group col-span-2">
              <label className="admin-field-label">Petunjuk Pemakaian</label>
              <textarea
                className="admin-input-styled"
                style={{ minHeight: "60px" }}
                placeholder="mis. Oleskan 3 tetes di pagi dan malam hari..."
                value={form.usage_guidance}
                onChange={(e) => setForm({ ...form, usage_guidance: e.target.value })}
              />
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">Tautan Shopee (Opsional)</label>
              <input
                className="admin-input-styled"
                placeholder="https://shopee.co.id/..."
                value={form.shopee_link}
                onChange={(e) => setForm({ ...form, shopee_link: e.target.value })}
              />
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">Tautan Tokopedia (Opsional)</label>
              <input
                className="admin-input-styled"
                placeholder="https://tokopedia.com/..."
                value={form.tokopedia_link}
                onChange={(e) => setForm({ ...form, tokopedia_link: e.target.value })}
              />
            </div>
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
              {busy ? "Menyimpan…" : "Simpan Produk"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(null)}>
              Batal
            </button>
          </div>
        </form>
      )}

      {/* ── Unified Table Surface (Toolbar + Table + Pagination in ONE Card) ── */}
      <div className="admin-table-card">
        {/* Seamless Integrated Toolbar */}
        <div className="admin-table-card-head">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, maxWidth: "420px" }}>
            <div className="admin-search-box" style={{ width: "100%", maxWidth: "100%" }}>
              <Search size={14} className="search-icon" />
              <input
                placeholder="Cari produk, brand, bahan aktif..."
                value={qDraft}
                onChange={(e) => setQDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setQ(qDraft);
                }}
              />
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setQ(qDraft)}
            >
              Cari
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              className="admin-filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="semua">Semua Kategori</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              className="admin-filter-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <span style={{ fontSize: "12.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              Total <strong>{displayedRows.length}</strong> formula
            </span>
          </div>
        </div>

        {/* Table Content */}
        {loading && rows.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <Loading label="Memuat produk..." />
          </div>
        ) : displayedRows.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <Package size={22} />
            </div>
            <h4 className="admin-empty-title">Tidak Ada Formulasi yang Cocok</h4>
            <p className="admin-empty-desc">
              Tidak ditemukan produk untuk kriteria filter atau pencarian saat ini.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Produk & Merek</th>
                  <th>Kategori</th>
                  <th>Bahan Aktif</th>
                  <th>Target Masalah Kulit</th>
                  <th>Toko</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.map((p) => {
                  const ingredientsArr = Array.isArray(p.ingredients)
                    ? p.ingredients
                    : typeof p.ingredients === "string"
                    ? p.ingredients.split(",").map((s) => s.trim()).filter(Boolean)
                    : [];

                  const concernsArr = Array.isArray(p.skin_concern)
                    ? p.skin_concern
                    : typeof p.skin_concern === "string"
                    ? p.skin_concern.split(",").map((s) => s.trim()).filter(Boolean)
                    : [];

                  const isInactive = p.status === "inactive";

                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600, color: "var(--brand-navy)", fontSize: "13.5px" }}>
                            {p.name}
                          </span>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {p.brand || "—"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="category-badge">
                          {categoryLabel(p.category)}
                        </span>
                      </td>
                      <td>
                        {ingredientsArr.length > 0 ? (
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", maxWidth: "240px" }}>
                            {ingredientsArr.slice(0, 3).map((ing, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  background: "rgba(15, 23, 42, 0.04)",
                                  color: "var(--brand-navy)"
                                }}
                              >
                                {ing}
                              </span>
                            ))}
                            {ingredientsArr.length > 3 && (
                              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                +{ingredientsArr.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>
                        )}
                      </td>
                      <td>
                        {concernsArr.length > 0 ? (
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", maxWidth: "200px" }}>
                            {concernsArr.slice(0, 2).map((c, idx) => (
                              <span key={idx} className="concern-tag">
                                {c}
                              </span>
                            ))}
                            {concernsArr.length > 2 && (
                              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                +{concernsArr.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {p.shopee_link && (
                            <a
                              href={p.shopee_link}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "2px",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                background: "rgba(238, 77, 45, 0.08)",
                                color: "#ee4d2d",
                                textDecoration: "none"
                              }}
                            >
                              Shopee <ExternalLink size={9} />
                            </a>
                          )}
                          {p.tokopedia_link && (
                            <a
                              href={p.tokopedia_link}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "2px",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                background: "rgba(3, 172, 14, 0.08)",
                                color: "#03ac0e",
                                textDecoration: "none"
                              }}
                            >
                              Tokopedia <ExternalLink size={9} />
                            </a>
                          )}
                          {!p.shopee_link && !p.tokopedia_link && (
                            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill status-${p.status || "active"}`}>
                          <span className="status-dot" />
                          {p.status === "active" ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "4px 10px", fontSize: "12px" }}
                            onClick={() =>
                              setForm({
                                id: p.id,
                                brand: p.brand || "",
                                name: p.name || "",
                                category: normalizeCategory(p.category) || "serum",
                                description: p.description || "",
                                ingredients: joinList(p.ingredients),
                                skin_concern: joinList(p.skin_concern),
                                usage_guidance: p.usage_guidance || "",
                                shopee_link: p.shopee_link || "",
                                tokopedia_link: p.tokopedia_link || "",
                                status: p.status || "active"
                              })
                            }
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          {!isInactive && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ padding: "4px 10px", fontSize: "12px", color: "var(--crimson-500)" }}
                              onClick={() => setPendingDeactivate(p)}
                            >
                              Nonaktifkan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Seamless Integrated Pagination Footer */}
        <div className="admin-pagination-bar">
          <span className="admin-pagination-summary">
            Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong>
          </span>
          <div className="admin-pagination-actions">
            <button
              type="button"
              className="admin-page-btn"
              disabled={page <= 1}
              onClick={() => load(page - 1)}
            >
              <ChevronLeft size={13} /> Sebelumnya
            </button>
            <button
              type="button"
              className="admin-page-btn"
              disabled={page >= totalPages}
              onClick={() => load(page + 1)}
            >
              Berikutnya <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDeactivate}
        title="Nonaktifkan produk katalog?"
        message={
          pendingDeactivate
            ? `Nonaktifkan produk "${pendingDeactivate.name}"? Produk tidak akan muncul di rekomendasi maupun marketplace.`
            : ""
        }
        confirmLabel="Ya, Nonaktifkan Produk"
        onConfirm={confirmDeactivate}
        onCancel={() => setPendingDeactivate(null)}
      />
    </div>
  );
}
