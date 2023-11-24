const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const dotenv = require("dotenv");

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config({ path: "./.env" });

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});

db.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Connected to MySQL database");
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

//insert into user table
app.post("/register", (req, res) => {
  const sql =
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
  // Include the role in the values array
  const values = [
    req.body.name,
    req.body.email,
    req.body.password,
    req.body.role,
  ];

  db.query(sql, values, (err, data) => {
    if (err) {
      return res.json("Error in Register", err.message);
    }
    return res.json(data);
  });
});

//insert into patient table
app.post("/insertintopatient", (req, res) => {
  const sql = "INSERT INTO patient (name, patientID) VALUES (?, ?)";
  // Include the role in the values array
  const values = [req.body.name, req.body.email];

  db.query(sql, values, (err, data) => {
    if (err) {
      return res.json("Error in Inserting into Patient", err.message);
    }
    return res.json(data);
  });
});

//insert into doctor table
app.post("/insertintodoctor", (req, res) => {
  const sql = "INSERT INTO doctor (name, doctorID) VALUES (?, ?)";
  // Include the role in the values array
  const values = [req.body.name, req.body.email];

  db.query(sql, values, (err, data) => {
    if (err) {
      return res.json("Error in Inserting into doctor", err.message);
    }
    return res.json(data);
  });
});

//authenticate login
app.post("/login", (req, res) => {
  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
  const values = [req.body.email, req.body.password];

  db.query(sql, values, (err, data) => {
    if (err) {
      return res.json("Error in Login", err.message);
    }

    if (data.length > 0) {
      const user = data[0];
      // Include the role in the response
      return res.json({ result: "Success", role: user.role });
    } else {
      return res.json({ result: "No Record Found" });
    }
  });
});

//fetch patient details for home
app.post("/patientdetails", (req, res) => {
  const patientID = req.body.patientID; // assuming you send patientID from the frontend
  const sql =
    "SELECT name, age, sex, height, weight, contact, address FROM patient WHERE patientID = ?";

  db.query(sql, [patientID], (err, data) => {
    if (err) {
      return res.json("Error fetching patient details:", err.message);
    }

    if (data.length > 0) {
      const patientDetails = data[0];
      return res.json(patientDetails);
    } else {
      return res.json("Patient not found");
    }
  });
});

// Update patient table
app.post("/updatepatient", (req, res) => {
  const sql =
    "UPDATE patient SET age=?, sex=?, height=?, weight=?, contact=?, address=? WHERE patientID=?";
  const values = [
    req.body.age,
    req.body.sex,
    req.body.height,
    req.body.weight,
    req.body.contact,
    req.body.address,
    req.body.patientID,
  ];

  db.query(sql, values, (err, data) => {
    if (err) {
      // Update the response to use res.status(status).json(obj)
      return res.status(500).json({
        error: "Error updating patient details",
        message: err.message,
      });
    }
    return res.json(data);
  });
});

// Fetch doctor details for doctor dropdown using stored procedure
app.get("/doctornames", (req, res) => {
  const sql = "CALL GetDoctorNames()";

  db.query(sql, (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error fetching doctors" });
    }
    // If doctors are found, log and send the list to the client
    console.log("Doctor data:", data[0]); // Stored procedure result is in the first element of the array
    return res.json(data[0]);
  });
});

//fetch appointment details for patient
app.post("/appointmentdetails", (req, res) => {
  const values = [req.body.patientID];

  const sql =
    "SELECT appointment.date, appointment.status, doctor.name FROM dbs.appointment NATURAL JOIN doctor WHERE appointment.patientID = ?";

  db.query(sql, values, (err, data) => {
    if (err) {
      console.error("Error fetching appointment details:", err);
      return res
        .status(500)
        .json({ error: "Error fetching appointment details" });
    }

    const appointments = data.map((row) => ({
      date: row.date,
      doctor: row.name,
      status: row.status,
    }));
    console.log("Appointments:", appointments);

    return res.json(appointments);
  });
});

// Fetch appointment details for patient using stored procedure
app.post("/apppointmmentdetails", (req, res) => {
  const patientID = req.body.patientID;

  const sql = "CALL GetAppointmentDetails(?)";

  db.query(sql, [patientID], (err, data) => {
    if (err) {
      console.error("Error fetching appointment details:", err);
      return res
        .status(500)
        .json({ error: "Error fetching appointment details" });
    }

    const appointments = data[0].map((row) => ({
      date: row.date,
      doctor: row.name,
      status: row.status,
    }));
    console.log("Appointments:", appointments);

    return res.json(appointments);
  });
});

