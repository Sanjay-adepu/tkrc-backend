const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const sendAbsentNotifications = require("./Twilio.js");
const multer = require('multer');
const cloudinary = require('./cloudnaryConfig.js'); // your config file
const { CloudinaryStorage } = require('multer-storage-cloudinary');
 

// Import your route files
const facultyroutes = require("./routes/FacultyRouter");

const AttendanceRoute = require("./routes/AttendanceRouter");
const SectionRoute = require("./routes/StudentSectionRouter");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON and URL-encoded requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS settings
const corsOptions = {
  origin: ["https://tkrcet.vercel.app", "https://tkrc-admin.vercel.app","http://localhost:5173"], // Allowed origins
  methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Serve static files from the "uploads" directory
app.use(
  "/uploads",
  (req, res, next) => {
    console.log(`Static file requested: ${req.path}`); // Log each static file request
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);



// Set up Cloudinary storage using multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage: storage });

// Endpoint to upload an image
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file || !req.file.path) {
    return res.status(400).json({ error: 'Image upload failed' });
  }

  res.json({
    message: 'Image uploaded successfully',
    url: req.file.path,
  });
});











// MongoDB connection
mongoose
  .connect("mongodb+srv://tkrcet:abc1234@cluster0.y4apc.mongodb.net/tkrcet")
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.error("MongoDB connection failed:", error.message));

// Define API routes
app.use("/faculty", facultyroutes);

app.use("/Attendance", AttendanceRoute);
app.use("/Section", SectionRoute);

// Default route to check API status
app.get("/", (req, res) => {
  res.status(200).send("Welcome to the TKRCET Attendance API!");
});

app.get("/test-sms", async (req, res) => {
  try {
    await sendAbsentNotifications();
    res.status(200).json({ message: "Test SMS sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "SMS sending failed", error: error.message });
  }
});



// Handle 404 errors for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.message);
  res.status(500).json({ message: "Internal server error" });
});


// Get all uploaded images
app.get('/images', async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression('folder:uploads')
      .sort_by('created_at', 'desc')
      .max_results(30) // Change as needed
      .execute();

    const images = result.resources.map(file => ({
      url: file.secure_url,
      public_id: file.public_id,
    }));

    res.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});




// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Required for Vercel deployment
module.exports = app;