// LeftSidebar.jsx
import React from "react";
import { LogOut, Clock } from "lucide-react";

const LeftSidebar = () => {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-gray-900 text-white w-1/5 min-h-screen p-4 flex flex-col gap-6">
      {/* UBS Logo */}
      <div className="flex justify-center">
        <img
          src="https://assets.weforum.org/organization/image/responsive_medium_webp_UjH2GvSx-UBS-Switzerland-AG.webp"
          alt="UBS Logo"
          className="h-12"
        />
      </div>

      {/* Date */}
      <div className="text-sm text-center text-gray-300">{today}</div>

      {/* Candidate Details */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Candidate Details</h2>
        <p><strong>Name:</strong> Harsh Soni</p>
        <p><strong>Email:</strong> harsh.soni@test.com</p>
        <p><strong>Phone:</strong> +91-9612345678</p>
      </div>

      {/* Job Details */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Job Details</h2>
        <p><strong>Id:</strong> TEST123</p>
        <p><strong>Company:</strong> Anthropic</p>
        <p><strong>Email:</strong> ken.adams@anthropic.com</p>
        <p><strong>Role:</strong> Software Engineer</p>
      </div>

      {/* Time Elapsed */}
      <div className="bg-gray-800 p-4 rounded-lg flex items-center gap-2">
        <Clock className="text-white" />
        <span className="text-lg font-bold">00:37</span>
      </div>

      {/* Leave Interview */}
      <button className="mt-auto bg-red-600 hover:bg-red-700 text-white py-2 rounded flex items-center justify-center gap-2">
        <LogOut className="h-5 w-5" />
        Leave Interview
      </button>
    </div>
  );
};

export default LeftSidebar;
