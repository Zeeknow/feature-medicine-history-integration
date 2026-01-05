const express = require("express");
const cors = require("cors");
const passport = require("passport");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

const medicineRoutes = require("./routes/medicineRoutes");
const participantRoutes = require("./routes/participantRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const shipmentRoutes = require("./routes/shipmentRoutes");

dotenv.config();

const app = express();

// Try to connect to MongoDB, but don't fail if it's not available
connectDB().catch(err => {
  console.log("MongoDB not available - running in demo mode");
});

const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "DELETE", "PUT", "POST"],
  credentials: true
}));


app.use(express.json());
app.use("/api/medicines", medicineRoutes);
app.use("/api/participants", participantRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/shipments", shipmentRoutes);

//use passport
app.use(passport.initialize());
//use passport middlware


app.get("/api", (req, res) => {
  res.status(200).json({ success: true, message: "API is reachable" });
});

app.get("/", (req, res) => {
  res.send("Supply Chain Management API Running...");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));