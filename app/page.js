'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import ReactMarkdown from 'react-markdown';

// Hook up Supabase so we can read and update articles from the frontend
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  const [enquiry, setEnquiry] = useState('');
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState([]);

  // Grab all articles when the page loads
  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setArticles(data);
  };

  const handleSubmit = async () => {
    if (!enquiry.trim()) return;
    setLoading(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enquiry }),
      });

      await response.json();
      setEnquiry('');
      fetchArticles(); // pull the new article into the feed straight away
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Flip the status of an article — pending, approved, or rejected.
  // The idea is a human always makes this call, not the system.
  const updateStatus = async (id, status) => {
    await supabase.from('articles').update({ status }).eq('id', id);
    fetchArticles();
  };

  // Just returns the right colour classes depending on where the article is in the workflow
  const getStatusColour = (status) => {
    if (status === 'approved') return 'text-green-600 bg-green-50 border-green-200';
    if (status === 'rejected') return 'text-red-600 bg-red-50 border-red-200';
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">Enquiry Content Generator</h1>
      <p className="text-gray-600 mb-6">
        Paste a customer enquiry to generate a draft article for your website.
      </p>

      {/* Input section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Customer Enquiry
        </label>
        <textarea
          className="w-full border border-gray-300 rounded p-3 h-32 mb-4 text-sm"
          placeholder="e.g. How much does teeth whitening cost?"
          value={enquiry}
          onChange={(e) => setEnquiry(e.target.value)}
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          {loading ? 'Generating...' : 'Generate Article'}
        </button>
      </div>

      {/* Article feed — shows everything that's been generated, newest first */}
      <h2 className="text-lg font-semibold mb-4">Generated Articles</h2>
      {articles.length === 0 && (
        <p className="text-gray-500 text-sm">No articles yet. Submit an enquiry above.</p>
      )}
      {articles.map((item) => (
        <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-6 mb-4">

          {/* Status badge — pending until someone approves or rejects */}
          <span className={`inline-block text-xs font-medium px-2 py-1 rounded border mb-3 ${getStatusColour(item.status)}`}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </span>

          {/* The original enquiry so you know what triggered this article */}
          <p className="text-xs text-gray-500 mb-3">
            <span className="font-medium">Enquiry:</span> {item.enquiry}
          </p>

          {/* Render the article as markdown so headings and bold text actually look right */}
          <div className="text-sm text-gray-800 mb-4 prose prose-sm max-w-none">
            <ReactMarkdown>{item.article}</ReactMarkdown>
          </div>

          <div className="flex gap-3 flex-wrap">
            {item.status === 'pending' && (
              <>
                <button
                  onClick={() => updateStatus(item.id, 'approved')}
                  className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => updateStatus(item.id, 'rejected')}
                  className="bg-red-500 text-white px-4 py-1.5 rounded text-sm hover:bg-red-600"
                >
                  Reject
                </button>
              </>
            )}
            {/* Export only appears once approved — copies the article ready to paste into a CMS */}
            {item.status === 'approved' && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(item.article);
                  alert('Article copied to clipboard — ready to paste into your website.');
                }}
                className="bg-gray-700 text-white px-4 py-1.5 rounded text-sm hover:bg-gray-800"
              >
                Export (Copy to Clipboard)
              </button>
            )}
          </div>
        </div>
      ))}
    </main>
  );
}
