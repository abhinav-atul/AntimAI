# AntimAI

AntimAI is a "Post-Death Administrative Assistant" designed to help users generate checklists and official letters (in PDF format) for managing estate and administrative tasks after the loss of a loved one. 

## Features
- **Smart Checklists:** Dynamically generates an administrative checklist based on the deceased's state, assets, and specific circumstances.
- **Automated Letter Generation:** Writes structured, official correspondence to banks, insurance companies, and government institutions.
- **PDF Export:** Instantly renders generated letters into professional, formatted PDFs natively supporting Unicode and advanced typography.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Authentication:** Clerk
- **Database:** PostgreSQL (NeonDB Serverless)
- **ORM:** Drizzle
- **AI Engine:** OpenRouter (powered by Llama 3.3 and top-tier OSS models)
- **PDF Generation:** `@react-pdf/renderer`

## Getting Started

### 1. Environment Setup
Clone the repository and install dependencies:
```bash
npm install
```

Create a `.env.local` file in the root directory and add the required keys (see `.env.local.example` for details):
```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/onboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboard

# NeonDB Database
DATABASE_URL=postgresql://user:password@your-project.neon.tech/antimai?sslmode=require

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-...
```

### 2. Database Sync
Push the Drizzle schema to your Neon PostgreSQL database:
```bash
npx drizzle-kit push
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Architecture Notes
- **AI Fallback System:** The AI integration (`src/lib/openrouter.ts`) features a robust fallback queue. If the primary model is busy or rate-limited (`HTTP 429`), it silently fails over to other top-tier free open-source models (like Gemini 2.5 Flash or Mistral Nemo) to ensure 100% uptime without manual intervention.
- **React PDF Engine:** AntimAI uses `@react-pdf/renderer` rather than traditional PDF libraries to perfectly handle Unicode characters (smart quotes, em-dashes, non-breaking hyphens) output by modern LLMs.
