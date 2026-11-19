# HealthCare – Your Health, Our Priority

A responsive healthcare experience built with React, Tailwind CSS, Express, MongoDB Atlas, and optional Supabase Auth. It includes a public healthcare homepage, email/password and Google sign-in, email password recovery, and a member dashboard for appointments, profile details, health information, and notifications.

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
- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`: Server-side Supabase project URL and publishable key. The server verifies Supabase access tokens with these values. Legacy `SUPABASE_ANON_KEY` is also accepted.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`: The same project URL and publishable key for the browser client. When present, Supabase handles email/password signup, Google OAuth, and password recovery. The browser key is public by design; never put a service-role key in a `VITE_` variable. Legacy `VITE_SUPABASE_ANON_KEY` is also accepted.
- Google OAuth: Configure the Google provider under Supabase Authentication > Sign In / Providers. Add your local and production app URLs to Supabase's allowed redirect URLs. The app falls back to direct Google Identity Services only when Supabase is not configured; that fallback uses `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`.
- Email recovery: Configure Supabase's email templates and SMTP settings. Set the Supabase Site URL and redirect allow list to your client origin so recovery links can return to `/?reset=1`.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`: SMTP settings for password reset email in the legacy direct-auth fallback. Supabase Auth uses the email provider and SMTP configuration in your Supabase project.
- `CLIENT_URL`: Public client origin used in password reset links.

Never commit `.env` or use development credentials in production. Deploy the client and API behind HTTPS, configure production origins and mail delivery, and rotate `JWT_SECRET` before launch. The MongoDB API requires `MONGODB_URI` and `JWT_SECRET` even when Supabase handles sign-in, because the API stores the member profile and dashboard data.

## Available commands

- `npm run dev`: Start Vite and the API in watch mode.
- `npm run build`: Create the production client bundle in `dist/`.
- `npm start`: Start the API server.

The API exposes `/api/health` for service/database status. Authentication and account endpoints are under `/api/auth`; authenticated dashboard data is available under `/api/dashboard`, `/api/profile`, `/api/health-info`, and `/api/appointments`.
