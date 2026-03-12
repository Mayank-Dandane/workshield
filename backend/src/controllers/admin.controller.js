const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const { sendSuccess, sendError } = require('../utils/response.util');

const DEPT = 'Automation and Robotics';
const COLLEGE_EMAIL_SUFFIX = '@jspmrscoe.edu.in';
const isCollegeEmail = (email) => email.toLowerCase().endsWith(COLLEGE_EMAIL_SUFFIX);

const addStudent = async (req, res) => {
  try {
    let { roll_number, name, email, year } = req.body;
    if (!roll_number || !name || !email) return sendError(res, 400, 'roll_number, name and email are required');
    roll_number = roll_number.toUpperCase().trim();
    email = email.toLowerCase().trim();
    name = name.trim();
    if (!isCollegeEmail(email)) return sendError(res, 400, `Email must end with ${COLLEGE_EMAIL_SUFFIX}`);
    const existing = await Student.findOne({ $or: [{ email }, { roll_number }] });
    if (existing) return sendError(res, 409, 'Student with this email or roll number already exists');
    const student = new Student({ roll_number, name, email, year: year || 1, department: DEPT, password_hash: roll_number, dob: new Date('2000-01-01'), is_active: true });
    await student.save();
    return sendSuccess(res, 201, 'Student registered successfully', { student: { id: student._id, roll_number, name, email, year: student.year } });
  } catch (err) { return sendError(res, 500, 'Failed to add student'); }
};

const bulkAddStudents = async (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) return sendError(res, 400, 'Provide a non-empty students array');
    const results = { added: [], skipped: [], errors: [] };
    for (const s of students) {
      try {
        const roll_number = (s.roll_number || '').toUpperCase().trim();
        const email = (s.email || '').toLowerCase().trim();
        const name = (s.name || '').trim();
        const year = s.year || 1;
        if (!roll_number || !name || !email) { results.errors.push({ row: s, reason: 'Missing required fields' }); continue; }
        if (!isCollegeEmail(email)) { results.errors.push({ row: s, reason: `Email must end with ${COLLEGE_EMAIL_SUFFIX}` }); continue; }
        const existing = await Student.findOne({ $or: [{ email }, { roll_number }] });
        if (existing) { results.skipped.push({ roll_number, reason: 'Already exists' }); continue; }
        const student = new Student({ roll_number, name, email, year, department: DEPT, password_hash: roll_number, dob: new Date('2000-01-01'), is_active: true });
        await student.save();
        results.added.push({ roll_number, name, email });
      } catch (err) { results.errors.push({ row: s, reason: err.message }); }
    }
    return sendSuccess(res, 200, 'Bulk import complete', results);
  } catch (err) { return sendError(res, 500, 'Bulk import failed'); }
};

const addFaculty = async (req, res) => {
  try {
    let { name, email, password } = req.body;
    if (!name || !email || !password) return sendError(res, 400, 'name, email and password are required');
    email = email.toLowerCase().trim();
    name = name.trim();
    if (!isCollegeEmail(email)) return sendError(res, 400, `Email must end with ${COLLEGE_EMAIL_SUFFIX}`);
    const existing = await Faculty.findOne({ email });
    if (existing) return sendError(res, 409, 'Faculty with this email already exists');
    const faculty = new Faculty({ name, email, password_hash: password, department: DEPT, role: 'faculty', is_active: true });
    await faculty.save();
    return sendSuccess(res, 201, 'Faculty registered successfully', { faculty: { id: faculty._id, name, email } });
  } catch (err) { return sendError(res, 500, 'Failed to add faculty'); }
};

const bulkAddFaculty = async (req, res) => {
  try {
    const { faculty: list } = req.body;
    if (!Array.isArray(list) || list.length === 0) return sendError(res, 400, 'Provide a non-empty faculty array');
    const results = { added: [], skipped: [], errors: [] };
    for (const f of list) {
      try {
        const email = (f.email || '').toLowerCase().trim();
        const name = (f.name || '').trim();
        const password = (f.password || '').trim();
        if (!name || !email || !password) { results.errors.push({ row: f, reason: 'Missing required fields' }); continue; }
        if (!isCollegeEmail(email)) { results.errors.push({ row: f, reason: `Email must end with ${COLLEGE_EMAIL_SUFFIX}` }); continue; }
        const existing = await Faculty.findOne({ email });
        if (existing) { results.skipped.push({ email, reason: 'Already exists' }); continue; }
        const faculty = new Faculty({ name, email, password_hash: password, department: DEPT, role: 'faculty', is_active: true });
        await faculty.save();
        results.added.push({ name, email });
      } catch (err) { results.errors.push({ row: f, reason: err.message }); }
    }
    return sendSuccess(res, 200, 'Bulk faculty import complete', results);
  } catch (err) { return sendError(res, 500, 'Bulk faculty import failed'); }
};

const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find({}, '-password_hash -dob').sort({ roll_number: 1 });
    return sendSuccess(res, 200, 'Students fetched', { students, total: students.length });
  } catch (err) { return sendError(res, 500, 'Failed to fetch students'); }
};

const getAllFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find({ role: 'faculty' }, '-password_hash').sort({ name: 1 });
    return sendSuccess(res, 200, 'Faculty fetched', { faculty, total: faculty.length });
  } catch (err) { return sendError(res, 500, 'Failed to fetch faculty'); }
};

const toggleStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return sendError(res, 404, 'Student not found');
    student.is_active = !student.is_active;
    await student.save();
    return sendSuccess(res, 200, `Student ${student.is_active ? 'activated' : 'deactivated'}`, { is_active: student.is_active });
  } catch (err) { return sendError(res, 500, 'Toggle failed'); }
};

const toggleFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return sendError(res, 404, 'Faculty not found');
    faculty.is_active = !faculty.is_active;
    await faculty.save();
    return sendSuccess(res, 200, `Faculty ${faculty.is_active ? 'activated' : 'deactivated'}`, { is_active: faculty.is_active });
  } catch (err) { return sendError(res, 500, 'Toggle failed'); }
};

const getStats = async (req, res) => {
  try {
    const [totalStudents, activeStudents, totalFaculty, activeFaculty] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ is_active: true }),
      Faculty.countDocuments({ role: 'faculty' }),
      Faculty.countDocuments({ role: 'faculty', is_active: true }),
    ]);
    return sendSuccess(res, 200, 'Stats fetched', { students: { total: totalStudents, active: activeStudents }, faculty: { total: totalFaculty, active: activeFaculty } });
  } catch (err) { return sendError(res, 500, 'Failed to fetch stats'); }
};

module.exports = { addStudent, bulkAddStudents, addFaculty, bulkAddFaculty, getAllStudents, getAllFaculty, toggleStudent, toggleFaculty, getStats };