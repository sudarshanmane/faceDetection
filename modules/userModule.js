const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: ['true', 'Please tell us your name.'],
      trim: true
    },
    email: {
      type: String,
      required: ['true', 'Please provide your email.'],
      unique: true,
      lowercase: true,
      validate: {
        validator: function(val) {
          return validator.isEmail(val);
        },
        message: 'Please provide a valid email.'
      }
    },
    photo: String,
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
      required: [true, 'Please select a role']
    },
    password: {
      type: String,
      required: [true, 'Password is a required field!'],
      minLength: [8, 'Password must have at least 8 characters'],
      select: false
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Password Confirm is a required Field!'],
      select: false,
      validate: {
        // this only works on save or create not while updating
        validator: function(val) {
          return val === this.password;
        },
        message: 'Password does not match.'
      }
    },
    active: { type: Boolean, default: true, select: false },
    createdAt: {
      type: Date,
      default: Date.now()
    },

    passwordChangedAt: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true } // check why
  }
);

userSchema.pre('save', async function(next) {
  // run only when the password was modified
  if (!this.isModified('password')) return next();

  // hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // delete the password confirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.correctPassword = async (
  candidatePassword,
  userPassword
) => {
  return bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function(JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimeStamp < changedTimestamp;
  }

  return false;
};

userSchema.pre('save', function(next) {
  if (this.isNew || !this.isModified('password')) {
    next();
  } else this.passwordChangedAt = Date.now();

  next();
});

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // and also userSchema.pre('Save') change the passwordChangedAt

  return resetToken;
};

userSchema.pre(/^find/, async function(next) {
  // change the whole query for just select result whose status is active
  this.find({ active: { $ne: false } });
  next();
});

const userModel = mongoose.model('User', userSchema);
module.exports = userModel;
