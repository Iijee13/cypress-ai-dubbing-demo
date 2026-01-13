import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.join(process.cwd(), "uploads");
const outDir = path.join(process.cwd(), "outputs");
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const upload = multer({ dest: uploadDir });

type JobStatus = "queued" | "processing" | "done" | "failed";
type Job = {
  id: string;
  status: JobStatus;
  progress: number;
  targetLang: string;
  voice: string;
  outputFile?: string;
};

const jobs = new Map<string, Job>();

function makeId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

app.post("/api/jobs", upload.single("media"), (req, res) => {
  const targetLang = String(req.body.targetLang || "es");
  const voice = String(req.body.voice || "neutral");
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const id = makeId();
  const job: Job = { id, status: "queued", progress: 0, targetLang, voice };
  jobs.set(id, job);

  setTimeout(() => {
    const j = jobs.get(id);
    if (!j) return;
    j.status = "processing";
    j.progress = 25;
  }, 600);

  setTimeout(() => {
    const j = jobs.get(id);
    if (!j) return;
    j.progress = 60;
  }, 1500);

  setTimeout(() => {
    const j = jobs.get(id);
    if (!j) return;

    const outName = `dubbed-${id}-${path.basename(req.file!.originalname)}`;
    const outPath = path.join(outDir, outName);
    fs.copyFileSync(req.file!.path, outPath);

    j.status = "done";
    j.progress = 100;
    j.outputFile = outName;
  }, 2600);

  res.json({ jobId: id });
});

app.get("/api/jobs/:id", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

app.get("/api/jobs/:id/download", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job || job.status !== "done" || !job.outputFile) {
    return res.status(400).json({ error: "Job not ready" });
  }
  const filePath = path.join(outDir, job.outputFile);
  res.download(filePath, job.outputFile);
});

const PORT = 5050;
app.listen(PORT, () => console.log(`API running: http://localhost:${PORT}`));

