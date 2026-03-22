import * as cheerio from 'cheerio'

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
        'User-Agent': 'Mozilla/5.0 (compatible; DropSum/1.0)'
      }, 
      signal: AbortSignal.timeout(10000)
    })

    if (!pageResponse.ok) {
      return res.status(400).json({ error: 'Could not fetch that URL' })
    }

    // Step 2 — Extract readable text
    const html = await pageResponse.text()
    const $ = cheerio.load(html)

    // Remove clutter
    $('script, style, nav, footer, header, aside, iframe').remove()

    // Get main content

const articleText = $('article, main, [role="main"], .article, .content, .post, .project-content, .prose').text()
  || $('body').text()

const cleanText = articleText
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 8000)

    if (!cleanText) {
      return res.status(400).json({ error: 'Could not extract text from that page' })
    }

    // Step 3 — Send text to Groq
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
            content: `Please summarize the following article in 3-5 clear sentences. Return only the summary with no introduction, no prefix, and no labels.\n\n${cleanText}`
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
    res.status(500).json({ error: 'Something went wrong' })
  }
}

