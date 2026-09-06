const express = require('express');
const {
  getAlumniById,
  searchAlumni,
  getDepartments,
  getBatches,
  getCompanies,
} = require('../controllers/alumniController');
const { protect } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/validationMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/search', cacheMiddleware(300), searchAlumni);          // GET /api/alumni/search?q=google&department=CSE&batch=2020 (5m cache)
router.get('/filters/departments', cacheMiddleware(600), getDepartments); // 10m cache
router.get('/filters/batches', cacheMiddleware(600), getBatches);         // 10m cache
router.get('/filters/companies', cacheMiddleware(600), getCompanies);     // 10m cache
router.get('/:id', validateObjectId, cacheMiddleware(300), getAlumniById);

module.exports = router;
