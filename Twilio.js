const twilio = require("twilio");
const cron = require("node-cron");
const Attendance = require("./models/studentAttendance");
const Year = require("./models/studentSection");
 
// Twilio Credentials
const ACCOUNT_SID = "AC16acf70c6a0d9d9ec640178685ae2a50";
const AUTH_TOKEN = "8a0bdc3c3029b84973891fef9da20331";
const TWILIO_PHONE_NUMBER = "+18777804236";

const client = new twilio(ACCOUNT_SID, AUTH_TOKEN);

// Function to send SMS to parents of absent students
const sendAbsentNotifications = async () => {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    const attendanceRecords = await Attendance.find({ date: today });

    if (!attendanceRecords.length) {
      console.log("No attendance records found for today.");
      return;
    }

    let absenteesMap = new Map();

    attendanceRecords.forEach((record) => {
      record.attendance.forEach((entry) => {
        if (entry.status === "absent") {
          if (!absenteesMap.has(entry.rollNumber)) {
            absenteesMap.set(entry.rollNumber, {
              rollNumber: entry.rollNumber,
              name: entry.name,
              fatherMobileNumber: "N/A",
              year: record.year,
              department: record.department,
              section: record.section,
              absentPeriodsCount: 0,
              absentPeriods: [],
            });
          }

          let studentAbsentData = absenteesMap.get(entry.rollNumber);
          studentAbsentData.absentPeriods.push(record.period);
          studentAbsentData.absentPeriodsCount++;
        }
      });
    });

    // Fetch student details to get parents' mobile numbers
    const allData = await Year.find();
    allData.forEach((yearData) => {
      yearData.departments.forEach((departmentData) => {
        departmentData.sections.forEach((sectionData) => {
          sectionData.students.forEach((student) => {
            if (absenteesMap.has(student.rollNumber)) {
              absenteesMap.get(student.rollNumber).fatherMobileNumber =
                student.fatherMobileNumber || "N/A";
            }
          });
        });
      });
    });

    // Send SMS to parents
    for (const student of absenteesMap.values()) {
      if (student.fatherMobileNumber !== "N/A") {
        const message = `Dear Parent, your child ${student.name} (Roll No: ${student.rollNumber}) was absent today for ${student.absentPeriodsCount} period(s). Please ensure their attendance.`;

        try {
          await client.messages.create({
            body: message,
            from: TWILIO_PHONE_NUMBER,
            to: student.fatherMobileNumber,
          });
          console.log(`SMS sent to ${student.fatherMobileNumber} for ${student.name}`);
        } catch (smsError) {
          console.error(`Failed to send SMS to ${student.fatherMobileNumber}:`, smsError.message);
        }
      }
    }

    console.log("Absent notifications sent successfully.");
  } catch (error) {
    console.error("Error sending absent notifications:", error.message || error);
  }
};

// Schedule the function to run at **5 PM (17:00)**
cron.schedule("0 17 * * *", () => {
  console.log("Running SMS notification job at 5 PM...");
  sendAbsentNotifications();
});

module.exports = sendAbsentNotifications;
