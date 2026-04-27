# Enquiry Content Generator

So here's the problem I kept running into when building websites for service businesses - 
their enquiry forms were full of gold. Same questions, over and over. "How much does it cost?" 
"Do you do X?" "What's the difference between Y and Z?" And none of it was on the website.

This tool fixes that. Paste in a customer enquiry, and it generates a draft article that 
answers the question — written for the website, not as a direct reply. A human reviews it, 
approves or rejects it, and if it's good to go, exports it ready to paste into a CMS.

## What it actually does

- Takes a customer enquiry as input
- Strips out any personal details (names, emails, phone numbers) before processing
- Sends the anonymised enquiry to Claude to generate a 200-word news-style article
- Saves everything to a database with a status of "pending"
- Lets you approve or reject each article
- Approved articles can be copied to clipboard and pasted straight into your website

## Tech I used

- Next.js 16 - React framework, handles both frontend and the API routes
- Anthropic Claude API - does the actual content generation
- Supabase — Postgres database, free tier is more than enough for this
- Tailwind CSS + Typography plugin - styling and markdown rendering

## Getting it running

### 1. Clone the repo

git clone https://github.com/Lcook003/enquiry-content-generator.git
cd enquiry-content-generator

### 2. Install dependencies

npm install

### 3. Environment variables

Create a `.env.local` file in the root folder — don't commit this, it's already in .gitignore:

ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

You'll need:
- An Anthropic API key from console.anthropic.com (needs a small amount of credit)
- A Supabase project from supabase.com (free tier works fine)

### 4. Set up the database

In your Supabase project, open the SQL Editor and run this:

CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  enquiry TEXT NOT NULL,
  article TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

### 5. Run it

npm run dev

Then open http://localhost:3000.

## Try it with these

- "How much does teeth whitening cost?"
- "Do you offer same-day appointments?"
- "Can I still take medication while having TMS treatment?"

## What it doesn't do yet

- No login system — it's single user for now
- PII anonymisation is pattern-based, not a full NLP solution. 
  It catches the obvious stuff but won't get everything.
- English only
- No direct CMS integration - export is clipboard only
- Needs active Anthropic API credits to work