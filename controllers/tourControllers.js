const TourModel = require('../modules/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.aliasTopTour = catchAsync(async (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
});

exports.getToursStats = catchAsync(async (req, res) => {
  const stats = await TourModel.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, // group by difficulty
        num: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: {
        num: -1,
        _id: 1
      }
    }
  ]);

  res.status(200).json({ status: 'success', data: { stats } });
});

exports.top5Cheap = catchAsync(async (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-price,ratingsAverage';
  next();
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await TourModel.aggregate([
    {
      $unwind: '$startDates' // to make every result in array as a separate record
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tours: { $addToSet: '$name' } // to push unique names
      }
    },
    {
      $sort: { numTours: -1 }
    },
    {
      $addFields: { month: '$_id' } // add extra field in response
    },
    {
      $project: { _id: 0 } // to hide in response
    },
    {
      $limit: 6
    }
  ]);

  res.status(200).json({ status: 'success', data: plan });
});

exports.getAllTours = factory.getAll(TourModel);
exports.getTourById = factory.getOne(TourModel, { path: 'reviews' });
exports.createTour = factory.createOne(TourModel);
exports.updateTour = factory.updateOne(TourModel);
exports.deleteTour = factory.deleteOne(TourModel);
