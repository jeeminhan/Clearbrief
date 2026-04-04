export async function POST(req) {
  try {
    const { text } = await req.json();
    if (!text || text.trim().length < 3) {
      return Response.json({ cleaned: text });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ cleaned: text });
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: 'Clean up this speech-to-text transcript. Fix typos, spacing, and grammar while keeping the exact meaning and tone. Return ONLY the cleaned text, nothing else. If the text is already clean, return it as-is.' }],
          },
          contents: [{ role: 'user', parts: [{ text }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0.1 },
        }),
      }
    );

    if (!res.ok) {
      return Response.json({ cleaned: text });
    }

    const data = await res.json();
    const cleaned = data?.candidates?.[0]?.content?.parts?.[0]?.text || text;
    return Response.json({ cleaned: cleaned.trim() });
  } catch {
    return Response.json({ cleaned: req.body?.text || '' });
  }
}
