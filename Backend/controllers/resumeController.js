const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const Resume = require('../models/Resume');
const User = require('../models/User');
const Internship = require('../models/Internship');
const { AppError } = require('../middleware/errorMiddleware');
const { uploadToCloud } = require('../config/storage');
const { parseResumeText, calculateAtsScore, matchJobWithResume } = require('../services/atsService');
const { TEMPLATES, generateLatexCode } = require('../services/latexService');

// Helper function to extract and clean readable text from PDF buffers
const extractCleanPdfText = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  let text = '';

  try {
    const pdfModule = require('pdf-parse');
    const uint8Array = new Uint8Array(dataBuffer);

    // 1. Try class-based PDFParse (new pdfModule.PDFParse(uint8array))
    if (pdfModule && pdfModule.PDFParse) {
      try {
        const parser = new pdfModule.PDFParse(uint8Array);
        const res = await parser.getText();
        if (typeof res === 'string') text = res;
        else if (res && res.text) text = res.text;
      } catch (err) {
        console.warn(`[RESUME] PDFParse class attempt: ${err.message}`);
      }
    }

    // 2. Try default function export if class method yielded no text
    if (!text && typeof pdfModule === 'function') {
      try {
        const pdfData = await pdfModule(dataBuffer);
        if (pdfData && pdfData.text) text = pdfData.text;
      } catch (err) {
        console.warn(`[RESUME] pdfModule function attempt: ${err.message}`);
      }
    }

    // 3. Try default property function export
    if (!text && pdfModule && typeof pdfModule.default === 'function') {
      try {
        const pdfData = await pdfModule.default(dataBuffer);
        if (pdfData && pdfData.text) text = pdfData.text;
      } catch (err) {
        console.warn(`[RESUME] pdfModule.default attempt: ${err.message}`);
      }
    }
  } catch (err) {
    console.warn(`[RESUME] PDF parse overall warning: ${err.message}`);
  }

  // Clean printable ASCII characters & normalize whitespace while preserving section line structure
  const cleaned = (text || '')
    .replace(/[^\x20-\x7E\n\t]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();

  return cleaned;
};

// Parse uploaded PDF resume, compute ATS score, generate LaTeX code, and save to DB
exports.parseAndAnalyzeResume = async (req, res, next) => {
  try {
    let rawText = '';
    let fileUrl = '';

    if (req.file) {
      // Extract clean text from PDF file
      rawText = await extractCleanPdfText(req.file.path);

      // Upload file to cloud / local storage
      fileUrl = await uploadToCloud(req.file.path, 'alumninet/resumes');
    } else if (req.body.text) {
      rawText = req.body.text;
    } else {
      return next(new AppError('Please upload a PDF resume file or provide resume text.', 400));
    }

    // 1. Parse text for skills, contact info, and structured sections
    const parsedData = parseResumeText(rawText);
    if (!parsedData.name) parsedData.name = req.user.name;
    if (!parsedData.email) parsedData.email = req.user.email;

    // 2. Compute ATS Compatibility Score & AI suggestions
    const { score, analysis } = calculateAtsScore(parsedData);

    // 3. Generate default Jake Gutierrez LaTeX source code
    const latexCode = generateLatexCode(parsedData, 'technical-one-page');

    // 4. Save or update user Resume in MongoDB
    let resume = await Resume.findOne({ user: req.user._id });
    if (!resume) {
      resume = new Resume({ user: req.user._id });
    }

    if (fileUrl) resume.originalFileUrl = fileUrl;
    resume.parsedData = parsedData;
    resume.atsScore = score;
    resume.atsAnalysis = analysis;
    resume.selectedTemplate = 'technical-one-page';
    resume.latexCode = latexCode;
    await resume.save();

    // 5. Sync extracted skills to User profile if requested
    if (parsedData.skills && parsedData.skills.length > 0) {
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { skills: { $each: parsedData.skills } },
        resume: fileUrl || resume.originalFileUrl,
      });
    }

    // 6. Clear Redis user/alumni cache
    const { deleteCachePattern } = require('../config/redis');
    await deleteCachePattern('cache:/api/alumni*');
    await deleteCachePattern('cache:/api/users*');

    res.json({
      message: 'Resume parsed and analyzed successfully!',
      atsScore: score,
      analysis,
      parsedData,
      latexCode,
      originalFileUrl: resume.originalFileUrl,
    });
  } catch (error) {
    next(error);
  }
};

