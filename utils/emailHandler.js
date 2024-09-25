const mailer = require('nodemailer');

const sendEmail = async options => {
  // 1. create transporter
  const transporter = mailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: '2200e684502402',
      pass: '16c61b116ade2e'
    }
  });

  // 2. define mail options
  const mailOptions = {
    from: '"Natours.io" <hello@natours.io>',
    to: options.email,
    subject: options.subject,
    text: options.text
    // html: options.html // Uncomment if you want to send HTML emails
  };

  // 3. send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
