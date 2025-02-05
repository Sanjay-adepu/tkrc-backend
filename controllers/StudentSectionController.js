const Year = require("../models/studentSection");
const path =require("path");
const mongoose=require('mongoose');
const bcrypt = require("bcryptjs");
// Get students in a section 
const getStudentsBySection = async (req, res) => {
  try {
    const { yearId, departmentId, sectionId } = req.params;

    const year = await Year.findOne({ year: yearId });  // Find Year by year string
    if (!year) return res.status(404).json({ message: "Year not found" });

    const department = year.departments.find(dept => dept.name === departmentId);  // Find department by name
    if (!department) return res.status(404).json({ message: "Department not found" });

    const section = department.sections.find(sec => sec.name === sectionId);  // Find section by name
    if (!section) return res.status(404).json({ message: "Section not found" });

    res.status(200).json({ students: section.students });
  } catch (error) {
    res.status(500).json({ message: "Error fetching students", error });
  }
};

// Add multiple students to a section
const addStudentsToSection = async (req, res) => {
  try {
    const { yearId, departmentId, sectionId } = req.params;
    let { students } = req.body;

    // ✅ Ensure students is parsed correctly
    if (typeof students === "string") {
      students = JSON.parse(students);
    }

    if (!Array.isArray(students)) {
      return res.status(400).json({ message: "Students must be an array" });
    }

    const year = await Year.findOne({ year: yearId });
    if (!year) return res.status(404).json({ message: "Year not found" });

    const department = year.departments.find((dept) => dept.name === departmentId);
    if (!department) return res.status(404).json({ message: "Department not found" });

    const section = department.sections.find((sec) => sec.name === sectionId);
    if (!section) return res.status(404).json({ message: "Section not found" });

    for (const student of students) {
  const { rollNumber, name, fatherName, password, role, mobileNumber, fatherMobileNumber } = student;

  if (!rollNumber || !name || !password || !mobileNumber) {
    console.error("Missing required fields in student:", student);
    return res.status(400).json({ message: "Each student must have a rollNumber, name, password, and mobile number." });
  }

  console.log("Adding student:", { rollNumber, name, mobileNumber }); // Debug log

  const hashedPassword = await bcrypt.hash(password, 10);
  const imagePath = req.file ? req.file.path : null;

  section.students.push({
    rollNumber,
    name,
    fatherName: fatherName || null,
    password: hashedPassword,
    role: role || "student",
    image: imagePath,
    mobileNumber,
    fatherMobileNumber: fatherMobileNumber || null,
  });
      }
    await year.save();
    res.status(201).json({ message: "Students added successfully", section });
  } catch (error) {
    console.error("Error adding students:", error.message);
    res.status(500).json({ message: "Error adding students", error: error.message });
  }
};


// Add or update a timetable for a section
// Add or update timetable for a section
const upsertSectionTimetable = async (req, res) => {
  try {
    const { yearId, departmentId, sectionId } = req.params;
    const { timetable } = req.body;

    console.log("Received yearId:", yearId);

    const allYears = await Year.find().select("year");
    console.log("Available years in DB:", allYears.map(y => y.year));

    const yearData = await Year.findOne({ year: yearId });
    if (!yearData) return res.status(404).json({ message: "Year not found" });

    console.log("Year found:", yearData.year);

    const deptData = yearData.departments.find(dept => dept.name === departmentId);
    if (!deptData) return res.status(404).json({ message: "Department not found" });

    const sectionData = deptData.sections.find(sec => sec.name === sectionId);
    if (!sectionData) return res.status(404).json({ message: "Section not found" });

    sectionData.timetable = timetable;
    await yearData.save();

    res.status(200).json({ message: "Timetable added/updated successfully", timetable: sectionData.timetable });
  } catch (error) {
    console.error("Error in upsertSectionTimetable:", error.message);
    res.status(500).json({ message: "Error upserting timetable", error: error.message });
  }
};
// Add a new year
const addYear = async (req, res) => {
  try {
    const { year } = req.body;

    const newYear = new Year({ year, departments: [] });
    await newYear.save();

    res.status(201).json({ message: "Year added successfully", newYear });
  } catch (error) {
    res.status(500).json({ message: "Error adding year", error });
  }
};

