// ./models/Contributor.js

const mongoose = require('mongoose');
const {Schema} = mongoose;

const ContributorSchema = new Schema({
    name: String,
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    photo: { type: String, default: '' }, // Path to the profile picture file
    bio: { type: String, default: '' },
    skills: { type: [String], default: [] }, // Array of strings for skills
    preferences: { type: Object, default: {} }, // Object for preferences
    
    // 💡 NEW FIELD for Contributor Approval Flow
    status: {
        type: String,
        enum: ['on_progress', 'accepted', 'declined'], // Define allowed values
        default: 'on_progress', // Default to pending review upon registration
        required: true
    },
    
}, { timestamps: true });

const ContributorModel = mongoose.model('Contributor', ContributorSchema);

module.exports = ContributorModel;