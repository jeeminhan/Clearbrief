'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AudioManager } from '../lib/audio';
import { GeminiLiveClient } from '../lib/gemini-live';

/* ───────────────────────── TEMPLATES ───────────────────────── */
const TEMPLATES = {
  general: {
    name: 'General Project',
    description: 'Any software, app, or creative project',
    icon: '📋',
    sections: [
      {
        id: 'vision', title: 'Project Vision', icon: '🔭',
        fields: [
          { key: 'oneLiner', label: 'One-Liner', prompt: 'Describe your project in one sentence — like an elevator pitch.' },
          { key: 'problem', label: 'Problem Statement', prompt: 'What problem does this solve? Who has this problem and why does it matter?' },
          { key: 'targetUsers', label: 'Target Users', prompt: 'Who are the primary users? Be specific — age, role, context.' },
          { key: 'successCriteria', label: 'Success Criteria', prompt: 'How will you know this succeeded? Give 2–3 measurable outcomes.' },
        ],
      },
      {
        id: 'scope', title: 'Scope & Deliverables', icon: '📐',
        fields: [
          { key: 'mustHave', label: 'Must-Have Features', prompt: 'What are the non-negotiable features this project needs?' },
          { key: 'niceToHave', label: 'Nice-to-Have', prompt: 'What would be great to include if time allows?' },
          { key: 'outOfScope', label: 'Out of Scope', prompt: 'What are you explicitly NOT building in this phase?' },
        ],
      },
      {
        id: 'design', title: 'Design & Creative', icon: '🎨',
        fields: [
          { key: 'visualStyle', label: 'Visual Style', prompt: 'Describe the look and feel. Any reference sites or aesthetics you admire?' },
          { key: 'brandAssets', label: 'Brand Assets', prompt: 'Do you have a logo, colors, fonts, or brand guide? Link them if possible.' },
          { key: 'contentProvided', label: "Content You'll Provide", prompt: 'What will you supply (copy, images) vs. what you need created?' },
        ],
      },
      {
        id: 'technical', title: 'Technical Requirements', icon: '⚙️',
        fields: [
          { key: 'platform', label: 'Platform', prompt: 'Where will this live? Web, iOS, Android, desktop?' },
          { key: 'techStack', label: 'Tech Stack', prompt: 'Any preferences on technology? (e.g. React, Firebase, Tailwind)' },
          { key: 'integrations', label: 'Integrations', prompt: 'Does this need to connect to any APIs or services?' },
          { key: 'dataStorage', label: 'Data & Storage', prompt: 'What data will this handle and where should it be stored?' },
        ],
      },
      {
        id: 'timeline', title: 'Timeline & Milestones', icon: '📅',
        fields: [
          { key: 'launchDate', label: 'Target Launch', prompt: 'When do you want this done? Give a date or timeframe.' },
          { key: 'milestones', label: 'Key Milestones', prompt: 'Break it into phases — what are the major checkpoints?' },
          { key: 'availability', label: 'Your Availability', prompt: 'How many hours/week can you dedicate? What days work best?' },
          { key: 'communication', label: 'Communication', prompt: 'How should we stay in touch and how often should we sync?' },
        ],
      },
      {
        id: 'risks', title: 'Risks & Constraints', icon: '⚠️',
        fields: [
          { key: 'knownRisks', label: 'Known Risks', prompt: 'What could go wrong or slow things down?' },
          { key: 'budget', label: 'Budget', prompt: 'Is there a budget? ($0 side project, specific amount, flexible)' },
          { key: 'constraints', label: 'Other Constraints', prompt: 'Legal, accessibility, or platform constraints?' },
        ],
      },
      {
        id: 'team', title: 'Team & Roles', icon: '👥',
        fields: [
          { key: 'teamMembers', label: 'Team Members', prompt: "Who's involved? List names, roles, and responsibilities." },
          { key: 'contactInfo', label: 'Contact Info', prompt: 'How can each person be reached? (email, Slack, etc.)' },
        ],
      },
      {
        id: 'references', title: 'References & Links', icon: '📎',
        fields: [
          { key: 'designFiles', label: 'Design Files', prompt: 'Figma files, mockups, or wireframes? Drop links.' },
          { key: 'existingCode', label: 'Existing Code', prompt: 'GitHub repo or existing codebase to build on?' },
          { key: 'inspiration', label: 'Inspiration', prompt: 'Links to competitors, articles, mood boards — anything that captures your vision.' },
        ],
      },
    ],
  },
  website: {
    name: 'Business Website',
    description: 'Build a website for a business or service',
    icon: '🌐',
    sections: [
      {
        id: 'business', title: 'Business Overview', icon: '🏢',
        fields: [
          { key: 'businessName', label: 'Business Name', prompt: 'What\'s the name of the business?' },
          { key: 'businessType', label: 'What They Do', prompt: 'Describe the business in a few sentences. What products or services do they offer?' },
          { key: 'targetCustomers', label: 'Target Customers', prompt: 'Who are the ideal customers? Local, national? Homeowners, businesses, contractors?' },
          { key: 'uniqueValue', label: 'What Makes Them Special', prompt: 'What sets this business apart from competitors? Quality, experience, style, pricing?' },
        ],
      },
      {
        id: 'pages', title: 'Pages & Content', icon: '📄',
        fields: [
          { key: 'pages', label: 'Pages Needed', prompt: 'What pages should the site have? (e.g. Home, About, Services, Gallery, Contact)' },
          { key: 'heroMessage', label: 'Hero Message', prompt: 'What\'s the first thing visitors should see? The main headline or tagline.' },
          { key: 'services', label: 'Services / Products', prompt: 'List the main services or product categories to feature on the site.' },
          { key: 'about', label: 'About / Story', prompt: 'Tell the business story — how it started, who runs it, years of experience, etc.' },
        ],
      },
      {
        id: 'media', title: 'Photos & Media', icon: '📸',
        fields: [
          { key: 'existingPhotos', label: 'Existing Photos', prompt: 'Do you have photos of the work, products, team, or workspace? How many roughly?' },
          { key: 'photoNeeds', label: 'Photo Needs', prompt: 'Do you need new photos taken, stock photos, or AI-generated images?' },
          { key: 'videoContent', label: 'Video', prompt: 'Any videos to include? Process videos, testimonials, tours?' },
          { key: 'portfolio', label: 'Portfolio / Gallery', prompt: 'Should there be a gallery or portfolio section? Describe what to showcase.' },
        ],
      },
      {
        id: 'brand', title: 'Brand & Style', icon: '🎨',
        fields: [
          { key: 'logo', label: 'Logo', prompt: 'Is there an existing logo? If not, do you need one designed?' },
          { key: 'colors', label: 'Colors', prompt: 'Any preferred colors? Or describe the vibe — rustic, modern, warm, bold?' },
          { key: 'style', label: 'Visual Style', prompt: 'What should the site feel like? Clean and minimal, rustic and warm, bold and modern?' },
          { key: 'inspiration', label: 'Sites You Like', prompt: 'Links to any websites you admire — they don\'t have to be in the same industry.' },
        ],
      },
      {
        id: 'features', title: 'Features & Functionality', icon: '⚙️',
        fields: [
          { key: 'contactForm', label: 'Contact / Quote Form', prompt: 'What kind of contact form? Simple contact, request a quote, book a consultation?' },
          { key: 'socialMedia', label: 'Social Media', prompt: 'Which social accounts to link? Instagram, Facebook, YouTube, etc.' },
          { key: 'ecommerce', label: 'Online Sales', prompt: 'Will customers buy anything online? Products, gift cards, deposits?' },
          { key: 'otherFeatures', label: 'Other Features', prompt: 'Anything else? Blog, testimonials section, Google Maps embed, scheduling?' },
        ],
      },
      {
        id: 'domain', title: 'Domain & Hosting', icon: '🔗',
        fields: [
          { key: 'domain', label: 'Domain Name', prompt: 'Do you already own a domain? If not, what domain do you want? (e.g. smithwoodworks.com)' },
          { key: 'hosting', label: 'Hosting Preference', prompt: 'Any hosting preference? Or should the developer choose? (Vercel, Squarespace, etc.)' },
          { key: 'email', label: 'Business Email', prompt: 'Need a business email set up? (e.g. info@smithwoodworks.com)' },
        ],
      },
      {
        id: 'seo', title: 'SEO & Marketing', icon: '📈',
        fields: [
          { key: 'location', label: 'Location / Service Area', prompt: 'Where is the business located? What areas do they serve?' },
          { key: 'keywords', label: 'Search Terms', prompt: 'What would customers search to find this business? (e.g. "custom furniture Austin")' },
          { key: 'googleBusiness', label: 'Google Business Profile', prompt: 'Is there a Google Business profile? Should one be set up?' },
          { key: 'analytics', label: 'Analytics', prompt: 'Want to track visitors? Google Analytics, or something simpler?' },
        ],
      },
      {
        id: 'logistics', title: 'Timeline & Budget', icon: '📅',
        fields: [
          { key: 'timeline', label: 'Timeline', prompt: 'When should the site be live? Any upcoming event or deadline driving this?' },
          { key: 'budget', label: 'Budget', prompt: 'What\'s the budget range? Include ongoing costs (hosting, domain) vs. one-time build.' },
          { key: 'maintenance', label: 'Ongoing Updates', prompt: 'Who will update the site after launch? The business owner, you, or a developer?' },
          { key: 'contact', label: 'Point of Contact', prompt: 'Who should the developer talk to? Name, phone, email.' },
        ],
      },
    ],
  },
};

