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

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

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

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws/interview");
    socketRef.current = socket;
    window.socketRef = socket;

    socket.onopen = () => console.log("✅ WebSocket connected");

    socket.onmessage = (event) => {
      const msg = event.data;
      if (msg.startsWith("__USER__::")) {
        const userText = msg.replace("__USER__::", "");
        setMessages((prev) => [...prev, { role: "user", text: userText }]);
      } else {
        setMessages((prev) => [...prev, { role: "ai", text: msg }]);
      }
    };

    socket.onclose = () => console.log("❌ WebSocket closed");
    socket.onerror = (err) => console.error("WebSocket error:", err);

    return () => socket.close();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    window.addUserMessage = (text) => {
      setMessages((prev) => [...prev, { role: "user", text }]);
    };
  }, []);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const secs = (s % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleLeave = () => {
    stream?.getTracks().forEach((track) => track.stop());
    socketRef.current?.close();
    speechSynthesis.cancel();
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
    <div className="h-screen bg-white text-black flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/4 p-6 flex flex-col justify-between bg-white border-r border-gray-200 shadow-sm">
        <div>
          {/* Logo */}
          <img
            src=".\gemini2.png"
            alt="Company Logo"
            className="w-65 h-auto mb-2 rounded-xl mx-auto "
          />

          {/* Date */}
          <h2 className="text-center text-lg font-medium text-black-500 mb-6 ">
            {today}
          </h2>

          {/* Candidate Details */}
          <div className="mb-6 p-4 bg-slate-200 border border-black rounded-xl shadow-sm">
            <h3 className="text-md font-semibold text-gray-800 mb-2">
              🎓 Candidate
            </h3>
            <p className="text-sm text-gray-600">Name: Aniket</p>
            <p className="text-sm text-gray-600">Email: aniket@gmail.com</p>
            <p className="text-sm text-gray-600">Phone: +91-9666666666</p>
          </div>

          {/* Job Details */}
          <div className="p-4 bg-slate-200 border border-black rounded-xl shadow-sm mt-10">
            <h3 className="text-md font-semibold text-gray-800 mb-2">
              🏢 Job Info
            </h3>
            <p className="text-sm text-gray-600">ID: JOB22558</p>
            <p className="text-sm text-gray-600">Company: ABC Bank</p>
            <p className="text-sm text-gray-600">HR Email: aniket@ubs.com</p>
            <p className="text-sm text-gray-600">Role: Software Engineer</p>
          </div>
        </div>

        {/* Footer: Timer + Leave */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-xl font-mono text-black mb-4">
            ⏱ <span>{formatTime(seconds)}</span>
          </div>
          <button
            className="bg-red-500 hover:bg-red-600 w-full py-2 rounded-lg text-white font-semibold shadow-md"
            onClick={handleLeave}
          >
            Leave Interview
          </button>
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 p-6 flex flex-col justify-between bg-white">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 rounded-lg">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs sm:max-w-md md:max-w-lg px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap shadow-md
                ${
                  msg.role === "user"
                    ? "bg-indigo-100 text-black rounded-br-none"
                    : "bg-gray-200 text-black rounded-bl-none"
                }`}
              >
                <p className="text-xs mb-1 font-semibold text-gray-600">
                  {msg.role === "user" ? "You" : "AI Interviewer"}
                </p>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="mt-4">
          {/* <input
            type="text"
            placeholder="Type your answer and press Enter..."
            className="w-full p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black bg-white"
            onKeyDown={handleSendMessage}
          /> */}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-1/5 p-4 flex flex-col items-center gap-6 bg-gradient-to-b bg-white border-l">
        <p className="text-3xl font-extrabold text-black tracking-tight mt-10 mb-4 text-center">
          MyAI Interviewer
        </p>

        <div className="rounded-xl mt-28 overflow-hidden w-full max-w-2xl aspect-video bg-gray-200 mb-6 border border-black">
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
            <div className="flex items-center justify-center w-full h-full bg-gray-300">
              <VideoOff className="h-12 w-12 text-gray-600" />
            </div>
          )}
        </div>

        <p className="text-xl font-medium mb-10 text-black">Aniket Deshmukh</p>

        <div className="flex gap-6 ">
          <MicButtonWithWave />
          <VideoToggleButton videoOn={videoOn} setVideoOn={setVideoOn} />
        </div>
      </div>
    </div>
  );
}
