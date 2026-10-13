# Assignment Assist

Next.js 14 site for Vercel with Supabase (database + private file storage) and Resend (email alerts).

## Setup (about 15 minutes)

1. **Supabase**: open SQL Editor, paste `supabase/schema.sql`, click Run.
   Then copy from Project Settings > API: the Project URL, the `anon` key and the `service_role` key.
2. **Resend** (resend.com, free): create an API key. Until you verify your own domain,
   emails can only be sent to the address you signed up with, so use that for `NOTIFY_EMAIL`.
3. **Vercel**: Project > Settings > Environment Variables. Add every variable in `.env.example`.
   `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` are secrets: never commit them or use `NEXT_PUBLIC_`.
4. Push this folder to your GitHub repo. Vercel redeploys automatically.
5. Set `NEXT_PUBLIC_SITE_URL` to your custom domain once it's connected (used for SEO, sitemap, canonical URLs).

## Things to edit
- `lib/config.js`: WhatsApp number, reply time, subjects, FAQs, and the REVIEWS list (swap placeholders for real reviews).
- `.env`: `NEXT_PUBLIC_CONTACT_EMAIL` is the address shown on the Email buttons.

## Local dev
```
cp .env.example .env.local   # fill in values
npm install
npm run dev
```
