const GEMINI_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';
const GEMINI_WS_BASE = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

export class GeminiLiveClient {
  constructor(config) {
    this.config = config;
    this.ws = null;
    this.connected = false;
    this.setupComplete = false;
  }

  connect() {
    if (this.ws) this.disconnect();

    const url = `${GEMINI_WS_BASE}?key=${this.config.token}`;
    this.ws = new WebSocket(url);
    this.setupComplete = false;

    this.ws.onopen = () => {
      this.connected = true;
      this.config.onConnectionChange(true);
      this.sendSetup();
    };

    this.ws.onmessage = (event) => { this.handleMessage(event.data); };
    this.ws.onerror = () => { this.config.onError(new Error('WebSocket connection error')); };
    this.ws.onclose = (event) => {
      const wasActive = this.connected && this.setupComplete;
      this.connected = false;
      this.setupComplete = false;
      this.config.onConnectionChange(false);
      if (wasActive && event.code !== 1000) {
        this.config.onError(new Error('Connection lost'));
      }
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.connected = false;
    this.setupComplete = false;
    this.config.onConnectionChange(false);
  }

  sendAudio(pcmData) {
    if (!this.ws || !this.setupComplete) return;
    this.ws.send(JSON.stringify({
      realtimeInput: { audio: { data: arrayBufferToBase64(pcmData), mimeType: 'audio/pcm' } },
    }));
  }

  sendToolResponse(functionCallId, functionName, result) {
    if (!this.ws || !this.connected) return;
    this.ws.send(JSON.stringify({
      toolResponse: { functionResponses: [{ name: functionName, id: functionCallId, response: { result } }] },
    }));
  }

  isActive() { return this.connected && this.setupComplete; }

  sendSetup() {
    const msg = {
      setup: {
        model: `models/${GEMINI_MODEL}`,
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
        systemInstruction: { parts: [{ text: this.config.systemPrompt }] },
        tools: this.config.tools,
        realtimeInputConfig: {
          automaticActivityDetection: {
            disabled: false,
            startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
            endOfSpeechSensitivity: 'END_SENSITIVITY_LOW',
            prefixPaddingMs: 500,
            silenceDurationMs: 1000,
          },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
    };
    this.ws?.send(JSON.stringify(msg));
  }

  async handleMessage(raw) {
    let text;
    if (typeof raw === 'string') { text = raw; }
    else if (raw instanceof Blob) { text = await raw.text(); }
    else if (raw instanceof ArrayBuffer) { text = new TextDecoder().decode(raw); }
    else return;

    let msg;
    try { msg = JSON.parse(text); } catch { return; }

    if (msg.setupComplete !== undefined) {
      this.setupComplete = true;
      return;
    }

    if (msg.serverContent) {
      if (msg.serverContent.modelTurn?.parts) {
        for (const part of msg.serverContent.modelTurn.parts) {
          if (part.inlineData?.data) {
            this.config.onAudioResponse(base64ToArrayBuffer(part.inlineData.data));
          }
        }
      }
      if (msg.serverContent.inputTranscription?.text) {
        this.config.onTranscript('user', msg.serverContent.inputTranscription.text);
      }
      if (msg.serverContent.outputTranscription?.text) {
        this.config.onTranscript('model', msg.serverContent.outputTranscription.text);
      }
      if (msg.serverContent.turnComplete) {
        this.config.onTurnComplete?.();
      }
      return;
    }

    if (msg.toolCall) {
      if (msg.toolCall.functionCalls) {
        for (const call of msg.toolCall.functionCalls) {
          this.config.onToolCall({ id: call.id, name: call.name, args: call.args || {} });
        }
      }
      return;
    }
  }
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) { bytes[i] = binary.charCodeAt(i); }
  return bytes.buffer;
}
