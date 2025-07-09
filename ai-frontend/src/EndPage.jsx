// src/EndPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function EndPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center">
      <div className=" p-10 rounded-xl shadow-lg text-center max-w-md">
        <h1 className="text-3xl font-bold mb-4 text-indigo-400">
          🎉 Thank You!
        </h1>
        <p className="text-lg mb-6">
          Your interview has been successfully submitted. We appreciate your time and effort.
        </p>
        <p className="text-sm text-gray-400 mb-6">
          You'll receive an update from us shortly.
        </p>
        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-black px-6 py-2 rounded-lg transition-all"
          onClick={() => window.open('https://www.google.com', '_blank')}
        >
          Home Page
        </button>
      </div>
    </div>
  );
}