// Default to general for backwards compatibility
const SECTIONS = TEMPLATES.general.sections;

/* ───────────────────────── HELPERS ───────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 5, height: 5, borderRadius: '50%', background: '#64748b',
          animation: `dotPulse 1.2s ease-in-out ${i * 0.15}s infinite`,
        }} />
      ))}
    </div>
  );
}

function renderMd(text) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} style={{ margin: '3px 0', lineHeight: 1.6 }}>
        {parts.map((p, j) => (j % 2 === 1 ? <strong key={j}>{p}</strong> : p))}
      </p>
    );
  });
}


function generateBriefText(formData, projectName, senderName, sections) {
  const secs = sections || SECTIONS;
  let t = `PROJECT COLLABORATION BRIEF\n${'═'.repeat(40)}\n`;
  if (projectName) t += `Project: ${projectName}\n`;
  if (senderName) t += `Submitted by: ${senderName}\n`;
  t += `Date: ${new Date().toLocaleDateString()}\n`;
  secs.forEach(s => {
    t += `\n${'─'.repeat(40)}\n${s.icon} ${s.title.toUpperCase()}\n${'─'.repeat(40)}\n\n`;
    s.fields.forEach(f => {
      const val = formData[`${s.id}.${f.key}`];
      t += `${f.label}:\n${val === '__skipped__' ? '(Skipped)' : val || '(Not filled)'}\n\n`;
    });
  });
  return t;
}

/* ───────────────────────── VOICE TOOLS ───────────────────────── */
function buildVoiceSystemPrompt(section, formData) {
  const fieldStatus = section.fields.map(f => {
    const val = formData[`${section.id}.${f.key}`];
    const skipped = val === '__skipped__';
    return `- fieldKey="${f.key}" (${f.label}): ${skipped ? '(skipped)' : val || '(empty)'} — Prompt: ${f.prompt}`;
  }).join('\n');

  return `You are a relaxed, friendly project brief coach having a casual voice conversation. You're helping the user fill out the "${section.title}" section of a project brief.

Current fields and their status:
${fieldStatus}

RULES:
- Talk like a friend, not a form. Be warm, casual, and encouraging.
- Listen to what the user says and extract useful information for the brief fields.
- When you hear something that answers a field (even roughly), call the save_field tool with the EXACT fieldKey shown above (e.g. "${section.fields[0]?.key}") and a clean, polished version of what they said.
- IMPORTANT: The fieldKey must be the exact key in quotes above, NOT the label. For example use "${section.fields[0]?.key}" not "${section.fields[0]?.label}".
- If the user wants to skip a field, call save_field with the fieldKey and answer set to "__skipped__".
- You can fill multiple fields from a single rambling answer — extract everything useful.
- Don't demand perfect answers. If they say something rough, clean it up and save it.
- Guide the conversation naturally toward unfilled fields, but don't be rigid about order.
- Keep your spoken responses SHORT — 1-2 sentences max. This is a conversation, not a lecture.
- When all fields in this section are filled, let them know and suggest moving to the next section.`;
}

