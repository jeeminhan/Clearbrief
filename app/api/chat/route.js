export async function POST(req) {
  try {
    const { message, fieldLabel, fieldPrompt } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a relaxed, friendly project brief coach. The user is filling in the "${fieldLabel}" field of a project brief. Your job is to gather useful information from whatever they say — even if it's messy, casual, or has typos.

IMPORTANT: You MUST respond with valid JSON in this exact format:
{"advance": true or false, "message": "your response here", "extractedAnswer": "the polished answer you synthesized"}

RULES:
- Be LOOSE. If the user gives you ANYTHING useful — even rough, casual, or incomplete — synthesize it into a clean answer and set advance to true.
- Put the polished/synthesized version of their answer in "extractedAnswer". Clean up typos, organize their thoughts, but keep their intent.
- Only set advance to false if you literally cannot figure out what they mean or they said something completely unrelated (like just "hi" or "idk").
- When advance is false, ask a casual, friendly question to nudge them. Don't be demanding.
- Keep your message to 1-2 short sentences. Be warm and casual, like a friend helping out.
- Don't use bullet points or markdown in the JSON string values.
- You're gathering info from a conversation, not running a form. Act like it.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Field: "${fieldLabel}"\nPrompt: "${fieldPrompt}"\n\nMy answer: ${message}`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 400,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error('Gemini API error:', errText);
      return Response.json(
        { error: 'AI service error', details: errText },
        { status: res.status }
      );
    }

    const data = await res.json();
    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      '{"advance": true, "message": "Your answer has been saved!"}';

    // Parse the JSON response from the AI
    let advance = true;
    let text = rawText;
    let extractedAnswer = '';
    try {
      // Strip markdown code fences if present
      const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);
      advance = parsed.advance ?? true;
      text = parsed.message || rawText;
      extractedAnswer = parsed.extractedAnswer || '';
    } catch {
      // If JSON parsing fails, treat as advance=true with raw text
      advance = true;
      text = rawText;
    }

    return Response.json({ text, advance, extractedAnswer });
  } catch (err) {
    console.error('Chat API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
