const Certificate = require('../models/Certificate');
const AttendanceLog = require('../models/AttendanceLog');
const Feedback = require('../models/Feedback');
const Workshop = require('../models/Workshop');
const Student = require('../models/Student');
const { generateCertificatePDF } = require('../services/certificate.service');
const { generateCertId, generateCertHash } = require('../utils/hash.util');
const { sendSuccess, sendError } = require('../utils/response.util');

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/certificates/generate
// @desc    Generate certificate for student
// @access  Student only
// ─────────────────────────────────────────────────────────────────
const generateCertificate = async (req, res) => {
  try {
    const { workshop_id } = req.body;
    const studentId = req.user._id;

    if (!workshop_id) {
      return sendError(res, 400, 'workshop_id is required');
    }

    // ── Check attendance verified ──────────────────────────────
    const attendanceLog = await AttendanceLog.findOne({
      student_id: studentId,
      workshop_id
    });

    if (!attendanceLog || !attendanceLog.verified_status) {
      return sendError(res, 403, 'Certificate requires verified attendance');
    }

    // ── Check feedback submitted ───────────────────────────────
    const feedback = await Feedback.findOne({
      student_id: studentId,
      workshop_id
    });

    if (!feedback) {
      return sendError(res, 403, 'Please submit feedback before downloading your certificate');
    }

    // ── Check if certificate already exists ────────────────────
    const existing = await Certificate.findOne({
      student_id: studentId,
      workshop_id
    });

    if (existing) {
      return sendSuccess(res, 200, 'Certificate already generated', {
        certificate_id: existing.certificate_id,
        download_url: existing.file_path,
        already_exists: true
      });
    }

    // ── Fetch workshop and student details ─────────────────────
    const workshop = await Workshop.findById(workshop_id);
    const student = await Student.findById(studentId);

    if (!workshop || !student) {
      return sendError(res, 404, 'Workshop or student not found');
    }

    // ── Generate IDs ───────────────────────────────────────────
    const issuedAt = new Date().toISOString();
    const certificateId = generateCertId();
    const verificationHash = generateCertHash(
      studentId.toString(),
      workshop_id,
      issuedAt
    );

    const verifyURL = `${process.env.CLIENT_URL}/verify/${certificateId}`;

    // ── Generate PDF & upload to Cloudinary ───────────────────
    const { cloudinaryUrl, fileName } = await generateCertificatePDF({
      studentName: student.name,
      rollNumber: student.roll_number,
      workshopTitle: workshop.title,
      workshopTopic: workshop.topic,
      speaker: workshop.speaker,
      date: new Date(workshop.date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric'
      }),
      certificateId,
      verifyURL,
      department: student.department
    });

    // ── Save certificate record ────────────────────────────────
    await Certificate.create({
      certificate_id: certificateId,
      student_id: studentId,
      workshop_id,
      issue_date: new Date(issuedAt),
      verification_hash: verificationHash,
      file_path: cloudinaryUrl   // store Cloudinary URL in file_path field
    });

    return sendSuccess(res, 201, '🎉 Certificate generated successfully!', {
      certificate_id: certificateId,
      download_url: cloudinaryUrl,
      verification_hash: verificationHash,
      verify_url: verifyURL,
      issued_at: issuedAt
    });

  } catch (err) {
    console.error('[generateCertificate]', err.message);
    return sendError(res, 500, 'Failed to generate certificate');
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/certificates/download/:certificateId
// @desc    Redirect to Cloudinary PDF URL
// @access  Student only
// ─────────────────────────────────────────────────────────────────
const downloadCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      certificate_id: req.params.certificateId,
      student_id: req.user._id
    });

    if (!certificate) return sendError(res, 404, 'Certificate not found');
    if (!certificate.is_valid) return sendError(res, 400, 'Certificate invalidated');

    return sendSuccess(res, 200, 'Certificate URL', {
      download_url: certificate.file_path,
      certificate_id: certificate.certificate_id
    });

  } catch (err) {
    console.error('[downloadCertificate]', err.message);
    return sendError(res, 500, 'Failed to download certificate');
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/certificates/verify/:certificateId
// @desc    Public certificate verification
// @access  Public
// ─────────────────────────────────────────────────────────────────
const verifyCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      certificate_id: req.params.certificateId
    })
      .populate('student_id', 'name roll_number department year')
      .populate('workshop_id', 'title topic speaker date workshop_id');

    if (!certificate) {
      return sendError(res, 404, 'Certificate not found or invalid ID');
    }

    if (!certificate.is_valid) {
      return sendError(res, 400, 'This certificate has been revoked');
    }

    return sendSuccess(res, 200, '✅ Certificate is valid', {
      certificate_id: certificate.certificate_id,
      student: {
        name: certificate.student_id.name,
        roll_number: certificate.student_id.roll_number,
        department: certificate.student_id.department,
        year: certificate.student_id.year
      },
      workshop: {
        title: certificate.workshop_id.title,
        topic: certificate.workshop_id.topic,
        speaker: certificate.workshop_id.speaker,
        date: certificate.workshop_id.date,
        workshop_id: certificate.workshop_id.workshop_id
      },
      issued_on: certificate.issue_date,
      status: '✅ VALID'
    });

  } catch (err) {
    console.error('[verifyCertificate]', err.message);
    return sendError(res, 500, 'Verification failed');
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/certificates/my
// @desc    Student views all their certificates
// @access  Student only
// ─────────────────────────────────────────────────────────────────
const getMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({
      student_id: req.user._id
    }).populate('workshop_id', 'title date workshop_id topic');

    return sendSuccess(res, 200, 'Your certificates', {
      total: certificates.length,
      certificates
    });

  } catch (err) {
    console.error('[getMyCertificates]', err.message);
    return sendError(res, 500, 'Failed to fetch certificates');
  }
};

module.exports = {
  generateCertificate,
  downloadCertificate,
  verifyCertificate,
  getMyCertificates
};