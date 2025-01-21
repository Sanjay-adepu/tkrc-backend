const Faculty = require("../models/facultymodel");
const bcrypt = require("bcryptjs");
const path = require("path");
    
const addFaculty = async (req, res) => {  
  try {
    const { name, facultyId, role, department, password, timetable } = req.body;

    if (!name || !facultyId || !role || !department || !password || !timetable) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get the image file URL if provided
    const imagePath = req.file ? req.file.path : null;

    let parsedTimetable;
    try {
      parsedTimetable = JSON.parse(timetable);
      if (!Array.isArray(parsedTimetable) || parsedTimetable.length === 0) {
        return res.status(400).json({ message: "Timetable format is invalid" });
      }
    } catch (error) {
      return res.status(400).json({ message: "Invalid timetable JSON format" });
    }

    const newFaculty = new Faculty({
      name,
      facultyId,
      role,
      department,
      password: hashedPassword,
      timetable: parsedTimetable,
      image: imagePath,
    });

    await newFaculty.save();

    res.status(201).json({ message: "Faculty added successfully", faculty: newFaculty });
  } catch (error) {
    console.error("Error in addFaculty:", error.message);
    res.status(500).json({ message: "Error adding faculty", error: error.message });
  }
};

const getFacultyUniqueCombinationsFor7Days = async (req, res) => {
  try {
    const { facultyId } = req.params;

    // Fetch faculty data by facultyId
    const faculty = await Faculty.findOne({ facultyId });

    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    // Use a Set to store unique combinations
    const uniqueCombinations = new Set();

    // Iterate over the timetable
    faculty.timetable.forEach((entry) => {
      entry.periods.forEach((period) => {
        const combination = `${period.year}-${period.department}-${period.section}-${period.subject}`;
        uniqueCombinations.add(combination);
      });
    });

    // Convert Set to Array and format the result
    const result = Array.from(uniqueCombinations).map((combination) => {
      const [year, department, section, subject] = combination.split("-");
      return { year, department, section, subject };
    });

    res.status(200).json({ uniqueCombinations: result });
  } catch (error) {
    console.error("Error fetching unique combinations:", error.message);
    res.status(500).json({
      message: "Error fetching unique combinations",
      error: error.message,
    });
  }
};

const getCurrentDay = () => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const currentDate = new Date();
  return days[currentDate.getDay() - 1]; // Convert to Monday-based index
};

const getTodayTimetableByFacultyId = async (req, res) => {
  try {
    const { facultyId } = req.params;

    // Fetch faculty data by custom facultyId
    const faculty = await Faculty.findOne({ facultyId });

    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    // Get the current day
    const currentDay = getCurrentDay();

    // Find today's timetable
    const todayTimetable = faculty.timetable.find((entry) => entry.day === currentDay);

    if (!todayTimetable || todayTimetable.periods.length === 0) {
      return res.status(200).json({ classes: [], message: "No classes today" });
    }

    // Format the response for the frontend
    const classes = todayTimetable.periods.map((period) => ({
      programYear: `B.Tech ${period.year}`, // Add "B.Tech" prefix to year
      department: period.department,
      section: period.section,
      subject: period.subject,
    }));

    // Return the formatted timetable
    return res.status(200).json({ classes });
  } catch (error) {
    console.error("Error fetching today's timetable:", error.message);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};



// Update faculty (with image upload)
const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, facultyId, role, department, password, timetable } = req.body;

    // Get the image file URL if provided
    const imagePath = req.file ? req.file.path : null;

    let updatedData = {
      name,
      facultyId,
      role,
      department,
      timetable,
    };

    // Hash the password if provided
    if (password) {
      updatedData.password = await bcrypt.hash(password, 10);
    }

    // Include the image path if provided
    if (imagePath) {
      updatedData.image = imagePath;
    }

    const updatedFaculty = await Faculty.findByIdAndUpdate(id, updatedData, { new: true });

    if (!updatedFaculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.status(200).json({ message: "Faculty updated successfully", faculty: updatedFaculty });
  } catch (error) {
    console.error("Error in updateFaculty:", error.message);
    res.status(500).json({ message: "Error updating faculty", error: error.message });
  }
};

// Login faculty

const loginFaculty = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const faculty = await Faculty.findOne({ facultyId: username });

    if (!faculty) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials: Faculty not found",
      });
    }

    // Compare passwords (this is within an async function)
    const isMatch = await bcrypt.compare(password, faculty.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials: Incorrect password",
      });
    }

    // Successful login
    res.status(200).json({
      success: true,
      message: "Login successful",
      faculty: {
        id: faculty._id,
        name: faculty.name,
        role: faculty.role,
        department: faculty.department,
      },
    });
  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(500).json({
      success: false,
      message: "Error during login",
      error: error.message,
    });
  }
};



// Get a faculty by ID (including image)
const getFacultyById = async (req, res) => {
  try {
    const { id } = req.params;
    const faculty = await Faculty.findById(id);

    if (!faculty) return res.status(404).json({ message: "Faculty not found" });

    res.status(200).json(faculty);
  } catch (error) {
    res.status(500).json({ message: "Error fetching faculty", error });
  }
};

// Get all faculty
const getAllFaculty = async (req, res) => {
  try {
    const facultyList = await Faculty.find();
    res.status(200).json(facultyList);
  } catch (error) {
    res.status(500).json({ message: "Error fetching faculty", error });
  }
};

// Delete a faculty
const deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedFaculty = await Faculty.findByIdAndDelete(id);

    if (!deletedFaculty) return res.status(404).json({ message: "Faculty not found" });

    res.status(200).json({ message: "Faculty deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting faculty", error });
  }
};

// Get faculty timetable
const getFacultyTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const faculty = await Faculty.findById(id);

    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.status(200).json({
      timetable: faculty.timetable,
      facultyDetails: {
        name: faculty.name,
        department: faculty.department,
        role: faculty.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching timetable",
      error: error.message,
    });
  }
};

// Update faculty timetable
const updateFacultyTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const { timetable } = req.body;

    // Check if timetable is provided
    if (!timetable) {
      return res.status(400).json({ message: "Timetable is required" });
    }

    let parsedTimetable;
    try {
      // Parse and validate the timetable
      parsedTimetable = JSON.parse(timetable);
      if (!Array.isArray(parsedTimetable) || parsedTimetable.length === 0) {
        return res.status(400).json({ message: "Timetable format is invalid" });
      }
    } catch (error) {
      return res.status(400).json({ message: "Invalid timetable JSON format" });
    }

    // Find the faculty by ID
    const faculty = await Faculty.findById(id);

    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    // Update the timetable
    faculty.timetable = parsedTimetable;
    await faculty.save();

    res.status(200).json({ message: "Faculty timetable updated successfully", faculty });
  } catch (error) {
    console.error("Error in updateFacultyTimetable:", error.message);
    res.status(500).json({ message: "Error updating timetable", error: error.message });
  }



};

module.exports = {
  
  addFaculty,
  getAllFaculty,
  getFacultyById,
  updateFaculty,
  deleteFaculty,
  getFacultyTimetable,
  updateFacultyTimetable,
  loginFaculty,
    getFacultyUniqueCombinationsFor7Days,
 getTodayTimetableByFacultyId
};
