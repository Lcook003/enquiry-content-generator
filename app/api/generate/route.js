import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Anthropic client - pulls the key from .env.local so it never touches the frontend
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Supabase client for saving articles to the database
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { enquiry } = await request.json();

    // Strip out names, emails and phone numbers before we do anything else.
    // Nothing personally identifiable should leave this function.
    // TODO: replace this regex approach with a proper NLP library at some point —
    // it works for the obvious stuff but won't catch everything
    const anonymised = enquiry
      .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[Name]')
      .replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '[Email]')
      .replace(/\b\d{10,11}\b/g, '[Phone]');

    // Fire the anonymised enquiry off to Claude with a prompt that tells it
    // to write like a content writer, not an AI answering a question
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a content writer for a service-based business website. 
A customer has submitted the following enquiry: "${anonymised}"

Write a 200-word news-style article that:
- Answers the question clearly and helpfully
- Is written for a general audience
- Positions the business as knowledgeable and trustworthy
- Does not mention that this came from a customer enquiry
- Has a clear headline and short paragraphs

Return only the article, no commentary.`,
        },
      ],
    });

    const article = message.content[0].text;

    // Save to the database with a default status of 'pending' —
    // nothing gets published until a human approves it
    const { error } = await supabase
      .from('articles')
      .insert([{ enquiry: anonymised, article, status: 'pending' }]);

    if (error) {
      console.error('Database error:', error);
    }

    return Response.json({ article });
  } catch (error) {
    console.error('Error generating article:', error);
    return Response.json(
      { error: 'Failed to generate article' },
      { status: 500 }
    );
  }
}