import { Readability } from '@mozilla/readability'
import { parseHTML } from 'linkedom'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url } = req.body

  if (!url) {
    return res.status(400).json({ error: 'No URL provided' })
  }

  try {
    // Step 1 — Fetch the article page
    const pageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!pageResponse.ok) {
      return res.status(400).json({ error: 'Could not fetch that URL' })
    }

    // Step 2 — Parse with Readability
    const html = await pageResponse.text()
   const { document } = parseHTML(html)
   const reader = new Readability(document)
    const article = reader.parse()

    if (!article || !article.textContent) {
      return res.status(400).json({ error: 'Could not extract article content' })
    }

    // Step 3 — Clean and trim the text
    const cleanText = article.textContent
    const content = `Title: ${article.title}\n\n${cleanText}`
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000)

    // Step 4 — Send to Groq
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Summarize the following article in 3-5 clear sentences. Return only the summary with no introduction, no prefix, and no labels.\n\n${content}`
          }
        ]
      })
    })

    const data = await groqResponse.json()

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: 'Unexpected response from Groq' })
    }

    const summary = data.choices[0].message.content
    res.status(200).json({ summary })

  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Could not summarize that page. Try a different URL.' })
  }
}