// Analyze ATS match percentage between user's resume and a specific Job / Internship posting
exports.analyzeJobMatch = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await Internship.findById(jobId);
    if (!job) {
      return next(new AppError('Job or Internship posting not found.', 404));
    }

    const resume = await Resume.findOne({ user: req.user._id });
    const parsedData = resume ? resume.parsedData : { skills: req.user.skills || [] };

    const matchResult = matchJobWithResume(parsedData, job);

    res.json(matchResult);
  } catch (error) {
    next(error);
  }
};

// Get jobs/internships ordered by highest match score for the user
exports.getRecommendedJobs = async (req, res, next) => {
  try {
    const jobs = await Internship.find().populate('postedBy', 'name company designation');

    const resume = await Resume.findOne({ user: req.user._id });
    const parsedData = resume ? resume.parsedData : { skills: req.user.skills || [] };

    const recommendations = jobs.map((job) => {
      const match = matchJobWithResume(parsedData, job);
      return {
        ...job.toObject(),
        matchPercentage: match.matchPercentage,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
      };
    });

    // Sort by highest match score percentage
    recommendations.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.json(recommendations);
  } catch (error) {
    next(error);
  }
};

// Get alumni ordered by highest skill match for direct networking and referral requests
exports.getRecommendedAlumni = async (req, res, next) => {
  try {
    const alumniList = await User.find({ role: 'alumni' }).select('-password');

    const resume = await Resume.findOne({ user: req.user._id });
    const userSkillsList = (resume && resume.parsedData && resume.parsedData.skills && resume.parsedData.skills.length > 0)
      ? resume.parsedData.skills
      : (req.user.skills || []);

    const userSkillsSet = new Set(userSkillsList.map((s) => s.toLowerCase()));

    const recommendations = alumniList.map((alumni) => {
      const alumniSkills = alumni.skills || [];
      const matched = [];

      alumniSkills.forEach((skill) => {
        if (userSkillsSet.has(skill.toLowerCase())) {
          matched.push(skill);
        }
      });

      let matchPercentage = 0;
      if (userSkillsList.length > 0 && alumniSkills.length > 0) {
        matchPercentage = Math.round((matched.length / Math.max(userSkillsList.length, alumniSkills.length)) * 100);
      } else if (matched.length > 0) {
        matchPercentage = 50;
      }

      return {
        ...alumni.toObject(),
        matchPercentage: Math.min(100, Math.max(0, matchPercentage)),
        matchedSkills: matched,
        referralSuggestion: matched.length > 0
          ? `Connect with ${alumni.name} at ${alumni.company || 'their organization'} for a referral based on matching skills: ${matched.join(', ')}.`
          : `Reach out to ${alumni.name} at ${alumni.company || 'their organization'} for career guidance in ${alumni.department || 'tech'}.`,
      };
    });

    recommendations.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.json(recommendations);
  } catch (error) {
    next(error);
  }
};

// Return list of available LaTeX resume templates (with Jake Gutierrez default)
exports.getTemplates = (req, res) => {
  res.json({
    templates: TEMPLATES,
    defaultTemplateId: 'technical-one-page',
  });
};

// Generate custom LaTeX code for a given template ID and user data
exports.generateLatex = (req, res) => {
  const { templateId = 'technical-one-page', customData } = req.body;
  const latexCode = generateLatexCode(customData || {}, templateId);
  res.json({ templateId, latexCode });
};

// Save updated LaTeX code or selected template to DB
exports.saveResume = async (req, res, next) => {
  try {
    const { latexCode, selectedTemplate, parsedData } = req.body;

    let resume = await Resume.findOne({ user: req.user._id });
    if (!resume) {
      resume = new Resume({ user: req.user._id });
    }

    if (latexCode) resume.latexCode = latexCode;
    if (selectedTemplate) resume.selectedTemplate = selectedTemplate;
    if (parsedData) resume.parsedData = parsedData;

    await resume.save();

    res.json({ message: 'Resume updated successfully.', resume });
  } catch (error) {
    next(error);
  }
};

// Get current user's active resume details and ATS score
exports.getMyResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ user: req.user._id });
    if (!resume) {
      return res.json({
        hasResume: false,
        message: 'No resume uploaded yet. Upload a PDF or build your LaTeX resume!',
        defaultLatexCode: generateLatexCode({ name: req.user.name, email: req.user.email }, 'technical-one-page'),
        templates: TEMPLATES,
      });
    }

    res.json({
      hasResume: true,
      resume,
      templates: TEMPLATES,
    });
  } catch (error) {
    next(error);
  }
};
