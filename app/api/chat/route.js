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

    const systemPrompt = `You are a friendly project brief coach. Help the user write a clear answer for the "${fieldLabel}" field of a project collaboration brief. Keep responses to 2-4 sentences. If their answer is solid, acknowledge it warmly and suggest a polished version if helpful. If vague, ask ONE specific follow-up. Be encouraging and concise. Don't use bullet points.`;

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
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Your answer has been saved!';

    return Response.json({ text });
  } catch (err) {
    console.error('Chat API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
