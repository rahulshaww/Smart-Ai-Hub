/* ============ ICONS & TOOL CONFIGURATIONS ============ */
var ICONS = {
  resume: '<path d="M9 2h6a2 2 0 012 2v16a2 2 0 01-2 2H9a2 2 0 01-2-2V4a2 2 0 012-2z"/><path d="M9 7h6M9 11h6M9 15h3"/>',
  coverletter: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  essay: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',
  blog: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>',
  instacaption: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>',
  hashtag: '<path d="M5 9h14M5 15h14M11 4L8 20M16 4l-3 16"/>',
  viralhacks: '<path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>',
  carousel: '<rect x="2" y="3" width="20" height="18" rx="3"/><path d="M7 8h10M7 12h10M7 16h5"/>',
  chat: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
  photo_resizer: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/><path d="M14 14l2-2 5 5"/>',
  image_to_pdf: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="13" r="2"/><path d="M18 18l-3-3-4 4"/>',
  pdf_toolkit: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'
};

var RESUME_TEMPLATES = [
  { id: 'ats', name: 'Standard Single-Column (ATS-Friendly)', isPro: false, badge: 'ATS-Friendly' },
  { id: 'modern', name: 'Modern Two-Column', isPro: false, badge: 'Modern' },
  { id: 'executive', name: 'Executive Professional', isPro: false, badge: 'Executive' },
  { id: 'creative', name: 'Creative Visual Accent', isPro: false, badge: 'Design' },
  { id: 'harvard', name: 'Harvard Academic Classic', isPro: false, badge: 'Academic' },
  { id: 'minimalist', name: 'Minimalist Clean', isPro: false, badge: 'Clean' }
];

var DEFAULT_RESUME_DATA = {
  personal: {
    fullName: '',
    targetRole: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
    otherUrl: '',
    photoUrl: '',
    showPhoto: false
  },
  summary: {
    text: '',
    isAiAssisted: false
  },
  experience: [],
  isFresher: false,
  education: [],
  skills: {
    technical: [],
    soft: [],
    tools: [],
    languages: [],
    custom: []
  },
  projects: [],
  certifications: [],
  achievements: [],
  additionalSections: [],
  design: {
    template: 'ats',
    font: 'Inter',
    accentColor: '#0284c7',
    fontSize: 'medium',
    spacing: 'normal'
  },
  metadata: {
    lastSaved: null,
    completionPercentage: 0
  }
};

