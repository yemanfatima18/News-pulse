

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const clustersRouter = require("./routes/clusters");
const timelineRouter = require("./routes/timeline");
const ingestRouter  = require("./routes/ingest");

const app = express();
const PORT = process.env.PORT || 4000;


app.use(express.json());
app.use(
  cors({
    
    origin: process.env.FRONTEND_URL || "*",
  })
);


app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});


app.use("/clusters", clustersRouter);
app.use("/timeline", timelineRouter);
app.use("/ingest",   ingestRouter);


// Root endpoint
app.get("/", (_req, res) => {
  res.json({
    status: "OK",
    message: "News Pulse Backend is running"
  });
});

// Health endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    ts: new Date().toISOString()
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});


app.listen(PORT, () => {
  console.log(`News Pulse API running on http://localhost:${PORT}`);
  console.log("Database: Neon PostgreSQL");
});
