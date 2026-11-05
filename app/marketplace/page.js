"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  ExternalLink,
  Sparkles,
  Tag,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { getProducts, pickArray } from "../../lib/api";
import { PRODUCT_CATEGORIES, normalizeCategory, categoryLabel } from "../../lib/productCategories";
import { ErrorBox, Loading } from "../../components/Notice";

export default function MarketplacePage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("semua");

  useEffect(() => {
    let alive = true;
    getProducts()
      .then((d) => {
        if (alive) setItems(pickArray(d));
      })
      .catch((e) => {
        if (alive) setError(e);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Filter kategori memakai daftar canonical (bukan nilai bebas dari data),
  // supaya "cleanser" lama tetap masuk ke Face Wash.
  const categories = useMemo(() => ["semua", ...PRODUCT_CATEGORIES.map((c) => c.value)], []);

  const shown = items.filter((p) => {
    if (category !== "semua" && normalizeCategory(p.category) !== category) return false;
    if (!query.trim()) return true;
    const hay = `${p.brand || ""} ${p.name || ""} ${p.category || ""} ${p.description || ""}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <div className="badge badge-amber" style={{ marginBottom: "8px" }}>
          <ShoppingBag size={13} aria-hidden="true" />
          <span>DISPENSARI SKINCARE TERKURASI</span>
        </div>
        <h1>Marketplace Produk Perawatan</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14.5px", margin: "4px 0 0" }}>
          Katalog formula skincare terverifikasi. Link pembelian langsung mengarah ke toko resmi terdaftar.
        </p>
      </div>

      <ErrorBox error={error} />

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: "20px 24px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ position: "relative", flex: "1 1 280px" }}>
          <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari brand, nama produk, atau bahan aktif…"
            style={{
              width: "100%",
              padding: "10px 16px 10px 42px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--border-medium)",
              background: "var(--sand-50)",
              fontSize: "14px",
              color: "var(--text-main)",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", overflowX: "auto", maxWidth: "100%", alignItems: "center" }}>
          <Filter size={16} color="var(--brand-navy)" />
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`chip-btn ${category === c ? "btn-primary" : ""}`}
              style={{
                background: category === c ? "var(--brand-navy)" : "#ffffff",
                color: category === c ? "#ffffff" : "var(--ink-700)",
                borderColor: category === c ? "var(--brand-navy)" : "var(--border-medium)",
                textTransform: "capitalize",
              }}
            >
              {c === "semua" ? "Semua" : categoryLabel(c)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loading label="Memuat katalog skincare terverifikasi…" />
      ) : items.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
          <p>Belum ada produk di katalog database saat ini.</p>
        </div>
      ) : shown.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
          <p>Tidak ada produk yang cocok dengan pencarian kata kunci tersebut.</p>
        </div>
      ) : (
        <div className="marketplace-grid">
          {shown.map((p, i) => (
            <article key={p.id || i} className="product-dispensary-card">
              <div>
                <span className="product-brand-tag">{p.brand || "Laomera Formula"}</span>
                <h3>{p.name}</h3>
                <span className="badge badge-navy" style={{ marginBottom: "12px", fontSize: "11px" }}>
                  {categoryLabel(p.category)}
                </span>

                {p.description && (
                  <p className="product-meta-desc">
                    {p.description}
                  </p>
                )}

                {Array.isArray(p.skin_concern) && p.skin_concern.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--sage-600)", display: "block", marginBottom: "4px" }}>
                      Target Masalah:
                    </span>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {p.skin_concern.map((conc, cIdx) => (
                        <span key={cIdx} className="badge badge-success" style={{ fontSize: "10.5px", padding: "2px 8px" }}>
                          {conc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "16px" }}>
                {p.shopee_link && (
                  <a href={p.shopee_link} target="_blank" rel="noreferrer" className="btn btn-amber btn-sm" style={{ flex: "1 1 120px" }}>
                    <span>Shopee Official</span>
                    <ExternalLink size={13} />
                  </a>
                )}
                {p.tokopedia_link && (
                  <a href={p.tokopedia_link} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ flex: "1 1 120px" }}>
                    <span>Tokopedia</span>
                    <ExternalLink size={13} />
                  </a>
                )}
                {!p.shopee_link && !p.tokopedia_link && (
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Tersedia di Apotek & Klinik Rekanan
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
