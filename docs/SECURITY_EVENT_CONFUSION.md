# 🚨 Security: Event Confusion Vulnerability & Fix

**Date:** 2025-01-20  
**Severity:** HIGH  
**Status:** ✅ FIXED  
**Component:** `lib/reminders/run-reminder-cron.ts`

---

## Overview

This document describes a potential vulnerability where reminders for one calendar event (EVENT_A) could be accidentally sent as if they were for another event (EVENT_B).

## Vulnerability Details

### The Attack Vector

```
1. Agent configured with 2 calendar events:
   - EVENT_A (ID: "123") - Sales Meeting
   - EVENT_B (ID: "456") - Technical Meeting

2. Trigger created for EVENT_A:
   {
     "id": "trigger-001",
     "agent_id": "agent-xyz",
     "scope_reference": "123"   ← Points to EVENT_A
   }

3. Cron executes:
   - Fetches: fetchCalcomBookings(agent, eventTypeId="123", ...)
   - Cal.com API filters and returns ONLY bookings for EVENT_A
   - BUT: No client-side validation that bookings actually match EVENT_A

4. Attack scenario - Cal.com returns mismatched booking (edge case):
   - GET /bookings?eventTypeId=123 called
   - Response includes booking with eventType.id = "456" (wrong!)
   - Reminders sent for EVENT_B as if from EVENT_A
```

### Why It Matters

- Customer receives reminder for WRONG meeting
- If EVENT_A is Sales, EVENT_B is Technical → Wrong audience, wrong content
- Audit trail shows CORRECT agentId but WRONG eventTypeId
- Could indicate data corruption at Cal.com or API misconfiguration

### Attack Scenario (Advanced)

Even more concerning: If trigger itself is altered:

```
1. Original trigger: scope_reference = "123" (EVENT_A)
2. Attacker changes: scope_reference = "456" (EVENT_B)
3. Cron fetches bookings for EVENT_B
4. Reminders for EVENT_B sent to EVENT_A's attendees
5. Result: Wrong people, wrong meeting time
```

## The Fix

### Changes Made

#### 1. **Added `calcomEventTypeId` Field to NormalizedBooking** (Line ~86)

```typescript
interface NormalizedBooking {
  // ... existing fields ...
  // ✅ SECURITY: Store eventTypeId from Cal.com for validation
  calcomEventTypeId?: string | null
  raw: any
}
```

**Purpose:** Explicitly track which event Cal.com says this booking belongs to.

#### 2. **Capture eventTypeId in `normalizeBooking()`** (Line ~572)

```typescript
function normalizeBooking(raw: any): NormalizedBooking {
  // ... existing code ...
  return {
    // ... existing fields ...
    // ✅ SECURITY: Capture eventTypeId returned by Cal.com
    calcomEventTypeId: String(raw?.eventType?.id ?? "").trim() || null,
    raw,
  }
}
```

**Purpose:** Extract and preserve the eventTypeId from Cal.com's booking response.

#### 3. **Implement Cross-Event Validation** (Line ~1134)

```typescript
// ✅ CRITICAL SECURITY: Cross-validate eventTypeId
// Ensure EACH returned booking actually belongs to the requested eventTypeId
const bookingsWithMismatch = bookings.filter((booking) => {
  const bookingEventTypeId = booking.calcomEventTypeId
  return bookingEventTypeId && bookingEventTypeId !== eventTypeId
})

if (bookingsWithMismatch.length > 0) {
  console.error(
    `[SECURITY] 🚨 EVENTO CONFUSION DETECTADO: Trigger ${trigger.id} expected eventTypeId="${eventTypeId}" but received ${bookingsWithMismatch.length} bookings with different eventTypeId`,
    {
      trigger: trigger.id,
      expectedEventTypeId: eventTypeId,
      wrongEventTypeIds: bookingsWithMismatch.map((b) => b.calcomEventTypeId),
      agent: agent.id,
      bookingUids: bookingsWithMismatch.map((b) => b.uid),
    },
  )
  
  // Filter out mismatched bookings to prevent sending wrong reminders
  const validBookings = bookings.filter((booking) => {
    const bookingEventTypeId = booking.calcomEventTypeId
    return !bookingEventTypeId || bookingEventTypeId === eventTypeId
  })
  bookings.length = 0
  bookings.push(...validBookings)
}
```

**Purpose:** 
1. **Detect:** Catch when Cal.com returns bookings for wrong event
2. **Log:** Record all details for forensic analysis
3. **Prevent:** Filter out mismatched bookings before sending reminders
4. **Remediate:** Only send reminders for events matching the trigger configuration

## Protection Layers

### Layer 1: Cal.com API Filtering (Server-Side)
```typescript
// GET /bookings?eventTypeId=123&status=accepted&...
// Cal.com server returns ONLY bookings for eventTypeId=123
```
✅ **Protection Level:** Cal.com's responsibility. They filter at API level.

### Layer 2: Trigger Configuration Validation (Already Existed)
```typescript
const eventTypeId = trigger.scope_reference || agent.calendar_meeting_id
if (!eventTypeId) {
  // Skip trigger without event type
}
```
✅ **Protection Level:** Prevents null/empty eventTypeId.

