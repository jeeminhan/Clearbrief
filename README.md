# Project Brief Builder

AI-powered project collaboration brief assistant. Walks collaborators through filling out a structured project brief with AI coaching, then sends the completed brief via email.

## Stack
- **Next.js 14** (App Router)
- **Gemini 2.5 Flash** via Vercel Edge Function
- **mailto:** with encoded recipient for email delivery

## Setup

### 1. Clone & install
```bash
git clone <your-repo>
cd brief-builder
npm install
```

### 2. Add your Gemini API key
Get a key from [Google AI Studio](https://aistudio.google.com/apikey).

For local development, create `.env.local`:
```
GEMINI_API_KEY=your_key_here
```

For Vercel deployment, add it in:
**Vercel Dashboard → Your Project → Settings → Environment Variables**
- Key: `GEMINI_API_KEY`
- Value: your Gemini API key

### 3. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel
```bash
npx vercel
```
Or connect your GitHub repo in the Vercel dashboard for auto-deploys.

## How It Works

1. Collaborator opens the site
2. Works through 8 sections (Vision, Scope, Design, Technical, Timeline, Risks, Team, References)
3. Each section has its own chat — AI helps refine answers
4. When done, clicks "Send Brief" → email opens pre-filled with the formatted brief
5. Brief is sent to your inbox (recipient email is encoded in the source)

## Customization

- **Sections & fields**: Edit the `SECTIONS` array in `app/BriefBuilder.js`
- **Recipient email**: Re-encode with the shift+3 → base64 pattern (see `decodeRecipient()`)
- **AI personality**: Edit the system prompt in `app/api/chat/route.js`
- **Model**: Change `gemini-2.5-flash` in the API route to any Gemini model
