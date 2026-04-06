const FIELD_SPECS = {
  general: `
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
references.inspiration - Inspiration: competitors, articles, mood boards`.trim(),
  website: `
business.businessName - Business Name
business.businessType - What They Do: products or services offered
business.targetCustomers - Target Customers: who are ideal customers
business.uniqueValue - What Makes Them Special: competitive advantage
pages.pages - Pages Needed: Home, About, Services, Gallery, Contact, etc.
pages.heroMessage - Hero Message: main headline or tagline
pages.services - Services / Products: main services or product categories
pages.about - About / Story: business story, who runs it, experience
media.existingPhotos - Existing Photos: photos of work, products, team
media.photoNeeds - Photo Needs: new photos, stock, or AI-generated
media.videoContent - Video: process videos, testimonials, tours
media.portfolio - Portfolio / Gallery: what to showcase
brand.logo - Logo: existing or needs design
brand.colors - Colors: preferred colors or vibe
brand.style - Visual Style: clean, rustic, bold, modern, etc.
brand.inspiration - Sites You Like: reference websites
features.contactForm - Contact / Quote Form: type of contact form
features.socialMedia - Social Media: accounts to link
features.ecommerce - Online Sales: products, gift cards, deposits
features.otherFeatures - Other Features: blog, testimonials, maps, scheduling
domain.domain - Domain Name: existing or desired
domain.hosting - Hosting Preference
domain.email - Business Email
seo.location - Location / Service Area
seo.keywords - Search Terms: what customers search
seo.googleBusiness - Google Business Profile
seo.analytics - Analytics preference
logistics.timeline - Timeline: when site should be live
logistics.budget - Budget: range including ongoing costs
logistics.maintenance - Ongoing Updates: who updates after launch
logistics.contact - Point of Contact: name, phone, email`.trim(),
};

export async function POST(req) {
  try {
    const { text, fileName, template } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const fieldSpec = FIELD_SPECS[template] || FIELD_SPECS.general;

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
