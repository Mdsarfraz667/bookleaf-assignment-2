# Bubble workflows

## Badge / payout_status rules

Use as conditions on the badge Group, or recompute on import.

For a **Book**:
- If `status` does not contain `Published` → badge **Gray**, payout_status `in_production`
- Else if `royalty_pending` is 0 → **Green** / `fully_paid`
- Else if `last_royalty_payout_date` is empty:
  - if `publication_date` + 90 days < Current date/time → **Red** / `overdue`
  - else → **Yellow** / `pending`
- Else if Current date/time − `last_royalty_payout_date` > 90 days → **Red** / `overdue`
- Else → **Yellow** / `pending`

For an **Author** (roll-up):
- If any published book overdue → `overdue`
- Else if any published book pending → `pending`
- Else if all published books fully_paid → `fully_paid`
- Else → `in_production`

CSV files already contain computed badges as of **2026-11-11**.

---

## WF: Generate & Send Royalty Summary (admin_author button)

Only when `Current User's role is admin`.

1. **Create NotificationLog**
   - author = Current page Author
   - status = Pending
   - triggered_at = Current date/time
   - request_id = `Current date/time:formatted as ...` + Author’s author_id (or use a unique id plugin / random string)
   - triggered_by = Current User
2. **Set custom state** `sending = yes` on the button/page (shows spinner / disables button).
3. **API Connector → Trigger Royalty Summary**
   - Pass request_id, notification_log unique id, author fields, books list (or author_id only if using local automation with sample JSON).
   - **Timeout / error**: make change NotificationLog status = Failed, error_message = API error; set `sending = no`; show alert.
   - **Success**: if returned status Failed → update log Failed; else wait for callback OR update Success immediately if response includes `email_body`.
4. **Set custom state** `sending = no`.
5. **Optional**: show popup with returned email_body for admin preview.

### Idempotency
- Only run if there is **no** NotificationLog for this author with status Pending created in the last 60 seconds.
- Or: disable button while `sending = yes`.

---

## WF: Bulk Generate Pending Summaries (admin_home)

1. Schedule API workflow on a list:  
   `Search for Authors` where `total_royalty_pending > 0`  
   (or payout_status is pending/overdue)
2. For each Author → same steps as single Generate (create log + call webhook).
3. Show toast: “Triggered N authors”.

---

## Backend WF (API): `update_notification_log`

Expose as public Workflow API (or app connector from n8n).

Parameters: `request_id` (text), `status` (text), `email_body` (text), `error_message` (text), `completed_at` (date/text)

Actions:
1. Find NotificationLog where `request_id = request_id`
2. Make changes:
   - status = status
   - email_body = email_body
   - error_message = error_message
   - completed_at = completed_at / Current date/time

n8n / automation sets `BUBBLE_CALLBACK_URL` to this endpoint.

---

## Page load redirects
- On `author_home`: if Current User is not logged in → index; if role is admin → admin_home
- On `admin_home` / `admin_author`: if not logged in → index; if role is author → author_home
