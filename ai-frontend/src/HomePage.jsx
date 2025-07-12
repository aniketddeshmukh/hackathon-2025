import React, { useState, useRef, useEffect } from "react";
import { VideoOff } from "lucide-react";
import MicButtonWithWave from "./MicButtonWithWave";
import VideoToggleButton from "./VideoToggleButton";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsUploading(true);
    try {
      const response = await fetch("http://localhost:8000/upload_resume", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      alert("✅ Resume uploaded successfully!");
      setResumeUploaded(true);
    } catch (error) {
      console.error("❌ Upload error:", error);
      alert("❌ Resume upload failed.");
      setResumeUploaded(false);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;

        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 64;

        source.connect(analyserRef.current);

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const detectAudio = () => {
          analyserRef.current.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(avg);
          requestAnimationFrame(detectAudio);
        };

        detectAudio();
      })
      .catch((err) => console.error("🎤 Media access error:", err));
  }, []);

  const handleJoin = () => {
    if (!resumeUploaded) {
      alert("⚠️ Please upload your resume first.");
      return;
    }
    navigate("/interview");
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-row p-8">
      {/* Left Section */}
      <div className="w-2/3 flex flex-col justify-center items-center">
        <h1 className="text-2xl font-bold mb-6 text-center w-full mt-8">
          AI Interview: Software Engineer - Job ID - AA1122
        </h1>

        <div className="rounded-xl overflow-hidden w-full max-w-2xl aspect-video bg-gray-900 mb-6">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`${
              videoOn ? "block" : "hidden"
            } w-full h-full object-cover`}
          />
          {!videoOn && (
            <div className="flex items-center justify-center w-full h-full bg-gray-700">
              <VideoOff className="h-12 w-12 text-white" />
            </div>
          )}
        </div>

        <div className="flex gap-10 mt-4">
          <MicButtonWithWave />
          <VideoToggleButton videoOn={videoOn} setVideoOn={setVideoOn} />
        </div>
      </div>

      {/* Right Section */}
      <div className="w-2/3 flex flex-col justify-between pl-10 mr-2">
        <div className="mt-20">
          <h2 className="text-3xl font-semibold mb-10">Guidelines:</h2>
          <ul className="text-xl space-y-3 list-disc list-inside">
            <li>Before joining, allow camera and mic access.</li>
            <li>Do not turn off your mic or camera.</li>
            <li>Ensure stable internet connection.</li>
            <li>Stay visible and audible throughout.</li>
            <li>Answer clearly, you're being graded.</li>
            <li>Don't refresh or leave once joined.</li>
          </ul>
        </div>

        <div className="flex flex-col items-center gap-4 mt-6">
          <label className="font-medium mb-1">Upload Resume (PDF)</label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={isUploading}
            className="text-sm"
          />
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={`px-6 py-2 rounded-lg transition ${
              isUploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isUploading ? "Uploading..." : "Upload Resume"}
          </button>
        </div>

        <button
          onClick={handleJoin}
          disabled={!resumeUploaded}
          className={`py-3 px-4 mt-10 rounded-lg font-semibold transition-all duration-200 mb-20 ${
            resumeUploaded
              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90"
              : "bg-gray-400 text-white cursor-not-allowed"
          }`}
        >
          {resumeUploaded ? "Join Interview" : "Upload Resume to Proceed"}
        </button>
      </div>
    </div>
  );
}
