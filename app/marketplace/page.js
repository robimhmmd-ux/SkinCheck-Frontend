"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getProducts, pickArray } from "../../lib/api";
import { ErrorBox, Loading } from "../../components/Notice";

// Marketplace: HANYA produk dari database backend (status aktif
// yang dikembalikan /api/v2/products). Link Shopee/Tokopedia
// ditampilkan hanya kalau memang ada di database — tidak ada
// link karangan, dan tidak ada produk contoh.
export default function MarketplacePage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("semua");

  useEffect(() => {
    let alive = true;
    getProducts()
      .then((d) => { if (alive) setItems(pickArray(d)); })
      .catch((e) => { if (alive) setError(e); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const categories = useMemo(() => {
    const s = new Set(items.map((p) => p.category).filter(Boolean));
    return ["semua", ...Array.from(s)];
  }, [items]);

  const shown = items.filter((p) => {
    if (category !== "semua" && p.category !== category) return false;
    if (!query.trim()) return true;
    const hay = `${p.brand || ""} ${p.name || ""} ${p.category || ""} ${p.description || ""}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

  return (
    <div className="me-shell">
      <h1 className="me-page-title">Marketplace</h1>
      <p className="muted">Produk perawatan dari katalog SkinCheck. Link pembelian mengarah ke Shopee / Tokopedia yang tercatat di database, bukan link buatan.</p>
      <ErrorBox error={error} />
      {loading ? <Loading /> : (
        <>
          <div className="me-filters">
            <label>Cari produk<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari brand atau nama produk…" /></label>
            <label>Kategori
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>
          {items.length === 0 ? (
            <p className="muted">Belum ada produk di katalog. {error ? "Periksa koneksi backend dulu." : "Produk akan tampil di sini setelah admin menambahkan katalog di database."}</p>
          ) : shown.length === 0 ? (
            <p className="muted">Tidak ada produk yang cocok dengan pencarianmu.</p>
          ) : (
            <div className="me-market-grid">
              {shown.map((p, i) => (
                <article key={p.id || i} className="me-market-card">
                  <p className="me-market-brand">{p.brand || "—"}</p>
                  <h2>{p.name}</h2>
                  <p className="muted">{p.category || ""}</p>
                  {p.description && <p>{p.description}</p>}
                  {Array.isArray(p.skin_concern) && p.skin_concern.length > 0 && (
                    <p className="muted">Cocok untuk: {p.skin_concern.join(", ")}</p>
                  )}
                  {p.usage_guidance && <p className="muted">{p.usage_guidance}</p>}
                  <div className="me-market-links">
                    {p.shopee_link ? <a className="btn" href={p.shopee_link} target="_blank" rel="noreferrer">Beli di Shopee</a> : null}
                    {p.tokopedia_link ? <a className="btn secondary" href={p.tokopedia_link} target="_blank" rel="noreferrer">Beli di Tokopedia</a> : null}
                    {!p.shopee_link && !p.tokopedia_link && <span className="muted">Belum ada link pembelian untuk produk ini.</span>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
      <p><Link href="/dashboard">Kembali ke dashboard</Link></p>
    </div>
  );
}
