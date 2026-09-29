const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail,reactivateIfSuspensionExpired  } = require('../models/user.model');
const PUBLIC_REGISTRATION_ROLES = ['student', 'teacher'];

const TEACHER_SIGNUP_REQUIRED = ['qualification', 'institution', 'currentLevel', 'major', 'experienceYears', 'gender', 'phone', 'district', 'area'];
const STUDENT_SIGNUP_REQUIRED = ['educationLevel', 'institution', 'medium', 'phone', 'district', 'area'];

async function register(req, res) {
  try {
    const { fullName, email, password, role, ...profileFields } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!PUBLIC_REGISTRATION_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Role must be student or teacher.' });
    }

    // FIXED: signup now collects most of the profile up front (per
    // request), instead of leaving it entirely to a later "complete
    // your profile" step. Required fields differ by role.
    const requiredFields = role === 'teacher' ? TEACHER_SIGNUP_REQUIRED : STUDENT_SIGNUP_REQUIRED;
    const missing = requiredFields.filter((f) => profileFields[f] === undefined || profileFields[f] === '');
    if (missing.length) {
      return res.status(400).json({ error: `Please fill in: ${missing.join(', ')}` });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'This email is already registered.' });
    }
    const accountStatus = role === 'teacher' ? 'pending' : 'active';

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await createUser({ fullName, email, passwordHash, role, accountStatus, profileFields });

    const message = role === 'teacher'
      ? 'Registration successful. Your teacher account is awaiting admin approval before you can log in.'
      : 'Registration successful';

    res.status(201).json({ message, user: newUser });
  } catch (err) {
    if (err.code === '23514') {
      return res.status(400).json({ error: 'One of the values you entered violates a business rule (phone must be exactly 11 digits, gender must be male or female, experience cannot be negative).' });
    }
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
   if (user.account_status === 'suspended') {
      const reactivated = await reactivateIfSuspensionExpired(user.user_id);
      if (reactivated) {
        user.account_status = 'active';
        user.suspended_until = null;
      }
    }
    if (user.account_status !== 'active') {
      const statusMessages = {
        pending: 'Your teacher account is still awaiting admin approval.',
        rejected: 'Your teacher application was not approved. Contact support for details.',
        suspended: 'Your account has been suspended. Contact support for details.',
      };
      return res.status(403).json({
        error: statusMessages[user.account_status] || 'This account cannot log in right now.',
      });
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

module.exports = { register, login };