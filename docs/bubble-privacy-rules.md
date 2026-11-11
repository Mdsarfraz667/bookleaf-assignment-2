# Bubble Privacy Rules

Settings → Privacy. Define rules per data type.  
**Always check “View all fields” carefully — prefer explicit field access.**

## User
- Everyone can view: nothing sensitive beyond what’s needed for login redirects.
- Default: Users cannot find each other unless Current User is admin.

Suggested:
1. **Admin can view all Users**  
   When: `Current User's role is admin`  
   View all fields; Find this in searches.
2. **User can view themselves**  
   When: `This User is Current User`  
   View all fields.

## Author
1. **Admin — full access**  
   When: `Current User's role is admin`  
   View all / Find / Auto-binding.
2. **Author — own profile only**  
   When: `This Author is Current User's author_profile`  
   View all fields needed for dashboard; Find this in searches.

## Book
1. **Admin — full access**  
   When: `Current User's role is admin`
2. **Author — own books only**  
   When: `This Book's author is Current User's author_profile`

## NotificationLog
1. **Admin only**  
   When: `Current User's role is admin`  
   View all / Find / Create / Modify (via workflows).
2. Authors: **no access** (do not add an author rule).

## Workflow API / Data API
- If you enable Data API for debugging, protect with a private token and do **not** leave Privacy empty.
- Prefer Workflow API callback with an admin token / ignore privacy carefully documented in README.

## Isolation test (required)
1. Login as `priya.sharma@email.com` → only AUTH001 books.
2. Login as `ananya.reddy@email.com` → only AUTH003 books.
3. Login as admin → all authors + notification log.
