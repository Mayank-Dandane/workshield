require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./src/models/Student');
const Faculty = require('./src/models/Faculty');
const Workshop = require('./src/models/Workshop');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing
    await Student.deleteMany({});
    await Faculty.deleteMany({});
    await Workshop.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // ── Faculty ────────────────────────────────────────────────
    const superAdmin = await Faculty.create({
      name: 'Prof. Chandan M N',
      email: 'chandanmn@jspmrscoe.edu.in',
      password_hash: 'admin@123',
      department: 'Automation & Robotics',
      role: 'super_admin',
      is_active: true
    });

    const faculty1 = await Faculty.create({
      name: 'Dr. Rayappa Mahale',
      email: 'rayappa.mahale@jspmrscoe.edu.in',
      password_hash: 'faculty@123',
      department: 'Automation & Robotics',
      role: 'faculty',
      is_active: true
    });

    const faculty2 = await Faculty.create({
      name: 'Prof. Anand Shivashimpi',
      email: 'anand.shivashimpi@jspmrscoe.edu.in',
      password_hash: 'faculty@123',
      department: 'Automation & Robotics',
      role: 'faculty',
      is_active: true
    });

    console.log('✅ Faculty created:');
    console.log('   Super Admin:', superAdmin.email, '/ admin@123');
    console.log('   Faculty 1:', faculty1.email, '/ faculty@123');
    console.log('   Faculty 2:', faculty2.email, '/ faculty@123');

    // ── Students ───────────────────────────────────────────────
    const students = [
      {
        name: 'Mayank Dandane',
        roll_number: 'RBTL25AR079',
        email: 'mayankdandane@jspmrscoe.edu.in',
        password_hash: 'RBTL25AR079',
        year: 3,
        department: 'Automation & Robotics',
        dob: new Date('2002-05-15'),
        is_active: true
      },
      {
        name: 'Priya Desai',
        roll_number: 'AR2021002',
        email: 'priya.desai@jspmrscoe.edu.in',
        password_hash: 'AR2021002',
        year: 3,
        department: 'Automation & Robotics',
        dob: new Date('2002-08-22'),
        is_active: true
      },
      {
        name: 'Aman Verma',
        roll_number: 'AR2021003',
        email: 'aman.verma@jspmrscoe.edu.in',
        password_hash: 'AR2021003',
        year: 3,
        department: 'Automation & Robotics',
        dob: new Date('2002-03-10'),
        is_active: true
      },
      {
        name: 'Sneha Joshi',
        roll_number: 'AR2022001',
        email: 'sneha.joshi@jspmrscoe.edu.in',
        password_hash: 'AR2022001',
        year: 2,
        department: 'Automation & Robotics',
        dob: new Date('2003-11-05'),
        is_active: true
      },
      {
        name: 'Rohan Pawar',
        roll_number: 'AR2022002',
        email: 'rohan.pawar@jspmrscoe.edu.in',
        password_hash: 'AR2022002',
        year: 2,
        department: 'Automation & Robotics',
        dob: new Date('2003-07-18'),
        is_active: true
      }
    ];

    for (const s of students) {
      await Student.create(s);
    }

    console.log('✅ Students created:');
    students.forEach(s => {
      console.log(`   ${s.name} | ${s.roll_number} | ${s.email} | Password: ${s.roll_number}`);
    });

    // ── Demo Workshop ──────────────────────────────────────────
    const workshop = await Workshop.create({
      title: 'Industrial Automation & IoT',
      topic: 'PLC Programming and IoT Integration',
      speaker: 'Dr. Priya Menon',
      date: new Date('2026-03-08'),
      start_time: '10:00',
      end_time: '16:00',
      min_duration_minutes: 1,
      random_check_enabled: false,
      status: 'upcoming',
      created_by: faculty1._id
    });

    console.log('✅ Demo workshop created:', workshop.title, '|', workshop.workshop_id);

    console.log('\n🎉 Seed complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 LOGIN CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SUPER ADMIN:');
    console.log('  Email:    chandanmn@jspmrscoe.edu.in');
    console.log('  Password: admin@123');
    console.log('');
    console.log('FACULTY:');
    console.log('  Email:    rayappa.mahale@jspmrscoe.edu.in');
    console.log('  Password: faculty@123');
    console.log('');
    console.log('  Email:    anand.shivashimpi@jspmrscoe.edu.in');
    console.log('  Password: faculty@123');
    console.log('');
    console.log('STUDENTS (password = roll number):');
    students.forEach(s => {
      console.log(`  ${s.roll_number} | ${s.email}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

seed();