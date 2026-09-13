# 10. REST API Specification — CALLIVO

> **CALLIVO — Meet. Connect. Collaborate.**  
> Authoritative Reference for Backend HTTP Endpoints

---

## 1. API Global Standards

- **Base URL:** `https://callivo-f1n8.onrender.com` (Production) / `http://localhost:5000` (Local)
- **Data Format:** All request and response bodies use `application/json` (except binary avatar multipart uploads).
- **Authentication:** Authenticated routes require an HTTP Bearer header:
  `Authorization: Bearer <JWT_ACCESS_TOKEN>`
- **Response Format Convention:**
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Optional human-readable description"
  }
  ```

---

## 2. System & Infrastructure Endpoints

### `GET /health`
- **Auth Required:** No (Public)
- **Purpose:** Cloud container uptime monitoring.
- **Response:**
  ```json
  {
    "status": "healthy",
    "service": "CALLIVO Backend API",
    "uptime": 2341.2,
    "timestamp": "2026-09-13T11:45:00.000Z"
  }
  ```

### `GET /api/webrtc/ice-servers`
- **Auth Required:** No (Public)
- **Purpose:** Returns STUN and TURN server credentials for WebRTC NAT traversal.
- **Response:**
  ```json
  {
    "success": true,
    "iceServers": [
      {
        "urls": [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302"
        ]
      },
      {
        "urls": [
          "turn:openrelay.metered.ca:80",
          "turn:openrelay.metered.ca:443"
        ],
        "username": "openrelayproject",
        "credential": "openrelayproject"
      }
    ]
  }
  ```

---

## 3. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/register`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex@callivo.com",
    "password": "SecurePassword123!",
    "phone": "+15550192834",
    "avatar": "https://api.dicebear.com/7.x/initials/svg?seed=Alex"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-v4-string",
      "email": "alex@callivo.com",
      "name": "Alex Mercer",
      "role": "user"
    }
  }
  ```

### `POST /api/auth/login`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "alex@callivo.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response (200 OK):** Returns access token and user profile; sets HTTP-only `refreshToken` cookie.

### `POST /api/auth/google`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "alex.google@gmail.com",
    "name": "Alex Google",
    "avatar": "https://lh3.googleusercontent.com/..."
  }
  ```
- **Response (200 OK):** Provisions/locates user, sets cookie, returns CALLIVO JWT tokens.

### `POST /api/auth/refresh`
- **Auth Required:** No (Requires `refreshToken` cookie or body)
- **Response (200 OK):** Issues fresh 15-minute access token and rotated refresh token cookie.

### `POST /api/auth/forgot-password`
- **Auth Required:** No
- **Request Body:** `{ "email": "alex@callivo.com" }`
- **Response (200 OK):** Generic confirmation message; dispatches reset email if account exists.

### `POST /api/auth/reset-password`
- **Auth Required:** No
- **Request Body:** `{ "token": "uuid-reset-token", "password": "NewSecurePassword123!" }`
- **Response (200 OK):** Updates password hash in database and invalidates reset token.

### `POST /api/auth/change-password`
- **Auth Required:** Yes (`Bearer <token>`)
- **Request Body:** `{ "oldPassword": "CurrentPassword123!", "newPassword": "NewSecurePassword123!" }`
- **Response (200 OK):** Verifies current password and updates hash.

### `POST /api/auth/logout`
- **Auth Required:** No (Optional)
- **Response (200 OK):** Clears `refreshToken` cookie and updates user status to offline.

---

## 4. User Profile Endpoints (`/api/users`)

| Method | Path | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/me` / `/api/users/profile` | Yes | Retrieves authenticated user profile, settings, and stats. |
| `PATCH`| `/api/users/me` / `/api/users/profile` | Yes | Updates name, phone, bio, timezone, or language. |
| `POST` | `/api/users/avatar` / `/api/users/me/avatar` | Yes | Uploads base64 image (JPEG/PNG/WEBP $\le$ 5MB) with magic byte validation. |
| `DELETE`| `/api/users/avatar` / `/api/users/me/avatar`| Yes | Deletes uploaded avatar and reverts to initials. |
| `GET` | `/api/users/search?q={query}` | Yes | Searches users by name or email for contacts or invitations. |

---

## 5. Meetings Endpoints (`/api/meetings`)

| Method | Path | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/meetings` | Optional | Creates instant or scheduled meeting room with passcode and settings. |
| `GET` | `/api/meetings` | Yes | Lists all meetings hosted by or involving the authenticated user. |
| `GET` | `/api/meetings/:id` | Optional | Fetches meeting metadata, host details, and schedule. |
| `POST` | `/api/meetings/:id/lobby` | Optional | Verifies room status, validates passcode, and checks waiting room rules. |
| `POST` | `/api/meetings/:id/join` | Optional | Authoritative REST registration: creates/upserts `MeetingParticipant` in DB. |
| `POST` | `/api/meetings/:id/leave` | Optional | Marks `leftAt` timestamp for participant in database. |
| `GET` | `/api/meetings/:id/participants` | Optional | Lists active attendees currently present in the meeting. |
| `PATCH`| `/api/meetings/:id` / `.../settings` | Yes | Updates meeting settings (waitingRoom, muteOnEntry, lock status). |
| `POST` | `/api/meetings/:id/end` | Yes (Host) | Ends meeting for all participants, sets status to `ended`. |
| `DELETE`| `/api/meetings/:id` | Yes (Host) | Cancels and removes meeting from database. |

