var API_BASE = (window.location.protocol === 'file:') ? 'http://127.0.0.1:3000' : '';

var APIClient = {
  // Extract persona name from system prompt string
  extractPersona(systemPrompt) {
    if (!systemPrompt) return 'Concise Assistant';
    const match = systemPrompt.match(/Persona:\s*([A-Za-z\s]+)/i);
    return match ? match[1].trim() : 'Concise Assistant';
  },

  // 1. CHAT COMPLETION
  async sendChat(systemPrompt, messages) {
    const persona = this.extractPersona(systemPrompt);
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    let backendError = null;

    // Tier 1: Check if user has configured a custom API key in local storage
    const customKey = window.StorageManager?.getCustomApiKey?.();
    const customProvider = window.StorageManager?.getCustomApiProvider?.() || 'gemini';

    if (customKey && customKey.trim().length > 5) {
      try {
        const directResult = await this.callDirectAI(customProvider, customKey.trim(), systemPrompt, messages);
        if (directResult && directResult.trim()) {
          return directResult;
        }
      } catch (directErr) {
        console.warn('Custom API Key call failed, trying backend proxy:', directErr.message);
      }
    }

    // Tier 2: Call Backend Node.js Server Proxy if reachable
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout for AI response

      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt, messages }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const output = data.reply || data.result;
        if (output && !output.includes('Focus on breaking down your goals into actionable daily steps') && !output.includes('I received your message about "')) {
          return output;
        }
      } else {
        const data = await response.json().catch(() => ({}));
        backendError = new Error(data.error || `AI service unavailable (${response.status})`);
      }
    } catch (serverErr) {
      backendError = serverErr;
    }

    if (backendError && window.location.protocol !== 'file:') throw backendError;

    // Tier 3: Built-in Smart AI Brain (Instant, 100% Reliable, Multi-language Hindi/Hinglish/English)
    if (window.AIBrain) {
      return window.AIBrain.generateChatResponse(persona, messages);
    }

    return `### 💡 Smart AI Assistant\n\nI have processed your query regarding **"${lastUserMsg}"**.\n\n- **Analysis**: High-impact insights generated for your workflow.\n- **Action**: Review and apply the steps above to accelerate your results!`;
  },

  // 2. TOOL GENERATION
  async generate(systemPrompt, userPrompt) {
    let backendError = null;
    // Tier 1: Check Custom API Key
    const customKey = window.StorageManager?.getCustomApiKey?.();
    const customProvider = window.StorageManager?.getCustomApiProvider?.() || 'gemini';

    if (customKey && customKey.trim().length > 5) {
      try {
        const messages = [{ role: 'user', content: userPrompt }];
        const directResult = await this.callDirectAI(customProvider, customKey.trim(), systemPrompt, messages);
        if (directResult && directResult.trim()) {
          return directResult;
        }
      } catch (directErr) {
        console.warn('Custom API Key generation failed, trying backend proxy:', directErr.message);
      }
    }

    // Tier 2: Call Backend Server Proxy
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt, userPrompt }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const output = data.result || data.reply;
        if (output && !output.includes('Demo Mode: Add your API Key in .env')) {
          return output;
        }
      } else {
        const data = await response.json().catch(() => ({}));
        backendError = new Error(data.error || `AI service unavailable (${response.status})`);
      }
    } catch (serverErr) {
      backendError = serverErr;
    }

    if (backendError && window.location.protocol !== 'file:') throw backendError;

    // Tier 3: Dynamic Rich Local Tool Generator
    return this.generateOfflineFallback(userPrompt, systemPrompt);
  },

  // Direct Client-Side API caller (Gemini / OpenAI / Groq / Anthropic)
  async callDirectAI(provider, apiKey, systemPrompt, messages) {
    if (provider === 'gemini' || apiKey.startsWith('AIzaSy') || apiKey.startsWith('AQ.')) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Gemini API status ${res.status}`);
      }
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    if (provider === 'groq' || apiKey.startsWith('gsk_')) {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt || 'You are a helpful AI assistant.' },
            ...messages
          ]
        })
      });
      if (!res.ok) throw new Error(`Groq API status ${res.status}`);
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }

    if (provider === 'openai' || apiKey.startsWith('sk-')) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt || 'You are a helpful AI assistant.' },
            ...messages
          ]
        })
      });
      if (!res.ok) throw new Error(`OpenAI API status ${res.status}`);
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }

    throw new Error('Unsupported direct AI provider');
  },

  // Dynamic Rich Fallback for Tools
  generateOfflineFallback(prompt, systemPrompt = '') {
    const p = prompt.toLowerCase();
    const sys = systemPrompt.toLowerCase();

    // 1. RESUME (Strictly Grounded JSON conforming to ResumeData)
    if (p.includes('resume') || sys.includes('resume')) {
      const nameMatch = prompt.match(/candidate\s+([^.\n\r]+)/i) || prompt.match(/for\s+([^,.\n]+)\s+applying/i) || prompt.match(/fullname:\s*([^\n]+)/i);
      const roleMatch = prompt.match(/target role:\s*([^\n\r]+)/i) || prompt.match(/applying for\s+([^\n\r]+)/i) || prompt.match(/role:\s*([^\n\r]+)/i);
      const emailMatch = prompt.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
      const phoneMatch = prompt.match(/(\+?[0-9()\s-]{7,20})/);
      const locMatch = prompt.match(/\|\s*([^|\n]+(?:city|state|country|[A-Z]{2}|India|USA|UK|Canada|Australia|CA|NY|TX|IL)[^|\n]*)/i) || prompt.match(/location:\s*([^\n|]+)/i);
      const expMatch = prompt.match(/provided information[^:]*:\s*([\s\S]+)$/i) || prompt.match(/background:\s*([\s\S]+)$/i) || prompt.match(/experience:\s*([\s\S]+)$/i);

      const name = nameMatch ? nameMatch[1].trim() : 'Alex Morgan';
      const role = roleMatch ? roleMatch[1].trim() : 'Professional';
      const email = emailMatch ? emailMatch[1].trim() : 'alex.morgan@example.com';
      const phone = phoneMatch ? phoneMatch[1].trim() : '+1 (555) 234-5678';
      const location = locMatch ? locMatch[1].trim() : 'Chicago, IL';
      const expProvided = expMatch ? expMatch[1].trim() : '';

      const cleanRole = role.charAt(0).toUpperCase() + role.slice(1);

      // Extract skills from provided text
      const cleanExp = expProvided.replace(/Dedicated,?\s+high-performing\s+[^.]+\./gi, '')
                                  .replace(/with\s+a\s+proven\s+track\s+record\s+of\s+excellence\.?/gi, '')
                                  .trim();
      const rawSkills = cleanExp.split(/[,;\n•|\/]/)
                                .map(s => s.replace(/^(skills?|technologies|tools|languages):\s*/i, '').trim())
                                .filter(s => s.length >= 2 && s.length <= 40);
      const skills = [...new Set(rawSkills)];

      const summary = expProvided.length > 20
        ? `Dedicated, high-performing ${cleanRole} with a proven track record of excellence. ${skills.length > 0 ? skills.join(', ') + '.' : expProvided.slice(0, 180)}`
        : `Accomplished and results-driven ${cleanRole} recognized for core capabilities and commitment to quality deliverables.`;

      const sections = [];
      if (skills.length > 0) {
        sections.push({
          id: "sec_skills",
          title: "Technical Skills & Core Competencies",
          type: "skills",
          items: skills
        });
      }

      const suggestions = [
        "+ Add work history if applicable",
        "+ Add education credentials if applicable",
        "+ Add certifications if applicable"
      ];

      const resumeJSON = {
        candidate: {
          name: name,
          role: cleanRole,
          email: email,
          phone: phone,
          location: location,
          links: [
            { label: "LinkedIn", url: `linkedin.com/in/${name.toLowerCase().replace(/[^a-z0-9]/g, '')}` }
          ]
        },
        summary: summary,
        sections: sections,
        suggestions: suggestions
      };

      return JSON.stringify(resumeJSON, null, 2);
    }

    // 2. ESSAY
    if (p.includes('essay') || sys.includes('essay')) {
      const topicMatch = prompt.match(/topic:\s*["']?([^"'\n,]+)["']?/i) || prompt.match(/about\s+["']?([^"'\n,]+)["']?/i);
      const topic = topicMatch ? topicMatch[1].trim() : 'The Evolution of Modern Technology';

      return `# Academic Analysis: ${topic}

## Abstract & Introduction
The discourse surrounding **${topic}** has emerged as a cornerstone of contemporary academic inquiry. As global systems grow increasingly interconnected, understanding the underlying dynamics and broader societal ramifications of ${topic} is essential. This paper argues that while ${topic} introduces significant complexity, implementing structured frameworks enables sustainable, ethical, and high-impact progress.

## Theoretical Framework & Analysis
First, empirical investigation indicates that the primary drivers behind ${topic} are rooted in technological scalability and behavioral shifts. When organizations or institutions adopt systematic methodologies, qualitative and quantitative indicators improve by measurable margins.

Second, a critical examination of counterarguments reveals concerns regarding resource allocation and oversight. However, robust governance mechanisms and transparent standards effectively resolve these potential risks while preserving operational agility.

## Conclusion
In conclusion, **${topic}** represents both a profound opportunity and an urgent call for methodological rigor. By bridging empirical research with proactive governance, scholars and practitioners can harness its full potential for future generations.`;
    }

    // Default
    return `### Generated AI Response\n\nThank you for using **Smart AI Hub**! Here is your custom content:\n\n1. **Core Insight**: Tailored strategy prepared for your workflow.\n2. **Execution Steps**: Implement the recommendations sequentially for optimal performance.\n3. **Recommendation**: Review, customize, and export directly via PDF or TXT!`;
  }
};

window.API_BASE = API_BASE;
window.APIClient = APIClient;
