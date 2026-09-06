const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    originalFileUrl: {
      type: String,
      default: '',
    },
    parsedData: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      summary: { type: String, default: '' },
      skills: [{ type: String }],
      education: [
        {
          degree: { type: String },
          institution: { type: String },
          year: { type: String },
          gpa: { type: String },
        },
      ],
      experience: [
        {
          title: { type: String },
          company: { type: String },
          duration: { type: String },
          description: { type: String },
        },
      ],
      projects: [
        {
          name: { type: String },
          technologies: [{ type: String }],
          description: { type: String },
          link: { type: String },
        },
      ],
      certifications: [{ type: String }],
    },
    atsScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    atsAnalysis: {
      contactCheck: { type: Boolean, default: false },
      sectionsCheck: { type: Boolean, default: false },
      skillsCheck: { type: Boolean, default: false },
      formattingCheck: { type: Boolean, default: false },
      passedChecks: [{ type: String }],
      warnings: [{ type: String }],
      missingKeywords: [{ type: String }],
      aiSuggestions: [{ type: String }],
    },
    selectedTemplate: {
      type: String,
      default: 'technical-one-page', // Default Jake Gutierrez LaTeX template for B.Tech / Engineering students
    },
    latexCode: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);
