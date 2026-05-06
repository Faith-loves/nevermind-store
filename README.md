# Nevermind Store

Local full-stack clothing store built with:

- Frontend: vanilla HTML/CSS/JavaScript SPA
- Backend: Node.js HTTP server
- Database: JSON persistence in `data/runtime.json`

## Run

```bash
npm start
```

Then open `http://localhost:3000`.

## Demo Accounts

- Admin: `admin@nevermind.com` / `admin123`
- User: `amina@example.com` / `demo123`

## Notes

- Live payment gateways and live email delivery require real credentials in `.env`.
- Without credentials, the app runs in mock payment mode and writes email confirmations to `outbox/`.
