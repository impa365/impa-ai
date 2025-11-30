# Testing Guide: Security Vulnerabilities Verification

## Overview

This guide explains how to test the three security fixes implemented in the reminder/cron system.

---

## Quick Test: Check Logs

After deploying the fixed code and running the cron:

```bash
# SSH into your server/container
ssh user@your-server
cd /path/to/impa-ai

# Follow logs in real-time
docker-compose logs -f impa-ai_worker

# Or check specific security logs
docker-compose logs impa-ai_worker | grep "\[SECURITY\]"
docker-compose logs impa-ai_worker | grep "\[reminder-cron\]\[AUDIT\]"
```

### Expected Output

**Healthy System Should Show:**

```log
[reminder-cron] Starting cron execution...
[SECURITY] Validating 15 triggers...
[SECURITY] Trigger trigger-001: agentId 'agent-123' found ✓
[SECURITY] Trigger trigger-002: eventTypeId '456' comes from trigger.scope_reference
[reminder-cron][AUDIT] Enviando mensagem {
  triggerId: 'trigger-001',
  agentId: 'agent-123',
  agentName: 'John Sales',
  connectionId: 'conn-xyz',
  recipientNumber: '****9999',
  bookingUid: 'abcd1234',
  eventTypeId: '123',
  timestamp: '2025-01-20T10:30:45.000Z'
}
[reminder-cron] Cron completed. Sent: 5, Failed: 0
```

**Error Indicators (Investigate Immediately):**

```log
[SECURITY] ⚠️ EVENTO CONFUSION DETECTADO: Trigger trigger-001 esperava eventTypeId="123" mas recebeu 1 agendamentos com eventTypeId diferente
  trigger: trigger-001
  expectedEventTypeId: 123
  wrongEventTypeIds: [ '456' ]
  agent: agent-123
  bookingUids: [ 'wrong-booking-id' ]
```

---

## Test 1: Agent ID Validation

### Scenario
Verify that triggers without valid agent_id are skipped.

### Setup
```sql
-- Create a bad trigger (NULL agent_id)
INSERT INTO reminder_triggers (
  id, agent_id, offset_amount, offset_unit, 
  webhook_url, action_type, is_active
) VALUES (
  'trigger-bad-001', NULL, 10, 'minutes',
  NULL, 'webhook', true
);

-- Create a good trigger for comparison
INSERT INTO reminder_triggers (
  id, agent_id, offset_amount, offset_unit,
  webhook_url, action_type, is_active
) VALUES (
  'trigger-good-001', 'agent-123', 10, 'minutes',
  NULL, 'webhook', true
);
```

### Execute Cron
```bash
docker-compose exec impa-ai_worker node lib/reminders/run-reminder-cron.ts
```

### Verify
Check logs for:
```
[SECURITY] Trigger trigger-bad-001 has no valid agent_id, will be ignored
[SECURITY] Trigger trigger-good-001: agentId 'agent-123' found ✓
```

### Expected Result
✅ Bad trigger ignored, good trigger processed

---

## Test 2: Agent Lookup Validation

### Scenario
Verify that triggers referencing non-existent agents are skipped.

### Setup
```sql
-- Create trigger pointing to non-existent agent
INSERT INTO reminder_triggers (
  id, agent_id, offset_amount, offset_unit,
  webhook_url, action_type, is_active
) VALUES (
  'trigger-orphan', 'agent-doesnt-exist', 10, 'minutes',
  NULL, 'webhook', true
);
```

### Execute Cron
```bash
docker-compose exec impa-ai_worker node lib/reminders/run-reminder-cron.ts
```

### Verify
Check logs for:
```
[SECURITY] Agent not found: agent-doesnt-exist
```

### Expected Result
✅ Agent lookup fails, trigger skipped

---

## Test 3: Event Confusion Detection

### Scenario
Simulate Cal.com returning a booking for wrong event (edge case).

### Setup
```sql
-- Agent with API key (so bookings will be fetched)
UPDATE ai_agents 
SET calendar_api_key = 'test-key-123'
WHERE id = 'agent-xyz';

-- Trigger for EVENT_A
INSERT INTO reminder_triggers (
  id, agent_id, offset_amount, offset_unit,
  scope_reference, webhook_url, action_type, is_active
) VALUES (
  'trigger-event-a', 'agent-xyz', 10, 'minutes',
  '123',  ← EVENT_A ID
  'http://webhook.example.com', 'webhook', true
);

-- Create booking with WRONG event ID in DB
-- (This would normally come from Cal.com API, but we're simulating edge case)
```

### Simulate Cal.com Response (Advanced)

