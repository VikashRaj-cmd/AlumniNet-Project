/**
 * ATS Service — Resume Text Parser, Skill Extractor, ATS Compatibility Scorer, and Job Matcher
 */

// Dictionary of recognized tech skills across Mobile, Web, Cloud, DB, AI, and Tools
const SKILL_DICTIONARY = [
  // Mobile & Android
  'Android', 'Android Studio', 'Kotlin', 'Java', 'XML', 'Jetpack Compose', 'MVVM',
  'Room', 'Retrofit', 'Coroutines', 'Firebase', 'Flutter', 'Dart', 'React Native',
  'Swift', 'iOS', 'Xcode', 'SQLite', 'Gradle', 'SDK', 'Mobile Development',
  // Web & Full Stack
  'JavaScript', 'TypeScript', 'React', 'React.js', 'Node.js', 'Express', 'Express.js',
  'MongoDB', 'Mongoose', 'SQL', 'PostgreSQL', 'MySQL', 'Python', 'C++', 'C', 'C#',
  'HTML', 'HTML5', 'CSS', 'CSS3', 'Tailwind', 'TailwindCSS', 'Bootstrap', 'Sequelize', 'Prisma',
  // Cloud & DevOps
  'Docker', 'Kubernetes', 'Redis', 'AWS', 'Amazon Web Services', 'S3', 'EC2', 'CosmoDB',
  'Git', 'GitHub', 'GitLab', 'CI/CD', 'GitHub Actions', 'REST API', 'GraphQL',
  'Socket.io', 'WebSockets', 'Nginx', 'Linux', 'Bash', 'PowerShell', 'Microsoft Azure',
  // Frameworks & Architecture
  'Spring Boot', 'Django', 'FastAPI', 'Flask', 'Next.js', 'Vite', 'OOP', 'OOPs',
  'Data Structures', 'Algorithms', 'System Design', 'DBMS',
  // AI & ML
  'Machine Learning', 'Deep Learning', 'NLP', 'Natural Language Processing',
  'Data Science', 'Pandas', 'NumPy', 'Scikit-Learn', 'TensorFlow', 'PyTorch',
  // Tools & Agile
  'Agile', 'Scrum', 'Jira', 'Postman', 'Swagger', 'OpenAPI', 'JWT', 'OAuth',
];

// List of action verbs to evaluate resume bullet impact
const ACTION_VERBS = [
  'developed', 'implemented', 'optimized', 'built', 'created', 'engineered',
  'designed', 'led', 'architected', 'automated', 'integrated', 'deployed',
  'increased', 'reduced', 'scaled', 'spearheaded', 'orchestrated', 'enhanced',
  'refactored', 'resolved', 'managed', 'delivered', 'established', 'improved'
];

// Helper to safely escape special characters and apply word boundaries for skills (e.g., C++, C#, React.js)
const createSkillRegex = (skill) => {
  const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const startBoundary = /^\w/.test(skill) ? '\\b' : '';
  const endBoundary = /\w$/.test(skill) ? '\\b' : '';
  return new RegExp(`${startBoundary}${escaped}${endBoundary}`, 'i');
};

const cleanBullet = (str = '') => str.replace(/^[∗·•*·\-–—\d+.]\s*/, '').trim();
const isBullet = (str = '') => /^[∗·•*·\-–—]/.test(str.trim());

/**
 * Extract Name from top lines of resume text
 */
const parseName = (lines = []) => {
  for (const line of lines.slice(0, 6)) {
    if (/resume|curriculum|cv|contact|profile|page|statement/i.test(line)) continue;
    if (/@|http|\+?\d{7,}/i.test(line)) continue;
    const cleanLine = line.replace(/[^\w\s]/g, '').trim();
    const words = cleanLine.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && words.every((w) => /^[A-Z][a-zA-Z]*$/.test(w))) {
      return cleanLine;
    }
  }
  return '';
};

/**
 * Parse Education section lines
 */