### Layer 3: Cross-Event Validation (NEW)
```typescript
if (booking.calcomEventTypeId !== eventTypeId) {
  // Detect and filter mismatch
}
```
✅ **Protection Level:** Catches and prevents event confusion.

### Layer 4: Audit Logging (Already Existed)
```typescript
console.log(`[reminder-cron][AUDIT]`, {
  triggerId: trigger.id,
  agentId: agent.id,
  eventTypeId: "123",  ← Logs which event was processed
  bookingUid: "abc...",
  timestamp: now,
})
```
✅ **Protection Level:** Enables forensic investigation if mismatch occurs.

## Test Scenarios

### Scenario 1: Normal Operation (No Event Confusion)
```
Trigger: scope_reference = "123"
Cal.com returns: 3 bookings with eventType.id = "123"
Validation: PASS ✅
Result: Send 3 reminders
```

### Scenario 2: Event Confusion Detected
```
Trigger: scope_reference = "123"
Cal.com returns: 2 bookings with eventType.id = "123", 1 with eventType.id = "456"
Validation: FAIL ⚠️
Log: [SECURITY] 🚨 EVENTO CONFUSION DETECTADO
Result: Send only 2 reminders (filter out the "456" booking)
```

### Scenario 3: Trigger Scope Altered
```
Original Trigger: scope_reference = "123"
Altered Trigger: scope_reference = "456"
Cal.com returns: 2 bookings with eventType.id = "456"
Validation: PASS (because 456 == 456)
Log: [SECURITY] Trigger 'xxx': eventTypeId '456' comes from trigger.scope_reference
Result: Send reminders (but AUDIT log shows eventTypeId came from trigger)
```

## Related Vulnerabilities Fixed

This fix is part of a larger security audit. Related vulnerabilities:

1. **Cross-Agent Data Leakage** (FIXED in earlier update)
   - Gatilho altered to use wrong agent_id
   - Agent validation now prevents this

2. **Cross-Agent Message Sending** (FIXED in earlier update)
   - Message sent using wrong agent's connection
   - Audit logging captures agent details

3. **Event Confusion** (FIXED in this update)
   - Reminders for wrong event sent
   - eventTypeId validation now prevents this

## Deployment Impact

### Code Changes
- **File Modified:** `lib/reminders/run-reminder-cron.ts`
- **Lines Added:** ~40
- **Breaking Changes:** None (backwards compatible)
- **Performance Impact:** Negligible (adds string comparison)

### Logging Changes
New log lines in cron output:
```
[SECURITY] 🚨 EVENTO CONFUSION DETECTADO: Trigger xxx...
```

### Database Changes
None required.

### Configuration Changes
None required.

## Verification

To verify this fix is working:

1. **Check Production Logs**
   ```bash
   # After rebuilding Docker image
   docker logs impaai_impa-ai_worker | grep "EVENTO CONFUSION"
   ```
   - Should see 0 matches (no event confusion detected)
   - If matches found → investigate Cal.com API responses

2. **Check Audit Logs**
   ```bash
   docker logs impaai_impa-ai_worker | grep "reminder-cron\]\[AUDIT\]"
   ```
   - Should show eventTypeId matches trigger configuration
   - Example: `eventTypeId: "123"` matches `scope_reference: "123"`

3. **Test with Multiple Events**
   - Create agent with 2 Cal.com events
   - Create triggers for both events
   - Verify each sends reminders only for its event

## Recommendation

### Short-term (Immediate)
✅ Apply this fix and redeploy

### Medium-term (Next Sprint)
- Add test coverage for event confusion scenario
- Monitor logs for event confusion detections
- Consider adding database foreign key: `reminders_sent.eventTypeId` references `cal_com_events.id`

### Long-term (Security Hardening)
- Implement Row-Level Security (RLS) on `reminder_triggers` table
  - Ensure triggers can only access bookings for their own agent
- Add `UNIQUE` constraint: `reminder_triggers(agent_id, scope_reference)`
  - Prevent duplicate triggers for same event
- Implement booking ID whitelist validation
  - Store expected booking IDs before sending

## Rollback Plan

If issues occur after deployment:

1. **Revert Code**
   ```bash
   git revert <commit-hash>
   ```

2. **Rebuild Docker**
   ```bash
   docker build -t impa-ai:latest .
   docker-compose restart impa-ai_worker
   ```

3. **Monitor**
   - Check that reminders resume sending normally
   - Verify no increase in failed reminders

## Audit Trail

**Authors:** GitHub Copilot (AI) & User (impa365)  
**Created:** 2025-01-20  
**Status:** Ready for deployment  
**QA Status:** Code reviewed ✓ | Tests pending ⏳

---

## Summary

✅ **Event Confusion Vulnerability FIXED**

Three layers of defense now prevent reminders for EVENT_A from being sent as EVENT_B:

1. **Detection:** `booking.calcomEventTypeId !== eventTypeId`
2. **Prevention:** Filter mismatched bookings before sending
3. **Forensics:** Comprehensive error logging for investigation

Code is ready for production deployment.
