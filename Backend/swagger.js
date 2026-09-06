const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./config/config');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AlumniNet REST API Documentation',
      version: '1.0.0',
      description: 'Production-grade API documentation for AlumniNet platform featuring Authentication, Alumni Search, Real-Time Chat, Notifications, Events, Jobs, and Admin Analytics.',
      contact: {
        name: 'AlumniNet Engineering Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development Server',
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
          description: 'Enter your JWT access token in the format: Bearer <token>',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js', './models/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AlumniNet API Docs',
  }));
  console.log('[SWAGGER] API Documentation available at /api-docs');
};

module.exports = setupSwagger;
