const express = require('express');

const userControllers = require('./../controllers/userControllers');
const authController = require('../controllers/authController');

const userRouter = express.Router();
// different controller different route

// userRouter.route('/signup').post(authController.signup);

userRouter.route('/signup').post(authController.signup);
userRouter.route('/login').post(authController.login);

userRouter.route('/forgotPassword').post(authController.forgotPassword);
userRouter.route('/resetPassword/:token').patch(authController.resetPassword); // will receive the token as well as token

// protects all routes below this
userRouter.use(authController.protect);

// protect for user can only update the password if the user is authenticated
userRouter.patch('/updatePassword/:id', authController.updatePassword);

userRouter.patch('/updateCurrentUserData', userControllers.updateMe);
userRouter.delete('/deleteMe', userControllers.deleteMe);

// only admin can access
userRouter.use(authController.restrictTo('admin'));

userRouter
  .route('/')
  .get(userControllers.getAllUsers)
  .post(userControllers.createUser);

userRouter
  .route('/:id')
  .delete(userControllers.deleteUser)
  .get(userControllers.getUserById);

// userRouter.route('/:id');

module.exports = userRouter;
