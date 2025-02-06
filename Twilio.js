const mongoose = require("mongoose");
const twilio = require("twilio");

const Attendance = require("./models/Attendance"); // Attendance model
const Year = require("./models/Year"); // Year model
const SentSMS = require("./models/SentSMS"); // New model for storing sent SMS

// Twilio Credentials
const ACCOUNT_SID = "AC16acf70c6a0d9d9ec640178685ae2a50";
const AUTH_TOKEN = "8a0bdc3c3029b84973891fef9da20331";
const TWILIO_PHONE_NUMBER = "+18777804236";

const client = new twilio(ACCOUNT_SID, AUTH_TOKEN);

// Function to send SMS
const sendSMS = async (mobileNumber, message, date, rollNumber) => {
  try {
    if (!mobileNumber) return;
    await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: mobileNumber,
    });

    // Store sent SMS details in the database
    await SentSMS.create({
      date,
      phone: mobileNumber,
      rollNumber,
      message,
    });

    console.log(`SMS sent to ${mobileNumber}`);
  } catch (error) {
    console.error(`Failed to send SMS to ${mobileNumber}:`, error);
  }
};

// Function to fetch today's absent students
const getAbsentStudents = async () => {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const attendanceRecords = await Attendance.find({ date: today });

    let absentStudents = {};

    // Collect absent students per roll number
    attendanceRecords.forEach((record) => {
      record.attendance.forEach((entry) => {
        if (entry.status === "absent") {
          if (!absentStudents[entry.rollNumber]) {
            absentStudents[entry.rollNumber] = { 
              name: entry.name,
              absentCount: 0, 
              department: record.department,
              section: record.section,
              year: record.year
            };
          }
          absentStudents[entry.rollNumber].absentCount += 1;
        }
      });
    });

    return absentStudents;
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    return {};
  }
};

// Function to get student parent mobile numbers
const getParentMobileNumbers = async (absentStudents) => {
  try {
    const years = await Year.find(); // Fetch all years data

    let studentMobileMap = {};

    // Traverse through the nested schema structure
    years.forEach((year) => {
      year.departments.forEach((dept) => {
        dept.sections.forEach((section) => {
          section.students.forEach((student) => {
            if (absentStudents[student.rollNumber]) {
              studentMobileMap[student.rollNumber] = {
                name: student.name,
                fatherMobileNumber: student.fatherMobileNumber
              };
            }
          });
        });
      });
    });

    return studentMobileMap;
  } catch (error) {
    console.error("Error fetching student details:", error);
    return {};
  }
};

// Function to send SMS notifications to parents
const sendAttendanceMessages = async () => {
  console.log("Fetching absent students...");

  const absentStudents = await getAbsentStudents();

  if (Object.keys(absentStudents).length === 0) {
    console.log("No absentees today.");
    return;
  }

  console.log("Fetching student parent mobile numbers...");

  const studentMobiles = await getParentMobileNumbers(absentStudents);
  const today = new Date().toISOString().split("T")[0];

  for (const rollNumber in absentStudents) {
    if (studentMobiles[rollNumber]) {
      const student = absentStudents[rollNumber];
      const fatherMobileNumber = studentMobiles[rollNumber].fatherMobileNumber;
      const absentCount = student.absentCount;

      const message = `Dear Parent, Your ward ${student.name} (Roll No: ${rollNumber}) was absent for ${absentCount} periods out of 6 on ${today}. For any queries, contact the class teacher.`;

      if (fatherMobileNumber) {
        await sendSMS(fatherMobileNumber, message, today, rollNumber);
      }
    }
  }

  console.log("Attendance messages sent.");
};

// Send SMS notifications immediately
    sendAttendanceMessages();
  

console.log("Attendance SMS service running...");
