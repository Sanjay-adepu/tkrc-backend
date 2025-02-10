const express = require("express");
const multer = require("multer")
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudnaryConfig.js");

loginAdmin


// Set up Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "faculty-images", // Folder in your Cloudinary account
    allowed_formats: ["jpg", "jpeg", "png"], // Allowed image formats
  },
});

// Configure Multer to use Cloudinary storage
const upload = multer({ storage });


const {
  addFaculty,
  updateFaculty,
getTodayTimetableByFacultyId,
  getAllFaculty,
  getFacultyById,
  deleteFaculty,
  getFacultyTimetable,
  updateFacultyTimetable,
 getExactPeriodsForSubject,
 getFacultiesByDepartment,
 getFacultyUniqueCombinationsFor7Days,
  loginFaculty,
 loginAdmin,
 addFacultyProfile,
 getFacultyByFacultyId,
 getTimetableByFacultyId,
 getAllFacultyProfiles,
 getFacultyProfileByLoginId,
 deleteFacultyByFacultyId
} = require("../controllers/FacultyController");

const router = express.Router();

router.post("/Adminlogin", loginAdmin);
 
//admin details
router.post("/addfacultyprofile", upload.single("image"), addFacultyProfile);


// Routes
// Routes admin
router.get("/facultyprofiles", getAllFacultyProfiles);
router.get("/facultyprofile/:loginId", getFacultyProfileByLoginId);

router.post("/addfaculty", upload.single("image"), addFaculty);
router.put("/update/:id", upload.single("image"), updateFaculty);
router.get("/:facultyId/timetable-today", getTodayTimetableByFacultyId);
router.get("/getfaculty", getAllFaculty);
router.get("/:id", getFacultyById);
router.delete("/:id", deleteFaculty);
router.get("/:id/timetable", getFacultyTimetable);
router.put("/:id/timetable", updateFacultyTimetable);
router.post("/login", loginFaculty);
router.get("/department/:department",getFacultiesByDepartment);
router.get(
  "/:facultyId/unique",
getFacultyUniqueCombinationsFor7Days
);
router.get('/facultyId/:facultyId',getFacultyByFacultyId);

router.delete("/delete/:facultyId", deleteFacultyByFacultyId);

// New route to get periods for a subject
router.get(
  "/:facultyId/:department/:section/:subject",
  getExactPeriodsForSubject
);
router.get("/facultyId/:facultyId/timetable", getTimetableByFacultyId);

module.exports = router;
