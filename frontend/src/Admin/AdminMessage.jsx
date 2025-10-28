import { useState } from "react";
import { Paperclip, Send, Search } from "lucide-react";

const mockUsers = [
  {
    id: 1,
    name: "Anil",
    avatar: "https://i.pravatar.cc/100?img=1",
    lastMessage: "Copy that, sir.",
    time: "Today, 9:52 PM",
    unread: 0,
    online: true,
  },
  {
    id: 2,
    name: "Chuuthiya",
    avatar: "https://i.pravatar.cc/100?img=2",
    lastMessage: "Roger that.",
    time: "Today, 12:11 PM",
    unread: 1,
  },
  {
    id: 3,
    name: "Mary Ma’am",
    avatar: "https://i.pravatar.cc/100?img=3",
    lastMessage: "Please submit the report ASAP.",
    time: "Today, 2:40 PM",
    unread: 1,
  },
  {
    id: 4,
    name: "Bill Gates",
    avatar: "https://i.pravatar.cc/100?img=4",
    lastMessage: "Good work, team.",
    time: "Yesterday, 12:31 PM",
    unread: 5,
  },
  {
    id: 5,
    name: "Victoria H",
    avatar: "https://i.pravatar.cc/100?img=5",
    lastMessage: "See you at the meeting.",
    time: "Wednesday, 11:12 AM",
    unread: 0,
  },
];

const mockMessages = {
  1: [
    { id: 1, text: "Sir, patrol completed.", time: "8:30 PM", sender: "them" },
    { id: 2, text: "Copy that, good job.", time: "8:33 PM", sender: "me" },
    { id: 3, text: "Any issues reported?", time: "8:34 PM", sender: "me" },
    { id: 4, text: "None so far, sir.", time: "8:36 PM", sender: "them" },
    { id: 5, text: "Alright, continue to next post.", time: "8:58 PM", sender: "me" },
  ],
  2: [
    { id: 1, text: "Hey! How are you?", time: "Yesterday, 7:00 PM", sender: "them" },
    { id: 2, text: "All good. You?", time: "Yesterday, 7:05 PM", sender: "me" },
  ],
};

export default function MessagesPage() {
  const [selectedUser, setSelectedUser] = useState(mockUsers[0]);
  const [messages, setMessages] = useState(mockMessages[selectedUser.id] || []);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg = {
      id: Date.now(),
      text: newMessage,
      time: "Just now",
      sender: "me",
    };
    setMessages([...messages, msg]);
    setNewMessage("");
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-gray-100">
      {/* Sidebar */}
      <aside className="w-72 bg-[#1e293b] border-r border-gray-700 flex flex-col">
        <h2 className="p-4 text-lg font-bold text-white bg-gradient-to-r from-[#1B3C53] to-[#456882] shadow">
          Messages
        </h2>

        {/* Search Bar */}
        <div className="p-3">
          <div className="flex items-center bg-[#0f172a] border border-gray-600 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search guard..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent flex-1 ml-2 outline-none text-sm text-gray-200 placeholder-gray-500"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {mockUsers
            .filter((u) =>
              u.name.toLowerCase().includes(search.toLowerCase())
            )
            .map((user) => (
              <div
                key={user.id}
                onClick={() => {
                  setSelectedUser(user);
                  setMessages(mockMessages[user.id] || []);
                }}
                className={`flex items-center gap-3 p-3 cursor-pointer transition-all ${
                  selectedUser.id === user.id
                    ? "bg-[#1B3C53] text-white"
                    : "hover:bg-[#243447]"
                }`}
              >
                <div className="relative">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full border border-gray-600"
                  />
                  {user.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-[#1e293b]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-gray-400">{user.time}</span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {user.lastMessage}
                  </p>
                </div>
                {user.unread > 0 && (
                  <span className="bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {user.unread}
                  </span>
                )}
              </div>
            ))}
        </div>
      </aside>

      {/* Chat Window */}
      <main className="flex-1 flex flex-col bg-[#1e293b] border-l border-gray-700">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-700 flex items-center gap-3 bg-gradient-to-r from-[#1B3C53] to-[#456882]">
          <img
            src={selectedUser.avatar}
            alt={selectedUser.name}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <div>
            <h3 className="font-semibold text-white">{selectedUser.name}</h3>
            <p className="text-xs text-gray-300 flex items-center gap-1">
              {selectedUser.online ? (
                <>
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span> Online
                </>
              ) : (
                "Offline"
              )}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-3 bg-[#0f172a]">
          <div className="flex justify-center">
            <span className="text-xs bg-gray-800 px-3 py-1 rounded-full text-gray-400">
              Today
            </span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "me" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-2xl max-w-xs shadow ${
                  msg.sender === "me"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-800 text-gray-200 rounded-bl-none"
                }`}
              >
                {msg.text}
                <div className="text-[10px] text-gray-300 mt-1 text-right">
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700 flex items-center gap-3 bg-[#1e293b]">
          <Paperclip size={20} className="text-gray-400 cursor-pointer" />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-[#0f172a] border border-gray-700 rounded-full px-4 py-2 text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={handleSend}
            className="bg-gradient-to-r from-[#1B3C53] to-[#456882] p-2 rounded-full text-white hover:opacity-90"
          >
            <Send size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}
