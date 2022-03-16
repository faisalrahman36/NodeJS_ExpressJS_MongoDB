const nodemailer = require("nodemailer");

module.exports=function sendEmail (email, subject, text) {
  try {

    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      service: process.env.SERVICE,
      port: 587,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });
    console.log("email transporter object",transporter)

    transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: subject,
      text: text,
    });
    console.log("email sent sucessfully");
  } catch (error) {
    console.log("email not sent");
    console.log(error);
  }
};

