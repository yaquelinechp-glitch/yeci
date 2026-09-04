"""Pure-Python PDF certificate generator with decorative design (Helvetica / WinAnsi)."""


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


def _text_line(text, size, x, y, color_rgb, bold=False):
    font = "/F2" if bold else "/F1"
    return f"BT {font} {size} Tf {color_rgb} rg 1 0 0 1 {x:.1f} {y} Tm ({_to_winansi(_pdf_escape(text))}) Tj ET"


def build_certificate_pdf(partner_name, course_title, score, date_str, lang="es", accent_rgb=(58, 170, 53)):
    """Return bytes of a single-page A4 (612x792 pt) certificate with decorative design."""
    if lang == "es":
        issuer = "aconso Partner Academy"
        doc_title = "CERTIFICADO"
        body = "se certifica que"
        completed = "ha completado satisfactoriamente el curso"
        score_label = "con una puntuacion de"
        date_label = "Fecha"
        cert_id_label = "ID de certificado"
    elif lang == "de":
        issuer = "aconso Partner Akademie"
        doc_title = "ZERTIFIKAT"
        body = "hiermit wird bescheinigt, dass"
        completed = "den Kurs erfolgreich abgeschlossen hat"
        score_label = "mit einer Punktzahl von"
        date_label = "Datum"
        cert_id_label = "Zertifikat-ID"
    else:
        issuer = "aconso Partner Academy"
        doc_title = "CERTIFICATE"
        body = "this certifies that"
        completed = "has successfully completed the course"
        score_label = "with a score of"
        date_label = "Date"
        cert_id_label = "Certificate ID"

    accent = " ".join(str(v) for v in accent_rgb)
    dark = "0.16 0.16 0.16"
    mid = "0.45 0.45 0.45"
    light_bg = "0.97 0.97 0.97"

    ops = []

    # Background light fill
    ops.append(f"q {light_bg} rg 0 0 612 792 re f Q")

    # Top decorative bar
    ops.append(f"q {accent} rg 0 740 612 52 re f Q")

    # Bottom decorative bar
    ops.append(f"q {accent} rg 0 0 612 40 re f Q")

    # Outer border
    ops.append(f"q 2 w {accent} rg 30 30 552 732 re S Q")

    # Inner border
    ops.append(f"q 0.8 w 0.7 0.7 0.7 rg 42 42 528 708 re S Q")

    # Decorative corner diamonds
    for cx, cy in [(42, 42), (570, 42), (42, 750), (570, 750)]:
        ops.append(f"q {accent} rg {cx} {cy} 5 0 360 arc f Q")

    # Small decorative line under header bar
    ops.append(f"q {accent} rg 180 730 252 1.5 re f Q")

    # "aconso" brand in header
    ops.append(_text_line(issuer, 14, 306, 762, "1 1 1", bold=True))

    # Certificate title
    ops.append(_text_line(doc_title, 28, 306, 700, accent, bold=True))

    # Decorative line under title
    ops.append(f"q {accent} rg 200 690 212 1 re f Q")

    # Body text
    y = 665
    ops.append(_text_line(body, 13, 306, y, dark))
    y -= 35

    # Partner name (large, bold)
    ops.append(_text_line(partner_name, 22, 306, y, dark, bold=True))
    y -= 15

    # Underline for name
    name_w = min(len(partner_name) * 11, 400)
    ops.append(f"q {accent} rg {306 - name_w/2:.1f} {y} {name_w:.1f} 0.8 re f Q")
    y -= 30

    # Course completion text
    ops.append(_text_line(completed, 13, 306, y, dark))
    y -= 28

    # Course title
    ops.append(_text_line(course_title, 16, 306, y, dark, bold=True))
    y -= 30

    # Score badge
    score_text = f"{score_label} {score}%"
    ops.append(_text_line(score_text, 13, 306, y, dark))
    y -= 25

    # Score visual bar
    bar_width = 200
    bar_x = 306 - bar_width / 2
    ops.append(f"q 0.85 0.85 0.85 rg {bar_x:.1f} {y} {bar_width} 8 re f Q")
    filled = int(bar_width * min(score, 100) / 100)
    if filled > 0:
        ops.append(f"q {accent} rg {bar_x:.1f} {y} {filled} 8 re f Q")
    y -= 30

    # Date and cert ID
    import hashlib
    cert_hash = hashlib.md5(f"{partner_name}:{course_title}:{score}:{date_str}".encode()).hexdigest()[:12].upper()
    ops.append(_text_line(f"{date_label}: {date_str}", 10, 200, y, mid))
    ops.append(_text_line(f"{cert_id_label}: {cert_hash}", 10, 410, y, mid))

    content = "\n".join(ops).encode("latin-1", "replace")
    objs = []
    objs.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    objs.append(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    objs.append(
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>"
    )
    objs.append(b"<< /Length %d >>\nstream\n" % len(content) + content + b"\nendstream")
    objs.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
    objs.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")

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