// Add a new appointment from patient
app.post("/addappointment", (req, res) => {
  const values = [
    req.body.date,
    req.body.patientID,
    req.body.doctorID,
    req.body.status,
    req.body.issue,
  ];
  console.log("Values:", values);

  const sql =
    "INSERT INTO appointment (date, patientID, doctorID, status, issue) VALUES (?, ?, ?, ?, ?)";

  db.query(sql, values, (err, data) => {
    if (err) {
      return res.json("Error in Inserting into doctor", err.message);
    }
    return res.json(data);
  });
});

// Fetch appointment details for patient
app.post("/paymentdetailsforpatient", (req, res) => {
  const values = [req.body.patientID];

  const sql =
    "SELECT  paymentmethod, billingID, billing.amount AS amount, billing.status FROM billing WHERE patientID = ?";

  db.query(sql, values, (err, data) => {
    if (err) {
      console.error("Error fetching appointment details for doctor:", err);
      return res
        .status(500)
        .json({ error: "Error fetching appointment details for doctor" });
    }

    const appointments = data.map((row) => ({
      paymentmethod: row.paymentmethod,
      amount: row.amount,
      status: row.status,
      billingID: row.billingID,
    }));
    console.log("Bills for doctor:", appointments);

    return res.json(appointments);
  });
});

app.post("/billpaymentmethod", (req, res) => {
  const { billingID, paymentmethod } = req.body;

  const sql = "UPDATE billing SET paymentmethod = ? WHERE billingID = ?";

  db.query(sql, [paymentmethod, billingID], (err, data) => {
    if (err) {
      console.error("Error updating payment method for billing:", err.message);
      return res
        .status(500)
        .json({ error: "Error updating payment method for billing" });
    }

    return res.json({ message: "Payment method updated successfully" });
  });
});

app.post("/billpayment", (req, res) => {
  const { billingID } = req.body;

  const sql = "UPDATE billing SET status = 'PAID' WHERE billingID = ?";

  db.query(sql, [billingID], (err, data) => {
    if (err) {
      console.error("Error updating payment method for billing:", err);
      return res
        .status(500)
        .json({ error: "Error updating payment method for billing" });
    }

    return res.json({ message: "Payment method updated successfully" });
  });
});

app.post("/addfeed", (req, res) => {
  const { patientID, doctorID, feed } = req.body;

  // Add validation for required fields
  if (!patientID || !doctorID || !feed) {
    return res
      .status(400)
      .json({ error: "Please provide all required fields." });
  }

  // Add logic to insert feedback into the database
  const sql =
    "INSERT INTO feedback (patientID, doctorID, feed) VALUES (?, ?, ?)";
  const values = [patientID, doctorID, feed];

  db.query(sql, values, (err, data) => {
    if (err) {
      console.error("Error inserting feedback:", err);
      return res.status(500).json({ error: "Error inserting feedback." });
    }

    return res.json({ message: "Feedback added successfully." });
  });
});

//DOCTOR

app.post("/doctordetails", (req, res) => {
  const doctorID = req.body.doctorID;
  const sql =
    "SELECT name, age, sex, specialization, department FROM doctor WHERE doctorID = ?";

  db.query(sql, [doctorID], (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Error fetching doctor details", message: err.message });
    }

    if (data.length > 0) {
      const doctorDetails = data[0];
      return res.json(doctorDetails);
    } else {
      return res.status(404).json({ error: "Doctor not found" });
    }
  });
});

// Update doctor table
app.post("/updatedoctor", (req, res) => {
  const sql =
    "UPDATE doctor SET age=?, sex=?, specialization=?, department=? WHERE doctorID=?";
  const values = [
    req.body.age,
    req.body.sex,
    req.body.specialization,
    req.body.department,
    req.body.doctorID,
  ];

  db.query(sql, values, (err, data) => {
    if (err) {
      return res.status(500).json({
        error: "Error updating doctor details",
        message: err.message,
      });
    }
    return res.json(data);
  });
});

// Fetch appointment details for doctor
app.post("/appointmentdetailsfordoctor", (req, res) => {
  const values = [req.body.doctorID];

  const sql =
    "SELECT appointment.date, appointment.appointmentID, patient.name AS patient, appointment.status FROM dbs.appointment NATURAL JOIN patient WHERE appointment.doctorID = ?";

  db.query(sql, values, (err, data) => {
    if (err) {
      console.error("Error fetching appointment details for doctor:", err);
      return res
        .status(500)
        .json({ error: "Error fetching appointment details for doctor" });
    }

    const appointments = data.map((row) => ({
      date: row.date,
      patient: row.patient,
      status: row.status,
      appointmentID: row.appointmentID,
    }));
    console.log("Appointments for doctor:", appointments);

    return res.json(appointments);
  });
});

