import { Loader2 } from "lucide-react"; // from lucide-react icons

export default function Loading({ text = "Please wait..." }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/70 z-50">
      <Loader2 className="w-10 h-10 text-white animate-spin" />
      <p className="text-white mt-4">{text}</p>
    </div>
  );
}
