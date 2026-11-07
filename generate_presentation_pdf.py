import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
    PageBreak,
)
from reportlab.pdfgen import canvas

# ── Color Palette ──
COLOR_NAVY = colors.HexColor("#172033")
COLOR_AMBER = colors.HexColor("#D9882A")
COLOR_INK = colors.HexColor("#2D3748")
COLOR_MUTED = colors.HexColor("#64748B")
COLOR_LIGHT_BG = colors.HexColor("#F8FAFC")
COLOR_CARD_BG = colors.HexColor("#F1F5F9")
COLOR_BORDER = colors.HexColor("#E2E8F0")
COLOR_ACCENT_BG = colors.HexColor("#FEF3C7")
COLOR_SUCCESS = colors.HexColor("#10B981")


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and print total page count."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(COLOR_MUTED)

        # Header (Pages > 1)
        if self._pageNumber > 1:
            self.drawString(2 * cm, 28.3 * cm, "LAOMERA — AI-Powered Skin Health Intelligence")
            self.drawRightString(A4[0] - 2 * cm, 28.3 * cm, "Panduan Presentasi & Naskah Demo (5 Anggota)")
            self.setStrokeColor(COLOR_BORDER)
            self.setLineWidth(0.5)
            self.line(2 * cm, 28.1 * cm, A4[0] - 2 * cm, 28.1 * cm)

        # Footer (All Pages)
        self.setStrokeColor(COLOR_BORDER)
        self.setLineWidth(0.5)
        self.line(2 * cm, 1.8 * cm, A4[0] - 2 * cm, 1.8 * cm)

        footer_text = "Dokumen Skrip Presentasi Tugas Rekayasa Perangkat Lunak / Capstone Project"
        self.drawString(2 * cm, 1.3 * cm, footer_text)
        page_str = f"Halaman {self._pageNumber} dari {total_pages}"
        self.drawRightString(A4[0] - 2 * cm, 1.3 * cm, page_str)
        self.restoreState()


