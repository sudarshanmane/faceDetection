const express = require('express');
const tourController = require('./../controllers/tourControllers');
const authController = require('../controllers/authController');

const tourRouter = express.Router(); // Remove the duplicate declaration

tourRouter
  .route('/top-5-cheap')
  .get(tourController.top5Cheap, tourController.getAllTours);

tourRouter.route('/tour-stats').get(tourController.getToursStats);
tourRouter.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

tourRouter
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

tourRouter
  .route('/:id')
  .get(tourController.getTourById)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = tourRouter;
