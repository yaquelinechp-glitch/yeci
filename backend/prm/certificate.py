"""Minimal pure-Python PDF certificate generator (Helvetica / WinAnsi)."""


def _pdf_escape(text):
    out = []
    for ch in text:
        if ch in "\\()":
            out.append("\\" + ch)
        else:
            out.append(ch)
    return "".join(out)


def _to_winansi(text):
    try:
        return text.encode("latin-1", "replace").decode("latin-1")
    except Exception:
        return ""


def build_certificate_pdf(partner_name, course_title, score, date_str, lang="es", accent_rgb=(58, 170, 53)):
    """Return bytes of a single-page A4 (612x792 pt) certificate."""
    if lang == "es":
        issuer = "aconso Partner Academy"
        doc_title = "CERTIFICADO"
        body = "se certifica que"
        completed = "ha completado satisfactoriamente el curso"
        score_label = "con una puntuacion de"
        date_label = "Fecha"
    elif lang == "de":
        issuer = "aconso Partner Akademie"
        doc_title = "ZERTIFIKAT"
        body = "hiermit wird bescheinigt, dass"
        completed = "den Kurs erfolgreich abgeschlossen hat"
        score_label = "mit einer Punktzahl von"
        date_label = "Datum"
    else:
        issuer = "aconso Partner Academy"
        doc_title = "CERTIFICATE"
        body = "this certifies that"
        completed = "has successfully completed the course"
        score_label = "with a score of"
        date_label = "Date"

    entries = [
        (issuer, 24, "accent"),
        (doc_title, 17, "dark"),
        ("", 14, "dark"),
        (body, 12, "dark"),
        (partner_name, 17, "dark"),
        (completed, 12, "dark"),
        (course_title, 14, "dark"),
        (f"{score_label} {score}%", 11, "dark"),
        ("", 14, "dark"),
        (f"{date_label}: {date_str}", 11, "dark"),
    ]

    accent = " ".join(str(v) for v in accent_rgb)
    ops = []
    # decorative border
    ops.append("q 1.5 w %s rg 36 36 540 720 re S 2.5 w 44 44 524 704 re S Q" % accent)
    # small fill bar
    ops.append("q %s rg 306 52 0 4 m 306 56 l 0 0 0 0 h Q" % accent)

    y = 690
    for text, size, color in entries:
        txt = _to_winansi(_pdf_escape(text))
        if txt:
            width = size * 0.5 * len(txt)
            x = 306 - width / 2
        else:
            x = 306
        fill = accent if color == "accent" else "0.16 0.16 0.16"
        ops.append(f"BT /F1 {size} Tf {fill} rg 1 0 0 1 {x:.1f} {y} Tm ({txt}) Tj ET")
        y -= size * 1.55

    content = "\n".join(ops).encode("latin-1", "replace")
    objs = []
    objs.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    objs.append(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    objs.append(
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>"
    )
    objs.append(b"<< /Length %d >>\nstream\n" % len(content) + content + b"\nendstream")
    objs.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")

    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for i, obj in enumerate(objs, start=1):
        offsets.append(len(out))
        out += str(i).encode() + b" 0 obj\n" + obj + b"\nendobj\n"

    xref_pos = len(out)
    out += f"xref\n0 {len(objs) + 1}\n".encode()
    out += b"0000000000 65535 f \n"
    for off in offsets:
        out += f"{off:010d} 00000 n \n".encode()
    out += f"trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode()
    return bytes(out)
