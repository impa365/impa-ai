## Cal.com API v1 Reference

- **Base URL**: `https://api.cal.com/v1`
- **Auth**: API key via `apiKey` query param, issued under `Settings > Security`.
- **Rate limits & errors**: Standard REST semantics; non-authenticated requests fail.

### Quick Start
- Install HTTP client (e.g. `axios` with `npm install --save axios` or `yarn add axios`).
- Basic request example:  
  `curl https://api.cal.com/v1/event-types?apiKey=cal_test_xxxxxx`
- Postman collection is available from Cal.com docs.

### Endpoint Families
- **Attendees**: `GET /attendees`, `POST /attendees`, `GET /attendees/{id}`, `PATCH /attendees/{id}`, `DELETE /attendees/{id}`
- **Availabilities**: `POST /availabilities`, `GET /availabilities/{id}`, `PATCH /availabilities/{id}`, `DELETE /availabilities/{id}`
- **Booking References**: `GET /booking-references`, `POST /booking-references`, `GET /booking-references/{id}`, `PATCH /booking-references/{id}`, `DELETE /booking-references/{id}`
- **Bookings**: `POST /bookings`, `DELETE /bookings/{id}`, `GET /bookings/{id}`, `PATCH /bookings/{id}`, `GET /bookings/{id}/video-recordings`, `GET /bookings/{id}/video-transcripts`, `GET /bookings/video-recordings/{recordingId}/transcripts`
- **Credentials**: `GET /credentials`, `POST /credentials`, `PATCH /credentials/{id}`, `DELETE /credentials/{id}`
- **Destination Calendars**: `GET /destination-calendars`, `POST /destination-calendars`, `GET /destination-calendars/{id}`, `PATCH /destination-calendars/{id}`, `DELETE /destination-calendars/{id}`
- **Event Types**: `GET /event-types`, `POST /event-types`, `GET /event-types/{id}`, `PATCH /event-types/{id}`, `DELETE /event-types/{id}`, `GET /teams/{teamId}/event-types`
- **Memberships**: `GET /memberships`, `POST /memberships`, `GET /memberships/{userId}/{teamId}`, `PATCH /memberships/{id}`, `DELETE /memberships/{id}`
- **Payments**: `GET /payments`, `GET /payments/{id}`
- **Schedules**: `GET /schedules`, `POST /schedules`, `GET /schedules/{id}`, `PATCH /schedules/{id}`, `DELETE /schedules/{id}`
- **Selected Calendars**: `GET /selected-calendars`, `POST /selected-calendars`, `GET /selected-calendars/{compoundId}`, `PATCH /selected-calendars/{compoundId}`, `DELETE /selected-calendars/{compoundId}`
- **Slots**: `GET /slots`
- **Teams**: `GET /teams`, `POST /teams`, `GET /teams/{id}`, `PATCH /teams/{id}`, `DELETE /teams/{id}`
- **Users**: `GET /users`, `POST /users`, `GET /users/{id}`, `PATCH /users/{id}`, `DELETE /users/{id}`
- **Webhooks**: `GET /webhooks`, `POST /webhooks`, `GET /webhooks/{id}`, `PATCH /webhooks/{id}`, `DELETE /webhooks/{id}`

### Notes
- Use object IDs or compound IDs as required by each endpoint.
- Transcripts/recordings endpoints live under the bookings namespace.
- For automation, store the API key securely and rotate as needed.
