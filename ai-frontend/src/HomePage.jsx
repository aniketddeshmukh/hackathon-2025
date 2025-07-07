
import React, { useState, useRef, useEffect } from "react";
import { VideoOff } from "lucide-react";
import MicButtonWithWave from "./MicButtonWithWave";
import VideoToggleButton from "./VideoToggleButton";
import InterviewPage from "./InterviewPage";
import { useNavigate } from "react-router-dom"; // Add at the top


export default function HomePage() {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [joined, setJoined] = useState(false);
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const navigate = useNavigate(); // Define this at the top inside your HomePage component


  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

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
      .catch((err) => {
        console.error("Error accessing media devices.", err);
      });
  }, []);




  // Inside component

  const handleBtn = () => {
    navigate("/interview");
  };



  return (
    <div className="min-h-screen bg-black text-white flex flex-row p-8">
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
            className={`${videoOn ? "block" : "hidden"
              } w-full h-full object-cover`}
          />
          {!videoOn && (
            <div className="flex items-center justify-center w-full h-full bg-gray-700">
              <VideoOff className="h-12 w-12 text-white" />
            </div>
          )}
        </div>

        {/* Mic/Video Buttons */}
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
            <li>Before joining the interview, allow camera and mic access.</li>
            <li>Don’t turn off your microphone or camera during the interview.</li>
            <li>Ensure a good internet connection.</li>
            <li>Be clearly visible and audible before joining.</li>
            <li>You'll be graded, so answer thoughtfully.</li>
            <li>Do not refresh or leave the page once joined.</li>
          </ul>
        </div>

        <button
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 mt-10 rounded-lg font-semibold hover:opacity-90 transition-all duration-200 mb-20"
          onClick={() => handleBtn()}
        >
          Join Meeting
        </button>
      </div>
    </div>
  );
}
