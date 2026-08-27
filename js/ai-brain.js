/* ============ SMART AI BRAIN & CONVERSATIONAL KNOWLEDGE ENGINE ============ */
var AIBrain = {
  // Check if text is written in Hindi or Hinglish
  detectLanguage(text = '') {
    const t = text.toLowerCase();
    const hindiRegex = /[\u0900-\u097F]/;
    if (hindiRegex.test(text)) return 'hindi';

    const hinglishKeywords = [
      'kya', 'kaise', 'batao', 'samjhao', 'kare', 'karna', 'kariye', 'chahiye',
      'hai', 'hain', 'ho', 'mera', 'meri', 'mere', 'mujhe', 'hum', 'apna',
      'apni', 'aap', 'tum', 'sab', 'kuch', 'bhi', 'aur', 'par', 'se', 'ko',
      'ke', 'ki', 'ka', 'karo', 'kar do', 'bana', 'banaye', 'banau', 'accha',
      'badhiya', 'shukriya', 'dhanyawad', 'namaste', 'bhai', 'yaar', 'bolo',
      'bataiye', 'sikhao', 'madad', 'help karo', 'hinglish', 'me'
    ];
    
    const words = t.split(/\s+/);
    const matchCount = words.filter(w => hinglishKeywords.includes(w)).length;
    return matchCount > 0 || t.includes('hinglish') ? 'hinglish' : 'english';
  },

  // Main chat response generator
  generateChatResponse(persona, messages) {
    const lastUserMsg = messages[messages.length - 1]?.content?.trim() || '';
    const lower = lastUserMsg.toLowerCase();
    const lang = this.detectLanguage(lastUserMsg);

    // 1. Language request ("hinglish me samjhao", "hindi me batao", "explain in english")
    if (lower.includes('hinglish me') || lower.includes('in hinglish') || (lower.includes('hinglish') && lower.includes('samjha'))) {
      return this.smartHubOverview('hinglish');
    }
    if (lower.includes('hindi me') || lower.includes('in hindi') || (lower.includes('hindi') && lower.includes('samjha'))) {
      return this.smartHubOverview('hindi');
    }

    // 2. Greetings
    if (/^(hi|hello|hey|namaste|salaam|good\s*(morning|afternoon|evening)|wassup|what'?s\s*up|yo|hola|kemcho|pranam)\b/i.test(lower)) {
      return this.getGreeting(persona, lang, lastUserMsg);
    }

    // 3. How Are You
    if (/(how\s*are\s*you|kaise\s*ho|kya\s*haal|how'?s\s*it\s*going|sab\s*badhiya|kaisa\s*hai)/i.test(lower)) {
      if (lang === 'hindi' || lang === 'hinglish') {
        return `Main bilkul badhiya hoon, poochne ke liye shukriya! 😊\n\n**Smart AI Hub** 100% active hai aur aapke resume building, academic essays ya coding me help karne ke liye ready hai. Aaj aap kis tool par kaam karna chahte hain?`;
      }
      return `I'm doing fantastic, thank you for asking! 😊 I'm fully ready to help you navigate Smart AI Hub, craft resumes, write academic essays, or solve any questions. How can I assist you right now?`;
    }

    // 4. Platform Overview / All Tools
    if (/(all tools|saare tools|sare tool|kitne tool|tools list|kya kya hai|kya banata hai|website kya hai|smart ai hub kya hai|overview|features)/i.test(lower)) {
      return this.smartHubOverview(lang);
    }

    // 5. Tool Specific: Resume Designer
    if (/(resume|cv\b|ats\s*resume|resume\s*template|resume\s*kaise|biodata)/i.test(lower)) {
      return this.getResumeGuide(lang);
    }

    // 6. Tool Specific: Academic Essay Writer
    if (/(essay|academic|apa\b|mla\b|thesis|paper\s*writer|essay\s*kaise)/i.test(lower)) {
      return this.getEssayGuide(lang);
    }

    // 7. Pricing & Free Plan / Ads
    if (/(pricing|price|cost|free\s*tier|free\s*hai|paid\s*hai|adsense|upgrade)/i.test(lower)) {
      return this.getPricingGuide(lang);
    }

    // 8. Contact / Charni Web Solution / Support
    if (/(contact|support|email|charni|charni\s*web\s*solution|developer|owner|founder)/i.test(lower)) {
      return this.getContactGuide(lang);
    }

    // 9. How to export PDF / TXT / Copy
    if (/(pdf|download|export|txt|copy|print)/i.test(lower)) {
      return this.getExportGuide(lang);
    }

    // 10. Technical Coding (Python, JS, React, SQL)
    if (/(python|javascript|react|code|coding|sql|debug|algorithm)/i.test(lower)) {
      return this.getCodingSolution(lastUserMsg, persona, lang);
    }

    // 11. Dynamic General Conversational Response
    return this.getDynamicGeneralResponse(persona, lastUserMsg, lang);
  },

  // 1. SMART AI HUB MASTER OVERVIEW
  smartHubOverview(lang) {
    if (lang === 'hindi' || lang === 'hinglish') {
      return `### 🌟 Smart AI Hub ke baare me poori jaankari!

**Smart AI Hub** ek modern, 100% free AI productivity aur career platform hai (developed by **Charni Web Solution**). Yahan aapko **3 core powerful tools** milte hain:

---

#### 🛠️ Smart AI Hub ke 3 Core Tools:

1. 📄 **Pro Resume Designer**: 6 Executive ATS Templates (Standard ATS, Modern Tech, Executive Pro, Creative Visual, Harvard Academic, Minimalist), Photo Upload, Live Text Inline Editing, Custom Colors, Google Fonts, Role Presets aur HD Vector A4 PDF download support ke sath.
2. 🎓 **Academic Essay Writer**: APA 7th / MLA 9th format, live word counter, single/double 2.0 spacing aur structured academic arguments ke sath scholarly essay generator.
3. 🤖 **AI Chat Assistant**: 4 Personas (⚡ Concise Assistant, 🎯 Productivity Coach, 💻 Code Genius, 💡 Creative Brainstormer) ke sath kisi bhi sawal, coding doubt ya career guidance ka turant answer in **Hindi, Hinglish ya English**!

---

💡 **Aap kis tool ke baare me detail me janna chahte hain ya kya banana chahte hain? Mujhe batayein, main step-by-step guide karunga!**`;
    }

    return `### 🌟 Welcome to Smart AI Hub!

**Smart AI Hub** is a clean, 100% free AI productivity workspace (developed by **Charni Web Solution**) engineered for students, job applicants, and professionals.

---

#### 🛠️ Overview of Our 3 Core AI Tools:

1. 📄 **Pro Resume Designer**: ATS executive resumes with 6 templates, photo upload, live inline editing, accent colors, and vector A4 PDF export.
2. 🎓 **Academic Essay Writer**: APA/MLA scholarly essays with word counts, spacing switchers, and thesis formatting.
3. 🤖 **AI Chat Assistant**: Multi-persona assistant (Concise, Productivity, Code, Creative) for instant problem-solving and coding help.

How can I help you explore or generate today?`;
  },

  // 2. GREETING
  getGreeting(persona, lang, userMsg) {
    if (lang === 'hindi' || lang === 'hinglish') {
      return `### 👋 Namaste! Main hoon aapka Smart AI Hub Assistant.\n\nMain is website (**Smart AI Hub**) ka official AI guide hoon. Main aapki madad kar sakta hoon:\n- 📄 **ATS-Friendly Resume Wizard** banane aur A4 PDF export karne me\n- 🎓 **Academic Essay (APA/MLA)** likhne me\n- 💻 **Coding, Debugging & Tech Solutions** solve karne me\n- 💡 Career & Productivity advice me\n\nAaj aap kya banana ya seekhna chahte hain?`;
    }
    return `### 👋 Hello! I'm your Smart AI Hub Assistant.\n\nI am the dedicated AI guide for **Smart AI Hub**. I can help you with:\n- 📄 Building **ATS Resumes & Exporting Vector PDFs**\n- 🎓 Writing **Academic Essays (APA/MLA Formatting)**\n- 💻 Solving **Coding & Technical Architecture** questions\n\nWhat tool or project are you working on today?`;
  },

  // 3. RESUME BUILDER GUIDE
  getResumeGuide(lang) {
    if (lang === 'hindi' || lang === 'hinglish') {
      return `### 📄 ATS-Friendly Pro Resume Designer Guide
      
Smart AI Hub ka **Pro Resume Designer** ek true **12-Step Resume Creation Wizard** hai jo ATS systems ke liye standard clean layouts provide karta hai!

#### ⭐ Top Features:
1. **⭐ ATS-Friendly Single-Column Layout**: Clean centered header, right-aligned dates/locations, clean horizontal section dividers, aur bullet points jo automated screening me easily parse hote hain.
2. **🎓 Fresher Mode**: College students aur freshers ke liye bina kisi fake company ke Projects aur Education ko top priority deta hai.
3. **✨ Anti-Fabrication AI**: AI kabhi koi fake company ya metrics invent nahi karta — sirf aapke confirmed facts ko polish karta hai.
4. **🎨 6 Templates**: Standard ATS, Modern Two-Column, Executive Pro, Creative Accent, Harvard Academic, Minimalist Clean.
5. **📥 Vector PDF Export**: Text-selectable clean PDF export ATS parsers ke liye.

👉 **Kaise Use Karein?** **Tools &rarr; Pro Resume Designer** me jayein aur Step 1 se Step 12 tak complete karein!`;
    }
    return `### 📄 ATS-Friendly Pro Resume Designer Guide

The **Pro Resume Designer** features a true **12-Step Step-by-Step Resume Wizard** with the **Single-Column ATS-Friendly Layout** as its primary default template.

#### Key Capabilities:
- **⭐ ATS-Friendly Recruiter Standard**: Clean header, standardized headings, and parseable typography.
- **🎓 Fresher Mode**: Seamlessly skips experience and highlights Projects, Education, and Skills.
- **✨ Strict Anti-Fabrication AI**: AI polishes user words without inventing companies or metrics.
- **📥 HD Vector A4 PDF Export**: Clean text-selectable PDF downloads.
- **🎨 6 Executive Layouts**: Standard ATS, Modern Two-Column, Executive Pro, Creative Accent, Harvard Classic, Minimalist Clean.

Open **Tools &rarr; Pro Resume Designer** to build yours!`;
  },

  // 4. ESSAY GUIDE
  getEssayGuide(lang) {
    if (lang === 'hindi' || lang === 'hinglish') {
      return `### 🎓 Academic Essay Writer Guide

Students aur researchers ke liye designed:
- **Formats**: APA 7th Edition, MLA 9th Edition, aur Chicago styles support.
- **Spacing Switcher**: 1-click me Single ya Double (2.0) spacing toggle karein.
- **Word Count & Citations**: Real-time word count aur ready bibliography reference section.

👉 **Tools &rarr; Academic Essay Writer** par jayein aur apna topic likh kar generate karein!`;
    }
    return `### 🎓 Academic Essay Writer Guide\n\nDraft structured academic papers with APA/MLA formatting, live word counters, double-spacing toggles, and bibliography references.\n\nOpen **Tools &rarr; Academic Essay Writer** to start!`;
  },

  // 5. PRICING & FREE PLAN GUIDE
  getPricingGuide(lang) {
    if (lang === 'hindi' || lang === 'hinglish') {
      return `### ✨ Smart AI Hub — 100% Free & Unlimited

Smart AI Hub sabhi job applicants, students aur professionals ke liye **100% Free** hai:

- 🌟 **Zero Cost (₹0 Forever)**: Yahan koi paid Pro subscription, monthly charge ya credit card ki zaroorat nahi hai.
- 🎨 **All 6 ATS Resume Templates Unlocked**: Standard ATS, Modern Tech, Executive Pro, Creative Visual, Harvard Academic, Minimalist — sabhi 100% free hain!
- 📄 **Watermark-Free HD Vector PDF Export**: Clean, professional A4 PDFs bina kisi watermark ke download karein.
- 🎓 **Academic Essay Writer**: APA 7th, MLA 9th format & spacing switchers completely free.
- 💬 **24/7 AI Chat Assistant**: Unlimited chats & coding assistance bina kisi limit ke.`;
    }
    return `### ✨ Smart AI Hub — 100% Free & Unlimited\n\nSmart AI Hub is completely free and unlimited for all users! All 3 AI tools (Pro Resume Designer, Academic Essay Writer, AI Chat Assistant), 6 executive resume templates, and watermark-free HD vector PDF exports are 100% unlocked at zero cost.`;
  },

  // 12. CONTACT GUIDE
  getContactGuide(lang) {
    if (lang === 'hindi' || lang === 'hinglish') {
      return `### 📬 Contact & Support Info

Smart AI Hub ko **Charni Web Solution** ne develop kiya hai:
- 📧 **Official Support Email**: \`charniwebsolution@gmail.com\`
- ⏱️ **Response Time**: 24 se 48 hours ke andar reply milta hai.
- 📝 **Contact Form**: Website ke **Contact** tab par jakar aap apna Name, Email, Subject aur Message bhej sakte hain. Message turant backend par log hokar support team ko forward ho jata hai!`;
    }
    return `### 📬 Contact & Support\n\n- **Developer**: Charni Web Solution\n- **Email**: \`charniwebsolution@gmail.com\`\n- **Response Time**: 24–48 hours\n- Use the **Contact** page to submit inquiries directly.`;
  },

  // 13. EXPORT GUIDE
  getExportGuide(lang) {
    if (lang === 'hindi' || lang === 'hinglish') {
      return `### 📥 Document Export & Download Guide

Smart AI Hub me output save karne ke 3 aasan tarike hain:
1. **📋 1-Click Copy**: Output preview ke header me 'Copy' button dabayein.
2. **📥 HD Vector A4 PDF**: 'PDF' button dabate hi resume, essay ya cover letter standard A4 vector PDF format me download ho jata hai.
3. **📄 TXT Export**: Raw text file download karne ke liye 'TXT' button dabayein.
4. **📜 Saved History**: Header me Clock icon (History) par click karke aap apni pichli 30 generations kabhi bhi reload kar sakte hain!`;
    }
    return `### 📥 Export & Download Guide\n\n- **Copy**: 1-click copy to clipboard.\n- **PDF**: High-definition A4 Vector PDF export.\n- **TXT**: Plain-text download.\n- **History**: View and reload past 30 generations via the History drawer icon in the header.`;
  },

  // 14. CODING SOLUTION
  getCodingSolution(prompt, persona, lang) {
    const isHinglish = lang === 'hindi' || lang === 'hinglish';
    const p = prompt.toLowerCase();

    if (p.includes('prime')) {
      return `### 🐍 Python: Prime Number Check (Optimized $\\mathcal{O}(\\sqrt{n})$)\n\n\`\`\`python\nimport math\n\ndef is_prime(n: int) -> bool:\n    if n <= 1:\n        return False\n    if n <= 3:\n        return True\n    if n % 2 == 0 or n % 3 == 0:\n        return False\n    for i in range(5, int(math.isqrt(n)) + 1, 6):\n        if n % i == 0 or n % (i + 2) == 0:\n            return False\n    return True\n\n# Test Cases\nprint(is_prime(29)) # Output: True\n\`\`\`\n\n${isHinglish ? '💡 **Samjhiye**: Yeh function $\\mathcal{O}(\\sqrt{n})$ time complexity me prime check karta hai.' : '💡 **Note**: Runs in $\\mathcal{O}(\\sqrt{n})$ time using 6k ± 1 optimization.'}`;
    }

    if (p.includes('reverse')) {
      return `### 🐍 Python: Reverse String or List\n\n\`\`\`python\ndef reverse_string(text: str) -> str:\n    return text[::-1]\n\nprint(reverse_string("Smart AI Hub")) # Output: buH IA tramS\n\`\`\`\n\n${isHinglish ? '💡 Python me slice notation `[::-1]` sabse fast aur memory efficient tarika hai.' : '💡 Slicing `[::-1]` is the fastest, most pythonic approach.'}`;
    }

    return `### 💻 Code Solution (${persona})\n\n\`\`\`javascript\n// Solution for: ${prompt.substring(0, 50)}\nfunction executeTask(input) {\n  console.log('Processing:', input);\n  return { success: true, timestamp: Date.now() };\n}\n\`\`\`\n\n${isHinglish ? 'Aap is code ko apne project me use kar sakte hain. Kisi aur language (Python/React/SQL) me code chahiye to batayein!' : 'Let me know if you need this in Python, React, or SQL!'}`;
  },

  // 15. DYNAMIC GENERAL CONVERSATIONAL RESPONSE
  getDynamicGeneralResponse(persona, userMsg, lang) {
    const topic = userMsg.replace(/please|tell me|explain|how to|what is|write a|give me|can you|kya hai|kaise kare|samjhao|batao/gi, '').trim() || 'your inquiry';
    const capTopic = topic.charAt(0).toUpperCase() + topic.slice(1);

    if (lang === 'hindi' || lang === 'hinglish') {
      return `### 💡 Smart AI Hub Guide: ${capTopic}

Aapke sawal **"${userMsg}"** ke baare me yeh key points hain:

1. **Core Understanding**: ${capTopic} ko sahi tarike se execute karne ke liye structured planning aur sahi AI tools ka use zaroori hai.
2. **Best Strategy**: Pehle basic outline taiyar karein, phir Smart AI Hub ke core tools (Pro Resume Designer, Academic Essay Writer, AI Chat Assistant) ki madad se content ko refine karein.
3. **Action Steps**:
   - Apne specific goals decide karein
   - Website ke relevant tool par jakar prompt generate karein
   - Output ko Live Edit karke customize karein aur PDF me export karein

👉 **Aap Smart AI Hub ke kisi tool ya feature ke baare me kuch aur poochna chahte hain? Main aapki poori madad karunga!**`;
    }

    return `### 💡 Smart AI Hub Guide: ${capTopic}

Regarding **"${userMsg}"**:

1. **Overview**: Achieving high-impact results with **${topic}** starts with clear objectives and structured execution.
2. **Recommended Workflow**:
   - Define your core criteria and message.
   - Leverage the relevant tool in Smart AI Hub (Pro Resume Designer, Academic Essay Writer, AI Chat Assistant).
   - Customize with Live Edit and export directly to PDF or TXT.
3. **Next Steps**: Let me know if you would like me to guide you through any of our 3 core AI productivity tools!`;
  }
};

if (typeof window !== 'undefined') {
  window.AIBrain = AIBrain;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIBrain;
}
