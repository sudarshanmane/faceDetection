const mongoose = require('mongoose');

const url = process.env.DATABASE_LOCAL;

const connection = mongoose
  .connect(url)
  .then(() => {})
  .catch(() => {});

module.exports = connection;
