
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail } = require('../models/user.model');

// Public registration may only ever create these two roles. 'admin' is
// intentionally excluded -- admin accounts are created directly in the
// database (see database/sample_data.sql), never through this endpoint.
// FIXED (Phase 2): previously `role` was taken from the request body with
// no restriction at all, so anyone could register as 'admin'.
const PUBLIC_REGISTRATION_ROLES = ['student', 'teacher'];

async function register(req, res) {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!PUBLIC_REGISTRATION_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Role must be student or teacher.' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'This email is already registered.' });
    }

    // Students can use the platform immediately. Teachers start pending
    // and only become able to log in once an admin approves them (see
    // database/functions.sql: approve_teacher / reject_teacher).
    const accountStatus = role === 'teacher' ? 'pending' : 'active';

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await createUser({ fullName, email, passwordHash, role, accountStatus });

    const message = role === 'teacher'
      ? 'Registration successful. Your teacher account is awaiting admin approval before you can log in.'
      : 'Registration successful';

    res.status(201).json({ message, user: newUser });
  } catch (err) {
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

    // Checked only after the password matches, so a wrong password always
    // looks identical whether the account is pending/rejected/suspended or
    // just doesn't exist -- login must not double as a way to probe an
    // account's status. Messages here stay generic on purpose (no admin
    // notes, no rejection/suspension reason) per "don't expose unnecessary
    // information about rejected/suspended accounts."
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