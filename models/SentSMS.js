const mongoose = require("mongoose");

const SentSMSSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  phone: { type: String, required: true }, // Parent's mobile number
  rollNumber: { type: String, required: true }, // Student's Roll No
  message: { type: String, required: true }, // Message sent
});

module.exports = mongoose.model("SentSMS", SentSMSSchema);