// Add a department to a year
const addDepartmentToYear = async (req, res) => {
  try {
    const { yearId } = req.params;  // Example: "B.Tech I"
    const { name } = req.body;  // Example: "CSE"

    const year = await Year.findOne({ year: yearId });  // Find Year by year string
    if (!year) return res.status(404).json({ message: "Year not found" });

    year.departments.push({ name, sections: [] });
    await year.save();

    res.status(201).json({ message: "Department added successfully", year });
  } catch (error) {
    res.status(500).json({ message: "Error adding department", error });
  }
};

// Add a section to a department
const addSectionToDepartment = async (req, res) => {
  try {
    const { yearId, departmentId } = req.params;  // Example: "B.Tech I", "CSE"
    const { name } = req.body;  // Example: "A"

    const year = await Year.findOne({ year: yearId });  // Find Year by year string
    if (!year) return res.status(404).json({ message: "Year not found" });

    const department = year.departments.find(dept => dept.name === departmentId);  // Find department by name
    if (!department) return res.status(404).json({ message: "Department not found" });

    department.sections.push({ name, timetable: [], students: [] });
    await year.save();

    res.status(201).json({ message: "Section added successfully", department });
  } catch (error) {
    res.status(500).json({ message: "Error adding section", error });
  }
};


//login student



const loginStudent = async (req, res) => {
  try {
    const { rollNumber, password } = req.body;

    // Validate input
    if (!rollNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Roll number and password are required",
      });
    }

    // Find the student by traversing the Year model
    const yearData = await Year.findOne({
      "departments.sections.students.rollNumber": rollNumber,
    });

    if (!yearData) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials: Student not found",
      });
    }

    // Locate the exact student within the nested structure
    let student = null;
    let year = null;
    let department = null;
    let section = null;

    for (const dept of yearData.departments) {
      for (const sec of dept.sections) {
        const foundStudent = sec.students.find(
          (stud) => stud.rollNumber === rollNumber
        );
        if (foundStudent) {
          student = foundStudent;
          year = yearData.year;
          department = dept.name;
          section = sec.name;
          break;
        }
      }
      if (student) break;
    }

    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials: Student not found",
      });
    }

    // Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, student.password);

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
      student: {
        id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        year,
        department,
        section,
      },
    });
  } catch (error) {
    console.error("Error during student login:", error.message);
    res.status(500).json({
      success: false,
      message: "Error during login",
      error: error.message,
    });
  }
};

// Add timetable to a section
const addTimetable = async (req, res) => {
  try {
    const { year, department, section, timetable } = req.body;

    if (!year || !department || !section || !timetable) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let parsedTimetable;
    try {
      parsedTimetable = JSON.parse(timetable);
      if (!Array.isArray(parsedTimetable) || parsedTimetable.length === 0) {
        return res.status(400).json({ message: "Timetable format is invalid" });
      }
    } catch (error) {
      return res.status(400).json({ message: "Invalid timetable JSON format" });
    }

    // Find the year, department, and section
    const yearData = await Year.findOne({ year });
    if (!yearData) return res.status(404).json({ message: "Year not found" });

    const deptData = yearData.departments.find((dept) => dept.name === department);
    if (!deptData) return res.status(404).json({ message: "Department not found" });

    const sectionData = deptData.sections.find((sec) => sec.name === section);
    if (!sectionData) return res.status(404).json({ message: "Section not found" });

    // Add the timetable
    sectionData.timetable = parsedTimetable;

    await yearData.save();
    res.status(200).json({ message: "Timetable added successfully", timetable: sectionData.timetable });

  } catch (error) {
    console.error("Error in addTimetable:", error.message);
    res.status(500).json({ message: "Error adding timetable", error: error.message });
  }
};

// Get timetable for a section


// Delete timetable for a section
const deleteTimetable = async (req, res) => {
  try {
    const { year, department, section } = req.params;

    const yearData = await Year.findOne({ year });
    if (!yearData) return res.status(404).json({ message: "Year not found" });

    const deptData = yearData.departments.find((dept) => dept.name === department);
    if (!deptData) return res.status(404).json({ message: "Department not found" });

    const sectionData = deptData.sections.find((sec) => sec.name === section);
    if (!sectionData) return res.status(404).json({ message: "Section not found" });

    // Remove the timetable
    sectionData.timetable = [];

    await yearData.save();
    res.status(200).json({ message: "Timetable deleted successfully" });

  } catch (error) {
    console.error("Error in deleteTimetable:", error.message);
    res.status(500).json({ message: "Error deleting timetable", error: error.message });
  }
};

