import { useState, useEffect, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { Send, FileSymlink } from "lucide-react";

export default function ApplicantsMessages() {
  const [messages, setMessages] = useState([
    { sender: "admin", text: "Good day! How can we assist you with your job application today?" },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    document.title = "Messages | JPM Security Agency";
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();

    // If no name yet, show modal
    if (!applicantName.trim()) {
      setIsModalOpen(true);
      return;
    }

    if (!newMessage.trim()) return;

    const message = { sender: applicantName, text: newMessage };
    setMessages((prev) => [...prev, message]);
    setNewMessage("");

    // Simulate admin reply (demo only)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "admin", text: "Thank you for reaching out. We’ll get back to you shortly." },
      ]);
    }, 1500);
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (applicantName.trim()) {
      setIsModalOpen(false);
    }
  };

  return (
    <div className="bg-[#0f172a] min-h-screen flex flex-col text-gray-100">
      {/* Header */}
      <header className="bg-[#10263a] py-4 px-4 text-center border-b border-blue-500/40 shadow-md sticky top-0 z-10">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Messages</h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Chat with our recruitment team directly
        </p>
      </header>

      {/* Chat Container */}
      <main className="flex-grow flex justify-center px-2 sm:px-4 py-6 sm:py-10">
        <div className="w-full max-w-3xl bg-[#1e293b]/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-700 flex flex-col overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-transparent">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.sender === "admin" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-md p-3 sm:p-4 rounded-xl shadow-sm text-sm sm:text-base leading-relaxed
                    ${
                      msg.sender === "admin"
                        ? "bg-gray-700 text-gray-100 rounded-bl-none"
                        : "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-none"
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 sm:gap-3 p-2 sm:p-4 border-t border-gray-700 bg-[#111827]"
          >
            {/* File Upload */}
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-[#0f172a] border border-gray-700 rounded-lg p-2 sm:p-2.5 hover:bg-blue-600/20 transition relative group flex-shrink-0"
            >
              <FileSymlink className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition" />
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    alert(`📎 Attached: ${file.name}`);
                    // TODO: handle file upload logic
                  }
                }}
              />
            </label>

            {/* Text Input */}
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-[#0f172a] border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Send Button */}
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 p-2 sm:p-2.5 rounded-lg transition-transform transform hover:-translate-y-0.5 shadow-md flex-shrink-0"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#10263a] py-3 text-center border-t border-gray-800 text-gray-500 text-[10px] sm:text-xs">
        © {new Date().getFullYear()} JPM Security Agency — Professional Recruitment Portal
      </footer>

      {/* ===== Name Prompt Modal ===== */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsModalOpen(false)} // ✅ Enables Esc & outside click close
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            {/* Background overlay */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          {/* Centered modal content */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md bg-[#1e293b] rounded-2xl p-6 text-center shadow-lg border border-blue-800/40">
                <Dialog.Title className="text-lg font-bold text-white mb-2">
                  Welcome Applicant
                </Dialog.Title>
                <p className="text-sm text-gray-400 mb-4">
                  Please enter your full name before starting the chat.
                </p>

                <form onSubmit={handleNameSubmit} className="space-y-4">
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2 rounded-md bg-[#0f172a] text-gray-200 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-2 rounded-md transition"
                  >
                    Continue
                  </button>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
