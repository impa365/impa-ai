## Cal.com Booking Reminder Reference

### API v2 – Endpoints Principais

- **Listar agendamentos**
  - `GET https://api.cal.com/v2/bookings`
  - Headers obrigatórios: `Authorization: Bearer <cal_api_key>`; `cal-api-version: 2024-08-13`
  - Filtros úteis: `startTime>=`, `startTime<=`, `status`, `eventTypeId`, `teamId`, `limit`, `cursor`
  - Retorno (resumo):
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": 123,
          "uid": "booking_uid",
          "title": "Consultation",
          "status": "accepted",
          "start": "2024-08-13T15:30:00Z",
          "end": "2024-08-13T16:30:00Z",
          "hosts": [{ "name": "Jane Doe", "email": "jane@example.com", "timeZone": "America/Los_Angeles" }],
          "attendees": [{
            "name": "John Doe",
            "email": "john@example.com",
            "timeZone": "America/New_York",
            "language": "en",
            "phoneNumber": "+1234567890"
          }],
          "responses": {
            "attendeePhoneNumber": "+1234567890",
            "location": { "value": "integrations:daily", "optionValue": "" }
          },
          "metadata": { "videoCallUrl": "https://app.cal.com/video/booking_uid" }
        }
      ],
      "error": {}
    }
    ```

- **Obter agendamento específico**
  - `GET https://api.cal.com/v2/bookings/{bookingUid}`
  - Mesmo esquema de headers; retorna objeto único com campos idênticos ao array acima.

- **Listar integrações do agendamento**
  - `GET https://api.cal.com/v2/bookings/{bookingUid}/references`
  - Query opcional `type` (`google_calendar`, `office365_calendar`, `daily_video`, etc.).
  - Exemplo de retorno:
    ```json
    {
      "status": "success",
      "data": [
        {
          "type": "google_calendar",
          "eventUid": "abc123",
          "destinationCalendarId": "cal-1",
          "id": 42
        }
      ]
    }
    ```

- **Confirmar agendamento** (útil para inspecionar schema completo)
  - `POST https://api.cal.com/v2/bookings/{bookingUid}/confirm`
  - Resposta de sucesso traz o mesmo corpo de booking mostrado acima.

### API v1 – Compatibilidade / Modelo de Resposta

- `GET https://api.cal.com/v1/bookings?apiKey=<cal_api_key>`
- Retorno (exemplo real):
  ```json
  {
    "bookings": [
      {
        "id": 11728245,
        "userId": 1835446,
        "eventTypeId": 3628074,
        "uid": "6Mk68CBqYVA19RiQmPYdH1",
        "title": "Consulta between Bruna Fransoçoso and SONIA",
        "startTime": "2025-10-22T19:00:00.000Z",
        "endTime": "2025-10-22T19:30:00.000Z",
        "attendees": [{
          "id": 13663805,
          "email": "clinicadrheriasaocaetano@gmail.com",
          "name": "SONIA MARIA FRANCISCO",
          "timeZone": "America/Sao_Paulo",
          "locale": "pt-BR"
        }],
        "user": {
          "email": "clinicadrheriasaocaetano@gmail.com",
          "name": "Bruna Fransoçoso",
          "timeZone": "America/Sao_Paulo"
        },
        "metadata": {
          "videoCallUrl": "https://app.cal.com/video/6Mk68CBqYVA19RiQmPYdH1"
        },
        "status": "ACCEPTED",
        "responses": {
          "attendeePhoneNumber": "+5511947026365",
          "location": { "value": "integrations:daily", "optionValue": "" }
        },
        "createdAt": "2025-10-13T18:52:41.895Z"
      }
    ]
  }
  ```

### Campos Essenciais para Lembretes

- `start`/`startTime`, `end`/`endTime`, `timeZone`, `status`, `uid`, `title`
- `attendees[].name`, `attendees[].email`, `attendees[].timeZone`
- `responses.attendeePhoneNumber` → obrigatório para disparo; quando ausente, marcar como “sem telefone” e não enviar
- `metadata.videoCallUrl` ou outros links relevantes

### Diretrizes de Implementação

- Converter `start`/`startTime` para o fuso do participante antes de calcular antecedência.
- Priorizar v2 (`/v2/bookings`) e guardar `bookingUid` para interações futuras.
- Tratar estados: somente `ACCEPTED`/`CONFIRMED` recebem lembrete; ignorar `CANCELLED`, `DECLINED` etc.
- Para recorrências, deduplicar por `uid + start`. Evitar múltiplos lembretes para a mesma série.
- Respeitar rate limits e cachear resultados quando possível.
