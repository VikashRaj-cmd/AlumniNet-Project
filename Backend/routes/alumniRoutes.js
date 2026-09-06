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
const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/search', searchAlumni);          // GET /api/alumni/search?q=google&department=CSE&batch=2020
router.get('/filters/departments', getDepartments);
router.get('/filters/batches', getBatches);
router.get('/filters/companies', getCompanies);
router.get('/:id', validateObjectId, getAlumniById);

module.exports = router;
