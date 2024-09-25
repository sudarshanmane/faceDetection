const catchAsync = require('../utils/catchAsync');
const reviewsModel = require('../modules/reviewModel');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  req.body.tour = req.params.tourId;
  req.body.user = req.params.userId;
  next();
};

exports.getAllReviewsByTourId = (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };
  req.filter = filter;
  next();
};

exports.getAllReview = factory.getAll(reviewsModel, {
  path: 'tour',
  select: 'name'
});

exports.getReview = factory.getOne(reviewsModel, [{ path: 'tour' }]);
exports.createReview = factory.createOne(reviewsModel);
exports.updateReview = factory.updateOne(reviewsModel);
exports.deleteReview = factory.deleteOne(reviewsModel);
