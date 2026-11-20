# Firebase Security Specification - ReelPay BD

## Security-First Architecture

1. **Separated User & Admin Portals**:
   - **User App (`/`)**: Isolated standard user experience with zero admin links, hidden tap triggers, keyboard shortcuts, or admin login modals.
   - **Admin Portal (`/admin`)**: Isolated standalone portal rendered only when the URL path starts with `/admin`. Completely decoupled from user guest/feed shells.

2. **Mandatory Email Verification (Both Portals)**:
   - Both User and Admin portals enforce Firebase Authentication **and** `emailVerified === true` (`EmailVerificationGate`) before rendering any application dashboard or querying Firestore.
   - `firestore.rules` enforces `isSignedIn() => request.auth != null && request.auth.token.email_verified == true` across all collections. Unverified accounts are blocked at both UI and database rule layers.

3. **Admin Authorization (Zero Hardcoded Secrets)**:
   - Removed all hardcoded client passwords, OTP simulations, and `sessionStorage` privilege flags.
   - Admin access requires:
     1. Valid Firebase Authentication session
     2. `emailVerified === true`
     3. Server-verified identity matching the authorized Super Admin email or an existing `/admins/{uid}` document (server-managed; client writes to `/admins` are denied).
   - Unauthorized verified accounts navigating to `/admin` receive a `403 Access Denied` screen.

4. **PII Isolation (`users` vs `public_profiles`)**:
   - `/users/{userId}` (containing `phone`, `email`, `paymentAccountNumber`, `points`, `totalWithdrawn`) is strictly readable (`get`/`list`) only by the document owner (`request.auth.uid == userId`) or a verified Admin.
   - `/public_profiles/{userId}` stores strictly non-PII discovery fields (`id`, `name`, `avatar`, `isVerified`, `referralCode`, `followersCount`, `followingCount`, `followers`, `following`, `reelsWatchedCount`, `createdAt`) for creator profiles, search, follow graphs, and referral lookup.

5. **Scoped Collections & Ownership Invariants**:
   - **Reels (`/reels/{reelId}`)**: Readable by email-verified users; creatable/updatable/deletable by verified creator (`userId == request.auth.uid`) or Admin. Public engagement counters (`likesCount`, `commentsCount`, `sharesCount`, `viewsCount`) are scoped via `affectedKeys().hasOnly(...)`.
   - **Comments (`/reels/{reelId}/comments/{commentId}`)**: `userId == request.auth.uid` enforced on creation; reel existence checked via `exists(...)`; deletable by author or Admin.
   - **Withdrawals & Deposits (`/withdrawals`, `/deposits`)**: Users may only read their own requests (`resource.data.userId == request.auth.uid`) and create requests with `status == 'pending'`. Only verified Admins can list all requests or approve/reject (`update`/`delete`).
   - **Chats (`/chats/{sessionId}` & `messages`)**: Strictly scoped so only verified participants (`request.auth.uid in participants`) or Admins can read/create/update sessions and send/read messages.
   - **Settings & Tasks (`/settings`, `/tasks`)**: Readable by email-verified users; writable only by verified Admins.

---

## Security Test Payloads

### P1: Unverified Email Access
Attempt to read or write any collection with an unverified Firebase Auth token (`email_verified: false`).
**Expected: PERMISSION_DENIED**

### P2: Identity Spoofing (User Profile)
Attempt to create `/users/attacker_uid` while signed in as `victim_uid`.
**Expected: PERMISSION_DENIED**

### P3: Privilege Escalation (User Profile & Admins Collection)
Attempt to update own `role` to `'admin'` in `/users/{uid}` or write to `/admins/{uid}`.
**Expected: PERMISSION_DENIED**

### P4: PII Harvesting (`/users` List/Get)
Attempt by a regular verified user to `get` or `list` `/users/{other_uid}`.
**Expected: PERMISSION_DENIED**

### P5: Unauthorized Financial Approval
Attempt by a regular verified user to approve own withdrawal/deposit (`status: 'approved'`) or modify `totalWithdrawn`.
**Expected: PERMISSION_DENIED**

### P6: Chat Eavesdropping
Attempt by a non-participant user to read `/chats/{sessionId}` or `/chats/{sessionId}/messages`.
**Expected: PERMISSION_DENIED**

### P7: Unauthorized Settings / Task Mutation
Attempt by a non-admin user to write `/settings/{id}` or `/tasks/{id}`.
**Expected: PERMISSION_DENIED**
