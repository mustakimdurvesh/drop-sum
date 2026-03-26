# DropSum

**Drop a link. Get the point.**

DropSum is an AI-powered article summarizer. Paste any article URL and get a concise 3–5 sentence summary in seconds — no reading required.

---

## Features

- Paste any article link and get an instant AI summary
- Real article extraction using Mozilla Readability — not just metadata
- Dark themed, mobile-responsive UI
- Copy summary to clipboard in one click
- Word count on every summary
- Session history with clickable past summaries
- User accounts with persistent history across sessions (Supabase)
- Clean auth flow — sign in sits quietly in the corner, app works without an account

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Vercel Serverless Functions (Node.js) |
| Article extraction | Mozilla Readability + linkedom |
| AI summarization | Groq API (llama-3.1-8b-instant) |
| Auth + Database | Supabase |
| Deployment | Vercel |
| Version control | GitHub |

---

## How It Works

```
User pastes URL
      ↓
Browser sends URL to /api/summarize
      ↓
Serverless function fetches the article page
      ↓
Mozilla Readability extracts clean article text
      ↓
Groq summarizes the text in 3–5 sentences
      ↓
Summary displayed in the browser
      ↓
If signed in — summary saved to Supabase
```

---

## Running Locally

### Prerequisites

- Node.js v18+
- Vercel CLI
- Groq API key (free at [console.groq.com](https://console.groq.com))
- Supabase project (free at [supabase.com](https://supabase.com))

### Setup

1. Clone the repository

```bash
git clone https://github.com/yourusername/drop-sum.git
cd drop-sum
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file in the root

```
GROQ_API_KEY=your-groq-api-key
```

4. Set up Supabase

Create a `summaries` table by running this SQL in your Supabase SQL editor:

```sql
create table summaries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  url text not null,
  title text,
  summary text not null,
  created_at timestamp with time zone default now()
);

alter table summaries enable row level security;

create policy "Users can insert own summaries"
  on summaries for insert
  with check (auth.uid() = user_id);

create policy "Users can view own summaries"
  on summaries for select
  using (auth.uid() = user_id);

create policy "Users can delete own summaries"
  on summaries for delete
  using (auth.uid() = user_id);
```

5. Add your Supabase credentials to `public/supabase.js`

```javascript
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseKey = 'your-anon-key'
```

6. Run locally

```bash
vercel dev
```

Open `http://localhost:3000`

---

## Deploying to Vercel

1. Push to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add `GROQ_API_KEY` as an environment variable in Vercel dashboard
4. Deploy

Every subsequent `git push` triggers an automatic redeployment.

---

## Project Structure

```
drop-sum/
├── api/
│   └── summarize.js      # Serverless function — fetches article, calls Groq
├── public/
│   ├── index.html        # App shell
│   ├── style.css         # Styles
│   ├── script.js         # Frontend logic
│   └── supabase.js       # Supabase client
└── vercel.json           # Routing config
```

---

## Known Limitations

- JavaScript-rendered pages (e.g. some SPAs) may return incomplete content — Readability only sees the initial HTML
- Some sites block external server requests and cannot be summarized
- Paywalled articles return limited or no content

---

## Built With

This project was built as a learning exercise covering HTML/CSS/JS fundamentals, serverless backend development, AI API integration, and deployment — completed across four weeks with 3–5 hours per week.

---

## License

MIT
