import { useEffect, useMemo, useState } from "react";

type JobState =
  | { phase: "idle" }
  | { phase: "creating" }
  | { phase: "running"; jobId: string; status: string; progress: number }
  | { phase: "done"; jobId: string }
  | { phase: "error"; message: string };

const API = "http://localhost:5050/api";

async function createJob(file: File, targetLang: string, voice: string) {
  const form = new FormData();
  form.append("media", file);
  form.append("targetLang", targetLang);
  form.append("voice", voice);

  const res = await fetch(`${API}/jobs`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to create job");
  return (await res.json()) as { jobId: string };
}

async function getJob(jobId: string) {
  const res = await fetch(`${API}/jobs/${jobId}`);
  if (!res.ok) throw new Error("Job not found");
  return (await res.json()) as {
    id: string;
    status: "queued" | "processing" | "done" | "failed";
    progress: number;
  };
}

function downloadUrl(jobId: string) {
  return `${API}/jobs/${jobId}/download`;
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState("es");
  const [voice, setVoice] = useState("neutral");
  const [job, setJob] = useState<JobState>({ phase: "idle" });

  const canGenerate = useMemo(
    () => !!file && job.phase !== "creating" && job.phase !== "running",
    [file, job]
  );

  async function onGenerate() {
    if (!file) return;
    setJob({ phase: "creating" });
    try {
      const { jobId } = await createJob(file, targetLang, voice);
      setJob({ phase: "running", jobId, status: "queued", progress: 0 });
    } catch (e: any) {
      setJob({ phase: "error", message: e?.message || "Unknown error" });
    }
  }

  useEffect(() => {
    if (job.phase !== "running") return;

    const t = setInterval(async () => {
      try {
        const j = await getJob(job.jobId);
        if (j.status === "done") {
          setJob({ phase: "done", jobId: job.jobId });
        } else {
          setJob({
            phase: "running",
            jobId: job.jobId,
            status: j.status,
            progress: j.progress,
          });
        }
      } catch (e: any) {
        setJob({ phase: "error", message: e?.message || "Polling failed" });
      }
    }, 600);

    return () => clearInterval(t);
  }, [job]);

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Dubby (Demo)</h1>
      <p style={{ opacity: 0.8 }}>
        Mock “AI dubbing” tool built to showcase Cypress E2E testing.
      </p>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
        <label style={{ display: "block", marginBottom: 8 }}>
          Upload media (audio/video)
        </label>

        <input
          data-cy="file-input"
          type="file"
          accept="audio/*,video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        {file && <p data-cy="file-name">Selected: {file.name}</p>}

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <div style={{ flex: 1 }}>
            <label>Target language</label>
            <select
              data-cy="lang-select"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
            >
              <option value="es">Spanish</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
              <option value="fr">French</option>
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label>Voice style</label>
            <select
              data-cy="voice-select"
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
            >
              <option value="neutral">Neutral</option>
              <option value="warm">Warm</option>
              <option value="energetic">Energetic</option>
            </select>
          </div>
        </div>

        <button
          data-cy="generate-btn"
          style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10 }}
          disabled={!canGenerate}
          onClick={onGenerate}
        >
          Generate Dub
        </button>

        <div style={{ marginTop: 16 }}>
          {job.phase === "creating" && <p data-cy="status">Creating job…</p>}

          {job.phase === "running" && (
            <>
              <p data-cy="status">Status: {job.status}</p>
              <p data-cy="progress">Progress: {job.progress}%</p>
            </>
          )}

          {job.phase === "done" && (
            <div>
              <p data-cy="status">Done ✅</p>
              <a data-cy="download-link" href={downloadUrl(job.jobId)}>
                Download dubbed file
              </a>
            </div>
          )}

          {job.phase === "error" && (
            <p data-cy="error">Error: {job.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
