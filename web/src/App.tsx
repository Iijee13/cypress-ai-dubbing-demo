import { useState, useRef } from "react";
import Figma2Background from "./imports/Figma2";
// import { toast } from 'sonner';
import { toast, Toaster } from "sonner";

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [generateSubtitles, setGenerateSubtitles] = useState(true);
  const [jobStatus, setJobStatus] = useState<{
    processing: boolean;
    progress: number;
  } | null>(null);
  const [outputAudio, setOutputAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const API_BASE = "/api";

  const handleFileSelect = (selectedFile: File) => {
    const validTypes = ["audio/mp3", "audio/wav", "audio/mpeg", "video/mp4"];
    const maxSize = 200 * 1024 * 1024; // 200MB

    if (
      !validTypes.includes(selectedFile.type) &&
      !selectedFile.name.match(/\.(mp3|wav|mp4)$/i)
    ) {
      toast.error("Invalid file type. Please upload mp3, wav, or mp4 files.");
      return;
    }

    if (selectedFile.size > maxSize) {
      toast.error("File size exceeds 200MB limit.");
      return;
    }

    setFile(selectedFile);
    toast.success(`File "${selectedFile.name}" uploaded successfully!`);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleUseSampleFile = () => {
    const sampleFile = new File(["sample"], "sample-audio.mp3", {
      type: "audio/mp3",
    });
    setFile(sampleFile);
    toast.success("Sample file loaded!");
  };

  const handleUploadFromYouTube = () => {
    const url = prompt("Enter YouTube URL:");
    if (url) {
      toast.info("YouTube upload feature coming soon!");
    }
  };

  const handleGenerateDub = async () => {
    if (!file) {
      toast.error("Please upload a file first!");
      return;
    }

    try {
      setJobStatus({ processing: true, progress: 0 });
      toast.info("Uploading & starting dubbing job...");

      // 1) Create job
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sourceLanguage", sourceLanguage);
      formData.append("targetLanguage", targetLanguage);
      formData.append("generateSubtitles", String(generateSubtitles));

      const createRes = await fetch(`${API_BASE}/jobs`, {
        method: "POST",
        body: formData,
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        throw new Error(errText || "Failed to create job");
      }

      // Expecting something like: { id: "abc123" }
      const createJson = await createRes.json();
      const jobId = createJson.id || createJson.jobId;

      if (!jobId) throw new Error("Server did not return a job id");

      toast.success("Job created! Processing...");

      // 2) Poll job status
      const pollIntervalMs = 800;
      const poll = async () => {
        const statusRes = await fetch(`${API_BASE}/jobs/${jobId}`);
        if (!statusRes.ok) {
          const errText = await statusRes.text();
          throw new Error(errText || "Failed to fetch job status");
        }

        /**
         * Expecting something like:
         * { processing: true, progress: 40 }
         * OR { status: "processing", progress: 40 }
         * OR { status: "done", progress: 100, outputUrl: "/api/jobs/abc/output" }
         */
        const s = await statusRes.json();

        const progress =
          typeof s.progress === "number"
            ? s.progress
            : typeof s.percent === "number"
              ? s.percent
              : 0;

        const processing =
          typeof s.processing === "boolean"
            ? s.processing
            : s.status === "processing" || s.status === "running";

        setJobStatus({ processing: !!processing, progress });

        // Done conditions
        const done =
          s.status === "done" ||
          s.status === "completed" ||
          processing === false ||
          progress >= 100;

        if (done) {
          setJobStatus({ processing: false, progress: 100 });

          // Prefer server-provided URL if exists
          const outputUrl =
            s.outputUrl ||
            s.output_audio_url ||
            `${API_BASE}/jobs/${jobId}/output`;

          setOutputAudio(outputUrl);
          toast.success("Dubbing completed!");
          return;
        }

        // keep polling
        setTimeout(poll, pollIntervalMs);
      };

      poll();
    } catch (err: any) {
      console.error(err);
      setJobStatus(null);
      toast.error(`Dub failed: ${err?.message || "Unknown error"}`);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);

    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }

    toast.info(`Playback speed: ${nextSpeed}×`);
  };

  const handleExportAudio = () => {
    if (!outputAudio) {
      toast.error("No audio to export. Generate a dub first!");
      return;
    }

    const link = document.createElement("a");
    link.href = outputAudio;
    link.download = "dubbed-audio.mp3";
    document.body.appendChild(link);
    link.click();
    link.remove();

    toast.success("Downloading...");
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0B0F14]">
      {/* Figma Static Design */}
      <Figma2Background />
      <Toaster richColors />
      {/* Invisible Interactive Overlays - positioned to match Figma design */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.mp4"
        onChange={handleFileInputChange}
        className="hidden"
        data-cy="file-input"
      />

      {/* Upload Area - clickable zone over the drop area */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="absolute cursor-pointer bg-transparent border-none"
        style={{ inset: "22.33% 59.44% 47.67% 6.25%" }}
        data-cy="upload-area"
        aria-label="Upload file"
      />

      {/* Use Sample File Button */}
      <button
        onClick={handleUseSampleFile}
        className="absolute cursor-pointer bg-transparent border-none"
        style={{ inset: "39.89% 77.34% 55.23% 11.6%" }}
        data-cy="use-sample-btn"
        aria-label="Use sample file"
      />

      {/* Upload from YouTube Button */}
      <button
        onClick={handleUploadFromYouTube}
        className="absolute cursor-pointer bg-transparent border-none"
        style={{ inset: "39.89% 64.35% 55.23% 25%" }}
        data-cy="youtube-upload-btn"
        aria-label="Upload from YouTube"
      />

      {/* Source Language Dropdown */}
      <select
        value={sourceLanguage}
        onChange={(e) => setSourceLanguage(e.target.value)}
        className="absolute cursor-pointer bg-transparent border-none text-transparent appearance-none"
        style={{ inset: "60.89% 76.67% 34.22% 6.67%" }}
        data-cy="source-language-select"
      >
        <option value="auto">Auto detect</option>
        <option value="en">English (en)</option>
        <option value="es">Spanish (es)</option>
        <option value="fr">French (fr)</option>
        <option value="de">German (de)</option>
        <option value="it">Italian (it)</option>
        <option value="pt">Portuguese (pt)</option>
        <option value="ja">Japanese (ja)</option>
        <option value="ko">Korean (ko)</option>
        <option value="zh">Chinese (zh)</option>
      </select>

      {/* Target Language Dropdown */}
      <select
        value={targetLanguage}
        onChange={(e) => setTargetLanguage(e.target.value)}
        className="absolute cursor-pointer bg-transparent border-none text-transparent appearance-none"
        style={{ inset: "60.56% 59.44% 34.56% 23.89%" }}
        data-cy="target-language-select"
      >
        <option value="es">Spanish (es)</option>
        <option value="en">English (en)</option>
        <option value="fr">French (fr)</option>
        <option value="de">German (de)</option>
        <option value="it">Italian (it)</option>
        <option value="pt">Portuguese (pt)</option>
        <option value="ja">Japanese (ja)</option>
        <option value="ko">Korean (ko)</option>
        <option value="zh">Chinese (zh)</option>
      </select>

      {/* Generate Subtitles Toggle */}
      <button
        onClick={() => setGenerateSubtitles(!generateSubtitles)}
        className="absolute cursor-pointer bg-transparent border-none"
        style={{ inset: "69.67% 68.89% 24.33% 14.44%" }}
        data-cy="generate-subtitles-toggle"
        aria-label="Toggle generate subtitles"
      />

      {/* Generate Dub Button */}
      <button
        onClick={handleGenerateDub}
        disabled={!file || jobStatus?.processing}
        className="absolute cursor-pointer bg-transparent border-none disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ inset: "85.56% 59.51% 8.67% 6.04%" }}
        data-cy="generate-dub-btn"
        aria-label="Generate dub"
      />

      {/* Play Button */}
      <button
        onClick={togglePlayback}
        disabled={!outputAudio}
        className="absolute cursor-pointer bg-transparent border-none disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ inset: "78.33% 29.22% 17.95% 63.19%" }}
        data-cy="play-btn"
        aria-label={isPlaying ? "Pause" : "Play"}
      />

      {/* Speed Button */}
      <button
        onClick={cycleSpeed}
        disabled={!outputAudio}
        className="absolute cursor-pointer bg-transparent border-none disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ inset: "78.33% 19.94% 17.95% 71.63%" }}
        data-cy="speed-btn"
        aria-label="Change playback speed"
      />

      {/* Export Audio Button */}
      <button
        onClick={handleExportAudio}
        disabled={!outputAudio}
        className="absolute cursor-pointer bg-transparent border-none disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ inset: "85.56% 11.81% 8.67% 53.75%" }}
        data-cy="export-audio-btn"
        aria-label="Export audio"
      />

      {/* Hidden audio element */}
      {outputAudio && (
        <audio
          ref={audioRef}
          src={outputAudio}
          onEnded={() => setIsPlaying(false)}
        />
      )}
    </div>
  );
}
