import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASS,
  },
});

const getHtmlTemplate = (otp: number) => {
  return `
  <div
  style="
    font-family: 'Segoe UI', Roboto, sans-serif;
    background-color: #1e1e2f;
    color: #f0f0f5;
    max-width: 600px;
    margin: 30px auto;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  "
>
  <h2
    style="
      font-size: 24px;
      color: #00c896;
      text-align: center;
      margin-bottom: 10px;
    "
  >
    Welcome to Not Real Bank 👋
  </h2>
  <p style="text-align: center; font-size: 16px; margin-bottom: 20px">
    Thank you for registering an account with us. To complete your sign-up,
    please enter the one-time passcode (OTP) below:
  </p>
  <div
    style="
      font-size: 40px;
      font-weight: bold;
      background: #00c896;
      color: #1e1e2f;
      text-align: center;
      padding: 12px 0;
      border-radius: 8px;
      letter-spacing: 4px;
      margin-bottom: 20px;
    "
  >
    ${otp}
  </div>
  <p style="text-align: center; font-size: 14px; color: #a0a0b0">
    If you did not create this account, please disregard this email.
  </p>
  <hr style="border: none; border-top: 1px solid #333; margin: 30px 0" />
  <p style="text-align: center; font-size: 12px; color: #555">
    Need help? Contact support at
    <a href="mailto:support@notrealbank.com" style="color: #00c896"
      >support@notrealbank.com</a
    >.
  </p>
  <p style="text-align: center; font-size: 12px; color: #555; margin-top: 10px">
    &copy; 2025 Not Real Bank. All rights reserved.
  </p>
</div>

  `;
};

const getText = (otp: number) => {
  return `Your OTP is: ${otp}`;
};

export const sendMail = async (
  receiver: string,

  otp: number
) => {
  const htmlContent = getHtmlTemplate(otp);
  const text = getText(otp);
  const info = await transporter.sendMail({
    from: '"not-real-bank" <bank.notreal@gmail.com>',
    to: receiver,
    text,
    html: htmlContent,
  });
  console.info("Message sent: ", info.messageId);
};
