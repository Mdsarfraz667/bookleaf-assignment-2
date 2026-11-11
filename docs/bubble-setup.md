# Bubble setup — click-by-click

Build order: **Data → Privacy → Auth → Pages → API Connector → Workflows**.

App name suggestion: `BookLeaf Royalty Dashboard`

Collaborator: `musavir@bookleafpub.in`  
(Settings → Collaboration → Add collaborator. If free plan blocks this, share live URL + test logins + Loom.)

---

## 1. Create app + enable auth

1. bubble.io → New app.
2. Settings → General → set app name.
3. Data → App data stays empty for now.
4. Use Bubble’s built-in **User** type (email/password signup/login).

---

## 2. Data types

### Option set: `UserRole`
- `author`
- `admin`

### Option set: `NotificationStatus`
- `Pending`
- `Success`
- `Failed`

### Option set: `PayoutStatus` (for filters/badges)
- `fully_paid`
- `pending`
- `overdue`
- `in_production`

### Data type: `Author`
| Field | Type |
| --- | --- |
| `author_id` | text |
| `name` | text |
| `email` | text |
| `phone` | text |
| `city` | text |
| `joined_date` | date |
| `books` | list of `Book` |
| `user` | User |
| `total_royalty_earned` | number |
| `total_royalty_paid` | number |
| `total_royalty_pending` | number |
| `payout_status` | `PayoutStatus` |
| `book_count` | number |

### Data type: `Book`
| Field | Type |
| --- | --- |
| `book_id` | text |
| `title` | text |
| `isbn` | text |
| `genre` | text |
| `publication_date` | date |
| `status` | text |
| `mrp` | number |
| `author_royalty_per_copy` | number |
| `total_copies_sold` | number |
| `total_royalty_earned` | number |
| `royalty_paid` | number |
| `royalty_pending` | number |
| `last_royalty_payout_date` | date |
| `print_partner` | text |
| `available_on` | list of texts |
| `author` | `Author` |
| `royalty_badge` | text (`Green` / `Yellow` / `Red` / `Gray`) |
| `payout_status` | `PayoutStatus` |

### Data type: `NotificationLog`
| Field | Type |
| --- | --- |
| `author` | `Author` |
| `triggered_at` | date |
| `completed_at` | date |
| `status` | `NotificationStatus` |
| `email_body` | text (long / multiline) |
| `error_message` | text |
| `request_id` | text |
| `triggered_by` | User |

### User (modify built-in)
| Field | Type |
| --- | --- |
| `role` | `UserRole` |
| `author_profile` | `Author` |

---

## 3. Import sample data

Files in `/data`:

1. **App Data → Author → Upload** `authors.csv`  
   Map columns 1:1. Skip `password` / `role` (those are for User accounts).
2. **App Data → Book → Upload** `books.csv`  
   After upload, link each Book’s `author` by matching `author_id`.  
   Easiest path for free plan:
   - Create a one-time admin page button “Link books” that for each Book finds Author where `author_id = This Book's author_id` and sets `author` + adds Book to Author’s `books` list.
   - Or link manually (18 rows).
3. Precomputed `royalty_badge` / `payout_status` are already in the CSV (as of 2026-11-11).  
   You can also recompute in a Bubble workflow using the rules in `docs/bubble-workflows.md`.

### Create login Users

Create these Users (Settings → or a Signup page used once):

| Email | Password | role | author_profile |
| --- | --- | --- | --- |
| `admin@bookleafpub.in` | `Admin@123` | admin | (empty) |
| `priya.sharma@email.com` | `Author@123` | author | AUTH001 |
| `ananya.reddy@email.com` | `Author@123` | author | AUTH003 |

Link remaining authors optionally for isolation testing (password `Author@123`).

---

## 4. Pages

| Page | Who | Purpose |
| --- | --- | --- |
| `index` | public | Login |
| `author_home` | author | My Books + Royalty Overview |
| `admin_home` | admin | Author list + filters + bulk trigger + log |
| `admin_author` | admin | Author detail + Generate & Send |
| `notification_log` | admin | Full log (optional; can be section on admin_home) |

### index (Login)
- Email + password inputs
- Log the user in
- On success:
  - if `Current User's role is admin` → go to `admin_home`
  - else → go to `author_home`
- Only when Current User is logged out

### author_home
- Header: “BookLeaf” + author name + Logout
- Group **Summary**: three text elements bound to Current User’s `author_profile` totals
- RG **My Books**: `Search for Books` where `author = Current User's author_profile`
  - columns: title, ISBN, genre, status, publication_date, MRP, available_on
  - royalty row: sold, earned, paid, pending, last payout
  - Badge group with conditional background:
    - Green if `royalty_badge = Green` (or pending = 0 & published)
    - Yellow if Yellow
    - Red if Red
    - Gray if in production

### admin_home
- RG Authors: all Authors
- Inputs: search (name contains), city dropdown, payout_status dropdown
- Constraints on RG combine these filters
- Each cell: name, city, book_count, total earned, total pending, payout_status, “View” → `admin_author?id=Current cell's Author's unique id`
- Button **Bulk Generate Pending Summaries** (see workflows)
- Group/RG **Notification Log** (latest 20)

### admin_author
- URL parameter `id` (Author)
- Display same royalty UI as author_home for that Author
- Button **Generate & Send Royalty Summary**

---

## 5. API Connector (n8n)

Plugins → API Connector → Add API `n8n_royalty`

**Shared header**
- `X-API-Key` = your shared secret (private)
- `Content-Type` = `application/json`

**Call: Trigger Royalty Summary**
- POST `https://<n8n-or-ngrok>/webhook/royalty-summary`
- Body (JSON):

```json
{
  "request_id": "<request_id>",
  "notification_log_id": "<log_unique_id>",
  "author_id": "<author_id>",
  "author": {
    "author_id": "<author_id>",
    "name": "<name>",
    "email": "<email>",
    "city": "<city>"
  },
  "books": [ /* built in workflow as list / or use JSON from a backend WF */ ]
}
```

For free-plan simplicity: use a **Backend workflow** that builds the JSON (or send author_id only and use the local automation mirror which loads from `bookleaf_sample_data.json`).

**Bubble callback endpoint** (Backend workflow as API):
- Expose workflow `update_notification_log` as public API / Workflow API
- Accepts: `request_id`, `status`, `email_body`, `error_message`, `completed_at`
- Finds NotificationLog by `request_id` and updates fields

Point n8n env `BUBBLE_CALLBACK_URL` at that Workflow API URL.

---

## 6. Privacy rules

See `docs/bubble-privacy-rules.md`. Apply before inviting reviewers.

---

## 7. Index for SEO / default

Set `index` as the default landing page. Remove unused template pages if present.
