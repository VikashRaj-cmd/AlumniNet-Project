const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/errorMiddleware');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../config/mail');

// Generate short-lived access token (15 minutes)
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
  });
};

// Generate refresh token and save to DB
const generateRefreshToken = async (userId, ipAddress) => {
  const token = RefreshToken.generateToken();
  const expiresAt = new Date(
    Date.now() + (parseInt(process.env.JWT_REFRESH_DAYS) || 7) * 24 * 60 * 60 * 1000
  );
  await RefreshToken.create({ token, user: userId, expiresAt, createdByIp: ipAddress });
  return token;
};

// Set refresh token as httpOnly cookie
const setRefreshCookie = (res, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: (parseInt(process.env.JWT_REFRESH_DAYS) || 7) * 24 * 60 * 60 * 1000,
  };
  res.cookie('refreshToken', refreshToken, cookieOptions);
};

// Format user response
const formatUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  batch: user.batch,
  company: user.company,
  designation: user.designation,
  profileImage: user.profileImage,
});

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, batch, department } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new AppError('User already exists with this email.', 400));
    }

    const user = await User.create({ name, email, password, role, batch, department });
    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id, req.ip);
    setRefreshCookie(res, refreshToken);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user).catch((err) =>
      console.error('Welcome email failed:', err.message)
    );

    res.status(201).json({ ...formatUserResponse(user), token: accessToken });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id, req.ip);
    setRefreshCookie(res, refreshToken);

    res.json({ ...formatUserResponse(user), token: accessToken });
  } catch (error) {
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return next(new AppError('No refresh token provided.', 401));
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken || !storedToken.isActive()) {
      return next(new AppError('Invalid or expired refresh token. Please log in again.', 401));
    }

    const accessToken = generateAccessToken(storedToken.user);
    const newRefreshToken = await generateRefreshToken(storedToken.user, req.ip);
    storedToken.isRevoked = true;
    await storedToken.save();

    setRefreshCookie(res, newRefreshToken);
    res.json({ token: accessToken });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await RefreshToken.findOneAndUpdate({ token: refreshToken }, { isRevoked: true });
    }

    // Blacklist access token in Redis if provided
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      if (token) {
        const { blacklistToken } = require('../config/redis');
        await blacklistToken(token, 900); // 15 min TTL matching access token lifespan
      }
    }

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -resetPasswordToken -resetPasswordExpire');
    if (!user) return next(new AppError('User not found.', 404));
    res.json(formatUserResponse(user));
  } catch (error) {
    next(error);
  }
};

// Forgot password — generate reset token and send email
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    // Always return success to prevent email enumeration attacks
    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate a secure random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the token before storing
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Store in DB
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // Store in Redis with 15 min TTL (900 seconds)
    const { setOtp } = require('../config/redis');
    await setOtp(`reset:${hashedToken}`, user._id.toString(), 900);

    // Send reset email with plain token (not hashed)
    await sendPasswordResetEmail(user, resetToken);

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

// Reset password — verify token and update password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return next(new AppError('Password must be at least 6 characters.', 400));
    }

    // Hash the incoming token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const { getOtp, deleteOtp } = require('../config/redis');
    const redisUserId = await getOtp(`reset:${hashedToken}`);

    let user;
    if (redisUserId) {
      user = await User.findById(redisUserId);
    } else {
      user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
      });
    }

    if (!user) {
      return next(new AppError('Password reset token is invalid or has expired.', 400));
    }

    // Update password and clear reset fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Clean up Redis token
    await deleteOtp(`reset:${hashedToken}`);

    // Issue new access token so user is logged in after reset
    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id, req.ip);
    setRefreshCookie(res, refreshToken);

    res.json({
      message: 'Password reset successful.',
      token: accessToken,
      ...formatUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};
