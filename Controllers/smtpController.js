const nodemailer = require('nodemailer');

const testSmtpConfiguration = async (req, res) => {
  const { fromEmail, fromName, smtpHost, smtpSecurity, smtpUser, smtpPassword,smtpPort } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecurity === 'ssl',  // true for 465, false for other ports
      tls: smtpSecurity === "tls",
      auth: {
        user: smtpUser, // Use provided username
        pass: smtpPassword, // Use provided password
      },
    });

    // Verify connection configuration
    try {
      await transporter.verify();
      console.log("SMTP connection verified successfully.");
    } catch (error) {
      console.error("Error verifying SMTP connection:", error);
      return res.status(500).json({ success: false, message: `SMTP Verification Failed: ${error.message}` });
    }

    // Send a test email
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: fromEmail,
      subject: 'SMTP Configuration Test',
      text: 'This is a test email to verify your SMTP configuration.',
    });

    res.json({ success: true, message: 'Test email sent successfully.' });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { testSmtpConfiguration };