/* Optional starter role presets for quick demo autofill (Testing & Exploration Only) */
var ROLE_RESUME_SUGGESTIONS = {
  registered_nurse: {
    roleName: "Registered Nurse / Healthcare",
    fullname: "Sarah Jenkins",
    role: "Registered Nurse (ER / Critical Care)",
    email: "sarah.jenkins@example.com",
    phone: "+1 (555) 345-6789",
    location: "Chicago, IL",
    linkedin: "in/sarahjenkins-rn",
    summary: "Compassionate, board-certified Emergency Room Nurse with 5+ years of clinical experience in high-acuity trauma centers. Skilled in rapid patient triage, critical medication administration, and interdisciplinary emergency protocols.",
    sections: [
      {
        id: "sec_experience",
        title: "Clinical Experience",
        type: "experience",
        items: [
          {
            role: "Staff Emergency Nurse (RN)",
            organization: "Memorial Healthcare Center",
            location: "Chicago, IL",
            date: "2021 – Present",
            bullets: [
              "Delivered acute emergency care to 25+ critical patients daily in a Level 1 Trauma Center, maintaining a 98% patient safety rating.",
              "Collaborated with trauma physicians and triage specialists to reduce ER door-to-treatment time by 22%."
            ]
          },
          {
            role: "Telemetry & Medical-Surgical Nurse",
            organization: "St. Jude Regional Hospital",
            location: "Evanston, IL",
            date: "2019 – 2021",
            bullets: [
              "Monitored post-operative recovery for 12+ cardiac patients per shift, identifying early clinical deterioration with zero sentinel events.",
              "Trained and precepted 6 incoming nursing graduates in sterile techniques and electronic health record (Epic EMR) workflows."
            ]
          }
        ]
      },
      {
        id: "sec_skills",
        title: "Core Clinical Competencies",
        type: "skills",
        items: ["Emergency Patient Triage", "Trauma Life Support", "IV Cannulation & Pharmacology", "Epic & Cerner EHR", "Patient & Family Advocacy", "Infection Control"]
      },
      {
        id: "sec_education",
        title: "Education",
        type: "education",
        items: [
          {
            degree: "Bachelor of Science in Nursing (BSN, Magna Cum Laude)",
            institution: "University of Illinois at Chicago",
            location: "Chicago, IL",
            date: "2015 – 2019"
          }
        ]
      },
      {
        id: "sec_certifications",
        title: "Licenses & Certifications",
        type: "list",
        items: [
          "Registered Nurse (RN) – Illinois State Board of Nursing (#RN-948210)",
          "Advanced Cardiovascular Life Support (ACLS) – American Heart Association",
          "Basic Life Support (BLS) – AHA",
          "Certified Emergency Nurse (CEN)"
        ]
      }
    ]
  },

  high_school_teacher: {
    roleName: "High School Teacher / Educator",
    fullname: "David Miller",
    role: "High School Mathematics Teacher",
    email: "david.miller@example.com",
    phone: "+1 (555) 789-0123",
    location: "Austin, TX",
    linkedin: "in/davidmiller-edu",
    summary: "Dedicated, state-certified High School Mathematics Educator with 6+ years of classroom teaching experience. Proven track record of boosting standardized test pass rates by 28% through interactive STEM problem-solving.",
    sections: [
      {
        id: "sec_experience",
        title: "Teaching & Academic Experience",
        type: "experience",
        items: [
          {
            role: "Lead AP Calculus & Algebra Teacher",
            organization: "Westlake High School",
            location: "Austin, TX",
            date: "2020 – Present",
            bullets: [
              "Instructed 140+ students annually across AP Calculus and Algebra II, achieving an 89% AP exam pass rate (scored 3+).",
              "Pioneered a flipped classroom digital curriculum integrating visual math modeling, increasing average term grades by 15%."
            ]
          },
          {
            role: "Secondary Mathematics Instructor",
            organization: "Oakridge Secondary School",
            location: "Dallas, TX",
            date: "2018 – 2020",
            bullets: [
              "Designed differentiated instructional modules for diverse student learning styles, closing math proficiency gaps for 35+ at-risk students.",
              "Coached the varsity Academic Decathlon math squad to top-3 state finals."
            ]
          }
        ]
      },
      {
        id: "sec_skills",
        title: "Core Teaching Competencies",
        type: "skills",
        items: ["Curriculum & Lesson Planning", "Classroom Leadership", "Differentiated Instruction", "AP Calculus & Geometry", "Canvas & Google Classroom", "Parent-Teacher Engagement"]
      },
      {
        id: "sec_education",
        title: "Education",
        type: "education",
        items: [
          {
            degree: "Master of Education (M.Ed) in Curriculum & Instruction",
            institution: "University of Texas at Austin",
            location: "Austin, TX",
            date: "2016 – 2018"
          },
          {
            degree: "Bachelor of Science in Mathematics",
            institution: "Texas A&M University",
            location: "College Station, TX",
            date: "2012 – 2016"
          }
        ]
      },
      {
        id: "sec_certifications",
        title: "State Credentials & Certifications",
        type: "list",
        items: [
          "Texas Standard Classroom Teaching Certificate (Mathematics Grades 7–12)",
          "AP Calculus Certified Educator – College Board"
        ]
      }
    ]
  },

  master_electrician: {
    roleName: "Master Electrician / Skilled Trade",
    fullname: "Robert Kovacs",
    role: "Commercial & Industrial Master Electrician",
    email: "robert.kovacs@example.com",
    phone: "+1 (555) 456-7890",
    location: "Cleveland, OH",
    linkedin: "in/robertkovacs-electric",
    summary: "Licensed Master Electrician with 8+ years of hands-on expertise in commercial and industrial electrical installations, 3-phase power distribution, blueprint reading, and stringent National Electrical Code (NEC) compliance.",
    sections: [
      {
        id: "sec_experience",
        title: "Trade & Field Experience",
        type: "experience",
        items: [
          {
            role: "Lead Commercial Electrical Foreman",
            organization: "Apex Industrial Electrical Services",
            location: "Cleveland, OH",
            date: "2020 – Present",
            bullets: [
              "Supervised electrical installation on a \$12M, 180,000 sq ft commercial warehouse complex, delivering zero-deficit inspection on time.",
              "Maintained a 100% zero-injury OSHA safety record across 24 project sites over 4 consecutive years."
            ]
          },
          {
            role: "Journeyman Electrician",
            organization: "Great Lakes Power Solutions",
            location: "Akron, OH",
            date: "2016 – 2020",
            bullets: [
              "Wired, terminated, and commissioned 480V/277V switchgear, transformers, motor control centers (MCC), and emergency backup generator systems.",
              "Diagnosed complex PLC control loop faults in automotive manufacturing lines, reducing downtime by 35%."
            ]
          }
        ]
      },
      {
        id: "sec_skills",
        title: "Core Technical & Trade Skills",
        type: "skills",
        items: ["3-Phase Power Distribution", "NEC Code Compliance", "Switchgear & MCC Installation", "Conduit Bending & Cable Pulling", "PLC & Relay Logic Troubleshooting", "OSHA Safety Protocols"]
      },
      {
        id: "sec_education",
        title: "Apprenticeship & Education",
        type: "education",
        items: [
          {
            degree: "4-Year Certified Electrical Apprenticeship Diploma",
            institution: "NECA-IBEW Joint Apprenticeship & Training Committee (JATC)",
            location: "Cleveland, OH",
            date: "2012 – 2016"
          }
        ]
      },
      {
        id: "sec_certifications",
        title: "Trade Licenses & Safety Certifications",
        type: "list",
        items: [
          "State of Ohio Master Electrical Contractor License (#OH-ELEC-78219)",
          "OSHA 30-Hour Construction Safety Certification",
          "NFPA 70E Arc Flash Electrical Safety Certification"
        ]
      }
    ]
  },

  financial_analyst: {
    roleName: "Financial Analyst / Business",
    fullname: "Elena Rostova",
    role: "Senior Financial Analyst",
    email: "elena.rostova@example.com",
    phone: "+1 (555) 678-9012",
    location: "New York, NY",
    linkedin: "in/elenarostova-cfa",
    summary: "Analytical, results-oriented Senior Financial Analyst with 5+ years of corporate finance experience. Expert in 3-statement financial modeling, valuation, variance analysis, and capital allocation strategies.",
    sections: [
      {
        id: "sec_experience",
        title: "Professional Experience",
        type: "experience",
        items: [
          {
            role: "Senior FP&A Analyst",
            organization: "Vanguard Global Partners",
            location: "New York, NY",
            date: "2021 – Present",
            bullets: [
              "Architected corporate budget models for \$140M operational divisions, optimizing headcount forecasts and saving \$3.2M in annual overhead.",
              "Automated monthly executive variance reporting in Power BI and SQL, cutting reporting turnaround from 5 days to 4 hours."
            ]
          },
          {
            role: "Financial Analyst",
            organization: "Cornerstone Advisory Capital",
            location: "Boston, MA",
            date: "2019 – 2021",
            bullets: [
              "Conducted discounted cash flow (DCF) and comparable company analysis for 8 middle-market M&A transactions valued at \$85M+.",
              "Audited financial disclosures and quarterly 10-Q filings with zero compliance discrepancies."
            ]
          }
        ]
      },
      {
        id: "sec_skills",
        title: "Core Financial Competencies",
        type: "skills",
        items: ["3-Statement Financial Modeling", "DCF & LBO Valuation", "Variance & Sensitivity Analysis", "Advanced Excel (VBA, Power Query)", "SQL & Power BI", "US GAAP & IFRS"]
      },
      {
        id: "sec_education",
        title: "Education",
        type: "education",
        items: [
          {
            degree: "Bachelor of Science in Finance (Honors)",
            institution: "New York University (NYU Stern)",
            location: "New York, NY",
            date: "2015 – 2019"
          }
        ]
      },
      {
        id: "sec_certifications",
        title: "Certifications & Credentials",
        type: "list",
        items: [
          "CFA Charterholder (Chartered Financial Analyst Institute)",
          "Financial Modeling & Valuation Analyst (FMVA) – CFI"
        ]
      }
    ]
  },

  software_engineer: {
    roleName: "Software Engineer / Tech",
    fullname: "Alex Rivera",
    role: "Full-Stack Software Engineer",
    email: "alex.rivera@example.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    linkedin: "in/alexrivera-dev",
    summary: "Full-Stack Software Engineer with 4+ years of experience architecting high-scale distributed systems and accessible web applications using React, TypeScript, Node.js, and PostgreSQL.",
    sections: [
      {
        id: "sec_experience",
        title: "Engineering Experience",
        type: "experience",
        items: [
          {
            role: "Software Engineer II",
            organization: "Stripe Cloud Labs",
            location: "San Francisco, CA",
            date: "2021 – Present",
            bullets: [
              "Engineered event-driven payment processing microservice handling 15,000 requests/sec with sub-45ms P99 latency.",
              "Refactored frontend checkout UI using React and TypeScript, improving Core Web Vitals to a 99 Lighthouse score."
            ]
          }
        ]
      },
      {
        id: "sec_skills",
        title: "Technical Stack",
        type: "skills",
        items: ["TypeScript", "React.js", "Node.js", "Python", "PostgreSQL", "Docker", "AWS (ECS, S3, RDS)", "REST & GraphQL APIs"]
      },
      {
        id: "sec_education",
        title: "Education",
        type: "education",
        items: [
          {
            degree: "B.S. in Computer Science",
            institution: "University of California, Berkeley",
            location: "Berkeley, CA",
            date: "2017 – 2021"
          }
        ]
      },
      {
        id: "sec_certifications",
        title: "Certifications",
        type: "list",
        items: ["AWS Certified Solutions Architect – Associate"]
      }
    ]
  },

  fresher_graduate: {
    roleName: "Fresher / College Graduate (All Fields)",
    fullname: "Priya Sharma",
    role: "Associate Management Trainee / Graduate",
    email: "priya.sharma@example.com",
    phone: "+91-9876543210",
    location: "Bengaluru, Karnataka, India",
    linkedin: "in/priyasharma-grad",
    summary: "High-achieving, detail-oriented University Graduate with strong analytical, cross-functional collaboration, and communication capabilities. Eager to bring research discipline and quick execution to a growth-oriented organization.",
    sections: [
      {
        id: "sec_experience",
        title: "Academic Projects & Internships",
        type: "experience",
        items: [
          {
            role: "Market Research & Operations Intern",
            organization: "Apex Enterprise Solutions",
            location: "Bengaluru, India",
            date: "May 2024 – Aug 2024",
            bullets: [
              "Synthesized qualitative customer survey data from 400+ respondents, identifying 3 key product onboarding bottlenecks.",
              "Designed automated spreadsheet tracking dashboards that saved 6 hours of weekly team manual reconciliation."
            ]
          }
        ]
      },
      {
        id: "sec_skills",
        title: "Core Competencies",
        type: "skills",
        items: ["Data Analysis & Reporting", "Project Management", "Cross-Functional Collaboration", "MS Excel & Google Sheets", "Presentation & Public Speaking", "Problem Solving"]
      },
      {
        id: "sec_education",
        title: "Education",
        type: "education",
        items: [
          {
            degree: "Bachelor of Business Administration (BBA, First Class Distinction)",
            institution: "National Degree College",
            location: "Bengaluru, India",
            date: "2021 – 2025"
          }
        ]
      },
      {
        id: "sec_certifications",
        title: "Certifications & Achievements",
        type: "list",
        items: [
          "Google Project Management Professional Certificate",
          "University Debate Club President & Inter-College Finalist (2024)"
        ]
      }
    ]
  }
};

