import { useState, useRef } from "react";
import Figma2Background from "./imports/Figma2";
import { Upload, Play, Pause } from "lucide-react";
import { toast } from "sonner";

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
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

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
    // Simulate loading a sample file
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
      // Here you would call your API to download from YouTube
    }
  };

  const handleGenerateDub = async () => {
    if (!file) {
      toast.error("Please upload a file first!");
      return;
    }

    // Simulate API call
    setJobStatus({ processing: true, progress: 0 });
    toast.info("Starting dubbing process...");

    // Simulate progress
    const interval = setInterval(() => {
      setJobStatus((prev) => {
        if (!prev) return null;
        const newProgress = Math.min(prev.progress + 10, 100);

        if (newProgress === 100) {
          clearInterval(interval);
          setTimeout(() => {
            setJobStatus({ processing: false, progress: 100 });
            setOutputAudio("sample-output.mp3"); // Simulated output
            toast.success("Dubbing completed!");
          }, 500);
        }

        return { ...prev, progress: newProgress };
      });
    }, 800);

    // In your real implementation, call your API here:
    // const formData = new FormData();
    // formData.append('file', file);
    // formData.append('sourceLanguage', sourceLanguage);
    // formData.append('targetLanguage', targetLanguage);
    // formData.append('generateSubtitles', generateSubtitles.toString());
    //
    // const response = await fetch('YOUR_API_ENDPOINT', {
    //   method: 'POST',
    //   body: formData
    // });
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
    if (outputAudio) {
      toast.success("Exporting audio...");
      // In real implementation, trigger download
      // const link = document.createElement('a');
      // link.href = outputAudioUrl;
      // link.download = 'dubbed-audio.mp3';
      // link.click();
    } else {
      toast.error("No audio to export. Generate a dub first!");
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0B0F14]">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <Figma2Background />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full h-full flex flex-col p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#59E3FF] via-[#B56BFF] to-[#FF5AA5]" />
          <h1 className="text-[18px] font-bold italic text-[#EAF0FF]">
            Dubbing AI
          </h1>
        </div>

        <div className="flex gap-6 flex-1">
          {/* Left Panel - Create a Dub */}
          <div className="flex-1 flex flex-col gap-6">
            <h2 className="text-[18px] font-bold italic text-[#EAF0FF]">
              Create a Dub
            </h2>

            {/* Upload Section */}
            <div
              className={`relative rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm p-8 transition-all ${
                isDragging ? "border-[#59E3FF] bg-white/10" : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              data-cy="upload-area"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.mp4"
                onChange={handleFileInputChange}
                className="hidden"
                data-cy="file-input"
              />

              <div className="flex flex-col items-center justify-center min-h-[200px]">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#59E3FF] via-[#B56BFF] to-[#FF5AA5] flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-white" />
                </div>

                <p className="text-[14px] font-bold italic text-white mb-1">
                  {file ? file.name : "Drop file here or click to upload"}
                </p>
                <p className="text-[12px] text-white/70">
                  Supports mp3, wav, mp4 • Max 200MB
                </p>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUseSampleFile();
                    }}
                    className="px-4 py-2 rounded-lg border border-white/25 bg-white/10 text-[12px] text-white hover:bg-white/20 transition-colors"
                    data-cy="use-sample-btn"
                  >
                    Use sample file
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUploadFromYouTube();
                    }}
                    className="px-4 py-2 rounded-lg border border-white/25 bg-white/10 text-[12px] text-white hover:bg-white/20 transition-colors"
                    data-cy="youtube-upload-btn"
                  >
                    Upload from YouTube
                  </button>
                </div>
              </div>
            </div>

            {/* Settings Section */}
            <div>
              <h3 className="text-[14px] font-bold italic text-white mb-4">
                Settings
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Source Language */}
                <div>
                  <label className="text-[12px] text-white/70 mb-2 block">
                    Source language
                  </label>
                  <select
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-white/25 bg-white/10 text-[14px] font-bold italic text-white focus:outline-none focus:border-[#59E3FF] appearance-none cursor-pointer"
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
                </div>

                {/* Target Language */}
                <div>
                  <label className="text-[12px] text-white/70 mb-2 block">
                    Target language
                  </label>
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-white/25 bg-white/10 text-[14px] font-bold italic text-white focus:outline-none focus:border-[#59E3FF] appearance-none cursor-pointer"
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
                </div>
              </div>

              {/* Generate Subtitles Toggle */}
              <div className="flex items-center gap-3 p-4 rounded-lg border border-white/20 bg-white/5">
                <p className="text-[14px] font-bold italic text-white flex-1">
                  Generate subtitles
                </p>
                <button
                  onClick={() => setGenerateSubtitles(!generateSubtitles)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    generateSubtitles
                      ? "bg-gradient-to-r from-[#59E3FF] via-[#7C5CFF] to-[#FF4DA0]"
                      : "bg-white/20"
                  }`}
                  data-cy="generate-subtitles-toggle"
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-[#0B0F14] transition-transform ${
                      generateSubtitles ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Generate Dub Button */}
            <button
              onClick={handleGenerateDub}
              disabled={!file || jobStatus?.processing}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#59E3FF] via-[#7C5CFF] to-[#FF4DA0] text-[14px] font-bold italic text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              data-cy="generate-dub-btn"
            >
              Generate Dub ↵
            </button>
          </div>

          {/* Right Panel - Job Status & Output */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Job Status */}
            <div className="rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm p-6">
              <h3 className="text-[14px] font-bold italic text-white mb-4">
                Job status
              </h3>
              {jobStatus ? (
                <>
                  <p className="text-[12px] text-white/70 mb-4">
                    {jobStatus.processing
                      ? `Processing… ${jobStatus.progress}%`
                      : "Complete!"}
                  </p>
                  <div className="w-full h-7 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#59E3FF] via-[#B56BFF] to-[#FF5AA5] transition-all duration-300"
                      style={{ width: `${jobStatus.progress}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-[12px] text-white/70">No active jobs</p>
              )}
            </div>

            {/* Output Section */}
            <div className="flex-1 flex flex-col">
              <h2 className="text-[18px] font-bold italic text-[#EAF0FF] mb-4">
                Output
              </h2>

              <div className="flex-1 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm p-6 flex flex-col">
                <p className="text-[12px] text-white/70 mb-4">Preview</p>

                {/* Waveform Visualization */}
                <div className="flex-1 flex items-center justify-center mb-6">
                  <div
                    className="flex items-end gap-1 h-16"
                    style={{ opacity: outputAudio ? 0.7 : 0.3 }}
                  >
                    {Array.from({ length: 32 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-white/25 rounded-full transition-all"
                        style={{
                          height: `${Math.random() * 100}%`,
                          animation: isPlaying
                            ? `pulse ${1 + Math.random()}s ease-in-out infinite`
                            : "none",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Audio Controls */}
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={togglePlayback}
                    disabled={!outputAudio}
                    className="px-6 py-2 rounded-lg border border-white/25 bg-white/10 text-[14px] font-bold italic text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    data-cy="play-btn"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {isPlaying ? "Pause" : "Play"}
                  </button>
                  <button
                    onClick={cycleSpeed}
                    disabled={!outputAudio}
                    className="px-6 py-2 rounded-lg border border-white/25 bg-white/10 text-[14px] font-bold italic text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    data-cy="speed-btn"
                  >
                    {playbackSpeed}× speed
                  </button>
                </div>

                {/* Export Button */}
                <button
                  onClick={handleExportAudio}
                  disabled={!outputAudio}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#59E3FF] via-[#7C5CFF] to-[#FF4DA0] text-[14px] font-bold italic text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  data-cy="export-audio-btn"
                >
                  Export audio ↵
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Tip */}
        <div className="mt-4 text-[12px] text-white/50">
          Tip: Use data-cy attributes on buttons and inputs for Cypress tests
          (upload → generate → export).
        </div>
      </div>

      {/* Hidden audio element for playback */}
      {outputAudio && (
        <audio
          ref={audioRef}
          src={outputAudio}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
        
        select option {
          background: #0B0F14;
          color: white;
        }
      `}</style>
    </div>
  );
}
