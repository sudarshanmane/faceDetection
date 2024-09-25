const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewsSchema = mongoose.Schema(
  {
    review: {
      type: String,
      trim: true,
      required: [true, 'Review can not be empty.']
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be maximum 5']
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour'
      // require: [true, 'A review must belong to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
      // required: [true, 'Review must belong to a user!']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true } // check why
  }
);

reviewsSchema.pre(/^find/, function(next) {
  this.populate([
    { path: 'user', select: 'name' }
    // { path: 'tour', select: 'name photo' }
  ]);

  next();
});

reviewsSchema.statics.calAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } }, // find all reviews which has tour field and which is equal to as tourID
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' } // to find average of ratings $avg :'$rating' field from schema
      }
    }
  ]);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats[0].avgRating,
    ratingsQuantity: stats[0].nRating
  });
};

// use post --> after saving the current review into the database the caLAverageRatings will get the tourId from database
reviewsSchema.post('save', function() {
  // this points to current review
  this.constructor.calAverageRatings(this.tour);
});

// for update and delete review set the ratingAverage of the Tour
// reviewsSchema.pre(/^findOneAnd/, async function(next) {
//   this.r = await this.model.findOne(this.getQuery());
//   next();
// });
// cause we can not use findOne() after the query has executed

reviewsSchema.post(/^findOneAnd/, async function(doc, next) {
  if (doc) {
    doc.constructor.calAverageRatings(doc.tour);
  }
  next();
});

const reviewsModel = mongoose.model('Review', reviewsSchema);
module.exports = reviewsModel;
