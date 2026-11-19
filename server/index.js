import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';

const app = express();
const port = process.env.PORT || 4000;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseAuth = process.env.SUPABASE_URL && supabasePublishableKey
  ? createClient(process.env.SUPABASE_URL, supabasePublishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  : null;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '20kb' }));

const healthSchema = new mongoose.Schema({
  bloodType: { type: String, default: '' },
  allergies: { type: String, default: '' },
  medications: { type: String, default: '' },
  conditions: { type: String, default: '' },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  supabaseId: { type: String, unique: true, sparse: true },
  passwordHash: { type: String, select: false },
  googleId: { type: String, sparse: true },
  phone: { type: String, default: '' },
  healthInfo: { type: healthSchema, default: () => ({}) },
  notifications: { type: [String], default: ['Your health profile is ready. Add a few details to help your care team.'] },
  resetTokenHash: String,
  resetTokenExpires: Date,
}, { timestamps: true });

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  service: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  doctor: { type: String, default: 'Care team' },
  status: { type: String, enum: ['Confirmed', 'Pending', 'Completed'], default: 'Confirmed' },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  healthInfo: user.healthInfo || {},
  notifications: user.notifications || [],
});

function ensureDatabase(_req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'The service is temporarily unavailable. Please try again shortly.' });
  }
  next();
}

function createToken(userId) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.sign({ sub: userId.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token || !process.env.JWT_SECRET) return res.status(401).json({ message: 'Please sign in to continue.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(payload.sub);
    if (!req.user) return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    next();
  } catch {
    res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.post('/api/auth/supabase', authLimiter, ensureDatabase, async (req, res) => {
  if (!supabaseAuth) return res.status(503).json({ message: 'Supabase authentication is not configured.' });
  const accessToken = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!accessToken) return res.status(401).json({ message: 'A Supabase access token is required.' });

  const { data, error } = await supabaseAuth.auth.getUser(accessToken);
  const authUser = data?.user;
  if (error || !authUser?.email) return res.status(401).json({ message: 'The Supabase session could not be verified.' });
  if (!authUser.email_confirmed_at) return res.status(403).json({ message: 'Confirm your email address before continuing.' });

  const email = authUser.email.trim().toLowerCase();
  let user = await User.findOne({ supabaseId: authUser.id });
  if (!user) {
    user = await User.findOne({ email });
    if (user?.supabaseId && user.supabaseId !== authUser.id) {
      return res.status(409).json({ message: 'This email is already linked to another sign-in method.' });
    }
    if (!user) {
      const name = String(authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split('@')[0]).trim().slice(0, 80);
      user = await User.create({ name: name || 'HealthCare member', email, supabaseId: authUser.id });
    } else {
      user.supabaseId = authUser.id;
      await user.save();
    }
  }

  res.json({ token: createToken(user._id), user: safeUser(user) });
});

app.post('/api/auth/register', authLimiter, ensureDatabase, async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!name || name.length > 80 || !emailPattern.test(email) || password.length < 8) {
    return res.status(400).json({ message: 'Enter your name, a valid email and a password of at least 8 characters.' });
  }
  try {
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: createToken(user._id), user: safeUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with that email already exists.' });
    throw error;
  }
});

app.post('/api/auth/login', authLimiter, ensureDatabase, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user?.passwordHash || !await bcrypt.compare(password, user.passwordHash)) {
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }
  res.json({ token: createToken(user._id), user: safeUser(user) });
});

app.post('/api/auth/google', authLimiter, ensureDatabase, async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ message: 'Google sign-in is not configured yet.' });
  const credential = String(req.body.credential || '');
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const profile = ticket.getPayload();
    if (!profile?.email || !profile.email_verified) return res.status(401).json({ message: 'Google could not verify this email address.' });
    let user = await User.findOne({ $or: [{ googleId: profile.sub }, { email: profile.email.toLowerCase() }] });
    if (!user) {
      user = await User.create({ name: profile.name || 'HealthCare member', email: profile.email, googleId: profile.sub });
    } else if (!user.googleId) {
      user.googleId = profile.sub;
      await user.save();
    }
    res.json({ token: createToken(user._id), user: safeUser(user) });
  } catch (error) {
    if (error.status) return res.status(401).json({ message: 'Google sign-in could not be verified.' });
    throw error;
  }
});

app.post('/api/auth/forgot-password', authLimiter, ensureDatabase, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = emailPattern.test(email) ? await User.findOne({ email }) : null;
  if (user) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/?reset=${resetToken}`;
      await transporter.sendMail({
        from: process.env.MAIL_FROM || 'HealthCare <no-reply@example.com>',
        to: user.email,
        subject: 'Reset your HealthCare password',
        text: `Use this link within one hour to reset your password: ${link}`,
      });
    } else {
      console.warn('Password reset requested but SMTP is not configured.');
    }
  }
  res.json({ message: 'If an account exists for that email, password reset instructions are on their way.' });
});

app.post('/api/auth/reset-password', authLimiter, ensureDatabase, async (req, res) => {
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');
  if (password.length < 8) return res.status(400).json({ message: 'Choose a password with at least 8 characters.' });
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({ resetTokenHash: tokenHash, resetTokenExpires: { $gt: new Date() } }).select('+passwordHash');
  if (!user) return res.status(400).json({ message: 'This reset link is invalid or has expired.' });
  user.passwordHash = await bcrypt.hash(password, 12);
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  await user.save();
  res.json({ message: 'Your password has been updated. You can now sign in.' });
});

app.get('/api/dashboard', ensureDatabase, authenticate, async (req, res) => {
  const appointments = await Appointment.find({ userId: req.user._id }).sort({ date: 1 }).limit(20);
  res.json({ user: safeUser(req.user), appointments });
});

app.patch('/api/profile', ensureDatabase, authenticate, async (req, res) => {
  const name = String(req.body.name || '').trim();
  const phone = String(req.body.phone || '').trim();
  if (!name || name.length > 80 || phone.length > 30) return res.status(400).json({ message: 'Please check your name and phone number.' });
  req.user.name = name;
  req.user.phone = phone;
  await req.user.save();
  res.json({ user: safeUser(req.user) });
});

app.patch('/api/health-info', ensureDatabase, authenticate, async (req, res) => {
  const fields = ['bloodType', 'allergies', 'medications', 'conditions'];
  const nextInfo = {};
  for (const field of fields) nextInfo[field] = String(req.body[field] || '').trim().slice(0, 500);
  req.user.healthInfo = nextInfo;
  await req.user.save();
  res.json({ user: safeUser(req.user) });
});

app.post('/api/appointments', ensureDatabase, authenticate, async (req, res) => {
  const service = String(req.body.service || '').trim();
  const date = new Date(req.body.date);
  const time = String(req.body.time || '').trim();
  if (!service || service.length > 80 || Number.isNaN(date.getTime()) || date <= new Date() || !/^\d{2}:\d{2}$/.test(time)) {
    return res.status(400).json({ message: 'Choose a service and a valid future date and time.' });
  }
  const appointment = await Appointment.create({ userId: req.user._id, service, date, time });
  res.status(201).json({ appointment });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('Connected to MongoDB Atlas.');
  }).catch((error) => {
    console.error('MongoDB connection failed:', error.message);
  });
} else {
  console.warn('MONGODB_URI is not configured; API data endpoints are unavailable.');
}

app.listen(port, () => console.log(`HealthCare API listening on http://localhost:${port}`));
