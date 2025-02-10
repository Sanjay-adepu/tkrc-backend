const mongoose = require('mongoose');

const FacultyProfileSchema = new mongoose.Schema({
    loginId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    designation: { type: String, required: true },
    department: { type: String, required: true },
    name: { type: String, required: true },
    qualification: { type: String, required: true },
    areaOfInterest: { type: String },
    jntuId: { type: String, unique: true },
    yearsOfExperience: { type: Number, required: true },
    image: { type: String } // URL or base64 encoded image
});

const FacultyProfile = mongoose.model('FacultyProfile', FacultyProfileSchema);
module.exports = FacultyProfile;
