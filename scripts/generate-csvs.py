#!/usr/bin/env python3
"""Regenerate data/authors.csv and data/books.csv from bookleaf_sample_data.json."""

from __future__ import annotations

import csv
import json
from datetime import date, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TODAY = date(2026, 11, 11)


def parse_date(value: str | None) -> date | None:
    if not value:
        return None
    return datetime.strptime(value[:10], "%Y-%m-%d").date()


def payout_status_for_book(book: dict) -> str:
    pending = book.get("royalty_pending") or 0
    status = book.get("status") or ""
    pub = parse_date(book.get("publication_date"))
    last = parse_date(book.get("last_royalty_payout_date"))
    published = "Published" in status
    if not published:
        return "in_production"
    if pending <= 0:
        return "fully_paid"
    if last is None:
        if pub and (TODAY - pub).days > 90:
            return "overdue"
        return "pending"
    if (TODAY - last).days > 90:
        return "overdue"
    return "pending"


def badge(book: dict) -> str:
    return {
        "fully_paid": "Green",
        "pending": "Yellow",
        "overdue": "Red",
        "in_production": "Gray",
    }[payout_status_for_book(book)]


def write_csv(path: Path, rows: list[dict]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    data = json.loads((ROOT / "data/bookleaf_sample_data.json").read_text())
    authors_rows: list[dict] = []
    books_rows: list[dict] = []

    for author in data["authors"]:
        books = author["books"]
        statuses = [
            payout_status_for_book(book)
            for book in books
            if "Published" in (book.get("status") or "")
        ]
        if any(status == "overdue" for status in statuses):
            author_payout = "overdue"
        elif any(status == "pending" for status in statuses):
            author_payout = "pending"
        elif statuses and all(status == "fully_paid" for status in statuses):
            author_payout = "fully_paid"
        else:
            author_payout = "in_production"

        authors_rows.append(
            {
                "author_id": author["author_id"],
                "name": author["name"],
                "email": author["email"],
                "phone": author["phone"],
                "city": author["city"],
                "joined_date": author["joined_date"],
                "password": "Author@123",
                "role": "author",
                "book_count": len(books),
                "total_royalty_earned": sum((b.get("total_royalty_earned") or 0) for b in books),
                "total_royalty_paid": sum((b.get("royalty_paid") or 0) for b in books),
                "total_royalty_pending": sum((b.get("royalty_pending") or 0) for b in books),
                "payout_status": author_payout,
            }
        )

        for book in books:
            books_rows.append(
                {
                    "book_id": book["book_id"],
                    "author_id": author["author_id"],
                    "author_email": author["email"],
                    "title": book["title"],
                    "isbn": book.get("isbn") or "",
                    "genre": book.get("genre") or "",
                    "publication_date": book.get("publication_date") or "",
                    "status": book.get("status") or "",
                    "mrp": "" if book.get("mrp") is None else book.get("mrp"),
                    "author_royalty_per_copy": ""
                    if book.get("author_royalty_per_copy") is None
                    else book.get("author_royalty_per_copy"),
                    "total_copies_sold": book.get("total_copies_sold") or 0,
                    "total_royalty_earned": book.get("total_royalty_earned") or 0,
                    "royalty_paid": book.get("royalty_paid") or 0,
                    "royalty_pending": book.get("royalty_pending") or 0,
                    "last_royalty_payout_date": book.get("last_royalty_payout_date") or "",
                    "print_partner": book.get("print_partner") or "",
                    "available_on": " | ".join(book.get("available_on") or []),
                    "royalty_badge": badge(book),
                    "payout_status": payout_status_for_book(book),
                }
            )

    write_csv(ROOT / "data/authors.csv", authors_rows)
    write_csv(ROOT / "data/books.csv", books_rows)
    write_csv(
        ROOT / "data/admins.csv",
        [
            {
                "email": "admin@bookleafpub.in",
                "name": "BookLeaf Admin",
                "password": "Admin@123",
                "role": "admin",
            }
        ],
    )
    print(f"Wrote {len(authors_rows)} authors and {len(books_rows)} books")


if __name__ == "__main__":
    main()
