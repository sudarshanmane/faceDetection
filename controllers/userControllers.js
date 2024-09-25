const fs = require('fs');
const APIFeatures = require('../utils/apiFeatures');
const UserModel = require('../modules/userModule');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const tours = JSON.parse(fs.readFileSync('./data.json', 'utf-8'));

const filterObj = (obj, ...allowedFields) => {
  const filteredObj = {};

  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) {
      filteredObj[el] = obj[el];
    }
  });

  return filteredObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  const body = { ...req.body };

  // 1. create error if the user creates POSTs password data
  if (body.password || body.passwordConfirm) {
    return next(
      new AppError(
        'This route not for password update! Please user /updatePassword',
        400
      )
    );
  }

  if (!body.id) {
    return next(
      new AppError('User Id is required to update the password!', 400)
    );
  }

  const filteredBody = filterObj(req.body, 'name', 'email');

  const updatedUser = await UserModel.findByIdAndUpdate(
    req.body.id,
    filteredBody,
    {
      new: true, // so that it returns the new updated object instead of old one
      runValidators: true // so that is can run only validator function not the schema required ones
    }
  ).select('-__v -createdAt');

  res.status(200).json({
    status: 'success',
    message: 'Successfully Updated!',
    data: {
      updatedUser
    }
  });
});

// but still the user can access the whole details even after deactivating
exports.deleteMe = catchAsync(async (req, res, next) => {
  await UserModel.findByIdAndUpdate(req.body.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.createUser = factory.createOne(UserModel);
exports.getAllUsers = factory.getAll(UserModel);
exports.getUserById = factory.getOne(UserModel);
exports.deleteUser = factory.deleteOne(UserModel);