def create_presentation_pdf(output_filename):
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=A4,
        leftMargin=1.8 * cm,
        rightMargin=1.8 * cm,
        topMargin=2.2 * cm,
        bottomMargin=2.2 * cm,
    )

    styles = getSampleStyleSheet()

    # ── Custom Typography Styles ──
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=30,
        textColor=COLOR_NAVY,
        alignment=0,
        spaceAfter=6,
    )

    subtitle_style = ParagraphStyle(
        "CoverSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=17,
        textColor=COLOR_AMBER,
        alignment=0,
        spaceAfter=15,
    )

    h1_style = ParagraphStyle(
        "Heading1_Custom",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=20,
        textColor=COLOR_NAVY,
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        "Heading2_Custom",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=COLOR_AMBER,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "Body_Custom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=COLOR_INK,
        spaceAfter=6,
    )

    script_box_style = ParagraphStyle(
        "Script_Speech",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=9,
        leading=13.5,
        textColor=COLOR_NAVY,
        spaceAfter=4,
    )

    action_style = ParagraphStyle(
        "Action_Instruction",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=12,
        textColor=COLOR_AMBER,
    )

    meta_label_style = ParagraphStyle(
        "MetaLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=COLOR_MUTED,
    )

    meta_val_style = ParagraphStyle(
        "MetaVal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=COLOR_INK,
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=COLOR_NAVY,
        alignment=1,
    )

    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=COLOR_INK,
    )

    qa_q_style = ParagraphStyle(
        "QA_Question",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=13,
        textColor=COLOR_NAVY,
    )

    qa_a_style = ParagraphStyle(
        "QA_Answer",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=COLOR_INK,
    )

    story = []

    # ── COVER / HEADER BANNER ──
    story.append(Paragraph("LAOMERA", title_style))
    story.append(Paragraph("PANDUAN LENGKAP PRESENTASI & SKENARIO LIVE DEMO (5 ANGGOTA)", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_AMBER, spaceBefore=0, spaceAfter=14))

    # Meta Overview Box
    meta_data = [
        [
            Paragraph("<b>Nama Projek:</b>", meta_label_style),
            Paragraph("Laomera (AI Skin Health Intelligence)", meta_val_style),
            Paragraph("<b>Format Tim:</b>", meta_label_style),
            Paragraph("5 Orang (Peran Terdistribusi)", meta_val_style),
        ],
        [
            Paragraph("<b>Arsitektur:</b>", meta_label_style),
            Paragraph("Next.js 14 (App Router) + FastAPI Python", meta_val_style),
            Paragraph("<b>Model AI:</b>", meta_label_style),
            Paragraph("VGG-16 Deep Learning CNN (5 Kondisi Wajah)", meta_val_style),
        ],
        [
            Paragraph("<b>Target Waktu:</b>", meta_label_style),
            Paragraph("15 – 20 Menit (Demo + Presentasi + Q&A)", meta_val_style),
            Paragraph("<b>Fokus Evaluasi:</b>", meta_label_style),
            Paragraph("Inovasi UX, Akurasi AI, Arsitektur Sistem, Kerapian Kode", meta_val_style),
        ],
    ]
    meta_table = Table(meta_data, colWidths=[2.6 * cm, 6.2 * cm, 2.6 * cm, 6.0 * cm])
    meta_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), COLOR_CARD_BG),
            ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # ── BAGIAN 1: RUNDOWN & DISTRIBUSI PERAN (TIMELINE TABLE) ──
    story.append(Paragraph("1. Tabel Distribusi Peran & Timeline Presentasi", h1_style))
    story.append(Paragraph(
        "Setiap pembicara memiliki durasi tepat <b>3–4 menit</b> agar alur presentasi dinamis, padat materi, dan demo tidak saling bertumpuk.",
        body_style,
    ))

    rundown_data = [
        [
            Paragraph("Pembicara", table_header_style),
            Paragraph("Peran & Posisi", table_header_style),
            Paragraph("Topik Bahasan Utama", table_header_style),
            Paragraph("Layar Demo Aktif", table_header_style),
            Paragraph("Durasi", table_header_style),
        ],
        [
            Paragraph("<b>Pembicara 1</b>", table_cell_style),
            Paragraph("Project Leader & UX Visionary", table_cell_style),
            Paragraph("Pembuka, Latar Belakang Masalah, Solusi Laomera, dan Visi Produk", table_cell_style),
            Paragraph("<b>Landing Page</b><br/>(3D Orbit & Our Vision Arc)", table_cell_style),
            Paragraph("3.5 Menit", table_cell_style),
        ],
        [
            Paragraph("<b>Pembicara 2</b>", table_cell_style),
            Paragraph("AI & Software Architect", table_cell_style),
            Paragraph("Arsitektur Full-Stack Decoupled, Model VGG-16, dan 5 Pilar Kondisi Kulit", table_cell_style),
            Paragraph("<b>Landing Page</b><br/>(Seksi 5 Kondisi & Fitur AI)", table_cell_style),
            Paragraph("3.5 Menit", table_cell_style),
        ],
        [
            Paragraph("<b>Pembicara 3</b>", table_cell_style),
            Paragraph("Frontend Lead & Demo Operator", table_cell_style),
            Paragraph("Live Demo modul Scan Kamera/Upload, Inference AI, dan Pembacaan Dossier Diagnosis", table_cell_style),
            Paragraph("<b>Halaman /scan</b><br/>& <b>Halaman /output</b>", table_cell_style),
            Paragraph("4.0 Menit", table_cell_style),
        ],
        [
            Paragraph("<b>Pembicara 4</b>", table_cell_style),
            Paragraph("Product Specialist & AI Assistant", table_cell_style),
            Paragraph("Mendemokan Floating Chatbot Widget (Laomera Asisten), State Persistence, dan Marketplace", table_cell_style),
            Paragraph("<b>Widget Chat Pop-up</b><br/>& <b>/marketplace</b>", table_cell_style),
            Paragraph("3.5 Menit", table_cell_style),
        ],
        [
            Paragraph("<b>Pembicara 5</b>", table_cell_style),
            Paragraph("Security Lead & Closing Presenter", table_cell_style),
            Paragraph("Dashboard Analytics, Jaminan Keamanan/Privasi Foto, Kesimpulan & Buka Sesi Q&A", table_cell_style),
            Paragraph("<b>Halaman /dashboard</b><br/>& <b>/profile</b>", table_cell_style),
            Paragraph("3.5 Menit", table_cell_style),
        ],
    ]

    t_rundown = Table(rundown_data, colWidths=[2.2 * cm, 3.4 * cm, 6.2 * cm, 3.6 * cm, 1.8 * cm])
    t_rundown.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), COLOR_CARD_BG),
            ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(t_rundown)
    story.append(Spacer(1, 14))

    # ── BAGIAN 2: SKRIP PER PEMBICARA ──
    story.append(Paragraph("2. Skrip Lengkap dan Panduan Demo Tiap Pembicara", h1_style))

    # Helper function for speaker box
    def add_speaker_section(speaker_title, role_desc, screen_guide, speech_script, transition_speech):
        content = []
        content.append(Paragraph(speaker_title, h2_style))
        content.append(Paragraph(f"<b>Peran:</b> {role_desc}", meta_val_style))
        content.append(Spacer(1, 4))

        # Action Box
        action_data = [[
            Paragraph("<b>AKSI DEMO LAYAR:</b>", action_style),
            Paragraph(screen_guide, body_style)
        ]]
        t_action = Table(action_data, colWidths=[3.2 * cm, 14.0 * cm])
        t_action.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), COLOR_ACCENT_BG),
            ("BOX", (0, 0), (-1, -1), 0.5, COLOR_AMBER),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("PADDING", (0, 0), (-1, -1), 6),
        ]))
        content.append(t_action)
        content.append(Spacer(1, 6))

        # Script Dialog
        content.append(Paragraph("<b>Naskah Dialog / Ucapan Pembicara:</b>", meta_label_style))
        script_box_data = [[Paragraph(speech_script, script_box_style)]]
        t_script = Table(script_box_data, colWidths=[17.2 * cm])
        t_script.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), COLOR_LIGHT_BG),
            ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ("PADDING", (0, 0), (-1, -1), 8),
        ]))
        content.append(t_script)
        content.append(Spacer(1, 6))

        # Transition Box
        trans_data = [[
            Paragraph("<b>KALIMAT TRANSISI:</b>", action_style),
            Paragraph(transition_speech, script_box_style)
        ]]
        t_trans = Table(trans_data, colWidths=[3.2 * cm, 14.0 * cm])
        t_trans.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), COLOR_CARD_BG),
            ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("PADDING", (0, 0), (-1, -1), 6),
        ]))
        content.append(t_trans)
        content.append(Spacer(1, 14))
        return content

    # ── PEMBICARA 1 ──
    p1_title = "Pembicara 1: Project Leader & Product Vision (00:00 – 03:30)"
    p1_role = "Membuka sesi, memperkenalkan tim, menguraikan masalah di masyarakat, dan mendemokan Hero Landing Page."
    p1_screen = "Tampilkan <b>Landing Page (http://localhost:3000)</b> secara fullscreen. Jangan scroll dulu. Biarkan audiens melihat animasi rotasi 3D orbital, lalu arahkan kursor ke node orbital untuk mendemokan efek hover-pause."
    p1_script = (
        "“Selamat pagi/siang kepada Bapak/Ibu dosen penguji serta rekan-rekan sekalian. "
        "Kami dari Kelompok 5 beranggotakan 5 orang, hari ini dengan bangga mempresentasikan dan mendemokan aplikasi "
        "yang kami kembangkan, yaitu <b>Laomera: AI-Powered Skin Health Intelligence</b>.<br/><br/>"
        "<b>Latar Belakang Masalah:</b> Selama berabad-abad, proses merawat dan memahami kondisi kulit wajah kita selalu dihadapkan "
        "pada metode coba-coba (trial and error) yang spekulatif. Membeli skincare mahal tanpa tahu persentase hidrasi atau inflamasi "
        "nyatanya sering kali justru merusak lapisan pelindung kulit (skin barrier).<br/><br/>"
        "<b>Solusi Laomera:</b> Laomera hadir menjembatani teknologi computer vision canggih dengan personalisasi ritual perawatan kulit. "
        "Seperti yang Bapak/Ibu saksikan pada layar depan, antarmuka Laomera dirancang dengan pendekatan <i>Editorial High-Fashion Minimalist</i>. "
        "Di tengah layar, kami mengimplementasikan <b>3D Orbital Stage</b> matematis yang berputar kontinu pada 60 FPS. "
        "Perhatikan bagaimana keempat node—<i>Full-Stack Innovation, Daily Ritual Reimagined, Beauty + Tech,</i> dan <i>Safe & Effortless</i>—"
        "secara dinamis meluruh ke opasitas transparan saat menyentuh sudut elips samping dan muncul kembali dengan anggun saat melintas di depan. "
        "Lalu jika kita scroll sedikit ke bawah, terdapat seksi <b>Our Vision</b> yang mengurasi lengkungan sejarah perawatan kulit manusia dari era Prasejarah, "
        "Mesir Kuno, hingga era modern.”"
    )
    p1_trans = "“Selanjutnya, rekan saya Pembicara 2 akan membedah arsitektur sistem dan model Deep Learning di balik keakuratan diagnosis Laomera. Kepada rekan saya, dipersilakan.”"
    story.extend(add_speaker_section(p1_title, p1_role, p1_screen, p1_script, p1_trans))

    # ── PEMBICARA 2 ──
    p2_title = "Pembicara 2: AI & Software Architecture Specialist (03:30 – 07:00)"
    p2_role = "Menjelaskan arsitektur perangkat lunak terpisah (Decoupled), model Convolutional Neural Network VGG-16, dan parameter 5 pilar kulit."
    p2_screen = "Scroll ke seksi <b>'5 PILAR DIAGNOSIS'</b> dan seksi <b>'KEUNGGULAN SISTEM'</b> di Landing Page. Tunjuk ikon visual masing-masing kondisi kulit."
    p2_script = (
        "“Terima kasih Pembicara 1. Bapak/Ibu penguji, di balik tampilan elegan Laomera, sistem kami dibangun di atas arsitektur "
        "<b>Decoupled Full-Stack</b> modern.<br/><br/>"
        "1. <b>Frontend:</b> Menggunakan Next.js 14 dengan App Router, React Server Components untuk loading instan, dan GPU-accelerated CSS.<br/>"
        "2. <b>Backend:</b> Berjalan di atas microframework Python FastAPI berkecepatan tinggi yang mengekspos endpoint RESTful di rute <code>/api/v2</code>.<br/><br/>"
        "<b>Inti Kecerdasan Buatan (AI Engine):</b> Kami menerapkan transfer learning berbasis arsitektur <b>VGG-16 Convolutional Neural Network</b>. "
        "Model ini dilatih untuk mengenali karakteristik mikroskopis tekstur wajah manusia dan memetakannya secara objektif ke dalam <b>5 Pilar Kondisi Kulit</b>:<br/>"
        "• <i>Jerawat (Acne Vulgaris):</i> Mengklasifikasi papula, pustula, inflamasi, dan komedo.<br/>"
        "• <i>Kulit Kering (Dehydration):</i> Mengukur integritas lapisan epidermis dan defisit kelembapan.<br/>"
        "• <i>Kelebihan Minyak (Excess Sebum):</i> Mengevaluasi reflektansi minyak pada zona T (dahi, hidung) dan area pipi.<br/>"
        "• <i>Dark Spots (Hyperpigmentation):</i> Segmentasi bercak melanin bekas jerawat dan paparan radiasi UV.<br/>"
        "• <i>Kerutan & Garis Halus (Fine Lines):</i> Mendeteksi kerapatan mikro-lipatan elastisitas kolagen.<br/><br/>"
        "Model ini tidak memberikan vonis subjektif, melainkan skor probabilitas persentase yang presisi untuk menentukan resep bahan aktif skincare.”"
    )
    p2_trans = "“Sekarang, mari kita buktikan secara langsung cara kerja pemindaian ini. Pembicara 3 akan mendemokan alur Scan Kulit hingga Dossier Diagnosis.”"
    story.extend(add_speaker_section(p2_title, p2_role, p2_screen, p2_script, p2_trans))

    # Page Break for clean multi-page layout
    story.append(PageBreak())

    # ── PEMBICARA 3 ──
    p3_title = "Pembicara 3: Frontend Lead & Demo Operator (07:00 – 11:00)"
    p3_role = "Menjalankan Live Demo interaktif: proses pemindaian wajah, pengiriman payload ke inference engine, dan pembacaan Dossier Hasil Diagnostik."
    p3_screen = "Klik tombol <b>'Mulai Scan Kulit'</b> (masuk ke <code>/scan</code>). Tunjukkan panduan kamera, pilih opsi Upload Foto Sampel Wajah, lalu klik <b>'Analisis Kondisi Kulit'</b>. Tunggu proses loading, hingga otomatis berpindah ke halaman Dossier <code>/output</code>."
    p3_script = (
        "“Terima kasih Pembicara 2. Mari kita masuk ke demonstrasi langsung fitur utama Laomera.<br/><br/>"
        "Saat pengguna mengklik 'Mulai Scan Kulit', sistem membawa kita ke halaman <code>/scan</code>. "
        "Di sini tersedia dua moda input: <b>Kamera Langsung</b> atau <b>Unggah Berkas Foto</b>. "
        "Sistem kami dilengkapi panduan pencahayaan dan deteksi pose wajah agar citra yang masuk memenuhi standar klinis inference.<br/><br/>"
        "<i>[Operator mengunggah foto sampel wajah dan menekan tombol Analisis]</i><br/><br/>"
        "Dalam hitungan detik, payload dikirim secara terenkripsi ke backend AI, dan kita diarahkan langsung ke halaman <b>Dossier Diagnostik (/output)</b>.<br/><br/>"
        "Bisa kita lihat bersama di layar:<br/>"
        "1. <b>Overall Skin Score:</b> Menampilkan indeks kesehatan kulit teragregasi (misal 84/100).<br/>"
        "2. <b>Breakdown 5 Kondisi:</b> Setiap pilar ditampilkan dengan skor persentase objektif beserta tag keparahan (Ringan, Sedang, Perlu Perhatian).<br/>"
        "3. <b>Rekomendasi Bahan Aktif (Active Ingredients):</b> Berdasarkan diagnosis AI, sistem secara cerdas menyarankan formulasi bahan aktif yang cocok—seperti Niacinamide 5% untuk kontrol sebum, Ceramide Complex untuk memperkuat skin barrier, dan Salicylic Acid terukur—menghindarkan pengguna dari bahan iritan.”"
    )
    p3_trans = "“Lalu, bagaimana jika pengguna masih bingung dengan hasil skornya? Pembicara 4 akan mendemokan asisten AI interaktif kami: Laomera Asisten.”"
    story.extend(add_speaker_section(p3_title, p3_role, p3_screen, p3_script, p3_trans))

    # ── PEMBICARA 4 ──
    p4_title = "Pembicara 4: Product Specialist & AI Assistant Lead (11:00 – 14:30)"
    p4_role = "Mendemokan Floating Chatbot Widget (Laomera Asisten), persistensi navigasi tanpa refresh, serta integrasi kurasi Marketplace Skincare."
    p4_screen = "Klik logo bulat melayang <b>Laomera Asisten</b> di sudut kanan bawah. Tunjukkan jendela pop-up terbuka. Klik quick chip <i>'Apa kandungan aktif untuk jerawat?'</i>. Lalu sambil obrolan terbuka, klik menu <b>Marketplace</b> di navigasi. Tunjukkan obrolan TIDAK TERTUTUP dan pesan tetap utuh! Terakhir klik menu <b>Profil</b>, tunjukkan obrolan OTOMATIS TERTUTUP demi keamanan."
    p4_script = (
        "“Terima kasih Pembicara 3. Salah satu inovasi UX paling krusial pada proyek Laomera adalah <b>Laomera Asisten</b>.<br/><br/>"
        "Pada platform konvensional, fitur chatbot sering diletakkan di halaman terpisah yang memutus fokus pengguna. "
        "Di Laomera, chatbot kami rancang sebagai <b>Floating Pop-up Widget</b> yang hidup secara persisten di root layout global.<br/><br/>"
        "Perhatikan tombol bulat melayang di sudut kanan bawah. Saat saya klik, jendela konsultasi terbuka mulus dengan salam personal: "
        "<i>'Halo! Aku Laomera Asisten, asisten dermatologi AI pribadimu.'</i><br/><br/>"
        "Mari kita uji pertanyaannya: <i>'Apa kandungan aktif untuk jerawat dan hidrasi?'</i>. "
        "Asisten AI merespon dengan cepat, menguraikan bahan aktif yang aman secara dermatologis.<br/><br/>"
        "<b>Keunggulan Persistensi Navigasi:</b> Sekarang perhatikan, saat saya berpindah ke halaman <b>Marketplace (/marketplace)</b>, "
        "jendela Laomera Asisten <b>tidak tertutup dan riwayat percakapan tidak hilang</b>! Pengguna bisa membaca rekomendasi AI sambil memilah produk skincare terverifikasi di katalog marketplace.<br/><br/>"
        "<b>Aturan Privasi & Keamanan:</b> Namun, ketika pengguna berpindah ke halaman <b>Profil & Pengaturan Akun (/profile)</b>, "
        "sistem secara reaktif mendeteksi rute dan <b>otomatis menutup pop-up obrolan</b> untuk menjamin kerahasiaan data pribadi pengguna.”"
    )
    p4_trans = "“Untuk aspek pemantauan jangka panjang, keamanan data foto, dan penutup presentasi, akan dilanjutkan oleh Pembicara 5.”"
    story.extend(add_speaker_section(p4_title, p4_role, p4_screen, p4_script, p4_trans))

    # ── PEMBICARA 5 ──
    p5_title = "Pembicara 5: Security & QA Lead, Closing Presenter (14:30 – 18:00)"
    p5_role = "Mendemokan Dashboard Pelacakan Berkala, menguraikan tata kelola privasi & enkripsi, menyimpulkan nilai projek, dan membuka sesi Tanya Jawab."
    p5_screen = "Buka halaman <b>/dashboard</b>. Tunjukkan tombol collapsible sidebar (bisa disembunyikan/dibuka), kartu status kesehatan, dan histori perbandingan skor dari scan ke scan."
    p5_script = (
        "“Terima kasih Pembicara 4. Bapak/Ibu dosen penguji, perawatan kulit bukanlah aksi satu kali, melainkan komitmen berkelanjutan.<br/><br/>"
        "Oleh karena itu, Laomera menyediakan <b>Workspace Dashboard (/dashboard)</b> yang dilengkapi sidebar fleksibel yang dapat di-hide "
        "agar ruang kerja tetap lega. Di sini pengguna dapat memantau <i>Skin Health Progression</i>: membandingkan skor kelembapan dan inflamasi "
        "setiap dua minggu sekali untuk membuktikan efektivitas skincare yang mereka gunakan.<br/><br/>"
        "<b>Keamanan, Privasi & Kepatuhan Etika:</b><br/>"
        "• <i>Stateless Ephemeral Processing:</i> Foto wajah yang diunggah diproses dalam memori RAM sementara inference engine dan tidak pernah disimpan secara permanen atau diperjualbelikan.<br/>"
        "• <i>Autentikasi Aman:</i> Sesi dilindungi oleh Cookie HTTP-Only dengan perlindungan CSRF dan validasi token JWT.<br/>"
        "• <i>Production Ready:</i> Seluruh 15 rute frontend telah dioptimasi dengan Next.js compiler dengan hasil 100% lulus build produksi tanpa galat.<br/><br/>"
        "<b>Kesimpulan:</b> Laomera membuktikan bahwa perpaduan kecerdasan buatan, desain estetis, dan arsitektur web modern "
        "mampu menghadirkan solusi nyata bagi jutaan masyarakat dalam merawat kulit secara objektif, aman, dan percaya diri.<br/><br/>"
        "Demikian presentasi dari kelompok kami. Waktu dan tempat kami kembalikan kepada Bapak/Ibu dosen penguji untuk sesi tanya jawab. Terima kasih.”"
    )
    p5_trans = "“Presentasi selesai. Seluruh 5 anggota tim siap menjawab pertanyaan teknis maupun konseptual dari dewan penguji.”"
    story.extend(add_speaker_section(p5_title, p5_role, p5_screen, p5_script, p5_trans))

    # Page Break for Q&A Chapter
    story.append(PageBreak())

    # ── BAGIAN 3: PANDUAN MENJAWAB PERTANYAAN DOSEN PENGUJI (DEFENSE GUIDE) ──
    story.append(Paragraph("3. Panduan Menjawab Pertanyaan Kritis Penguji (Q&A Defense Guide)", h1_style))
    story.append(Paragraph(
        "Berikut adalah daftar pertanyaan paling sering diajukan dalam ujian proyek perangkat lunak/AI beserta jawaban ilmiah yang direkomendasikan.",
        body_style,
    ))

    qa_list = [
        (
            "Q1. Mengapa memilih arsitektur VGG-16, bukan ResNet atau YOLO?",
            "“VGG-16 memiliki struktur konvolusi bertingkat (3x3 receptive field) yang sangat peka terhadap ekstraksi fitur mikro-tekstur seperti pori-pori, eritema jerawat, dan deposisi melanin. Sedangkan arsitektur seperti YOLO lebih dioptimalkan untuk object detection kotak batas (bounding box), bukan evaluasi intensitas tekstur permukaan kulit secara merata.”",
            "Pembicara 2 (AI Engineer)",
        ),
        (
            "Q2. Bagaimana sistem mengatasi foto wajah dengan pencahayaan buruk atau blur?",
            "“Pada layer preprocessing sebelum masuk ke model CNN, sistem menjalankan validasi citra: pemeriksaan Laplacian Variance untuk mendeteksi blur, serta Adaptive Histogram Equalization (CLAHE) untuk menyeimbangkan kontras pencahayaan. Jika foto di bawah ambang batas kelayakan, sistem akan meminta foto ulang dan menolak inferensi acak.”",
            "Pembicara 2 / 3",
        ),
        (
            "Q3. Mengapa chatbot dibuat sebagai floating widget global dan bukan halaman terpisah?",
            "“Berdasarkan prinsip human-computer interaction (HCI), konsultasi AI bersifat multi-tasking. Pengguna sering kali ingin bertanya sembari melihat katalog produk atau mengecek detail hasil scan. Meletakkan widget di root layout memungkinkan state persistence (obrolan tidak restart saat route berganti) tanpa membebani browser.”",
            "Pembicara 4 (Product Specialist)",
        ),
        (
            "Q4. Bagaimana sistem menjamin keamanan foto wajah pengguna dari kebocoran data?",
            "“Citra wajah diproses dengan arsitektur ephemeral: file diubah menjadi buffer byte di memori, diekstraksi menjadi vektor numerik fitur oleh model AI, kemudian buffer langsung di-flush dari memori server. Tidak ada foto mentah yang disimpan di disk publik atau database penyimpanan permanen.”",
            "Pembicara 5 (Security Lead)",
        ),
        (
            "Q5. Apakah rekomendasi bahan aktif skincare ini memiliki dasar ilmiah valid?",
            "“Tentu. Sistem rekomendasi kami berbasis knowledge-base dermatologi terverifikasi yang memetakan skor pilar kondisi ke formula aktif standar: jerawat tinggi memicu rekomendasi BHA (Salicylic Acid) dan Zinc, dehidrasi memicu Hyaluronic Acid dan Ceramide, serta hiperpigmentasi memicu Niacinamide dan Alpha Arbutin dengan konsentrasi aman.”",
            "Pembicara 3 / 4",
        ),
    ]

    for q, a, who in qa_list:
        qa_card_data = [
            [Paragraph(f"<b>{q}</b>", qa_q_style)],
            [Paragraph(f"<b>Penjawab Ideal:</b> {who}", meta_label_style)],
            [Paragraph(f"<b>Strategi Jawaban:</b> {a}", qa_a_style)],
        ]
        t_qa = Table(qa_card_data, colWidths=[17.2 * cm])
        t_qa.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), COLOR_LIGHT_BG),
            ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ]))
        story.append(t_qa)
        story.append(Spacer(1, 8))

    # ── BAGIAN 4: CHECKLIST PRA-PRESENTASI (PRE-FLIGHT) ──
    story.append(Spacer(1, 6))
    story.append(Paragraph("4. Checklist Teknis Sebelum Maju Presentasi (Pre-Flight Checklist)", h1_style))
    checklist_items = [
        "1. <b>Server Lokal Aktif:</b> Pastikan frontend Next.js (port 3000) dan backend FastAPI (port 8000) sudah running.",
        "2. <b>Browser Fullscreen:</b> Tekan <code>F11</code> pada browser untuk menyembunyikan bookmark bar dan URL bar agar terlihat seperti aplikasi desktop premium.",
        "3. <b>Foto Sampel Berkualitas:</b> Siapkan 1 file foto wajah dengan pencahayaan merata di Desktop agar siap diunggah seketika tanpa mencari-cari folder.",
        "4. <b>Akun Demo Siap:</b> Login terlebih dahulu dengan akun demo yang sudah memiliki riwayat pemindaian agar halaman Dashboard dan Riwayat langsung terisi grafik visual.",
        "5. <b>Uji Suara & Transisi:</b> Lakukan latihan peralihan mikrofon antar pembicara minimal 1 kali agar transisi kalimat mengalir tanpa jeda hening yang canggung.",
    ]
    for item in checklist_items:
        story.append(Paragraph(item, body_style))

    # Build PDF with dynamic page numbering
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF berhasil dibuat: {output_filename}")


if __name__ == "__main__":
    out_path = os.path.join(os.getcwd(), "public", "PANDUAN_PRESENTASI_LAOMERA_5_ORANG.pdf")
    create_presentation_pdf(out_path)

