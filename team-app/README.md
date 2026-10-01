This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, create `.env.local` with an Auth.js secret (sign-in won't work without it):

```bash
cp .env.example .env.local
npx auth secret   # or paste the output of `openssl rand -base64 32` into AUTH_SECRET
```

To try a production build locally (`npm run build && npm start`), also set `AUTH_TRUST_HOST=true` in `.env.local`. Auth.js trusts the host automatically only in development and on Vercel.

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Demo accounts

Until the database lands, accounts live in memory: anything created at `/sign-up` is lost when the server restarts. These two demo accounts are always available and are linked to the seed data:

| Role | Email | Password |
|---|---|---|
| Owner | `jordan@example.com` | `paws-demo-2026` |
| Walker | `sam@example.com` | `paws-demo-2026` |

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
