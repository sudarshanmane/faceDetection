// first create environment for the application and then start the app
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const app = require('./app');

const port = process.env.PORT;

require('./mongooseConnection');

app.listen(port, () => {
  console.log(
    `Server started on port ${port} ----------------------------------------------`
  );
});
