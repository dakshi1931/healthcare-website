# HealthCare – Your Health, Our Priority

A responsive healthcare experience built with React, Tailwind CSS, Express, and MongoDB Atlas. It includes a public healthcare homepage, email/password and Google sign-in, email password recovery, and a member dashboard for appointments, profile details, health information, and notifications.

## Run locally

1. Install Node.js 20.19+ or 22.12+.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and fill in the values below.
4. Start the frontend and API together with `npm run dev`.
5. Open `http://localhost:5173`.

The API listens on port `4000`; Vite proxies `/api` requests to it. The API can start without credentials, but data-backed features require a MongoDB connection.

## Configuration

- `MONGODB_URI`: MongoDB Atlas connection string. Create a database user and allow the development machine's IP in Atlas Network Access.
- `JWT_SECRET`: A long, unique random value used to sign sessions.
- `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`: The same Google OAuth web client ID. Add `http://localhost:5173` as an authorized JavaScript origin in Google Cloud Console.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`: SMTP settings for password reset email. Without SMTP, reset requests still return a generic response but no email is sent.
- `CLIENT_URL`: Public client origin used in password reset links.

Never commit `.env` or use development credentials in production. Deploy the client and API behind HTTPS, configure production origins and mail delivery, and rotate `JWT_SECRET` before launch.

## Available commands

- `npm run dev`: Start Vite and the API in watch mode.
- `npm run build`: Create the production client bundle in `dist/`.
- `npm start`: Start the API server.

The API exposes `/api/health` for service/database status. Authentication and account endpoints are under `/api/auth`; authenticated dashboard data is available under `/api/dashboard`, `/api/profile`, `/api/health-info`, and `/api/appointments`.