const VOICE_TOOLS = [{
  functionDeclarations: [{
    name: 'save_field',
    description: 'Save a polished answer for a brief field. Call this whenever the user says something that answers one of the fields.',
    parameters: {
      type: 'OBJECT',
      properties: {
        fieldKey: { type: 'STRING', description: 'The field key to save (e.g. "oneLiner", "problem", "targetUsers")' },
        answer: { type: 'STRING', description: 'The polished, clean answer extracted from what the user said' },
      },
      required: ['fieldKey', 'answer'],
    },
  }],
}];

/* ───────────────────────── SECTION CHAT ───────────────────────── */
function SectionChat({ section, formData, setFormData, chatHistories, setChatHistories }) {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState('');
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const messages = chatHistories[section.id] || [];

  // Voice state
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceConnecting, setVoiceConnecting] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const audioManagerRef = useRef(null);
  const geminiClientRef = useRef(null);
  const formDataRef = useRef(formData);
  useEffect(() => { formDataRef.current = formData; }, [formData]);

  // Cleanup voice on unmount or section change
  useEffect(() => {
    return () => {
      audioManagerRef.current?.destroy();
      geminiClientRef.current?.disconnect();
    };
  }, [section.id]);

  // Transcript merging — accumulate chunks into the last message of the same role
  const pendingTranscriptRef = useRef({ user: null, model: null });

  const appendTranscript = useCallback((role, text) => {
    if (!text || !text.trim()) return;
    const chatRole = role === 'user' ? 'user' : 'ai';
    const otherRole = role === 'user' ? 'model' : 'user';

    setChatHistories(prev => {
      const msgs = [...(prev[section.id] || [])];
      const ownIdx = pendingTranscriptRef.current[role];

      // Close the other role's pending message
      pendingTranscriptRef.current[otherRole] = null;

      if (ownIdx != null && msgs[ownIdx] && msgs[ownIdx].role === chatRole) {
        // Append directly — preserve Gemini's spacing, clean up on display
        const merged = (msgs[ownIdx].text + text).replace(/\s+/g, ' ').trim();
        msgs[ownIdx] = { ...msgs[ownIdx], text: merged };
        return { ...prev, [section.id]: msgs };
      }

      // Start a new message
      const newMsg = { role: chatRole, text: text.trim(), id: Date.now() + Math.random() };
      msgs.push(newMsg);
      pendingTranscriptRef.current[role] = msgs.length - 1;
      return { ...prev, [section.id]: msgs };
    });
  }, [section.id, setChatHistories]);

  const cleanupTranscript = useCallback(async (msgIndex) => {
    // Read current state via functional updater to avoid stale closure
    let textToClean = '';
    setChatHistories(prev => {
      const msgs = prev[section.id] || [];
      textToClean = msgs[msgIndex]?.text || '';
      return prev; // no mutation, just reading
    });

    if (!textToClean || textToClean.length < 5) return;

    try {
      const res = await fetch('/api/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToClean }),
      });
      const { cleaned } = await res.json();
      if (cleaned && cleaned !== textToClean) {
        setChatHistories(prev => {
          const updated = [...(prev[section.id] || [])];
          if (updated[msgIndex]) {
            updated[msgIndex] = { ...updated[msgIndex], text: cleaned };
          }
          return { ...prev, [section.id]: updated };
        });
      }
    } catch { /* silent fail — raw transcript stays */ }
  }, [section.id, setChatHistories]);

  const finalizeTurn = useCallback(() => {
    // Clean up any pending transcript messages
    const userIdx = pendingTranscriptRef.current.user;
    const modelIdx = pendingTranscriptRef.current.model;
    if (userIdx != null) cleanupTranscript(userIdx);
    if (modelIdx != null) cleanupTranscript(modelIdx);
    pendingTranscriptRef.current = { user: null, model: null };
  }, [cleanupTranscript]);

  const addChatMessage = useCallback((role, text) => {
    // For non-transcript messages (system, tool saves), always create a new bubble
    finalizeTurn();
    setChatHistories(prev => ({
      ...prev,
      [section.id]: [...(prev[section.id] || []), { role, text, id: Date.now() + Math.random() }],
    }));
  }, [section.id, setChatHistories, finalizeTurn]);

  const handleVoiceToggle = useCallback(async () => {
    // Stop voice
    if (voiceActive || voiceConnecting) {
      audioManagerRef.current?.destroy();
      audioManagerRef.current = null;
      geminiClientRef.current?.disconnect();
      geminiClientRef.current = null;
      setVoiceActive(false);
      setVoiceConnecting(false);
      setUserSpeaking(false);
      finalizeTurn();
      addChatMessage('ai', 'Voice chat ended. You can keep typing or tap the mic to start again.');
      return;
    }

    // Start voice
    setVoiceConnecting(true);
    try {
      const tokenRes = await fetch('/api/gemini/token');
      if (!tokenRes.ok) throw new Error('Failed to get token');
      const { token } = await tokenRes.json();

      const audioManager = new AudioManager();
      audioManagerRef.current = audioManager;

      const systemPrompt = buildVoiceSystemPrompt(section, formDataRef.current);

      const client = new GeminiLiveClient({
        token,
        systemPrompt,
        tools: VOICE_TOOLS,
        onAudioResponse: (pcmData) => { audioManager.playAudio(pcmData); },
        onTranscript: (role, text) => {
          if (role === 'user') setUserSpeaking(false);
          appendTranscript(role, text);
        },
        onInterrupted: () => { audioManager.stopPlayback(); },
        onUserSpeechStart: () => { setUserSpeaking(true); },
        onUserSpeechEnd: () => { /* keep showing until transcript arrives */ },
        onToolCall: ({ id, name, args }) => {
          if (name === 'save_field' && args.fieldKey && args.answer) {
            // Resolve fieldKey — AI might send the label instead of the key
            let resolvedKey = args.fieldKey;
            const exactMatch = section.fields.find(f => f.key === args.fieldKey);
            if (!exactMatch) {
              const labelMatch = section.fields.find(f =>
                f.label.toLowerCase() === args.fieldKey.toLowerCase() ||
                f.label.toLowerCase().replace(/[^a-z]/g, '') === args.fieldKey.toLowerCase().replace(/[^a-z]/g, '')
              );
              if (labelMatch) resolvedKey = labelMatch.key;
            }

            const fullKey = `${section.id}.${resolvedKey}`;
            const isSkip = args.answer === '__skipped__';
            setFormData(prev => ({ ...prev, [fullKey]: args.answer }));

            const field = section.fields.find(f => f.key === resolvedKey);
            const displayLabel = field?.label || resolvedKey;
            setChatHistories(prev => ({
              ...prev,
              [section.id]: [...(prev[section.id] || []), {
                role: 'ai',
                text: isSkip ? `Skipped **${displayLabel}**` : `Saved **${displayLabel}**: "${args.answer}"`,
                id: Date.now() + Math.random(),
              }],
            }));
            try { client.sendToolResponse(id, name, { success: true }); } catch (e) { console.error('[Voice] Tool response failed:', e); }
          } else {
            try { client.sendToolResponse(id, name, { error: 'Unknown tool' }); } catch (e) { console.error('[Voice] Tool response failed:', e); }
          }
        },
        onTurnComplete: () => { finalizeTurn(); },
        onError: (err) => {
          console.error('[Voice]', err);
          setVoiceActive(false);
          setVoiceConnecting(false);
          setUserSpeaking(false);
          finalizeTurn();
          addChatMessage('ai', 'Voice connection lost. Tap the mic to try again.');
        },
        onConnectionChange: (connected) => {
          if (connected) {
            setVoiceConnecting(false);
            setVoiceActive(true);
          }
        },
        onSetupComplete: async () => {
          // Setup done — now start mic and kick off the conversation
          try {
            await audioManager.startCapture((pcmData) => {
              client.sendAudio(pcmData);
            });
          } catch (err) {
            console.error('[Voice] Mic start failed:', err);
            addChatMessage('ai', 'Could not access microphone. Check permissions and try again.');
            return;
          }

          // Ask the AI to start the conversation about the current field
          const fieldIdx = getCurrentFieldIndex();
          const currentField = section.fields[fieldIdx];
          client.sendText(`Start the conversation. The current field is "${currentField.label}": ${currentField.prompt}. Greet me casually and ask about this.`);
        },
      });

      geminiClientRef.current = client;
      client.connect();

    } catch (err) {
      console.error('[Voice] Init failed:', err);
      setVoiceConnecting(false);
      addChatMessage('ai', 'Could not start voice chat. Check your microphone permissions and try again.');
    }
  }, [voiceActive, voiceConnecting, section, setFormData, addChatMessage]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
  useEffect(() => { inputRef.current?.focus(); }, [section.id]);

  useEffect(() => {
    if (!chatHistories[section.id] || chatHistories[section.id].length === 0) {
      const f = section.fields[0];
      setChatHistories(prev => ({
        ...prev,
        [section.id]: [{
          role: 'ai',
          text: `Let's work on **${section.title}**. I'll walk you through each field.\n\n**${f.label}**: ${f.prompt}`,
          id: Date.now(),
        }],
      }));
    }
  }, [section.id]);

  const getCurrentFieldIndex = () => {
    const filled = section.fields.filter(f => formData[`${section.id}.${f.key}`]).length;
    return Math.min(filled, section.fields.length - 1);
  };

  const callAI = async (userText, field) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, fieldLabel: field.label, fieldPrompt: field.prompt }),
      });
      const data = await res.json();
      return {
        text: data.text || 'Your answer has been saved!',
        advance: data.advance ?? true,
        extractedAnswer: data.extractedAnswer || '',
      };
    } catch {
      return { text: 'Connection issue — your answer was saved. You can refine it later.', advance: true, extractedAnswer: '' };
    }
  };

  const advanceToNextField = (fieldIdx) => {
    const nextIdx = fieldIdx + 1;
    let nextPrompt = '';
    if (nextIdx < section.fields.length) {
      const nf = section.fields[nextIdx];
      nextPrompt = `\n\nNext up — **${nf.label}**: ${nf.prompt}`;
    } else {
      nextPrompt = `\n\n**${section.title}** is complete! Move on to the next section or revise anything here.`;
    }
    return nextPrompt;
  };

  const handleSkip = () => {
    if (isLoading) return;
    const fieldIdx = getCurrentFieldIndex();
    const field = section.fields[fieldIdx];
    const allDone = section.fields.filter(f => formData[`${section.id}.${f.key}`]).length === section.fields.length;
    if (allDone) return;

    // Save skip marker so we advance past this field
    setFormData(prev => ({ ...prev, [`${section.id}.${field.key}`]: '__skipped__' }));
    setPendingAnswer('');

    const skipMsg = { role: 'user', text: '⏭ Skipped', id: Date.now() };
    const nextText = `No problem, we can come back to **${field.label}** later.` + advanceToNextField(fieldIdx);
    const aiMsg = { role: 'ai', text: nextText, id: Date.now() + 1 };

    setChatHistories(prev => ({
      ...prev,
      [section.id]: [...(prev[section.id] || []), skipMsg, aiMsg],
    }));
  };

  const handleSend = async () => {
    if (!userInput.trim() || isLoading) return;
    const text = userInput.trim();
    setUserInput('');
    setIsLoading(true);

    const fieldIdx = getCurrentFieldIndex();
    const field = section.fields[fieldIdx];

    // Accumulate the user's answer for this field (in case of follow-ups)
    const accumulated = pendingAnswer ? `${pendingAnswer}\n${text}` : text;
    setPendingAnswer(accumulated);

    const userMsg = { role: 'user', text, id: Date.now() };
    setChatHistories(prev => ({
      ...prev,
      [section.id]: [...(prev[section.id] || []), userMsg],
    }));

    const { text: aiText, advance, extractedAnswer } = await callAI(text, field);
    setIsLoading(false);

    let fullAiText = aiText;
    if (advance) {
      // AI says the answer is good — save the AI's polished version (or raw if no extraction)
      const answerToSave = extractedAnswer || accumulated;
      setFormData(prev => ({ ...prev, [`${section.id}.${field.key}`]: answerToSave }));
      setPendingAnswer('');
      fullAiText += advanceToNextField(fieldIdx);
    }
    // If advance is false, the AI asked a follow-up — stay on the same field

    setChatHistories(prev => ({
      ...prev,
      [section.id]: [
        ...(prev[section.id] || []),
        { role: 'ai', text: fullAiText, id: Date.now() + 1 },
      ],
    }));
  };

  const filledCount = section.fields.filter(f => formData[`${section.id}.${f.key}`]).length;
  const allDone = filledCount === section.fields.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '18px 24px', borderBottom: '1px solid #1e293b',
        background: 'linear-gradient(180deg, rgba(30,41,59,0.4), transparent)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>{section.icon}</span>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{section.title}</h2>
          <span style={{
            marginLeft: 'auto', fontSize: 11, fontWeight: 600,
            color: allDone ? '#22c55e' : '#64748b',
            background: allDone ? 'rgba(34,197,94,0.1)' : '#1e293b',
            padding: '3px 10px', borderRadius: 12,
          }}>{filledCount}/{section.fields.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          {section.fields.map((f, i) => {
            const val = formData[`${section.id}.${f.key}`];
            const skipped = val === '__skipped__';
            const filled = !!val && !skipped;
            const isCurrent = i === getCurrentFieldIndex() && !allDone;
            return (
              <span key={f.key} style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 20,
                background: filled ? 'rgba(34,197,94,0.12)' : skipped ? 'rgba(234,179,8,0.12)' : isCurrent ? 'rgba(59,130,246,0.12)' : '#131c2e',
                color: filled ? '#4ade80' : skipped ? '#eab308' : isCurrent ? '#60a5fa' : '#475569',
                border: isCurrent ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                fontWeight: isCurrent ? 600 : 400,
              }}>{filled ? '✓ ' : skipped ? '⏭ ' : ''}{f.label}</span>
            );
          })}
        </div>
        {/* Show saved answers preview */}
        {section.fields.some(f => formData[`${section.id}.${f.key}`]) && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {section.fields.map(f => {
              const val = formData[`${section.id}.${f.key}`];
              if (!val || val === '__skipped__') return null;
              return (
                <div key={f.key} style={{
                  fontSize: 11, color: '#8896a8', lineHeight: 1.5,
                  padding: '6px 10px', borderRadius: 8,
                  background: 'rgba(15,23,42,0.6)', border: '1px solid #1a2536',
                }}>
                  <span style={{ color: '#4ade80', fontWeight: 600 }}>{f.label}:</span>{' '}
                  {val.length > 120 ? val.slice(0, 120) + '...' : val}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 14, animation: 'fadeIn 0.25s ease',
          }}>
            <div style={{
              maxWidth: '80%', padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#1a2332',
              border: msg.role === 'user' ? 'none' : '1px solid #253346',
              color: msg.role === 'user' ? '#fff' : '#b8c9da',
              fontSize: 13.5, lineHeight: 1.6,
            }}>
              {renderMd(msg.text)}
            </div>
          </div>
        ))}
        {userSpeaking && voiceActive && (
          <div style={{
            display: 'flex', justifyContent: 'flex-end', marginBottom: 14,
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{
              padding: '10px 16px', borderRadius: '16px 16px 4px 16px',
              background: 'rgba(59,130,246,0.15)', border: '1px dashed rgba(59,130,246,0.4)',
              color: '#60a5fa', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ display: 'inline-flex', gap: 3 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#60a5fa', animation: 'pulse 1s ease-in-out infinite' }} />
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#60a5fa', animation: 'pulse 1s ease-in-out 0.15s infinite' }} />
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#60a5fa', animation: 'pulse 1s ease-in-out 0.3s infinite' }} />
              </span>
              Listening...
            </div>
          </div>
        )}
        {isLoading && (
          <div style={{ marginBottom: 14 }}>
            <div style={{
              display: 'inline-block', padding: '12px 16px', borderRadius: '16px 16px 16px 4px',
              background: '#1a2332', border: '1px solid #253346',
            }}><TypingDots /></div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div style={{ padding: '14px 20px', background: 'linear-gradient(transparent, #0b1121 40%)' }}>
        {voiceActive ? (
          /* Voice mode: centered stop button */
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            background: '#141e30', border: '1px solid #253346',
            borderRadius: 14, padding: '12px 16px',
          }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Listening...</span>
            <button
              onClick={handleVoiceToggle}
              title="Stop voice chat"
              style={{
                width: 44, height: 44, borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              <span style={{
                position: 'absolute', inset: -4, borderRadius: 16, border: '2px solid #ef4444',
                animation: 'pulse 1.5s ease-in-out infinite', opacity: 0.5,
              }} />
            </button>
          </div>
        ) : (
          /* Text mode: textarea + skip + mic + send */
          <div style={{
            display: 'flex', gap: 8, alignItems: 'flex-end',
            background: '#141e30', border: '1px solid #253346',
            borderRadius: 14, padding: '8px 8px 8px 16px',
          }}>
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={allDone ? 'All fields done! Type to revise...' : 'Type your answer...'}
              rows={2}
              style={{
                flex: 1, resize: 'none', border: 'none', background: 'transparent',
                color: '#e2e8f0', fontSize: 14, fontFamily: 'inherit', lineHeight: 1.5, padding: '4px 0',
              }}
            />
            {!allDone && (
              <button
                onClick={handleSkip}
                disabled={isLoading}
                title="Skip this field"
                style={{
                  height: 36, padding: '0 10px', borderRadius: 10,
                  border: '1px solid #253346', background: 'transparent',
                  color: '#64748b', fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                  cursor: isLoading ? 'default' : 'pointer', flexShrink: 0,
                  letterSpacing: '0.02em',
                }}
              >Skip</button>
            )}
            <button
              onClick={handleVoiceToggle}
              title="Start voice chat"
              disabled={voiceConnecting}
              style={{
                width: 36, height: 36, borderRadius: 10, border: 'none',
                background: voiceConnecting ? '#1e293b' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: '#fff', fontSize: 15,
                cursor: voiceConnecting ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              {voiceConnecting ? (
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #64748b', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              )}
            </button>
            <button
              onClick={handleSend}
              disabled={!userInput.trim() || isLoading}
              style={{
                width: 36, height: 36, borderRadius: 10, border: 'none',
                background: userInput.trim() ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : '#1e293b',
                color: '#fff', fontSize: 15,
                cursor: userInput.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >↑</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── INTRO SCREEN ───────────────────────── */
function IntroScreen({ onStart, onUpload }) {
  const [uploading, setUploading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('general');
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const text = await file.text();
      await onUpload(text, file.name, selectedTemplate);
    } catch {
      alert('Could not read file. Try a .txt, .md, or .pdf file.');
    }
    setUploading(false);
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 30%, rgba(59,130,246,0.08), #0b1121 70%)',
      overflowY: 'auto',
    }}>
      <div style={{ maxWidth: 560, padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', margin: '0 0 8px', lineHeight: 1.3 }}>
          Brief Builder
        </h1>
        <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.7, margin: '0 0 28px' }}>
          Build a clear project brief through conversation. Talk or type your way through each section
          — the AI coach will help shape your ideas into a polished document.
        </p>

        {/* Template selector */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {Object.entries(TEMPLATES).map(([key, t]) => (
            <button
              key={key}
              onClick={() => setSelectedTemplate(key)}
              style={{
                flex: 1, padding: '16px 14px', borderRadius: 14, cursor: 'pointer',
                border: selectedTemplate === key ? '2px solid #3b82f6' : '1px solid #253346',
                background: selectedTemplate === key ? 'rgba(59,130,246,0.08)' : 'rgba(30,41,59,0.3)',
                textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{t.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: selectedTemplate === key ? '#e2e8f0' : '#94a3b8' }}>
                {t.name}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>
                {t.description}
              </div>
            </button>
          ))}
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left',
          padding: '20px 24px', borderRadius: 14,
          background: 'rgba(30,41,59,0.3)', border: '1px solid #1e293b', marginBottom: 32,
        }}>
          {[
            ['🎙️', 'Voice or text', 'Talk naturally or type — the AI extracts what matters'],
            ['⏭️', 'Skip anything', 'Every section is optional. Skip fields and come back later'],
            ['📄', 'Upload a doc', 'Have an existing brief? Upload it and AI fills in the fields'],
            ['📋', 'Export when ready', 'Copy or download your polished brief at any time'],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{title}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => onStart(selectedTemplate)}
            style={{
              padding: '14px 36px', border: 'none', borderRadius: 12,
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Start from scratch</button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              padding: '14px 28px', border: '1px solid #253346', borderRadius: 12,
              background: 'transparent', color: '#94a3b8', fontSize: 15, fontWeight: 500,
              cursor: uploading ? 'default' : 'pointer', fontFamily: 'inherit',
            }}
          >{uploading ? 'Reading...' : 'Upload a document'}</button>
          <input ref={fileRef} type="file" accept=".txt,.md,.csv,.json,.doc,.docx,.pdf" onChange={handleFile} style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── MAIN APP ───────────────────────── */
const STORAGE_KEY = 'briefbuilder_state';
const INTRO_SEEN_KEY = 'briefbuilder_intro_seen';

function loadSavedState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(formData, chatHistories, senderName, projectName, templateKey) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, chatHistories, senderName, projectName, templateKey }));
  } catch { /* storage full or unavailable */ }
}

export default function BriefBuilder() {
  const [activeSection, setActiveSection] = useState(0);
  const [templateKey, setTemplateKey] = useState(() => loadSavedState()?.templateKey ?? 'general');
  const [formData, setFormData] = useState(() => loadSavedState()?.formData ?? {});
  const [chatHistories, setChatHistories] = useState(() => loadSavedState()?.chatHistories ?? {});
  const [showExportModal, setShowExportModal] = useState(false);
  const [senderName, setSenderName] = useState(() => loadSavedState()?.senderName ?? '');
  const [projectName, setProjectName] = useState(() => loadSavedState()?.projectName ?? '');
  const activeSections = TEMPLATES[templateKey]?.sections ?? SECTIONS;
  const [copied, setCopied] = useState(false);
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = loadSavedState();
    if (saved?.formData && Object.keys(saved.formData).length > 0) return false;
    return !localStorage.getItem(INTRO_SEEN_KEY);
  });

  const handleIntroStart = (template) => {
    setTemplateKey(template || 'general');
    localStorage.setItem(INTRO_SEEN_KEY, '1');
    setShowIntro(false);
  };

  const handleIntroUpload = async (text, fileName, template) => {
    setTemplateKey(template || 'general');
    try {
      const res = await fetch('/api/upload-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, fileName, template: template || 'general' }),
      });
      const data = await res.json();
      if (data.fields && Object.keys(data.fields).length > 0) {
        setFormData(prev => ({ ...prev, ...data.fields }));
      }
    } catch {
      alert('Upload failed. Please try again.');
      return;
    }
    localStorage.setItem(INTRO_SEEN_KEY, '1');
    setShowIntro(false);
  };

  // Persist state to localStorage on changes
  useEffect(() => {
    saveState(formData, chatHistories, senderName, projectName, templateKey);
  }, [formData, chatHistories, senderName, projectName, templateKey]);

  const progress = (() => {
    let done = 0, total = 0;
    activeSections.forEach(s => s.fields.forEach(f => {
      total++;
      if (formData[`${s.id}.${f.key}`]) done++;
    }));
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  })();

  const handleCopy = async () => {
    const briefText = generateBriefText(formData, projectName, senderName, activeSections);
    try {
      await navigator.clipboard.writeText(briefText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = briefText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  const handleRestart = () => {
    setFormData({});
    setChatHistories({});
    setSenderName('');
    setProjectName('');
    setTemplateKey('general');
    setActiveSection(0);
    setShowRestartConfirm(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(INTRO_SEEN_KEY);
    setShowIntro(true);
  };

  const handleDownload = () => {
    const briefText = generateBriefText(formData, projectName, senderName, activeSections);
    const blob = new Blob([briefText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(projectName || 'project').replace(/\s+/g, '_').toLowerCase()}_brief.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (showIntro) {
    return <IntroScreen onStart={handleIntroStart} onUpload={handleIntroUpload} />;
  }

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      {/* ─── SIDEBAR ─── */}
      <div style={{
        width: 260, flexShrink: 0, background: '#0d1525', borderRight: '1px solid #1a2536',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid #1a2536' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#3b82f6', textTransform: 'uppercase', marginBottom: 4 }}>
            Brief Builder
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>Project Collaboration</div>
        </div>

        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a2536' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>Progress</span>
            <span style={{ fontSize: 11, color: '#64748b' }}>{progress.pct}%</span>
          </div>
          <div style={{ height: 4, background: '#1a2536', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2, transition: 'width 0.5s ease',
              background: progress.pct === 100
                ? 'linear-gradient(90deg, #22c55e, #10b981)'
                : 'linear-gradient(90deg, #3b82f6, #6366f1)',
              width: `${progress.pct}%`,
            }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {activeSections.map((s, i) => {
            const filled = s.fields.filter(f => formData[`${s.id}.${f.key}`]).length;
            const complete = filled === s.fields.length;
            const isActive = i === activeSection;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '11px 18px', border: 'none', cursor: 'pointer',
                  background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
                  borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                  textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{s.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#e2e8f0' : '#8896a8',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{s.title}</div>
                </div>
                {complete ? (
                  <span style={{ fontSize: 11, color: '#22c55e' }}>✓</span>
                ) : filled > 0 ? (
                  <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>{filled}/{s.fields.length}</span>
                ) : (
                  <span style={{ fontSize: 10, color: '#334155' }}>{s.fields.length}</span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ padding: '14px 18px', borderTop: '1px solid #1a2536' }}>
          <button
            onClick={() => setShowExportModal(true)}
            disabled={progress.done === 0}
            style={{
              width: '100%', padding: '11px 0', border: 'none', borderRadius: 10, fontFamily: 'inherit',
              background: progress.done > 0
                ? progress.pct === 100 ? 'linear-gradient(135deg, #22c55e, #10b981)' : 'linear-gradient(135deg, #3b82f6, #6366f1)'
                : '#1a2536',
              color: progress.done > 0 ? '#fff' : '#475569',
              fontSize: 13, fontWeight: 600, cursor: progress.done > 0 ? 'pointer' : 'default',
            }}
          >
            {progress.pct === 100 ? '📋  Export Brief' : `📋  Export (${progress.pct}%)`}
          </button>
          {showRestartConfirm ? (
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button
                onClick={handleRestart}
                style={{
                  flex: 1, padding: '9px 0', border: 'none', borderRadius: 8, fontFamily: 'inherit',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >Yes, restart</button>
              <button
                onClick={() => setShowRestartConfirm(false)}
                style={{
                  flex: 1, padding: '9px 0', border: '1px solid #253346', borderRadius: 8, fontFamily: 'inherit',
                  background: 'transparent', color: '#94a3b8', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                }}
              >Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setShowRestartConfirm(true)}
              style={{
                width: '100%', padding: '9px 0', border: '1px solid #253346', borderRadius: 10, fontFamily: 'inherit',
                background: 'transparent', color: '#64748b', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                marginTop: 8,
              }}
            >Start Over</button>
          )}
        </div>
      </div>

      {/* ─── MAIN CHAT ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <SectionChat
          key={activeSections[activeSection].id}
          section={activeSections[activeSection]}
          formData={formData}
          setFormData={setFormData}
          chatHistories={chatHistories}
          setChatHistories={setChatHistories}
        />
      </div>

      {/* ─── EXPORT MODAL ─── */}
      {showExportModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease',
        }} onClick={() => { setShowExportModal(false); setCopied(false); }}>
          <div
            style={{
              background: '#131c2e', border: '1px solid #253346',
              borderRadius: 18, width: 500, maxWidth: '90vw',
              padding: 32, animation: 'slideUp 0.3s ease',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 4px', fontSize: 19, fontWeight: 700, color: '#f1f5f9' }}>
              Export your brief
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              Add your details, then copy the formatted brief to paste into an email, Slack, or doc.
              {progress.pct < 100 && ` (${progress.total - progress.done} fields still empty)`}
            </p>

            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 5 }}>Your Name</label>
                <input value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="e.g. Alex Kim"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid #253346', background: '#0d1525',
                    color: '#e2e8f0', fontSize: 14, fontFamily: 'inherit',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 5 }}>Project Name</label>
                <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Kotonoha"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid #253346', background: '#0d1525',
                    color: '#e2e8f0', fontSize: 14, fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Preview */}
            <div style={{
              padding: 16, borderRadius: 10,
              background: '#0b1121', border: '1px solid #1a2536',
              maxHeight: 220, overflowY: 'auto', marginBottom: 20,
            }}>
              <pre style={{
                margin: 0, fontSize: 11.5, color: '#8896a8', lineHeight: 1.6,
                whiteSpace: 'pre-wrap', fontFamily: "'JetBrains Mono', monospace",
              }}>
                {generateBriefText(formData, projectName, senderName, activeSections)}
              </pre>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowExportModal(false); setCopied(false); }}
                style={{
                  padding: '10px 20px', border: '1px solid #253346', borderRadius: 10,
                  background: 'transparent', color: '#94a3b8', fontSize: 13,
                  cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit',
                }}
              >Close</button>
              <button
                onClick={handleDownload}
                style={{
                  padding: '10px 20px', border: '1px solid #253346', borderRadius: 10,
                  background: 'transparent', color: '#e2e8f0', fontSize: 13,
                  cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >⬇  Download .txt</button>
              <button
                onClick={handleCopy}
                style={{
                  padding: '10px 28px', border: 'none', borderRadius: 10,
                  background: copied
                    ? 'linear-gradient(135deg, #22c55e, #10b981)'
                    : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.3s ease',
                  minWidth: 160,
                }}
              >
                {copied ? '✓  Copied!' : '📋  Copy to clipboard'}
              </button>
            </div>

            {copied && (
              <div style={{
                marginTop: 16, padding: '12px 16px', borderRadius: 10,
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                fontSize: 13, color: '#4ade80', lineHeight: 1.5,
                animation: 'fadeIn 0.3s ease',
              }}>
                Now paste it into an email, Slack message, or Google Doc and send it over!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
