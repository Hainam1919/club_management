"""
Đồng bộ lại số liệu denormalized với dữ liệu thật.

- Club.member_count            = số Membership của CLB
- Event.current_participants   = số EventRegistration của sự kiện

Dữ liệu seed tạo số liệu trang trí (member_count 120-190, current_participants 40-80)
nhưng chỉ sinh ~52 membership / vài registration, khiến card và trang chi tiết
hiển thị hai con số khác nhau.

Cách dùng:
    python scripts/sync_counts.py                    # xem trước, không ghi
    python scripts/sync_counts.py --apply            # ghi Club.member_count
    python scripts/sync_counts.py --target events --apply
    python scripts/sync_counts.py --target all --apply
"""
import argparse
import logging
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import func  # noqa: E402

from app.database import SessionLocal  # noqa: E402
from app.models import Club, Event, EventRegistration, Membership  # noqa: E402


def collect_club_counts(db):
    """Chỉ tính membership đang active (thành viên đã rời có is_active=False)."""
    rows = (
        db.query(Membership.club_id, func.count(Membership.id).label("total"))
        .filter(Membership.is_active == True)  # noqa: E712
        .group_by(Membership.club_id)
        .all()
    )
    return {club_id: total for club_id, total in rows}


def collect_event_counts(db):
    rows = (
        db.query(EventRegistration.event_id, func.count(EventRegistration.id).label("total"))
        .group_by(EventRegistration.event_id)
        .all()
    )
    return {event_id: total for event_id, total in rows}


def main() -> int:
    parser = argparse.ArgumentParser(description="Đồng bộ member_count / current_participants")
    parser.add_argument(
        "--target",
        choices=["clubs", "events", "all"],
        default="clubs",
        help="clubs: chỉ Club.member_count (mặc định). events: chỉ Event.current_participants. all: cả hai.",
    )
    parser.add_argument("--apply", action="store_true", help="Ghi thay đổi vào database")
    args = parser.parse_args()

    logging.disable(logging.CRITICAL)  # tắt SQL echo
    db = SessionLocal()

    club_counts = collect_club_counts(db)
    event_counts = collect_event_counts(db)

    club_changes = []
    if args.target in ("clubs", "all"):
        for club in db.query(Club).order_by(Club.id).all():
            actual = club_counts.get(club.id, 0)
            if (club.member_count or 0) != actual:
                club_changes.append((club, club.member_count or 0, actual))

    event_changes = []
    if args.target in ("events", "all"):
        for event in db.query(Event).order_by(Event.id).all():
            actual = event_counts.get(event.id, 0)
            if (event.current_participants or 0) != actual:
                event_changes.append((event, event.current_participants or 0, actual))

    print(f"Club: {len(club_changes)}/{db.query(Club).count()} cần sửa member_count")
    for club, before, after in club_changes:
        print(f"  #{club.id:<3} {club.name[:38]:<40} {before:>6} -> {after:<6}")
    if args.target in ("events", "all"):
        print(f"Event: {len(event_changes)}/{db.query(Event).count()} cần sửa current_participants")
        for event, before, after in event_changes:
            print(f"  #{event.id:<3} {event.title[:38]:<40} {before:>6} -> {after:<6}")
    else:
        print("Event: bỏ qua (dùng --target events|all để kiểm tra current_participants)")

    if not args.apply:
        print("\nChạy lại với --apply để ghi vào database.")
        db.close()
        return 0

    for club, _before, after in club_changes:
        club.member_count = after
    for event, _before, after in event_changes:
        event.current_participants = after
    db.commit()
    print(f"\nĐã ghi: {len(club_changes)} club, {len(event_changes)} event.")
    db.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
