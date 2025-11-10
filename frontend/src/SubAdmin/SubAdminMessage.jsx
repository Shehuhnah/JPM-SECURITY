import { Search, CircleUserRound, Paperclip, Send } from "lucide-react";

export default function SubAdminMessage() {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0f172a] text-gray-100">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-[#0b1220] border-r border-gray-800 flex flex-col">
        <h2 className="p-4 text-lg font-bold text-gray-100 bg-gradient-to-r from-[#1e293b] to-[#243447] shadow-md tracking-wide flex items-center justify-between">
          Guards
          <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">
            12 Online
          </span>
        </h2>

        {/* Search */}
        <div className="p-3">
          <div className="flex items-center bg-[#111827] border border-gray-700 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search guards..."
              className="bg-transparent flex-1 ml-2 outline-none text-sm text-gray-200 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Guards List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-[#0b1220]">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="p-3 mb-2 cursor-pointer transition-all rounded-xl border border-transparent hover:bg-[#162236] hover:border-[#1e3a5f]"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="relative">
                  <CircleUserRound strokeWidth={1.5} size={36} className="text-gray-300" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[#0b1220] bg-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-100 font-medium truncate">
                      Guard {i + 1}
                    </span>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                      2m ago
                    </span>
                  </div>
                  <p className="text-sm mt-1 truncate text-gray-400">
                    Received your update, sir.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat Window */}
      <main className="flex-1 flex flex-col bg-[#1e293b] border-l border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 bg-[#0f172a] flex items-center gap-3">
          <CircleUserRound size={38} />
          <div>
            <h3 className="font-semibold text-white mb-1">Guard Jonathan</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full inline-block bg-green-400" />
              <span className="text-xs text-green-400">Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-3 bg-[#0b1220]">
          <div className="flex justify-start items-end gap-2">
            <div className="px-4 py-2 rounded-2xl max-w-xs bg-gray-800 text-gray-200">
              Good evening, sir. Any update on the night shift?
              <div className="text-[10px] text-gray-400 mt-1 text-right">10:22 PM</div>
            </div>
          </div>

          <div className="flex justify-end items-end gap-2">
            <div className="px-4 py-2 rounded-2xl max-w-xs bg-blue-600 text-white">
              Yes, confirm at 11:30 PM. Bring your ID.
              <div className="text-[10px] text-gray-300 mt-1 text-right">10:24 PM</div>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="p-4 border-t border-gray-700 bg-[#1e293b] flex items-center gap-3">
          <label>
            <Paperclip size={20} className="text-gray-400 cursor-pointer hover:text-blue-400" />
          </label>

          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-[#0f172a] border border-gray-700 rounded-full px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button className="bg-gradient-to-r from-[#1B3C53] to-[#456882] p-2 rounded-full hover:brightness-110 transition">
            <Send size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}
