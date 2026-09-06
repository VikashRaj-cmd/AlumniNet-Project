const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'alumni', 'admin'], required: true },
  batch: { type: String, required: true },
  department: { type: String, required: true },
  course: { type: String },
  phone: { type: String },
  company: { type: String },
  designation: { type: String },
  linkedin: { type: String },
  github: { type: String },
  portfolio: { type: String },
  socialMedia: { type: String },
  resume: {
    careerObjective: { type: String },
    education: { type: String },
    projects: { type: String },
    technicalSkills: { type: String },
    softSkills: { type: String }
  },
  skills: [String],
  profileImage: { type: String, default: '' },
  resetPasswordToken: { type: String, default: undefined },
  resetPasswordExpire: { type: Date, default: undefined },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
