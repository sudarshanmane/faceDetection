const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a name'],
      unique: true
      // maxlength: [40, 'A tour name must have less or equal then 40 characters.'],
      // minlength: [
      //   40,
      //   'A tour name must have minimum or equal then 10 characters.'
      // ]
    },
    slug: String,
    duration: { type: Number, required: [true, 'A tour must have a duration'] },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Ratings must be at least 1'],
      max: [5, 'Ratings must be less that or equal to 5']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a difficulty.'],
      enum: {
        values: ['easy', 'medium', 'hard'],
        message: 'difficulty is either easy, medium or hard.'
      }
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number
      // validate: {
      //   validator: function(val) {
      //     return val < this.price; // for comparing two fields in schema
      //   },
      //   message: 'Discount price should be below the regular price'
      // }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary']
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a image cover']
    },
    image: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      Select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    // guides: { type: Array }  embedding the guides array with the tours
    // but this is not a safe to embed cause if the user updates email like fields then that details
    // wont appear in here

    // so go with the referencing
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true } // check why
  }
);

// compound two related or mostly queried together
tourSchema.index({ price: 1, ratingsAverage: 1 });
tourSchema.index({ slug: 1 });

// Document Middleware: runs before .save() and .create( )
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre('post', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides', // fields in the schema
    select: '-__v'
  });

  next();
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // The field in the Review model that refers to the Tour model
  localField: '_id' // The field in the Tour model that corresponds to the tour ID
});

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
