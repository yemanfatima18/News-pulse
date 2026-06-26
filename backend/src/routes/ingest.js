

const { Router } = require("express");
const { spawn } = require("child_process");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const router = Router();


const jobs = new Map();

const SCRAPER_DIR = path.resolve(__dirname, "../../../scraper");
const PYTHON_CMD = process.env.PYTHON_CMD || "python3";


router.post("/trigger", (req, res) => {
  const jobId = uuidv4();

  jobs.set(jobId, {
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    error: null,
  });

 
  const child = spawn(PYTHON_CMD, ["main.py"], {
    cwd: SCRAPER_DIR,
    env: { ...process.env }, 
  });

  let stderr = "";
  child.stderr.on("data", (chunk) => {
  const text = chunk.toString();
  stderr += text;
  console.error(text); // Print Python error to Render logs
});
  child.stdout.on("data", (chunk) => {
  console.log(chunk.toString());
});

  child.on("close", (code) => {
  console.log(`Python exited with code ${code}`);

  const job = jobs.get(jobId);
  if (!job) return;

  job.finishedAt = new Date().toISOString();

  if (code === 0) {
    job.status = "done";
  } else {
    job.status = "error";
    job.error = stderr || `Process exited with code ${code}`;
    console.error(stderr);
  }
});


router.get("/status/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  res.json({ jobId: req.params.jobId, ...job });
});

module.exports = router;
