"""Points engine (Motivate / Rewards): award, adjust and serialize points."""

from .models import PointTransaction

POINTS_BY_REASON = {
    "onboarding": 100,
    "deal_ganado": 250,
    "certificacion": 150,
    "mdf_reportado": 50,
}


def award_points(partner, reason, note="", source_type="", source_id=""):
    """Award points idempotently per (source_type, source_id). Returns tx or None."""
    amount = POINTS_BY_REASON.get(reason)
    if not amount:
        return None
    if source_type and source_id and PointTransaction.objects.filter(
        partner=partner, source_type=source_type, source_id=source_id
    ).exists():
        return None
    tx = PointTransaction.objects.create(
        partner=partner, amount=amount, reason=reason,
        note=note, source_type=source_type, source_id=source_id,
    )
    partner.points_balance += amount
    partner.points_earned += amount
    partner.save(update_fields=["points_balance", "points_earned"])
    return tx


def adjust_points(partner, amount, note="", admin=None):
    """Manual adjustment by admin (positive or negative). Returns tx or None."""
    amount = int(amount)
    if not amount:
        return None
    if amount < 0 and partner.points_balance + amount < 0:
        return None
    tx = PointTransaction.objects.create(
        partner=partner, amount=amount, reason="manual", note=note,
    )
    partner.points_balance += amount
    if amount > 0:
        partner.points_earned += amount
    partner.save(update_fields=["points_balance", "points_earned"])
    return tx


def spend_points(partner, amount, note="", source_type="", source_id=""):
    """Spend points (redemption). Returns tx or None if balance insufficient."""
    amount = int(amount)
    if amount <= 0 or partner.points_balance < amount:
        return None
    tx = PointTransaction.objects.create(
        partner=partner, amount=-amount, reason="canje",
        note=note, source_type=source_type, source_id=source_id,
    )
    partner.points_balance -= amount
    partner.save(update_fields=["points_balance"])
    return tx


def refund_points(partner, amount, note=""):
    """Refund points for a cancelled/rejected redemption. Returns tx or None."""
    amount = int(amount)
    if amount <= 0:
        return None
    tx = PointTransaction.objects.create(
        partner=partner, amount=amount, reason="manual",
        note=note, source_type="refund", source_id="",
    )
    partner.points_balance += amount
    partner.save(update_fields=["points_balance"])
    return tx


def point_serialize(tx):
    return {
        "id": tx.id,
        "amount": tx.amount,
        "reason": tx.reason,
        "note": tx.note,
        "created_at": tx.created_at.isoformat() if tx.created_at else "",
    }