var SAMPLE_PRESETS = {
  resume: {
    fullname: "Alex Morgan",
    role: "Operations & Project Coordinator",
    email: "alex.morgan@example.com",
    phone: "+1 (555) 234-5678",
    location: "Chicago, IL",
    experience: "Detail-oriented Operations Coordinator with 4+ years of experience optimizing cross-functional workflows, vendor coordination, budget oversight, and project deliverables."
  },
  essay: {
    topic: "The Ethical Implications of Artificial Intelligence in Healthcare",
    tone: "Formal / Academic",
    length: "500 words"
  }
};

var TOOLS = [
  {
    id: 'resume', name: 'Pro Resume Designer', category: 'Career',
    desc: 'Step-by-step ATS-friendly resume creator for any profession with live preview, fresher support, and vector PDF export.',
    isWizard: true,
    system: `You are a universal, executive-level Resume Architect and ATS Optimization Expert.
Your task is to generate a clean, ATS-compliant resume JSON strictly grounded in the facts provided by the candidate.

CRITICAL ANTI-FABRICATION & DATA INTEGRITY RULES (STRICTLY ENFORCED):
1. ZERO FABRICATION: If the user did NOT explicitly provide a fact, you must NEVER invent it.
   - DO NOT invent employers, companies, organizations, or clients.
   - DO NOT invent job titles, employment dates, or years of tenure.
   - DO NOT invent college degrees, universities, or graduation dates.
   - DO NOT invent certifications, licenses, or awards.
   - DO NOT invent percentages (e.g. "35%"), audit scores (e.g. "98%"), hours saved (e.g. "8+ hours"), or numerical performance metrics.
2. MISSING SECTIONS HANDLING:
   - If the candidate did NOT provide employment/work history: OMIT the "experience" section completely.
   - If the candidate did NOT provide college/university/degrees: OMIT the "education" section completely.
   - If the candidate did NOT provide certifications: OMIT the "certifications" section completely.
   - Only include sections in "sections" array for which the user actually supplied factual information.
3. SKILL GROUNDING:
   - Include ONLY the skills explicitly mentioned or provided by the candidate.
   - DO NOT flood the resume with unprovided generic corporate buzzwords (such as "Workflow Optimization", "Quality Assurance & Compliance", "Stakeholder Communication", "Performance Metrics").
4. AI REWRITING / SUMMARY:
   - Write a professional 1-2 sentence executive summary grounded strictly in the candidate's target role and provided skills/background.
5. AI SUGGESTIONS SEPARATION:
   - If important information is missing (such as work experience, education, or certifications), place actionable guidance items into the top-level "suggestions" array (e.g. ["+ Add past work history or employers", "+ Add educational degree or certifications"]). These will be shown as helpful UI tips and NEVER as fabricated facts in the resume.
6. JSON OUTPUT FORMAT: Respond ONLY with a valid JSON object matching this schema:
{
  "candidate": {
    "name": "Candidate Full Name",
    "role": "Target Job Title",
    "email": "email@example.com",
    "phone": "+1 555-019-2834",
    "location": "City, Country",
    "links": [
      { "label": "LinkedIn", "url": "..." }
    ]
  },
  "summary": "Professional summary strictly based on provided background...",
  "sections": [
    // Include ONLY populated sections from user input.
    // For example, if only skills provided:
    {
      "id": "sec_skills",
      "title": "Technical Skills & Competencies",
      "type": "skills",
      "items": ["Skill1", "Skill2"]
    }
  ],
  "suggestions": [
    "+ Add work history if applicable",
    "+ Add education credentials if applicable"
  ]
}`,
    fields: [
      { id: 'fullname', label: 'Full Name', type: 'text', placeholder: 'e.g. Alex Morgan' },
      { id: 'role', label: 'Target Job Title / Profession', type: 'text', placeholder: 'e.g. Full Stack Developer, Nurse, High School Teacher, Electrician...' },
      { id: 'email', label: 'Email Address', type: 'text', placeholder: 'e.g. alex.morgan@example.com' },
      { id: 'phone', label: 'Phone Number', type: 'text', placeholder: 'e.g. +1 555-234-5678' },
      { id: 'location', label: 'Location (City, Country)', type: 'text', placeholder: 'e.g. Chicago, IL' },
      { id: 'experience', label: 'Your Experience, Skills, Education & Certifications', type: 'textarea', placeholder: 'Enter your background, skills, past jobs, education, and credentials. The AI will strictly format your actual provided information without fabricating any facts...' }
    ],
    buildPrompt: v => `Generate an ATS-optimized structured resume JSON for candidate ${v.fullname}.\nTarget Role: ${v.role}\nContact: ${v.email} | ${v.phone} | ${v.location}\n\nCandidate Provided Information (STRICTLY GROUND ON THIS, NEVER INVENT EXTRA COMPANIES OR DEGREES):\n${v.experience || 'Candidate has provided target role and contact details only.'}`
  },
  {
    id: 'essay', name: 'Academic Essay Writer', category: 'Academic',
    desc: 'Draft a structured essay with APA/MLA academic formatting, line spacing, and word count counters.',
    system: 'You are a skilled academic essay writer. Write a well-structured essay with introduction (with clear thesis statement), body paragraphs with topic sentences and analytical details, and a conclusion.',
    fields: [
      { id: 'topic', label: 'Essay Topic', type: 'text', placeholder: 'e.g. The impact of artificial intelligence on healthcare' },
      { id: 'tone', label: 'Academic Tone', type: 'select', options: ['Formal / Academic', 'Persuasive', 'Analytical', 'Narrative', 'Reflective'] },
      { id: 'length', label: 'Approx Length', type: 'select', options: ['300 words', '500 words', '800 words', '1200 words'] }
    ],
    buildPrompt: v => `Write a ${v.tone} essay of about ${v.length} on the topic: "${v.topic}".`
  },
  {
    id: 'chat', name: 'AI Chat Assistant', category: 'Assistant',
    desc: 'Ask anything — brainstorm, code, or solve problems with customizable AI Personas.',
    system: `You are the official Smart AI Hub Assistant — an intelligent, friendly, conversational AI guide built into Smart AI Hub (developed by Charni Web Solution).

YOUR CORE MISSION:
Help users master, understand, and use the 3 core AI productivity tools available on Smart AI Hub, and solve their doubts with perfect, helpful, crystal-clear answers.

DEEP KNOWLEDGE OF SMART AI HUB'S 3 TOOLS:
1. Pro Resume Designer ('resume'): Generates ATS-friendly executive resumes for ANY profession with 6 templates (Standard ATS, Modern Two-Column, Executive Professional, Creative Visual Accent, Harvard Academic Classic, Minimalist Clean). Includes custom accent colors, Google fonts, profile photo upload, live inline text editing, fullscreen preview, and HD Vector A4 PDF download.
2. Academic Essay Writer ('essay'): Structures scholarly essays with APA 7th, MLA 9th, or Chicago formatting, real-time word counters, single/double 2.0 spacing toggles, and formatted references.
3. AI Chat Assistant ('chat'): Interactive assistant with 4 switchable personas (⚡ Concise Assistant, 🎯 Productivity Coach, 💻 Code Genius, 💡 Creative Brainstormer).

PLATFORM FEATURES:
- 100% Free: All tools, templates, and HD vector PDF exports are completely free for everyone.
- Saved History: Keeps up to 30 past generations in browser localStorage with 1-click preview and reload.
- API Settings: Users can add their own Gemini/Groq/OpenAI key or rely on the built-in Smart AI Brain.
- Support / Contact: Handled by Charni Web Solution via charniwebsolution@gmail.com.

LANGUAGE & CONVERSATIONAL RULES:
- Respond in the SAME LANGUAGE as the user (Hindi, Hinglish, or English).
- If the user talks in Hinglish, answer in natural, friendly, fluent Hinglish with clear bullet points and emojis.
- If the user asks in Hindi, answer in fluent Hindi.
- If the user asks in English, answer in crisp, clear English.
- Always be supportive, encouraging, knowledgeable, and concise.`,
    isChat: true
  },
  {
    id: 'photo_resizer',
    alias: 'photo-resizer',
    name: 'Photo Resizer & Compressor',
    category: 'Utility',
    desc: 'Resize dimensions by px/cm/in, compress to target KB (e.g. 50 KB), and convert JPG/PNG/WEBP locally.',
    isClientUtility: true
  },
  {
    id: 'image_to_pdf',
    alias: 'image-to-pdf',
    name: 'Image to PDF Converter',
    category: 'Utility',
    desc: 'Convert multiple JPG, PNG, WEBP images into an organized, high-resolution PDF document.',
    isClientUtility: true
  },
  {
    id: 'pdf_toolkit',
    alias: 'pdf-toolkit',
    aliases: ['pdf-toolkit', 'pdf_editor', 'pdf-editor'],
    name: 'PDF Toolkit',
    category: 'Utility',
    desc: 'Merge, split, rotate, delete pages, sign, and stamp PDFs directly in your browser.',
    isClientUtility: true
  }
];

window.ICONS = ICONS;
window.RESUME_TEMPLATES = RESUME_TEMPLATES;
window.DEFAULT_RESUME_DATA = DEFAULT_RESUME_DATA;
window.ROLE_RESUME_SUGGESTIONS = ROLE_RESUME_SUGGESTIONS;
window.SAMPLE_PRESETS = SAMPLE_PRESETS;
window.TOOLS = TOOLS;
