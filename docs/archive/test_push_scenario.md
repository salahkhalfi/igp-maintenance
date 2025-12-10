# 🧪 TEST SCENARIO: Push Notification for New Ticket

## Test Setup
- User: Brahim (user_id: 6)
- Action: Create new ticket and assign to Brahim
- Expected: Brahim receives push notification immediately

## What We're Testing
1. **Direct push** (not queue) - Brahim is already subscribed
2. **Ticket creation flow** - Does it call sendPushNotification?
3. **Push logs** - Will we see success/failure in push_logs?

## Expected Database Changes
- New ticket created in `tickets` table
- New push_log created with user_id=6, status='success' or 'failed'
- If Brahim is online: Notification appears on his device
- If Brahim is offline: Notification queued

## Current Brahim Status
- Subscription: Active (device ID 89, created 2025-11-22 14:28:37)
- Endpoint: https://fcm.googleapis.com/fcm/send/...
- Device: Chrome on Windows

## Monitoring Commands
```bash
# Watch push_logs in real-time
sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*/db.sqlite \
"SELECT id, user_id, ticket_id, status, error_message, created_at 
 FROM push_logs 
 WHERE user_id = 6 
 ORDER BY created_at DESC 
 LIMIT 5;"

# Check pending_notifications
sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*/db.sqlite \
"SELECT id, user_id, title, body, created_at 
 FROM pending_notifications 
 WHERE user_id = 6;"
```

## Key Code Paths to Watch

### 1. Ticket Creation (tickets.ts)
- POST /api/tickets - Creates ticket
- Should call sendPushNotification() for assigned technician
- Check if this code exists in tickets.ts

### 2. sendPushNotification() (push.ts)
- Will queue notification (skipQueue=false by default)
- Will attempt immediate send if subscription exists
- Should create push_log entry

### 3. Push Logs
- Success: status='success', sentCount > 0
- Failure: status='failed', error_message contains details

## Test Execution
1. ⬜ Create ticket via UI
2. ⬜ Assign to Brahim
3. ⬜ Check push_logs immediately
4. ⬜ Check Brahim's device for notification
5. ⬜ Verify notification content

## Expected Results
✅ Push notification sent to Brahim's device
✅ push_logs entry created
✅ Notification appears on device (if online)
✅ OR notification queued (if offline)

## Failure Scenarios
❌ No push_log created → sendPushNotification() not called in tickets.ts
❌ push_log status='failed' → Check error_message for details
❌ push_log status='success' but no notification → FCM issue or device issue
