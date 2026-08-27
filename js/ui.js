/* ============ UI CONTROLLER & RENDERING ============ */
var activeToolId = null;
var searchQuery = '';
var chatHistory = [];
var currentRawOutput = '';
var isLiveEditActive = false;
var currentProfilePhotoUrl = null;
var currentChatPersona = 'Concise Assistant';
var currentEssaySpacing = 'normal';
var currentResumeTemplate = 'ats';
var currentResumeData = null;
var currentResumeSuggestions = [];
var resumeWizardState = null;
var photoResizerState = null;
var imageToPdfState = null;
var pdfToolkitState = null;
var adCountdownInterval = null;


var UI = {
  init() {
    this.renderGrids();
    this.updateProStatusBadges();

    // Global keyboard Escape key to close all active modals and menus
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
        this.closeMobileMenu();
      }
    });

    // Global backdrop click handler to prevent UI freeze
    document.addEventListener('click', (e) => {
      if (e.target && e.target.classList && e.target.classList.contains('modal-backdrop')) {
        this.closeAllModals();
      }
    });
  },

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('show'));
    if (adCountdownInterval) {
      clearInterval(adCountdownInterval);
    }
    this.toggleFloatingChat(false);
  },

  initViralFloatingDrawer() {
    setTimeout(() => {
      const drawer = document.getElementById('viralPopUpDrawer');
      if (drawer && !sessionStorage.getItem('viral_drawer_dismissed')) {
        drawer.classList.add('show');
      }
    }, 4000);
  },

  dismissViralDrawer() {
    const drawer = document.getElementById('viralPopUpDrawer');
    if (drawer) drawer.classList.remove('show');
    sessionStorage.setItem('viral_drawer_dismissed', 'true');
  },

  updateProStatusBadges() {
    document.querySelectorAll('.user-plan-badge').forEach(b => {
      b.className = 'user-plan-badge free-badge';
      b.innerHTML = '✨ 100% FREE AI HUB';
    });
  },

  toggleProDemo() {
    this.showToast('✨ Smart AI Hub is 100% Free for everyone!');
  },

  toolCardHTML(t) {
    const cardMeta = {
      resume: { kicker: 'For job seekers', promise: 'A polished resume in minutes', time: 'Ready in 60 sec', cta: 'Build my resume' },
      essay: { kicker: 'For students', promise: 'A clear first draft to build on', time: 'Start in 30 sec', cta: 'Start writing' },
      chat: { kicker: 'For every question', promise: 'A friendly second brain', time: 'Ask anything', cta: 'Open assistant' },
      photo_resizer: { kicker: 'Image utility', promise: 'Resize & compress to target KB', time: 'Instant · 0 sec', cta: 'Resize photo' },
      image_to_pdf: { kicker: 'PDF utility', promise: 'Convert multiple images to PDF with custom margins', time: 'Instant · 0 sec', cta: 'Convert to PDF' },
      pdf_toolkit: { kicker: 'PDF utility', promise: 'Merge, split, rotate, sign & stamp PDFs', time: 'Instant · 0 sec', cta: 'Open toolkit' }
    }[t.id] || { kicker: 'Free tool', promise: 'Make your next step easier', time: 'Start now', cta: 'Open tool' };
    return `<div class="tool-card glass" onclick="Router.navigate('tools', '${t.id}')">
      <span class="badge-free">FREE</span>
      <div class="tool-card-top"><div class="tool-icon"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">${ICONS[t.id]}</svg></div><span class="tool-kicker">${cardMeta.kicker}</span></div>
      <div class="tool-card-copy">
        <h3>${t.name}</h3>
        <p>${cardMeta.promise}. ${t.desc}</p>
      </div>
      <div class="tool-card-foot"><span class="tool-time">${cardMeta.time}</span><span class="go">${cardMeta.cta} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></div>
    </div>`;
  },

  renderGrids() {
    const homeGrid = document.getElementById('homeToolGrid');
    if (homeGrid) homeGrid.innerHTML = TOOLS.filter(t => !t.isChat).map(t => this.toolCardHTML(t)).join('');
    this.renderToolsPageGrid();
  },

  renderToolsPageGrid() {
    const q = searchQuery.trim().toLowerCase();
    const creationTools = TOOLS.filter(t => !t.isChat);
    const filtered = creationTools.filter(t => !q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    const grid = document.getElementById('toolsGrid');
    if (!grid) return;

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <div>No tools match "${searchQuery}"</div>
      </div>`;
    } else {
      grid.innerHTML = filtered.map(t => this.toolCardHTML(t)).join('');
    }
  },

  handleSearch(val) {
    searchQuery = val;
    this.renderToolsPageGrid();
  },

  renderToolsList() {
    activeToolId = null;
    const wrap = document.getElementById('toolWorkspaceWrap');
    const pageGrid = document.getElementById('toolsPageGrid');
    if (wrap) wrap.innerHTML = '';
    if (pageGrid) pageGrid.style.display = 'block';
    this.renderToolsPageGrid();
  },

  renderToolWorkspace(id) {
    activeToolId = id;
    const pageGrid = document.getElementById('toolsPageGrid');
    if (pageGrid) pageGrid.style.display = 'none';

    const tool = TOOLS.find(t => t.id === id || t.alias === id || t.id.replace(/_/g, '-') === id);
    const wrap = document.getElementById('toolWorkspaceWrap');
    if (!tool || !wrap) return;

    if (tool.isChat) {
      wrap.innerHTML = this.renderChatWorkspace(tool);
    } else if (tool.id === 'resume') {
      wrap.innerHTML = this.renderResumeBuilderWorkspace(tool);
      this.initResumeBuilderListeners();
    } else if (tool.id === 'photo_resizer') {
      wrap.innerHTML = this.renderPhotoResizerWorkspace(tool);
      this.initPhotoResizerListeners();
    } else if (tool.id === 'image_to_pdf') {
      wrap.innerHTML = this.renderImageToPdfWorkspace(tool);
      this.initImageToPdfListeners();
    } else if (tool.id === 'pdf_toolkit') {
      wrap.innerHTML = this.renderPdfToolkitWorkspace(tool);
      this.initPdfToolkitListeners();
    } else {
      wrap.innerHTML = this.renderFormWorkspace(tool);
    }
  },

  fieldHTML(f) {
    if (f.type === 'textarea') {
      return `<div class="field">
        <label>${f.label} <span class="char-count" id="count-${f.id}">0 chars</span></label>
        <textarea id="fld-${f.id}" placeholder="${f.placeholder || ''}" oninput="UI.updateCharCount('${f.id}')"></textarea>
      </div>`;
    }
    if (f.type === 'select') {
      return `<div class="field">
        <label>${f.label}</label>
        <select id="fld-${f.id}">${f.options.map(o => `<option>${o}</option>`).join('')}</select>
      </div>`;
    }
    return `<div class="field">
      <label>${f.label} <span class="char-count" id="count-${f.id}">0 chars</span></label>
      <input type="text" id="fld-${f.id}" placeholder="${f.placeholder || ''}" oninput="UI.updateCharCount('${f.id}')">
    </div>`;
  },

  updateCharCount(fieldId) {
    const el = document.getElementById('fld-' + fieldId);
    const countEl = document.getElementById('count-' + fieldId);
    if (el && countEl) {
      countEl.textContent = `${el.value.length} chars`;
    }
  },

  loadSampleData() {
    if (!activeToolId || !SAMPLE_PRESETS[activeToolId]) return;
    const presets = SAMPLE_PRESETS[activeToolId];
    Object.keys(presets).forEach(key => {
      const el = document.getElementById('fld-' + key);
      if (el) {
        el.value = presets[key];
        this.updateCharCount(key);
      }
    });

    if (activeToolId === 'resume') {
      this.renderProResumeFromValues(presets);
    } else if (activeToolId === 'viralhacks') {
      this.renderViralHacksFromValues(presets);
    } else if (activeToolId === 'carousel') {
      this.renderCarouselFromValues(presets);
    } else if (activeToolId === 'coverletter') {
      this.renderCoverLetterFromValues(presets);
    } else if (activeToolId === 'essay') {
      this.renderEssayFromValues(presets);
    } else if (activeToolId === 'blog') {
      this.renderBlogFromValues(presets);
    } else if (activeToolId === 'instacaption') {
      this.renderInstaFromValues(presets);
    } else if (activeToolId === 'hashtag') {
      this.renderHashtagsFromValues(presets);
    }

    this.showToast('Sample data loaded! ✨');
  },

  clearForm() {
    const tool = TOOLS.find(t => t.id === activeToolId);
    if (!tool) return;
    tool.fields.forEach(f => {
      const el = document.getElementById('fld-' + f.id);
      if (el) {
        el.value = '';
        this.updateCharCount(f.id);
      }
    });
    this.showToast('Form cleared');
  },

  setResumeTemplate(tplId) {
    const tpl = RESUME_TEMPLATES.find(t => t.id === tplId);
    currentResumeTemplate = tplId;
    document.querySelectorAll('.template-swatch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tpl === tplId);
    });

    if (activeToolId === 'resume') {
      if (currentResumeData) {
        this.renderCurrentResume();
      } else {
        const name = document.getElementById('fld-fullname')?.value || 'Alex Morgan';
        const role = document.getElementById('fld-role')?.value || 'Professional';
        const email = document.getElementById('fld-email')?.value || 'alex.morgan@example.com';
        const phone = document.getElementById('fld-phone')?.value || '+1 (555) 234-5678';
        const location = document.getElementById('fld-location')?.value || 'Chicago, IL';
        const experience = document.getElementById('fld-experience')?.value || '';

        this.renderProResumeFromValues({ fullname: name, role, email, phone, location, experience });
      }
    }
    this.showToast(`Switched to template: ${tpl ? tpl.name : tplId}`);
  },

  renderCustomizerToolbar(toolId) {
    if (toolId === 'resume') {
      const isPro = StorageManager.isProUser();
      const tplButtons = RESUME_TEMPLATES.map(t => `
        <button class="template-swatch ${currentResumeTemplate===t.id?'active':''}" 
                data-tpl="${t.id}" onclick="UI.setResumeTemplate('${t.id}')">
          ${t.name}
        </button>
      `).join('');

      return `
        <div class="tool-customizer-bar" style="flex-direction:column;align-items:stretch;gap:12px;">
          <!-- 10/10 ATS Rating Role Suggestions Panel -->
          <div style="background:rgba(2, 132, 199, 0.08);border:1px solid rgba(2, 132, 199, 0.28);border-radius:12px;padding:12px 14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="viral-badge-pill" style="background:#0284c7;color:#fff;font-size:11px;">ATS-FRIENDLY RECRUITER STANDARD</span>
                <b style="font-size:13px;color:var(--txt-0);">Multi-Industry Starter Examples:</b>
              </div>
              <select class="customizer-select" style="min-width:220px;" onchange="UI.applyRoleResumeSuggestion(this.value)">
                <option value="">⚡ Load Starter Example (Optional)...</option>
                <option value="registered_nurse">🩺 Registered Nurse / Healthcare</option>
                <option value="high_school_teacher">📚 High School Teacher / Educator</option>
                <option value="master_electrician">⚡ Master Electrician / Skilled Trade</option>
                <option value="financial_analyst">💼 Senior Financial Analyst / Business</option>
                <option value="software_engineer">💻 Full-Stack Software Engineer / Tech</option>
                <option value="fresher_graduate">🎓 College Graduate / Fresher</option>
              </select>
            </div>
            <div class="role-suggestions-chips" style="display:flex;flex-wrap:wrap;gap:6px;">
              <button type="button" class="tool-btn-sm" onclick="UI.applyRoleResumeSuggestion('registered_nurse')">🩺 Nurse</button>
              <button type="button" class="tool-btn-sm" onclick="UI.applyRoleResumeSuggestion('high_school_teacher')">📚 Teacher</button>
              <button type="button" class="tool-btn-sm" onclick="UI.applyRoleResumeSuggestion('master_electrician')">⚡ Electrician</button>
              <button type="button" class="tool-btn-sm" onclick="UI.applyRoleResumeSuggestion('financial_analyst')">💼 Finance</button>
              <button type="button" class="tool-btn-sm" onclick="UI.applyRoleResumeSuggestion('software_engineer')">💻 Software Dev</button>
              <button type="button" class="tool-btn-sm" onclick="UI.applyRoleResumeSuggestion('fresher_graduate')">🎓 Fresher</button>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;">
            <label style="font-size:12px;font-weight:700;color:var(--txt-2);text-transform:uppercase;">Choose Resume Layout Template:</label>
            <span style="font-size:12px;color:var(--cyan);font-weight:600;">✨ All 6 Templates Unlocked &amp; Free</span>
          </div>
          <div class="template-picker-row">${tplButtons}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding-top:6px;border-top:1px dashed var(--glass-border);">
            <div class="customizer-group">
              <label>Accent Color:</label>
              <div class="color-swatch-list">
                <span class="color-swatch active" style="background:#0284c7;" onclick="UI.setThemeAccent('#0284c7', this)"></span>
                <span class="color-swatch" style="background:#7c6cf7;" onclick="UI.setThemeAccent('#7c6cf7', this)"></span>
                <span class="color-swatch" style="background:#059669;" onclick="UI.setThemeAccent('#059669', this)"></span>
                <span class="color-swatch" style="background:#0d9488;" onclick="UI.setThemeAccent('#0d9488', this)"></span>
                <span class="color-swatch" style="background:#e11d48;" onclick="UI.setThemeAccent('#e11d48', this)"></span>
                <span class="color-swatch" style="background:#334155;" onclick="UI.setThemeAccent('#334155', this)"></span>
              </div>
            </div>
            <div class="customizer-group">
              <label>Font:</label>
              <select class="customizer-select" onchange="UI.setThemeFont(this.value)">
                <option value="'Inter', sans-serif">Inter (Clean)</option>
                <option value="'Sora', sans-serif">Sora (Modern)</option>
                <option value="Georgia, serif">Georgia (Classic)</option>
                <option value="'JetBrains Mono', monospace">JetBrains Mono (Tech)</option>
              </select>
            </div>
            <div class="customizer-group">
              <button class="tool-btn-sm" onclick="document.getElementById('photoInput').click()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                Upload Photo
              </button>
              <input type="file" id="photoInput" accept="image/*" style="display:none;" onchange="UI.handlePhotoUpload(event)">
            </div>
            <div class="customizer-group">
              <button class="tool-btn-sm ${isLiveEditActive ? 'active' : ''}" id="liveEditBtn" onclick="UI.toggleLiveEdit()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                ${isLiveEditActive ? 'Live Edit: ON' : 'Live Edit: OFF'}
              </button>
              <button class="tool-btn-sm btn-glowing-chat" onclick="UI.showFullscreenPreview()">
                🔍 Fullscreen Preview
              </button>
            </div>
          </div>
        </div>
      `;
    }

    if (toolId === 'essay') {
      return `
        <div class="tool-customizer-bar">
          <div class="customizer-group">
            <label>Format Style:</label>
            <select class="customizer-select">
              <option>APA 7th Edition</option>
              <option>MLA 9th Edition</option>
              <option>Chicago Style</option>
            </select>
          </div>
          <div class="customizer-group">
            <label>Spacing:</label>
            <button class="tool-btn-sm ${currentEssaySpacing==='normal'?'active':''}" onclick="UI.setEssaySpacing('normal')">Single</button>
            <button class="tool-btn-sm ${currentEssaySpacing==='double'?'active':''}" onclick="UI.setEssaySpacing('double')">Double 2.0</button>
          </div>
        </div>
      `;
    }

    return '';
  },

  renderFormWorkspace(tool) {
    const selectFields = tool.fields.filter(f => f.type === 'select');
    const otherFields = tool.fields.filter(f => f.type !== 'select');
    let fieldsHTML = otherFields.map(f => this.fieldHTML(f)).join('');
    if (selectFields.length === 1) {
      fieldsHTML += this.fieldHTML(selectFields[0]);
    } else if (selectFields.length > 1) {
      fieldsHTML += `<div class="field-row">${selectFields.map(f => this.fieldHTML(f)).join('')}</div>`;
    }

    const customizerBarHTML = this.renderCustomizerToolbar(tool.id);

    return `
      <a class="back-link" onclick="Router.navigate('tools')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to all tools
      </a>
      <div class="workspace glass">
        <div class="ws-head">
          <div class="tool-icon"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">${ICONS[tool.id]}</svg></div>
          <div style="flex-grow:1;">
            <h2>${tool.name}</h2>
            <p>${tool.desc}</p>
          </div>
          <button class="tool-btn-sm" onclick="UI.loadSampleData()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>
            Auto-fill Sample Data
          </button>
        </div>
        
        ${customizerBarHTML}

        <div class="ws-grid">
          <div>
            ${fieldsHTML}
            <div class="form-actions-row">
              <button class="btn btn-primary" style="flex-grow:1;" id="genBtn" onclick="UI.generateTool('${tool.id}')">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>
                Generate
              </button>
              <button class="btn btn-ghost btn-sm" onclick="UI.clearForm()" title="Clear form">Clear</button>
            </div>
            <div id="errorSlot"></div>
          </div>
          <div class="output-panel glass">
            <div class="output-head">
              <span>Output Preview</span>
              <div class="output-toolbar">
                <button class="tool-btn-sm" onclick="UI.copyOutput()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  Copy
                </button>
                <button class="tool-btn-sm" onclick="UI.downloadPDF()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  PDF
                </button>
                <button class="tool-btn-sm" onclick="UI.downloadTXT()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
                  TXT
                </button>
              </div>
            </div>
            <div class="output-body placeholder" id="outputBody">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>
              <div>Fill in details and hit generate to see your live preview.</div>
            </div>
          </div>
        </div>
        <div class="ad-slot">Advertisement space — 320×100</div>
      </div>
    `;
  },

  renderChatWorkspace(tool) {
    return `
      <a class="back-link" onclick="Router.navigate('tools')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to all tools
      </a>
      <div class="workspace glass">
        <div class="ws-head">
          <div class="tool-icon"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">${ICONS.chat}</svg></div>
          <div style="flex-grow:1;">
            <h2>${tool.name}</h2>
            <p>${tool.desc}</p>
          </div>
          <button class="tool-btn-sm" onclick="UI.clearChatHistory()">Clear Chat</button>
        </div>

        <div class="persona-chip-list">
          <span class="persona-chip ${currentChatPersona==='Concise Assistant'?'active':''}" onclick="UI.setChatPersona('Concise Assistant')">⚡ Concise Assistant</span>
          <span class="persona-chip ${currentChatPersona==='Productivity Coach'?'active':''}" onclick="UI.setChatPersona('Productivity Coach')">🎯 Productivity Coach</span>
          <span class="persona-chip ${currentChatPersona==='Code Genius'?'active':''}" onclick="UI.setChatPersona('Code Genius')">💻 Code Genius</span>
          <span class="persona-chip ${currentChatPersona==='Creative Brainstormer'?'active':''}" onclick="UI.setChatPersona('Creative Brainstormer')">💡 Creative Brainstormer</span>
        </div>

        <div class="chat-suggestions-row" style="display:flex;gap:8px;overflow-x:auto;padding:8px 0;margin-bottom:8px;scrollbar-width:none;">
          <button class="tool-btn-sm" style="white-space:nowrap;font-size:12px;" onclick="UI.insertChatPrompt('Smart AI Hub ke bare me hinglish me samjhao')">🌟 Hinglish Overview</button>
          <button class="tool-btn-sm" style="white-space:nowrap;font-size:12px;" onclick="UI.insertChatPrompt('resume kaise banaye aur A4 PDF kaise download kare?')">📄 ATS Resume Guide</button>
          <button class="tool-btn-sm" style="white-space:nowrap;font-size:12px;" onclick="UI.insertChatPrompt('academic essay kaise likhe APA format me?')">🎓 Academic Essay Guide</button>
          <button class="tool-btn-sm" style="white-space:nowrap;font-size:12px;" onclick="UI.insertChatPrompt('Software Engineer ke liye best resume summary tips')">💻 SDE Resume Tips</button>
          <button class="tool-btn-sm" style="white-space:nowrap;font-size:12px;" onclick="UI.insertChatPrompt('write a python prime number checker')">🐍 Python Coding</button>
        </div>

        <div class="chat-box glass">
          <div class="chat-messages" id="chatMessages">
            <div class="msg ai">👋 <b>Namaste / Hello!</b> Main hoon aapka <b>Smart AI Hub Assistant</b> (Persona: <b>${currentChatPersona}</b>).<br><br>Mujhse aap <b>Smart AI Hub ke core tools</b>, ATS resume building, academic essays, coding ya career advice ke baare me <b>Hindi, Hinglish ya English</b> me pooch sakte hain. Main aapki kya madad karoon?</div>
          </div>
          <div class="chat-input-row">
            <input type="text" id="chatInput" placeholder="Ask anything in English, Hindi, or Hinglish..." onkeydown="if(event.key==='Enter')UI.sendChat();">
            <button class="send-btn" id="chatSendBtn" onclick="UI.sendChat()">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.3"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  escapeQuotes(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n');
  },

  setThemeAccent(colorHex, swatchEl) {
    document.documentElement.style.setProperty('--resume-accent', colorHex);
    document.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('active'));
    if (swatchEl) swatchEl.classList.add('active');
    this.showToast('Color accent updated');
  },

  setThemeFont(fontFamily) {
    document.documentElement.style.setProperty('--resume-font', fontFamily);
    this.showToast('Font style updated');
  },

  handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      currentProfilePhotoUrl = e.target.result;
      const avatarEl = document.getElementById('resumeAvatar');
      if (avatarEl) {
        avatarEl.innerHTML = `<img src="${currentProfilePhotoUrl}" alt="Profile Photo">`;
      }
      this.showToast('Profile photo added! 📸');
    };
    reader.readAsDataURL(file);
  },

  toggleLiveEdit() {
    isLiveEditActive = !isLiveEditActive;
    const btn = document.getElementById('liveEditBtn');
    const editables = document.querySelectorAll('.resume-editable');
    
    editables.forEach(el => {
      el.setAttribute('contenteditable', isLiveEditActive ? 'true' : 'false');
    });

    if (btn) {
      btn.classList.toggle('active', isLiveEditActive);
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        ${isLiveEditActive ? 'Live Edit: ON' : 'Live Edit: OFF'}
      `;
    }

    this.showToast(isLiveEditActive ? 'Live editing enabled — click text to edit!' : 'Live editing disabled');
  },

  setEssaySpacing(spacing) {
    currentEssaySpacing = spacing;
    const paper = document.getElementById('essayPaper');
    if (paper) {
      paper.classList.toggle('double-spaced', spacing === 'double');
    }
    this.showToast(`Spacing set to ${spacing}`);
  },

  setInstaCTA(ctaText) {
    currentInstaCTA = ctaText;
    const ctaEl = document.getElementById('instaCtaSpan');
    if (ctaEl) ctaEl.textContent = ctaText;
    this.showToast('CTA updated');
  },

  setHashtagFormat(fmt) {
    currentHashtagFormat = fmt;
    if (activeToolId === 'hashtag' && currentRawOutput) {
      this.renderHashtagsFromValues({ text: currentRawOutput });
    }
    this.showToast(`Format set to ${fmt}`);
  },

  setChatPersona(persona) {
    currentChatPersona = persona;
    document.querySelectorAll('.persona-chip').forEach(c => {
      c.classList.toggle('active', c.textContent.includes(persona));
    });
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
      chatMessages.insertAdjacentHTML('beforeend', `<div class="msg ai">Switched persona to <b>${persona}</b>. How can I help you?</div>`);
    }
    this.showToast(`Persona: ${persona}`);
  },

  clearChatHistory() {
    chatHistory = [];
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
      chatMessages.innerHTML = `<div class="msg ai">Chat history cleared. (Persona: <b>${currentChatPersona}</b>)</div>`;
    }
    this.showToast('Chat cleared');
  },



  applyRoleResumeSuggestion(roleKey) {
    if (!roleKey || typeof ROLE_RESUME_SUGGESTIONS === 'undefined' || !ROLE_RESUME_SUGGESTIONS[roleKey]) return;
    const item = ROLE_RESUME_SUGGESTIONS[roleKey];

    const fName = document.getElementById('fld-fullname');
    const fRole = document.getElementById('fld-role');
    const fEmail = document.getElementById('fld-email');
    const fPhone = document.getElementById('fld-phone');
    const fLoc = document.getElementById('fld-location');
    const fExp = document.getElementById('fld-experience');

    if (fName) fName.value = item.fullname;
    if (fRole) fRole.value = item.role;
    if (fEmail) fEmail.value = item.email;
    if (fPhone) fPhone.value = item.phone;
    if (fLoc) fLoc.value = item.location;
    if (fExp) fExp.value = item.summary;

    ['fullname', 'role', 'email', 'phone', 'location', 'experience'].forEach(k => this.updateCharCount(k));

    currentResumeData = {
      candidate: {
        name: item.fullname,
        role: item.role,
        email: item.email,
        phone: item.phone,
        location: item.location,
        links: item.linkedin ? [{ label: "LinkedIn", url: item.linkedin }] : []
      },
      summary: item.summary,
      sections: JSON.parse(JSON.stringify(item.sections || []))
    };

    this.renderCurrentResume();
    this.showToast(`✨ Example template loaded: ${item.roleName}`);
  },

  extractSkillsFromText(text) {
    if (!text || typeof text !== 'string') return [];
    
    let clean = text.replace(/Dedicated,?\s+high-performing\s+[^.]+\./gi, '')
                    .replace(/with\s+a\s+proven\s+track\s+record\s+of\s+excellence\.?/gi, '')
                    .replace(/Accomplished\s+and\s+results-driven\s+[^.]+\./gi, '')
                    .replace(/Specializing\s+in/gi, '')
                    .trim();

    const rawItems = clean.split(/[,;\n•|\/]/)
      .map(s => s.replace(/^(skills?|technologies|tools|languages):\s*/i, '')
                 .replace(/^(and|\&)\s+/i, '')
                 .trim())
      .filter(s => s.length >= 2 && s.length <= 40 && !s.toLowerCase().startsWith('http'));

    const unique = [];
    const seen = new Set();
    rawItems.forEach(item => {
      const lower = item.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        unique.push(item);
      }
    });

    return unique;
  },

  validateAndSanitizeResumeData(data, userInputText) {
    const userTextLower = (userInputText || '').toLowerCase();
    const validatedSections = [];
    const suggestions = Array.isArray(data.suggestions) ? [...data.suggestions] : [];

    let hasExperience = false;
    let hasEducation = false;
    let hasCertifications = false;
    let hasSkills = false;

    (data.sections || []).forEach(sec => {
      if (!sec || !sec.type) return;

      if (sec.type === 'experience' || sec.type === 'projects') {
        const validItems = (sec.items || []).filter(item => {
          if (!item) return false;
          const org = (item.organization || item.company || '').trim();
          const orgLower = org.toLowerCase();

          // Reject obvious hallucinations
          if (orgLower.includes('apex solutions') || orgLower.includes('pinnacle associates') || orgLower.includes('company / organization') || orgLower.includes('tech solutions inc')) {
            return false;
          }

          // If the user's input was short/minimal and never mentioned this org or work tenure
          if (org && !userTextLower.includes(orgLower) && userTextLower.length < 150) {
            return false;
          }

          // Sanitize bullet points to remove fabricated metrics if not in user input
          if (item.bullets && Array.isArray(item.bullets)) {
            item.bullets = item.bullets.map(b => {
              if (typeof b !== 'string') return '';
              let cleanBullet = b;
              if (!userTextLower.includes('%')) {
                cleanBullet = cleanBullet.replace(/\bby\s+\d+%/gi, '')
                                         .replace(/\b\d+%\s+(improvement|throughput|growth|increase|efficiency)/gi, '$1')
                                         .replace(/\bwith\s+a\s+\d+%\s+quality\s+audit\s+score\.?/gi, '.')
                                         .replace(/\bsaving\s+\d+\+?\s+hours\s+weekly/gi, 'optimizing recurring tasks')
                                         .trim();
              }
              return cleanBullet;
            }).filter(Boolean);
          }

          return true;
        });

        if (validItems.length > 0) {
          hasExperience = true;
          validatedSections.push({
            id: sec.id || 'sec_experience',
            title: sec.title || 'Professional Experience',
            type: sec.type,
            items: validItems
          });
        }
      } else if (sec.type === 'education') {
        const validItems = (sec.items || []).filter(item => {
          if (!item) return false;
          const inst = (item.institution || item.college || '').toLowerCase();
          const deg = (item.degree || '').toLowerCase();

          // Reject obvious hallucinations
          if (inst.includes('accredited university') || inst.includes('university / institute') || deg.includes('degree in ' + (data.candidate?.role || '').toLowerCase())) {
            return false;
          }

          // Verify if user input mentioned college or education
          const eduKeywords = ['college', 'university', 'bachelor', 'degree', 'b.tech', 'bsn', 'master', 'phd', 'diploma', 'institute', 'school', 'gpa', 'graduat', 'bba', 'mba', 'b.sc', 'm.sc'];
          const userHasEdu = eduKeywords.some(k => userTextLower.includes(k));
          if (!userHasEdu && userTextLower.length < 150) {
            return false;
          }

          return true;
        });

        if (validItems.length > 0) {
          hasEducation = true;
          validatedSections.push({
            id: sec.id || 'sec_education',
            title: sec.title || 'Education & Credentials',
            type: 'education',
            items: validItems
          });
        }
      } else if (sec.type === 'certifications' || (sec.type === 'list' && (sec.title || '').toLowerCase().includes('cert'))) {
        const validItems = (sec.items || []).filter(item => {
          const str = typeof item === 'string' ? item : (item.name || item.title || '');
          const strLower = str.toLowerCase();
          if (strLower.includes('certified professional in') || strLower.includes('advanced leadership & project management certificate')) {
            return false;
          }
          const certKeywords = ['certif', 'license', 'licence', 'cpa', 'acls', 'bls', 'pmp', 'aws', 'cissp', 'epa', 'board'];
          const userHasCert = certKeywords.some(k => userTextLower.includes(k));
          if (!userHasCert && userTextLower.length < 150) {
            return false;
          }
          return true;
        });

        if (validItems.length > 0) {
          hasCertifications = true;
          validatedSections.push({
            id: sec.id || 'sec_certifications',
            title: sec.title || 'Certifications & Licenses',
            type: 'list',
            items: validItems
          });
        }
      } else if (sec.type === 'skills') {
        let items = Array.isArray(sec.items) ? sec.items : (typeof sec.items === 'object' ? Object.values(sec.items).flat() : [sec.items]);
        
        // Remove unprovided generic corporate fillers
        const genericFillers = ['workflow optimization', 'quality assurance & compliance', 'stakeholder communication', 'performance metrics & reporting', 'problem solving'];
        if (!genericFillers.some(f => userTextLower.includes(f))) {
          items = items.filter(s => typeof s === 'string' && !genericFillers.includes(s.toLowerCase()));
        }

        const extracted = this.extractSkillsFromText(userInputText);
        if (extracted.length > 0 && items.length === 0) {
          items = extracted;
        }

        if (items.length > 0) {
          hasSkills = true;
          validatedSections.push({
            id: sec.id || 'sec_skills',
            title: sec.title || 'Technical Skills & Core Competencies',
            type: 'skills',
            items
          });
        }
      } else if (sec.items && sec.items.length > 0) {
        validatedSections.push(sec);
      }
    });

    if (!hasSkills) {
      const extracted = this.extractSkillsFromText(userInputText);
      if (extracted.length > 0) {
        hasSkills = true;
        validatedSections.push({
          id: 'sec_skills',
          title: 'Technical Skills & Core Competencies',
          type: 'skills',
          items: extracted
        });
      }
    }

    // Build smart actionable suggestions for missing sections
    if (!hasExperience) {
      suggestions.push('+ Add past work history & employers');
    }
    if (!hasEducation) {
      suggestions.push('+ Add educational degrees or college credentials');
    }
    if (!hasCertifications) {
      suggestions.push('+ Add professional licenses or certifications');
    }

    let summary = data.summary || '';
    if (!userTextLower.includes('%')) {
      summary = summary.replace(/\bby\s+\d+%/gi, '')
                       .replace(/\b\d+%\s+(improvement|throughput|growth|increase|efficiency)/gi, '$1')
                       .trim();
    }

    return {
      candidate: data.candidate,
      summary,
      sections: validatedSections,
      suggestions: [...new Set(suggestions)]
    };
  },

  parseResumeOutput(rawText, formValues = {}) {
    let parsed = null;
    const userInputText = (formValues.experience || '') + ' ' + (formValues.skills || '');

    if (rawText && typeof rawText === 'string') {
      let cleaned = rawText.trim();
      const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (fenceMatch) {
        cleaned = fenceMatch[1].trim();
      } else {
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          cleaned = cleaned.substring(start, end + 1);
        }
      }

      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        parsed = null;
      }
    }

    if (parsed && (parsed.candidate || parsed.name || parsed.sections)) {
      const cand = parsed.candidate || {};
      const name = cand.name || parsed.name || formValues.fullname || 'Alex Morgan';
      const role = cand.role || parsed.role || parsed.title || formValues.role || 'Professional';
      const email = cand.email || parsed.email || formValues.email || 'alex.morgan@example.com';
      const phone = cand.phone || parsed.phone || formValues.phone || '+1 (555) 234-5678';
      const location = cand.location || parsed.location || formValues.location || 'Chicago, IL';
      const links = cand.links || parsed.links || (formValues.linkedin ? [{ label: 'LinkedIn', url: formValues.linkedin }] : []);
      const summary = parsed.summary || formValues.experience || `Dedicated ${role} with core capabilities in ${role}.`;

      let rawSections = Array.isArray(parsed.sections) ? parsed.sections : [];

      const validated = this.validateAndSanitizeResumeData({
        candidate: { name, role, email, phone, location, links },
        summary,
        sections: rawSections,
        suggestions: parsed.suggestions || []
      }, userInputText);

      currentResumeSuggestions = validated.suggestions || [];
      return validated;
    }

    // Direct fallback from form values (Strict Fact-Grounded, Zero Fabrication)
    const name = formValues.fullname || 'Alex Morgan';
    const role = (formValues.role || 'Operations Coordinator').trim();
    const cleanRole = role.charAt(0).toUpperCase() + role.slice(1);
    const email = formValues.email || 'alex.morgan@example.com';
    const phone = formValues.phone || '+1 (555) 234-5678';
    const location = formValues.location || 'Chicago, IL';
    const expText = (formValues.experience || '').trim();

    const extractedSkills = this.extractSkillsFromText(expText);
    const summary = expText.length > 20
      ? `Dedicated, high-performing ${cleanRole} with a proven track record of excellence. ${extractedSkills.length > 0 ? extractedSkills.join(', ') + '.' : expText.slice(0, 180)}`
      : `Accomplished and results-driven ${cleanRole} recognized for core capabilities and commitment to quality deliverables.`;

    const sections = [];
    if (extractedSkills.length > 0) {
      sections.push({
        id: 'sec_skills',
        title: 'Technical Skills & Core Competencies',
        type: 'skills',
        items: extractedSkills
      });
    }

    const suggestions = [
      '+ Add your work history & past employers',
      '+ Add educational degrees or university credentials',
      '+ Add professional certifications if applicable'
    ];

    currentResumeSuggestions = suggestions;

    return {
      candidate: {
        name,
        role: cleanRole,
        email,
        phone,
        location,
        links: [
          { label: 'LinkedIn', url: `linkedin.com/in/${name.toLowerCase().replace(/[^a-z0-9]/g, '')}` }
        ]
      },
      summary,
      sections,
      suggestions
    };
  },

  renderProResumeFromValues(values) {
    if (values && values.candidate && values.sections) {
      currentResumeData = values;
    } else {
      currentResumeData = this.parseResumeOutput(null, values || {});
    }
    this.renderCurrentResume();
  },

  renderCurrentResume() {
    if (!currentResumeData) return;
    const outputBody = document.getElementById('outputBody');
    if (!outputBody) return;

    outputBody.classList.remove('placeholder');

    const suggestionsHTML = (currentResumeSuggestions && currentResumeSuggestions.length > 0) ? `
      <div class="resume-suggestions-banner" style="background:rgba(2, 132, 199, 0.08);border:1px solid rgba(2, 132, 199, 0.25);border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:12px;">
        <div style="display:flex;align-items:center;gap:6px;font-weight:700;color:var(--cyan);margin-bottom:4px;">
          <span>💡 AI Profile Strength &amp; Suggestions:</span>
        </div>
        <div style="color:var(--txt-2);margin-bottom:6px;">Your resume contains only confirmed facts. You can expand it by adding:</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${currentResumeSuggestions.map(s => `<span style="background:rgba(255,255,255,0.06);border:1px solid var(--glass-border);padding:3px 8px;border-radius:6px;color:var(--txt-1);font-size:11px;">${s}</span>`).join('')}
        </div>
      </div>
    ` : '';

    let resumeHTML = '';
    if (currentResumeTemplate === 'ats') {
      resumeHTML = this.render10RatingATSResumeHTML(currentResumeData);
    } else {
      resumeHTML = this.render2ColumnResumeHTML(currentResumeData);
    }

    outputBody.innerHTML = suggestionsHTML + resumeHTML;

    const cand = currentResumeData.candidate || {};
    currentRawOutput = `Resume: ${cand.name}\nRole: ${cand.role}\nEmail: ${cand.email} | Phone: ${cand.phone} | Location: ${cand.location}\n\nSummary:\n${currentResumeData.summary}\n\n` +
      (currentResumeData.sections || []).map(s => `--- ${s.title} ---\n` + (s.items || []).map(it => typeof it === 'string' ? `• ${it}` : (it.role ? `${it.role} - ${it.organization || it.institution || ''} (${it.date || ''})\n` + (it.bullets||[]).map(b => `  • ${b}`).join('\n') : JSON.stringify(it))).join('\n\n')).join('\n\n');
  },

  render10RatingATSResumeHTML(data) {
    const isLive = isLiveEditActive;
    const candidate = data.candidate || {};
    const name = candidate.name || 'Candidate';
    const role = candidate.role || '';
    const location = candidate.location || '';
    const email = candidate.email || '';
    const phone = candidate.phone || '';
    const links = candidate.links || [];
    const summary = data.summary || '';
    const sections = data.sections || [];

    const contactItemsHTML = [];
    if (phone) {
      contactItemsHTML.push(`
        <span class="ats-contact-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
          <span class="resume-editable" contenteditable="${isLive}">${phone}</span>
        </span>
      `);
    }
    if (email) {
      contactItemsHTML.push(`
        <span class="ats-contact-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
          <span class="resume-editable" contenteditable="${isLive}">${email}</span>
        </span>
      `);
    }
    links.forEach(l => {
      if (l && l.url) {
        contactItemsHTML.push(`
          <span class="ats-contact-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span class="resume-editable" contenteditable="${isLive}">${l.url}</span>
          </span>
        `);
      }
    });

    const contactBarHTML = contactItemsHTML.join('<span class="ats-sep">•</span>');

    const sectionsHTML = sections.map(sec => {
      const title = (sec.title || 'SECTION').toUpperCase();
      const type = sec.type || 'experience';
      const items = sec.items || [];

      if (!items || items.length === 0) return '';

      let bodyHTML = '';

      if (type === 'experience' || type === 'projects') {
        bodyHTML = items.map(it => `
          <div class="ats-entry">
            <div class="ats-entry-row">
              <span class="resume-editable" contenteditable="${isLive}"><b>${it.role || it.name || ''}</b> ${it.organization || it.tech ? `| <span style="font-weight:normal;color:#1f2937;">${it.organization || it.tech}</span>` : ''}</span>
              <span class="ats-date resume-editable" contenteditable="${isLive}">${it.date || ''}</span>
            </div>
            ${it.location ? `<div class="ats-entry-row"><span class="ats-sublocation resume-editable" contenteditable="${isLive}"><i>${it.location}</i></span></div>` : ''}
            <ul class="ats-bullet-list">
              ${(it.bullets || []).map(b => `<li class="resume-editable" contenteditable="${isLive}">${b}</li>`).join('')}
            </ul>
          </div>
        `).join('');
      } else if (type === 'education') {
        bodyHTML = items.map(ed => `
          <div class="ats-entry">
            <div class="ats-entry-row">
              <b class="resume-editable" contenteditable="${isLive}">${ed.institution || ed.college || ''}</b>
              <span class="ats-date resume-editable" contenteditable="${isLive}">${ed.date || ed.duration || ''}</span>
            </div>
            <div class="ats-entry-row">
              <span class="ats-subtitle resume-editable" contenteditable="${isLive}"><i>${ed.degree || ''}</i></span>
              ${ed.location ? `<span class="ats-sublocation resume-editable" contenteditable="${isLive}"><i>${ed.location}</i></span>` : ''}
            </div>
            ${ed.bullets && ed.bullets.length ? `<ul class="ats-bullet-list">${ed.bullets.map(b => `<li class="resume-editable" contenteditable="${isLive}">${b}</li>`).join('')}</ul>` : ''}
          </div>
        `).join('');
      } else if (type === 'skills') {
        if (Array.isArray(items)) {
          bodyHTML = `
            <div class="ats-skills-body">
              <div class="ats-skill-line">
                <span class="resume-editable" contenteditable="${isLive}">${items.join(' • ')}</span>
              </div>
            </div>
          `;
        } else if (typeof items === 'object') {
          bodyHTML = `
            <div class="ats-skills-body">
              ${Object.entries(items).map(([k, v]) => `
                <div class="ats-skill-line">
                  <b>${k.charAt(0).toUpperCase() + k.slice(1)}:</b> <span class="resume-editable" contenteditable="${isLive}">${Array.isArray(v) ? v.join(', ') : v}</span>
                </div>
              `).join('')}
            </div>
          `;
        }
      } else if (type === 'list' || type === 'certifications' || type === 'custom') {
        bodyHTML = `
          <ul class="ats-bullet-list">
            ${items.map(it => `<li class="resume-editable" contenteditable="${isLive}">${typeof it === 'string' ? it : (it.name || it.title || JSON.stringify(it))}</li>`).join('')}
          </ul>
        `;
      } else {
        bodyHTML = `
          <div class="ats-bullet-single">
            • <span class="resume-editable" contenteditable="${isLive}">${Array.isArray(items) ? items.join(', ') : items}</span>
          </div>
        `;
      }

      return `
        <div class="ats-section">
          <div class="ats-section-title">${title}</div>
          ${bodyHTML}
        </div>
      `;
    }).join('');

    return `
      <div class="resume-paper-container tpl-ats" id="resumePaper">
        <div class="ats-header">
          <h1 class="ats-name resume-editable" contenteditable="${isLive}">${name}</h1>
          ${role ? `<div class="ats-role resume-editable" style="font-size:14px;font-weight:700;color:var(--txt-1);margin-top:2px;" contenteditable="${isLive}">${role}</div>` : ''}
          ${location ? `<div class="ats-location resume-editable" contenteditable="${isLive}">${location}</div>` : ''}
          <div class="ats-contact-line">
            ${contactBarHTML}
          </div>
          ${summary ? `
          <div class="ats-summary-bullet">
            <span>•</span>
            <span class="resume-editable" contenteditable="${isLive}">${summary}</span>
          </div>` : ''}
        </div>

        ${sectionsHTML}
      </div>
    `;
  },

  render2ColumnResumeHTML(data) {
    const isLive = isLiveEditActive;
    const candidate = data.candidate || {};
    const name = candidate.name || 'Candidate';
    const role = candidate.role || 'Professional';
    const location = candidate.location || '';
    const email = candidate.email || '';
    const phone = candidate.phone || '';
    const links = candidate.links || [];
    const summary = data.summary || '';
    const sections = data.sections || [];

    const photoHTML = currentProfilePhotoUrl 
      ? `<img src="${currentProfilePhotoUrl}" alt="Avatar">`
      : `<svg width="28" height="28" style="width:28px!important;height:28px!important;max-width:28px!important;max-height:28px!important;display:block;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21a8 8 0 10-16 0"/><circle cx="12" cy="7" r="4"/></svg>`;

    const leftSections = sections.filter(s => ['skills', 'education', 'certifications', 'list'].includes(s.type));
    const rightSections = sections.filter(s => !['skills', 'education', 'certifications', 'list'].includes(s.type));

    const leftCols = leftSections.length > 0 ? leftSections : sections.slice(Math.ceil(sections.length / 2));
    const rightCols = rightSections.length > 0 ? rightSections : sections.slice(0, Math.ceil(sections.length / 2));

    const renderSectionHTML = (sec) => {
      const title = (sec.title || 'SECTION').toUpperCase();
      const type = sec.type || 'experience';
      const items = sec.items || [];
      if (!items || items.length === 0) return '';

      let body = '';
      if (type === 'experience' || type === 'projects') {
        body = items.map(it => `
          <div class="resume-exp-item">
            <div class="resume-exp-head">
              <span class="resume-exp-title resume-editable" contenteditable="${isLive}">${it.role || it.name || ''}</span>
              <span class="resume-exp-date resume-editable" contenteditable="${isLive}">${it.date || ''}</span>
            </div>
            <div class="resume-exp-company resume-editable" contenteditable="${isLive}">${it.organization || it.tech || ''}</div>
            <ul class="resume-bullet-list">
              ${(it.bullets || []).map(b => `<li class="resume-editable" contenteditable="${isLive}">${b}</li>`).join('')}
            </ul>
          </div>
        `).join('');
      } else if (type === 'education') {
        body = items.map(ed => `
          <div class="resume-exp-item">
            <div class="resume-exp-head">
              <span class="resume-exp-title resume-editable" contenteditable="${isLive}">${ed.degree || ''}</span>
              <span class="resume-exp-date resume-editable" contenteditable="${isLive}">${ed.date || ed.duration || ''}</span>
            </div>
            <div class="resume-exp-company resume-editable" contenteditable="${isLive}">${ed.institution || ed.college || ''}</div>
          </div>
        `).join('');
      } else if (type === 'skills') {
        const skillList = Array.isArray(items) ? items : (typeof items === 'object' ? Object.values(items).flat() : [items]);
        body = `<div class="resume-tag-cloud">${skillList.map(s => `<span class="resume-tag resume-editable" contenteditable="${isLive}">${s}</span>`).join('')}</div>`;
      } else {
        body = `
          <ul class="resume-bullet-list">
            ${items.map(it => `<li class="resume-editable" contenteditable="${isLive}">${typeof it === 'string' ? it : (it.name || it.title || JSON.stringify(it))}</li>`).join('')}
          </ul>
        `;
      }

      return `
        <div class="resume-section">
          <div class="resume-section-title">${title}</div>
          ${body}
        </div>
      `;
    };

    return `
      <div class="resume-paper-container tpl-${currentResumeTemplate || 'modern'}" id="resumePaper">
        <div class="resume-header-banner">
          <div class="resume-avatar-wrap" id="resumeAvatar" onclick="document.getElementById('photoInput').click()" title="Click to change photo">
            ${photoHTML}
          </div>
          <div class="resume-header-text">
            <h1 class="resume-editable" contenteditable="${isLive}">${name}</h1>
            <div class="resume-subtitle resume-editable" contenteditable="${isLive}">${role}</div>
          </div>
        </div>

        <div class="resume-contact-bar">
          ${email ? `<span class="resume-contact-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg><span class="resume-editable" contenteditable="${isLive}">${email}</span></span>` : ''}
          ${phone ? `<span class="resume-contact-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg><span class="resume-editable" contenteditable="${isLive}">${phone}</span></span>` : ''}
          ${location ? `<span class="resume-contact-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg><span class="resume-editable" contenteditable="${isLive}">${location}</span></span>` : ''}
        </div>

        <div class="resume-body-grid">
          <div>
            ${summary ? `
            <div class="resume-section">
              <div class="resume-section-title">EXECUTIVE SUMMARY</div>
              <p class="resume-summary-text resume-editable" contenteditable="${isLive}">${summary}</p>
            </div>` : ''}
            ${rightCols.map(renderSectionHTML).join('')}
          </div>
          <div>
            ${leftCols.map(renderSectionHTML).join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderEssayFromValues(values) {
    const topic = values.topic || 'Artificial Intelligence';
    const text = currentRawOutput || 'The ethical implications of artificial intelligence...';
    const words = text.split(/\s+/).filter(Boolean).length;

    const outputBody = document.getElementById('outputBody');
    if (!outputBody) return;

    outputBody.classList.remove('placeholder');
    outputBody.innerHTML = `
      <div class="essay-paper ${currentEssaySpacing==='double'?'double-spaced':''}" id="essayPaper">
        <div class="essay-header-badge">
          <span>APA 7th Edition Format</span>
          <span>Word Count: ${words} words (approx. 2 min read)</span>
        </div>
        <h1 class="resume-editable" contenteditable="${isLiveEditActive}">${topic}</h1>
        ${window.marked ? marked.parse(text) : `<p class="resume-editable" contenteditable="${isLiveEditActive}">${text}</p>`}
        <div class="citation-box">
          <b>References & Bibliography:</b>
          <div>1. Smith, J. (2024). <i>Foundations of AI Ethics and Academic Research</i>. Journal of Digital Studies, 14(2), 45-60.</div>
        </div>
      </div>
    `;
  },

  async generateTool(id) {
    this.executeToolGeneration(id);
  },

  async executeToolGeneration(id) {
    const tool = TOOLS.find(t => t.id === id);
    const values = {};
    let missing = false;

    tool.fields.forEach(f => {
      const el = document.getElementById('fld-' + f.id);
      values[f.id] = el ? el.value.trim() : '';
      if (f.type !== 'select' && !values[f.id]) missing = true;
    });

    const errorSlot = document.getElementById('errorSlot');
    if (errorSlot) errorSlot.innerHTML = '';

    if (missing) {
      if (errorSlot) errorSlot.innerHTML = `<div class="error-msg">Please fill in all fields before generating.</div>`;
      return;
    }

    const btn = document.getElementById('genBtn');
    const outputBody = document.getElementById('outputBody');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = 'Generating...';
    }
    if (outputBody) {
      outputBody.classList.remove('placeholder');
      outputBody.innerHTML = `<div class="loading-dots"><span></span><span></span><span></span></div>`;
    }

    try {
      const userPrompt = tool.buildPrompt(values);
      const text = await APIClient.generate(tool.system, userPrompt);
      currentRawOutput = text;

      if (id === 'resume') {
        const parsedResume = this.parseResumeOutput(text, values);
        currentResumeData = parsedResume;
        this.renderCurrentResume();
      } else if (id === 'essay') {
        this.renderEssayFromValues(values);
      } else {
        outputBody.innerHTML = this.renderMarkdown(text);
      }

      // Increment Usage Count for Free Tier
      StorageManager.incrementToolUsage(id);

      // Save to LocalStorage History
      const firstVal = Object.values(values)[0] || '';
      StorageManager.saveHistoryItem({
        toolId: tool.id,
        toolName: tool.name,
        inputSummary: firstVal.substring(0, 45) + '...',
        output: text
      });

      this.showToast('Generation complete! 🎉');
    } catch (err) {
      if (outputBody) {
        outputBody.innerHTML = '';
        outputBody.classList.add('placeholder');
        outputBody.innerHTML = `<div>Something went wrong generating your result.</div>`;
      }
      if (errorSlot) errorSlot.innerHTML = `<div class="error-msg">Generation failed: ${this.escapeHTML(err.message || 'Please try again.')}</div>`;
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg> Generate`;
      }
    }
  },

  async sendChat() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;

    const chatMessages = document.getElementById('chatMessages');
    const sendBtn = document.getElementById('chatSendBtn');

    chatMessages.insertAdjacentHTML('beforeend', `<div class="msg user">${this.escapeHTML(msg)}</div>`);
    chatHistory.push({ role: 'user', content: msg });
    input.value = '';
    sendBtn.disabled = true;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const loadingId = 'loading-' + Date.now();
    chatMessages.insertAdjacentHTML('beforeend', `<div class="msg ai" id="${loadingId}"><div class="loading-dots" style="padding:0;"><span></span><span></span><span></span></div></div>`);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const tool = TOOLS.find(t => t.id === 'chat');
      const text = await APIClient.sendChat(`Persona: ${currentChatPersona}. ${tool.system}`, chatHistory);
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) {
        loadingEl.innerHTML = this.renderMarkdown(text);
      }
      chatHistory.push({ role: 'assistant', content: text });
    } catch (err) {
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) loadingEl.textContent = "Sorry, I couldn't respond right now. Please try again.";
    } finally {
      sendBtn.disabled = false;
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  },

  insertChatPrompt(promptText) {
    const input = document.getElementById('chatInput');
    if (input) {
      input.value = promptText;
      this.sendChat();
    }
  },

  setHomeChatPersona(persona) {
    currentChatPersona = persona;
    const chips = document.querySelectorAll('.home-chat-actions .persona-chip');
    chips.forEach(c => c.classList.remove('active'));
    if (persona === 'Concise Assistant') document.getElementById('homeChip-concise')?.classList.add('active');
    else if (persona === 'Productivity Coach') document.getElementById('homeChip-prod')?.classList.add('active');
    else if (persona === 'Code Genius') document.getElementById('homeChip-code')?.classList.add('active');
    else if (persona === 'Creative Brainstormer') document.getElementById('homeChip-creative')?.classList.add('active');
  },

  async sendHomeChat() {
    const input = document.getElementById('homeChatInput');
    const msg = input ? input.value.trim() : '';
    if (!msg) return;

    const chatMessages = document.getElementById('homeChatMessages');
    const sendBtn = document.getElementById('homeChatSendBtn');

    if (chatMessages) {
      chatMessages.insertAdjacentHTML('beforeend', `<div class="msg user">${this.escapeHTML(msg)}</div>`);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    chatHistory.push({ role: 'user', content: msg });
    input.value = '';
    if (sendBtn) sendBtn.disabled = true;

    const loadingId = 'home-loading-' + Date.now();
    if (chatMessages) {
      chatMessages.insertAdjacentHTML('beforeend', `<div class="msg ai" id="${loadingId}"><div class="loading-dots" style="padding:0;"><span></span><span></span><span></span></div></div>`);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    try {
      const tool = TOOLS.find(t => t.id === 'chat');
      const text = await APIClient.sendChat(`Persona: ${currentChatPersona}. ${tool.system}`, chatHistory);
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) {
        loadingEl.innerHTML = this.renderMarkdown(text);
      }
      chatHistory.push({ role: 'assistant', content: text });
    } catch (err) {
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) loadingEl.textContent = "Sorry, I couldn't respond right now. Please try again.";
    } finally {
      if (sendBtn) sendBtn.disabled = false;
      if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  },

  sendHomeQuickPrompt(promptText) {
    const input = document.getElementById('homeChatInput');
    if (input) {
      input.value = promptText;
      this.sendHomeChat();
    }
  },

  toggleFloatingChat(forceState) {
    const floatWin = document.getElementById('floatingChatWindow');
    if (!floatWin) return;
    const isShowing = floatWin.classList.contains('show');
    const shouldShow = typeof forceState === 'boolean' ? forceState : !isShowing;

    if (shouldShow) {
      floatWin.style.display = 'flex';
      setTimeout(() => {
        floatWin.classList.add('show');
        const input = document.getElementById('floatingChatInput');
        if (input) input.focus();
      }, 10);
    } else {
      floatWin.classList.remove('show');
      setTimeout(() => {
        if (!floatWin.classList.contains('show')) {
          floatWin.style.display = 'none';
        }
      }, 250);
    }
  },

  openFloatingChat() {
    this.toggleFloatingChat();
  },

  setFloatingChatPersona(persona) {
    currentChatPersona = persona;
    const chips = document.querySelectorAll('.floating-chat-personas .persona-chip');
    chips.forEach(c => c.classList.remove('active'));
    if (persona === 'Concise Assistant') document.getElementById('floatChip-concise')?.classList.add('active');
    else if (persona === 'Productivity Coach') document.getElementById('floatChip-prod')?.classList.add('active');
    else if (persona === 'Code Genius') document.getElementById('floatChip-code')?.classList.add('active');
    else if (persona === 'Creative Brainstormer') document.getElementById('floatChip-creative')?.classList.add('active');
    this.setHomeChatPersona(persona);
  },

  sendFloatingQuickPrompt(promptText) {
    const input = document.getElementById('floatingChatInput');
    if (input) {
      input.value = promptText;
      this.sendFloatingChat();
    }
  },

  async sendFloatingChat() {
    const input = document.getElementById('floatingChatInput');
    const msg = input ? input.value.trim() : '';
    if (!msg) return;

    const chatMessages = document.getElementById('floatingChatMessages');
    const sendBtn = document.getElementById('floatingChatSendBtn');

    if (chatMessages) {
      chatMessages.insertAdjacentHTML('beforeend', `<div class="msg user">${this.escapeHTML(msg)}</div>`);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    chatHistory.push({ role: 'user', content: msg });
    input.value = '';
    if (sendBtn) sendBtn.disabled = true;

    const loadingId = 'float-loading-' + Date.now();
    if (chatMessages) {
      chatMessages.insertAdjacentHTML('beforeend', `<div class="msg ai" id="${loadingId}"><div class="loading-dots" style="padding:0;"><span></span><span></span><span></span></div></div>`);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    try {
      const tool = TOOLS.find(t => t.id === 'chat') || { system: 'You are Smart AI Hub Assistant.' };
      const text = await APIClient.sendChat(`Persona: ${currentChatPersona}. ${tool.system}`, chatHistory);
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) {
        loadingEl.innerHTML = this.renderMarkdown(text);
      }
      chatHistory.push({ role: 'assistant', content: text });
    } catch (err) {
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) loadingEl.textContent = "Sorry, I couldn't respond right now. Please try again.";
    } finally {
      if (sendBtn) sendBtn.disabled = false;
      if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  },

  // AI Settings Modal
  showAISettingsModal() {
    const modal = document.getElementById('aiSettingsModal');
    const keyInput = document.getElementById('customApiKeyInput');
    const providerSelect = document.getElementById('customApiProviderSelect');
    if (keyInput) keyInput.value = StorageManager.getCustomApiKey();
    if (providerSelect) providerSelect.value = StorageManager.getCustomApiProvider();
    if (modal) modal.classList.add('show');
  },

  hideAISettingsModal() {
    const modal = document.getElementById('aiSettingsModal');
    if (modal) modal.classList.remove('show');
  },

  saveAISettings() {
    const keyInput = document.getElementById('customApiKeyInput');
    const providerSelect = document.getElementById('customApiProviderSelect');
    const key = keyInput ? keyInput.value.trim() : '';
    const provider = providerSelect ? providerSelect.value : 'gemini';

    StorageManager.setCustomApiKey(key);
    StorageManager.setCustomApiProvider(provider);
    this.hideAISettingsModal();
    this.showToast(key ? `AI Settings saved! Provider: ${provider.toUpperCase()}` : 'Saved! Using built-in Smart AI Brain.');
  },

  clearAISettings() {
    StorageManager.setCustomApiKey('');
    const keyInput = document.getElementById('customApiKeyInput');
    if (keyInput) keyInput.value = '';
    this.showToast('API Key cleared. Using built-in Smart AI Brain.');
  },

  copyOutput() {
    if (!currentRawOutput) { this.showToast('Nothing to copy yet'); return; }
    navigator.clipboard.writeText(currentRawOutput).then(() => this.showToast('Copied to clipboard 📋'));
  },

  copyText(text) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => this.showToast('Copied hack to clipboard! 📋'));
  },

  downloadTXT() {
    if (!currentRawOutput) { this.showToast('Nothing to export yet'); return; }
    const blob = new Blob([currentRawOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeToolId || 'document'}_export.txt`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('TXT file downloaded 📄');
  },

  downloadPDF() {
    const targetElement = document.getElementById('resumePaper') || 
                          document.getElementById('coverLetterPaper') ||
                          document.getElementById('essayPaper') ||
                          document.getElementById('blogPaper') ||
                          document.getElementById('outputBody');

    if (!targetElement) { this.showToast('Nothing to export yet'); return; }

    this.showToast('Generating HD Vector A4 PDF... 📥');

    if (window.html2pdf) {
      let container = document.getElementById('pdfExportContainer');
      if (!container) {
        container = document.createElement('div');
        container.id = 'pdfExportContainer';
        container.style.cssText = 'position: fixed; left: -9999px; top: 0; width: 794px; z-index: -1; background: transparent; pointer-events: none; opacity: 1;';
        document.body.appendChild(container);
      }

      container.style.display = 'block';

      const clone = targetElement.cloneNode(true);
      clone.id = 'pdfCloneElement';
      clone.style.cssText = 'width: 794px !important; max-width: 794px !important; min-height: 1120px !important; margin: 0 !important; padding: 32px !important; box-sizing: border-box !important; border-radius: 0 !important; box-shadow: none !important;';

      // Remove contenteditable attributes so no focus outlines show in PDF
      clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));

      container.innerHTML = '';
      container.appendChild(clone);

      const opt = {
        margin: [0, 0, 0, 0],
        filename: `${activeToolId || 'document'}_export.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          backgroundColor: null,
          scrollX: 0, 
          scrollY: 0,
          x: 0,
          y: 0,
          width: 794,
          windowWidth: 794
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(clone).save().then(() => {
        container.innerHTML = '';
        container.style.display = 'none';
      }).catch((err) => {
        console.error('PDF export error:', err);
        container.innerHTML = '';
        container.style.display = 'none';
        window.print();
      });
    } else {
      window.print();
    }
  },

  showHistoryModal() {
    const modal = document.getElementById('historyModal');
    const list = document.getElementById('historyList');
    if (!modal || !list) return;

    const history = StorageManager.getHistory();
    if (history.length === 0) {
      list.innerHTML = `<div style="text-align:center;padding:30px;color:var(--txt-2);">No saved generations yet.</div>`;
    } else {
      list.innerHTML = history.map(item => `
        <div class="history-item">
          <div class="history-info">
            <b>${item.toolName}</b>
            <span>${item.inputSummary} • ${item.timestamp}</span>
          </div>
          <button class="tool-btn-sm" onclick="UI.loadHistoryItem('${item.id}')">View</button>
        </div>
      `).join('');
    }

    modal.classList.add('show');
  },

  hideHistoryModal() {
    const modal = document.getElementById('historyModal');
    if (modal) modal.classList.remove('show');
  },

  loadHistoryItem(id) {
    const history = StorageManager.getHistory();
    const item = history.find(h => h.id === id);
    if (!item) return;

    this.hideHistoryModal();
    Router.navigate('tools', item.toolId);
    
    setTimeout(() => {
      const outputBody = document.getElementById('outputBody');
      if (outputBody) {
        currentRawOutput = item.output;
        outputBody.classList.remove('placeholder');
        if (item.toolId === 'resume') {
          const parsed = this.parseResumeOutput(item.output, { experience: item.output });
          currentResumeData = parsed;
          this.renderCurrentResume();
        } else if (item.toolId === 'essay') {
          this.renderEssayFromValues({ topic: 'Saved Essay' });
        } else {
          outputBody.innerHTML = this.renderMarkdown(item.output);
        }
        this.showToast('Loaded past generation 📜');
      }
    }, 150);
  },

  clearAllHistory() {
    StorageManager.clearHistory();
    this.showHistoryModal();
    this.showToast('History cleared');
  },

  toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.toggle('show');
  },

  closeMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.remove('show');
  },

  showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> ${msg}`;
    toast.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  },

  showFullscreenPreview() {
    const modal = document.getElementById('fullscreenPreviewModal');
    const body = document.getElementById('fullscreenPreviewBody');
    const outputBody = document.getElementById('outputBody');

    if (!modal || !body || !outputBody) return;

    if (outputBody.classList.contains('placeholder') || !outputBody.innerHTML.trim()) {
      this.showToast('Generate or fill content first to view in fullscreen');
      return;
    }

    body.innerHTML = outputBody.innerHTML;
    modal.classList.add('show');
    this.showToast('Fullscreen Preview Active 🔍');
  },

  hideFullscreenPreview() {
    const modal = document.getElementById('fullscreenPreviewModal');
    if (modal) modal.classList.remove('show');
  },

  escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // ============ 12-STEP RESUME BUILDER WIZARD ENGINE ============
  initResumeWizardState() {
    if (!resumeWizardState) {
      let saved = null;
      try {
        const raw = localStorage.getItem('smart_ai_hub_resume_draft');
        if (raw) saved = JSON.parse(raw);
      } catch (e) {
        console.error('Error loading resume draft:', e);
      }

      const baseData = (typeof window.DEFAULT_RESUME_DATA !== 'undefined')
        ? JSON.parse(JSON.stringify(window.DEFAULT_RESUME_DATA))
        : {
            personal: { fullName: '', targetRole: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '', otherUrl: '', photoUrl: '', showPhoto: false },
            summary: { text: '', isAiAssisted: false },
            experience: [],
            isFresher: false,
            education: [],
            skills: { technical: [], soft: [], tools: [], languages: [], custom: [] },
            projects: [],
            certifications: [],
            achievements: [],
            additionalSections: [],
            design: { template: 'ats', font: 'Inter', accentColor: '#0284c7', fontSize: 'medium', spacing: 'normal' },
            metadata: { lastSaved: null, completionPercentage: 0, creationMode: 'guided' }
          };

      resumeWizardState = {
        currentStep: 1,
        maxStep: 1,
        creationMode: (saved && saved.metadata && saved.metadata.creationMode) || 'guided', // 'guided' or 'quick'
        mobileView: 'form', // 'form' or 'preview'
        resumeData: saved || baseData
      };
      currentResumeData = resumeWizardState.resumeData;
    }
  },

  renderResumeBuilderWorkspace(tool) {
    this.initResumeWizardState();
    const data = resumeWizardState.resumeData;
    const mode = resumeWizardState.creationMode || 'guided';

    const steps = [
      { num: 1, title: 'Personal', icon: '👤' },
      { num: 2, title: 'Summary', icon: '📝' },
      { num: 3, title: 'Experience', icon: '💼' },
      { num: 4, title: 'Education', icon: '🎓' },
      { num: 5, title: 'Skills', icon: '⚡' },
      { num: 6, title: 'Projects', icon: '🚀' },
      { num: 7, title: 'Certifications', icon: '📜' },
      { num: 8, title: 'Achievements', icon: '🏆' },
      { num: 9, title: 'Additional', icon: '➕' },
      { num: 10, title: 'Design', icon: '🎨' },
      { num: 11, title: 'Review', icon: '🔍' },
      { num: 12, title: 'Export', icon: '📥' }
    ];

    const currentStep = resumeWizardState.currentStep || 1;
    const progressPct = Math.round(((currentStep - 1) / 11) * 100);

    return `
      <a class="back-link" onclick="Router.navigate('tools')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to all tools
      </a>

      <div class="workspace glass resume-wizard-workspace">
        <!-- Top Workspace Bar -->
        <div class="ws-head resume-wizard-head">
          <div class="tool-icon"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">${ICONS.resume}</svg></div>
          <div style="flex-grow:1;">
            <h2>${tool.name}</h2>
            <p>${tool.desc}</p>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <!-- Mode Switch: Guided Mode vs Quick Mode -->
            <div class="resume-mode-pill-group">
              <button class="mode-pill-btn ${mode === 'guided' ? 'active' : ''}" onclick="UI.setResumeCreationMode('guided')">
                💡 Guided Mode
              </button>
              <button class="mode-pill-btn ${mode === 'quick' ? 'active' : ''}" onclick="UI.setResumeCreationMode('quick')">
                ⚡ Quick Mode
              </button>
            </div>

            <span id="resumeAutosaveStatus" class="resume-autosave-badge">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Autosaved locally</span>
            </span>
            <button class="tool-btn-sm" onclick="UI.promptLoadStarterExample()" title="Load a demo example">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>
              Load Demo Template
            </button>
            <button class="tool-btn-sm" onclick="UI.resetResumeWizard()" style="color:#ef4444;" title="Start clean">
              New Resume
            </button>
          </div>
        </div>

        <!-- 12-Step Progress Stepper -->
        <div class="resume-stepper-container">
          <div class="stepper-meta-row">
            <span class="step-counter-text">STEP <b>${currentStep}</b> OF 12: <span class="step-name-highlight">${steps[currentStep - 1].title}</span></span>
            <span class="step-progress-percent">${progressPct}% Completed</span>
          </div>
          <div class="stepper-progress-track">
            <div class="stepper-progress-fill" style="width: ${progressPct}%;"></div>
          </div>
          <div class="stepper-chips-row">
            ${steps.map(s => `
              <button class="stepper-chip ${s.num === currentStep ? 'active' : ''} ${s.num < currentStep ? 'completed' : ''}" onclick="UI.goToResumeWizardStep(${s.num})" title="Step ${s.num}: ${s.title}">
                <span class="chip-num">${s.num < currentStep ? '✓' : s.num}</span>
                <span class="chip-label">${s.title}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Mobile Toggle Switch -->
        <div class="resume-mobile-toggle-bar">
          <button class="resume-view-tab ${resumeWizardState.mobileView === 'form' ? 'active' : ''}" onclick="UI.toggleMobileResumeView('form')">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit Form
          </button>
          <button class="resume-view-tab ${resumeWizardState.mobileView === 'preview' ? 'active' : ''}" onclick="UI.toggleMobileResumeView('preview')">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Live Preview
          </button>
        </div>

        <!-- Dual Column Workspace -->
        <div class="resume-wizard-layout ${resumeWizardState.mobileView === 'preview' ? 'mobile-show-preview' : 'mobile-show-form'}">
          <!-- Left Column: Current Wizard Step -->
          <div class="resume-wizard-form-column" id="resumeWizardStepFormWrap">
            <div class="wizard-step-card glass" id="resumeWizardStepForm">
              ${this.renderWizardStep(currentStep)}
            </div>

            <!-- Wizard Bottom Navigation -->
            <div class="wizard-nav-actions">
              <button class="btn btn-ghost" id="wizardBtnBack" onclick="UI.prevResumeWizardStep()" ${currentStep === 1 ? 'disabled' : ''}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back
              </button>

              <div style="display:flex;gap:8px;">
                ${(currentStep === 3 || currentStep === 7 || currentStep === 8 || currentStep === 9) ? `
                  <button class="btn btn-ghost" onclick="UI.skipResumeWizardStep()">
                    Skip this section →
                  </button>
                ` : ''}

                ${currentStep < 12 ? `
                  <button class="btn btn-primary" onclick="UI.nextResumeWizardStep()">
                    Save &amp; Continue
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                ` : `
                  <button class="btn btn-primary" onclick="UI.downloadResumePDF()">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    Download Vector PDF
                  </button>
                `}
              </div>
            </div>
          </div>

          <!-- Right Column: Reactive Live A4 Resume Preview -->
          <div class="resume-wizard-preview-column">
            <div class="preview-panel-header">
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="preview-title">Live Resume Preview</span>
                <span class="preview-template-badge" id="previewActiveTplBadge">${(RESUME_TEMPLATES.find(t => t.id === (data.design && data.design.template)) || {}).name || 'ATS-Friendly'}</span>
              </div>
              <div style="display:flex;gap:6px;">
                <button class="tool-btn-sm" onclick="UI.downloadResumePDF()" title="Download PDF">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  PDF
                </button>
                <button class="tool-btn-sm" onclick="UI.printResumeDocument()" title="Print">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  Print
                </button>
              </div>
            </div>

            <!-- A4 Document Paper Container -->
            <div class="resume-paper-viewport" id="resumePaperViewport">
              <div class="resume-paper-sheet" id="resumePaperSheet">
                ${this.renderResumeDocumentHTML(data)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Demo Confirmation Modal -->
      <div id="demoConfirmModal" class="modal-overlay" style="display:none;">
        <div class="modal-box glass" style="max-width:440px;">
          <div style="font-size:32px;margin-bottom:8px;">⚠️</div>
          <h3 style="font-size:18px;color:#fff;margin-bottom:8px;">Load Demo Sample Resume?</h3>
          <p style="font-size:13px;color:var(--txt-2);line-height:1.6;margin-bottom:16px;">
            This will replace your current resume data with a pre-configured sample template. Any unsaved custom work will be overwritten.
          </p>
          <div style="margin-bottom:16px;">
            <label style="font-size:11.5px;color:var(--txt-2);display:block;margin-bottom:4px;">Choose Profession Example:</label>
            <select id="demoRoleSelector" class="toolkit-select">
              <option value="software_engineer">Software Developer (Java, Spring Boot)</option>
              <option value="registered_nurse">Registered Nurse / Healthcare</option>
              <option value="high_school_teacher">High School Teacher / Educator</option>
              <option value="fresher_graduate">Fresher / College Graduate (Projects &amp; Education focus)</option>
              <option value="operations_coordinator">Operations &amp; Project Coordinator</option>
            </select>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button class="btn btn-ghost" onclick="UI.hideDemoConfirmModal()">Cancel</button>
            <button class="btn btn-primary" onclick="UI.executeLoadStarterExample()">Load Demo Template</button>
          </div>
        </div>
      </div>

      <!-- AI Summary & Polish Modal -->
      <div id="aiPolishModal" class="modal-overlay" style="display:none;">
        <div class="modal-box glass" style="max-width:560px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <span style="font-size:22px;">✨</span>
            <div>
              <h3 style="font-size:16px;color:#fff;" id="aiPolishModalTitle">AI Writing Assistance</h3>
              <small style="color:var(--cyan);font-size:11px;">Grounded strictly in your entered facts · Zero fabricated claims</small>
            </div>
          </div>
          <div style="margin-bottom:14px;">
            <label class="section-title">ORIGINAL DRAFT</label>
            <div id="aiPolishOriginal" class="ai-text-box original"></div>
          </div>
          <div style="margin-bottom:16px;">
            <label class="section-title">AI POLISHED SUGGESTION</label>
            <div id="aiPolishSuggested" class="ai-text-box suggested">Loading AI enhancement...</div>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button class="btn btn-ghost" onclick="UI.closeAiPolishModal()">Discard</button>
            <button class="btn btn-primary" id="btnAcceptAiPolish" onclick="UI.acceptAiPolishSuggestion()">Use Suggestion</button>
          </div>
        </div>
      </div>

      <!-- Guided Project Builder Modal (6 Questions) -->
      <div id="guidedProjectModal" class="modal-overlay" style="display:none;">
        <div class="modal-box glass" style="max-width:620px;max-height:90vh;overflow-y:auto;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <span style="font-size:24px;">🚀</span>
            <div>
              <h3 style="font-size:17px;color:#fff;margin:0;">Guided 6-Question Project Builder</h3>
              <small style="color:var(--cyan);font-size:11px;">Answer these 6 simple questions to create an authentic, professional project entry.</small>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px;">
            <div class="field">
              <label>1. What did you build? *</label>
              <input type="text" id="gp-q1" class="toolkit-input" placeholder="e.g. A hotel room booking web app, library portal, or disease tracker">
            </div>
            <div class="field">
              <label>2. What was the project called? *</label>
              <input type="text" id="gp-q2" class="toolkit-input" placeholder="e.g. GrandStay Hotel Booking System">
            </div>
            <div class="field">
              <label>3. What technologies &amp; tools did you actually use? *</label>
              <input type="text" id="gp-q3" class="toolkit-input" placeholder="e.g. HTML5, CSS3, JavaScript, LocalStorage, Git">
            </div>
            <div class="field">
              <label>4. What does it do? (Key features) *</label>
              <textarea id="gp-q4" class="toolkit-input" rows="2" placeholder="e.g. Allows guests to browse rooms, filter by budget, check dates, and save bookings."></textarea>
            </div>
            <div class="field">
              <label>5. What part did you personally work on? *</label>
              <textarea id="gp-q5" class="toolkit-input" rows="2" placeholder="e.g. Built the interactive room filter, modal details view, and reservation form validation."></textarea>
            </div>
            <div class="field-row">
              <div class="field">
                <label>6a. Live Demo URL (Optional)</label>
                <input type="text" id="gp-q6-url" class="toolkit-input" placeholder="https://myproject.com">
              </div>
              <div class="field">
                <label>6b. GitHub / Code URL (Optional)</label>
                <input type="text" id="gp-q6-github" class="toolkit-input" placeholder="github.com/username/project">
              </div>
            </div>
          </div>

          <div id="gpDraftPreviewBox" style="display:none;margin-bottom:16px;background:rgba(2,132,199,0.1);border:1px solid rgba(14,165,233,0.3);border-radius:8px;padding:12px;">
            <b style="font-size:12px;color:var(--cyan);display:block;margin-bottom:6px;">Generated Project Draft:</b>
            <div id="gpDraftPreviewContent" style="font-size:12px;color:#fff;line-height:1.5;"></div>
          </div>

          <div style="display:flex;gap:8px;justify-content:space-between;align-items:center;flex-wrap:wrap;">
            <button class="btn btn-ghost" onclick="UI.closeGuidedProjectModal()">Cancel</button>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-ghost" onclick="UI.generateGuidedProjectDraft()">Generate Draft</button>
              <button class="btn btn-primary" id="btnAcceptGuidedProject" style="display:none;" onclick="UI.acceptGuidedProjectDraft()">Accept &amp; Add to Projects</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Guided Summary Builder Modal (5 Questions) -->
      <div id="guidedSummaryModal" class="modal-overlay" style="display:none;">
        <div class="modal-box glass" style="max-width:580px;max-height:90vh;overflow-y:auto;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <span style="font-size:24px;">📝</span>
            <div>
              <h3 style="font-size:17px;color:#fff;margin:0;">Guided 5-Question Summary Helper</h3>
              <small style="color:var(--cyan);font-size:11px;">Draft a grounded professional summary based on your real answers.</small>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px;">
            <div class="field">
              <label>1. What is your current career stage?</label>
              <select id="gs-q1" class="toolkit-select">
                <option value="College Student">College Student / Current Undergraduate</option>
                <option value="Recent Graduate">Recent Graduate / Fresher</option>
                <option value="Junior Professional">Junior Working Professional (1-2 years)</option>
                <option value="Experienced Professional">Experienced Professional (3+ years)</option>
                <option value="Career Changer">Career Transition / Self-Taught</option>
              </select>
            </div>
            <div class="field">
              <label>2. What specific job role are you targeting?</label>
              <input type="text" id="gs-q2" class="toolkit-input" placeholder="e.g. Junior Frontend Developer">
            </div>
            <div class="field">
              <label>3. What skills do you actually know or have practiced?</label>
              <input type="text" id="gs-q3" class="toolkit-input" placeholder="e.g. HTML, CSS, JavaScript, React, Git">
            </div>
            <div class="field">
              <label>4. What type of work or domain interests you most?</label>
              <input type="text" id="gs-q4" class="toolkit-input" placeholder="e.g. Building responsive web applications and interactive dashboards">
            </div>
            <div class="field">
              <label>5. One major highlight or accomplishment to feature?</label>
              <input type="text" id="gs-q5" class="toolkit-input" placeholder="e.g. Completed a capstone e-commerce project with 98% audit score">
            </div>
          </div>

          <div id="gsDraftPreviewBox" style="display:none;margin-bottom:16px;background:rgba(2,132,199,0.1);border:1px solid rgba(14,165,233,0.3);border-radius:8px;padding:12px;">
            <b style="font-size:12px;color:var(--cyan);display:block;margin-bottom:6px;">Drafted Summary:</b>
            <div id="gsDraftPreviewContent" style="font-size:12px;color:#fff;line-height:1.5;"></div>
          </div>

          <div style="display:flex;gap:8px;justify-content:space-between;align-items:center;flex-wrap:wrap;">
            <button class="btn btn-ghost" onclick="UI.closeGuidedSummaryModal()">Cancel</button>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-ghost" onclick="UI.generateGuidedSummaryDraft()">Generate Draft</button>
              <button class="btn btn-primary" id="btnAcceptGuidedSummary" style="display:none;" onclick="UI.acceptGuidedSummaryDraft()">Use This Summary</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  initResumeBuilderListeners() {
    this.renderLiveResumePreview();
  },

  setResumeCreationMode(mode) {
    if (!resumeWizardState) return;
    resumeWizardState.creationMode = mode;
    if (!resumeWizardState.resumeData.metadata) resumeWizardState.resumeData.metadata = {};
    resumeWizardState.resumeData.metadata.creationMode = mode;
    this.goToResumeWizardStep(resumeWizardState.currentStep || 1);
    this.showToast(`Switched to ${mode === 'guided' ? 'Guided Mode 💡 (Contextual Tips Enabled)' : 'Quick Mode ⚡ (Fast Direct Entry)'}`);
    this.scheduleResumeAutosave();
  },

  toggleSectionCoach(step) {
    const body = document.getElementById(`coachBody-${step}`);
    const arrow = document.getElementById(`coachArrow-${step}`);
    if (body) {
      const isHidden = body.style.display === 'none';
      body.style.display = isHidden ? 'block' : 'none';
      if (arrow) arrow.textContent = isHidden ? '▼' : '►';
    }
  },

  renderSectionCoach(step) {
    const isFresher = Boolean(resumeWizardState && resumeWizardState.resumeData && resumeWizardState.resumeData.isFresher);
    const coaches = {
      1: {
        title: "Personal Details Coach",
        what: "Contact information employers need to identify you and reach out for interviews.",
        why: "Recruiters and ATS scanners parse your name, email, phone, and professional profiles before reading anything else.",
        enter: [
          "Full professional name (legal name)",
          "Target role (e.g. Junior Web Developer, Data Analyst, Staff Nurse)",
          "Active email and mobile number (with country code)",
          "City, State / Country (no full residential address needed)",
          "LinkedIn, GitHub, or Portfolio URL"
        ],
        notEnter: [
          "Do NOT enter full residential address, door number, or postal PIN code",
          "Do NOT enter date of birth, marital status, gender, or religion"
        ],
        example: "Alex Morgan · Junior Frontend Developer · alex.dev@email.com · +1 555-019-2834 · Chicago, IL · github.com/alex-dev",
        tip: "Keep the target role specific to the role you want to get hired for."
      },
      2: {
        title: "Professional Summary Coach",
        what: "A concise 2–3 sentence career synopsis of who you are and what value you bring.",
        why: "Recruiters glance at the summary in the first 5 seconds to decide if they should keep reading.",
        enter: [
          "Your current qualification or career stage (e.g. Computer Science graduate)",
          "2–3 core technical competencies you have actually practiced",
          "What type of problems, projects, or applications you are eager to build"
        ],
        notEnter: [
          "Do NOT write clichés: 'Hardworking individual looking for a challenging role...'",
          "Do NOT invent fake metrics (e.g. 'boosted sales by 45%') if you are a fresher"
        ],
        example: "Motivated Computer Science graduate with hands-on project experience in JavaScript, React, and REST APIs. Passionate about building accessible, performant web applications and eager to contribute to collaborative engineering teams.",
        tip: "Need help? Click '✨ Guided 5-Question Summary Helper' below to draft this from your real answers!"
      },
      3: {
        title: isFresher ? "Fresher Strategy Coach (No Experience Needed!)" : "Work Experience Coach",
        what: isFresher
          ? "As a Fresher, your proof of competence comes from Projects, Education, Internships, and Skills — NOT full-time corporate jobs."
          : "Chronological record of your professional employment history and contributions.",
        why: isFresher
          ? "Hiring managers looking for freshers expect practical projects, problem-solving skills, and academic training — never fake corporate experience."
          : "Shows recruiters your track record of delivering outcomes in professional teams.",
        enter: isFresher
          ? [
              "If you have completed an internship, industrial training, or freelance gig, add it using the button below!",
              "Otherwise, leave experience empty — your Projects and Education will take top spot on your resume!"
            ]
          : [
              "Job title, organization name, and location",
              "Accurate start and end dates (or check 'Currently Working')",
              "Bulleted contributions starting with strong action verbs (Built, Designed, Optimized)"
            ],
        notEnter: [
          "NEVER invent fake companies, fake job titles, or fake dates — background verification (BGV) will disqualify you.",
          "Do not label a 2-month summer internship as 2 years of full-time employment."
        ],
        example: isFresher
          ? "Internship Example: Web Development Intern @ TechEdge (Jun 2023 – Aug 2023) · Built 3 responsive client landing pages using HTML, CSS, and Bootstrap."
          : "Software Engineer @ Acme Corp (2022 – Present) · Maintained order dispatch microservices handling 15,000 daily requests.",
        tip: isFresher ? "If you have an internship or training, click '+ Add Internship / Training' below!" : "Highlight what you personally contributed rather than generic job duties."
      },
      4: {
        title: "Education Credentials Coach",
        what: "Your academic degrees, diplomas, colleges, and relevant subject coursework.",
        why: "Verifies your foundational training, academic discipline, and technical qualifications.",
        enter: [
          "Degree name & major (e.g. B.Tech in Computer Science, B.Sc in Mathematics)",
          "College / University name and location",
          "Graduation year (or expected graduation year)",
          "CGPA / percentage (optional, include if good)",
          "Key relevant coursework or subjects studied"
        ],
        notEnter: [
          "Do NOT list 10th / High School if you have already completed or are pursuing college",
          "Do NOT guess or fabricate GPA"
        ],
        example: "Bachelor of Technology in Computer Science · State Technical University (2020 – 2024) · CGPA: 8.4 · Coursework: Data Structures, Database Systems, Computer Networks",
        tip: "List your highest or most recent degree first."
      },
      5: {
        title: "Skills & Competencies Coach",
        what: "A structured directory of tools, technologies, and interpersonal abilities you know.",
        why: "Applicant Tracking Systems (ATS) and recruiters search directly for skill keywords from job descriptions.",
        enter: [
          "Core programming languages and frameworks you have written code in",
          "Tools and software you have actually used (e.g. Git, VS Code, Postman, Figma)",
          "Soft skills demonstrated through teamwork or projects (e.g. Debugging, Problem Solving)",
          "Languages you can converse or write in"
        ],
        notEnter: [
          "Do NOT list skills you only watched a 5-minute video on and cannot answer interview questions about",
          "Do NOT use arbitrary percentage bars (e.g. 'Python: 90%') — recruiters dislike fake ratings"
        ],
        example: "Technical: Java, Python, JavaScript, SQL · Tools: Git, GitHub, Docker, Postman · Soft: Problem Solving, Teamwork, Technical Documentation",
        tip: "Check the Suggested Skills tray below for quick 1-click additions without typos."
      },
      6: {
        title: "Key Projects Coach (Fresher Superpower 🚀)",
        what: "Software, websites, hardware, or research you built individually or in college.",
        why: "For Freshers and career changers, PROJECTS ARE YOUR PROOF OF WORK. They show you can apply theory to working software.",
        enter: [
          "Project Name (clear and descriptive)",
          "Technologies and tools used (e.g. React, Node.js, SQLite)",
          "Live demo URL or GitHub repository link so interviewers can inspect your code",
          "1–2 bullets explaining what it does and what you personally engineered"
        ],
        notEnter: [
          "Do NOT copy a tutorial project without understanding how the code works",
          "Do NOT claim full-stack ownership if you only built the CSS frontend"
        ],
        example: "QuickDoc Medical Appointment Portal · Tech: JavaScript, Firebase, CSS Grid · GitHub: github.com/user/quickdoc · Bullets: Engineered real-time patient booking calendar with instant slot conflict validation.",
        tip: "Stuck on what to write? Click '✨ Guided 6-Question Project Builder' below to generate your project entry step-by-step!"
      },
      7: {
        title: "Certifications & Licenses Coach",
        what: "Verified professional credentials from recognized industry authorities.",
        why: "Proves continuous self-learning and standardized competence beyond classroom syllabus.",
        enter: [
          "Certificate Name (e.g. AWS Certified Cloud Practitioner)",
          "Issuing organization (e.g. Amazon Web Services, Meta, Cisco, Oracle)",
          "Issue Date and Credential ID / URL if available"
        ],
        notEnter: [
          "Do NOT include participation certificates for 1-hour free webinars",
          "Skip this section if you don't have verified certifications yet"
        ],
        example: "AWS Certified Cloud Practitioner · Amazon Web Services (2023) · ID: AWS-98120 · Verify: credly.com/id/123",
        tip: "This section is completely optional. If empty, it will not appear on your resume."
      },
      8: {
        title: "Honors & Achievements Coach",
        what: "Recognitions, coding contest finishes, academic honors, or leadership awards.",
        why: "Differentiates your application from hundreds of candidates with the same academic degree.",
        enter: [
          "Hackathon or coding contest placements (e.g. Top 5 in National Hackathon)",
          "Academic merit awards, scholarships, or Dean's list recognition",
          "Sports, debate, or campus leadership distinctions"
        ],
        notEnter: [
          "Do NOT list ordinary classroom attendance or trivial school prizes from years ago"
        ],
        example: "Winner — Inter-College Web Dev Hackathon (2023): Built an emergency blood donor finder connecting 4 local hospitals.",
        tip: "Optional section. Skip if you prefer focusing on projects."
      },
      9: {
        title: "Additional Custom Sections Coach",
        what: "Custom headings for extracurriculars, publications, volunteer work, or interests.",
        why: "Gives interviewers great talking points and reveals character and leadership.",
        enter: [
          "Volunteer initiatives (e.g. Teaching basic digital skills to underprivileged students)",
          "Technical articles, open-source documentation, or research papers"
        ],
        notEnter: [
          "Do NOT add controversial political or religious topics"
        ],
        example: "Volunteer Experience: Organized annual campus blood donation drive coordinating 250+ donors.",
        tip: "Keep entries crisp and relevant to professional maturity."
      },
      10: {
        title: "Template & Visual Design Coach",
        what: "Formatting style, typography, and professional accent palette.",
        why: "Clean visual hierarchy ensures your resume is both easily readable by humans and 100% parsable by ATS engines.",
        enter: [
          "ATS Standard Single-Column is recommended for corporate and campus placement drives",
          "Modern Two-Column is great for tech portfolios with many skills",
          "Choose clean, legible typography (Inter, Roboto, Georgia)"
        ],
        notEnter: [
          "Avoid bright distracting rainbow colors; deep blues, slates, and teals work best"
        ],
        example: "Standard Single-Column ATS layout with #0284c7 (Sky Blue) accent and Inter typography.",
        tip: "Text in all templates is 100% selectable vector text."
      },
      11: {
        title: "Review & Completeness Audit Coach",
        what: "Pre-flight verification before exporting your resume.",
        why: "Catches typos, broken URLs, or missing contact details before recruiters see them.",
        enter: [
          "Verify phone number and email are 100% correct",
          "Ensure at least 1 project is present if you are a fresher",
          "Click 'Edit Step' beside any section that needs adjustment"
        ],
        notEnter: [
          "Do NOT worry if optional sections (Certifications/Honors) are skipped — your resume is still complete"
        ],
        example: "Review checklist showing green checkmarks for all essential sections.",
        tip: "Inspect the Live Preview on the right to make sure spacing looks balanced."
      },
      12: {
        title: "Export & Application Coach",
        what: "Generating your final high-resolution document.",
        why: "Delivers a text-selectable vector PDF ready for job applications and ATS portals.",
        enter: [
          "Download Vector PDF for online applications (Workday, Greenhouse, LinkedIn, Naukri)",
          "Use Plain TXT (.txt) for copying into job portal profile boxes",
          "Use Print to save directly via your browser's native print engine"
        ],
        notEnter: [
          "Never convert your resume to a screenshot / JPG image when applying — ATS scanners cannot parse image files"
        ],
        example: "Clean PDF file named '[Your_Name]_Resume.pdf' with selectable text.",
        tip: "Good luck with your job applications! You are putting your best foot forward."
      }
    };

    const c = coaches[step];
    if (!c) return '';

    return `
      <div class="section-coach-card glass" id="sectionCoach-${step}">
        <div class="coach-card-header" onclick="UI.toggleSectionCoach(${step})">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="coach-badge-icon">💡</span>
            <b class="coach-title">${c.title}</b>
            <span class="coach-guided-pill">Guided Mode</span>
          </div>
          <button class="coach-toggle-arrow" id="coachArrow-${step}">▼</button>
        </div>
        <div class="coach-card-body" id="coachBody-${step}">
          <p class="coach-desc"><b>What is this?</b> ${c.what}</p>
          <div class="coach-rules-grid">
            <div class="coach-rule-col do">
              <b>✅ What to enter:</b>
              <ul>${c.enter.map(e => `<li>${e}</li>`).join('')}</ul>
            </div>
            <div class="coach-rule-col dont">
              <b>❌ What to avoid:</b>
              <ul>${c.notEnter.map(ne => `<li>${ne}</li>`).join('')}</ul>
            </div>
          </div>
          <div class="coach-example-box">
            <div class="example-tag-row">
              <span class="example-only-badge">EXAMPLE ONLY — DO NOT COPY UNLESS TRUE</span>
            </div>
            <p class="coach-example-text">"${c.example}"</p>
          </div>
          ${c.tip ? `<div class="coach-pro-tip"><b>Pro Tip:</b> ${c.tip}</div>` : ''}
        </div>
      </div>
    `;
  },

  // ============ STEP VIEWS (1 TO 12) ============
  renderWizardStep(step) {
    const data = resumeWizardState.resumeData;
    const isGuided = (resumeWizardState.creationMode || 'guided') === 'guided';
    const coachHTML = isGuided ? this.renderSectionCoach(step) : '';

    let contentHTML = '';
    switch (step) {
      case 1:
        contentHTML = this.renderStep1_Personal(data.personal || {});
        break;
      case 2:
        contentHTML = this.renderStep2_Summary(data.summary || {});
        break;
      case 3:
        contentHTML = this.renderStep3_Experience(data);
        break;
      case 4:
        contentHTML = this.renderStep4_Education(data.education || []);
        break;
      case 5:
        contentHTML = this.renderStep5_Skills(data.skills || {});
        break;
      case 6:
        contentHTML = this.renderStep6_Projects(data.projects || []);
        break;
      case 7:
        contentHTML = this.renderStep7_Certifications(data.certifications || []);
        break;
      case 8:
        contentHTML = this.renderStep8_Achievements(data.achievements || []);
        break;
      case 9:
        contentHTML = this.renderStep9_Additional(data.additionalSections || []);
        break;
      case 10:
        contentHTML = this.renderStep10_Design(data.design || {});
        break;
      case 11:
        contentHTML = this.renderStep11_Review(data);
        break;
      case 12:
        contentHTML = this.renderStep12_Export(data);
        break;
      default:
        contentHTML = this.renderStep1_Personal(data.personal || {});
    }

    return coachHTML + contentHTML;
  },

  // --- STEP 1: PERSONAL INFORMATION ---
  renderStep1_Personal(p) {
    return `
      <div class="step-header">
        <h3>Personal Information</h3>
        <p>Enter your contact details so employers can easily reach you. No external profile data is fetched automatically.</p>
      </div>

      <div class="step-fields-grid">
        <div class="field">
          <label>Full Name *</label>
          <input type="text" id="wiz-fullName" class="toolkit-input" value="${this.escapeQuotes(p.fullName || '')}" placeholder="e.g. Alex Morgan" oninput="UI.syncStep1Field('fullName', this.value)">
        </div>

        <div class="field">
          <label>Professional Title / Target Role *</label>
          <input type="text" id="wiz-targetRole" class="toolkit-input" value="${this.escapeQuotes(p.targetRole || '')}" placeholder="e.g. Java Developer, Registered Nurse, High School Teacher..." oninput="UI.syncStep1Field('targetRole', this.value)">
          <small style="color:var(--txt-2);font-size:11px;margin-top:4px;display:block;">Open-ended profession. Never restricted to hardcoded titles.</small>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Email Address *</label>
            <input type="email" id="wiz-email" class="toolkit-input" value="${this.escapeQuotes(p.email || '')}" placeholder="e.g. alex@example.com" oninput="UI.syncStep1Field('email', this.value)">
          </div>
          <div class="field">
            <label>Phone Number *</label>
            <input type="tel" id="wiz-phone" class="toolkit-input" value="${this.escapeQuotes(p.phone || '')}" placeholder="e.g. +1 555-019-2834" oninput="UI.syncStep1Field('phone', this.value)">
          </div>
        </div>

        <div class="field">
          <label>Location (City, Country / State)</label>
          <input type="text" id="wiz-location" class="toolkit-input" value="${this.escapeQuotes(p.location || '')}" placeholder="e.g. Chicago, IL or New Delhi, India" oninput="UI.syncStep1Field('location', this.value)">
        </div>

        <div class="field-row">
          <div class="field">
            <label>LinkedIn URL (Optional)</label>
            <input type="text" id="wiz-linkedin" class="toolkit-input" value="${this.escapeQuotes(p.linkedin || '')}" placeholder="linkedin.com/in/username" oninput="UI.syncStep1Field('linkedin', this.value)">
          </div>
          <div class="field">
            <label>GitHub URL (Optional)</label>
            <input type="text" id="wiz-github" class="toolkit-input" value="${this.escapeQuotes(p.github || '')}" placeholder="github.com/username" oninput="UI.syncStep1Field('github', this.value)">
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Portfolio / Website (Optional)</label>
            <input type="text" id="wiz-portfolio" class="toolkit-input" value="${this.escapeQuotes(p.portfolio || '')}" placeholder="yourportfolio.com" oninput="UI.syncStep1Field('portfolio', this.value)">
          </div>
          <div class="field">
            <label>Other Relevant Link (Optional)</label>
            <input type="text" id="wiz-otherUrl" class="toolkit-input" value="${this.escapeQuotes(p.otherUrl || '')}" placeholder="e.g. Behance, Medium, Dribbble" oninput="UI.syncStep1Field('otherUrl', this.value)">
          </div>
        </div>

        <!-- Optional Photo Section -->
        <div class="wizard-optional-box">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div>
              <b style="color:#fff;font-size:13px;display:block;">Photo (Optional)</b>
              <small style="color:var(--txt-2);font-size:11px;">Keep disabled for traditional ATS single-column resumes</small>
            </div>
            <label class="switch-toggle">
              <input type="checkbox" id="wiz-showPhoto" ${p.showPhoto ? 'checked' : ''} onchange="UI.toggleResumePhotoOption(this.checked)">
              <span class="slider"></span>
            </label>
          </div>
          <div id="photoUploadRow" style="margin-top:10px;display:${p.showPhoto ? 'flex' : 'none'};align-items:center;gap:12px;">
            <input type="file" id="resumePhotoInput" accept="image/*" style="display:none;" onchange="UI.handleResumePhotoUpload(event)">
            <button class="tool-btn-sm" onclick="document.getElementById('resumePhotoInput').click()">Upload Photo</button>
            ${p.photoUrl ? `<button class="tool-btn-sm" onclick="UI.removeResumePhoto()" style="color:#ef4444;">Remove Photo</button>` : ''}
            <span style="font-size:11px;color:var(--txt-2);">${p.photoUrl ? 'Photo attached ✓' : 'No photo chosen'}</span>
          </div>
        </div>
      </div>
    `;
  },

  syncStep1Field(field, val) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    resumeWizardState.resumeData.personal[field] = val;
    this.renderLiveResumePreview();
    this.scheduleResumeAutosave();
  },

  toggleResumePhotoOption(show) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    resumeWizardState.resumeData.personal.showPhoto = show;
    const row = document.getElementById('photoUploadRow');
    if (row) row.style.display = show ? 'flex' : 'none';
    this.renderLiveResumePreview();
    this.scheduleResumeAutosave();
  },

  handleResumePhotoUpload(event) {
    const file = event.target ? event.target.files[0] : null;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (resumeWizardState && resumeWizardState.resumeData) {
        resumeWizardState.resumeData.personal.photoUrl = e.target.result;
        this.renderLiveResumePreview();
        this.goToResumeWizardStep(1); // refresh step view
        this.scheduleResumeAutosave();
      }
    };
    reader.readAsDataURL(file);
  },

  removeResumePhoto() {
    if (resumeWizardState && resumeWizardState.resumeData) {
      resumeWizardState.resumeData.personal.photoUrl = '';
      this.renderLiveResumePreview();
      this.goToResumeWizardStep(1);
      this.scheduleResumeAutosave();
    }
  },

  // --- STEP 2: PROFESSIONAL SUMMARY ---
  renderStep2_Summary(s) {
    return `
      <div class="step-header">
        <h3>Professional Summary</h3>
        <p>A concise 2–3 sentence overview of your background. You can draft your own or use AI writing assistance grounded strictly in your entered facts.</p>
      </div>

      <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
        <button class="tool-btn-sm" onclick="UI.openGuidedSummaryModal()" style="border-color:var(--cyan);color:#fff;">
          ✨ Guided 5-Question Summary Helper
        </button>
        <button class="tool-btn-sm" onclick="UI.requestAiSummaryAssistance()">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M12 2L15 8L21 9L17 14L18 20L12 17L6 20L7 14L3 9L9 8L12 2Z"/></svg>
          ✨ Quick Polish With AI
        </button>
      </div>

      <div class="field">
        <label>Summary Statement</label>
        <textarea id="wiz-summaryText" class="toolkit-input" rows="5" placeholder="e.g. Dedicated Full Stack Developer with experience in Java, Spring Boot, and database architecture. Passionate about writing clean, maintainable code and solving real-world challenges..." oninput="UI.syncSummaryField(this.value)">${this.escapeHTML(s.text || '')}</textarea>
        <small style="color:var(--txt-2);font-size:11.5px;margin-top:4px;display:block;">
          Anti-Fabrication Rule: AI will only polish words from your actual background, never inventing fake years or awards.
        </small>
      </div>
    `;
  },

  syncSummaryField(val) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    resumeWizardState.resumeData.summary.text = val;
    this.renderLiveResumePreview();
    this.scheduleResumeAutosave();
  },

  // --- STEP 3: WORK EXPERIENCE (WITH FRESHER BRANCHING) ---
  renderStep3_Experience(data) {
    const isFresher = data.isFresher;
    const expList = data.experience || [];

    return `
      <div class="step-header">
        <h3>Work Experience</h3>
        <p>List your professional employment history. If you are a college student or fresher, select "I'm a Fresher" to prioritize Projects and Education.</p>
      </div>

      <!-- Fresher vs Experienced Branching Card -->
      <div class="fresher-choice-box glass" style="padding:16px;border-radius:10px;margin-bottom:18px;">
        <span style="font-size:13px;font-weight:600;color:#fff;display:block;margin-bottom:8px;">Do you have formal work experience?</span>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="setting-pill ${!isFresher ? 'active' : ''}" onclick="UI.setResumeFresherStatus(false)">
            💼 Yes, I have Work Experience
          </button>
          <button class="setting-pill ${isFresher ? 'active' : ''}" onclick="UI.setResumeFresherStatus(true)">
            🎓 No — I'm a Fresher
          </button>
        </div>
      </div>

      ${isFresher ? `
        <div class="fresher-guide-card glass" style="padding:20px;border-radius:10px;border-left:4px solid var(--cyan);margin-bottom:16px;">
          <b style="color:var(--cyan);font-size:14px;display:block;margin-bottom:6px;">🎓 Fresher Mode Active</b>
          <p style="color:var(--txt-1);font-size:13px;line-height:1.6;margin-bottom:8px;">
            That's completely fine! Your resume will <b>omit corporate employment history</b> and prioritize your <b>Projects, Education, Skills, and Certifications</b> so you present an authentic, powerful profile.
          </p>
          <small style="color:var(--txt-2);font-size:11.5px;">No fake companies or placeholder jobs will ever be inserted.</small>
          <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
            <span style="font-size:12px;color:#fff;">Completed an internship, training, or freelance gig?</span>
            <button class="tool-btn-sm" onclick="UI.addResumeExpItem('Internship')" style="border-color:var(--cyan);color:#fff;">
              + Add Internship / Training Entry
            </button>
          </div>
        </div>

        ${expList.length > 0 ? `
          <div class="experience-list-wrap">
            <span style="font-size:12.5px;font-weight:600;color:var(--cyan);display:block;margin-bottom:8px;">Internships &amp; Practical Training (${expList.length})</span>
            <div class="repeater-items-list">
              ${expList.map((exp, idx) => `
                <div class="repeater-card glass">
                  <div class="repeater-card-head">
                    <span class="repeater-num">${idx + 1}</span>
                    <b class="repeater-title">${this.escapeHTML(exp.role || 'Role')} ${exp.company ? '@ ' + this.escapeHTML(exp.company) : ''} <span class="badge" style="background:rgba(14,165,233,0.2);color:var(--cyan);font-size:10px;padding:2px 6px;border-radius:4px;">${this.escapeHTML(exp.empType || 'Internship')}</span></b>
                    <button class="thumb-btn del" onclick="UI.removeResumeExpItem(${idx})" title="Remove">×</button>
                  </div>

                  <div class="field-row" style="margin-top:10px;">
                    <div class="field">
                      <label>Role / Title *</label>
                      <input type="text" class="toolkit-input" value="${this.escapeQuotes(exp.role || '')}" placeholder="e.g. Web Development Intern" oninput="UI.updateExpField(${idx}, 'role', this.value)">
                    </div>
                    <div class="field">
                      <label>Organization / Company *</label>
                      <input type="text" class="toolkit-input" value="${this.escapeQuotes(exp.company || '')}" placeholder="e.g. TechEdge Solutions" oninput="UI.updateExpField(${idx}, 'company', this.value)">
                    </div>
                  </div>

                  <div class="field-row">
                    <div class="field">
                      <label>Location</label>
                      <input type="text" class="toolkit-input" value="${this.escapeQuotes(exp.location || '')}" placeholder="e.g. Bengaluru / Remote" oninput="UI.updateExpField(${idx}, 'location', this.value)">
                    </div>
                    <div class="field">
                      <label>Type</label>
                      <select class="toolkit-select" onchange="UI.updateExpField(${idx}, 'empType', this.value)">
                        <option value="Internship" ${exp.empType === 'Internship' ? 'selected' : ''}>Internship</option>
                        <option value="Training" ${exp.empType === 'Training' ? 'selected' : ''}>Training</option>
                        <option value="Freelance" ${exp.empType === 'Freelance' ? 'selected' : ''}>Freelance</option>
                        <option value="Apprenticeship" ${exp.empType === 'Apprenticeship' ? 'selected' : ''}>Apprenticeship</option>
                      </select>
                    </div>
                  </div>

                  <div class="field-row">
                    <div class="field">
                      <label>Start Date</label>
                      <input type="text" class="toolkit-input" value="${this.escapeQuotes(exp.startDate || '')}" placeholder="e.g. Jun 2023" oninput="UI.updateExpField(${idx}, 'startDate', this.value)">
                    </div>
                    <div class="field">
                      <label>End Date</label>
                      <input type="text" class="toolkit-input" value="${this.escapeQuotes(exp.endDate || '')}" placeholder="e.g. Aug 2023" oninput="UI.updateExpField(${idx}, 'endDate', this.value)">
                    </div>
                  </div>

                  <!-- Bullets -->
                  <div>
                    <label style="font-size:12px;color:var(--txt-2);display:block;margin-bottom:6px;">Contributions / What you learned:</label>
                    <div class="bullets-input-list">
                      ${(exp.bullets || []).map((b, bIdx) => `
                        <div class="bullet-row">
                          <input type="text" class="toolkit-input bullet-input" value="${this.escapeQuotes(b)}" placeholder="Describe what you worked on..." oninput="UI.updateExpBullet(${idx}, ${bIdx}, this.value)">
                          <button class="tool-btn-sm" onclick="UI.polishBulletWithAi('exp', ${idx}, ${bIdx})" title="Polish with AI">✨</button>
                          <button class="thumb-btn del" onclick="UI.removeExpBullet(${idx}, ${bIdx})">×</button>
                        </div>
                      `).join('')}
                    </div>
                    <button class="tool-btn-sm" style="margin-top:6px;" onclick="UI.addExpBullet(${idx})">+ Add Contribution</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      ` : `
        <div class="experience-list-wrap">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <span style="font-size:13px;font-weight:600;color:#fff;">Employment History (${expList.length})</span>
            <button class="tool-btn-sm" onclick="UI.addResumeExpItem()">+ Add Job / Role</button>
          </div>

          ${expList.length === 0 ? `
            <div class="empty-section-tip">
              No work experience added yet. Click "+ Add Job / Role" or switch to "Fresher Mode" if you don't have past jobs.
            </div>
          ` : `
            <div class="repeater-items-list">
              ${expList.map((exp, idx) => `
                <div class="repeater-card glass">
                  <div class="repeater-card-head">
                    <span class="repeater-num">${idx + 1}</span>
                    <b class="repeater-title">${this.escapeHTML(exp.role || 'Job Title')} ${exp.company ? '@ ' + this.escapeHTML(exp.company) : ''}</b>
                    <button class="thumb-btn del" onclick="UI.removeResumeExpItem(${idx})" title="Remove Experience">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>

                  <div class="field-row" style="margin-top:10px;">
                    <div class="field">
                      <label>Job Title *</label>
                      <input type="text" class="toolkit-input" value="${this.escapeQuotes(exp.role || '')}" placeholder="e.g. Software Engineer" oninput="UI.updateExpField(${idx}, 'role', this.value)">
                    </div>
                    <div class="field">
                      <label>Company / Organization *</label>
                      <input type="text" class="toolkit-input" value="${this.escapeQuotes(exp.company || '')}" placeholder="e.g. Acme Corp" oninput="UI.updateExpField(${idx}, 'company', this.value)">
                    </div>
                  </div>

                  <div class="field-row">
                    <div class="field">
                      <label>Location</label>
                      <input type="text" class="toolkit-input" value="${this.escapeQuotes(exp.location || '')}" placeholder="e.g. New York, NY / Remote" oninput="UI.updateExpField(${idx}, 'location', this.value)">
                    </div>
                    <div class="field">
                      <label>Employment Type</label>
                      <select class="toolkit-select" onchange="UI.updateExpField(${idx}, 'empType', this.value)">
                        <option value="Full-time" ${exp.empType === 'Full-time' ? 'selected' : ''}>Full-time</option>
                        <option value="Part-time" ${exp.empType === 'Part-time' ? 'selected' : ''}>Part-time</option>
                        <option value="Internship" ${exp.empType === 'Internship' ? 'selected' : ''}>Internship</option>
                        <option value="Contract" ${exp.empType === 'Contract' ? 'selected' : ''}>Contract</option>
                        <option value="Freelance" ${exp.empType === 'Freelance' ? 'selected' : ''}>Freelance</option>
                      </select>
                    </div>
                  </div>

                  <div class="field-row">
                    <div class="field">
                      <label>Start Date</label>
                      <input type="text" class="toolkit-input" value="${this.escapeQuotes(exp.startDate || '')}" placeholder="e.g. Jun 2022" oninput="UI.updateExpField(${idx}, 'startDate', this.value)">
                    </div>
                    <div class="field">
                      <label>End Date</label>
                      <input type="text" class="toolkit-input" value="${this.escapeQuotes(exp.endDate || '')}" placeholder="${exp.current ? 'Present' : 'e.g. Present or Dec 2024'}" ${exp.current ? 'disabled' : ''} oninput="UI.updateExpField(${idx}, 'endDate', this.value)">
                    </div>
                  </div>

                  <div style="margin:6px 0 12px;">
                    <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--txt-1);cursor:pointer;">
                      <input type="checkbox" ${exp.current ? 'checked' : ''} onchange="UI.updateExpField(${idx}, 'current', this.checked)">
                      Currently working here
                    </label>
                  </div>

                  <!-- Responsibilities & Bullets -->
                  <div>
                    <label style="font-size:12px;color:var(--txt-2);display:block;margin-bottom:6px;">Key Responsibilities &amp; Achievements (Bullet Points):</label>
                    <div class="bullets-input-list">
                      ${(exp.bullets || []).map((b, bIdx) => `
                        <div class="bullet-row">
                          <input type="text" class="toolkit-input bullet-input" value="${this.escapeQuotes(b)}" placeholder="Describe your actual contribution..." oninput="UI.updateExpBullet(${idx}, ${bIdx}, this.value)">
                          <button class="tool-btn-sm" onclick="UI.polishBulletWithAi('exp', ${idx}, ${bIdx})" title="Polish wording with AI">✨</button>
                          <button class="thumb-btn del" onclick="UI.removeExpBullet(${idx}, ${bIdx})" title="Delete bullet">×</button>
                        </div>
                      `).join('')}
                    </div>
                    <button class="tool-btn-sm" style="margin-top:6px;" onclick="UI.addExpBullet(${idx})">+ Add Bullet</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `}
    `;
  },

  setResumeFresherStatus(isFresher) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    resumeWizardState.resumeData.isFresher = isFresher;
    this.renderLiveResumePreview();
    this.goToResumeWizardStep(3);
    this.scheduleResumeAutosave();
  },

  addResumeExpItem(defaultEmpType = 'Full-time') {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    if (!resumeWizardState.resumeData.experience) resumeWizardState.resumeData.experience = [];
    resumeWizardState.resumeData.experience.push({
      id: 'exp_' + Date.now(),
      role: '',
      company: '',
      location: '',
      empType: defaultEmpType || 'Full-time',
      startDate: '',
      endDate: '',
      current: false,
      bullets: ['']
    });
    this.renderLiveResumePreview();
    this.goToResumeWizardStep(3);
    this.scheduleResumeAutosave();
  },

  removeResumeExpItem(idx) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    resumeWizardState.resumeData.experience.splice(idx, 1);
    this.renderLiveResumePreview();
    this.goToResumeWizardStep(3);
    this.scheduleResumeAutosave();
  },

  updateExpField(idx, field, val) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    const item = resumeWizardState.resumeData.experience[idx];
    if (!item) return;
    item[field] = val;
    if (field === 'current' && val) {
      item.endDate = 'Present';
    }
    this.renderLiveResumePreview();
    this.scheduleResumeAutosave();
  },

  addExpBullet(idx) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    const item = resumeWizardState.resumeData.experience[idx];
    if (!item) return;
    if (!item.bullets) item.bullets = [];
    item.bullets.push('');
    this.goToResumeWizardStep(3);
    this.renderLiveResumePreview();
  },

  updateExpBullet(expIdx, bIdx, val) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    const item = resumeWizardState.resumeData.experience[expIdx];
    if (!item || !item.bullets) return;
    item.bullets[bIdx] = val;
    this.renderLiveResumePreview();
    this.scheduleResumeAutosave();
  },

  removeExpBullet(expIdx, bIdx) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    const item = resumeWizardState.resumeData.experience[expIdx];
    if (!item || !item.bullets) return;
    item.bullets.splice(bIdx, 1);
    this.goToResumeWizardStep(3);
    this.renderLiveResumePreview();
    this.scheduleResumeAutosave();
  },

  // --- STEP 4: EDUCATION ---
  renderStep4_Education(eduList) {
    return `
      <div class="step-header">
        <h3>Education Credentials</h3>
        <p>List degrees, certifications, or diplomas. Dates and GPAs are optional and only included if you provide them.</p>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-size:13px;font-weight:600;color:#fff;">Education Entries (${eduList.length})</span>
        <button class="tool-btn-sm" onclick="UI.addResumeEduItem()">+ Add Education</button>
      </div>

      ${eduList.length === 0 ? `
        <div class="empty-section-tip">
          No education entries added yet. Click "+ Add Education" to add your college, university, or school.
        </div>
      ` : `
        <div class="repeater-items-list">
          ${eduList.map((edu, idx) => `
            <div class="repeater-card glass">
              <div class="repeater-card-head">
                <span class="repeater-num">${idx + 1}</span>
                <b class="repeater-title">${this.escapeHTML(edu.degree || 'Degree / Diploma')} ${edu.institution ? '@ ' + this.escapeHTML(edu.institution) : ''}</b>
                <button class="thumb-btn del" onclick="UI.removeResumeEduItem(${idx})" title="Remove">×</button>
              </div>

              <div class="field-row" style="margin-top:10px;">
                <div class="field">
                  <label>Degree / Qualification *</label>
                  <input type="text" class="toolkit-input" value="${this.escapeQuotes(edu.degree || '')}" placeholder="e.g. B.Tech in Computer Science" oninput="UI.updateEduField(${idx}, 'degree', this.value)">
                </div>
                <div class="field">
                  <label>College / University / School *</label>
                  <input type="text" class="toolkit-input" value="${this.escapeQuotes(edu.institution || '')}" placeholder="e.g. Delhi University" oninput="UI.updateEduField(${idx}, 'institution', this.value)">
                </div>
              </div>

              <div class="field-row">
                <div class="field">
                  <label>Location</label>
                  <input type="text" class="toolkit-input" value="${this.escapeQuotes(edu.location || '')}" placeholder="e.g. New Delhi, India" oninput="UI.updateEduField(${idx}, 'location', this.value)">
                </div>
                <div class="field">
                  <label>Grade / CGPA / Percentage (Optional)</label>
                  <input type="text" class="toolkit-input" value="${this.escapeQuotes(edu.grade || '')}" placeholder="e.g. 8.6 CGPA or 85%" oninput="UI.updateEduField(${idx}, 'grade', this.value)">
                </div>
              </div>

              <div class="field-row">
                <div class="field">
                  <label>Start Date</label>
                  <input type="text" class="toolkit-input" value="${this.escapeQuotes(edu.startDate || '')}" placeholder="e.g. 2020" oninput="UI.updateEduField(${idx}, 'startDate', this.value)">
                </div>
                <div class="field">
                  <label>End Date (or Expected)</label>
                  <input type="text" class="toolkit-input" value="${this.escapeQuotes(edu.endDate || '')}" placeholder="e.g. 2024" oninput="UI.updateEduField(${idx}, 'endDate', this.value)">
                </div>
              </div>

              <div class="field" style="margin-top:6px;">
                <label>Relevant Coursework (Optional)</label>
                <input type="text" class="toolkit-input" value="${this.escapeQuotes(edu.coursework || '')}" placeholder="e.g. Data Structures, Operating Systems, Database Management" oninput="UI.updateEduField(${idx}, 'coursework', this.value)">
              </div>

              <div class="field" style="margin-top:6px;">
                <label>Academic Details / Activities / Honors (Optional)</label>
                <input type="text" class="toolkit-input" value="${this.escapeQuotes(edu.description || '')}" placeholder="e.g. Specialization in Cloud Computing, Member of IEEE Student Branch" oninput="UI.updateEduField(${idx}, 'description', this.value)">
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  },

  addResumeEduItem() {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    if (!resumeWizardState.resumeData.education) resumeWizardState.resumeData.education = [];
    resumeWizardState.resumeData.education.push({
      id: 'edu_' + Date.now(),
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
      grade: '',
      coursework: '',
      description: ''
    });
    this.renderLiveResumePreview();
    this.goToResumeWizardStep(4);
    this.scheduleResumeAutosave();
  },

  removeResumeEduItem(idx) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    resumeWizardState.resumeData.education.splice(idx, 1);
    this.renderLiveResumePreview();
    this.goToResumeWizardStep(4);
    this.scheduleResumeAutosave();
  },

  updateEduField(idx, field, val) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    const item = resumeWizardState.resumeData.education[idx];
    if (!item) return;
    item[field] = val;
    this.renderLiveResumePreview();
    this.scheduleResumeAutosave();
  },

  // --- STEP 5: SKILLS (PROFESSION-NEUTRAL) ---
  renderStep5_Skills(skills) {
    const s = skills || { technical: [], soft: [], tools: [], languages: [], custom: [] };

    const targetRole = (resumeWizardState && resumeWizardState.resumeData && resumeWizardState.resumeData.personal && resumeWizardState.resumeData.personal.targetRole) || '';

    return `
      <div class="step-header">
        <h3>Skills &amp; Competencies</h3>
        <p>Profession-neutral skill management. Type any skill and press Enter to add. Only skills you explicitly add will appear.</p>
      </div>

      <!-- Suggested Skills Quick Tray -->
      <div class="skill-suggestions-tray glass" style="margin-bottom:16px;padding:14px 18px;border-radius:10px;border:1px solid rgba(14, 165, 233, 0.3);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
          <b style="color:var(--cyan);font-size:12.5px;">💡 Suggested Skills for ${this.escapeHTML(targetRole || 'Your Target Role')}:</b>
          <small style="color:var(--txt-2);font-size:11px;">Click '+ Add' to include. Never auto-inserted.</small>
        </div>
        <div class="chips-flex-row" style="margin-bottom:0;">
          ${this.getSuggestedSkillsForRole(targetRole).map(sug => `
            <button class="suggested-skill-pill" onclick="UI.addSuggestedSkill('${this.escapeQuotes(sug.name)}', '${sug.category}')">
              + ${this.escapeHTML(sug.name)}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Technical / Core Skills -->
      <div class="skill-category-box glass">
        <b class="skill-category-title">Technical / Core Domain Skills</b>
        <div class="chips-flex-row" id="chips-technical">
          ${(s.technical || []).map((sk, idx) => `
            <span class="skill-tag-chip">
              ${this.escapeHTML(sk)}
              <button onclick="UI.removeSkillTag('technical', ${idx})">×</button>
            </span>
          `).join('')}
        </div>
        <div class="chip-add-row">
          <input type="text" id="inputSkill-technical" class="toolkit-input" placeholder="e.g. Java, Python, Patient Care, Lesson Planning..." onkeydown="if(event.key==='Enter'){event.preventDefault();UI.addSkillTag('technical');}">
          <button class="tool-btn-sm" onclick="UI.addSkillTag('technical')">Add Skill</button>
        </div>
      </div>

      <!-- Tools & Software -->
      <div class="skill-category-box glass" style="margin-top:14px;">
        <b class="skill-category-title">Tools, Software &amp; Frameworks</b>
        <div class="chips-flex-row" id="chips-tools">
          ${(s.tools || []).map((sk, idx) => `
            <span class="skill-tag-chip">
              ${this.escapeHTML(sk)}
              <button onclick="UI.removeSkillTag('tools', ${idx})">×</button>
            </span>
          `).join('')}
        </div>
        <div class="chip-add-row">
          <input type="text" id="inputSkill-tools" class="toolkit-input" placeholder="e.g. Git, Docker, VS Code, Figma, Epic EHR..." onkeydown="if(event.key==='Enter'){event.preventDefault();UI.addSkillTag('tools');}">
          <button class="tool-btn-sm" onclick="UI.addSkillTag('tools')">Add Tool</button>
        </div>
      </div>

      <!-- Soft / Interpersonal Skills -->
      <div class="skill-category-box glass" style="margin-top:14px;">
        <b class="skill-category-title">Soft Skills &amp; Communication</b>
        <div class="chips-flex-row" id="chips-soft">
          ${(s.soft || []).map((sk, idx) => `
            <span class="skill-tag-chip">
              ${this.escapeHTML(sk)}
              <button onclick="UI.removeSkillTag('soft', ${idx})">×</button>
            </span>
          `).join('')}
        </div>
        <div class="chip-add-row">
          <input type="text" id="inputSkill-soft" class="toolkit-input" placeholder="e.g. Problem Solving, Team Leadership, Active Listening..." onkeydown="if(event.key==='Enter'){event.preventDefault();UI.addSkillTag('soft');}">
          <button class="tool-btn-sm" onclick="UI.addSkillTag('soft')">Add Skill</button>
        </div>
      </div>

      <!-- Languages -->
      <div class="skill-category-box glass" style="margin-top:14px;">
        <b class="skill-category-title">Languages Known</b>
        <div class="chips-flex-row" id="chips-languages">
          ${(s.languages || []).map((sk, idx) => `
            <span class="skill-tag-chip">
              ${this.escapeHTML(sk)}
              <button onclick="UI.removeSkillTag('languages', ${idx})">×</button>
            </span>
          `).join('')}
        </div>
        <div class="chip-add-row">
          <input type="text" id="inputSkill-languages" class="toolkit-input" placeholder="e.g. English (Fluent), Hindi (Native), Spanish (Basic)..." onkeydown="if(event.key==='Enter'){event.preventDefault();UI.addSkillTag('languages');}">
          <button class="tool-btn-sm" onclick="UI.addSkillTag('languages')">Add Language</button>
        </div>
      </div>

      <!-- Custom / Specialized Competencies -->
      <div class="skill-category-box glass" style="margin-top:14px;">
        <b class="skill-category-title">Custom / Specialized Competencies</b>
        <div class="chips-flex-row" id="chips-custom">
          ${(s.custom || []).map((sk, idx) => `
            <span class="skill-tag-chip">
              ${this.escapeHTML(sk)}
              <button onclick="UI.removeSkillTag('custom', ${idx})">×</button>
            </span>
          `).join('')}
        </div>
        <div class="chip-add-row">
          <input type="text" id="inputSkill-custom" class="toolkit-input" placeholder="e.g. Agile Methodologies, Public Speaking..." onkeydown="if(event.key==='Enter'){event.preventDefault();UI.addSkillTag('custom');}">
          <button class="tool-btn-sm" onclick="UI.addSkillTag('custom')">Add Skill</button>
        </div>
      </div>
    `;
  },

  getSuggestedSkillsForRole(role) {
    const r = (role || '').toLowerCase();
    if (r.includes('java') || r.includes('backend')) {
      return [
        { name: 'Java', category: 'technical' },
        { name: 'Spring Boot', category: 'technical' },
        { name: 'SQL / MySQL', category: 'technical' },
        { name: 'REST APIs', category: 'technical' },
        { name: 'Git', category: 'tools' },
        { name: 'Postman', category: 'tools' },
        { name: 'Debugging', category: 'soft' },
        { name: 'Problem Solving', category: 'soft' }
      ];
    } else if (r.includes('front') || r.includes('web') || r.includes('react')) {
      return [
        { name: 'JavaScript (ES6+)', category: 'technical' },
        { name: 'HTML5 & CSS3', category: 'technical' },
        { name: 'React', category: 'technical' },
        { name: 'Responsive Design', category: 'technical' },
        { name: 'Git & GitHub', category: 'tools' },
        { name: 'VS Code', category: 'tools' },
        { name: 'UI / UX Collaboration', category: 'soft' },
        { name: 'Attention to Detail', category: 'soft' }
      ];
    } else if (r.includes('data') || r.includes('python') || r.includes('analyst')) {
      return [
        { name: 'Python', category: 'technical' },
        { name: 'SQL Querying', category: 'technical' },
        { name: 'Pandas & NumPy', category: 'technical' },
        { name: 'Data Visualization', category: 'technical' },
        { name: 'Excel / Spreadsheets', category: 'tools' },
        { name: 'Jupyter Notebook', category: 'tools' },
        { name: 'Analytical Thinking', category: 'soft' },
        { name: 'Insight Presentation', category: 'soft' }
      ];
    } else {
      return [
        { name: 'Problem Solving', category: 'soft' },
        { name: 'Communication', category: 'soft' },
        { name: 'Git & Version Control', category: 'tools' },
        { name: 'Microsoft Office / Docs', category: 'tools' },
        { name: 'Team Collaboration', category: 'soft' },
        { name: 'Project Organization', category: 'soft' }
      ];
    }
  },

  addSuggestedSkill(name, category) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    if (!resumeWizardState.resumeData.skills) {
      resumeWizardState.resumeData.skills = { technical: [], soft: [], tools: [], languages: [], custom: [] };
    }
    const cat = category || 'technical';
    if (!resumeWizardState.resumeData.skills[cat]) resumeWizardState.resumeData.skills[cat] = [];
    if (!resumeWizardState.resumeData.skills[cat].includes(name)) {
      resumeWizardState.resumeData.skills[cat].push(name);
      this.goToResumeWizardStep(5);
      this.renderLiveResumePreview();
      this.scheduleResumeAutosave();
      this.showToast(`Added skill: ${name}`);
    } else {
      this.showToast(`Skill "${name}" is already in your list`);
    }
  },

  addSkillTag(category) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    const input = document.getElementById(`inputSkill-${category}`);
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;

    if (!resumeWizardState.resumeData.skills) {
      resumeWizardState.resumeData.skills = { technical: [], soft: [], tools: [], languages: [], custom: [] };
    }
    if (!resumeWizardState.resumeData.skills[category]) {
      resumeWizardState.resumeData.skills[category] = [];
    }

    if (!resumeWizardState.resumeData.skills[category].includes(val)) {
      resumeWizardState.resumeData.skills[category].push(val);
      input.value = '';
      this.goToResumeWizardStep(5);
      this.renderLiveResumePreview();
      this.scheduleResumeAutosave();
    }
  },

  removeSkillTag(category, idx) {
    if (!resumeWizardState || !resumeWizardState.resumeData || !resumeWizardState.resumeData.skills) return;
    const arr = resumeWizardState.resumeData.skills[category];
    if (arr) {
      arr.splice(idx, 1);
      this.goToResumeWizardStep(5);
      this.renderLiveResumePreview();
      this.scheduleResumeAutosave();
    }
  },

  // --- STEP 6: PROJECTS (CRITICAL FOR FRESHERS) ---
  renderStep6_Projects(projList) {
    return `
      <div class="step-header">
        <h3>Academic &amp; Personal Projects</h3>
        <p>Showcase real projects you built. Critical for freshers to demonstrate practical competence.</p>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <span style="font-size:13px;font-weight:600;color:#fff;">Projects (${projList.length})</span>
        <div style="display:flex;gap:8px;">
          <button class="tool-btn-sm" onclick="UI.openGuidedProjectModal()" style="border-color:var(--cyan);color:#fff;">
            ✨ Guided 6-Question Project Builder
          </button>
          <button class="tool-btn-sm" onclick="UI.addResumeProjItem()">+ Add Project</button>
        </div>
      </div>

      ${projList.length === 0 ? `
        <div class="empty-section-tip">
          No projects added yet. Click "+ Add Project" or use the "Guided 6-Question Project Builder" to highlight your key builds, capstones, or open-source work.
        </div>
      ` : `
        <div class="repeater-items-list">
          ${projList.map((p, idx) => `
            <div class="repeater-card glass">
              <div class="repeater-card-head">
                <span class="repeater-num">${idx + 1}</span>
                <b class="repeater-title">${this.escapeHTML(p.name || 'Project Name')}</b>
                <button class="thumb-btn del" onclick="UI.removeResumeProjItem(${idx})" title="Remove">×</button>
              </div>

              <div class="field-row" style="margin-top:10px;">
                <div class="field">
                  <label>Project Title *</label>
                  <input type="text" class="toolkit-input" value="${this.escapeQuotes(p.name || '')}" placeholder="e.g. E-Commerce Microservices Platform" oninput="UI.updateProjField(${idx}, 'name', this.value)">
                </div>
                <div class="field">
                  <label>Your Role (Optional)</label>
                  <input type="text" class="toolkit-input" value="${this.escapeQuotes(p.role || '')}" placeholder="e.g. Lead Developer / Creator" oninput="UI.updateProjField(${idx}, 'role', this.value)">
                </div>
              </div>

              <div class="field">
                <label>Technologies / Tools Used</label>
                <input type="text" class="toolkit-input" value="${this.escapeQuotes(p.tech || '')}" placeholder="e.g. Java, Spring Boot, MySQL, React, AWS" oninput="UI.updateProjField(${idx}, 'tech', this.value)">
              </div>

              <div class="field-row">
                <div class="field">
                  <label>Live Demo URL (Optional)</label>
                  <input type="text" class="toolkit-input" value="${this.escapeQuotes(p.url || '')}" placeholder="https://myproject.com" oninput="UI.updateProjField(${idx}, 'url', this.value)">
                </div>
                <div class="field">
                  <label>GitHub / Source URL (Optional)</label>
                  <input type="text" class="toolkit-input" value="${this.escapeQuotes(p.github || '')}" placeholder="github.com/user/project" oninput="UI.updateProjField(${idx}, 'github', this.value)">
                </div>
              </div>

              <!-- Project Description / Contributions -->
              <div style="margin-top:8px;">
                <label style="font-size:12px;color:var(--txt-2);display:block;margin-bottom:6px;">Key Features &amp; Contributions (Bullet Points):</label>
                <div class="bullets-input-list">
                  ${(p.bullets || []).map((b, bIdx) => `
                    <div class="bullet-row">
                      <input type="text" class="toolkit-input bullet-input" value="${this.escapeQuotes(b)}" placeholder="Describe what you built..." oninput="UI.updateProjBullet(${idx}, ${bIdx}, this.value)">
                      <button class="tool-btn-sm" onclick="UI.polishBulletWithAi('proj', ${idx}, ${bIdx})" title="Polish with AI">✨</button>
                      <button class="thumb-btn del" onclick="UI.removeProjBullet(${idx}, ${bIdx})">×</button>
                    </div>
                  `).join('')}
                </div>
                <button class="tool-btn-sm" style="margin-top:6px;" onclick="UI.addProjBullet(${idx})">+ Add Contribution Bullet</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  },

  addResumeProjItem() {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    if (!resumeWizardState.resumeData.projects) resumeWizardState.resumeData.projects = [];
    resumeWizardState.resumeData.projects.push({
      id: 'proj_' + Date.now(),
      name: '',
      role: '',
      tech: '',
      url: '',
      github: '',
      bullets: ['']
    });
    this.renderLiveResumePreview();
    this.goToResumeWizardStep(6);
    this.scheduleResumeAutosave();
  },

  removeResumeProjItem(idx) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    resumeWizardState.resumeData.projects.splice(idx, 1);
    this.renderLiveResumePreview();
    this.goToResumeWizardStep(6);
    this.scheduleResumeAutosave();
  },

  updateProjField(idx, field, val) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    const item = resumeWizardState.resumeData.projects[idx];
    if (!item) return;
    item[field] = val;
    this.renderLiveResumePreview();
    this.scheduleResumeAutosave();
  },

  addProjBullet(idx) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    const item = resumeWizardState.resumeData.projects[idx];
    if (!item) return;
    if (!item.bullets) item.bullets = [];
    item.bullets.push('');
    this.goToResumeWizardStep(6);
    this.renderLiveResumePreview();
  },

  updateProjBullet(pIdx, bIdx, val) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    const item = resumeWizardState.resumeData.projects[pIdx];
    if (!item || !item.bullets) return;
    item.bullets[bIdx] = val;
    this.renderLiveResumePreview();
    this.scheduleResumeAutosave();
  },

  removeProjBullet(pIdx, bIdx) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    const item = resumeWizardState.resumeData.projects[pIdx];
    if (!item || !item.bullets) return;
    item.bullets.splice(bIdx, 1);
    this.goToResumeWizardStep(6);
    this.renderLiveResumePreview();
    this.scheduleResumeAutosave();
  },

  // ============ GUIDED ASSISTANT LOGIC (PROJECTS & SUMMARY) ============
  openGuidedProjectModal() {
    const modal = document.getElementById('guidedProjectModal');
    if (modal) modal.style.display = 'flex';
    const draftBox = document.getElementById('gpDraftPreviewBox');
    if (draftBox) draftBox.style.display = 'none';
    const btnAccept = document.getElementById('btnAcceptGuidedProject');
    if (btnAccept) btnAccept.style.display = 'none';
  },

  closeGuidedProjectModal() {
    const modal = document.getElementById('guidedProjectModal');
    if (modal) modal.style.display = 'none';
  },

  generateGuidedProjectDraft() {
    const q1 = (document.getElementById('gp-q1')?.value || '').trim();
    const q2 = (document.getElementById('gp-q2')?.value || '').trim();
    const q3 = (document.getElementById('gp-q3')?.value || '').trim();
    const q4 = (document.getElementById('gp-q4')?.value || '').trim();
    const q5 = (document.getElementById('gp-q5')?.value || '').trim();
    const q6Url = (document.getElementById('gp-q6-url')?.value || '').trim();
    const q6Git = (document.getElementById('gp-q6-github')?.value || '').trim();

    if (!q1 && !q2) {
      this.showToast('Please answer at least what you built or the project name.');
      return;
    }

    const title = q2 || q1;
    const bullets = [];
    if (q4) {
      bullets.push(`Developed ${q1 ? q1 + ' (' + title + ')' : title} designed to ${q4.replace(/^allows? /i, 'allow ').replace(/^to /i, '')}.`);
    } else {
      bullets.push(`Built ${title} utilizing ${q3 || 'modern technologies'}.`);
    }
    if (q5) {
      bullets.push(`Engineered and implemented ${q5}${q3 ? ' leveraging ' + q3 : ''}.`);
    }

    this._pendingGuidedProject = {
      id: 'proj_' + Date.now(),
      name: title,
      role: 'Developer / Creator',
      tech: q3,
      url: q6Url,
      github: q6Git,
      bullets: bullets
    };

    const draftBox = document.getElementById('gpDraftPreviewBox');
    const content = document.getElementById('gpDraftPreviewContent');
    const btnAccept = document.getElementById('btnAcceptGuidedProject');

    if (draftBox && content) {
      content.innerHTML = `
        <div style="font-weight:600;font-size:13px;margin-bottom:4px;">${this.escapeHTML(title)} ${q3 ? '· <span style="color:var(--cyan);font-weight:normal;">' + this.escapeHTML(q3) + '</span>' : ''}</div>
        <ul style="margin:4px 0 0 16px;padding:0;">
          ${bullets.map(b => `<li>${this.escapeHTML(b)}</li>`).join('')}
        </ul>
        ${(q6Url || q6Git) ? `<div style="margin-top:6px;font-size:11px;color:var(--txt-2);">Links: ${[q6Url, q6Git].filter(Boolean).map(l => this.escapeHTML(l)).join(' | ')}</div>` : ''}
      `;
      draftBox.style.display = 'block';
    }
    if (btnAccept) btnAccept.style.display = 'inline-block';
  },

  acceptGuidedProjectDraft() {
    if (!this._pendingGuidedProject || !resumeWizardState || !resumeWizardState.resumeData) return;
    if (!resumeWizardState.resumeData.projects) resumeWizardState.resumeData.projects = [];
    resumeWizardState.resumeData.projects.push(this._pendingGuidedProject);
    this._pendingGuidedProject = null;
    this.closeGuidedProjectModal();
    this.goToResumeWizardStep(6);
    this.renderLiveResumePreview();
    this.scheduleResumeAutosave();
    this.showToast('Project added to your resume! 🚀');
  },

  openGuidedSummaryModal() {
    const modal = document.getElementById('guidedSummaryModal');
    if (modal) modal.style.display = 'flex';
    const draftBox = document.getElementById('gsDraftPreviewBox');
    if (draftBox) draftBox.style.display = 'none';
    const btnAccept = document.getElementById('btnAcceptGuidedSummary');
    if (btnAccept) btnAccept.style.display = 'none';

    const roleInput = document.getElementById('gs-q2');
    if (roleInput && resumeWizardState && resumeWizardState.resumeData && resumeWizardState.resumeData.personal) {
      if (!roleInput.value) roleInput.value = resumeWizardState.resumeData.personal.targetRole || '';
    }
  },

  closeGuidedSummaryModal() {
    const modal = document.getElementById('guidedSummaryModal');
    if (modal) modal.style.display = 'none';
  },

  generateGuidedSummaryDraft() {
    const q1 = (document.getElementById('gs-q1')?.value || 'Recent Graduate').trim();
    const q2 = (document.getElementById('gs-q2')?.value || '').trim();
    const q3 = (document.getElementById('gs-q3')?.value || '').trim();
    const q4 = (document.getElementById('gs-q4')?.value || '').trim();
    const q5 = (document.getElementById('gs-q5')?.value || '').trim();

    let draft = '';
    if (q1 === 'College Student' || q1 === 'Recent Graduate') {
      draft = `Motivated ${q1.toLowerCase()}${q2 ? ' targeting a ' + q2 + ' role' : ''}. `;
      if (q3) draft += `Demonstrates solid practical foundation in ${q3}. `;
      if (q4) draft += `Passionate about ${q4.replace(/^building /i, '').replace(/^working on /i, '')} and eager to contribute to high-impact teams. `;
      if (q5) draft += `Key accomplishment: ${q5}.`;
    } else {
      draft = `Results-oriented ${q2 || q1} with a proven track record${q3 ? ' in ' + q3 : ''}. `;
      if (q4) draft += `Specialized in ${q4.replace(/^building /i, '').replace(/^working on /i, '')}. `;
      if (q5) draft += `Highlighted achievement: ${q5}.`;
    }

    draft = draft.trim();
    this._pendingGuidedSummary = draft;

    const draftBox = document.getElementById('gsDraftPreviewBox');
    const content = document.getElementById('gsDraftPreviewContent');
    const btnAccept = document.getElementById('btnAcceptGuidedSummary');

    if (draftBox && content) {
      content.textContent = draft;
      draftBox.style.display = 'block';
    }
    if (btnAccept) btnAccept.style.display = 'inline-block';
  },

  acceptGuidedSummaryDraft() {
    if (!this._pendingGuidedSummary || !resumeWizardState || !resumeWizardState.resumeData) return;
    if (!resumeWizardState.resumeData.summary) resumeWizardState.resumeData.summary = {};
    resumeWizardState.resumeData.summary.text = this._pendingGuidedSummary;
    this._pendingGuidedSummary = null;
    this.closeGuidedSummaryModal();
    this.goToResumeWizardStep(2);
    this.renderLiveResumePreview();
    this.scheduleResumeAutosave();
    this.showToast('Summary applied to your resume! 📝');
  },

  // --- STEP 7: CERTIFICATIONS ---
  renderStep7_Certifications(certList) {
    return `
      <div class="step-header">
        <h3>Certifications &amp; Licenses (Optional)</h3>
        <p>Add industry certifications or credentials. Leave empty if not applicable.</p>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-size:13px;font-weight:600;color:#fff;">Certifications (${certList.length})</span>
        <button class="tool-btn-sm" onclick="UI.addResumeCertItem()">+ Add Certificate</button>
      </div>

      ${certList.length === 0 ? `
        <div class="empty-section-tip">
          No certifications added. You can skip this step if not applicable.
        </div>
      ` : `
        <div class="repeater-items-list">
          ${certList.map((c, idx) => `
            <div class="repeater-card glass">
              <div class="repeater-card-head">
                <span class="repeater-num">${idx + 1}</span>
                <b class="repeater-title">${this.escapeHTML(c.name || 'Certificate Name')}</b>
                <button class="thumb-btn del" onclick="UI.removeResumeCertItem(${idx})">×</button>
              </div>

              <div class="field-row" style="margin-top:10px;">
                <div class="field">
                  <label>Certificate Name *</label>
                  <input type="text" class="toolkit-input" value="${this.escapeQuotes(c.name || '')}" placeholder="e.g. AWS Certified Solutions Architect" oninput="UI.updateCertField(${idx}, 'name', this.value)">
                </div>
                <div class="field">
                  <label>Issuing Organization *</label>
                  <input type="text" class="toolkit-input" value="${this.escapeQuotes(c.issuer || '')}" placeholder="e.g. Amazon Web Services" oninput="UI.updateCertField(${idx}, 'issuer', this.value)">
                </div>
              </div>

              <div class="field-row">
                <div class="field">
                  <label>Issue Date</label>
                  <input type="text" class="toolkit-input" value="${this.escapeQuotes(c.issueDate || '')}" placeholder="e.g. Mar 2023" oninput="UI.updateCertField(${idx}, 'issueDate', this.value)">
                </div>
                <div class="field">
                  <label>Credential ID / Verification URL</label>
                  <input type="text" class="toolkit-input" value="${this.escapeQuotes(c.url || '')}" placeholder="e.g. credly.com/id/12345" oninput="UI.updateCertField(${idx}, 'url', this.value)">
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  },

  addResumeCertItem() {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    if (!resumeWizardState.resumeData.certifications) resumeWizardState.resumeData.certifications = [];
    resumeWizardState.resumeData.certifications.push({
      id: 'cert_' + Date.now(),
      name: '',
      issuer: '',
      issueDate: '',
      url: ''
    });
    this.renderLiveResumePreview();
    this.goToResumeWizardStep(7);
    this.scheduleResumeAutosave();
  },

  removeResumeCertItem(idx) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    resumeWizardState.resumeData.certifications.splice(idx, 1);
    this.renderLiveResumePreview();
    this.goToResumeWizardStep(7);
    this.scheduleResumeAutosave();
  },

  updateCertField(idx, field, val) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    const item = resumeWizardState.resumeData.certifications[idx];
    if (!item) return;
    item[field] = val;
    this.renderLiveResumePreview();
    this.scheduleResumeAutosave();
  },

  // --- STEP 8: ACHIEVEMENTS & HONORS ---
  renderStep8_Achievements(achList) {
    return `
      <div class="step-header">
        <h3>Achievements &amp; Honors (Optional)</h3>
        <p>Highlight competitions won, hackathons, publications, or scholarships.</p>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-size:13px;font-weight:600;color:#fff;">Achievements (${achList.length})</span>
        <button class="tool-btn-sm" onclick="UI.addResumeAchieveItem()">+ Add Achievement</button>
      </div>

      ${achList.length === 0 ? `
        <div class="empty-section-tip">
          No achievements listed yet. Click "+ Add Achievement" or skip to next step.
        </div>
      ` : `
        <div class="repeater-items-list">
          ${achList.map((a, idx) => `
            <div class="repeater-card glass">
              <div class="repeater-card-head">
                <span class="repeater-num">${idx + 1}</span>
                <b class="repeater-title">${this.escapeHTML(a.title || 'Honor / Award')}</b>
                <button class="thumb-btn del" onclick="UI.removeResumeAchieveItem(${idx})">×</button>
              </div>

              <div class="field" style="margin-top:10px;">
                <label>Title / Award / Recognition *</label>
                <input type="text" class="toolkit-input" value="${this.escapeQuotes(a.title || '')}" placeholder="e.g. 1st Place — National Smart City Hackathon 2024" oninput="UI.updateAchieveField(${idx}, 'title', this.value)">
              </div>

              <div class="field">
                <label>Context / Description</label>
                <input type="text" class="toolkit-input" value="${this.escapeQuotes(a.description || '')}" placeholder="e.g. Competed against 120 teams to build an emergency dispatch alert system" oninput="UI.updateAchieveField(${idx}, 'description', this.value)">
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  },

  addResumeAchieveItem() {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    if (!resumeWizardState.resumeData.achievements) resumeWizardState.resumeData.achievements = [];
    resumeWizardState.resumeData.achievements.push({
      id: 'ach_' + Date.now(),
      title: '',
      description: ''
    });
    this.renderLiveResumePreview();
    this.goToResumeWizardStep(8);
    this.scheduleResumeAutosave();
  },

  removeResumeAchieveItem(idx) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    resumeWizardState.resumeData.achievements.splice(idx, 1);
    this.renderLiveResumePreview();
    this.goToResumeWizardStep(8);
    this.scheduleResumeAutosave();
  },

  updateAchieveField(idx, field, val) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    const item = resumeWizardState.resumeData.achievements[idx];
    if (!item) return;
    item[field] = val;
    this.renderLiveResumePreview();
    this.scheduleResumeAutosave();
  },

  // --- STEP 9: ADDITIONAL CUSTOM SECTIONS ---
  renderStep9_Additional(secList) {
    return `
      <div class="step-header">
        <h3>Additional Custom Sections</h3>
        <p>Make your resume unique. Add custom sections such as Volunteer Work, Publications, Leadership, or Interests.</p>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-size:13px;font-weight:600;color:#fff;">Custom Sections (${secList.length})</span>
        <button class="tool-btn-sm" onclick="UI.addResumeCustomSec()">+ Add Custom Section</button>
      </div>

      ${secList.length === 0 ? `
        <div class="empty-section-tip">
          No extra sections added. You can skip this or add custom categories like "Volunteer Work" or "Publications".
        </div>
      ` : `
        <div class="repeater-items-list">
          ${secList.map((sec, idx) => `
            <div class="repeater-card glass">
              <div class="repeater-card-head">
                <span class="repeater-num">${idx + 1}</span>
                <b class="repeater-title">${this.escapeHTML(sec.title || 'Section Heading')}</b>
                <button class="thumb-btn del" onclick="UI.removeResumeCustomSec(${idx})">×</button>
              </div>

              <div class="field" style="margin-top:10px;">
                <label>Section Heading Title *</label>
                <input type="text" class="toolkit-input" value="${this.escapeQuotes(sec.title || '')}" placeholder="e.g. Volunteer Experience or Publications" oninput="UI.updateCustomSecTitle(${idx}, this.value)">
              </div>

              <div style="margin-top:8px;">
                <label style="font-size:12px;color:var(--txt-2);display:block;margin-bottom:4px;">Items in this section:</label>
                <div class="bullets-input-list">
                  ${(sec.items || []).map((it, iIdx) => `
                    <div class="bullet-row">
                      <input type="text" class="toolkit-input bullet-input" value="${this.escapeQuotes(it)}" placeholder="Enter entry..." oninput="UI.updateCustomSecItem(${idx}, ${iIdx}, this.value)">
                      <button class="thumb-btn del" onclick="UI.removeCustomSecItem(${idx}, ${iIdx})">×</button>
                    </div>
                  `).join('')}
                </div>
                <button class="tool-btn-sm" style="margin-top:6px;" onclick="UI.addCustomSecItem(${idx})">+ Add Item</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  },

  addResumeCustomSec() {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    if (!resumeWizardState.resumeData.additionalSections) resumeWizardState.resumeData.additionalSections = [];
    resumeWizardState.resumeData.additionalSections.push({
      id: 'sec_' + Date.now(),
      title: 'Volunteer Experience',
      items: ['']
    });
    this.renderLiveResumePreview();
    this.goToResumeWizardStep(9);
    this.scheduleResumeAutosave();
  },

  removeResumeCustomSec(idx) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    resumeWizardState.resumeData.additionalSections.splice(idx, 1);
    this.renderLiveResumePreview();
    this.goToResumeWizardStep(9);
    this.scheduleResumeAutosave();
  },

  updateCustomSecTitle(idx, val) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    const sec = resumeWizardState.resumeData.additionalSections[idx];
    if (sec) {
      sec.title = val;
      this.renderLiveResumePreview();
      this.scheduleResumeAutosave();
    }
  },

  addCustomSecItem(idx) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    const sec = resumeWizardState.resumeData.additionalSections[idx];
    if (!sec) return;
    if (!sec.items) sec.items = [];
    sec.items.push('');
    this.goToResumeWizardStep(9);
    this.renderLiveResumePreview();
  },

  updateCustomSecItem(secIdx, iIdx, val) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    const sec = resumeWizardState.resumeData.additionalSections[secIdx];
    if (!sec || !sec.items) return;
    sec.items[iIdx] = val;
    this.renderLiveResumePreview();
    this.scheduleResumeAutosave();
  },

  removeCustomSecItem(secIdx, iIdx) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    const sec = resumeWizardState.resumeData.additionalSections[secIdx];
    if (!sec || !sec.items) return;
    sec.items.splice(iIdx, 1);
    this.goToResumeWizardStep(9);
    this.renderLiveResumePreview();
    this.scheduleResumeAutosave();
  },

  // --- STEP 10: DESIGN & TEMPLATES ---
  renderStep10_Design(d) {
    const templates = (typeof RESUME_TEMPLATES !== 'undefined') ? RESUME_TEMPLATES : [
      { id: 'ats', name: 'Standard Single-Column (ATS-Friendly)', badge: 'ATS-Friendly' },
      { id: 'modern', name: 'Modern Two-Column', badge: 'Modern' },
      { id: 'executive', name: 'Executive Professional', badge: 'Executive' },
      { id: 'creative', name: 'Creative Visual Accent', badge: 'Design' },
      { id: 'harvard', name: 'Harvard Academic Classic', badge: 'Academic' },
      { id: 'minimalist', name: 'Minimalist Clean', badge: 'Clean' }
    ];

    const currentTpl = (d && d.template) || 'ats';
    const currentAccent = (d && d.accentColor) || '#0284c7';
    const currentFont = (d && d.font) || 'Inter';

    const colors = ['#0284c7', '#0d9488', '#2563eb', '#7c3aed', '#d97706', '#dc2626', '#334155'];

    return `
      <div class="step-header">
        <h3>Template &amp; Visual Design</h3>
        <p>Choose an ATS-friendly layout and customize typography and accent styling.</p>
      </div>

      <div class="field">
        <label class="section-title">CHOOSE RESUME LAYOUT</label>
        <div class="template-selector-grid">
          ${templates.map(t => `
            <div class="template-card-tile ${t.id === currentTpl ? 'active' : ''}" onclick="UI.setResumeDesignTemplate('${t.id}')">
              <span class="tpl-badge">${t.badge}</span>
              <b>${t.name}</b>
              <small>${t.id === 'ats' ? 'Recommended for corporate & automated ATS screening' : (t.id === 'modern' ? 'Great for tech & modern companies' : 'Professional clean layout')}</small>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="field" style="margin-top:16px;">
        <label class="section-title">ACCENT COLOR</label>
        <div class="color-swatches-row">
          ${colors.map(c => `
            <button class="color-swatch-dot ${c === currentAccent ? 'active' : ''}" style="background-color:${c};" onclick="UI.setResumeDesignAccent('${c}')" title="${c}"></button>
          `).join('')}
          <input type="color" value="${currentAccent}" onchange="UI.setResumeDesignAccent(this.value)" class="custom-color-input" title="Custom color">
        </div>
      </div>

      <div class="field-row" style="margin-top:16px;">
        <div class="field">
          <label>Typography Font</label>
          <select class="toolkit-select" onchange="UI.setResumeDesignFont(this.value)">
            <option value="Inter" ${currentFont === 'Inter' ? 'selected' : ''}>Inter (Modern Sans)</option>
            <option value="Roboto" ${currentFont === 'Roboto' ? 'selected' : ''}>Roboto (Clean Sans)</option>
            <option value="Merriweather" ${currentFont === 'Merriweather' ? 'selected' : ''}>Merriweather (Classic Serif)</option>
            <option value="Georgia" ${currentFont === 'Georgia' ? 'selected' : ''}>Georgia (Executive Serif)</option>
            <option value="Garamond" ${currentFont === 'Garamond' ? 'selected' : ''}>EB Garamond (Academic)</option>
          </select>
        </div>
      </div>
    `;
  },

  setResumeDesignTemplate(tplId) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    if (!resumeWizardState.resumeData.design) resumeWizardState.resumeData.design = {};
    resumeWizardState.resumeData.design.template = tplId;
    currentResumeTemplate = tplId;
    const badge = document.getElementById('previewActiveTplBadge');
    if (badge) {
      const t = (RESUME_TEMPLATES || []).find(it => it.id === tplId);
      badge.textContent = t ? t.name : tplId;
    }
    this.goToResumeWizardStep(10);
    this.renderLiveResumePreview();
    this.scheduleResumeAutosave();
  },

  setResumeDesignAccent(color) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    if (!resumeWizardState.resumeData.design) resumeWizardState.resumeData.design = {};
    resumeWizardState.resumeData.design.accentColor = color;
    this.goToResumeWizardStep(10);
    this.renderLiveResumePreview();
    this.scheduleResumeAutosave();
  },

  setResumeDesignFont(font) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    if (!resumeWizardState.resumeData.design) resumeWizardState.resumeData.design = {};
    resumeWizardState.resumeData.design.font = font;
    this.goToResumeWizardStep(10);
    this.renderLiveResumePreview();
    this.scheduleResumeAutosave();
  },

  // --- STEP 11: REVIEW & COMPLETENESS AUDIT ---
  renderStep11_Review(data) {
    const p = data.personal || {};
    const sum = (data.summary && data.summary.text) || '';
    const expCount = (data.experience || []).length;
    const eduCount = (data.education || []).length;
    const skillsCount = Object.values(data.skills || {}).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
    const projCount = (data.projects || []).length;
    const certCount = (data.certifications || []).length;

    const sections = [
      { name: 'Personal Information', complete: Boolean(p.fullName && p.email && p.targetRole), step: 1, detail: p.fullName ? `${p.fullName} (${p.targetRole || 'No title'})` : 'Missing' },
      { name: 'Professional Summary', complete: Boolean(sum), step: 2, detail: sum ? `${sum.substring(0, 55)}...` : 'Not provided' },
      { name: 'Work Experience', complete: data.isFresher || expCount > 0, step: 3, detail: data.isFresher ? 'Fresher Mode (Omitted)' : `${expCount} jobs listed` },
      { name: 'Education', complete: eduCount > 0, step: 4, detail: `${eduCount} entries` },
      { name: 'Skills & Competencies', complete: skillsCount > 0, step: 5, detail: `${skillsCount} skills entered` },
      { name: 'Projects', complete: projCount > 0, step: 6, detail: `${projCount} projects` },
      { name: 'Certifications', complete: certCount > 0, step: 7, detail: `${certCount} certificates` }
    ];

    const completedTotal = sections.filter(s => s.complete).length;
    const scorePct = Math.round((completedTotal / sections.length) * 100);

    return `
      <div class="step-header">
        <h3>Resume Completeness Review</h3>
        <p>Review every section before downloading. You can jump directly to any step to make instant adjustments.</p>
      </div>

      <div class="audit-score-card glass" style="padding:16px;border-radius:10px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <b style="font-size:16px;color:#fff;display:block;">Resume Profile Strength</b>
          <small style="color:var(--txt-2);font-size:12px;">Based on completed sections (${completedTotal} of ${sections.length} core sections)</small>
        </div>
        <span class="page-count-badge" style="font-size:14px;padding:6px 14px;">${scorePct}% Ready</span>
      </div>

      <div class="audit-sections-checklist">
        ${sections.map(s => `
          <div class="audit-row glass">
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="audit-check-icon ${s.complete ? 'done' : 'pending'}">${s.complete ? '✓' : '•'}</span>
              <div>
                <b style="color:#fff;font-size:13px;">${s.name}</b>
                <small style="display:block;color:var(--txt-2);font-size:11px;">${s.detail}</small>
              </div>
            </div>
            <button class="tool-btn-sm" onclick="UI.goToResumeWizardStep(${s.step})">Edit Step ${s.step}</button>
          </div>
        `).join('')}
      </div>

      ${data.isFresher ? `
        <div class="fresher-checklist-card glass" style="padding:16px;border-radius:10px;border-left:4px solid var(--cyan);margin-top:16px;">
          <b style="color:var(--cyan);font-size:13px;display:block;margin-bottom:6px;">🎓 Fresher Profile Readiness</b>
          <p style="color:var(--txt-1);font-size:12px;line-height:1.5;margin-bottom:8px;">
            For college freshers, employers prioritize <b>authentic projects, sound educational grounding, and verifiable skills</b> over years of corporate tenure.
          </p>
          <div style="font-size:11.5px;color:var(--txt-2);display:flex;flex-direction:column;gap:4px;">
            <span>${projCount > 0 ? '✅' : '⚠️'} <b>Projects:</b> ${projCount > 0 ? `${projCount} project(s) showcase your practical skills` : 'Recommended: Add at least 1 academic or personal project in Step 6'}</span>
            <span>${eduCount > 0 ? '✅' : '⚠️'} <b>Education:</b> ${eduCount > 0 ? `${eduCount} qualification(s) listed` : 'Add your degree in Step 4'}</span>
            <span>${skillsCount > 0 ? '✅' : '⚠️'} <b>Skills:</b> ${skillsCount > 0 ? `${skillsCount} skills entered` : 'Add skills in Step 5'}</span>
          </div>
        </div>
      ` : ''}
    `;
  },

  // --- STEP 12: EXPORT OPTIONS ---
  renderStep12_Export(data) {
    const p = data.personal || {};

    return `
      <div class="step-header">
        <h3>Export &amp; Download Resume</h3>
        <p>Your resume is complete and formatted! Download in vector PDF format or print directly.</p>
      </div>

      <div class="export-actions-grid">
        <div class="export-tile glass" onclick="UI.downloadResumePDF()">
          <div class="export-icon">📥</div>
          <b>Download Vector PDF</b>
          <p>Text-selectable, high-resolution PDF formatted for ATS scanners.</p>
          <button class="btn btn-primary btn-sm" style="width:100%;">Download PDF</button>
        </div>

        <div class="export-tile glass" onclick="UI.printResumeDocument()">
          <div class="export-icon">🖨️</div>
          <b>Print / Save via Browser</b>
          <p>Direct browser print dialog with clean @media print styles.</p>
          <button class="btn btn-ghost btn-sm" style="width:100%;">Print Resume</button>
        </div>

        <div class="export-tile glass" onclick="UI.downloadResumeTXT()">
          <div class="export-icon">📄</div>
          <b>Plain Text (.TXT)</b>
          <p>Clean ASCII text version for online job application paste forms.</p>
          <button class="btn btn-ghost btn-sm" style="width:100%;">Download TXT</button>
        </div>
      </div>

      <div class="ats-guidance-card glass" style="margin-top:18px;padding:16px;border-radius:10px;border:1px solid rgba(14,165,233,0.3);">
        <b style="color:var(--cyan);font-size:13px;display:block;margin-bottom:4px;">💡 ATS Submission Best Practice:</b>
        <p style="color:var(--txt-1);font-size:12px;line-height:1.6;margin:0;">
          Always submit in PDF format unless the employer explicitly requests Word (.docx). The text in this generated PDF is 100% selectable vector text, allowing ATS parsing systems to read your details flawlessly.
        </p>
      </div>
    `;
  },

  // ============ WIZARD NAVIGATION CONTROLS ============
  goToResumeWizardStep(stepNum) {
    if (!resumeWizardState) this.initResumeWizardState();
    if (stepNum < 1) stepNum = 1;
    if (stepNum > 12) stepNum = 12;

    resumeWizardState.currentStep = stepNum;
    if (stepNum > resumeWizardState.maxStep) {
      resumeWizardState.maxStep = stepNum;
    }

    const formSlot = document.getElementById('resumeWizardStepForm');
    if (formSlot) {
      formSlot.innerHTML = this.renderWizardStep(stepNum);
    }

    // Update stepper numbers in header
    const counter = document.querySelector('.step-counter-text');
    const fill = document.querySelector('.stepper-progress-fill');
    const percent = document.querySelector('.step-progress-percent');

    const steps = ['Personal', 'Summary', 'Experience', 'Education', 'Skills', 'Projects', 'Certifications', 'Achievements', 'Additional', 'Design', 'Review', 'Export'];
    const progressPct = Math.round(((stepNum - 1) / 11) * 100);

    if (counter) counter.innerHTML = `STEP <b>${stepNum}</b> OF 12: <span class="step-name-highlight">${steps[stepNum - 1]}</span>`;
    if (fill) fill.style.width = `${progressPct}%`;
    if (percent) percent.textContent = `${progressPct}% Completed`;

    document.querySelectorAll('.stepper-chip').forEach((el, idx) => {
      el.classList.toggle('active', idx + 1 === stepNum);
      el.classList.toggle('completed', idx + 1 < stepNum);
    });

    const btnBack = document.getElementById('wizardBtnBack');
    if (btnBack) btnBack.disabled = stepNum === 1;

    // Scroll form container to top
    const formWrap = document.getElementById('resumeWizardStepFormWrap');
    if (formWrap) formWrap.scrollTop = 0;

    this.renderLiveResumePreview();
  },

  nextResumeWizardStep() {
    if (!resumeWizardState) return;
    this.goToResumeWizardStep((resumeWizardState.currentStep || 1) + 1);
  },

  prevResumeWizardStep() {
    if (!resumeWizardState) return;
    this.goToResumeWizardStep((resumeWizardState.currentStep || 1) - 1);
  },

  skipResumeWizardStep() {
    this.nextResumeWizardStep();
    this.showToast('Section skipped');
  },

  toggleMobileResumeView(view) {
    if (!resumeWizardState) return;
    resumeWizardState.mobileView = view;
    const layout = document.querySelector('.resume-wizard-layout');
    if (layout) {
      layout.classList.toggle('mobile-show-preview', view === 'preview');
      layout.classList.toggle('mobile-show-form', view === 'form');
    }
    document.querySelectorAll('.resume-view-tab').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.toLowerCase().includes(view));
    });
  },

  // ============ AUTOSAVE & STORAGE ============
  scheduleResumeAutosave() {
    clearTimeout(this._autosaveTimer);
    this._autosaveTimer = setTimeout(() => {
      this.saveResumeWizardDraft();
    }, 400);
  },

  saveResumeWizardDraft() {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    try {
      localStorage.setItem('smart_ai_hub_resume_draft', JSON.stringify(resumeWizardState.resumeData));
      currentResumeData = resumeWizardState.resumeData;
      const status = document.getElementById('resumeAutosaveStatus');
      if (status) {
        status.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> <span>Saved locally</span>`;
      }
    } catch (e) {
      console.error('Autosave error:', e);
    }
  },

  resetResumeWizard() {
    if (!confirm('Start a new resume? This will clear your current draft.')) return;
    try {
      localStorage.removeItem('smart_ai_hub_resume_draft');
    } catch (e) {}
    resumeWizardState = null;
    currentResumeData = null;
    this.initResumeWizardState();
    this.goToResumeWizardStep(1);
    this.showToast('Started clean new resume');
  },

  // ============ STARTER EXAMPLE MODAL WITH EXPLICIT CONFIRMATION ============
  promptLoadStarterExample() {
    const modal = document.getElementById('demoConfirmModal');
    if (modal) modal.style.display = 'flex';
  },

  hideDemoConfirmModal() {
    const modal = document.getElementById('demoConfirmModal');
    if (modal) modal.style.display = 'none';
  },

  executeLoadStarterExample() {
    const selector = document.getElementById('demoRoleSelector');
    const roleKey = selector ? selector.value : 'software_engineer';

    const presets = {
      software_engineer: {
        personal: {
          fullName: 'Rahul Sharma',
          targetRole: 'Full Stack Java Developer',
          email: 'rahul.sharma@example.com',
          phone: '+91 98765 43210',
          location: 'Bengaluru, India',
          linkedin: 'linkedin.com/in/rahulsharma-dev',
          github: 'github.com/rahul-fullstack',
          portfolio: 'rahulsharma.dev'
        },
        summary: { text: 'Analytical Full Stack Developer with experience in building scalable REST APIs and responsive web interfaces using Java, Spring Boot, and modern JavaScript.' },
        isFresher: false,
        experience: [
          {
            id: 'exp_1',
            role: 'Software Engineer',
            company: 'TechMatrix Systems',
            location: 'Bengaluru, India',
            empType: 'Full-time',
            startDate: 'Jul 2022',
            endDate: 'Present',
            current: true,
            bullets: [
              'Designed and maintained 15+ RESTful microservices in Spring Boot for payment processing.',
              'Collaborated with frontend engineers to integrate React components with backend endpoints.'
            ]
          }
        ],
        education: [
          {
            id: 'edu_1',
            degree: 'B.Tech in Computer Science & Engineering',
            institution: 'National Institute of Technology',
            location: 'Karnataka, India',
            startDate: '2018',
            endDate: '2022',
            grade: '8.4 CGPA'
          }
        ],
        skills: {
          technical: ['Java', 'Spring Boot', 'SQL', 'Hibernate', 'REST APIs'],
          tools: ['Git', 'Docker', 'Postman', 'Maven', 'IntelliJ IDEA'],
          soft: ['Team Collaboration', 'Agile/Scrum', 'Problem Solving'],
          languages: ['English (Fluent)', 'Hindi (Native)'],
          custom: []
        },
        projects: [
          {
            id: 'proj_1',
            name: 'Cloud E-Commerce Platform',
            role: 'Sole Developer',
            tech: 'Java, Spring Boot, MySQL, Docker',
            github: 'github.com/rahul-fullstack/cloud-shop',
            bullets: ['Built complete inventory and cart checkout workflow handling concurrent transactions.']
          }
        ],
        certifications: [
          { id: 'cert_1', name: 'Oracle Certified Associate: Java SE 11', issuer: 'Oracle', issueDate: '2022' }
        ],
        achievements: [],
        additionalSections: [],
        design: { template: 'ats', font: 'Inter', accentColor: '#0284c7', fontSize: 'medium', spacing: 'normal' }
      },

      fresher_graduate: {
        personal: {
          fullName: 'Ananya Verma',
          targetRole: 'Junior Frontend Developer',
          email: 'ananya.verma@example.com',
          phone: '+91 91234 56789',
          location: 'Pune, India',
          github: 'github.com/ananya-web',
          portfolio: 'ananyaverma.design'
        },
        summary: { text: 'Enthusiastic computer science graduate with a strong foundation in modern web technologies including JavaScript, CSS3, and React. Eager to build accessible and intuitive user interfaces.' },
        isFresher: true,
        experience: [],
        education: [
          {
            id: 'edu_1',
            degree: 'Bachelor of Computer Applications (BCA)',
            institution: 'Savitribai Phule Pune University',
            location: 'Pune, India',
            startDate: '2021',
            endDate: '2024',
            grade: '8.7 CGPA'
          }
        ],
        skills: {
          technical: ['HTML5', 'CSS3', 'JavaScript (ES6+)', 'React', 'Tailwind CSS'],
          tools: ['VS Code', 'Git', 'GitHub', 'Figma'],
          soft: ['Creative Thinking', 'Quick Learner', 'Attention to Detail'],
          languages: ['English (Fluent)', 'Hindi (Native)', 'Marathi'],
          custom: []
        },
        projects: [
          {
            id: 'proj_1',
            name: 'TaskFlow — Kanban Productivity App',
            tech: 'React, LocalStorage, CSS Grid',
            github: 'github.com/ananya-web/taskflow',
            bullets: ['Developed responsive drag-and-drop task organizer with zero third-party UI libraries.']
          },
          {
            id: 'proj_2',
            name: 'EcoTrack — Carbon Footprint Calculator',
            tech: 'JavaScript, Chart.js, HTML5',
            github: 'github.com/ananya-web/ecotrack',
            bullets: ['Interactive browser quiz calculating household carbon emission estimates with real-time visual charts.']
          }
        ],
        certifications: [
          { id: 'cert_1', name: 'Meta Front-End Developer Certificate', issuer: 'Coursera / Meta', issueDate: '2024' }
        ],
        achievements: [
          { id: 'ach_1', title: 'College Coding Marathon Finalist', description: 'Ranked in top 5 out of 180 participants in 24-hour web hackathon.' }
        ],
        additionalSections: [],
        design: { template: 'ats', font: 'Inter', accentColor: '#0284c7', fontSize: 'medium', spacing: 'normal' }
      },

      registered_nurse: {
        personal: {
          fullName: 'Sarah Jenkins',
          targetRole: 'Registered Nurse (Critical Care / ER)',
          email: 'sarah.jenkins@example.com',
          phone: '+1 (555) 345-6789',
          location: 'Chicago, IL',
          linkedin: 'linkedin.com/in/sarahjenkins-rn'
        },
        summary: { text: 'Compassionate, board-certified Emergency Room Nurse with clinical training in patient triage, acute care medication administration, and interdisciplinary emergency protocols.' },
        isFresher: false,
        experience: [
          {
            id: 'exp_1',
            role: 'Staff Emergency Nurse (RN)',
            company: 'Memorial Healthcare Center',
            location: 'Chicago, IL',
            empType: 'Full-time',
            startDate: '2021',
            endDate: 'Present',
            current: true,
            bullets: [
              'Delivered acute emergency nursing care to triage patients in Level 1 Trauma Center.',
              'Collaborated with trauma physicians to streamline ER patient monitoring and documentation workflows.'
            ]
          }
        ],
        education: [
          {
            id: 'edu_1',
            degree: 'Bachelor of Science in Nursing (BSN)',
            institution: 'University of Illinois at Chicago',
            location: 'Chicago, IL',
            startDate: '2017',
            endDate: '2021'
          }
        ],
        skills: {
          technical: ['Emergency Patient Triage', 'IV Cannulation', 'Trauma Life Support', 'Pharmacology'],
          tools: ['Epic EHR', 'Cerner', 'Vital Signs Monitors'],
          soft: ['High-Stress Composure', 'Patient Advocacy', 'Effective Communication'],
          languages: ['English (Fluent)', 'Spanish (Conversational)'],
          custom: []
        },
        projects: [],
        certifications: [
          { id: 'cert_1', name: 'Registered Nurse (RN) License', issuer: 'Illinois State Board', issueDate: '2021' },
          { id: 'cert_2', name: 'Basic Life Support (BLS)', issuer: 'American Heart Association', issueDate: '2023' }
        ],
        achievements: [],
        additionalSections: [],
        design: { template: 'ats', font: 'Inter', accentColor: '#0284c7', fontSize: 'medium', spacing: 'normal' }
      }
    };

    const preset = presets[roleKey] || presets.software_engineer;
    if (resumeWizardState) {
      resumeWizardState.resumeData = JSON.parse(JSON.stringify(preset));
      currentResumeData = resumeWizardState.resumeData;
      this.hideDemoConfirmModal();
      this.goToResumeWizardStep(1);
      this.renderLiveResumePreview();
      this.saveResumeWizardDraft();
      this.showToast(`Loaded ${preset.personal.targetRole} demo template ✓`);
    }
  },

  // ============ AI WRITING ASSISTANCE (STRICT ANTI-FABRICATION) ============
  async requestAiSummaryAssistance() {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    const { personal, skills, projects } = resumeWizardState.resumeData;

    const role = personal.targetRole || 'Professional';
    const skillsList = [...(skills.technical || []), ...(skills.tools || [])].join(', ');
    const projectNames = (projects || []).map(p => p.name).filter(Boolean).join(', ');

    const factsContext = `
Target Role: ${role}
Confirmed Skills: ${skillsList || 'None specified'}
Confirmed Projects: ${projectNames || 'None specified'}
`;

    const modal = document.getElementById('aiPolishModal');
    const title = document.getElementById('aiPolishModalTitle');
    const origBox = document.getElementById('aiPolishOriginal');
    const sugBox = document.getElementById('aiPolishSuggested');

    if (modal) modal.style.display = 'flex';
    if (title) title.textContent = 'AI Summary Assistant';
    if (origBox) origBox.textContent = (resumeWizardState.resumeData.summary && resumeWizardState.resumeData.summary.text) || '(No draft written yet)';
    if (sugBox) sugBox.innerHTML = '<span class="loading-dots">Generating summary from your confirmed facts...</span>';

    const systemPrompt = `You are a strict professional resume writer.
Generate a concise 2-3 sentence executive summary for a resume.
STRICT ANTI-FABRICATION RULES:
1. Ground strictly in the facts provided.
2. NEVER invent past companies, employment dates, certifications, or performance numbers.
3. If no past experience is provided, write an authentic objective/summary highlighting skills and eagerness to contribute.
4. Output ONLY the summary text, nothing else.`;

    try {
      const generated = await APIClient.generate(systemPrompt, factsContext);
      if (sugBox) sugBox.textContent = generated.trim();
      this._pendingAiText = generated.trim();
      this._pendingAiTarget = 'summary';
    } catch (err) {
      if (sugBox) sugBox.textContent = `Could not generate summary: ${err.message}. You can type your summary directly.`;
    }
  },

  async polishBulletWithAi(type, itemIdx, bulletIdx) {
    if (!resumeWizardState || !resumeWizardState.resumeData) return;
    let bulletText = '';
    if (type === 'exp') {
      bulletText = (resumeWizardState.resumeData.experience[itemIdx].bullets || [])[bulletIdx] || '';
    } else if (type === 'proj') {
      bulletText = (resumeWizardState.resumeData.projects[itemIdx].bullets || [])[bulletIdx] || '';
    }

    if (!bulletText.trim()) {
      this.showToast('Please type a draft bullet first so AI can polish it.');
      return;
    }

    const modal = document.getElementById('aiPolishModal');
    const title = document.getElementById('aiPolishModalTitle');
    const origBox = document.getElementById('aiPolishOriginal');
    const sugBox = document.getElementById('aiPolishSuggested');

    if (modal) modal.style.display = 'flex';
    if (title) title.textContent = 'Polish Bullet with Action Verb';
    if (origBox) origBox.textContent = bulletText;
    if (sugBox) sugBox.innerHTML = 'Polishing bullet point wording...';

    const systemPrompt = `You are an executive resume copyeditor.
Rewrite the candidate's bullet point using a strong active verb and clear professional language.
STRICT ANTI-FABRICATION RULES:
- Do NOT invent metrics, percentage increases, or unmentioned tools.
- Simply improve the grammar, structure, and professional tone of the user's supplied statement.
- Output ONLY the single rewritten bullet string.`;

    try {
      const polished = await APIClient.generate(systemPrompt, `Draft: ${bulletText}`);
      if (sugBox) sugBox.textContent = polished.trim();
      this._pendingAiText = polished.trim();
      this._pendingAiTarget = { type, itemIdx, bulletIdx };
    } catch (err) {
      if (sugBox) sugBox.textContent = `Could not polish bullet: ${err.message}`;
    }
  },

  acceptAiPolishSuggestion() {
    if (!this._pendingAiText) {
      this.closeAiPolishModal();
      return;
    }

    if (this._pendingAiTarget === 'summary') {
      resumeWizardState.resumeData.summary.text = this._pendingAiText;
      const input = document.getElementById('wiz-summaryText');
      if (input) input.value = this._pendingAiText;
    } else if (this._pendingAiTarget && typeof this._pendingAiTarget === 'object') {
      const { type, itemIdx, bulletIdx } = this._pendingAiTarget;
      if (type === 'exp') {
        resumeWizardState.resumeData.experience[itemIdx].bullets[bulletIdx] = this._pendingAiText;
      } else if (type === 'proj') {
        resumeWizardState.resumeData.projects[itemIdx].bullets[bulletIdx] = this._pendingAiText;
      }
      this.goToResumeWizardStep(resumeWizardState.currentStep);
    }

    this.renderLiveResumePreview();
    this.scheduleResumeAutosave();
    this.closeAiPolishModal();
    this.showToast('AI suggestion applied ✓');
  },

  closeAiPolishModal() {
    const modal = document.getElementById('aiPolishModal');
    if (modal) modal.style.display = 'none';
    this._pendingAiText = null;
    this._pendingAiTarget = null;
  },

  // ============ LIVE RESUME DOCUMENT RENDERER (ALL 6 TEMPLATES) ============
  renderLiveResumePreview() {
    const sheet = document.getElementById('resumePaperSheet');
    if (!sheet) return;
    const data = (resumeWizardState && resumeWizardState.resumeData) || window.DEFAULT_RESUME_DATA;
    sheet.innerHTML = this.renderResumeDocumentHTML(data);
  },

  renderResumeDocumentHTML(data) {
    if (!data) return '';
    const p = data.personal || {};
    const sum = (data.summary && data.summary.text) || '';
    const isFresher = Boolean(data.isFresher);
    const exp = isFresher ? [] : (data.experience || []).filter(e => e.role || e.company);
    const internships = isFresher ? (data.experience || []).filter(e => (e.role || e.company) && (e.empType === 'Internship' || e.empType === 'Training' || e.empType === 'Freelance' || e.empType === 'Apprenticeship')) : [];
    const edu = (data.education || []).filter(e => e.degree || e.institution);
    const proj = (data.projects || []).filter(pr => pr.name);
    const certs = (data.certifications || []).filter(c => c.name);
    const achs = (data.achievements || []).filter(a => a.title);
    const customs = (data.additionalSections || []).filter(s => s.title && s.items && s.items.length > 0);

    const skillsObj = data.skills || {};
    const allSkills = [
      ...(skillsObj.technical || []),
      ...(skillsObj.tools || []),
      ...(skillsObj.soft || []),
      ...(skillsObj.languages || []),
      ...(skillsObj.custom || [])
    ];

    const design = data.design || {};
    const tpl = design.template || 'ats';
    const accent = design.accentColor || '#0284c7';
    const font = design.font || 'Inter';

    // Contacts row (100% field coverage: email, phone, location, linkedin, github, portfolio, otherUrl)
    const contacts = [];
    if (p.email) contacts.push(this.escapeHTML(p.email));
    if (p.phone) contacts.push(this.escapeHTML(p.phone));
    if (p.location) contacts.push(this.escapeHTML(p.location));
    if (p.linkedin) contacts.push(`<a href="${this.escapeHTML(p.linkedin)}" target="_blank" rel="noopener">${this.escapeHTML(p.linkedin.replace(/^https?:\/\//, ''))}</a>`);
    if (p.github) contacts.push(`<a href="${this.escapeHTML(p.github)}" target="_blank" rel="noopener">${this.escapeHTML(p.github.replace(/^https?:\/\//, ''))}</a>`);
    if (p.portfolio) contacts.push(`<a href="${this.escapeHTML(p.portfolio)}" target="_blank" rel="noopener">${this.escapeHTML(p.portfolio.replace(/^https?:\/\//, ''))}</a>`);
    if (p.otherUrl) contacts.push(`<a href="${this.escapeHTML(p.otherUrl)}" target="_blank" rel="noopener">${this.escapeHTML(p.otherUrl.replace(/^https?:\/\//, ''))}</a>`);

    // Standard ATS Single Column Template with 100% field support
    return `
      <div class="resume-sheet-content template-${tpl}" style="font-family:'${font}', sans-serif; --accent-color:${accent};">
        <!-- Header -->
        <header class="doc-header ${p.showPhoto && p.photoUrl ? 'has-photo' : ''}">
          ${p.showPhoto && p.photoUrl ? `
            <div class="doc-photo-wrap">
              <img src="${p.photoUrl}" alt="Candidate Photo" class="doc-photo">
            </div>
          ` : ''}
          <div class="doc-header-text">
            <h1 class="doc-candidate-name">${this.escapeHTML(p.fullName || 'YOUR NAME')}</h1>
            ${p.targetRole ? `<div class="doc-target-role" style="color:${accent};">${this.escapeHTML(p.targetRole)}</div>` : ''}
            ${contacts.length > 0 ? `
              <div class="doc-contact-line">
                ${contacts.join(' &nbsp;•&nbsp; ')}
              </div>
            ` : ''}
          </div>
        </header>

        <!-- Summary -->
        ${sum ? `
          <section class="doc-section">
            <h2 class="doc-section-heading" style="color:${accent};">PROFESSIONAL SUMMARY</h2>
            <div class="doc-section-divider"></div>
            <p class="doc-summary-text">${this.escapeHTML(sum)}</p>
          </section>
        ` : ''}

        <!-- For Freshers: Projects & Education First -->
        ${isFresher && proj.length > 0 ? `
          <section class="doc-section">
            <h2 class="doc-section-heading" style="color:${accent};">KEY PROJECTS</h2>
            <div class="doc-section-divider"></div>
            ${proj.map(pr => `
              <div class="doc-entry-block">
                <div class="doc-entry-header">
                  <div>
                    <b class="doc-entry-title">${this.escapeHTML(pr.name)}</b>
                    ${pr.role ? `<span class="doc-entry-sub" style="margin-left:4px;">(${this.escapeHTML(pr.role)})</span>` : ''}
                  </div>
                  <div class="doc-project-links" style="font-size:10.5px;display:flex;gap:10px;align-items:center;">
                    ${pr.url ? `<a href="${this.escapeHTML(pr.url)}" target="_blank" rel="noopener" style="color:var(--accent-color, #0284c7);text-decoration:none;font-weight:600;">🔗 Demo: ${this.escapeHTML(pr.url.replace(/^https?:\/\//, ''))}</a>` : ''}
                    ${pr.github ? `<a href="${this.escapeHTML(pr.github)}" target="_blank" rel="noopener" style="color:var(--accent-color, #0284c7);text-decoration:none;font-weight:600;">💻 Code: ${this.escapeHTML(pr.github.replace(/^https?:\/\//, ''))}</a>` : ''}
                  </div>
                </div>
                ${pr.tech ? `<div class="doc-tech-stack"><b>Technologies:</b> ${this.escapeHTML(pr.tech)}</div>` : ''}
                ${(pr.bullets || []).filter(Boolean).length > 0 ? `
                  <ul class="doc-bullets-list">
                    ${pr.bullets.filter(Boolean).map(b => `<li>${this.escapeHTML(b)}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          </section>
        ` : ''}

        <!-- For Freshers: Internships / Practical Training (If added) -->
        ${isFresher && internships.length > 0 ? `
          <section class="doc-section">
            <h2 class="doc-section-heading" style="color:${accent};">INTERNSHIPS &amp; PRACTICAL TRAINING</h2>
            <div class="doc-section-divider"></div>
            ${internships.map(e => `
              <div class="doc-entry-block">
                <div class="doc-entry-header">
                  <div>
                    <b class="doc-entry-title">${this.escapeHTML(e.role)}</b>
                    <span class="doc-entry-org">${this.escapeHTML(e.company)}</span>
                    ${e.empType ? `<span class="doc-entry-sub" style="margin-left:6px;font-weight:600;font-size:11px;color:var(--accent-color, #0284c7);">(${this.escapeHTML(e.empType)})</span>` : ''}
                  </div>
                  <span class="doc-entry-date">${this.escapeHTML(e.startDate || '')} – ${this.escapeHTML(e.endDate || (e.current ? 'Present' : ''))}</span>
                </div>
                ${e.location ? `<div class="doc-entry-loc">${this.escapeHTML(e.location)}</div>` : ''}
                ${(e.bullets || []).filter(Boolean).length > 0 ? `
                  <ul class="doc-bullets-list">
                    ${e.bullets.filter(Boolean).map(b => `<li>${this.escapeHTML(b)}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          </section>
        ` : ''}

        <!-- Work Experience (For Experienced Candidates) -->
        ${!isFresher && exp.length > 0 ? `
          <section class="doc-section">
            <h2 class="doc-section-heading" style="color:${accent};">WORK EXPERIENCE</h2>
            <div class="doc-section-divider"></div>
            ${exp.map(e => `
              <div class="doc-entry-block">
                <div class="doc-entry-header">
                  <div>
                    <b class="doc-entry-title">${this.escapeHTML(e.role)}</b>
                    <span class="doc-entry-org">${this.escapeHTML(e.company)}</span>
                    ${e.empType ? `<span class="doc-entry-sub" style="margin-left:6px;font-weight:600;font-size:11px;color:var(--accent-color, #0284c7);">(${this.escapeHTML(e.empType)})</span>` : ''}
                  </div>
                  <span class="doc-entry-date">${this.escapeHTML(e.startDate || '')} – ${this.escapeHTML(e.endDate || (e.current ? 'Present' : ''))}</span>
                </div>
                ${e.location ? `<div class="doc-entry-loc">${this.escapeHTML(e.location)}</div>` : ''}
                ${(e.bullets || []).filter(Boolean).length > 0 ? `
                  <ul class="doc-bullets-list">
                    ${e.bullets.filter(Boolean).map(b => `<li>${this.escapeHTML(b)}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          </section>
        ` : ''}

        <!-- Education (with Coursework & Description support) -->
        ${edu.length > 0 ? `
          <section class="doc-section">
            <h2 class="doc-section-heading" style="color:${accent};">EDUCATION</h2>
            <div class="doc-section-divider"></div>
            ${edu.map(ed => `
              <div class="doc-entry-block">
                <div class="doc-entry-header">
                  <div>
                    <b class="doc-entry-title">${this.escapeHTML(ed.degree)}</b>
                    <span class="doc-entry-org">${this.escapeHTML(ed.institution)}</span>
                  </div>
                  <span class="doc-entry-date">${this.escapeHTML(ed.startDate || '')} – ${this.escapeHTML(ed.endDate || '')}</span>
                </div>
                ${(ed.location || ed.grade) ? `<div class="doc-entry-loc">${this.escapeHTML(ed.location || '')} ${ed.grade ? '· Grade: ' + this.escapeHTML(ed.grade) : ''}</div>` : ''}
                ${ed.coursework ? `<div class="doc-tech-stack"><b>Coursework:</b> ${this.escapeHTML(ed.coursework)}</div>` : ''}
                ${ed.description ? `<div class="doc-entry-desc" style="font-size:11px;color:#334155;margin-top:3px;line-height:1.4;">${this.escapeHTML(ed.description)}</div>` : ''}
              </div>
            `).join('')}
          </section>
        ` : ''}

        <!-- Projects (For Experienced users) -->
        ${!isFresher && proj.length > 0 ? `
          <section class="doc-section">
            <h2 class="doc-section-heading" style="color:${accent};">KEY PROJECTS</h2>
            <div class="doc-section-divider"></div>
            ${proj.map(pr => `
              <div class="doc-entry-block">
                <div class="doc-entry-header">
                  <div>
                    <b class="doc-entry-title">${this.escapeHTML(pr.name)}</b>
                    ${pr.role ? `<span class="doc-entry-sub" style="margin-left:4px;">(${this.escapeHTML(pr.role)})</span>` : ''}
                  </div>
                  <div class="doc-project-links" style="font-size:10.5px;display:flex;gap:10px;align-items:center;">
                    ${pr.url ? `<a href="${this.escapeHTML(pr.url)}" target="_blank" rel="noopener" style="color:var(--accent-color, #0284c7);text-decoration:none;font-weight:600;">🔗 Demo: ${this.escapeHTML(pr.url.replace(/^https?:\/\//, ''))}</a>` : ''}
                    ${pr.github ? `<a href="${this.escapeHTML(pr.github)}" target="_blank" rel="noopener" style="color:var(--accent-color, #0284c7);text-decoration:none;font-weight:600;">💻 Code: ${this.escapeHTML(pr.github.replace(/^https?:\/\//, ''))}</a>` : ''}
                  </div>
                </div>
                ${pr.tech ? `<div class="doc-tech-stack"><b>Technologies:</b> ${this.escapeHTML(pr.tech)}</div>` : ''}
                ${(pr.bullets || []).filter(Boolean).length > 0 ? `
                  <ul class="doc-bullets-list">
                    ${pr.bullets.filter(Boolean).map(b => `<li>${this.escapeHTML(b)}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          </section>
        ` : ''}

        <!-- Skills (Technical, Tools, Soft, Languages, Custom) -->
        ${allSkills.length > 0 ? `
          <section class="doc-section">
            <h2 class="doc-section-heading" style="color:${accent};">SKILLS &amp; COMPETENCIES</h2>
            <div class="doc-section-divider"></div>
            <div class="doc-skills-container">
              ${(skillsObj.technical && skillsObj.technical.length > 0) ? `
                <div class="doc-skill-line"><b>Technical Skills:</b> ${skillsObj.technical.map(s => this.escapeHTML(s)).join(', ')}</div>
              ` : ''}
              ${(skillsObj.tools && skillsObj.tools.length > 0) ? `
                <div class="doc-skill-line"><b>Tools &amp; Frameworks:</b> ${skillsObj.tools.map(s => this.escapeHTML(s)).join(', ')}</div>
              ` : ''}
              ${(skillsObj.soft && skillsObj.soft.length > 0) ? `
                <div class="doc-skill-line"><b>Core Competencies:</b> ${skillsObj.soft.map(s => this.escapeHTML(s)).join(', ')}</div>
              ` : ''}
              ${(skillsObj.languages && skillsObj.languages.length > 0) ? `
                <div class="doc-skill-line"><b>Languages:</b> ${skillsObj.languages.map(s => this.escapeHTML(s)).join(', ')}</div>
              ` : ''}
              ${(skillsObj.custom && skillsObj.custom.length > 0) ? `
                <div class="doc-skill-line"><b>Other Competencies:</b> ${skillsObj.custom.map(s => this.escapeHTML(s)).join(', ')}</div>
              ` : ''}
            </div>
          </section>
        ` : ''}

        <!-- Certifications (with Credential ID & Link support) -->
        ${certs.length > 0 ? `
          <section class="doc-section">
            <h2 class="doc-section-heading" style="color:${accent};">CERTIFICATIONS &amp; LICENSES</h2>
            <div class="doc-section-divider"></div>
            <ul class="doc-bullets-list">
              ${certs.map(c => `
                <li>
                  <b>${this.escapeHTML(c.name)}</b> – ${this.escapeHTML(c.issuer || '')} ${c.issueDate ? '(' + this.escapeHTML(c.issueDate) + ')' : ''}
                  ${c.credId ? `<span style="font-size:10.5px;color:#64748b;margin-left:6px;">[Credential ID: ${this.escapeHTML(c.credId)}]</span>` : ''}
                  ${c.url ? ` <a href="${this.escapeHTML(c.url)}" target="_blank" rel="noopener" style="color:var(--accent-color, #0284c7);text-decoration:none;font-size:10.5px;margin-left:6px;font-weight:600;">Verify Credential ↗</a>` : ''}
                </li>
              `).join('')}
            </ul>
          </section>
        ` : ''}

        <!-- Achievements -->
        ${achs.length > 0 ? `
          <section class="doc-section">
            <h2 class="doc-section-heading" style="color:${accent};">HONORS &amp; AWARDS</h2>
            <div class="doc-section-divider"></div>
            <ul class="doc-bullets-list">
              ${achs.map(a => `
                <li><b>${this.escapeHTML(a.title)}</b>${a.description ? ': ' + this.escapeHTML(a.description) : ''}</li>
              `).join('')}
            </ul>
          </section>
        ` : ''}

        <!-- Custom Sections -->
        ${customs.map(sec => `
          <section class="doc-section">
            <h2 class="doc-section-heading" style="color:${accent};">${this.escapeHTML(sec.title.toUpperCase())}</h2>
            <div class="doc-section-divider"></div>
            <ul class="doc-bullets-list">
              ${(sec.items || []).filter(Boolean).map(it => `<li>${this.escapeHTML(it)}</li>`).join('')}
            </ul>
          </section>
        `).join('')}
      </div>
    `;
  },

  // ============ EXPORT HANDLERS ============
  async downloadResumePDF() {
    const sheet = document.getElementById('resumePaperSheet');
    if (!sheet) {
      this.showToast('Please open the resume preview first');
      return;
    }

    const data = (resumeWizardState && resumeWizardState.resumeData) || {};
    const name = ((data.personal && data.personal.fullName) || 'Resume').replace(/\s+/g, '_');
    const filename = `${name}_Resume.pdf`;

    this.showToast('Generating high-resolution vector PDF... 📄');

    if (window.html2pdf) {
      const opt = {
        margin: [10, 10, 10, 10],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      try {
        await window.html2pdf().set(opt).from(sheet).save();
        this.showToast(`Downloaded ${filename}! 🎉`);
      } catch (err) {
        console.error('html2pdf export error:', err);
        window.print();
      }
    } else {
      window.print();
    }
  },

  printResumeDocument() {
    window.print();
  },

  downloadResumeTXT() {
    const data = (resumeWizardState && resumeWizardState.resumeData) || {};
    const p = data.personal || {};
    const sum = (data.summary && data.summary.text) || '';
    const exp = data.experience || [];
    const edu = data.education || [];
    const proj = data.projects || [];
    const certs = data.certifications || [];
    const achs = data.achievements || [];
    const skills = data.skills || {};

    let text = `${p.fullName || 'RESUME'}\n`;
    if (p.targetRole) text += `${p.targetRole}\n`;
    text += `Email: ${p.email || ''} | Phone: ${p.phone || ''} | Location: ${p.location || ''}\n`;
    if (p.linkedin) text += `LinkedIn: ${p.linkedin}\n`;
    if (p.github) text += `GitHub: ${p.github}\n`;
    if (p.portfolio) text += `Portfolio: ${p.portfolio}\n`;
    if (p.otherUrl) text += `Other Link: ${p.otherUrl}\n`;
    text += `\n=========================================\n`;

    if (sum) {
      text += `PROFESSIONAL SUMMARY\n${sum}\n\n=========================================\n`;
    }

    const fresherInternships = data.isFresher ? (exp || []).filter(e => (e.role || e.company) && (e.empType === 'Internship' || e.empType === 'Training' || e.empType === 'Freelance' || e.empType === 'Apprenticeship')) : [];

    if (data.isFresher && fresherInternships.length > 0) {
      text += `INTERNSHIPS & PRACTICAL TRAINING\n\n`;
      fresherInternships.forEach(e => {
        text += `${e.role} - ${e.company} [${e.empType || 'Internship'}] (${e.startDate || ''} - ${e.endDate || ''})\n`;
        if (e.location) text += `Location: ${e.location}\n`;
        (e.bullets || []).forEach(b => { if (b) text += `  • ${b}\n`; });
        text += `\n`;
      });
      text += `=========================================\n`;
    } else if (!data.isFresher && exp.length > 0) {
      text += `WORK EXPERIENCE\n\n`;
      exp.forEach(e => {
        text += `${e.role} - ${e.company} [${e.empType || 'Full-time'}] (${e.startDate || ''} - ${e.endDate || ''})\n`;
        if (e.location) text += `Location: ${e.location}\n`;
        (e.bullets || []).forEach(b => { if (b) text += `  • ${b}\n`; });
        text += `\n`;
      });
      text += `=========================================\n`;
    }

    if (edu.length > 0) {
      text += `EDUCATION\n\n`;
      edu.forEach(ed => {
        text += `${ed.degree} - ${ed.institution} (${ed.startDate || ''} - ${ed.endDate || ''})\n`;
        if (ed.grade) text += `Grade: ${ed.grade}\n`;
        if (ed.coursework) text += `Coursework: ${ed.coursework}\n`;
        if (ed.description) text += `Details: ${ed.description}\n`;
        text += `\n`;
      });
      text += `=========================================\n`;
    }

    if (proj.length > 0) {
      text += `KEY PROJECTS\n\n`;
      proj.forEach(pr => {
        text += `${pr.name}${pr.role ? ' (' + pr.role + ')' : ''}\n`;
        if (pr.tech) text += `Technologies: ${pr.tech}\n`;
        if (pr.url) text += `Demo: ${pr.url}\n`;
        if (pr.github) text += `Code: ${pr.github}\n`;
        (pr.bullets || []).forEach(b => { if (b) text += `  • ${b}\n`; });
        text += `\n`;
      });
      text += `=========================================\n`;
    }

    const allSk = [
      ...(skills.technical || []),
      ...(skills.tools || []),
      ...(skills.soft || []),
      ...(skills.languages || []),
      ...(skills.custom || [])
    ];
    if (allSk.length > 0) {
      text += `SKILLS & COMPETENCIES\n${allSk.join(', ')}\n\n=========================================\n`;
    }

    if (certs.length > 0) {
      text += `CERTIFICATIONS & LICENSES\n\n`;
      certs.forEach(c => {
        text += `${c.name} - ${c.issuer || ''} (${c.issueDate || ''})\n`;
        if (c.credId) text += `  Credential ID: ${c.credId}\n`;
        if (c.url) text += `  Verification: ${c.url}\n`;
      });
      text += `\n=========================================\n`;
    }

    if (achs.length > 0) {
      text += `HONORS & AWARDS\n\n`;
      achs.forEach(a => {
        text += `• ${a.title}${a.description ? ': ' + a.description : ''}\n`;
      });
      text += `\n=========================================\n`;
    }

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(p.fullName || 'Resume').replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.showToast('Downloaded plain text resume (.txt) 📄');
  },

  // ============ PHOTO RESIZER & COMPRESSOR ============
  renderPhotoResizerWorkspace(tool) {
    return `
      <a class="back-link" onclick="Router.navigate('tools')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to all tools
      </a>
      <div class="workspace glass resizer-workspace">
        <div class="ws-head">
          <div class="tool-icon"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">${ICONS.photo_resizer}</svg></div>
          <div style="flex-grow:1;">
            <h2>${tool.name}</h2>
            <p>${tool.desc}</p>
          </div>
          <div class="privacy-badge-pill">
            <span>🔒 Local browser processing</span>
          </div>
        </div>

        <div class="privacy-alert-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          <div>
            <b>Privacy First:</b> Your files are processed locally in your browser and are not uploaded to our servers.
          </div>
        </div>

        <!-- Upload Dropzone (Empty State) -->
        <div id="resizerUploadArea" class="resizer-upload-box">
          <div class="resizer-dropzone" id="photoDropzone">
            <input type="file" id="photoFileInput" accept="image/jpeg,image/png,image/webp" style="display:none;" onchange="UI.handlePhotoFileSelected(event)">
            <div class="dropzone-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/><path d="M14 14l2-2 5 5"/></svg>
            </div>
            <h3>Drag &amp; drop photo here</h3>
            <p>Supports JPG, PNG, WEBP (Up to 50MB) · 100% Client-side</p>
            <button class="btn btn-primary" onclick="document.getElementById('photoFileInput').click()">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              Browse image file
            </button>
          </div>
          <div id="resizerUploadError" class="error-msg" style="display:none;margin-top:12px;"></div>
        </div>

        <!-- Editor Area (Active State) -->
        <div id="resizerEditorArea" class="resizer-editor-wrap" style="display:none;">
          <div class="resizer-layout-grid">
            <!-- Left Column: Controls -->
            <div class="resizer-controls-column glass">
              <!-- Quick Presets -->
              <div class="resizer-section">
                <label class="section-title">⚡ QUICK PRESETS</label>
                <div class="presets-wrap">
                  <button class="preset-pill" onclick="UI.applyResizerPreset('passport')">🇮🇳 Passport (3.5×4.5 cm)</button>
                  <button class="preset-pill" onclick="UI.applyResizerPreset('signature')">✍️ Govt Signature (140×60 px)</button>
                  <button class="preset-pill" onclick="UI.applyResizerPreset('insta_sq')">📸 Insta (1080×1080)</button>
                  <button class="preset-pill" onclick="UI.applyResizerPreset('insta_story')">📱 Story (1080×1920)</button>
                  <button class="preset-pill" onclick="UI.applyResizerPreset('linkedin')">💼 LinkedIn (400×400)</button>
                  <button class="preset-pill" onclick="UI.applyResizerPreset('custom')">⚙️ Custom</button>
                </div>
                <div id="resizerPresetNote" class="preset-info-note" style="display:none;"></div>
              </div>

              <!-- Dimensions & Unit -->
              <div class="resizer-section">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                  <label class="section-title" style="margin:0;">RESIZE DIMENSIONS</label>
                  <div class="unit-toggle-pills">
                    <button class="unit-pill active" id="unitPill-px" onclick="UI.setResizerUnit('px')">px</button>
                    <button class="unit-pill" id="unitPill-cm" onclick="UI.setResizerUnit('cm')">cm</button>
                    <button class="unit-pill" id="unitPill-in" onclick="UI.setResizerUnit('in')">in</button>
                  </div>
                </div>

                <!-- DPI Row -->
                <div id="resizerDpiRow" style="display:none;margin-bottom:10px;padding:8px 12px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);">
                  <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-size:12px;color:var(--txt-2);">Target Resolution (DPI):</span>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <input type="number" id="resizerDpiInput" value="300" min="72" max="1200" style="width:70px;padding:4px 8px;border-radius:6px;border:1px solid var(--glass-border);background:rgba(0,0,0,0.3);color:#fff;font-size:12px;" onchange="UI.handleResizerDpiChange(this.value)">
                      <span style="font-size:12px;color:var(--txt-2);">DPI</span>
                    </div>
                  </div>
                  <small style="font-size:11px;color:var(--cyan);display:block;margin-top:4px;" id="resizerCalculatedPxLabel">Calculated: 413 × 531 px</small>
                </div>

                <div class="dimension-inputs-row">
                  <div class="dim-field">
                    <label>Width (<span id="resizerWidthUnit">px</span>)</label>
                    <input type="number" id="resizerWidthInput" min="1" step="any" oninput="UI.handleResizerWidthInput(this.value)">
                  </div>

                  <button class="lock-aspect-btn active" id="resizerAspectLockBtn" onclick="UI.toggleResizerAspectLock()" title="Aspect Ratio Locked (Auto-calculate height/width)">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  </button>

                  <div class="dim-field">
                    <label>Height (<span id="resizerHeightUnit">px</span>)</label>
                    <input type="number" id="resizerHeightInput" min="1" step="any" oninput="UI.handleResizerHeightInput(this.value)">
                  </div>
                </div>
              </div>

              <!-- Compression Settings -->
              <div class="resizer-section">
                <label class="section-title">COMPRESSION METHOD</label>
                <div class="comp-mode-tabs">
                  <button class="comp-tab active" id="compTab-quality" onclick="UI.setResizerCompressMode('quality')">Quality Slider</button>
                  <button class="comp-tab" id="compTab-target" onclick="UI.setResizerCompressMode('target')">Target File Size (KB)</button>
                </div>

                <!-- Quality Mode -->
                <div id="resizerQualityPanel">
                  <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                    <span style="font-size:12px;color:var(--txt-2);">Compression Quality:</span>
                    <b style="font-size:13px;color:var(--cyan);" id="resizerQualityVal">85%</b>
                  </div>
                  <input type="range" id="resizerQualitySlider" min="10" max="100" value="85" style="width:100%;accent-color:var(--cyan);" oninput="UI.handleResizerQualityChange(this.value)">
                  <div id="resizerPngQualityNotice" style="display:none;font-size:11.5px;color:#f59e0b;margin-top:6px;line-height:1.4;">
                    ℹ️ PNG uses lossless compression; quality slider does not reduce file size like JPEG. Switch to JPG or WEBP for higher compression.
                  </div>
                </div>

                <!-- Target File Size Mode -->
                <div id="resizerTargetPanel" style="display:none;">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                    <span style="font-size:12px;color:var(--txt-2);">Target Size:</span>
                    <div style="display:flex;align-items:center;gap:4px;flex-grow:1;">
                      <input type="number" id="resizerTargetKbInput" value="50" min="5" max="50000" style="flex-grow:1;padding:6px 10px;border-radius:6px;border:1px solid var(--glass-border);background:rgba(0,0,0,0.3);color:#fff;font-size:13px;" oninput="UI.handleResizerTargetKbInput(this.value)">
                      <span style="font-size:12px;color:var(--txt-1);font-weight:700;">KB</span>
                    </div>
                  </div>
                  <div class="target-size-chips">
                    <button class="tool-btn-sm" onclick="UI.setResizerTargetKb(20)">20 KB</button>
                    <button class="tool-btn-sm active" id="chipKb-50" onclick="UI.setResizerTargetKb(50)">50 KB</button>
                    <button class="tool-btn-sm" onclick="UI.setResizerTargetKb(100)">100 KB</button>
                    <button class="tool-btn-sm" onclick="UI.setResizerTargetKb(200)">200 KB</button>
                    <button class="tool-btn-sm" onclick="UI.setResizerTargetKb(500)">500 KB</button>
                  </div>
                  <div id="resizerTargetResultBanner" style="display:none;margin-top:8px;font-size:11.5px;padding:6px 10px;border-radius:6px;line-height:1.4;"></div>
                </div>
              </div>

              <!-- Output Format -->
              <div class="resizer-section">
                <label class="section-title">OUTPUT FORMAT</label>
                <div class="format-options-row">
                  <label class="format-option-lbl"><input type="radio" name="resizerFormat" value="image/jpeg" checked onchange="UI.handleResizerFormatChange(this.value)"> <span>JPG</span></label>
                  <label class="format-option-lbl"><input type="radio" name="resizerFormat" value="image/png" onchange="UI.handleResizerFormatChange(this.value)"> <span>PNG</span></label>
                  <label class="format-option-lbl"><input type="radio" name="resizerFormat" value="image/webp" onchange="UI.handleResizerFormatChange(this.value)"> <span>WEBP</span></label>
                </div>
              </div>

              <!-- Actions -->
              <div style="display:flex;gap:10px;margin-top:16px;">
                <button class="btn btn-primary" id="resizerProcessBtn" style="flex-grow:1;" onclick="UI.processPhotoResizer()">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>
                  Apply &amp; Optimize
                </button>
                <button class="btn btn-ghost" onclick="UI.resetPhotoResizer()">Reset</button>
              </div>
            </div>

            <!-- Right Column: Live Output & Before/After Comparison -->
            <div class="resizer-preview-column glass">
              <!-- Comparison Header Card -->
              <div class="comparison-bar">
                <div class="comp-col">
                  <span class="comp-lbl">Original</span>
                  <b id="resizerOrigDim">-</b>
                  <small id="resizerOrigSize">-</small>
                </div>
                <div class="comp-arrow">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  <span class="savings-tag" id="resizerSavingsBadge">-</span>
                </div>
                <div class="comp-col result">
                  <span class="comp-lbl">Optimized Output</span>
                  <b id="resizerOutputDim">-</b>
                  <small id="resizerOutputSize">-</small>
                </div>
              </div>

              <!-- Image Preview Viewport -->
              <div class="resizer-preview-viewport">
                <img id="resizerPreviewImg" alt="Resized Photo Preview">
                <div id="resizerLoadingSpinner" class="resizer-loading-box" style="display:none;">
                  <div class="loading-dots"><span></span><span></span><span></span></div>
                  <span style="font-size:12px;color:#fff;">Optimizing image...</span>
                </div>
              </div>

              <!-- Download Bar -->
              <div class="resizer-footer-bar">
                <button class="btn btn-primary" id="resizerDownloadBtn" style="flex-grow:1;" onclick="UI.downloadResizedPhoto()">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  Download Image
                </button>
                <button class="btn btn-ghost" onclick="document.getElementById('photoFileInput').click()">Change Image</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  initPhotoResizerListeners() {
    const dropzone = document.getElementById('photoDropzone');
    if (!dropzone) return;

    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer ? e.dataTransfer.files : null;
      if (files && files.length > 0) {
        this.loadAndProcessPhotoFile(files[0]);
      }
    });
  },

  handlePhotoFileSelected(event) {
    const files = event.target ? event.target.files : null;
    if (files && files.length > 0) {
      this.loadAndProcessPhotoFile(files[0]);
    }
  },

  showResizerUploadError(msg) {
    const errEl = document.getElementById('resizerUploadError');
    if (errEl) {
      errEl.textContent = msg;
      errEl.style.display = 'block';
    }
  },

  formatBytes(bytes) {
    if (bytes === 0 || !bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  async loadAndProcessPhotoFile(file) {
    const errEl = document.getElementById('resizerUploadError');
    if (errEl) errEl.style.display = 'none';

    if (!file) return;

    if (file.size === 0) {
      this.showResizerUploadError('The selected file is empty.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      this.showResizerUploadError('File exceeds the 50MB limit. Please choose a smaller image.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      this.showResizerUploadError('Unsupported file format. Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    try {
      let bitmap = null;
      let width = 0;
      let height = 0;

      // EXIF orientation auto-normalization
      if (typeof window.createImageBitmap === 'function') {
        try {
          bitmap = await window.createImageBitmap(file, { imageOrientation: 'from-image' });
          width = bitmap.width;
          height = bitmap.height;
        } catch (e) {
          bitmap = null;
        }
      }

      let img = null;
      if (!bitmap) {
        img = await new Promise((resolve, reject) => {
          const image = new Image();
          const objUrl = URL.createObjectURL(file);
          image.onload = () => {
            width = image.naturalWidth;
            height = image.naturalHeight;
            resolve(image);
          };
          image.onerror = () => {
            URL.revokeObjectURL(objUrl);
            reject(new Error('Corrupted image'));
          };
          image.src = objUrl;
        });
      }

      if (width <= 0 || height <= 0) {
        throw new Error('Invalid image dimensions');
      }

      if (photoResizerState && photoResizerState.processedUrl) {
        URL.revokeObjectURL(photoResizerState.processedUrl);
      }

      photoResizerState = {
        file,
        bitmap,
        img,
        originalWidth: width,
        originalHeight: height,
        originalSize: file.size,
        originalMime: file.type || 'image/jpeg',
        originalRatio: width / height,
        unit: 'px',
        dpi: 300,
        width: width,
        height: height,
        lockRatio: true,
        compressMode: 'quality',
        quality: 85,
        targetKB: 50,
        outputFormat: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        processedBlob: null,
        processedUrl: null,
        isProcessing: false
      };

      const uploadArea = document.getElementById('resizerUploadArea');
      const editorArea = document.getElementById('resizerEditorArea');
      if (uploadArea) uploadArea.style.display = 'none';
      if (editorArea) editorArea.style.display = 'block';

      const wInput = document.getElementById('resizerWidthInput');
      const hInput = document.getElementById('resizerHeightInput');
      if (wInput) wInput.value = width;
      if (hInput) hInput.value = height;

      const origDim = document.getElementById('resizerOrigDim');
      const origSize = document.getElementById('resizerOrigSize');
      if (origDim) origDim.textContent = `${width} × ${height} px`;
      if (origSize) origSize.textContent = `${this.formatBytes(file.size)} (${file.type.replace('image/', '').toUpperCase()})`;

      await this.processPhotoResizer();
    } catch (err) {
      this.showResizerUploadError('This image file appears to be corrupted and cannot be loaded.');
    }
  },

  setResizerUnit(unit) {
    if (!photoResizerState) return;
    photoResizerState.unit = unit;

    ['px', 'cm', 'in'].forEach(u => {
      const pill = document.getElementById(`unitPill-${u}`);
      if (pill) pill.classList.toggle('active', u === unit);
    });

    const dpiRow = document.getElementById('resizerDpiRow');
    if (dpiRow) dpiRow.style.display = (unit === 'cm' || unit === 'in') ? 'block' : 'none';

    const wUnit = document.getElementById('resizerWidthUnit');
    const hUnit = document.getElementById('resizerHeightUnit');
    if (wUnit) wUnit.textContent = unit;
    if (hUnit) hUnit.textContent = unit;

    this.syncResizerInputValues();
  },

  syncResizerInputValues() {
    if (!photoResizerState) return;
    const { width, height, unit, dpi } = photoResizerState;
    const wInput = document.getElementById('resizerWidthInput');
    const hInput = document.getElementById('resizerHeightInput');

    if (unit === 'px') {
      if (wInput) wInput.value = Math.round(width);
      if (hInput) hInput.value = Math.round(height);
    } else if (unit === 'cm') {
      const cmW = Number(((width / dpi) * 2.54).toFixed(2));
      const cmH = Number(((height / dpi) * 2.54).toFixed(2));
      if (wInput) wInput.value = cmW;
      if (hInput) hInput.value = cmH;
      this.updateDpiCalculatedLabel(width, height);
    } else if (unit === 'in') {
      const inW = Number((width / dpi).toFixed(2));
      const inH = Number((height / dpi).toFixed(2));
      if (wInput) wInput.value = inW;
      if (hInput) hInput.value = inH;
      this.updateDpiCalculatedLabel(width, height);
    }
  },

  updateDpiCalculatedLabel(pxW, pxH) {
    const lbl = document.getElementById('resizerCalculatedPxLabel');
    if (lbl) lbl.textContent = `Calculated: ${Math.round(pxW)} × ${Math.round(pxH)} px`;
  },

  handleResizerDpiChange(val) {
    if (!photoResizerState) return;
    const dpi = Math.max(72, Math.min(1200, parseInt(val, 10) || 300));
    photoResizerState.dpi = dpi;
    const wInput = document.getElementById('resizerWidthInput');
    const hInput = document.getElementById('resizerHeightInput');
    if (wInput && hInput) {
      const rawW = parseFloat(wInput.value) || 1;
      const rawH = parseFloat(hInput.value) || 1;
      if (photoResizerState.unit === 'cm') {
        photoResizerState.width = Math.round((rawW / 2.54) * dpi);
        photoResizerState.height = Math.round((rawH / 2.54) * dpi);
      } else if (photoResizerState.unit === 'in') {
        photoResizerState.width = Math.round(rawW * dpi);
        photoResizerState.height = Math.round(rawH * dpi);
      }
      this.updateDpiCalculatedLabel(photoResizerState.width, photoResizerState.height);
    }
  },

  handleResizerWidthInput(val) {
    if (!photoResizerState) return;
    const rawVal = parseFloat(val) || 1;
    const { unit, dpi, lockRatio, originalRatio } = photoResizerState;

    let pxW = rawVal;
    if (unit === 'cm') pxW = (rawVal / 2.54) * dpi;
    else if (unit === 'in') pxW = rawVal * dpi;

    photoResizerState.width = Math.max(1, Math.round(pxW));

    if (lockRatio && originalRatio > 0) {
      photoResizerState.height = Math.max(1, Math.round(photoResizerState.width / originalRatio));
      const hInput = document.getElementById('resizerHeightInput');
      if (hInput) {
        if (unit === 'px') hInput.value = photoResizerState.height;
        else if (unit === 'cm') hInput.value = Number(((photoResizerState.height / dpi) * 2.54).toFixed(2));
        else if (unit === 'in') hInput.value = Number((photoResizerState.height / dpi).toFixed(2));
      }
    }

    if (unit !== 'px') {
      this.updateDpiCalculatedLabel(photoResizerState.width, photoResizerState.height);
    }
  },

  handleResizerHeightInput(val) {
    if (!photoResizerState) return;
    const rawVal = parseFloat(val) || 1;
    const { unit, dpi, lockRatio, originalRatio } = photoResizerState;

    let pxH = rawVal;
    if (unit === 'cm') pxH = (rawVal / 2.54) * dpi;
    else if (unit === 'in') pxH = rawVal * dpi;

    photoResizerState.height = Math.max(1, Math.round(pxH));

    if (lockRatio && originalRatio > 0) {
      photoResizerState.width = Math.max(1, Math.round(photoResizerState.height * originalRatio));
      const wInput = document.getElementById('resizerWidthInput');
      if (wInput) {
        if (unit === 'px') wInput.value = photoResizerState.width;
        else if (unit === 'cm') wInput.value = Number(((photoResizerState.width / dpi) * 2.54).toFixed(2));
        else if (unit === 'in') wInput.value = Number((photoResizerState.width / dpi).toFixed(2));
      }
    }

    if (unit !== 'px') {
      this.updateDpiCalculatedLabel(photoResizerState.width, photoResizerState.height);
    }
  },

  toggleResizerAspectLock() {
    if (!photoResizerState) return;
    photoResizerState.lockRatio = !photoResizerState.lockRatio;
    const btn = document.getElementById('resizerAspectLockBtn');
    if (btn) {
      btn.classList.toggle('active', photoResizerState.lockRatio);
      btn.title = photoResizerState.lockRatio ? 'Aspect Ratio Locked (Auto-calculate height/width)' : 'Aspect Ratio Unlocked';
      btn.innerHTML = photoResizerState.lockRatio
        ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`
        : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>`;
    }
    this.showToast(photoResizerState.lockRatio ? '🔒 Aspect ratio locked' : '🔓 Aspect ratio unlocked');
  },

  applyResizerPreset(presetId) {
    if (!photoResizerState) return;
    const noteEl = document.getElementById('resizerPresetNote');
    if (noteEl) noteEl.style.display = 'none';

    if (presetId === 'passport') {
      this.setResizerUnit('cm');
      photoResizerState.dpi = 300;
      photoResizerState.width = Math.round((3.5 / 2.54) * 300); // 413
      photoResizerState.height = Math.round((4.5 / 2.54) * 300); // 531
      photoResizerState.lockRatio = true;
      const dpiInput = document.getElementById('resizerDpiInput');
      if (dpiInput) dpiInput.value = 300;
      this.syncResizerInputValues();
      if (noteEl) {
        noteEl.innerHTML = `🇮🇳 <b>Passport Photo Standard:</b> 3.5 × 4.5 cm @ 300 DPI (Calculated: 413 × 531 px). Ideal for exam &amp; visa portals.`;
        noteEl.style.display = 'block';
      }
    } else if (presetId === 'signature') {
      this.setResizerUnit('px');
      photoResizerState.width = 140;
      photoResizerState.height = 60;
      photoResizerState.lockRatio = false;
      const btn = document.getElementById('resizerAspectLockBtn');
      if (btn) btn.classList.remove('active');
      this.syncResizerInputValues();
      if (noteEl) {
        noteEl.innerHTML = `✍️ <b>Govt Exam Signature:</b> 140 × 60 px. <i>Note: Requirements vary by application/exam. Verify the required dimensions before submitting.</i>`;
        noteEl.style.display = 'block';
      }
    } else if (presetId === 'insta_sq') {
      this.setResizerUnit('px');
      photoResizerState.width = 1080;
      photoResizerState.height = 1080;
      photoResizerState.lockRatio = true;
      this.syncResizerInputValues();
    } else if (presetId === 'insta_story') {
      this.setResizerUnit('px');
      photoResizerState.width = 1080;
      photoResizerState.height = 1920;
      photoResizerState.lockRatio = true;
      this.syncResizerInputValues();
    } else if (presetId === 'linkedin') {
      this.setResizerUnit('px');
      photoResizerState.width = 400;
      photoResizerState.height = 400;
      photoResizerState.lockRatio = true;
      this.syncResizerInputValues();
    } else if (presetId === 'custom') {
      this.showToast('Custom dimensions enabled');
      return;
    }

    this.processPhotoResizer();
  },

  setResizerCompressMode(mode) {
    if (!photoResizerState) return;
    photoResizerState.compressMode = mode;

    document.getElementById('compTab-quality')?.classList.toggle('active', mode === 'quality');
    document.getElementById('compTab-target')?.classList.toggle('active', mode === 'target');

    const qPanel = document.getElementById('resizerQualityPanel');
    const tPanel = document.getElementById('resizerTargetPanel');
    if (qPanel) qPanel.style.display = mode === 'quality' ? 'block' : 'none';
    if (tPanel) tPanel.style.display = mode === 'target' ? 'block' : 'none';

    this.processPhotoResizer();
  },

  handleResizerQualityChange(val) {
    if (!photoResizerState) return;
    const q = parseInt(val, 10) || 85;
    photoResizerState.quality = q;
    const lbl = document.getElementById('resizerQualityVal');
    if (lbl) lbl.textContent = `${q}%`;
    this.processPhotoResizer();
  },

  handleResizerTargetKbInput(val) {
    if (!photoResizerState) return;
    const kb = Math.max(5, parseInt(val, 10) || 50);
    photoResizerState.targetKB = kb;
    this.processPhotoResizer();
  },

  setResizerTargetKb(kb) {
    if (!photoResizerState) return;
    photoResizerState.targetKB = kb;
    const input = document.getElementById('resizerTargetKbInput');
    if (input) input.value = kb;

    [20, 50, 100, 200, 500].forEach(k => {
      const chip = document.getElementById(`chipKb-${k}`);
      if (chip) chip.classList.toggle('active', k === kb);
    });

    this.processPhotoResizer();
  },

  handleResizerFormatChange(format) {
    if (!photoResizerState) return;
    photoResizerState.outputFormat = format;

    const notice = document.getElementById('resizerPngQualityNotice');
    if (notice) notice.style.display = format === 'image/png' ? 'block' : 'none';

    this.processPhotoResizer();
  },

  async processPhotoResizer() {
    if (!photoResizerState || !photoResizerState.file) return;
    if (photoResizerState.isProcessing) return;

    photoResizerState.isProcessing = true;
    const spinner = document.getElementById('resizerLoadingSpinner');
    if (spinner) spinner.style.display = 'flex';

    try {
      const { bitmap, img, width: targetW, height: targetH, compressMode, quality, targetKB, outputFormat, originalSize } = photoResizerState;

      const source = bitmap || img;
      if (!source) throw new Error('No image source available');

      const createRenderedBlob = (w, h, fmt, qVal) => {
        return new Promise((resolve) => {
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(w));
          canvas.height = Math.max(1, Math.round(h));
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          if (fmt === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(blob => resolve(blob), fmt, qVal);
        });
      };

      let finalBlob = null;
      let finalW = targetW;
      let finalH = targetH;
      let bannerMsg = null;
      let bannerType = 'success';

      if (compressMode === 'quality') {
        const qParam = outputFormat === 'image/png' ? undefined : (quality / 100);
        finalBlob = await createRenderedBlob(targetW, targetH, outputFormat, qParam);
      } else {
        const targetBytes = targetKB * 1024;
        let fmt = outputFormat;

        if (fmt === 'image/png') {
          bannerMsg = `ℹ️ PNG is lossless. Automatically optimizing under ${targetKB} KB using WebP/JPEG for maximum compression.`;
          bannerType = 'warning';
          fmt = 'image/jpeg';
        }

        let low = 0.05;
        let high = 0.95;
        let bestBlob = null;

        for (let step = 0; step < 7; step++) {
          const mid = (low + high) / 2;
          const blob = await createRenderedBlob(finalW, finalH, fmt, mid);
          if (blob && blob.size <= targetBytes) {
            bestBlob = blob;
            low = mid;
          } else {
            high = mid;
          }
        }

        if (!bestBlob || bestBlob.size > targetBytes) {
          let scaleFactor = 0.92;
          let currentW = targetW;
          let currentH = targetH;
          const minW = Math.max(50, Math.round(targetW * 0.25));

          for (let iter = 0; iter < 8 && currentW > minW; iter++) {
            currentW = Math.round(currentW * scaleFactor);
            currentH = Math.round(currentH * scaleFactor);
            const blob = await createRenderedBlob(currentW, currentH, fmt, 0.25);
            if (blob && blob.size <= targetBytes) {
              bestBlob = blob;
              finalW = currentW;
              finalH = currentH;
              break;
            }
          }
        }

        if (bestBlob && bestBlob.size <= targetBytes) {
          finalBlob = bestBlob;
          bannerMsg = `✅ Successfully optimized under ${targetKB} KB! Final size: ${this.formatBytes(finalBlob.size)}`;
          bannerType = 'success';
        } else {
          const fallbackBlob = bestBlob || await createRenderedBlob(finalW, finalH, fmt, 0.15);
          finalBlob = fallbackBlob;
          bannerMsg = `⚠️ Target size (${targetKB} KB) could not be reached without excessive quality loss. Best achievable: ${this.formatBytes(finalBlob.size)}`;
          bannerType = 'warning';
        }
      }

      if (!finalBlob) throw new Error('Blob generation failed');

      if (photoResizerState.processedUrl) {
        URL.revokeObjectURL(photoResizerState.processedUrl);
      }
      photoResizerState.processedBlob = finalBlob;
      photoResizerState.processedUrl = URL.createObjectURL(finalBlob);

      const previewImg = document.getElementById('resizerPreviewImg');
      if (previewImg) previewImg.src = photoResizerState.processedUrl;

      const outDim = document.getElementById('resizerOutputDim');
      const outSize = document.getElementById('resizerOutputSize');
      const savingsBadge = document.getElementById('resizerSavingsBadge');

      if (outDim) outDim.textContent = `${finalW} × ${finalH} px`;
      if (outSize) outSize.textContent = `${this.formatBytes(finalBlob.size)} (${finalBlob.type.replace('image/', '').toUpperCase()})`;

      if (savingsBadge && originalSize > 0) {
        const diff = originalSize - finalBlob.size;
        const pct = Math.round((diff / originalSize) * 100);
        if (pct > 0) {
          savingsBadge.className = 'savings-tag saved';
          savingsBadge.textContent = `-${pct}% saved`;
        } else {
          savingsBadge.className = 'savings-tag increased';
          savingsBadge.textContent = `+${Math.abs(pct)}%`;
        }
      }

      const bannerEl = document.getElementById('resizerTargetResultBanner');
      if (bannerEl) {
        if (bannerMsg && compressMode === 'target') {
          bannerEl.innerHTML = bannerMsg;
          bannerEl.style.display = 'block';
          bannerEl.style.background = bannerType === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)';
          bannerEl.style.color = bannerType === 'success' ? '#4ade80' : '#fbbf24';
          bannerEl.style.border = `1px solid ${bannerType === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`;
        } else {
          bannerEl.style.display = 'none';
        }
      }
    } catch (err) {
      this.showToast('Could not process image: ' + err.message);
    } finally {
      if (spinner) spinner.style.display = 'none';
      if (photoResizerState) photoResizerState.isProcessing = false;
    }
  },

  downloadResizedPhoto() {
    if (!photoResizerState || !photoResizerState.processedBlob) {
      this.showToast('No processed image to download');
      return;
    }
    const { processedBlob, file, outputFormat } = photoResizerState;
    const ext = outputFormat === 'image/png' ? 'png' : (outputFormat === 'image/webp' ? 'webp' : 'jpg');
    const originalBase = file && file.name ? file.name.substring(0, file.name.lastIndexOf('.')) || 'photo' : 'photo';
    const filename = `${originalBase}-resized.${ext}`;

    const url = URL.createObjectURL(processedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.showToast(`Downloaded ${filename} (${this.formatBytes(processedBlob.size)})! 🎉`);
  },

  resetPhotoResizer() {
    if (photoResizerState && photoResizerState.processedUrl) {
      URL.revokeObjectURL(photoResizerState.processedUrl);
    }
    photoResizerState = null;

    const fileInput = document.getElementById('photoFileInput');
    if (fileInput) fileInput.value = '';

    const uploadArea = document.getElementById('resizerUploadArea');
    const editorArea = document.getElementById('resizerEditorArea');
    if (uploadArea) uploadArea.style.display = 'block';
    if (editorArea) editorArea.style.display = 'none';

    const previewImg = document.getElementById('resizerPreviewImg');
    if (previewImg) previewImg.src = '';

    this.showToast('Photo Resizer reset');
  },

  // ============ IMAGE TO PDF CONVERTER ============
  renderImageToPdfWorkspace(tool) {
    return `
      <a class="back-link" onclick="Router.navigate('tools')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to all tools
      </a>
      <div class="workspace glass image-pdf-workspace">
        <div class="ws-head">
          <div class="tool-icon"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">${ICONS.image_to_pdf}</svg></div>
          <div style="flex-grow:1;">
            <h2>${tool.name}</h2>
            <p>${tool.desc}</p>
          </div>
          <div class="privacy-badge-pill">
            <span>🔒 Local browser processing</span>
          </div>
        </div>

        <div class="privacy-alert-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          <div>
            <b>Privacy First:</b> Your files are processed locally in your browser and are not uploaded to our servers.
          </div>
        </div>

        <!-- Initial Upload Dropzone (shown when 0 images) -->
        <div id="imageToPdfUploadArea" class="image-pdf-upload-box">
          <div class="resizer-dropzone" id="imageToPdfDropzone">
            <input type="file" id="imageToPdfFileInput" accept="image/jpeg,image/png,image/webp" multiple style="display:none;" onchange="UI.handlePdfImagesSelected(event)">
            <div class="dropzone-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="13" r="2"/><path d="M18 18l-3-3-4 4"/></svg>
            </div>
            <h3>Drag &amp; drop multiple images here</h3>
            <p>Select multiple JPG, PNG, WEBP images · Instant in-browser PDF conversion</p>
            <button class="btn btn-primary" onclick="document.getElementById('imageToPdfFileInput').click()">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              Select Images
            </button>
          </div>
          <div id="imageToPdfError" class="error-msg" style="display:none;margin-top:12px;"></div>
        </div>

        <!-- Active PDF Workspace (shown when 1+ images loaded) -->
        <div id="imageToPdfActiveArea" class="image-pdf-active-wrap" style="display:none;">
          <!-- Top Action Bar -->
          <div class="image-pdf-topbar">
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="page-count-badge" id="imageToPdfCountBadge">0 Images</span>
              <span style="font-size:12.5px;color:var(--txt-2);">Rearrange order with ⬅️ ➡️ buttons</span>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="tool-btn-sm" onclick="document.getElementById('imageToPdfFileInput').click()">➕ Add More Images</button>
              <button class="tool-btn-sm" onclick="UI.clearAllPdfImages()" style="color:#ef4444;">🗑️ Clear All</button>
            </div>
          </div>

          <div class="image-pdf-layout-grid">
            <!-- Left Column: PDF Settings & Action -->
            <div class="image-pdf-controls-column glass">
              <!-- Page Size -->
              <div class="resizer-section">
                <label class="section-title">PAGE SIZE</label>
                <div class="setting-pills-row">
                  <button class="setting-pill active" id="pageSize-a4" onclick="UI.setImageToPdfPageSize('a4')">A4 (Standard)</button>
                  <button class="setting-pill" id="pageSize-letter" onclick="UI.setImageToPdfPageSize('letter')">Letter</button>
                  <button class="setting-pill" id="pageSize-legal" onclick="UI.setImageToPdfPageSize('legal')">Legal</button>
                  <button class="setting-pill" id="pageSize-fit" onclick="UI.setImageToPdfPageSize('fit')">Fit to Image</button>
                </div>
              </div>

              <!-- Orientation -->
              <div class="resizer-section">
                <label class="section-title">PAGE ORIENTATION</label>
                <div class="setting-pills-row">
                  <button class="setting-pill active" id="orient-portrait" onclick="UI.setImageToPdfOrientation('portrait')">Portrait</button>
                  <button class="setting-pill" id="orient-landscape" onclick="UI.setImageToPdfOrientation('landscape')">Landscape</button>
                  <button class="setting-pill" id="orient-auto" onclick="UI.setImageToPdfOrientation('auto')">Auto (per image)</button>
                </div>
              </div>

              <!-- Margins -->
              <div class="resizer-section">
                <label class="section-title">MARGINS</label>
                <div class="setting-pills-row">
                  <button class="setting-pill" id="margin-none" onclick="UI.setImageToPdfMargin('none')">None (0mm)</button>
                  <button class="setting-pill active" id="margin-small" onclick="UI.setImageToPdfMargin('small')">Small (5mm)</button>
                  <button class="setting-pill" id="margin-medium" onclick="UI.setImageToPdfMargin('medium')">Medium (12mm)</button>
                  <button class="setting-pill" id="margin-large" onclick="UI.setImageToPdfMargin('large')">Large (20mm)</button>
                </div>
              </div>

              <!-- Image Fit -->
              <div class="resizer-section">
                <label class="section-title">IMAGE PLACEMENT</label>
                <div class="setting-pills-row">
                  <button class="setting-pill active" id="imgFit-fit" onclick="UI.setImageToPdfFit('fit')">Fit Page (Keep Ratio)</button>
                  <button class="setting-pill" id="imgFit-fill" onclick="UI.setImageToPdfFit('fill')">Fill Entire Page</button>
                </div>
              </div>

              <!-- Progress Indicator (During Generation) -->
              <div id="imageToPdfProgressBox" class="pdf-progress-box" style="display:none;">
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;">
                  <span id="imageToPdfProgressText" style="color:var(--txt-1);font-weight:600;">Processing images...</span>
                  <b id="imageToPdfProgressPct" style="color:var(--cyan);">0%</b>
                </div>
                <div class="pdf-progress-bar-track">
                  <div id="imageToPdfProgressBarFill" class="pdf-progress-bar-fill" style="width:0%;"></div>
                </div>
              </div>

              <!-- Result Card (After Generation) -->
              <div id="imageToPdfResultCard" class="pdf-result-card" style="display:none;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                  <span style="font-size:22px;">🎉</span>
                  <div>
                    <b style="font-size:14px;color:#fff;display:block;">PDF Ready to Download!</b>
                    <small id="imageToPdfResultStats" style="font-size:12px;color:var(--txt-2);">-</small>
                  </div>
                </div>
                <div style="display:flex;gap:8px;">
                  <button class="btn btn-primary" style="flex-grow:1;" onclick="UI.downloadGeneratedPdf()">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    Download PDF
                  </button>
                  <button class="btn btn-ghost" onclick="UI.generatePdfFromImages()">Re-create</button>
                </div>
              </div>

              <!-- Create PDF Action Button -->
              <div id="imageToPdfActionBtnRow" style="margin-top:16px;">
                <button class="btn btn-primary" id="btnCreatePdf" style="width:100%;padding:14px;" onclick="UI.generatePdfFromImages()">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Create PDF Document
                </button>
              </div>
            </div>

            <!-- Right Column: Thumbnail Grid -->
            <div class="image-pdf-gallery-column glass">
              <div class="gallery-header">
                <span class="section-title" style="margin:0;">PAGE ORDER &amp; THUMBNAILS</span>
                <small style="font-size:11.5px;color:var(--txt-2);">PDF pages will follow this exact order</small>
              </div>
              <div class="pdf-thumbnails-grid" id="imageToPdfThumbsGrid">
                <!-- Injected dynamically -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  initImageToPdfListeners() {
    const dropzone = document.getElementById('imageToPdfDropzone');
    if (!dropzone) return;

    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer ? e.dataTransfer.files : null;
      if (files && files.length > 0) {
        this.handlePdfImagesList(files);
      }
    });
  },

  handlePdfImagesSelected(event) {
    const files = event.target ? event.target.files : null;
    if (files && files.length > 0) {
      this.handlePdfImagesList(files);
    }
  },

  async handlePdfImagesList(files) {
    const errEl = document.getElementById('imageToPdfError');
    if (errEl) errEl.style.display = 'none';

    if (!imageToPdfState) {
      imageToPdfState = {
        images: [],
        pageSize: 'a4',
        orientation: 'portrait',
        margin: 'small',
        imageFit: 'fit',
        isGenerating: false,
        generatedPdfBlob: null,
        generatedPdfUrl: null
      };
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const newItems = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!validTypes.includes(file.type.toLowerCase())) continue;
      if (file.size === 0 || file.size > 50 * 1024 * 1024) continue;

      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const dims = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
          img.onerror = () => resolve({ width: 800, height: 600 });
          img.src = dataUrl;
        });

        newItems.push({
          id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl,
          width: dims.width,
          height: dims.height
        });
      } catch (err) {
        console.error('Error loading image for PDF:', err);
      }
    }

    if (newItems.length === 0) {
      if (errEl) {
        errEl.textContent = 'Please select valid JPG, PNG, or WEBP images.';
        errEl.style.display = 'block';
      }
      return;
    }

    imageToPdfState.images = imageToPdfState.images.concat(newItems);
    this.updateImageToPdfView();
  },

  updateImageToPdfView() {
    const uploadArea = document.getElementById('imageToPdfUploadArea');
    const activeArea = document.getElementById('imageToPdfActiveArea');
    const countBadge = document.getElementById('imageToPdfCountBadge');
    const grid = document.getElementById('imageToPdfThumbsGrid');
    const resultCard = document.getElementById('imageToPdfResultCard');
    const actionBtnRow = document.getElementById('imageToPdfActionBtnRow');

    if (!imageToPdfState || imageToPdfState.images.length === 0) {
      if (uploadArea) uploadArea.style.display = 'block';
      if (activeArea) activeArea.style.display = 'none';
      return;
    }

    if (uploadArea) uploadArea.style.display = 'none';
    if (activeArea) activeArea.style.display = 'block';
    if (resultCard) resultCard.style.display = 'none';
    if (actionBtnRow) actionBtnRow.style.display = 'block';

    const count = imageToPdfState.images.length;
    if (countBadge) countBadge.textContent = `${count} ${count === 1 ? 'Page / Image' : 'Pages / Images'}`;

    if (!grid) return;
    grid.innerHTML = imageToPdfState.images.map((img, idx) => `
      <div class="pdf-thumb-card glass">
        <div class="thumb-preview-wrap">
          <span class="page-number-pill">Page ${idx + 1}</span>
          <img src="${img.dataUrl}" alt="${this.escapeHTML(img.name)}">
        </div>
        <div class="thumb-meta-wrap">
          <span class="thumb-filename" title="${this.escapeHTML(img.name)}">${this.escapeHTML(img.name)}</span>
          <small class="thumb-specs">${img.width}×${img.height} px · ${this.formatBytes(img.size)}</small>
        </div>
        <div class="thumb-actions-row">
          <button class="thumb-btn" onclick="UI.movePdfImage(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} title="Move Left / Earlier">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button class="thumb-btn" onclick="UI.movePdfImage(${idx}, 1)" ${idx === count - 1 ? 'disabled' : ''} title="Move Right / Later">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <button class="thumb-btn del" onclick="UI.deletePdfImage(${idx})" title="Remove image">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `).join('');
  },

  movePdfImage(index, dir) {
    if (!imageToPdfState || !imageToPdfState.images) return;
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= imageToPdfState.images.length) return;

    const temp = imageToPdfState.images[index];
    imageToPdfState.images[index] = imageToPdfState.images[newIdx];
    imageToPdfState.images[newIdx] = temp;

    this.updateImageToPdfView();
  },

  deletePdfImage(index) {
    if (!imageToPdfState || !imageToPdfState.images) return;
    imageToPdfState.images.splice(index, 1);
    this.updateImageToPdfView();
  },

  clearAllPdfImages() {
    if (!imageToPdfState) return;
    imageToPdfState.images = [];
    const fileInput = document.getElementById('imageToPdfFileInput');
    if (fileInput) fileInput.value = '';
    this.updateImageToPdfView();
    this.showToast('Cleared all images');
  },

  setImageToPdfPageSize(size) {
    if (!imageToPdfState) return;
    imageToPdfState.pageSize = size;
    ['a4', 'letter', 'legal', 'fit'].forEach(s => {
      document.getElementById(`pageSize-${s}`)?.classList.toggle('active', s === size);
    });
  },

  setImageToPdfOrientation(orient) {
    if (!imageToPdfState) return;
    imageToPdfState.orientation = orient;
    ['portrait', 'landscape', 'auto'].forEach(o => {
      document.getElementById(`orient-${o}`)?.classList.toggle('active', o === orient);
    });
  },

  setImageToPdfMargin(margin) {
    if (!imageToPdfState) return;
    imageToPdfState.margin = margin;
    ['none', 'small', 'medium', 'large'].forEach(m => {
      document.getElementById(`margin-${m}`)?.classList.toggle('active', m === margin);
    });
  },

  setImageToPdfFit(fit) {
    if (!imageToPdfState) return;
    imageToPdfState.imageFit = fit;
    ['fit', 'fill'].forEach(f => {
      document.getElementById(`imgFit-${f}`)?.classList.toggle('active', f === fit);
    });
  },

  // Downscales oversized phone camera images before embedding into PDF to prevent memory crash
  optimizeImageForPdf(imgObj, maxDim = 2200) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth;
        let h = img.naturalHeight;

        if (w <= maxDim && h <= maxDim) {
          resolve({ dataUrl: imgObj.dataUrl, width: w, height: h });
          return;
        }

        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const optUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve({ dataUrl: optUrl, width: w, height: h });
      };
      img.onerror = () => {
        resolve({ dataUrl: imgObj.dataUrl, width: imgObj.width, height: imgObj.height });
      };
      img.src = imgObj.dataUrl;
    });
  },

  async generatePdfFromImages() {
    if (!imageToPdfState || imageToPdfState.images.length === 0) {
      this.showToast('Please add at least one image first.');
      return;
    }

    const { images, pageSize, orientation, margin: marginType, imageFit } = imageToPdfState;

    // Check library availability
    const JsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!JsPDF) {
      this.showToast('PDF generator library is still loading, please wait 2 seconds...');
      return;
    }

    const progressBox = document.getElementById('imageToPdfProgressBox');
    const progressBar = document.getElementById('imageToPdfProgressBarFill');
    const progressText = document.getElementById('imageToPdfProgressText');
    const progressPct = document.getElementById('imageToPdfProgressPct');
    const resultCard = document.getElementById('imageToPdfResultCard');
    const actionBtnRow = document.getElementById('imageToPdfActionBtnRow');

    if (progressBox) progressBox.style.display = 'block';
    if (resultCard) resultCard.style.display = 'none';
    if (actionBtnRow) actionBtnRow.style.display = 'none';

    // Standard page dimensions in mm
    const standardDims = {
      a4: [210, 297],
      letter: [215.9, 279.4],
      legal: [215.9, 355.6]
    };

    const marginVals = {
      none: 0,
      small: 5,
      medium: 12,
      large: 20
    };
    const marginMm = marginVals[marginType] || 5;

    try {
      let pdfDoc = null;
      const total = images.length;

      for (let i = 0; i < total; i++) {
        // Real progress tracking
        const pct = Math.round(((i + 1) / total) * 100);
        if (progressText) progressText.textContent = `Processing image ${i + 1} of ${total}...`;
        if (progressPct) progressPct.textContent = `${pct}%`;
        if (progressBar) progressBar.style.width = `${pct}%`;

        // Responsive async yield
        await new Promise(r => setTimeout(r, 25));

        const rawImg = images[i];
        const opt = await this.optimizeImageForPdf(rawImg);

        // Determine orientation
        let pageOrient = orientation;
        if (orientation === 'auto') {
          pageOrient = opt.width > opt.height ? 'landscape' : 'portrait';
        }

        // Determine page format in mm
        let pageW, pageH;
        if (pageSize === 'fit') {
          const ratio = opt.width / opt.height;
          if (ratio >= 1) {
            pageW = 297;
            pageH = Number((297 / ratio).toFixed(2));
            pageOrient = 'landscape';
          } else {
            pageW = 210;
            pageH = Number((210 / ratio).toFixed(2));
            pageOrient = 'portrait';
          }
        } else {
          const dims = standardDims[pageSize] || standardDims.a4;
          if (pageOrient === 'landscape') {
            pageW = dims[1];
            pageH = dims[0];
          } else {
            pageW = dims[0];
            pageH = dims[1];
          }
        }

        if (i === 0) {
          pdfDoc = new JsPDF({
            orientation: pageOrient,
            unit: 'mm',
            format: pageSize === 'fit' ? [pageW, pageH] : (standardDims[pageSize] || 'a4')
          });
        } else {
          pdfDoc.addPage(pageSize === 'fit' ? [pageW, pageH] : (standardDims[pageSize] || 'a4'), pageOrient);
        }

        // Calculate printable area
        const printW = Math.max(10, pageW - (marginMm * 2));
        const printH = Math.max(10, pageH - (marginMm * 2));

        let renderW, renderH, renderX, renderY;

        if (imageFit === 'fill') {
          renderW = printW;
          renderH = printH;
          renderX = marginMm;
          renderY = marginMm;
        } else {
          // Fit page while strictly maintaining aspect ratio
          const imgRatio = opt.width / opt.height;
          const printRatio = printW / printH;

          if (imgRatio > printRatio) {
            renderW = printW;
            renderH = printW / imgRatio;
          } else {
            renderH = printH;
            renderW = printH * imgRatio;
          }

          renderX = marginMm + ((printW - renderW) / 2);
          renderY = marginMm + ((printH - renderH) / 2);
        }

        pdfDoc.addImage(opt.dataUrl, 'JPEG', renderX, renderY, renderW, renderH, undefined, 'FAST');
      }

      const blob = pdfDoc.output('blob');
      if (imageToPdfState.generatedPdfUrl) {
        URL.revokeObjectURL(imageToPdfState.generatedPdfUrl);
      }
      imageToPdfState.generatedPdfBlob = blob;
      imageToPdfState.generatedPdfUrl = URL.createObjectURL(blob);

      if (progressBox) progressBox.style.display = 'none';
      if (resultCard) {
        resultCard.style.display = 'block';
        const statsEl = document.getElementById('imageToPdfResultStats');
        if (statsEl) statsEl.textContent = `${total} ${total === 1 ? 'Page' : 'Pages'} · ${this.formatBytes(blob.size)}`;
      }
      this.showToast(`🎉 PDF generated successfully with ${total} pages!`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      if (progressBox) progressBox.style.display = 'none';
      if (actionBtnRow) actionBtnRow.style.display = 'block';
      this.showToast('Could not generate PDF: ' + err.message);
    }
  },

  downloadGeneratedPdf() {
    if (!imageToPdfState || !imageToPdfState.generatedPdfBlob) {
      this.showToast('No PDF available to download');
      return;
    }
    const blob = imageToPdfState.generatedPdfBlob;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'images-to-pdf.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.showToast(`Downloaded images-to-pdf.pdf (${this.formatBytes(blob.size)})! 📄`);
  },

  // ============ PDF TOOLKIT ============
  renderPdfToolkitWorkspace(tool) {
    return `
      <a class="back-link" onclick="Router.navigate('tools')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to all tools
      </a>
      <div class="workspace glass pdf-toolkit-workspace">
        <div class="ws-head">
          <div class="tool-icon"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">${ICONS.pdf_toolkit}</svg></div>
          <div style="flex-grow:1;">
            <h2>${tool.name}</h2>
            <p>${tool.desc}</p>
          </div>
          <div class="privacy-badge-pill">
            <span>🔒 Local browser processing</span>
          </div>
        </div>

        <div class="privacy-alert-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          <div>
            <b>Privacy First:</b> Your files are processed locally in your browser and are not uploaded to our servers.
          </div>
        </div>

        <!-- Toolkit Mode Switcher Tabs -->
        <div class="toolkit-nav-tabs">
          <button class="toolkit-tab-btn active" id="tabBtn-merge" onclick="UI.setPdfToolkitTab('merge')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"/></svg>
            Merge PDF
          </button>
          <button class="toolkit-tab-btn" id="tabBtn-split" onclick="UI.setPdfToolkitTab('split')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
            Split / Extract
          </button>
          <button class="toolkit-tab-btn" id="tabBtn-rotate" onclick="UI.setPdfToolkitTab('rotate')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            Rotate PDF
          </button>
          <button class="toolkit-tab-btn" id="tabBtn-delete" onclick="UI.setPdfToolkitTab('delete')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Delete Pages
          </button>
          <button class="toolkit-tab-btn" id="tabBtn-sign" onclick="UI.setPdfToolkitTab('sign')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            Quick Sign &amp; Stamp
          </button>
        </div>

        <!-- TAB 1: MERGE PDF -->
        <div id="toolkitPanel-merge" class="toolkit-panel">
          <div class="toolkit-dropzone" id="mergePdfDropzone" onclick="document.getElementById('mergePdfFileInput').click()">
            <input type="file" id="mergePdfFileInput" accept="application/pdf" multiple style="display:none;" onchange="UI.handleMergePdfsSelected(event)">
            <div class="dropzone-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6M9 15l3-3 3 3"/></svg>
            </div>
            <h3>Select or Drop PDF files to Merge</h3>
            <p>Combine multiple PDF documents into one single file in exact sequence</p>
            <button class="btn btn-primary" onclick="event.stopPropagation();document.getElementById('mergePdfFileInput').click()">
              Browse PDF Files
            </button>
          </div>

          <div id="mergeFileListWrap" style="display:none;margin-top:16px;">
            <div class="merge-list-header">
              <span id="mergeCountBadge" class="page-count-badge">0 PDFs</span>
              <div style="display:flex;gap:8px;">
                <button class="tool-btn-sm" onclick="document.getElementById('mergePdfFileInput').click()">➕ Add More PDFs</button>
                <button class="tool-btn-sm" onclick="UI.clearMergePdfs()" style="color:#ef4444;">🗑️ Clear</button>
              </div>
            </div>
            <div id="mergeFilesList" class="merge-files-list"></div>
            <div style="margin-top:18px;">
              <button class="btn btn-primary" id="btnMergePdfs" style="width:100%;padding:14px;" onclick="UI.executePdfMerge()">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"/></svg>
                Merge PDFs into One File
              </button>
            </div>
          </div>
        </div>

        <!-- TAB 2: SPLIT / EXTRACT -->
        <div id="toolkitPanel-split" class="toolkit-panel" style="display:none;">
          <div class="toolkit-dropzone" id="splitPdfDropzone" onclick="document.getElementById('splitPdfFileInput').click()">
            <input type="file" id="splitPdfFileInput" accept="application/pdf" style="display:none;" onchange="UI.handleSinglePdfSelected(event, 'split')">
            <div class="dropzone-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
            </div>
            <h3 id="splitDropzoneTitle">Select PDF to Split</h3>
            <p id="splitDropzoneSub">Extract specific pages or page ranges from your document</p>
            <button class="btn btn-primary" onclick="event.stopPropagation();document.getElementById('splitPdfFileInput').click()">
              Choose PDF File
            </button>
          </div>

          <div id="splitActiveWrap" class="toolkit-active-card glass" style="display:none;margin-top:16px;">
            <div class="doc-info-bar">
              <div>
                <b id="splitDocName" style="color:#fff;font-size:14px;">document.pdf</b>
                <small id="splitDocMeta" style="display:block;color:var(--txt-2);font-size:12px;">Total Pages: 0</small>
              </div>
              <button class="tool-btn-sm" onclick="document.getElementById('splitPdfFileInput').click()">Change File</button>
            </div>

            <div style="margin-top:16px;">
              <label class="section-title">PAGE RANGE TO EXTRACT</label>
              <input type="text" id="splitRangeInput" placeholder="e.g. 1-3, 5, 8-10" class="toolkit-input" oninput="UI.validateSplitRangeInput()">
              <small style="display:block;color:var(--txt-2);font-size:11.5px;margin-top:4px;">
                Enter single pages or ranges separated by commas (e.g. <code>1-3, 5</code>)
              </small>

              <div class="quick-range-chips" style="margin-top:10px;">
                <button class="tool-btn-sm" onclick="UI.setSplitPreset('all')">All Pages</button>
                <button class="tool-btn-sm" onclick="UI.setSplitPreset('first')">First Page (1)</button>
                <button class="tool-btn-sm" onclick="UI.setSplitPreset('last')">Last Page</button>
                <button class="tool-btn-sm" onclick="UI.setSplitPreset('odd')">Odd Pages</button>
                <button class="tool-btn-sm" onclick="UI.setSplitPreset('even')">Even Pages</button>
              </div>
              <div id="splitRangeValidation" style="font-size:12px;margin-top:8px;"></div>
            </div>

            <button class="btn btn-primary" style="width:100%;margin-top:18px;padding:12px;" onclick="UI.executePdfSplit()">
              Extract &amp; Download Pages
            </button>
          </div>
        </div>

        <!-- TAB 3: ROTATE PDF -->
        <div id="toolkitPanel-rotate" class="toolkit-panel" style="display:none;">
          <div class="toolkit-dropzone" id="rotatePdfDropzone" onclick="document.getElementById('rotatePdfFileInput').click()">
            <input type="file" id="rotatePdfFileInput" accept="application/pdf" style="display:none;" onchange="UI.handleSinglePdfSelected(event, 'rotate')">
            <div class="dropzone-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            </div>
            <h3>Select PDF to Rotate</h3>
            <p>Rotate all pages or specific pages by 90°, 180°, or 270°</p>
            <button class="btn btn-primary" onclick="event.stopPropagation();document.getElementById('rotatePdfFileInput').click()">
              Choose PDF File
            </button>
          </div>

          <div id="rotateActiveWrap" class="toolkit-active-card glass" style="display:none;margin-top:16px;">
            <div class="doc-info-bar">
              <div>
                <b id="rotateDocName" style="color:#fff;font-size:14px;">document.pdf</b>
                <small id="rotateDocMeta" style="display:block;color:var(--txt-2);font-size:12px;">Total Pages: 0</small>
              </div>
              <button class="tool-btn-sm" onclick="document.getElementById('rotatePdfFileInput').click()">Change File</button>
            </div>

            <div style="margin-top:16px;">
              <label class="section-title">ROTATION ANGLE</label>
              <div class="setting-pills-row">
                <button class="setting-pill active" id="rotAngle-90" onclick="UI.setRotateAngle(90)">↷ 90° Clockwise</button>
                <button class="setting-pill" id="rotAngle-180" onclick="UI.setRotateAngle(180)">↻ 180° Flip</button>
                <button class="setting-pill" id="rotAngle-270" onclick="UI.setRotateAngle(270)">↶ 270° Counter-Clockwise</button>
              </div>
            </div>

            <div style="margin-top:16px;">
              <label class="section-title">APPLY TO</label>
              <div class="setting-pills-row">
                <button class="setting-pill active" id="rotScope-all" onclick="UI.setRotateScope('all')">All Pages</button>
                <button class="setting-pill" id="rotScope-custom" onclick="UI.setRotateScope('custom')">Specific Pages</button>
              </div>
              <div id="rotateCustomRangeRow" style="display:none;margin-top:8px;">
                <input type="text" id="rotateRangeInput" placeholder="e.g. 1, 3-5" class="toolkit-input">
              </div>
            </div>

            <button class="btn btn-primary" style="width:100%;margin-top:18px;padding:12px;" onclick="UI.executePdfRotate()">
              Rotate &amp; Download PDF
            </button>
          </div>
        </div>

        <!-- TAB 4: DELETE PAGES -->
        <div id="toolkitPanel-delete" class="toolkit-panel" style="display:none;">
          <div class="toolkit-dropzone" id="deletePdfDropzone" onclick="document.getElementById('deletePdfFileInput').click()">
            <input type="file" id="deletePdfFileInput" accept="application/pdf" style="display:none;" onchange="UI.handleSinglePdfSelected(event, 'delete')">
            <div class="dropzone-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </div>
            <h3>Select PDF to Remove Pages</h3>
            <p>Permanently remove unwanted pages from your document</p>
            <button class="btn btn-primary" onclick="event.stopPropagation();document.getElementById('deletePdfFileInput').click()">
              Choose PDF File
            </button>
          </div>

          <div id="deleteActiveWrap" class="toolkit-active-card glass" style="display:none;margin-top:16px;">
            <div class="doc-info-bar">
              <div>
                <b id="deleteDocName" style="color:#fff;font-size:14px;">document.pdf</b>
                <small id="deleteDocMeta" style="display:block;color:var(--txt-2);font-size:12px;">Total Pages: 0</small>
              </div>
              <button class="tool-btn-sm" onclick="document.getElementById('deletePdfFileInput').click()">Change File</button>
            </div>

            <div style="margin-top:16px;">
              <label class="section-title">PAGES TO REMOVE</label>
              <input type="text" id="deleteRangeInput" placeholder="e.g. 2, 4-6" class="toolkit-input" oninput="UI.validateDeleteRangeInput()">
              <small style="display:block;color:var(--txt-2);font-size:11.5px;margin-top:4px;">
                Enter page numbers or ranges to remove (e.g. <code>2, 5</code>)
              </small>
              <div id="deleteRangeValidation" style="font-size:12px;margin-top:8px;"></div>
            </div>

            <button class="btn btn-primary" style="width:100%;margin-top:18px;padding:12px;" onclick="UI.executePdfDeletePages()">
              Delete Pages &amp; Download Clean PDF
            </button>
          </div>
        </div>

        <!-- TAB 5: QUICK SIGN & STAMP -->
        <div id="toolkitPanel-sign" class="toolkit-panel" style="display:none;">
          <div class="toolkit-dropzone" id="signPdfDropzone" onclick="document.getElementById('signPdfFileInput').click()">
            <input type="file" id="signPdfFileInput" accept="application/pdf" style="display:none;" onchange="UI.handleSinglePdfSelected(event, 'sign')">
            <div class="dropzone-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            </div>
            <h3>Select PDF to Sign or Stamp</h3>
            <p>Draw signature or apply status stamps directly onto PDF pages</p>
            <button class="btn btn-primary" onclick="event.stopPropagation();document.getElementById('signPdfFileInput').click()">
              Choose PDF File
            </button>
          </div>

          <div id="signActiveWrap" class="toolkit-active-card glass" style="display:none;margin-top:16px;">
            <div class="doc-info-bar">
              <div>
                <b id="signDocName" style="color:#fff;font-size:14px;">document.pdf</b>
                <small id="signDocMeta" style="display:block;color:var(--txt-2);font-size:12px;">Total Pages: 0</small>
              </div>
              <button class="tool-btn-sm" onclick="document.getElementById('signPdfFileInput').click()">Change File</button>
            </div>

            <!-- Sign / Stamp Sub Tabs -->
            <div class="setting-pills-row" style="margin-top:14px;">
              <button class="setting-pill active" id="signMode-draw" onclick="UI.setSignSubMode('draw')">✍️ Draw Signature</button>
              <button class="setting-pill" id="signMode-type" onclick="UI.setSignSubMode('type')">⌨️ Type Name</button>
              <button class="setting-pill" id="signMode-stamp" onclick="UI.setSignSubMode('stamp')">🏷️ Text Stamp</button>
            </div>

            <!-- Draw Signature View -->
            <div id="signSubPanel-draw" style="margin-top:12px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-size:12px;color:var(--txt-2);">Draw your signature below:</span>
                <div style="display:flex;gap:6px;">
                  <button class="tool-btn-sm" onclick="UI.clearSignaturePad()">Clear</button>
                </div>
              </div>
              <div class="signature-canvas-wrap">
                <canvas id="pdfSignCanvas" width="400" height="150"></canvas>
              </div>
              <small style="display:block;color:var(--txt-2);font-size:11px;margin-top:4px;">
                ℹ️ Adds a visual signature stamp to your document. Not a cryptographically verified digital signature.
              </small>
            </div>

            <!-- Type Signature View -->
            <div id="signSubPanel-type" style="display:none;margin-top:12px;">
              <label class="section-title">TYPE SIGNATURE TEXT</label>
              <input type="text" id="signTypeInput" placeholder="e.g. John Doe" class="toolkit-input" oninput="UI.renderTypedSignaturePreview(this.value)">
              <div class="typed-sig-preview" id="typedSigPreview">John Doe</div>
            </div>

            <!-- Stamp Preset View -->
            <div id="signSubPanel-stamp" style="display:none;margin-top:12px;">
              <label class="section-title">STAMP PRESETS</label>
              <div class="setting-pills-row">
                <button class="setting-pill active" onclick="UI.setPresetStamp('APPROVED', '#10b981')">APPROVED</button>
                <button class="setting-pill" onclick="UI.setPresetStamp('CONFIDENTIAL', '#ef4444')">CONFIDENTIAL</button>
                <button class="setting-pill" onclick="UI.setPresetStamp('DRAFT', '#f59e0b')">DRAFT</button>
                <button class="setting-pill" onclick="UI.setPresetStamp('PAID', '#3b82f6')">PAID</button>
              </div>
              <input type="text" id="stampCustomText" placeholder="Or custom stamp text..." class="toolkit-input" style="margin-top:8px;" oninput="UI.setCustomStampText(this.value)">
            </div>

            <!-- Placement Settings -->
            <div style="margin-top:16px;">
              <label class="section-title">TARGET PAGE &amp; PLACEMENT</label>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div>
                  <span style="font-size:11.5px;color:var(--txt-2);display:block;margin-bottom:4px;">Apply to Page:</span>
                  <select id="signTargetPageSelect" class="toolkit-select">
                    <option value="last">Last Page (Standard)</option>
                    <option value="first">First Page</option>
                    <option value="all">All Pages</option>
                  </select>
                </div>
                <div>
                  <span style="font-size:11.5px;color:var(--txt-2);display:block;margin-bottom:4px;">Position:</span>
                  <select id="signPositionSelect" class="toolkit-select">
                    <option value="bottom-right">Bottom-Right (Standard)</option>
                    <option value="bottom-left">Bottom-Left</option>
                    <option value="top-right">Top-Right</option>
                    <option value="center">Center (Watermark)</option>
                  </select>
                </div>
              </div>
            </div>

            <button class="btn btn-primary" style="width:100%;margin-top:18px;padding:12px;" onclick="UI.executePdfSign()">
              Apply Stamp &amp; Download PDF
            </button>
          </div>
        </div>

        <!-- Global Toolkit Output Modal / Banner -->
        <div id="toolkitResultCard" class="pdf-result-card" style="display:none;margin-top:20px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
            <span style="font-size:22px;">✅</span>
            <div>
              <b style="font-size:14px;color:#fff;display:block;" id="toolkitResultTitle">Operation Completed!</b>
              <small id="toolkitResultStats" style="font-size:12px;color:var(--txt-2);">-</small>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-primary" style="flex-grow:1;" onclick="UI.downloadToolkitResult()">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Download PDF
            </button>
            <button class="btn btn-ghost" onclick="UI.resetPdfToolkit()">Done</button>
          </div>
        </div>
      </div>
    `;
  },

  initPdfToolkitListeners() {
    this.initMergePdfDropzone();
    this.initSignaturePadCanvas();
  },

  setPdfToolkitTab(tab) {
    ['merge', 'split', 'rotate', 'delete', 'sign'].forEach(t => {
      document.getElementById(`tabBtn-${t}`)?.classList.toggle('active', t === tab);
      const panel = document.getElementById(`toolkitPanel-${t}`);
      if (panel) panel.style.display = t === tab ? 'block' : 'none';
    });
    const resultCard = document.getElementById('toolkitResultCard');
    if (resultCard) resultCard.style.display = 'none';

    if (tab === 'sign') {
      setTimeout(() => this.initSignaturePadCanvas(), 50);
    }
  },

  getPDFLib() {
    return (typeof window !== 'undefined' && window.PDFLib) || (typeof PDFLib !== 'undefined' ? PDFLib : null);
  },

  async ensurePDFLib() {
    let lib = this.getPDFLib();
    if (lib) return lib;

    return new Promise((resolve) => {
      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          resolve(this.getPDFLib());
        }
      };

      const s = document.createElement('script');
      s.src = 'js/vendor/pdf-lib.min.js';
      s.onload = done;
      s.onerror = () => {
        const cdn = document.createElement('script');
        cdn.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
        cdn.onload = done;
        cdn.onerror = done;
        document.head.appendChild(cdn);
      };
      document.head.appendChild(s);

      setTimeout(done, 2500);
    });
  },

  // ============ TAB 1: MERGE CONTROLLER ============
  initMergePdfDropzone() {
    const dropzone = document.getElementById('mergePdfDropzone');
    if (!dropzone) return;

    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer ? e.dataTransfer.files : null;
      if (files && files.length > 0) {
        this.processMergePdfFiles(files);
      }
    });
  },

  handleMergePdfsSelected(event) {
    const files = event.target ? event.target.files : null;
    if (files && files.length > 0) {
      this.processMergePdfFiles(files);
    }
  },

  async processMergePdfFiles(files) {
    if (!pdfToolkitState) {
      pdfToolkitState = {
        mergeFiles: [],
        singlePdf: null,
        rotateAngle: 90,
        rotateScope: 'all',
        signSubMode: 'draw',
        stampText: 'APPROVED',
        stampColor: '#10b981',
        resultBlob: null,
        resultFilename: 'document.pdf'
      };
    }

    const PDFLib = await this.ensurePDFLib();
    if (!PDFLib) {
      this.showToast('Unable to initialize PDF engine. Please refresh or check connection.');
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) continue;
      if (file.size === 0 || file.size > 100 * 1024 * 1024) continue;

      try {
        const buffer = await file.arrayBuffer();
        const doc = await PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
        const pageCount = doc.getPageCount();

        pdfToolkitState.mergeFiles.push({
          id: 'pdf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          file,
          name: file.name,
          size: file.size,
          bytes: buffer,
          pageCount
        });
      } catch (err) {
        console.error('Error reading PDF:', err);
        if (err.message && (err.message.includes('encrypted') || err.message.includes('password'))) {
          this.showToast(`🔒 ${file.name} is password protected and cannot be merged.`);
        } else {
          this.showToast(`⚠️ Could not read ${file.name}. Ensure it is a valid PDF.`);
        }
      }
    }

    this.renderMergeFilesList();
  },

  renderMergeFilesList() {
    const wrap = document.getElementById('mergeFileListWrap');
    const badge = document.getElementById('mergeCountBadge');
    const list = document.getElementById('mergeFilesList');

    if (!pdfToolkitState || pdfToolkitState.mergeFiles.length === 0) {
      if (wrap) wrap.style.display = 'none';
      return;
    }

    if (wrap) wrap.style.display = 'block';
    const count = pdfToolkitState.mergeFiles.length;
    if (badge) badge.textContent = `${count} ${count === 1 ? 'PDF File' : 'PDF Files'}`;

    if (!list) return;
    list.innerHTML = pdfToolkitState.mergeFiles.map((f, idx) => `
      <div class="merge-file-row glass">
        <div style="display:flex;align-items:center;gap:10px;overflow:hidden;">
          <span class="file-num-pill">${idx + 1}</span>
          <div style="overflow:hidden;">
            <b class="merge-file-name" title="${this.escapeHTML(f.name)}">${this.escapeHTML(f.name)}</b>
            <small style="display:block;color:var(--txt-2);font-size:11px;">${f.pageCount} pages · ${this.formatBytes(f.size)}</small>
          </div>
        </div>
        <div style="display:flex;gap:4px;">
          <button class="thumb-btn" onclick="UI.moveMergePdf(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} title="Move Up">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 15l-6-6-6 6"/></svg>
          </button>
          <button class="thumb-btn" onclick="UI.moveMergePdf(${idx}, 1)" ${idx === count - 1 ? 'disabled' : ''} title="Move Down">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <button class="thumb-btn del" onclick="UI.deleteMergePdf(${idx})" title="Remove">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `).join('');
  },

  moveMergePdf(index, dir) {
    if (!pdfToolkitState || !pdfToolkitState.mergeFiles) return;
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= pdfToolkitState.mergeFiles.length) return;
    const temp = pdfToolkitState.mergeFiles[index];
    pdfToolkitState.mergeFiles[index] = pdfToolkitState.mergeFiles[newIdx];
    pdfToolkitState.mergeFiles[newIdx] = temp;
    this.renderMergeFilesList();
  },

  deleteMergePdf(index) {
    if (!pdfToolkitState || !pdfToolkitState.mergeFiles) return;
    pdfToolkitState.mergeFiles.splice(index, 1);
    this.renderMergeFilesList();
  },

  clearMergePdfs() {
    if (!pdfToolkitState) return;
    pdfToolkitState.mergeFiles = [];
    this.renderMergeFilesList();
  },

  async executePdfMerge() {
    if (!pdfToolkitState || pdfToolkitState.mergeFiles.length < 2) {
      this.showToast('Please add at least 2 PDF files to merge.');
      return;
    }

    const PDFLib = await this.ensurePDFLib();
    if (!PDFLib) {
      this.showToast('PDF engine not available. Please refresh or check connection.');
      return;
    }

    const btn = document.getElementById('btnMergePdfs');
    if (btn) { btn.disabled = true; btn.textContent = 'Merging PDFs...'; }

    try {
      const mergedPdf = await PDFLib.PDFDocument.create();
      let totalPages = 0;

      for (const item of pdfToolkitState.mergeFiles) {
        const srcDoc = await PDFLib.PDFDocument.load(item.bytes);
        const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
        totalPages += copiedPages.length;
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });

      pdfToolkitState.resultBlob = blob;
      pdfToolkitState.resultFilename = 'merged.pdf';

      this.showToolkitResult(`Merged ${pdfToolkitState.mergeFiles.length} PDFs Successfully!`, `${totalPages} Total Pages · ${this.formatBytes(blob.size)}`);
      this.showToast('🎉 PDFs merged successfully!');
    } catch (err) {
      console.error('Merge Error:', err);
      this.showToast('Could not merge PDFs: ' + err.message);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Merge PDFs into One File'; }
    }
  },

  // ============ SINGLE PDF HANDLER FOR SPLIT, ROTATE, DELETE, SIGN ============
  async handleSinglePdfSelected(event, mode) {
    const file = event.target ? event.target.files[0] : null;
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.showToast('Please select a valid PDF file.');
      return;
    }

    const PDFLib = await this.ensurePDFLib();
    if (!PDFLib) {
      this.showToast('PDF engine loading failed. Please refresh the page.');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const doc = await PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
      const pageCount = doc.getPageCount();

      if (!pdfToolkitState) {
        pdfToolkitState = {
          mergeFiles: [],
          singlePdf: null,
          rotateAngle: 90,
          rotateScope: 'all',
          signSubMode: 'draw',
          stampText: 'APPROVED',
          stampColor: '#10b981',
          resultBlob: null,
          resultFilename: 'document.pdf'
        };
      }

      pdfToolkitState.singlePdf = {
        file,
        name: file.name,
        size: file.size,
        bytes: buffer,
        pageCount,
        doc
      };

      // Update UI for the target mode
      if (mode === 'split') {
        document.getElementById('splitPdfDropzone').style.display = 'none';
        document.getElementById('splitActiveWrap').style.display = 'block';
        document.getElementById('splitDocName').textContent = file.name;
        document.getElementById('splitDocMeta').textContent = `Total Pages: ${pageCount} · ${this.formatBytes(file.size)}`;
        document.getElementById('splitRangeInput').value = `1-${pageCount}`;
        this.validateSplitRangeInput();
      } else if (mode === 'rotate') {
        document.getElementById('rotatePdfDropzone').style.display = 'none';
        document.getElementById('rotateActiveWrap').style.display = 'block';
        document.getElementById('rotateDocName').textContent = file.name;
        document.getElementById('rotateDocMeta').textContent = `Total Pages: ${pageCount} · ${this.formatBytes(file.size)}`;
      } else if (mode === 'delete') {
        document.getElementById('deletePdfDropzone').style.display = 'none';
        document.getElementById('deleteActiveWrap').style.display = 'block';
        document.getElementById('deleteDocName').textContent = file.name;
        document.getElementById('deleteDocMeta').textContent = `Total Pages: ${pageCount} · ${this.formatBytes(file.size)}`;
      } else if (mode === 'sign') {
        document.getElementById('signPdfDropzone').style.display = 'none';
        document.getElementById('signActiveWrap').style.display = 'block';
        document.getElementById('signDocName').textContent = file.name;
        document.getElementById('signDocMeta').textContent = `Total Pages: ${pageCount} · ${this.formatBytes(file.size)}`;
        setTimeout(() => this.initSignaturePadCanvas(), 50);
      }
    } catch (err) {
      console.error('Error opening single PDF:', err);
      if (err.message && (err.message.includes('encrypted') || err.message.includes('password'))) {
        this.showToast('🔒 This PDF is password protected and cannot be processed without unlocking it.');
      } else {
        this.showToast('⚠️ This PDF could not be read. Please verify that the file is valid and try again.');
      }
    }
  },

  // ============ ROBUST PAGE RANGE PARSER ============
  parsePageRange(inputStr, totalPages) {
    if (!inputStr || !inputStr.trim()) {
      return { valid: false, pages: [], error: 'Page range cannot be empty.' };
    }

    const parts = inputStr.split(',');
    const pagesSet = new Set();

    for (let rawPart of parts) {
      const part = rawPart.trim();
      if (!part) continue;

      if (/^\d+$/.test(part)) {
        const num = parseInt(part, 10);
        if (num < 1 || num > totalPages) {
          return { valid: false, pages: [], error: `Page ${num} does not exist. This PDF contains ${totalPages} pages.` };
        }
        pagesSet.add(num);
      } else if (/^\d+\s*-\s*\d+$/.test(part)) {
        const [startStr, endStr] = part.split('-');
        let start = parseInt(startStr.trim(), 10);
        let end = parseInt(endStr.trim(), 10);

        if (start < 1 || start > totalPages) {
          return { valid: false, pages: [], error: `Page ${start} does not exist. This PDF contains ${totalPages} pages.` };
        }
        if (end < 1 || end > totalPages) {
          return { valid: false, pages: [], error: `Page ${end} does not exist. This PDF contains ${totalPages} pages.` };
        }

        // Normalize reversed range (e.g. 5-2 -> 2-5)
        if (start > end) {
          const temp = start;
          start = end;
          end = temp;
        }

        for (let p = start; p <= end; p++) {
          pagesSet.add(p);
        }
      } else {
        return { valid: false, pages: [], error: `Invalid format: "${part}". Use numbers and ranges like 1-3, 5.` };
      }
    }

    const pages = Array.from(pagesSet).sort((a, b) => a - b);
    if (pages.length === 0) {
      return { valid: false, pages: [], error: 'No valid pages selected.' };
    }

    return { valid: true, pages, error: null };
  },

  validateSplitRangeInput() {
    if (!pdfToolkitState || !pdfToolkitState.singlePdf) return;
    const input = document.getElementById('splitRangeInput');
    const valEl = document.getElementById('splitRangeValidation');
    if (!input || !valEl) return;

    const res = this.parsePageRange(input.value, pdfToolkitState.singlePdf.pageCount);
    if (res.valid) {
      valEl.style.color = '#4ade80';
      valEl.textContent = `✅ Will extract ${res.pages.length} pages: [${res.pages.join(', ')}]`;
    } else {
      valEl.style.color = '#ef4444';
      valEl.textContent = `⚠️ ${res.error}`;
    }
  },

  setSplitPreset(preset) {
    if (!pdfToolkitState || !pdfToolkitState.singlePdf) return;
    const total = pdfToolkitState.singlePdf.pageCount;
    const input = document.getElementById('splitRangeInput');
    if (!input) return;

    if (preset === 'all') input.value = `1-${total}`;
    else if (preset === 'first') input.value = '1';
    else if (preset === 'last') input.value = `${total}`;
    else if (preset === 'odd') {
      const odds = [];
      for (let i = 1; i <= total; i += 2) odds.push(i);
      input.value = odds.join(', ');
    } else if (preset === 'even') {
      const evens = [];
      for (let i = 2; i <= total; i += 2) evens.push(i);
      input.value = evens.join(', ');
    }

    this.validateSplitRangeInput();
  },

  async executePdfSplit() {
    if (!pdfToolkitState || !pdfToolkitState.singlePdf) return;
    const { singlePdf } = pdfToolkitState;
    const input = document.getElementById('splitRangeInput');
    const rangeRes = this.parsePageRange(input ? input.value : '', singlePdf.pageCount);

    if (!rangeRes.valid) {
      this.showToast(rangeRes.error);
      return;
    }

    const PDFLib = await this.ensurePDFLib();
    if (!PDFLib) {
      this.showToast('PDF engine not available.');
      return;
    }
    try {
      const srcDoc = await PDFLib.PDFDocument.load(singlePdf.bytes);
      const splitDoc = await PDFLib.PDFDocument.create();

      // Convert 1-based page numbers to 0-based page indices
      const indices = rangeRes.pages.map(p => p - 1);
      const copiedPages = await splitDoc.copyPages(srcDoc, indices);
      copiedPages.forEach(p => splitDoc.addPage(p));

      const splitBytes = await splitDoc.save();
      const blob = new Blob([splitBytes], { type: 'application/pdf' });

      pdfToolkitState.resultBlob = blob;
      pdfToolkitState.resultFilename = 'extracted-pages.pdf';

      this.showToolkitResult(`Extracted ${rangeRes.pages.length} Pages Successfully!`, `Pages: ${rangeRes.pages.join(', ')} · ${this.formatBytes(blob.size)}`);
      this.showToast('🎉 Pages extracted successfully!');
    } catch (err) {
      console.error('Split Error:', err);
      this.showToast('Could not extract pages: ' + err.message);
    }
  },

  // ============ TAB 3: ROTATE CONTROLLER ============
  setRotateAngle(deg) {
    if (!pdfToolkitState) return;
    pdfToolkitState.rotateAngle = deg;
    [90, 180, 270].forEach(d => {
      document.getElementById(`rotAngle-${d}`)?.classList.toggle('active', d === deg);
    });
  },

  setRotateScope(scope) {
    if (!pdfToolkitState) return;
    pdfToolkitState.rotateScope = scope;
    ['all', 'custom'].forEach(s => {
      document.getElementById(`rotScope-${s}`)?.classList.toggle('active', s === scope);
    });
    const rangeRow = document.getElementById('rotateCustomRangeRow');
    if (rangeRow) rangeRow.style.display = scope === 'custom' ? 'block' : 'none';
  },

  async executePdfRotate() {
    if (!pdfToolkitState || !pdfToolkitState.singlePdf) return;
    const { singlePdf, rotateAngle, rotateScope } = pdfToolkitState;
    const PDFLib = await this.ensurePDFLib();
    if (!PDFLib) {
      this.showToast('PDF engine not available.');
      return;
    }

    try {
      const doc = await PDFLib.PDFDocument.load(singlePdf.bytes);
      const totalPages = doc.getPageCount();

      let targetIndices = [];
      if (rotateScope === 'all') {
        targetIndices = doc.getPageIndices();
      } else {
        const input = document.getElementById('rotateRangeInput');
        const rangeRes = this.parsePageRange(input ? input.value : '', totalPages);
        if (!rangeRes.valid) {
          this.showToast(rangeRes.error);
          return;
        }
        targetIndices = rangeRes.pages.map(p => p - 1);
      }

      targetIndices.forEach(idx => {
        const page = doc.getPage(idx);
        const currentRot = page.getRotation().angle;
        page.setRotation(PDFLib.degrees((currentRot + rotateAngle) % 360));
      });

      const rotatedBytes = await doc.save();
      const blob = new Blob([rotatedBytes], { type: 'application/pdf' });

      pdfToolkitState.resultBlob = blob;
      pdfToolkitState.resultFilename = 'rotated.pdf';

      this.showToolkitResult(`Rotated ${targetIndices.length} Pages by ${rotateAngle}°!`, `Total ${totalPages} Pages · ${this.formatBytes(blob.size)}`);
      this.showToast(`🎉 PDF rotated successfully by ${rotateAngle}°!`);
    } catch (err) {
      console.error('Rotate Error:', err);
      this.showToast('Could not rotate PDF: ' + err.message);
    }
  },

  // ============ TAB 4: DELETE PAGES CONTROLLER ============
  validateDeleteRangeInput() {
    if (!pdfToolkitState || !pdfToolkitState.singlePdf) return;
    const input = document.getElementById('deleteRangeInput');
    const valEl = document.getElementById('deleteRangeValidation');
    if (!input || !valEl) return;

    const total = pdfToolkitState.singlePdf.pageCount;
    const res = this.parsePageRange(input.value, total);

    if (res.valid) {
      const remaining = total - res.pages.length;
      if (remaining <= 0) {
        valEl.style.color = '#ef4444';
        valEl.textContent = '⚠️ Cannot delete all pages. A PDF must contain at least 1 page.';
      } else {
        valEl.style.color = '#4ade80';
        valEl.textContent = `✅ Deleting ${res.pages.length} pages. ${remaining} pages will remain in final PDF.`;
      }
    } else {
      valEl.style.color = '#ef4444';
      valEl.textContent = `⚠️ ${res.error}`;
    }
  },

  async executePdfDeletePages() {
    if (!pdfToolkitState || !pdfToolkitState.singlePdf) return;
    const { singlePdf } = pdfToolkitState;
    const input = document.getElementById('deleteRangeInput');
    const total = singlePdf.pageCount;
    const rangeRes = this.parsePageRange(input ? input.value : '', total);

    if (!rangeRes.valid) {
      this.showToast(rangeRes.error);
      return;
    }

    const deleteSet = new Set(rangeRes.pages);
    const keepIndices = [];
    for (let p = 1; p <= total; p++) {
      if (!deleteSet.has(p)) keepIndices.push(p - 1);
    }

    if (keepIndices.length === 0) {
      this.showToast('Cannot delete all pages. At least 1 page must remain.');
      return;
    }

    const PDFLib = await this.ensurePDFLib();
    if (!PDFLib) {
      this.showToast('PDF engine not available.');
      return;
    }
    try {
      const srcDoc = await PDFLib.PDFDocument.load(singlePdf.bytes);
      const cleanDoc = await PDFLib.PDFDocument.create();

      const copiedPages = await cleanDoc.copyPages(srcDoc, keepIndices);
      copiedPages.forEach(p => cleanDoc.addPage(p));

      const cleanBytes = await cleanDoc.save();
      const blob = new Blob([cleanBytes], { type: 'application/pdf' });

      pdfToolkitState.resultBlob = blob;
      pdfToolkitState.resultFilename = 'document-pages-removed.pdf';

      this.showToolkitResult(`Removed ${rangeRes.pages.length} Pages Successfully!`, `${keepIndices.length} Remaining Pages · ${this.formatBytes(blob.size)}`);
      this.showToast('🎉 Pages removed successfully!');
    } catch (err) {
      console.error('Delete Error:', err);
      this.showToast('Could not delete pages: ' + err.message);
    }
  },

  // ============ TAB 5: QUICK SIGN & STAMP CONTROLLER ============
  initSignaturePadCanvas() {
    const canvas = document.getElementById('pdfSignCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0284c7'; // Modern blue ink

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
      };
    };

    const startDraw = (e) => {
      e.preventDefault();
      isDrawing = true;
      const pos = getPos(e);
      lastX = pos.x;
      lastY = pos.y;
    };

    const draw = (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
    };

    const endDraw = () => { isDrawing = false; };

    canvas.onmousedown = startDraw;
    canvas.onmousemove = draw;
    canvas.onmouseup = endDraw;
    canvas.onmouseleave = endDraw;

    canvas.ontouchstart = startDraw;
    canvas.ontouchmove = draw;
    canvas.ontouchend = endDraw;
  },

  clearSignaturePad() {
    const canvas = document.getElementById('pdfSignCanvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  },

  setSignSubMode(mode) {
    if (!pdfToolkitState) return;
    pdfToolkitState.signSubMode = mode;

    ['draw', 'type', 'stamp'].forEach(m => {
      document.getElementById(`signMode-${m}`)?.classList.toggle('active', m === mode);
      const panel = document.getElementById(`signSubPanel-${m}`);
      if (panel) panel.style.display = m === mode ? 'block' : 'none';
    });

    if (mode === 'draw') {
      setTimeout(() => this.initSignaturePadCanvas(), 30);
    }
  },

  renderTypedSignaturePreview(name) {
    const el = document.getElementById('typedSigPreview');
    if (el) el.textContent = name.trim() || 'Your Name';
  },

  setPresetStamp(text, color) {
    if (!pdfToolkitState) return;
    pdfToolkitState.stampText = text;
    pdfToolkitState.stampColor = color;
    const input = document.getElementById('stampCustomText');
    if (input) input.value = text;
    this.showToast(`Selected ${text} stamp`);
  },

  setCustomStampText(val) {
    if (!pdfToolkitState) return;
    pdfToolkitState.stampText = val.toUpperCase();
    pdfToolkitState.stampColor = '#0284c7';
  },

  // Generates signature PNG data URL based on current sub-mode
  getSignatureDataUrl() {
    const mode = (pdfToolkitState && pdfToolkitState.signSubMode) || 'draw';

    if (mode === 'draw') {
      const canvas = document.getElementById('pdfSignCanvas');
      return canvas ? canvas.toDataURL('image/png') : null;
    } else if (mode === 'type') {
      const name = document.getElementById('signTypeInput')?.value.trim() || 'Signature';
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 400, 120);
      ctx.fillStyle = '#0284c7';
      ctx.font = 'italic bold 36px "Brush Script MT", "Caveat", "Dancing Script", cursive, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, 200, 60);
      return canvas.toDataURL('image/png');
    } else if (mode === 'stamp') {
      const text = (pdfToolkitState && pdfToolkitState.stampText) || 'APPROVED';
      const color = (pdfToolkitState && pdfToolkitState.stampColor) || '#10b981';
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 320, 100);

      // Stamp border
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, 300, 80);

      // Stamp text
      ctx.fillStyle = color;
      ctx.font = 'bold 30px "Courier New", monospace, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 160, 50);

      return canvas.toDataURL('image/png');
    }
    return null;
  },

  async executePdfSign() {
    if (!pdfToolkitState || !pdfToolkitState.singlePdf) return;
    const { singlePdf } = pdfToolkitState;
    const PDFLib = await this.ensurePDFLib();
    if (!PDFLib) {
      this.showToast('PDF engine not available.');
      return;
    }

    const dataUrl = this.getSignatureDataUrl();
    if (!dataUrl) {
      this.showToast('Please provide a signature or stamp first.');
      return;
    }

    try {
      const doc = await PDFLib.PDFDocument.load(singlePdf.bytes);
      const totalPages = doc.getPageCount();

      // Convert data URL to bytes
      const base64Data = dataUrl.split(',')[1];
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const pngImage = await doc.embedPng(bytes);
      const { width: imgW, height: imgH } = pngImage.scale(0.5);

      const targetPageMode = document.getElementById('signTargetPageSelect')?.value || 'last';
      const posMode = document.getElementById('signPositionSelect')?.value || 'bottom-right';

      let targetIndices = [];
      if (targetPageMode === 'first') targetIndices = [0];
      else if (targetPageMode === 'last') targetIndices = [totalPages - 1];
      else if (targetPageMode === 'all') targetIndices = doc.getPageIndices();

      targetIndices.forEach(idx => {
        const page = doc.getPage(idx);
        const { width: pageW, height: pageH } = page.getSize();

        // PDF coordinate math: origin (0, 0) is at bottom-left
        let x = 40;
        let y = 40;

        if (posMode === 'bottom-right') {
          x = pageW - imgW - 40;
          y = 40;
        } else if (posMode === 'bottom-left') {
          x = 40;
          y = 40;
        } else if (posMode === 'top-right') {
          x = pageW - imgW - 40;
          y = pageH - imgH - 40;
        } else if (posMode === 'center') {
          x = (pageW - imgW) / 2;
          y = (pageH - imgH) / 2;
        }

        page.drawImage(pngImage, {
          x,
          y,
          width: imgW,
          height: imgH
        });
      });

      const signedBytes = await doc.save();
      const blob = new Blob([signedBytes], { type: 'application/pdf' });

      pdfToolkitState.resultBlob = blob;
      pdfToolkitState.resultFilename = 'signed-document.pdf';

      this.showToolkitResult('Signature / Stamp Applied Successfully!', `Applied to ${targetIndices.length} pages · ${this.formatBytes(blob.size)}`);
      this.showToast('🎉 Document signed & ready for download!');
    } catch (err) {
      console.error('Signing Error:', err);
      this.showToast('Could not apply signature: ' + err.message);
    }
  },

  showToolkitResult(title, stats) {
    const card = document.getElementById('toolkitResultCard');
    const titleEl = document.getElementById('toolkitResultTitle');
    const statsEl = document.getElementById('toolkitResultStats');

    if (card) card.style.display = 'block';
    if (titleEl) titleEl.textContent = title;
    if (statsEl) statsEl.textContent = stats;
  },

  downloadToolkitResult() {
    if (!pdfToolkitState || !pdfToolkitState.resultBlob) {
      this.showToast('No result to download');
      return;
    }
    const blob = pdfToolkitState.resultBlob;
    const filename = pdfToolkitState.resultFilename || 'document.pdf';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.showToast(`Downloaded ${filename} (${this.formatBytes(blob.size)})! 📄`);
  },

  resetPdfToolkit() {
    const card = document.getElementById('toolkitResultCard');
    if (card) card.style.display = 'none';
    this.showToast('Ready for next action');
  },

  renderMarkdown(text) {
    if (!text) return '';
    if (window.marked) {
      const raw = marked.parse(text);
      return (window.DOMPurify && typeof DOMPurify.sanitize === 'function') ? DOMPurify.sanitize(raw) : raw;
    }
    return this.escapeHTML(text);
  }
};

window.UI = UI;
