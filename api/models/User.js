// Example: ./models/User.js (and similar changes for Admin/Contributor)

const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  // 🟢 NEW FIELDS FOR PROFILE MANAGEMENT 🟢
  photo: { type: String, default: '' }, // Path to the profile picture file
  bio: { type: String, default: '' },
  skills: { type: [String], default: [] }, // Array of strings for skills
  preferences: { type: Object, default: {} }, // Object for preferences
}, { timestamps: true });

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;