# FitAI — AI-Powered Personal Training App

Built with Next.js 14, Prisma, SQLite, and Claude (claude-sonnet-4-6).

## Setup

```bash
npm install
cp .env.local.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npx prisma migrate dev --name init
npm run dev
```

Open [http://localhost:3000/onboarding](http://localhost:3000/onboarding) to set up your profile.
