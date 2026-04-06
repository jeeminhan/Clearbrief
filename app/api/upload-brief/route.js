export async function POST(req) {
  try {
    const { text, fileName } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const fieldSpec = `
vision.oneLiner - One-Liner: one sentence elevator pitch
vision.problem - Problem Statement: what problem this solves
vision.targetUsers - Target Users: who are the primary users
vision.successCriteria - Success Criteria: 2-3 measurable outcomes
scope.mustHave - Must-Have Features: non-negotiable features
scope.niceToHave - Nice-to-Have: great to include if time allows
scope.outOfScope - Out of Scope: explicitly NOT building
design.visualStyle - Visual Style: look and feel
design.brandAssets - Brand Assets: logo, colors, fonts
design.contentProvided - Content You'll Provide: what user supplies vs needs created
technical.platform - Platform: web, iOS, Android, desktop
technical.techStack - Tech Stack: technology preferences
technical.integrations - Integrations: APIs or services needed
technical.dataStorage - Data & Storage: what data, where stored
timeline.launchDate - Target Launch: date or timeframe
timeline.milestones - Key Milestones: major checkpoints
timeline.availability - Your Availability: hours/week, best days
timeline.communication - Communication: how to stay in touch
risks.knownRisks - Known Risks: what could go wrong
risks.budget - Budget: budget amount or range
risks.constraints - Other Constraints: legal, accessibility
team.teamMembers - Team Members: names, roles, responsibilities
team.contactInfo - Contact Info: how to reach each person
references.designFiles - Design Files: Figma, mockups
references.existingCode - Existing Code: GitHub repo
references.inspiration - Inspiration: competitors, articles, mood boards
`.trim();

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: `Extract project brief information from the uploaded document and map it to these fields. Return a JSON object where keys are the field IDs (like "vision.oneLiner") and values are the extracted text. Only include fields where you found relevant information. Be concise but complete.\n\nFields:\n${fieldSpec}` }],
          },
          contents: [{ role: 'user', parts: [{ text: `Document "${fileName}":\n\n${text}` }] }],
          generationConfig: { maxOutputTokens: 2000, temperature: 0.2 },
        }),
      }
    );

    if (!res.ok) {
      return Response.json({ error: 'AI service error' }, { status: res.status });
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    let fields = {};
    try {
      const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      fields = JSON.parse(cleaned);
    } catch {
      fields = {};
    }

    return Response.json({ fields });
  } catch (err) {
    console.error('Upload brief error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
