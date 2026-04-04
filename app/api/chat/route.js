export const runtime = 'edge';

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

    const systemPrompt = `You are a friendly project brief coach. Help the user write a clear answer for the "${fieldLabel}" field of a project collaboration brief.

IMPORTANT: You MUST respond with valid JSON in this exact format:
{"advance": true or false, "message": "your response here"}

Set "advance" to true ONLY when the user's answer is specific enough to be useful in a project brief. Set "advance" to false if the answer is vague, incomplete, or you need to ask a follow-up question.

When advance is true: acknowledge their answer warmly in 1-2 sentences.
When advance is false: ask ONE specific follow-up question to help them improve their answer. Be encouraging and concise.

Don't use bullet points in your message. Don't use markdown in the JSON string value.`;

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
    try {
      // Strip markdown code fences if present
      const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);
      advance = parsed.advance ?? true;
      text = parsed.message || rawText;
    } catch {
      // If JSON parsing fails, treat as advance=true with raw text
      advance = true;
      text = rawText;
    }

    return Response.json({ text, advance });
  } catch (err) {
    console.error('Chat API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
