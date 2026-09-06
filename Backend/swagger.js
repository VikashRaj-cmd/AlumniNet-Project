const swaggerUi = require('swagger-ui-express');
const config = require('./config/config');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'AlumniNet REST API & ATS Intelligence Platform',
    version: '1.0.0',
    description: 'Production-grade API documentation for AlumniNet featuring Authentication, Alumni Search, Resume Parser, ATS Scorer, LaTeX Builder, Real-Time Messaging, Events, Jobs, Razorpay Donations, and Admin Analytics.',
    contact: {
      name: 'AlumniNet Engineering Team',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: 'Local Development Server',
    },
    {
      url: config.frontendUrl,
      description: 'Production Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Input your JWT access token obtained from /api/auth/login or /api/auth/register',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['System Health'],
        summary: 'Check API, MongoDB, Redis, Storage, and Memory status',
        responses: {
          200: { description: 'System health status' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register new student or alumni account',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Vikash Rajput' },
                  email: { type: 'string', example: 'vikash@example.com' },
                  password: { type: 'string', example: 'Password123' },
                  role: { type: 'string', example: 'student', enum: ['student', 'alumni'] },
                  department: { type: 'string', example: 'Computer Science' },
                  batch: { type: 'string', example: '2027' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Registration successful' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login to get JWT Access Token and Refresh Cookie',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'vikash@example.com' },
                  password: { type: 'string', example: 'Password123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful, returns JWT token' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get logged-in user profile',
        responses: {
          200: { description: 'User profile details' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Logout user and revoke refresh token & access token',
        responses: {
          200: { description: 'Logout successful' },
        },
      },
    },
    '/api/resume/templates': {
      get: {
        tags: ['Resume & ATS Builder'],
        summary: 'Get 6 curated LaTeX templates (Jake Gutierrez sb2nov set as default)',
        responses: {
          200: { description: 'Template list' },
        },
      },
    },
    '/api/resume/my-resume': {
      get: {
        tags: ['Resume & ATS Builder'],
        summary: 'Get current active parsed resume, ATS score, and LaTeX source code',
        responses: {
          200: { description: 'Active resume details' },
        },
      },
    },
    '/api/resume/recommend-jobs': {
      get: {
        tags: ['Resume & ATS Builder'],
        summary: 'Get jobs & internships sorted by highest ATS / Skill Match percentage',
        responses: {
          200: { description: 'Recommended jobs list' },
        },
      },
    },
    '/api/resume/recommend-alumni': {
      get: {
        tags: ['Resume & ATS Builder'],
        summary: 'Get alumni ordered by highest skill match for direct networking and referral requests',
        responses: {
          200: { description: 'Recommended alumni list with referral suggestions' },
        },
      },
    },
    '/api/resume/parse-and-analyze': {
      post: {
        tags: ['Resume & ATS Builder'],
        summary: 'Upload PDF resume for text extraction, ATS scoring (0-100), AI suggestions, & LaTeX generation',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  resume: { type: 'string', format: 'binary', description: 'PDF resume file' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Parsed data, ATS score, AI suggestions, and LaTeX code' },
        },
      },
    },
    '/api/resume/generate-latex': {
      post: {
        tags: ['Resume & ATS Builder'],
        summary: 'Generate custom LaTeX code for selected template',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  templateId: { type: 'string', example: 'technical-one-page' },
                  customData: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Generated LaTeX source code' },
        },
      },
    },
    '/api/resume/analyze-job-match/{jobId}': {
      post: {
        tags: ['Resume & ATS Builder'],
        summary: 'Compare user resume against specific job ID for match percentage & missing skills',
        parameters: [
          { name: 'jobId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Job match percentage and suggestions' },
        },
      },
    },
    '/api/alumni/search': {
      get: {
        tags: ['Alumni Directory'],
        summary: 'Combined search & filter alumni by keyword, department, batch, company, and skills',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'department', in: 'query', schema: { type: 'string' } },
          { name: 'batch', in: 'query', schema: { type: 'string' } },
          { name: 'company', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Filtered alumni list' },
        },
      },
    },
    '/api/alumni/filters/departments': {
      get: {
        tags: ['Alumni Directory'],
        summary: 'Get department filter options',
        responses: { 200: { description: 'Department list' } },
      },
    },
    '/api/events': {
      get: {
        tags: ['Events'],
        summary: 'Get all events (cached in Redis)',
        responses: { 200: { description: 'Event list' } },
      },
      post: {
        tags: ['Events'],
        summary: 'Create new event (Alumni or Admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'date', 'location'],
                properties: {
                  title: { type: 'string', example: 'Annual Alumni Meet 2026' },
                  description: { type: 'string', example: 'Networking and career discussions' },
                  date: { type: 'string', example: '2026-10-15' },
                  location: { type: 'string', example: 'Auditorium Hall / Online' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Event created' } },
      },
    },
    '/api/internships': {
      get: {
        tags: ['Jobs & Internships'],
        summary: 'Get all job and internship postings (cached in Redis)',
        responses: { 200: { description: 'Job list' } },
      },
      post: {
        tags: ['Jobs & Internships'],
        summary: 'Post new job or internship (Alumni or Admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'company', 'location', 'type', 'description'],
                properties: {
                  title: { type: 'string', example: 'Frontend Developer Intern' },
                  company: { type: 'string', example: 'Google Inc.' },
                  location: { type: 'string', example: 'Remote / Bangalore' },
                  type: { type: 'string', example: 'internship' },
                  description: { type: 'string', example: 'React and JavaScript role' },
                  skillsRequired: { type: 'array', items: { type: 'string' }, example: ['React', 'Node.js', 'Git'] },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Job created' } },
      },
    },
    '/api/donations/create-order': {
      post: {
        tags: ['Donations (Razorpay)'],
        summary: 'Create Razorpay payment order',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount', 'purpose'],
                properties: {
                  amount: { type: 'number', example: 1000 },
                  purpose: { type: 'string', example: 'Infrastructure Development' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Razorpay order details' } },
      },
    },
    '/api/admin/stats': {
      get: {
        tags: ['Admin Management'],
        summary: 'Get admin dashboard counts and system metrics',
        responses: { 200: { description: 'System stats' } },
      },
    },
  },
};

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AlumniNet REST API Docs',
  }));
  console.log('[SWAGGER] API Documentation available at /api-docs');
};

module.exports = setupSwagger;
