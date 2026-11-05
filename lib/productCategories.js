// Kategori jenis produk — SATU daftar canonical untuk marketplace (user)
// dan form produk (admin). Harus sama dengan PRODUCT_CATEGORIES di
// backend (app/models/product.py); nilai disimpan lowercase.
export const PRODUCT_CATEGORIES = [
  { value: "face wash", label: "Face Wash" },
  { value: "toner", label: "Toner" },
  { value: "serum", label: "Serum" },
  { value: "moisturizer", label: "Moisturizer" },
  { value: "sunscreen", label: "Sunscreen" },
  { value: "mask", label: "Masker" },
  { value: "exfoliator", label: "Eksfoliator" },
];

const LEGACY_CATEGORY_MAP = {
  cleanser: "face wash",
  facewash: "face wash",
  "face-wash": "face wash",
  pembersih: "face wash",
  sunblock: "sunscreen",
  "sun screen": "sunscreen",
  pelembap: "moisturizer",
};

export function normalizeCategory(value) {
  if (!value) return "";
  const key = String(value).trim().toLowerCase();
  return LEGACY_CATEGORY_MAP[key] || key;
}

export function categoryLabel(value) {
  const found = PRODUCT_CATEGORIES.find((c) => c.value === normalizeCategory(value));
  return found ? found.label : value || "Skincare";
}