Create a test file `test-event-confusion.ts`:

```typescript
// This simulates Cal.com returning wrong eventTypeId
import { normalizeBooking } from './lib/reminders/run-reminder-cron'

const calcomResponse = {
  eventType: {
    id: "456",  // ⚠️ WRONG - expecting "123"
    name: "Technical Meeting"
  },
  id: "booking-xyz",
  uid: "abc@calendar",
  status: "ACCEPTED",
  startTime: new Date().toISOString(),
  attendees: [{ name: "John", email: "john@example.com" }]
}

const normalized = normalizeBooking(calcomResponse)
console.log("Normalized booking:", normalized)
// Should show: calcomEventTypeId: "456" (captured for validation)
```

### Execute Test
```bash
cd /path/to/impa-ai
npx ts-node test-event-confusion.ts
```

### Verify
```
Normalized booking: {
  id: 'booking-xyz',
  uid: 'abc@calendar',
  title: 'Technical Meeting',
  status: 'ACCEPTED',
  startTime: '2025-01-20T10:30:45.000Z',
  calcomEventTypeId: '456',  ← Captured!
  raw: { ... }
}
```

### Expected Result
✅ calcomEventTypeId properly captured and available for validation

---

## Test 4: Cross-Event Validation Logic

### Scenario
Verify that bookings with wrong eventTypeId are filtered out.

### Manual Test Code

Create `test-event-validation.ts`:

```typescript
// Test the event validation logic
const eventTypeId = "123"  // Expected event

const bookings = [
  { 
    calcomEventTypeId: "123",  // ✅ Correct
    uid: "booking-1",
    title: "Sales Meeting"
  },
  { 
    calcomEventTypeId: "456",  // ❌ Wrong
    uid: "booking-2", 
    title: "Tech Review"
  },
  { 
    calcomEventTypeId: "123",  // ✅ Correct
    uid: "booking-3",
    title: "Another Sales"
  },
]

// Apply validation
const bookingsWithMismatch = bookings.filter((booking) => {
  const bookingEventTypeId = booking.calcomEventTypeId
  return bookingEventTypeId && bookingEventTypeId !== eventTypeId
})

console.log("Mismatches found:", bookingsWithMismatch.length)
// Expected: 1 (only booking-2 has wrong eventTypeId)

if (bookingsWithMismatch.length > 0) {
  console.error(`[SECURITY] 🚨 EVENTO CONFUSION DETECTED`)
  console.error("Expected:", eventTypeId)
  console.error("Got wrong events:", bookingsWithMismatch.map(b => b.calcomEventTypeId))
  
  // Filter valid bookings
  const validBookings = bookings.filter((booking) => {
    const bookingEventTypeId = booking.calcomEventTypeId
    return !bookingEventTypeId || bookingEventTypeId === eventTypeId
  })
  
  console.log("After filtering:", validBookings.length)
  // Expected: 2 (only correct events remain)
}
```

### Execute
```bash
npx ts-node test-event-validation.ts
```

### Expected Output
```
Mismatches found: 1
[SECURITY] 🚨 EVENTO CONFUSION DETECTED
Expected: 123
Got wrong events: [ '456' ]
After filtering: 2
```

### Expected Result
✅ Mismatch detected and filtered

---

## Test 5: Audit Logging

### Scenario
Verify that every message send is logged with complete details.

### Setup
```bash
# Start tailing logs
docker-compose logs -f impa-ai_worker > /tmp/cron-logs.txt &
```

### Execute Cron
```bash
docker-compose exec impa-ai_worker node lib/reminders/run-reminder-cron.ts --dry-run false
```

### Verify
```bash
# Check for audit logs
grep "\[reminder-cron\]\[AUDIT\]" /tmp/cron-logs.txt

# Expected output:
# [reminder-cron][AUDIT] Enviando mensagem {
#   triggerId: 'trigger-001',
#   agentId: 'agent-xyz',
#   agentName: 'John Sales',
#   connectionId: 'conn-abc',
#   recipientNumber: '****9999',
#   bookingUid: 'booking-123',
#   eventTypeId: '456',
#   timestamp: '2025-01-20T10:30:45.000Z',
#   status: 'sent'
# }
```

### Verification Checklist
- [ ] triggerId is present
- [ ] agentId matches trigger.agent_id
- [ ] agentName is readable
- [ ] connectionId is present
- [ ] recipientNumber is masked (last 4 digits visible)
- [ ] bookingUid matches Cal.com booking
- [ ] eventTypeId matches trigger.scope_reference
- [ ] timestamp is ISO format

### Expected Result
✅ All message sends recorded with complete forensic trail

