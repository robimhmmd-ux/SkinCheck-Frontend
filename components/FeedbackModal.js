"use client";
import { useState } from "react";
import { X, Star, ThumbsUp, Send, CheckCircle2, Sparkles, MessageSquareHeart } from "lucide-react";
import { useToast } from "./Toast";

const FEEDBACK_TAGS = [
  "Akurasi Deteksi AI",
  "Tampilan & Desain",
  "Rekomendasi Skincare",
  "Respon Chatbot Asisten",
  "Kemudahan Penggunaan",
  "Kecepatan Analisis",
];

export default function FeedbackModal({ open, onClose }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState(["Akurasi Deteksi AI", "Tampilan & Desain"]);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();

  if (!open) return null;

  function toggleTag(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      rating,
      tags: selectedTags,
      comment: comment.trim(),
      name: name.trim() || "Pengguna Anonim",
      created_at: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem("skincheck_user_feedbacks") || "[]");
      existing.unshift(payload);
      localStorage.setItem("skincheck_user_feedbacks", JSON.stringify(existing.slice(0, 30)));
    } catch {
      // ignore storage errors
    }

    setSubmitted(true);
    toast.success("Terima kasih! Feedback kamu berhasil dikirim.");
    setTimeout(() => {
      setSubmitted(false);
      setComment("");
      onClose();
    }, 1800);
  }

  return (
    <div className="feedback-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="feedback-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="feedback-modal-header">
          <div className="feedback-header-title-wrap">
            <div className="feedback-icon-badge" aria-hidden="true">
              <MessageSquareHeart size={20} />
            </div>
            <div>
              <h3 className="feedback-title">Beri Masukan & Feedback</h3>
              <p className="feedback-subtitle">Bantu kami meningkatkan akurasi dan kenyamanan Laomera.</p>
            </div>
          </div>
          <button
            type="button"
            className="feedback-close-btn"
            onClick={onClose}
            aria-label="Tutup form feedback"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="feedback-success-state">
            <CheckCircle2 size={48} className="feedback-success-icon" />
            <h4>Masukan Kamu Telah Diterima!</h4>
            <p>Terima kasih telah meluangkan waktu. Setiap saran sangat berharga untuk pengembangan model AI kami.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="feedback-modal-body">
            {/* Rating Stars */}
            <div className="feedback-field-group">
              <label className="feedback-label">Seberapa puas kamu dengan Laomera?</label>
              <div className="feedback-stars-row" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      className={`star-rate-btn ${active ? "active" : ""}`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      aria-label={`Beri nilai ${star} dari 5`}
                    >
                      <Star size={26} fill={active ? "#d9882a" : "none"} stroke={active ? "#d9882a" : "#b2bac9"} />
                    </button>
                  );
                })}
                <span className="star-rating-hint">
                  {rating === 5 ? "Luar biasa!" : rating === 4 ? "Sangat bagus" : rating === 3 ? "Cukup baik" : "Perlu ditingkatkan"}
                </span>
              </div>
            </div>

            {/* Tags Selection */}
            <div className="feedback-field-group">
              <label className="feedback-label">Aspek apa yang paling berkesan bagimu?</label>
              <div className="feedback-tags-cloud">
                {FEEDBACK_TAGS.map((tag) => {
                  const sel = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      className={`feedback-chip ${sel ? "selected" : ""}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {sel && <Sparkles size={12} />}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment Area */}
            <div className="feedback-field-group">
              <label htmlFor="fb-comment" className="feedback-label">
                Pesan, kritik, atau saran untuk kami:
              </label>
              <textarea
                id="fb-comment"
                rows={3}
                className="feedback-textarea"
                placeholder="Ceritakan pengalamanmu menggunakan fitur scan, rekomendasi skincare, atau asisten AI..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {/* User Name */}
            <div className="feedback-field-group">
              <label htmlFor="fb-name" className="feedback-label">
                Nama atau panggilan kamu (opsional):
              </label>
              <input
                id="fb-name"
                type="text"
                className="feedback-input"
                placeholder="Contoh: Sarah / Pengguna Baru"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Submit Actions */}
            <div className="feedback-modal-foot">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                Batal
              </button>
              <button type="submit" className="btn btn-amber btn-sm">
                <Send size={15} />
                <span>Kirim Feedback</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

