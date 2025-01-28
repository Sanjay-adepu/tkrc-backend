const Year = require("../models/studentSection");

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
// Add multiple students to a section
const addStudentsToSection = async (req, res) => {
  try {
    const { yearId, departmentId, sectionId } = req.params;
    const { students } = req.body;

    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ message: "Students must be an array" });
    }

    const year = await Year.findOne({ year: yearId }); // Find Year by year string
    if (!year) return res.status(404).json({ message: "Year not found" });

    const department = year.departments.find((dept) => dept.name === departmentId); // Find department by name
    if (!department) return res.status(404).json({ message: "Department not found" });

    const section = department.sections.find((sec) => sec.name === sectionId); // Find section by name
    if (!section) return res.status(404).json({ message: "Section not found" });

    students.forEach((student) => {
      const { rollNumber, name, fatherName, password, role, image } = student;

      if (!rollNumber || !name || !password) {
        throw new Error("Each student must have a rollNumber, name, and password.");
      }

      // Push the student object with all required fields
      section.students.push({
        rollNumber,
        name,
        fatherName: fatherName || null, // Optional field
        password, // Ideally, hash the password before storing it
        role: role || "student", // Default to "student" if not provided
        image: image || null, // Optional field
      });
    });

    await year.save();
    res.status(201).json({ message: "Students added successfully", section });
  } catch (error) {
    console.error("Error adding students:", error.message || error);
    res.status(500).json({ message: "Error adding students", error });
  }
};

// Add or update a timetable for a section
const upsertSectionTimetable = async (req, res) => {
  try {
    const { yearId, departmentId, sectionId } = req.params;
    const { timetable } = req.body;

    if (!timetable || !Array.isArray(timetable)) {
      return res.status(400).json({ message: "Timetable must be an array" });
    }

    const year = await Year.findOne({ year: yearId });  // Find Year by year string
    if (!year) return res.status(404).json({ message: "Year not found" });

    const department = year.departments.find(dept => dept.name === departmentId);  // Find department by name
    if (!department) return res.status(404).json({ message: "Department not found" });

    const section = department.sections.find(sec => sec.name === sectionId);  // Find section by name
    if (!section) return res.status(404).json({ message: "Section not found" });

    section.timetable = timetable;
    await year.save();

    res.status(200).json({ message: "Timetable added/updated successfully", section });
  } catch (error) {
    console.error("Error upserting timetable:", error.message || error);
    res.status(500).json({ message: "Error upserting timetable", error });
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

    // Find the year containing the student by roll number
    const yearData = await Year.findOne({
      "departments.sections.students.rollNumber": rollNumber,
    });

    if (!yearData) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials: Student not found",
      });
    }

    let student;
    let departmentName = null;
    let sectionName = null;
    let yearName = yearData.year; // Get the year name (if defined in the schema)

    // Traverse through departments and sections to locate the student
    yearData.departments.some((department) => {
      return department.sections.some((section) => {
        const foundStudent = section.students.find(
          (s) => s.rollNumber === rollNumber
        );
        if (foundStudent) {
          student = foundStudent;
          departmentName = department.name;
          sectionName = section.name;
          return true; // Stop looping once student is found
        }
        return false;
      });
    });

    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials: Student not found",
      });
    }

    // Compare passwords
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
        fatherName: student.fatherName,
        role: student.role,
        year: yearName,
        department: departmentName,
        section: sectionName,
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




module.exports = {
  getStudentsBySection,
  addStudentsToSection,
  upsertSectionTimetable,
  addYear,
  addDepartmentToYear,
  addSectionToDepartment,
  loginStudent
};
