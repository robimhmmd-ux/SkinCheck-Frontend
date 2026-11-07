"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  PackageCheck,
  PackagePlus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Edit2,
  ExternalLink,
  Layers,
  X,
  RefreshCw,
  ShoppingBag,
  SlidersHorizontal,
  Droplets,
  Flame,
  Zap,
  Sun
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

  const activeCount = useMemo(() => {
    return rows.filter((r) => r.status === "active").length;
  }, [rows]);

  const marketplaceLinksCount = useMemo(() => {
    return rows.filter((r) => r.shopee_link || r.tokopedia_link).length;
  }, [rows]);

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
      {/* ── Header ── */}
      <div className="admin-view-header">
        <div className="admin-title-group">
          <div className="badge badge-amber" style={{ marginBottom: "6px" }}>
            <Package size={12} /> DIREKTORI FORMULASI SKINCARE
          </div>
          <h1>Katalog Produk & Rekomendasi Klinis</h1>
          <p>
            Kelola formula skincare, target masalah kulit, bahan aktif, dan tautan marketplace yang dipetakan oleh mesin rekomendasi AI.
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
            <PackagePlus size={14} /> Tambah Formulasi Produk
          </button>
        </div>
      </div>

      {/* ── KPI Telemetry Strip ── */}
      <div className="admin-stat-strip">
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-amber">
            <Package size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Formula Terdaftar</span>
            <span className="admin-stat-value">{total}</span>
            <span className="admin-stat-meta">Katalog sistem</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-emerald">
            <PackageCheck size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Produk Aktif Rekomendasi</span>
            <span className="admin-stat-value">{activeCount}</span>
            <span className="admin-stat-meta">Tampil di hasil scan AI</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-blue">
            <ShoppingBag size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Terhubung Marketplace</span>
            <span className="admin-stat-value">{marketplaceLinksCount}</span>
            <span className="admin-stat-meta">Shopee / Tokopedia aktif</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-purple">
            <Layers size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Kategori</span>
            <span className="admin-stat-value">{PRODUCT_CATEGORIES.length}</span>
            <span className="admin-stat-meta">Klasifikasi dermatologi</span>
          </div>
        </div>
      </div>

      {error && <ErrorBox error={error} />}

      {/* ── Form Create / Edit Modal Card ── */}
      {form && (
        <form onSubmit={onSubmit} className="admin-form-card">
          <div className="admin-form-header">
            <h3 className="admin-form-title">
              {form.id ? "Edit Spesifikasi Formulasi Produk" : "Tambah Produk & Bahan Aktif Baru"}
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
                placeholder="mis. Somethinc, Skintific, Avoskin"
                required
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
              <span className="admin-field-helper">Produsen resmi atau label formulasi</span>
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">Nama Produk Lengkap</label>
              <input
                className="admin-input-styled"
                placeholder="mis. 5% Niacinamide + Moisture Sabi Beet Serum"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <span className="admin-field-helper">Nama komersial produk</span>
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
              <span className="admin-field-helper">Menentukan urutan tahapan pemakaian skincare</span>
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">Status Visibilitas</label>
              <select
                className="admin-input-styled"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Active (Direkomendasikan AI & Marketplace)</option>
                <option value="inactive">Inactive (Disembunyikan)</option>
              </select>
              <span className="admin-field-helper">Mengontrol apakah muncul di saran rekomendasi</span>
            </div>

            <div className="admin-field-group col-span-2">
              <label className="admin-field-label">Kandungan Bahan Aktif (Pisahkan Koma)</label>
              <input
                className="admin-input-styled"
                placeholder="mis. Niacinamide 5%, Centella Asiatica, Hyaluronic Acid, Ceramide NP"
                value={form.ingredients}
                onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
              />
              <span className="admin-field-helper">Bahan penting yang dianalisis oleh bot konsultasi Laomera</span>
            </div>

            <div className="admin-field-group col-span-2">
              <label className="admin-field-label">Target Masalah Kulit (Pisahkan Koma)</label>
              <input
                className="admin-input-styled"
                placeholder="mis. Jerawat, Kulit Kering, Kemerahan, Dark Spots"
                value={form.skin_concern}
                onChange={(e) => setForm({ ...form, skin_concern: e.target.value })}
              />
              <span className="admin-field-helper">Dicocokkan dengan 5 detektor klinis VGG16</span>
            </div>

            <div className="admin-field-group col-span-2">
              <label className="admin-field-label">Deskripsi Klinis & Karakteristik</label>
              <textarea
                className="admin-input-styled"
                style={{ minHeight: "75px" }}
                placeholder="Jelaskan tekstur, keunggulan formula, atau target jenis kulit..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="admin-field-group col-span-2">
              <label className="admin-field-label">Petunjuk Pemakaian</label>
              <textarea
                className="admin-input-styled"
                style={{ minHeight: "65px" }}
                placeholder="mis. Oleskan 3-4 tetes pada wajah yang bersih di pagi dan malam hari sebelum pelembap..."
                value={form.usage_guidance}
                onChange={(e) => setForm({ ...form, usage_guidance: e.target.value })}
              />
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">Tautan Toko Shopee (Opsional)</label>
              <input
                className="admin-input-styled"
                placeholder="https://shopee.co.id/..."
                value={form.shopee_link}
                onChange={(e) => setForm({ ...form, shopee_link: e.target.value })}
              />
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">Tautan Toko Tokopedia (Opsional)</label>
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
              {busy ? "Menyimpan ke Database…" : "Simpan Formulasi Produk"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(null)}>
              Batalkan
            </button>
          </div>
        </form>
      )}

      {/* ── Filter & Search Toolbar ── */}
      <div className="admin-toolbar-card">
        <div className="admin-toolbar-left">
          <div className="admin-search-box">
            <Search size={15} className="search-icon" />
            <input
              placeholder="Cari nama produk, merek, atau bahan aktif…"
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
            Terapkan
          </button>

          <select
            className="admin-filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="semua">Semua Kategori Produk</option>
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
            <option value="">Semua Status Visibilitas</option>
            <option value="active">Active (Rekomendasi Aktif)</option>
            <option value="inactive">Inactive (Disembunyikan)</option>
          </select>
        </div>

        <div className="admin-toolbar-right">
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Ditemukan <strong>{displayedRows.length}</strong> formula produk
          </span>
        </div>
      </div>

      {/* ── Data Table Card ── */}
      <div className="admin-table-card">
        <div className="admin-table-card-head">
          <div className="admin-table-card-title">
            <PackageCheck size={18} color="var(--brand-navy)" />
            Direktori Katalog & Formulasi Aktif
          </div>
          <span className="admin-table-card-subtitle">
            Halaman {page} dari {totalPages}
          </span>
        </div>

        {loading && rows.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <Loading label="Mengambil katalog produk skincare..." />
          </div>
        ) : displayedRows.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <Package size={24} />
            </div>
            <h4 className="admin-empty-title">Tidak Ada Formulasi yang Cocok</h4>
            <p className="admin-empty-desc">
              Tidak ditemukan produk untuk kriteria filter atau pencarian saat ini.
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setQDraft("");
                setQ("");
                setStatus("");
                setCategoryFilter("semua");
              }}
            >
              Reset Filter Pencarian
            </button>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Produk & Label</th>
                  <th>Kategori</th>
                  <th>Bahan Aktif Utama</th>
                  <th>Target Masalah Kulit</th>
                  <th>Marketplace</th>
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
                          <span style={{ fontWeight: 600, color: "var(--brand-navy)", fontSize: "14px" }}>
                            {p.name}
                          </span>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {p.brand || "Tanpa Brand"}
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
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", maxWidth: "260px" }}>
                            {ingredientsArr.slice(0, 3).map((ing, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  background: "rgba(16, 185, 129, 0.08)",
                                  color: "#047857",
                                  border: "1px solid rgba(16, 185, 129, 0.15)"
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
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", maxWidth: "220px" }}>
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
                                gap: "3px",
                                padding: "2px 7px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                background: "rgba(238, 77, 45, 0.1)",
                                color: "#ee4d2d",
                                textDecoration: "none"
                              }}
                            >
                              Shopee <ExternalLink size={10} />
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
                                gap: "3px",
                                padding: "2px 7px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                background: "rgba(3, 172, 14, 0.1)",
                                color: "#03ac0e",
                                textDecoration: "none"
                              }}
                            >
                              Tokopedia <ExternalLink size={10} />
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
                            style={{ padding: "5px 10px", fontSize: "12px" }}
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
                              style={{ padding: "5px 10px", fontSize: "12px", color: "var(--crimson-500)" }}
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

        {/* ── Pagination ── */}
        <div className="admin-pagination-bar">
          <span className="admin-pagination-summary">
            Menampilkan halaman <strong>{page}</strong> dari <strong>{totalPages}</strong> total lembar
          </span>
          <div className="admin-pagination-actions">
            <button
              type="button"
              className="admin-page-btn"
              disabled={page <= 1}
              onClick={() => load(page - 1)}
            >
              <ChevronLeft size={14} /> Sebelumnya
            </button>
            <button
              type="button"
              className="admin-page-btn"
              disabled={page >= totalPages}
              onClick={() => load(page + 1)}
            >
              Berikutnya <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDeactivate}
        title="Nonaktifkan produk katalog?"
        message={
          pendingDeactivate
            ? `Nonaktifkan produk "${pendingDeactivate.name}"? Produk tidak dihapus dari basis data — status diubah menjadi inactive dan tidak akan muncul di rekomendasi maupun marketplace.`
            : ""
        }
        confirmLabel="Ya, Nonaktifkan Produk"
        onConfirm={confirmDeactivate}
        onCancel={() => setPendingDeactivate(null)}
      />
    </div>
  );
}
