/**
 * LaTeX Template Registry and Code Generator Service
 * Includes 6 curated templates with the Jake Gutierrez (sb2nov) Technical One-Page template
 * as the pre-configured default for B.Tech and Engineering students.
 */

const TEMPLATES = [
  {
    id: 'technical-one-page',
    name: 'Technical One-Page (B.Tech / Engineering Default)',
    author: 'Jake Gutierrez (sb2nov)',
    license: 'MIT',
    category: 'Engineering / CSE',
    isDefault: true,
    description: 'Compact, clean 1-page ATS-optimized LaTeX resume template tailored for B.Tech CSE, IT, and Engineering students.',
  },
  {
    id: 'modern-professional',
    name: 'Modern Professional',
    author: 'AlumniNet Design Team',
    category: 'General / Management',
    isDefault: false,
    description: 'Sleek, modern layout suitable for product management, consulting, and corporate roles.',
  },
  {
    id: 'software-developer',
    name: 'Software Engineer Focus',
    author: 'AlumniNet Tech Team',
    category: 'Software Engineering',
    isDefault: false,
    description: 'Highlights technical projects, system architecture, open-source contributions, and DSA competencies.',
  },
  {
    id: 'ai-ml-specialist',
    name: 'AI / Machine Learning Specialist',
    author: 'AlumniNet AI Lab',
    category: 'AI & Data Science',
    isDefault: false,
    description: 'Emphasizes ML models, NLP, PyTorch/TensorFlow, paper citations, and dataset engineering.',
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst & BI',
    author: 'AlumniNet Analytics',
    category: 'Analytics & BI',
    isDefault: false,
    description: 'Designed for SQL, Tableau/PowerBI, statistics, Python data pipelines, and business metrics.',
  },
  {
    id: 'research-academic',
    name: 'Research & Academic CV',
    author: 'AlumniNet Research',
    category: 'Higher Education & R&D',
    isDefault: false,
    description: 'Structured for higher studies (M.Tech/MS/PhD), research papers, patents, and academic achievements.',
  },
];

/**
 * Helper to escape LaTeX special characters (&, %, $, #, _, {, }, ~, ^) in dynamic user strings
 */
const escapeLatex = (str = '') => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
};

/**
 * Generate LaTeX source code for the Jake Gutierrez (sb2nov) template
 */
