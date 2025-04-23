const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const productRoute = require('./routes/products');
const customerRoute = require('./routes/customer');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orders');
const nodemailer = require('nodemailer');
const payeeRouter = require('./routes/PayeeRoute');
const billRoute = require('./routes/BillRoute');
const estimateRoute = require('./routes/EstimateRoute');
const expenseRoute = require('./routes/ExpenseRoute');
const smtpRoutes = require('./routes/smtp');
const InvoiceData = require('./routes/InvoicesData');
const settingRoutes = require('./routes/setting');
const locationsRoute = require('./routes/location');
const prefixRunningNumbersRoute = require('./routes/prefix_running_numbers');
const gstSettingsRoute = require('./routes/gst_settings');
const emailSettingsRoute = require('./routes/email_settings');
const htmlRoutes = require('./routes/htmlRoutes');
const templateRoutes = require('./routes/template');
const customizeLabelRoutes = require('./routes/customize_label');
const emailFormateRoutes = require('./routes/email_formate');
const collectionRoutes = require('./routes/collection');
const smartCollectionRoutes = require('./routes/smart_collection');
const path = require('path');
const refundedOrderRoutes = require('./routes/RefundOrders');
const OrderReportRoute = require('./routes/OrderReport');
const creditReport = require('./routes/reportTemplate');
const onlineReport = require('./routes/onlineReport');
const gstr1Route = require('./routes/gstr1');
const hsnSummarySalesRoute = require('./routes/hsn_summary_sales');
const documentSummaryRoute = require('./routes/document_summary_gst1');
const supplySummaryRoute = require('./routes/supply_summary');
const hsnSummaryPurchaseRoute = require('./routes/hsn_summary_purchase');
const itcSummaryRoute = require('./routes/eligible_itc');

const app = express();
app.use(bodyParser.json());
const port = 3001;

app.use(cors({
  // origin: "https://morris-mode-industries-designers.trycloudflare.com",  // Aapke frontend ka URL
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,store-name,api-version,access-token"
}));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Use the product routes
app.use('/api/products', productRoute);
app.use('/api/customers', customerRoute);
app.use('/api/all-products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payees', payeeRouter);
app.use('/api/bills', billRoute);
app.use('/api/estimate', estimateRoute);
app.use('/api/expense', expenseRoute);
app.use('/api/offlineData', InvoiceData);
app.use('/api', smtpRoutes);
app.use('/api', refundedOrderRoutes);
// Connect to MongoDB
app.use('/api/settings', settingRoutes);
app.use('/api/locations', locationsRoute);
app.use('/api/prefix-running-numbers', prefixRunningNumbersRoute);
app.use('/api/gst-settings', gstSettingsRoute);
app.use('/api/email-settings', emailSettingsRoute);
app.use('/api/html', htmlRoutes);
app.use('/api/template', templateRoutes);
app.use('/api/customize-label', customizeLabelRoutes);
app.use('/api/email-formate', emailFormateRoutes);
app.use('/api/collection', collectionRoutes);
app.use('/api/smart-collection', smartCollectionRoutes);
app.use('/api', OrderReportRoute);
app.use('/api/templates', creditReport);
app.use('/api/online', onlineReport);
app.use('/api/gstr1', gstr1Route);
app.use('/api/hsnSummarySales', hsnSummarySalesRoute);
app.use('/api/document-summary', documentSummaryRoute);
app.use('/api/supply-summary', supplySummaryRoute);
app.use('/api/hsn-summary-purchase', hsnSummaryPurchaseRoute);
app.use('/api/itc-summary', itcSummaryRoute);

// Connect to MongoDB
require('dotenv').config(); // This will load the variables from the .env file
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log('Error connecting to MongoDB:', err));

// EMAIL SENDING
const emailUser = process.env.MAIL_USER;
const emailPass = process.env.MAIL_PASS;
const emailHost = process.env.MAIL_HOST;

const transporter = nodemailer.createTransport({
  host: emailHost,
  port: 465,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});
// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log(error);
  } else {
    console.log("Server is ready to take our messages");
  }
});
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, content } = req.body;

    // Input validation (very basic example)
    if (!to || !subject || !content) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Email options
    const mailOptions = {
      from: emailUser,
      to: to,
      subject: subject,
      html: content, // Use `html` for rich text
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);

    res.status(200).json({ message: 'Email sent successfully!', info: info });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email.', error: error.message });
  }
});

// Start the server
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));