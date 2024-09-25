const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');

const User = require('../modules/userModule');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const userModel = require('../modules/userModule');
const sendEmail = require('../utils/emailHandler');

const signInToken = async id => {
  return await jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = async (user, statusCode, res) => {
  // 4. log user in, send JWT
  const token = await signInToken(user._id);

  user.password = undefined;

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure: true, // it will be only sent to the https
    httpOnly: true // cookie can not be accessed or modified by any way by the browser
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);
  res.status(200).json({
    status: 'success',
    token,
    message: 'Password Updated Successfully.',
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const body = { ...req.body };
  const newUser = await User.create({
    name: body.name,
    password: body.password,
    passwordConfirm: body.passwordConfirm,
    email: body.email,
    role: body.role,
    photo: body.photo,
    passwordChangedAt: body.passwordChangedAt
  });

  createSendToken(newUser, 200, res);

  // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN
  // });

  // res.status(200).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser
  //   }
  // });
});

const correctPassword = async (candidatePassword, userPassword) => {
  return bcrypt.compare(candidatePassword, userPassword);
};

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. check email and password exists or not
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // check if the user exists or not
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new AppError('Incorrect email address!', 400));
  }

  const isCorrect = await correctPassword(password, user.password);

  if (!isCorrect) {
    return next(new AppError('Wrong password!', 400));
  }

  const token = await signInToken(user._id);

  res.status(200).json({ status: 'success', token: token });
});

exports.protect = catchAsync(async (req, res, next) => {
  // getting the token and check if it is there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in, Please login.', 401));
  }
  // decode token with jwt
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // check if the user still exists
  const user = await userModel.findById(decoded.id);

  if (!user) {
    return next(
      new AppError('User belonging to this token no longer exists.', 400)
    );
  }

  // check if the password was changed after issuing the token
  const isUserPasswordChanged = await user.changePasswordAfter(decoded.iat);

  if (isUserPasswordChanged) {
    return next(
      new AppError('User Changed Password recently! Please Login Again.', 401)
    );
  }
  req.user = user;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. get user based on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new AppError('There is not user with that email address.', 400)
    );
  }

  // 2. generate random token
  const resetToken = user.createPasswordResetToken();
  const response = await user.save({ validateBeforeSave: true }); // to disable all required fields

  // 3. send it to the users email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Update here /n ${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token',
      text: message
    });
  } catch (error) {
    user.passwordResetToken = 'undefined';
    user.passwordResetExpires = 'undefined';
    await user.save({ validateBeforeSave: false });
    return next(new AppError('There was an error sending email!', 500));
  }

  res.status(200).json({
    status: 'success',
    message: 'Token sent to email!'
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. get the user token
  if (!req.params.token) {
    return next(new AppError('Please provide Token!', 400));
  }

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // check if the token has expired or not
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Token is invalid or Token has expired.', 400));
  }

  // update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  // set passwordResetExpires and passwordResetToken
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;

  const response = await user.save();

  res.status(200).json({
    status: 'success',
    token: signInToken(response._id),
    message: 'password changed successfully',
    data: {
      user
    }
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get User
  if (!req.params.id) {
    return next(
      new AppError('Please provide user ID to update password!', 400)
    );
  }

  if (req.body.newPassword !== req.body.newPasswordConfirm) {
    return next(new AppError('Please Confirm New Password!', 400));
  }

  const user = await User.findOne({
    _id: req.params.id
  }).select('+password');

  if (!user) {
    return next(new AppError('User dose not exists!', 400));
  }

  // 2 check if the POSTed password is correct
  const passCheck = await correctPassword(req.body.oldPassword, user.password);

  if (!passCheck) {
    return next(new AppError('old password incorrect!', 400));
  }

  // 3. if then update the password
  user.passwordConfirm = req.body.newPasswordConfirm;
  user.password = req.body.newPassword;

  const response = await user.save();
  createSendToken(response, 201, res);
});
