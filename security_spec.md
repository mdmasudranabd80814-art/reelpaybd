# Firebase Security Specification - ReelPay BD

## Data Invariants
1. A user can only access and modify their own `User` profile.
2. Only users with the `admin` role can see and manage all `WithdrawalRequest` and `DepositRequest` documents.
3. Users can create `WithdrawalRequest` and `DepositRequest` for themselves.
4. `Reel` documents are publicly readable but only writable by admins.
5. `Comment` documents are publicly readable. Authenticated users can create comments on reels. Users can only delete their own comments.
6. Identity fields (`userId`, `authorId`, etc.) must match the `request.auth.uid`.
7. Timestamps like `createdAt` and `updatedAt` must be set using `request.time`.

## The "Dirty Dozen" Payloads

### P1: Identity Spoofing (User Profile)
Attempt to create a user profile for a different UID.
```json
{
  "path": "users/attacker_uid",
  "data": {
    "id": "attacker_uid",
    "name": "Attacker",
    "phone": "01711111111",
    "points": 999999,
    "role": "admin",
    "createdAt": "server_timestamp"
  },
  "auth": { "uid": "victim_uid" }
}
```
**Expected: PERMISSION_DENIED**

### P2: Privilege Escalation (User Profile)
Attempt to update own role to 'admin'.
```json
{
  "path": "users/user_uid",
  "data": { "role": "admin" },
  "auth": { "uid": "user_uid" }
}
```
**Expected: PERMISSION_DENIED**

### P3: Resource Poisoning (Reel ID)
Attempt to create a reel with an excessively long and malicious ID.
```json
{
  "path": "reels/very_long_id_with_malicious_characters_$%^&*...",
  "data": { ... },
  "auth": { "uid": "user_uid" }
}
```
**Expected: PERMISSION_DENIED**

### P4: Unauthorized Reel Creation
Attempt to create a reel as a non-admin user.
```json
{
  "path": "reels/new_reel",
  "data": { "title": "Free Money", "category": "সকল", "pointsReward": 1000 },
  "auth": { "uid": "user_uid", "role": "user" }
}
```
**Expected: PERMISSION_DENIED**

### P5: Unauthorized Withdrawal Access
Attempt to read all withdrawals as a regular user.
```json
{
  "path": "withdrawals",
  "auth": { "uid": "user_uid", "role": "user" }
}
```
**Expected: PERMISSION_DENIED**

### P6: Forged Withdrawal Ownership
Attempt to create a withdrawal request for another user's account.
```json
{
  "path": "withdrawals/req_01",
  "data": { "userId": "victim_uid", "amountBDT": 500, "status": "pending" },
  "auth": { "uid": "attacker_uid" }
}
```
**Expected: PERMISSION_DENIED**

### P7: State Shortcutting (Withdrawal)
Attempt to approve own withdrawal request.
```json
{
  "path": "withdrawals/req_01",
  "data": { "status": "approved" },
  "auth": { "uid": "user_uid" }
}
```
**Expected: PERMISSION_DENIED**

### P8: Comment Hijacking
Attempt to delete someone else's comment.
```json
{
  "path": "reels/reel_01/comments/comm_01",
  "auth": { "uid": "attacker_uid" }
}
```
**Expected: PERMISSION_DENIED**

### P9: Value Poisoning (Points)
Attempt to set points to a negative value.
```json
{
  "path": "users/user_uid",
  "data": { "points": -100 },
  "auth": { "uid": "user_uid" }
}
```
**Expected: PERMISSION_DENIED**

### P10: System-Only Field Modification
Attempt to modify `totalWithdrawn` directly.
```json
{
  "path": "users/user_uid",
  "data": { "totalWithdrawn": 1000000 },
  "auth": { "uid": "user_uid" }
}
```
**Expected: PERMISSION_DENIED**

### P11: Orphaned Comment
Attempt to create a comment on a non-existent reel.
```json
{
  "path": "reels/non_existent_reel/comments/comm_01",
  "data": { ... },
  "auth": { "uid": "user_uid" }
}
```
**Expected: PERMISSION_DENIED**

### P12: Timestamp Spoofing
Attempt to set a past date for `createdAt`.
```json
{
  "path": "comments/comm_01",
  "data": { "createdAt": "2020-01-01T00:00:00Z" },
  "auth": { "uid": "user_uid" }
}
```
**Expected: PERMISSION_DENIED**