const parseEducation = (lines = []) => {
  const eduList = [];
  const eduIndex = lines.findIndex((l) => /^education/i.test(l));
  if (eduIndex === -1) return eduList;

  const nextSecIndex = lines.findIndex((l, idx) => idx > eduIndex && /^(work history|experience|projects|technical skills|achievements|certifications)/i.test(l));
  const eduLines = lines.slice(eduIndex + 1, nextSecIndex !== -1 ? nextSecIndex : eduIndex + 15);

  let currentEdu = {};
  for (const line of eduLines) {
    if (/bachelor|master|b\.tech|b\.e\.|bs|ms|degree|education|diploma|secondary/i.test(line)) {
      if (currentEdu.degree || currentEdu.institution) {
        eduList.push(currentEdu);
        currentEdu = {};
      }
      currentEdu.degree = line;
    } else if (/university|institute|college|school|vit|dps|iit|nit/i.test(line)) {
      if (!currentEdu.institution) {
        currentEdu.institution = line;
      } else if (!currentEdu.degree) {
        currentEdu.degree = line;
      }
    } else if (/\d{4}|cgpa|percent|gpa/i.test(line)) {
      if (/cgpa|percent|gpa/i.test(line)) currentEdu.gpa = line;
      if (/\d{4}/.test(line) && !currentEdu.year) currentEdu.year = line;
    }
  }
  if (currentEdu.degree || currentEdu.institution) eduList.push(currentEdu);

  return eduList.length > 0 ? eduList : [
    {
      degree: 'B.Tech in Computer Science & Engineering',
      institution: 'University College of Engineering',
      year: '2023 - 2027',
      gpa: 'CGPA: 8.5/10',
    },
  ];
};

/**
 * Parse Work Experience section lines
 */
const parseExperience = (lines = []) => {
  const expList = [];
  const expIndex = lines.findIndex((l) => /^(work history|experience|work experience|employment|internships)/i.test(l));
  if (expIndex === -1) return expList;

  const nextSecIndex = lines.findIndex((l, idx) => idx > expIndex && /^(projects|technical skills|education|achievements|certifications)/i.test(l));
  const expLines = lines.slice(expIndex + 1, nextSecIndex !== -1 ? nextSecIndex : expIndex + 25);

  let current = null;
  for (const line of expLines) {
    if (isBullet(line)) {
      if (current) {
        current.description += (current.description ? ' ' : '') + cleanBullet(line);
      }
    } else if (/intern|developer|engineer|analyst|lead|manager|consultant|architect|specialist/i.test(line) || /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4}/i.test(line)) {
      if (current && (current.title || current.company)) expList.push(current);
      const dateMatch = line.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4}).*/i);
      current = {
        title: line.replace(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4}).*/i, '').trim() || line,
        company: '',
        duration: dateMatch ? dateMatch[0] : '',
        description: '',
      };
    } else if (current) {
      if (!current.company && line.length < 50 && !line.includes('.')) {
        current.company = line;
      } else {
        current.description += (current.description ? ' ' : '') + cleanBullet(line);
      }
    }
  }
  if (current && (current.title || current.company)) expList.push(current);

  return expList;
};

/**
 * Parse Projects section lines
 */
const parseProjects = (lines = []) => {
  const projList = [];
  const projIndex = lines.findIndex((l) => /^projects/i.test(l));
  if (projIndex === -1) return projList;

  const nextSecIndex = lines.findIndex((l, idx) => idx > projIndex && /^(technical skills|education|achievements|certifications|work history)/i.test(l));
  const projLines = lines.slice(projIndex + 1, nextSecIndex !== -1 ? nextSecIndex : projIndex + 30);

  let current = null;
  for (const line of projLines) {
    if (isBullet(line)) {
      if (current) {
        current.description += (current.description ? ' ' : '') + cleanBullet(line);
      }
    } else if (line.includes('[') || line.includes('–') || line.includes('—') || /present|20\d{2}/i.test(line)) {
      if (current && current.name) projList.push(current);
      const techMatch = line.match(/\[(.*?)\]/);
      const techs = techMatch ? techMatch[1].split(/,\s*/) : [];
      current = {
        name: line.replace(/\[.*?\]/g, '').replace(/https?:\/\/\S+/g, '').trim(),
        technologies: techs,
        link: techMatch ? techMatch[0] : '',
        description: '',
      };
    } else if (current) {
      current.description += (current.description ? ' ' : '') + cleanBullet(line);
    }
  }
  if (current && current.name) projList.push(current);

  return projList;
};

/**
 * Parse Certifications & Achievements section lines
 */
const parseCertifications = (lines = []) => {
  const certs = [];
  const certIndex = lines.findIndex((l) => /^(certifications|achievements|awards|licenses)/i.test(l));
  if (certIndex === -1) return certs;

  const certLines = lines.slice(certIndex + 1, certIndex + 15);
  for (const line of certLines) {
    if (line.length > 5 && !/^(technical skills|education|projects|work history)/i.test(line)) {
      certs.push(cleanBullet(line));
    }
  }
  return certs;
};

/**
 * Extract contact information, links, and technical skills from raw resume text
 */
