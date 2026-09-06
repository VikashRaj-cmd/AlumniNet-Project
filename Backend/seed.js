require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  batch: String,
  department: String,
  company: String,
  designation: String,
  linkedin: String,
  skills: [String]
}, { timestamps: true });

const eventSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: Date,
  location: String,
  registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const internshipSchema = new mongoose.Schema({
  title: String,
  company: String,
  description: String,
  location: String,
  type: String,
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const mentorSchema = new mongoose.Schema({
  name: String,
  designation: String,
  company: String,
  batch: String,
  expertise: [String],
  experience: String,
  sessions: Number,
  rating: Number,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Event = mongoose.model('Event', eventSchema);
const Internship = mongoose.model('Internship', internshipSchema);
const Mentor = mongoose.model('Mentor', mentorSchema);

// Sample Data
const sampleUsers = [
  {
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    password: 'password123',
    role: 'alumni',
    batch: '2020',
    department: 'Computer Science',
    company: 'Google',
    designation: 'Software Engineer',
    linkedin: 'https://linkedin.com/in/rahulsharma',
    skills: ['React', 'Node.js', 'Python', 'ML']
  },
  {
    name: 'Sneha Patel',
    email: 'sneha@example.com',
    password: 'password123',
    role: 'alumni',
    batch: '2019',
    department: 'Information Technology',
    company: 'Microsoft',
    designation: 'Product Manager',
    linkedin: 'https://linkedin.com/in/snehapatel',
    skills: ['Agile', 'UX', 'Data Analytics']
  },
  {
    name: 'Amit Kumar',
    email: 'amit@example.com',
    password: 'password123',
    role: 'alumni',
    batch: '2021',
    department: 'Electronics',
    company: 'Amazon',
    designation: 'SDE II',
    linkedin: 'https://linkedin.com/in/amitkumar',
    skills: ['Java', 'AWS', 'System Design']
  },
  {
    name: 'Neha Gupta',
    email: 'neha@example.com',
    password: 'password123',
    role: 'alumni',
    batch: '2018',
    department: 'Computer Science',
    company: 'Flipkart',
    designation: 'Tech Lead',
    linkedin: 'https://linkedin.com/in/nehagupta',
    skills: ['React', 'Go', 'Kubernetes']
  },
  {
    name: 'Vikram Singh',
    email: 'vikram@example.com',
    password: 'password123',
    role: 'alumni',
    batch: '2020',
    department: 'Mechanical',
    company: 'Tata Motors',
    designation: 'Design Engineer',
    linkedin: 'https://linkedin.com/in/vikramsingh',
    skills: ['AutoCAD', 'SolidWorks', 'MATLAB']
  },
  {
    name: 'Anjali Verma',
    email: 'anjali@example.com',
    password: 'password123',
    role: 'alumni',
    batch: '2022',
    department: 'Civil',
    company: 'L&T',
    designation: 'Site Engineer',
    linkedin: 'https://linkedin.com/in/anjaliverma',
    skills: ['STAAD Pro', 'Revit', 'Project Management']
  }
];

const sampleEvents = [
  {
    title: 'Annual Alumni Meet 2026',
    description: 'Join us for the grand alumni reunion! Network with fellow graduates, share experiences, and relive college memories.',
    date: new Date('2026-04-15'),
    location: 'Main Auditorium',
    registeredUsers: []
  },
  {
    title: 'Tech Talk: AI in 2026',
    description: 'A seminar on the latest trends in Artificial Intelligence by our distinguished alumni from Google and Microsoft.',
    date: new Date('2026-03-20'),
    location: 'Seminar Hall B',
    registeredUsers: []
  },
  {
    title: 'Career Guidance Workshop',
    description: 'Interactive workshop for final year students. Get insights on placements, higher education, and entrepreneurship.',
    date: new Date('2026-03-25'),
    location: 'Conference Room A',
    registeredUsers: []
  },
  {
    title: 'Startup Pitch Day',
    description: 'Alumni entrepreneurs share their startup journey and provide mentorship to aspiring student entrepreneurs.',
    date: new Date('2026-04-10'),
    location: 'Innovation Hub',
    registeredUsers: []
  }
];

const sampleMentors = [
  {
    name: 'Dr. Rajesh Kumar',
    designation: 'Senior Software Engineer',
    company: 'Google',
    batch: '2015',
    expertise: ['Web Development', 'Cloud Computing', 'System Design'],
    experience: '8 years',
    sessions: 45,
    rating: 4.9
  },
  {
    name: 'Priya Sharma',
    designation: 'Product Manager',
    company: 'Microsoft',
    batch: '2016',
    expertise: ['Product Management', 'Agile', 'Leadership'],
    experience: '7 years',
    sessions: 38,
    rating: 4.8
  },
  {
    name: 'Amit Patel',
    designation: 'Data Scientist',
    company: 'Amazon',
    batch: '2017',
    expertise: ['Machine Learning', 'Python', 'Data Analysis'],
    experience: '6 years',
    sessions: 52,
    rating: 4.9
  },
  {
    name: 'Sneha Reddy',
    designation: 'Full Stack Developer',
    company: 'Flipkart',
    batch: '2018',
    expertise: ['React', 'Node.js', 'MongoDB'],
    experience: '5 years',
    sessions: 29,
    rating: 4.7
  }
];

const sampleJobs = [
  {
    title: 'Frontend Developer',
    company: 'Google',
    description: 'Join our team to build next-gen web applications using React, TypeScript, and modern tooling.',
    location: 'Bangalore',
    type: 'job',
    applicants: []
  },
  {
    title: 'Data Analyst Intern',
    company: 'Microsoft',
    description: 'Work with large datasets, create dashboards, and derive actionable insights for product teams.',
    location: 'Hyderabad',
    type: 'internship',
    applicants: []
  },
  {
    title: 'Backend Engineer',
    company: 'Amazon',
    description: 'Design and implement scalable microservices using Node.js, AWS, and distributed systems.',
    location: 'Remote',
    type: 'job',
    applicants: []
  },
  {
    title: 'Product Management Intern',
    company: 'Flipkart',
    description: 'Work closely with engineering and design teams to build customer-centric products.',
    location: 'Bangalore',
    type: 'internship',
    applicants: []
  },
  {
    title: 'Full Stack Developer',
    company: 'Tata Consultancy Services',
    description: 'Develop end-to-end web applications using MERN stack for enterprise clients.',
    location: 'Mumbai',
    type: 'job',
    applicants: []
  }
];

// Seed function
async function seedDatabase() {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Event.deleteMany({});
    await Internship.deleteMany({});
    await Mentor.deleteMany({});
    console.log('Cleared existing data');

    // Hash passwords and create users
    const usersWithHashedPasswords = await Promise.all(
      sampleUsers.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10)
      }))
    );

    const createdUsers = await User.insertMany(usersWithHashedPasswords);
    console.log(`Created ${createdUsers.length} users`);

    // Create events
    const createdEvents = await Event.insertMany(sampleEvents);
    console.log(`Created ${createdEvents.length} events`);

    // Create jobs
    const createdJobs = await Internship.insertMany(sampleJobs);
    console.log(`Created ${createdJobs.length} jobs`);

    const createdMentors = await Mentor.insertMany(sampleMentors);
    console.log(`Created ${createdMentors.length} mentors`);

    console.log('\nDatabase seeded successfully!');
    console.log('\nSample Login Credentials:');
    console.log('Email: rahul@example.com');
    console.log('Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
