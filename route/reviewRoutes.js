const express = require('express');
const reviewController = require('../controllers/reviewControler');
const authController = require('../controllers/authController');

const reviewRouter = express.Router();

reviewRouter.use(authController.protect);

reviewRouter.post(
  '/:tourId/:userId',
  reviewController.setTourUserIds,
  reviewController.createReview
);

reviewRouter.get('/', reviewController.getAllReview);

reviewRouter
  .route('/:id')
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  )
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .get(authController.restrictTo('user', 'admin'), reviewController.getReview);
module.exports = reviewRouter;
