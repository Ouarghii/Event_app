// ./models/Contributor.js

const mongoose = require('mongoose');
const {Schema} = mongoose;

const ContributorSchema = new Schema({
  name: String,
  email: {type: String, required: true, unique: true},
  password: {type: String, required: true}
});

const ContributorModel = mongoose.model('Contributor', ContributorSchema);

module.exports = ContributorModel;