const generateJakeGutierrezLatex = (data = {}) => {
  const name = escapeLatex(data.name || 'Your Name');
  const phone = escapeLatex(data.phone || '+91 9876543210');
  const email = escapeLatex(data.email || 'your.email@example.com');
  const linkedin = escapeLatex(data.linkedin || 'linkedin.com/in/username');
  const github = escapeLatex(data.github || 'github.com/username');

  const skillsList = (data.skills && data.skills.length > 0)
    ? escapeLatex(data.skills.join(', '))
    : 'Languages, Frameworks, Tools';

  const educationBlocks = (data.education && data.education.length > 0)
    ? data.education.map((edu) => `
\\resumeSubheading
  {${escapeLatex(edu.institution || 'University Name')}}{Location}
  {${escapeLatex(edu.degree || 'Degree')}}{${escapeLatex(edu.year || '2023 -- 2027')}}
  \\resumeItemListStart
    \\resumeItem{${escapeLatex(edu.gpa || 'CGPA: 8.5/10')}}
  \\resumeItemListEnd
`).join('\n')
    : `
\\resumeSubheading
  {University College of Engineering}{Location}
  {B.Tech in Computer Science \\& Engineering}{2023 -- 2027}
  \\resumeItemListStart
    \\resumeItem{CGPA: 8.5/10}
  \\resumeItemListEnd
`;

  const experienceBlocks = (data.experience && data.experience.length > 0)
    ? data.experience.map((exp) => `
\\resumeSubheading
  {${escapeLatex(exp.title || 'Role')}}{${escapeLatex(exp.duration || 'Duration')}}
  {${escapeLatex(exp.company || 'Company Name')}}{Location}
  \\resumeItemListStart
    \\resumeItem{${escapeLatex(exp.description || 'Key contribution and achievements in this role.')}}
  \\resumeItemListEnd
`).join('\n')
    : `
\\resumeSubheading
  {Software Developer Intern}{Jun 2025 -- Aug 2025}
  {Tech Solutions Inc.}{Remote}
  \\resumeItemListStart
    \\resumeItem{Developed scalable REST APIs using Node.js, Express, and MongoDB serving 1,000+ daily users.}
    \\resumeItem{Optimized database query response times by 35% using Redis caching and index optimization.}
  \\resumeItemListEnd
`;

  const projectBlocks = (data.projects && data.projects.length > 0)
    ? data.projects.map((proj) => `
\\resumeProjectHeading
  {\\textbf{${escapeLatex(proj.name || 'Project Name')}} $|$ \\emph{${escapeLatex((proj.technologies || []).join(', ') || 'Tech Stack')}}}{${proj.link ? `\\href{${escapeLatex(proj.link)}}{Link}` : '2026'}}
  \\resumeItemListStart
    \\resumeItem{${escapeLatex(proj.description || 'Project details, features, and key performance impact.')}}
  \\resumeItemListEnd
`).join('\n')
    : `
\\resumeProjectHeading
  {\\textbf{AlumniNet Platform} $|$ \\emph{React, Node.js, Express, MongoDB, Socket.io, Redis, Docker}}{2026}
  \\resumeItemListStart
    \\resumeItem{Built a real-time alumni networking portal featuring WebSocket chat, JWT authentication, and ATS analyzer.}
    \\resumeItem{Containerized application stack with Docker Compose and set up GitHub Actions CI/CD pipeline.}
  \\resumeItemListEnd
`;

  const certificationsList = (data.certifications && data.certifications.length > 0)
    ? escapeLatex(data.certifications.join(', '))
    : 'AWS Certified Cloud Practitioner, Meta Front-End Developer Specialization';

  return `%-------------------------
% Resume in Latex
% Author : Jake Gutierrez
% Based off of: https://github.com/sb2nov/resume
% License : MIT
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\vline height 1.5pt width 1\\textwidth \\vspace{-5pt}]

\\pdfgentounicode=1

\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{marginal}{#1}{\\textbf{#2}}\\end{marginal}
    \\begin{tabularx}{\\textwidth}{X r}
      \\textbf{#1} & #2 \\\\
      \\emph{\\small#3} & \\emph{\\small #4} \\\\
    \\end{tabularx}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabularx}{\\textwidth}{X r}
      \\small#1 & #2 \\\\
    \\end{tabularx}\\vspace{-7pt}
}

\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge \\scshape ${name}} \\\\ \\vspace{1pt}
    \\small ${phone} $|$ \\href{mailto:${email}}{${email}} $|$ 
    \\href{https://${linkedin}}{${linkedin}} $|$
    \\href{https://${github}}{${github}}
\\end{center}

%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
    ${educationBlocks}
  \\resumeSubHeadingListEnd

%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Skills}{: ${skillsList}} \\\\
     \\textbf{Certifications}{: ${certificationsList}}
    }}
 \\end{itemize}

%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart
    ${experienceBlocks}
  \\resumeSubHeadingListEnd

%-----------PROJECTS-----------
\\section{Projects}
  \\resumeSubHeadingListStart
    ${projectBlocks}
  \\resumeSubHeadingListEnd

\\end{document}
`;
};

/**
 * Generate LaTeX code based on selected template ID
 */
const generateLatexCode = (parsedData = {}, templateId = 'technical-one-page') => {
  // Currently defaults to the Jake Gutierrez template
  return generateJakeGutierrezLatex(parsedData);
};

module.exports = {
  TEMPLATES,
  generateLatexCode,
};
