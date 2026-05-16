# web-mathparty

Next.js web app and backend for Mathparty/Bombatique.

Realtime rooms use Ably Pub/Sub channels named `room:{CODE}`. The legacy SSE
endpoint remains available at `/api/rooms/[code]/events`.

Required production env:

- `MONGODB_URI`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `NEXT_PUBLIC_BETTER_AUTH_URL`
- `RESEND_API_KEY`
- `MOBILE_SESSION_SECRET`
- `MOBILE_BETA_EMAIL`
- `ABLY_API_KEY`
