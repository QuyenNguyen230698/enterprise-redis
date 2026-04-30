const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fullName: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  gender: { type: String },
  address: { type: String },
  occupation: { type: String },
  companyName: { type: String },
  avatar: {
    url: { type: String },
    alt: { type: String },
  },
});

module.exports = mongoose.model("Profile", profileSchema);
