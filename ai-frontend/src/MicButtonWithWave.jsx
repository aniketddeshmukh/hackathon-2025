import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';

export default function MicButtonWithWave() {
  const [micOn, setMicOn] = useState(true);
  const [intensity, setIntensity] = useState(0);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const recognitionRef = useRef(null);
  const animationIdRef = useRef(null);

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 64;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      sourceRef.current = source;

      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        setIntensity(avg);
        animationIdRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopMic = () => {
    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    setIntensity(0);
  };

  const toggleMic = () => {
    const newState = !micOn;
    setMicOn(newState);

    if (newState) {
      startMic();
      recognitionRef.current?.start();
    } else {
      stopMic();
      recognitionRef.current?.stop();
    }
  };

  // 🔊 Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      console.log("🎤 Recognized:", transcript);

      // 🧠 Prevent speech loop (avoid sending while AI is talking)
      if (window._isSpeaking) return;

      const socket = window.socketRef;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(transcript); // ✅ Send to backend

        if (window.addUserMessage) {
          window.addUserMessage(transcript); // ✅ Display in UI
        }
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    recognitionRef.current = recognition;

    // 👂 Global controls so other components can control speech
    window.startListening = () => {
      try {
        recognition.start();
      } catch (err) {
        console.warn("Recognition already started:", err);
      }
    };

    window.stopListening = () => {
      try {
        recognition.stop();
      } catch (err) {
        console.warn("Recognition already stopped:", err);
      }
    };

    if (micOn) {
      startMic();
      recognition.start();
    }

    return () => {
      recognition.stop();
      stopMic();
    };
  }, []);


  return (
    <button
      onClick={toggleMic}
      className="relative w-16 h-16 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-md"
    >
      <FontAwesomeIcon
        icon={micOn ? faMicrophone : faMicrophoneSlash}
        size="lg"
        className="z-10"
      />
      {micOn && (
        <div
          className="absolute rounded-full bg-blue-500 opacity-40 animate-pulse"
          style={{
            width: `${40 + intensity}px`,
            height: `${40 + intensity}px`,
            transition: 'all 0.1s ease-out',
          }}
        />
      )}
    </button>
  );
}