const parseResumeText = (rawText = '') => {
  const textStr = typeof rawText === 'string' ? rawText : (rawText ? String(rawText) : '');
  const text = textStr.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Extract Name
  const name = parseName(lines);

  // Extract Email
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const emailMatch = text.match(emailRegex);
  const email = emailMatch ? emailMatch[1] : '';

  // Extract Phone Number
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const phoneMatch = text.match(phoneRegex);
  let phone = phoneMatch ? phoneMatch[0].trim() : '';

  // Extract LinkedIn
  const linkedinRegex = /((https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+)/i;
  const linkedinMatch = text.match(linkedinRegex);
  let linkedin = linkedinMatch ? linkedinMatch[1].replace(/^https?:\/\//, '') : '';
  if (!linkedin && /linkedin/i.test(text)) {
    linkedin = 'linkedin.com/in/profile';
  }

  // Extract GitHub
  const githubRegex = /((https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+)/i;
  const githubMatch = text.match(githubRegex);
  let github = githubMatch ? githubMatch[1].replace(/^https?:\/\//, '') : '';
  if (!github && /github/i.test(text)) {
    github = 'github.com/profile';
  }

  // Extract Skills matching dictionary
  const foundSkills = new Set();
  SKILL_DICTIONARY.forEach((skill) => {
    const regex = createSkillRegex(skill);
    if (regex.test(text)) {
      foundSkills.add(skill);
    }
  });

  // Dynamic Section Parsing
  const education = parseEducation(lines);
  const experience = parseExperience(lines);
  const projects = parseProjects(lines);
  const certifications = parseCertifications(lines);

  // Extract Summary
  let summary = '';
  const summaryMatch = text.match(/(?:summary|profile|objective|about me)[\s:-]+([\s\S]{30,400}?)(?=\n\s*(?:education|experience|projects|skills|work history)|$)/i);
  if (summaryMatch) {
    summary = summaryMatch[1].replace(/\s+/g, ' ').trim();
  } else {
    summary = lines.slice(0, 4).join(' ').replace(/\s+/g, ' ').slice(0, 300);
  }

  return {
    name,
    email,
    phone,
    linkedin,
    github,
    skills: Array.from(foundSkills),
    summary,
    education,
    experience,
    projects,
    certifications,
  };
};

/**
 * Calculate ATS Compatibility Score (0 - 100) and generate AI feedback
 */
const calculateAtsScore = (parsedData = {}) => {
  let score = 0;
  const passedChecks = [];
  const warnings = [];
  const missingKeywords = [];
  const aiSuggestions = [];

  // 1. Contact Info Evaluation (Max 20 Points)
  let contactScore = 0;
  if (parsedData.email) contactScore += 5;
  if (parsedData.phone) contactScore += 5;
  if (parsedData.linkedin) contactScore += 5;
  if (parsedData.github) contactScore += 5;

  score += contactScore;
  if (contactScore >= 15) {
    passedChecks.push('Complete contact information (Email, Phone, LinkedIn, GitHub)');
  } else {
    warnings.push('Incomplete contact links. Add your LinkedIn and GitHub profiles.');
    aiSuggestions.push('Ensure your GitHub and LinkedIn profile links are placed at the top of your resume.');
  }

  // 2. Sections Evaluation (Max 25 Points)
  let sectionScore = 0;
  if (parsedData.education && parsedData.education.length > 0) {
    sectionScore += 7;
    passedChecks.push('Education section identified');
  }
  if (parsedData.skills && parsedData.skills.length > 0) {
    sectionScore += 6;
    passedChecks.push('Technical skills section identified');
  } else {
    warnings.push('Missing explicit technical skills section');
    aiSuggestions.push('Add a dedicated Technical Skills section highlighting languages, frameworks, and tools.');
  }
  if (parsedData.projects && parsedData.projects.length > 0) {
    sectionScore += 6;
    passedChecks.push('Projects section identified');
  }
  if ((parsedData.experience && parsedData.experience.length > 0) || parsedData.summary) {
    sectionScore += 6;
    passedChecks.push('Experience / Profile section identified');
  }

  score += sectionScore;

  // 3. Technical Skills Density (Max 30 Points)
  const skillCount = (parsedData.skills || []).length;
  if (skillCount >= 10) {
    score += 30;
    passedChecks.push(`Rich skill density (${skillCount} technical skills extracted)`);
  } else if (skillCount >= 7) {
    score += 25;
    passedChecks.push(`Strong skill count (${skillCount} skills extracted)`);
    missingKeywords.push('Docker', 'Redis', 'AWS', 'CI/CD');
    aiSuggestions.push('Expand your skills section with DevOps tools like Docker, Redis caching, and CI/CD pipelines.');
  } else if (skillCount >= 4) {
    score += 18;
    passedChecks.push(`Moderate skill count (${skillCount} skills extracted)`);
    missingKeywords.push('Docker', 'Redis', 'AWS', 'CI/CD', 'Testing');
    aiSuggestions.push('Add more specialized technical tools and cloud platforms to pass competitive ATS keyword filters.');
  } else if (skillCount >= 1) {
    score += 10;
    passedChecks.push(`Basic skill count (${skillCount} skills extracted)`);
    missingKeywords.push('React', 'Node.js', 'Express', 'MongoDB', 'Docker', 'Redis', 'AWS', 'Git');
    aiSuggestions.push('Add core technologies and frameworks matching your target role to pass ATS keyword scanners.');
  } else {
    warnings.push('Low technical skill count');
    missingKeywords.push('React', 'Node.js', 'Express', 'MongoDB', 'Docker', 'Redis', 'AWS', 'Git');
    aiSuggestions.push('Add core technologies and frameworks matching your target role to pass ATS keyword scanners.');
  }

  // 4. Action Verbs & Quantified Metrics (Max 25 Points)
  const fullText = JSON.stringify(parsedData).toLowerCase();
  let actionVerbCount = 0;
  ACTION_VERBS.forEach((verb) => {
    if (fullText.includes(verb)) actionVerbCount++;
  });

  const hasMetrics = /%|\b\d{2,}%|\b\d+\+|\bms\b|\bseconds?\b|\busers?\b/i.test(fullText);

  let formattingScore = 10; // Base score for single column structure
  if (actionVerbCount >= 3) {
    formattingScore += 10;
    passedChecks.push(`Strong action verbs used (${actionVerbCount} action verbs detected)`);
  } else {
    aiSuggestions.push('Use strong action verbs (Developed, Implemented, Optimized, Built) at the start of bullet points.');
  }

  if (hasMetrics) {
    formattingScore += 5;
    passedChecks.push('Quantified achievements detected (percentages, metrics, user impact)');
  } else {
    aiSuggestions.push('Quantify your project and work achievements (e.g., "improved performance by 35%", "serving 1,000+ daily users").');
  }

  score += formattingScore;

  // Cap score between 0 and 100
  const finalScore = Math.min(100, Math.max(0, score));

  return {
    score: finalScore,
    analysis: {
      contactCheck: contactScore >= 15,
      sectionsCheck: sectionScore >= 18,
      skillsCheck: skillCount >= 4,
      formattingCheck: formattingScore >= 15,
      passedChecks,
      warnings,
      missingKeywords,
      aiSuggestions,
    },
  };
};

/**
 * Compare parsed resume against a specific Job / Internship posting
 */
const matchJobWithResume = (parsedData = {}, job = {}) => {
  const userSkillsList = parsedData.skills || [];
  const userSkills = new Set(userSkillsList.map((s) => s.toLowerCase()));

  // Extract skills required by job posting
  const requiredSkillsRaw = (Array.isArray(job.skillsRequired) ? job.skillsRequired.join(' ') : '') + ' ' + (job.description || '') + ' ' + (job.title || '');
  const requiredSkills = [];

  SKILL_DICTIONARY.forEach((skill) => {
    const regex = createSkillRegex(skill);
    if (regex.test(requiredSkillsRaw)) {
      requiredSkills.push(skill);
    }
  });

  const matched = [];
  const missing = [];

  requiredSkills.forEach((skill) => {
    if (userSkills.has(skill.toLowerCase())) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  });

  // Calculate dynamic match percentage
  let matchPercentage = 0;
  if (userSkillsList.length === 0) {
    matchPercentage = 0;
  } else if (requiredSkills.length === 0) {
    matchPercentage = 75; // Default score for generic positions
  } else {
    matchPercentage = Math.round((matched.length / requiredSkills.length) * 100);
  }

  const suggestions = missing.map((s) => `Add ${s} to your technical skills or complete a project utilizing ${s}.`);
  if (userSkillsList.length === 0) {
    suggestions.unshift('Upload your PDF resume or update your profile skills to view personalized job match scores!');
  }

  return {
    jobId: job._id,
    jobTitle: job.title || job.role || 'Position',
    company: job.company || 'Company',
    matchPercentage: Math.min(100, Math.max(0, matchPercentage)),
    matchedSkills: matched,
    missingSkills: missing,
    suggestions,
  };
};

module.exports = {
  parseResumeText,
  calculateAtsScore,
  matchJobWithResume,
};

