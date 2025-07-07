import { Video, VideoOff } from "lucide-react"; // Or your preferred icon lib

export default function VideoToggleButton({ videoOn, setVideoOn }) {
  return (
    <button
      onClick={() => setVideoOn(!videoOn)}
      className="relative w-16 h-16 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-md"
    >
      {videoOn ? (
        <Video className="w-6 h-6 z-10" />
      ) : (
        <VideoOff className="w-6 h-6 z-10" />
      )}

      <div
        className={`absolute rounded-full ${
          videoOn ? "bg-blue-500" : "bg-gray-500"
        } opacity-40 animate-pulse`}
        style={{
          width: "60px",
          height: "60px",
        }}
      />
    </button>
  );
}
