export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }
  return Response.json({ token: apiKey });
}
