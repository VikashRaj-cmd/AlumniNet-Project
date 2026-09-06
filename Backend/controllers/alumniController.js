const User = require('../models/User');
const { AppError } = require('../middleware/errorMiddleware');

// Get a single alumni's full profile by ID
exports.getAlumniById = async (req, res, next) => {
  try {
    const alumni = await User.findOne({ _id: req.params.id, role: 'alumni' }).select('-password');
    if (!alumni) {
      return next(new AppError('Alumni not found.', 404));
    }
    res.json(alumni);
  } catch (error) {
    next(error);
  }
};

// Search & filter alumni with pagination
exports.searchAlumni = async (req, res, next) => {
  try {
    const {
      q,           // General keyword search (name, company, designation)
      department,
      batch,
      company,
      skills,      // Comma-separated skills list
      page = 1,
      limit = 12,
    } = req.query;

    // Build filter object
    const filter = { role: 'alumni' };

    // Keyword search across multiple fields
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
        { designation: { $regex: q, $options: 'i' } },
        { department: { $regex: q, $options: 'i' } },
      ];
    }

    if (department) filter.department = { $regex: department, $options: 'i' };
    if (batch) filter.batch = batch;
    if (company) filter.company = { $regex: company, $options: 'i' };

    // Filter by skills (alumni must have ALL specified skills)
    if (skills) {
      const skillsArray = skills.split(',').map((s) => s.trim());
      filter.skills = { $all: skillsArray.map((s) => new RegExp(s, 'i')) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [alumni, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      alumni,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all unique departments (for filter dropdowns in frontend)
exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await User.distinct('department', { role: 'alumni' });
    res.json(departments.filter(Boolean).sort());
  } catch (error) {
    next(error);
  }
};

// Get all unique batches (for filter dropdowns)
exports.getBatches = async (req, res, next) => {
  try {
    const batches = await User.distinct('batch', { role: 'alumni' });
    res.json(batches.filter(Boolean).sort((a, b) => b - a)); // Latest first
  } catch (error) {
    next(error);
  }
};

// Get all unique companies (for filter dropdowns)
exports.getCompanies = async (req, res, next) => {
  try {
    const companies = await User.distinct('company', { role: 'alumni' });
    res.json(companies.filter(Boolean).sort());
  } catch (error) {
    next(error);
  }
};