---

## Test 6: End-to-End Integration Test

### Scenario
Full test with multiple agents, events, and triggers.

### Setup
```sql
-- Agent 1: Sales team
INSERT INTO ai_agents (id, name, calendar_api_key, calendar_meeting_id)
VALUES ('agent-sales', 'Sales Bot', 'key-sales', '111');

-- Agent 2: Tech team
INSERT INTO ai_agents (id, name, calendar_api_key, calendar_meeting_id)
VALUES ('agent-tech', 'Tech Bot', 'key-tech', '222');

-- Trigger 1: Sales reminders
INSERT INTO reminder_triggers (id, agent_id, scope_reference, offset_amount, action_type)
VALUES ('trigger-sales', 'agent-sales', '111', 10, 'webhook');

-- Trigger 2: Tech reminders
INSERT INTO reminder_triggers (id, agent_id, scope_reference, offset_amount, action_type)
VALUES ('trigger-tech', 'agent-tech', '222', 10, 'webhook');
```

### Execute Cron
```bash
docker-compose exec impa-ai_worker node lib/reminders/run-reminder-cron.ts
```

### Verify All Security Layers

1. **Agent Validation** ✅
   - Both agents found successfully
   - Log: `[SECURITY] Trigger trigger-sales: agentId 'agent-sales' found`

2. **Event Matching** ✅
   - Sales trigger uses event 111 (not 222)
   - Tech trigger uses event 222 (not 111)
   - No "EVENTO CONFUSION" messages

3. **Audit Logging** ✅
   - Sales reminders show eventTypeId: 111
   - Tech reminders show eventTypeId: 222
   - Each send has complete audit trail

4. **Message Routing** ✅
   - Sales messages go to sales webhook
   - Tech messages go to tech webhook
   - No cross-contamination

### Expected Result
✅ All security layers working correctly with proper isolation

---

## Monitoring in Production

### Key Queries

**Get all security warnings in last hour:**
```bash
docker-compose logs --since 1h impa-ai_worker | grep "\[SECURITY\]"
```

**Count event confusion detections:**
```bash
docker-compose logs impa-ai_worker | grep -c "EVENTO CONFUSION"
# Expected: 0 (if healthy)
```

**Count successful reminders:**
```bash
docker-compose logs impa-ai_worker | grep -c "status.*sent"
# Expected: should be high percentage
```

**Check average response time:**
```bash
docker-compose logs impa-ai_worker | grep "Cron completed" | tail -10
# Look for "Sent: X, Failed: Y" ratios
```

---

## Troubleshooting

### Issue: "EVENTO CONFUSION DETECTED" in logs

**Possible Causes:**
1. Cal.com API returning unexpected data
2. Database corruption (eventTypeId changed)
3. API key pointing to wrong calendar

**Resolution:**
1. Check Cal.com API response manually
2. Verify database values: `SELECT * FROM reminder_triggers WHERE id = 'trigger-xxx'`
3. Verify API key: `SELECT calendar_api_key, calendar_meeting_id FROM ai_agents WHERE id = 'agent-xxx'`

### Issue: "Agent not found" warnings

**Possible Causes:**
1. Agent was deleted but trigger still active
2. Trigger agent_id incorrect (typo)

**Resolution:**
1. Deactivate trigger: `UPDATE reminder_triggers SET is_active = false WHERE id = '...'`
2. Or fix agent_id: `UPDATE reminder_triggers SET agent_id = 'correct-agent' WHERE id = '...'`

### Issue: No audit logs appearing

**Possible Causes:**
1. Reminders not being sent (check cron execution)
2. Dry-run mode enabled
3. No bookings found in time window

**Resolution:**
1. Check cron logs: `docker-compose logs impa-ai_worker`
2. Disable dry-run: Check environment variables
3. Verify triggers have upcoming bookings

---

## Regression Testing

After deploying updates, run this checklist:

- [ ] Normal reminders still send (no new errors)
- [ ] Audit logs have complete details
- [ ] No "SECURITY" warnings for valid triggers
- [ ] Event confusion detection works if simulated
- [ ] Cross-agent isolation maintained
- [ ] Message routing correct

---

## Success Criteria

**All tests pass when:**

1. ✅ Valid triggers processed successfully
2. ✅ Invalid triggers skipped with warning
3. ✅ Agents validated before access
4. ✅ Events validated before sending
5. ✅ All sends audited with complete details
6. ✅ No cross-agent/cross-event contamination
7. ✅ Logs clear and actionable

---

**Last Updated:** 2025-01-20  
**For Questions:** Contact your security team