// Fetch appointment details for doctor
app.post("/appointmentdetailsfordoctorrr", (req, res) => {
  const values = [req.body.doctorID];

  const sql =
    "SELECT date, appointmentID, patient, status FROM ( SELECT appointment.date, appointment.appointmentID, patient.name AS patient, appointment.status FROM dbs.appointment NATURAL JOIN patient WHERE appointment.doctorID = ?) AS nested_query;";

  db.query(sql, values, (err, data) => {
    if (err) {
      console.error("Error fetching appointment details for doctor:", err);
      return res
        .status(500)
        .json({ error: "Error fetching appointment details for doctor" });
    }

    const appointments = data.map((row) => ({
      date: row.date,
      patient: row.patient,
      status: row.status,
      appointmentID: row.appointmentID,
    }));
    console.log("Appointments for doctor:", appointments);

    return res.json(appointments);
  });
});

// Cancel appointment
app.post("/cancelappointment", (req, res) => {
  const values = [req.body.appointmentID, req.body.doctorID];

  const sql =
    "DELETE FROM appointment WHERE appointmentID = ? AND doctorID = ?";

  db.query(sql, values, (err, data) => {
    if (err) {
      console.error("Error canceling appointment:", err);
      return res.status(500).json({ error: "Error canceling appointment" });
    }

    return res.json({ message: "Appointment canceled successfully" });
  });
});

// Confirm appointment
app.post("/confirmappointment", (req, res) => {
  const values = ["CONFIRMED", req.body.appointmentID, req.body.doctorID];

  const sql =
    "UPDATE appointment SET status = ? WHERE appointmentID = ? AND doctorID = ?";

  db.query(sql, values, (err, data) => {
    if (err) {
      console.error("Error confirming appointment:", err);
      return res.status(500).json({ error: "Error confirming appointment" });
    }

    return res.json({ message: "Appointment confirmed successfully" });
  });
});

//fetch patient details for patient dropdown
app.get("/patientnames", (req, res) => {
  const sql = "SELECT patientID, name FROM patient";

  db.query(sql, (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error fetching doctors" });
    }
    // If doctors are found, log and send the list to the client
    console.log("Patient data:", data);
    return res.json(data);
  });
});

// Add a new billing entry if the provided doctorID matches in the appointment table
app.post("/docbill", (req, res) => {
  const { appointmentID, amount, patientID, doctorID } = req.body;

  // Check if the provided doctorID exists in the appointment table
  const checkDoctorSql = "SELECT * FROM appointment WHERE doctorID = ? LIMIT 1";
  db.query(checkDoctorSql, [doctorID], (doctorErr, doctorData) => {
    if (doctorErr) {
      console.error("Error checking doctorID in appointment table:", doctorErr);
      return res.status(500).json({ error: "Error checking doctorID" });
    }

    if (doctorData.length === 0) {
      return res.status(400).json({ error: "Invalid doctorID" });
    }

    // If doctorID exists, insert into the billing table
    const insertSql =
      "INSERT INTO billing (billingID, amount, patientID, doctorID, paymentmethod, status) VALUES (?, ?, ?, ?, '...undefined', '...pending')";
    const values = [appointmentID, amount, patientID, doctorID];

    db.query(insertSql, values, (err, data) => {
      if (err) {
        console.error("Error inserting into billing table:", err);
        return res
          .status(500)
          .json({ error: "Error inserting into billing table" });
      }

      return res.json({
        message: "Billing entry added successfully",
        billingID: data.insertId,
      });
    });
  });
});

// Fetch appointment details for doctor
app.post("/paymentdetailsfordoctor", (req, res) => {
  const values = [req.body.doctorID];

  const sql =
    "SELECT  paymentmethod, billingID, billing.amount AS amount, billing.status FROM billing WHERE doctorID = ?";

  db.query(sql, values, (err, data) => {
    if (err) {
      console.error("Error fetching appointment details for doctor:", err);
      return res
        .status(500)
        .json({ error: "Error fetching appointment details for doctor" });
    }

    const appointments = data.map((row) => ({
      paymentmethod: row.paymentmethod,
      amount: row.amount,
      status: row.status,
      billingID: row.billingID,
    }));
    console.log("Bills for doctor:", appointments);

    return res.json(appointments);
  });
});

app.listen(8000, () => {
  console.log("listening on port 8000 from backend");
});
