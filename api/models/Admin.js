// ./models/Admin.js

const mongoose = require('mongoose');
const {Schema} = mongoose;

const AdminSchema = new Schema({
  name: String,
  email: {type: String, required: true, unique: true},
  password: {type: String, required: true}
});

const AdminModel = mongoose.model('Admin', AdminSchema);

module.exports = AdminModel;