### In-Meeting Q&A & Comments Sub-Routes
- `GET /api/meetings/:id/questions` (Optional Auth): Lists all Q&A questions with vote counts.
- `POST /api/meetings/:id/questions` (Optional Auth): Submits a new question.
- `POST /api/meetings/:id/questions/:qId/vote` (Require Auth): Casts an upvote or downvote.
- `PATCH /api/meetings/:id/questions/:qId/answer` (Require Auth): Host answers a question.
- `PATCH /api/meetings/:id/questions/:qId/pin` (Require Auth): Pins/unpins question to the top.
- `GET /api/meetings/:id/comments` (Optional Auth): Retrieves timestamped meeting comments.
- `POST /api/meetings/:id/comments` (Optional Auth): Posts a new meeting comment.
- `DELETE /api/meetings/:id/comments/:cId` (Require Auth): Deletes an authored comment.
- `POST /api/meetings/:id/report` (Optional Auth): Files an abuse report against an attendee.

---

## 6. Contacts Endpoints (`/api/contacts`)

| Method | Path | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/contacts` | Yes | Retrieves user's contact list with online statuses. |
| `POST` | `/api/contacts` | Yes | Adds a new contact by target user's email address. |
| `PATCH`| `/api/contacts/:contactId/favorite` | Yes | Toggles favorite status for a contact. |
| `DELETE`| `/api/contacts/:contactId` | Yes | Removes contact from address book. |

---

## 7. Messages Endpoints (`/api/messages`)

| Method | Path | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/messages/conversations` | Yes | Retrieves list of active 1-on-1 direct conversations. |
| `GET` | `/api/messages/:partnerId` | Yes | Retrieves chat message history between user and partner. |
| `POST` | `/api/messages` | Yes | Sends a new direct message (`{ recipientId, content }`). |

---

## 8. Calendar Endpoints (`/api/calendar`)

| Method | Path | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/calendar?month=YYYY-MM` | Yes | Fetches all scheduled events for the requested month. |
| `POST` | `/api/calendar` | Yes | Creates a calendar event linked to an optional meeting ID. |
| `PATCH`| `/api/calendar/:id` | Yes | Updates date, start time, title, or category of an event. |
| `DELETE`| `/api/calendar/:id` | Yes | Deletes an event from the calendar. |

---

## 9. Recordings Endpoints (`/api/recordings`)

| Method | Path | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/recordings` | Yes | Lists all recorded meeting sessions for the user. |
| `POST` | `/api/recordings` | Yes | Registers recording metadata (duration, title, size). |
| `POST` | `/api/recordings/upload` | Yes | Uploads recorded media file blob to server storage. |
| `DELETE`| `/api/recordings/:id` | Yes | Deletes recording and associated file from storage. |

---

## 10. Notifications Endpoints (`/api/notifications`)

| Method | Path | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Yes | Returns user notifications and unread counter. |
| `PATCH`| `/api/notifications/:id/read` | Yes | Marks an individual notification as read. |
| `PATCH`| `/api/notifications/read-all` | Yes | Marks all notifications as read. |

---

## 11. Settings Endpoints (`/api/settings`)

| Method | Path | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/settings` | Yes | Retrieves user's audio, video, theme, and notification preferences. |
| `PATCH`| `/api/settings` | Yes | Updates hardware toggles (echoCancellation, resolution, etc.). |

---

## 12. Helpdesk Support Endpoints (`/api/helpdesk`)

| Method | Path | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/helpdesk/tickets` | Optional | Submits a support inquiry; generates unique reference (e.g., `HD-948102`). |
| `GET` | `/api/helpdesk/tickets` | Yes | Lists all support tickets filed by authenticated user. |
| `GET` | `/api/helpdesk/tickets/:referenceCode` | No | Public tracking: checks status of ticket via reference code. |
