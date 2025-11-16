## Cal.com API v1 Detailed Index

- **Base URL**: `https://api.cal.com/v1`
- **Authentication**: Append `apiKey=<cal_test|cal_live_...>` as URL query parameter for every call. Keys are created under `Settings > Security` in the Cal.com dashboard and must be kept secret. [Docs](https://cal.com/docs/api-reference/v1/authentication)
- **Error Handling**: Responses follow REST semantics with standard HTTP status codes. [Docs](https://cal.com/docs/api-reference/v1/errors)
- **Rate Limits**: Review throttle policies and back-off expectations before automating requests. [Docs](https://cal.com/docs/api-reference/v1/rate-limit)
- **Quick Start**: Install an HTTP client (e.g. axios) and issue a test request against `GET /event-types`. [Docs](https://cal.com/docs/api-reference/v1/introduction)

### Getting Started Pages
- `Quick start` — onboarding instructions and sample curls. [Docs](https://cal.com/docs/api-reference/v1/introduction)
- `Authentication` — API key format (`cal_` test, `cal_live_` production) and HTTPS requirements. [Docs](https://cal.com/docs/api-reference/v1/authentication)
- `Errors` — status code catalogue and error payload guidance. [Docs](https://cal.com/docs/api-reference/v1/errors)
- `Rate limits` — explains request throttling and best practices. [Docs](https://cal.com/docs/api-reference/v1/rate-limit)

### Attendees
- `GET /attendees` — List all attendees tied to your bookings; response bundle includes `id`, `bookingId`, `name`, `email`, `timeZone`. [Docs](https://cal.com/docs/api-reference/v1/attendees/find-all-attendees)
- `POST /attendees` — Create a new attendee for a booking (`bookingId`, `email`, `name`, `timeZone`). [Docs](https://cal.com/docs/api-reference/v1/attendees/creates-a-new-attendee)
- `GET /attendees/{id}` — Fetch a single attendee by identifier. [Docs](https://cal.com/docs/api-reference/v1/attendees/find-an-attendee)
- `DELETE /attendees/{id}` — Remove an attendee from a booking. [Docs](https://cal.com/docs/api-reference/v1/attendees/remove-an-existing-attendee)
- `PATCH /attendees/{id}` — Update attendee details (partial updates allowed). [Docs](https://cal.com/docs/api-reference/v1/attendees/edit-an-existing-attendee)

### Availabilities
- `POST /availabilities` — Define new availability windows for scheduling. [Docs](https://cal.com/docs/api-reference/v1/availabilities/creates-a-new-availability)
- `GET /availabilities/{id}` — Retrieve a specific availability block. [Docs](https://cal.com/docs/api-reference/v1/availabilities/find-an-availability)
- `DELETE /availabilities/{id}` — Delete an availability window. [Docs](https://cal.com/docs/api-reference/v1/availabilities/remove-an-existing-availability)
- `PATCH /availabilities/{id}` — Modify an existing availability block. [Docs](https://cal.com/docs/api-reference/v1/availabilities/edit-an-existing-availability)

### Booking References
- `GET /booking-references` — Enumerate booking reference records. [Docs](https://cal.com/docs/api-reference/v1/booking-references/find-all-booking-references)
- `POST /booking-references` — Register a new booking reference record. [Docs](https://cal.com/docs/api-reference/v1/booking-references/creates-a-new-booking-reference)
- `GET /booking-references/{id}` — Inspect a single booking reference. [Docs](https://cal.com/docs/api-reference/v1/booking-references/find-a-booking-reference)
- `DELETE /booking-references/{id}` — Remove a booking reference. [Docs](https://cal.com/docs/api-reference/v1/booking-references/remove-an-existing-booking-reference)
- `PATCH /booking-references/{id}` — Update the metadata for a booking reference. [Docs](https://cal.com/docs/api-reference/v1/booking-references/edit-an-existing-booking-reference)

### Bookings
- `POST /bookings` — Create a booking (event, attendee, scheduling payload). [Docs](https://cal.com/docs/api-reference/v1/bookings/creates-a-new-booking)
- `DELETE /bookings/{id}` — Cancel a booking. [Docs](https://cal.com/docs/api-reference/v1/bookings/booking-cancellation)
- `GET /bookings/{id}` — Retrieve detailed booking information. [Docs](https://cal.com/docs/api-reference/v1/bookings/find-a-booking)
- `PATCH /bookings/{id}` — Update booking attributes. [Docs](https://cal.com/docs/api-reference/v1/bookings/edit-an-existing-booking)
- `GET /bookings/{id}/video-recordings` — List Cal video recordings tied to the booking. [Docs](https://cal.com/docs/api-reference/v1/bookings/find-all-cal-video-recordings-of-that-booking)
- `GET /bookings/{id}/video-transcripts` — Fetch transcripts for booking-level recordings. [Docs](https://cal.com/docs/api-reference/v1/bookings/find-all-cal-video-transcripts-of-that-booking)
- `GET /bookings/video-recordings/{recordingId}/transcripts` — Fetch transcripts for an individual recording. [Docs](https://cal.com/docs/api-reference/v1/bookings/find-all-cal-video-transcripts-of-that-recording)

### Credentials
- `GET /credentials` — List app credentials associated with a user. [Docs](https://cal.com/docs/api-reference/v1/credentials/get-all-app-credentials-for-a-user)
- `POST /credentials` — Create credentials for a user integration. [Docs](https://cal.com/docs/api-reference/v1/credentials/create-a-credential-record-for-a-user)
- `DELETE /credentials/{id}` — Delete stored credentials. [Docs](https://cal.com/docs/api-reference/v1/credentials/delete-a-credential-record-for-a-user)
- `PATCH /credentials/{id}` — Update credential details (e.g., refresh tokens). [Docs](https://cal.com/docs/api-reference/v1/credentials/update-a-credential-record-for-a-user)

### Destination Calendars
- `GET /destination-calendars` — Retrieve connected destination calendars. [Docs](https://cal.com/docs/api-reference/v1/destination-calendars/find-all-destination-calendars)
- `POST /destination-calendars` — Register a destination calendar. [Docs](https://cal.com/docs/api-reference/v1/destination-calendars/creates-a-new-destination-calendar)
- `GET /destination-calendars/{id}` — Fetch a single destination calendar. [Docs](https://cal.com/docs/api-reference/v1/destination-calendars/find-a-destination-calendar)
- `DELETE /destination-calendars/{id}` — Disconnect a destination calendar. [Docs](https://cal.com/docs/api-reference/v1/destination-calendars/remove-an-existing-destination-calendar)
- `PATCH /destination-calendars/{id}` — Edit calendar settings. [Docs](https://cal.com/docs/api-reference/v1/destination-calendars/edit-an-existing-destination-calendar)

### Event Types
- `GET /event-types` — List all event types in the workspace. [Docs](https://cal.com/docs/api-reference/v1/event-types/find-all-event-types)
- `POST /event-types` — Create a new event type. [Docs](https://cal.com/docs/api-reference/v1/event-types/creates-a-new-event-type)
- `GET /event-types/{id}` — Retrieve an event type. [Docs](https://cal.com/docs/api-reference/v1/event-types/find-a-eventtype)
- `DELETE /event-types/{id}` — Remove an event type. [Docs](https://cal.com/docs/api-reference/v1/event-types/remove-an-existing-eventtype)
- `PATCH /event-types/{id}` — Update event type configuration. [Docs](https://cal.com/docs/api-reference/v1/event-types/edit-an-existing-eventtype)
- `GET /teams/{teamId}/event-types` — List event types belonging to a given team. [Docs](https://cal.com/docs/api-reference/v1/event-types/find-all-event-types-that-belong-to-teamid)

### Memberships
- `GET /memberships` — List memberships across teams. [Docs](https://cal.com/docs/api-reference/v1/memberships/find-all-memberships)
- `POST /memberships` — Create a membership entry (assign user to team). [Docs](https://cal.com/docs/api-reference/v1/memberships/creates-a-new-membership)
- `GET /memberships/{userId}/{teamId}` — Fetch a membership by composite key. [Docs](https://cal.com/docs/api-reference/v1/memberships/find-a-membership-by-userid-and-teamid)
- `DELETE /memberships/{id}` — Remove a membership. [Docs](https://cal.com/docs/api-reference/v1/memberships/remove-an-existing-membership)
- `PATCH /memberships/{id}` — Update membership roles or metadata. [Docs](https://cal.com/docs/api-reference/v1/memberships/edit-an-existing-membership)

### Payments
- `GET /payments/{id}` — Retrieve payment detail. [Docs](https://cal.com/docs/api-reference/v1/payments/find-a-payment)
- `GET /payments` — List payments. [Docs](https://cal.com/docs/api-reference/v1/payments/find-all-payments)

### Schedules
- `GET /schedules` — Return scheduling configurations. [Docs](https://cal.com/docs/api-reference/v1/schedules/find-all-schedules)
- `POST /schedules` — Create a schedule definition. [Docs](https://cal.com/docs/api-reference/v1/schedules/creates-a-new-schedule)
- `GET /schedules/{id}` — Retrieve a schedule by ID. [Docs](https://cal.com/docs/api-reference/v1/schedules/find-a-schedule)
- `DELETE /schedules/{id}` — Delete a schedule. [Docs](https://cal.com/docs/api-reference/v1/schedules/remove-an-existing-schedule)
- `PATCH /schedules/{id}` — Update schedule attributes. [Docs](https://cal.com/docs/api-reference/v1/schedules/edit-an-existing-schedule)

### Selected Calendars
- `GET /selected-calendars` — List selected calendars. [Docs](https://cal.com/docs/api-reference/v1/selected-calendars/find-all-selected-calendars)
- `POST /selected-calendars` — Create a selected calendar entry. [Docs](https://cal.com/docs/api-reference/v1/selected-calendars/creates-a-new-selected-calendar)
- `GET /selected-calendars/{compoundId}` — Fetch a selected calendar using the `userId_integration_externalId` compound ID (separated by `_`). [Docs](https://cal.com/docs/api-reference/v1/selected-calendars/find-a-selected-calendar-by-providing-the-compoundiduserid_integration_externalid-separated-by-`_`)
- `DELETE /selected-calendars/{compoundId}` — Remove a selected calendar. [Docs](https://cal.com/docs/api-reference/v1/selected-calendars/remove-a-selected-calendar)
- `PATCH /selected-calendars/{compoundId}` — Edit selected calendar metadata. [Docs](https://cal.com/docs/api-reference/v1/selected-calendars/edit-a-selected-calendar)

### Slots
- `GET /slots` — Fetch bookable slot windows between a start and end datetime. Accepts range parameters. [Docs](https://cal.com/docs/api-reference/v1/slots/get-all-bookable-slots-between-a-datetime-range)

### Teams
- `GET /teams` — List teams. [Docs](https://cal.com/docs/api-reference/v1/teams/find-all-teams)
- `POST /teams` — Create a team workspace. [Docs](https://cal.com/docs/api-reference/v1/teams/creates-a-new-team)
- `GET /teams/{id}` — Retrieve team metadata. [Docs](https://cal.com/docs/api-reference/v1/teams/find-a-team)
- `DELETE /teams/{id}` — Remove a team. [Docs](https://cal.com/docs/api-reference/v1/teams/remove-an-existing-team)
- `PATCH /teams/{id}` — Update team settings. [Docs](https://cal.com/docs/api-reference/v1/teams/edit-an-existing-team)

### Users
- `GET /users` — List users accessible to the API key; regular keys return the requesting user. [Docs](https://cal.com/docs/api-reference/v1/users/find-all-users)
- `POST /users` — Create a new user account. [Docs](https://cal.com/docs/api-reference/v1/users/creates-a-new-user)
- `GET /users/{id}` — Retrieve a user (or the key owner if regular user). [Docs](https://cal.com/docs/api-reference/v1/users/find-a-user-returns-your-user-if-regular-user)
- `DELETE /users/{id}` — Remove a user. [Docs](https://cal.com/docs/api-reference/v1/users/remove-an-existing-user)
- `PATCH /users/{id}` — Update user profile fields. [Docs](https://cal.com/docs/api-reference/v1/users/edit-an-existing-user)

### Webhooks
- `GET /webhooks` — List webhook registrations. [Docs](https://cal.com/docs/api-reference/v1/webhooks/find-all-webhooks)
- `POST /webhooks` — Create a webhook subscription. [Docs](https://cal.com/docs/api-reference/v1/webhooks/creates-a-new-webhook)
- `GET /webhooks/{id}` — Retrieve webhook configuration. [Docs](https://cal.com/docs/api-reference/v1/webhooks/find-a-webhook)
- `DELETE /webhooks/{id}` — Delete a webhook. [Docs](https://cal.com/docs/api-reference/v1/webhooks/remove-an-existing-hook)
- `PATCH /webhooks/{id}` — Update webhook settings (URL, events). [Docs](https://cal.com/docs/api-reference/v1/webhooks/edit-an-existing-webhook)

### Usage Notes
- All endpoints documented above require the `apiKey` query parameter and respond with JSON payloads.
- Each page in the official docs provides sample cURL, request body schemas, and response examples; follow the linked references for attribute-level details.
- Combine `apiKey` with HTTPS and consider environment isolation (test vs live) to prevent accidental production impact.
