'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AudioManager } from '../lib/audio';
import { GeminiLiveClient } from '../lib/gemini-live';

/* ───────────────────────── SECTIONS ───────────────────────── */
const SECTIONS = [
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
];

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

function mergeChunks(current, incoming) {
  if (!current) return incoming;
  if (!incoming) return current;
  if (incoming === current || current.endsWith(incoming)) return current;
  if (incoming.startsWith(current)) return incoming;
  // Check for overlap
  const maxOverlap = Math.min(current.length, incoming.length);
  for (let i = maxOverlap; i > 0; i--) {
    if (current.slice(-i) === incoming.slice(0, i)) {
      return current + incoming.slice(i);
    }
  }
  return current + ' ' + incoming;
}

function generateBriefText(formData, projectName, senderName) {
  let t = `PROJECT COLLABORATION BRIEF\n${'═'.repeat(40)}\n`;
  if (projectName) t += `Project: ${projectName}\n`;
  if (senderName) t += `Submitted by: ${senderName}\n`;
  t += `Date: ${new Date().toLocaleDateString()}\n`;
  SECTIONS.forEach(s => {
    t += `\n${'─'.repeat(40)}\n${s.icon} ${s.title.toUpperCase()}\n${'─'.repeat(40)}\n\n`;
    s.fields.forEach(f => {
      const val = formData[`${s.id}.${f.key}`];
      t += `${f.label}:\n${val || '(Not filled)'}\n\n`;
    });
  });
  return t;
}

/* ───────────────────────── VOICE TOOLS ───────────────────────── */
function buildVoiceSystemPrompt(section, formData) {
  const fieldStatus = section.fields.map(f => {
    const val = formData[`${section.id}.${f.key}`];
    return `- ${f.label}: ${val || '(empty)'} — Prompt: ${f.prompt}`;
  }).join('\n');

  return `You are a relaxed, friendly project brief coach having a casual voice conversation. You're helping the user fill out the "${section.title}" section of a project brief.

Current fields and their status:
${fieldStatus}

RULES:
- Talk like a friend, not a form. Be warm, casual, and encouraging.
- Listen to what the user says and extract useful information for the brief fields.
- When you hear something that answers a field (even roughly), call the save_field tool with a clean, polished version of what they said.
- You can fill multiple fields from a single rambling answer — extract everything useful.
- Don't demand perfect answers. If they say "it's like an app for tracking travel credit card points", that's a perfectly good one-liner — save it.
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
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) return;
    const chatRole = role === 'user' ? 'user' : 'ai';
    const otherRole = role === 'user' ? 'model' : 'user';

    setChatHistories(prev => {
      const msgs = [...(prev[section.id] || [])];
      const ownIdx = pendingTranscriptRef.current[role];

      // Close the other role's pending message
      pendingTranscriptRef.current[otherRole] = null;

      if (ownIdx != null && msgs[ownIdx] && msgs[ownIdx].role === chatRole) {
        // Merge into existing pending message
        const existing = msgs[ownIdx].text;
        msgs[ownIdx] = { ...msgs[ownIdx], text: mergeChunks(existing, normalized) };
        return { ...prev, [section.id]: msgs };
      }

      // Start a new message
      const newMsg = { role: chatRole, text: normalized, id: Date.now() + Math.random() };
      msgs.push(newMsg);
      pendingTranscriptRef.current[role] = msgs.length - 1;
      return { ...prev, [section.id]: msgs };
    });
  }, [section.id, setChatHistories]);

  const finalizeTurn = useCallback(() => {
    pendingTranscriptRef.current = { user: null, model: null };
  }, []);

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
        onTranscript: (role, text) => { appendTranscript(role, text); },
        onToolCall: ({ id, name, args }) => {
          if (name === 'save_field' && args.fieldKey && args.answer) {
            const fullKey = `${section.id}.${args.fieldKey}`;
            setFormData(prev => ({ ...prev, [fullKey]: args.answer }));
            addChatMessage('ai', `Saved **${args.fieldKey}**: "${args.answer}"`);
            client.sendToolResponse(id, name, { success: true });
          } else {
            client.sendToolResponse(id, name, { error: 'Unknown tool' });
          }
        },
        onTurnComplete: () => { finalizeTurn(); },
        onError: (err) => {
          console.error('[Voice]', err);
          setVoiceActive(false);
          setVoiceConnecting(false);
          addChatMessage('ai', 'Voice connection lost. Tap the mic to try again.');
        },
        onConnectionChange: (connected) => {
          if (connected) {
            setVoiceConnecting(false);
            setVoiceActive(true);
          }
        },
      });

      geminiClientRef.current = client;
      client.connect();

      // Start mic capture after a brief delay for setup
      await new Promise(r => setTimeout(r, 500));
      await audioManager.startCapture((pcmData) => {
        client.sendAudio(pcmData);
      });

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

    // Save empty/skip marker so we advance past this field
    setFormData(prev => ({ ...prev, [`${section.id}.${field.key}`]: '(Skipped)' }));
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
            const filled = !!formData[`${section.id}.${f.key}`];
            const isCurrent = i === getCurrentFieldIndex() && !allDone;
            return (
              <span key={f.key} style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 20,
                background: filled ? 'rgba(34,197,94,0.12)' : isCurrent ? 'rgba(59,130,246,0.12)' : '#131c2e',
                color: filled ? '#4ade80' : isCurrent ? '#60a5fa' : '#475569',
                border: isCurrent ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                fontWeight: isCurrent ? 600 : 400,
              }}>{filled && '✓ '}{f.label}</span>
            );
          })}
        </div>
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

/* ───────────────────────── MAIN APP ───────────────────────── */
const STORAGE_KEY = 'briefbuilder_state';

function loadSavedState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(formData, chatHistories, senderName, projectName) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, chatHistories, senderName, projectName }));
  } catch { /* storage full or unavailable */ }
}

export default function BriefBuilder() {
  const [activeSection, setActiveSection] = useState(0);
  const [formData, setFormData] = useState(() => loadSavedState()?.formData ?? {});
  const [chatHistories, setChatHistories] = useState(() => loadSavedState()?.chatHistories ?? {});
  const [showExportModal, setShowExportModal] = useState(false);
  const [senderName, setSenderName] = useState(() => loadSavedState()?.senderName ?? '');
  const [projectName, setProjectName] = useState(() => loadSavedState()?.projectName ?? '');
  const [copied, setCopied] = useState(false);

  // Persist state to localStorage on changes
  useEffect(() => {
    saveState(formData, chatHistories, senderName, projectName);
  }, [formData, chatHistories, senderName, projectName]);

  const progress = (() => {
    let done = 0, total = 0;
    SECTIONS.forEach(s => s.fields.forEach(f => {
      total++;
      if (formData[`${s.id}.${f.key}`]) done++;
    }));
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  })();

  const handleCopy = async () => {
    const briefText = generateBriefText(formData, projectName, senderName);
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

  const handleDownload = () => {
    const briefText = generateBriefText(formData, projectName, senderName);
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
          {SECTIONS.map((s, i) => {
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
        </div>
      </div>

      {/* ─── MAIN CHAT ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <SectionChat
          key={SECTIONS[activeSection].id}
          section={SECTIONS[activeSection]}
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
                {generateBriefText(formData, projectName, senderName)}
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