const getSectionTimetable = async (req, res) => {
  try {
    const { yearId, departmentId, sectionId } = req.params;

    console.log("Fetching timetable for:", { yearId, departmentId, sectionId });

    const yearData = await Year.findOne({ year: new RegExp(`^${yearId}$`, "i") });
    if (!yearData) return res.status(404).json({ message: "Year not found" });

    const deptData = yearData.departments.find(dept => dept.name === departmentId);
    if (!deptData) return res.status(404).json({ message: "Department not found" });

    const sectionData = deptData.sections.find(sec => sec.name === sectionId);
    if (!sectionData) return res.status(404).json({ message: "Section not found" });

    res.status(200).json({ timetable: sectionData.timetable });
  } catch (error) {
    console.error("Error fetching timetable:", error.message);
    res.status(500).json({ message: "Error fetching timetable", error: error.message });
  }
};


                                         

const getStudentByRollNumber = async (req, res) => {
  try {
    const { rollNumber } = req.params;

    // Find the year data that contains the student
    const yearData = await Year.findOne({
      "departments.sections.students.rollNumber": rollNumber,
    });

    if (!yearData) {
      return res.status(404).json({ message: "Student not found" });
    }

    let student = null;
    let year = null;
    let department = null;
    let section = null;

    // Loop through departments and sections to find the student
    for (const dept of yearData.departments) {
      for (const sec of dept.sections) {
        const foundStudent = sec.students.find(
          (stud) => stud.rollNumber === rollNumber
        );
        if (foundStudent) {
          student = foundStudent;
          year = yearData.year;
          department = dept.name;
          section = sec.name;
          break;
        }
      }
      if (student) break;
    }

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({
  student: {
    id: student._id,
    name: student.name,
    rollNumber: student.rollNumber,
    fatherName: student.fatherName || null,
    role: student.role,
    year,
    department,
    section,
    image: student.image || null,
    mobileNumber: student.mobileNumber,
    fatherMobileNumber: student.fatherMobileNumber || null,
  },
});
  } catch (error) {
    console.error("Error fetching student details:", error.message);
    res.status(500).json({ message: "Error fetching student details", error: error.message });
  }
};

// Delete a student from a section by roll number
const deleteStudentByRollNumber = async (req, res) => {
  try {
    const { yearId, departmentId, sectionId, rollNumber } = req.params;

    const year = await Year.findOne({ year: yearId });
    if (!year) return res.status(404).json({ message: "Year not found" });

    const department = year.departments.find((dept) => dept.name === departmentId);
    if (!department) return res.status(404).json({ message: "Department not found" });

    const section = department.sections.find((sec) => sec.name === sectionId);
    if (!section) return res.status(404).json({ message: "Section not found" });

    const studentIndex = section.students.findIndex((student) => student.rollNumber === rollNumber);
    if (studentIndex === -1) return res.status(404).json({ message: "Student not found" });

    section.students.splice(studentIndex, 1); // Remove the student
    await year.save();

    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error.message);
    res.status(500).json({ message: "Error deleting student", error: error.message });
  }
};

// Delete all students from a section
const deleteAllStudentsInSection = async (req, res) => {
  try {
    const { yearId, departmentId, sectionId } = req.params;

    const year = await Year.findOne({ year: yearId });
    if (!year) return res.status(404).json({ message: "Year not found" });

    const department = year.departments.find((dept) => dept.name === departmentId);
    if (!department) return res.status(404).json({ message: "Department not found" });

    const section = department.sections.find((sec) => sec.name === sectionId);
    if (!section) return res.status(404).json({ message: "Section not found" });

    section.students = []; // Remove all students
    await year.save();

    res.status(200).json({ message: "All students deleted successfully" });
  } catch (error) {
    console.error("Error deleting all students:", error.message);
    res.status(500).json({ message: "Error deleting all students", error: error.message });
  }
};


module.exports = {
  getStudentsBySection,
  addStudentsToSection,
  upsertSectionTimetable,
  addYear,
  addDepartmentToYear,
  addSectionToDepartment,

  deleteAllStudentsInSection,
  getSectionTimetable,
  deleteStudentByRollNumber,
  getStudentByRollNumber,
  loginStudent
};
