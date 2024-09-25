const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const record = await Model.findByIdAndDelete(req.params.id);

    if (!record) {
      return next(
        new AppError(`No document found with ID ${req.params.id}.`, 404)
      );
    }

    res.status(204).json({ status: 'success', data: null });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true // to use schema validator FUNCTION WITHIN THE SCHEMA while updating the records
    });

    if (!doc) {
      return next(
        new AppError(`No document found with ID ${req.params.id}.`, 404)
      );
    }

    res.status(201).json({
      status: 'success',
      data: {
        updatedTour: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res) => {
    const doc = await Model.create(req.body);

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(
        new AppError(`No document found with ID ${req.params.id}.`, 404)
      );
    }

    res.status(200).json({ status: 'success', data: { data: doc } });
  });

exports.getAll = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let filterOptions = {};
    if (req.params.tourId) filterOptions = { tour: req.params.tourId };

    let modelQuery = Model.find(filterOptions);

    if (popOptions) {
      modelQuery = modelQuery.populate({ ...popOptions });
    }

    const apiFeatures = new APIFeatures(modelQuery, req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();

    const result = await apiFeatures.query;

    res.status(200).json({
      status: 'success',
      results: result.length,
      data: { tours: result }
    });
  });
