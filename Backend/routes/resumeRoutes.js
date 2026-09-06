const express = require('express');
const {
  parseAndAnalyzeResume,
  analyzeJobMatch,
  getRecommendedJobs,
  getRecommendedAlumni,
  getTemplates,
  generateLatex,
  saveResume,
  getMyResume,
} = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');
const { uploadResume: uploadResumeMiddleware } = require('../middleware/uploadMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/parse-and-analyze', uploadResumeMiddleware, parseAndAnalyzeResume);
router.get('/my-resume', getMyResume);
router.get('/templates', getTemplates);
router.post('/generate-latex', generateLatex);
router.post('/save', saveResume);
router.post('/analyze-job-match/:jobId', analyzeJobMatch);
router.get('/recommend-jobs', cacheMiddleware(60), getRecommendedJobs);
router.get('/recommend-alumni', cacheMiddleware(60), getRecommendedAlumni);

module.exports = router;
