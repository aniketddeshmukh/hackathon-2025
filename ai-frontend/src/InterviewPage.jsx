import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MicButtonWithWave from "./MicButtonWithWave";
import VideoToggleButton from "./VideoToggleButton";
import { VideoOff } from "lucide-react";

export default function InterviewPage() {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [messages, setMessages] = useState([]);
  const [seconds, setSeconds] = useState(0);
  const [videoOn, setVideoOn] = useState(true);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Camera
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((mediaStream) => {
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      })
      .catch((err) => {
        console.error("Camera access denied:", err);
        setVideoOn(false);
      });
  }, []);

  // WebSocket setup
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws/interview");
    socketRef.current = socket;
    window.socketRef = socket;

    socket.onopen = () => console.log("✅ WebSocket connected");

    socket.onmessage = (event) => {
      const msg = event.data;

      if (msg.startsWith("__USER__::")) {
        const userText = msg.replace("__USER__::", "");
        console.log("👤 User:", userText);
        setMessages((prev) => [...prev, { role: "user", text: userText }]);
      } else {
        console.log("🤖 AI:", msg);
        setMessages((prev) => [...prev, { role: "ai", text: msg }]);
        // No speech synthesis in frontend — handled by Azure backend
      }
    };

    socket.onclose = () => console.log("❌ WebSocket closed");
    socket.onerror = (err) => console.error("WebSocket error:", err);

    return () => socket.close();
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Allow speech recog to add user msg
  useEffect(() => {
    window.addUserMessage = (text) => {
      setMessages((prev) => [...prev, { role: "user", text }]);
    };
  }, []);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60).toString().padStart(2, "0");
    const secs = (s % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleLeave = () => {
    stream?.getTracks().forEach((track) => track.stop());
    socketRef.current?.close();
    speechSynthesis.cancel(); // cancel any speech that might be queued
    navigate("/end");
  };

  const handleSendMessage = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      const text = e.target.value.trim();
      setMessages((prev) => [...prev, { role: "user", text }]);
      socketRef.current?.send(text);
      e.target.value = "";
    }
  };

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/4 bg-gray-900 p-6 flex flex-col justify-between">
        <div>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/3/34/UBS_Logo.png"
            alt="Company Logo"
            className="w-80 h-300 mb-10 ml-3 rounded-md"
          />
          <h2 className="font-[1000] text-center text-gray-300 mb-6">{today}</h2>

          <div className="mb-10 p-4 bg-gray-800 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-1">Candidate Details</h3>
            <p className="text-sm">Name: Aniket</p>
            <p className="text-sm">Email: aniket@gmail.com</p>
            <p className="text-sm">Phone: +91-96****</p>
          </div>

          <div className="p-4 bg-gray-800 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-1">Job Details</h3>
            <p className="text-sm">ID: TEST123</p>
            <p className="text-sm">Company: UBS</p>
            <p className="text-sm">HR Email: aniket@ubs.com</p>
            <p className="text-sm">Role: Software Engineer</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-mono">
            ⏱ <span>{formatTime(seconds)}</span>
          </div>
          <button
            className="bg-red-600 hover:bg-red-700 w-full py-2 rounded-md font-semibold"
            onClick={handleLeave}
          >
            Leave Interview
          </button>
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 p-6 flex flex-col justify-between bg-gray-950">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 rounded-lg bg-gray-900 p-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs sm:max-w-md md:max-w-lg px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap
                ${msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-gray-700 text-white rounded-bl-none"
                  }`}
              >
                <p className="text-xs mb-1 font-semibold">
                  {msg.role === "user" ? "You" : "AI Interviewer"}
                </p>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Message input */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Type your answer and press Enter..."
            className="w-full p-3 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={handleSendMessage}
          />
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-1/5 bg-gray-900 p-4 flex flex-col items-center gap-8">
        <div className="rounded-xl mt-10 overflow-hidden w-full max-w-2xl aspect-video bg-gray-900 mb-6">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`${videoOn ? "block" : "hidden"} w-full h-full object-cover`}
          />
          {!videoOn && (
            <div className="flex items-center justify-center w-full h-full bg-gray-700">
              <VideoOff className="h-12 w-12 text-white" />
            </div>
          )}
        </div>
        <p className="text-xl -mt-8">Aniket Deshmukh</p>

        <div className="flex flex-col items-center">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/3/34/UBS_Logo.png"
            alt="AI Interviewer"
            className="rounded-xl overflow-hidden w-full max-w-2xl aspect-video bg-gray-900 mb-6 mt-10"
          />
          <p className="mt-1 text-xl">AI Interviewer</p>
        </div>

        <div className="flex gap-10 mt-4">
          <MicButtonWithWave />
          <VideoToggleButton videoOn={videoOn} setVideoOn={setVideoOn} />
        </div>
      </div>
    </div>
  );
}
