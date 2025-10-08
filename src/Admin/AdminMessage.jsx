import { useState } from "react";
import { Paperclip, Send, Search  } from "lucide-react";

const mockUsers = [
  {
    id: 1,
    name: "Anil",
    avatar: "https://i.pravatar.cc/100?img=1",
    lastMessage: "...................",
    time: "Today, 9.52pm",
    unread: 0,
    online: true,
  },
  {
    id: 2,
    name: "Chuuthiya",
    avatar: "https://i.pravatar.cc/100?img=2",
    lastMessage: ".......",
    time: "Today, 12.11pm",
    unread: 1,
  },
  {
    id: 3,
    name: "Mary ma’am",
    avatar: "https://i.pravatar.cc/100?img=3",
    lastMessage: "..................",
    time: "Today, 2.40pm",
    unread: 1,
  },
  {
    id: 4,
    name: "Bill Gates",
    avatar: "https://i.pravatar.cc/100?img=4",
    lastMessage: "..................",
    time: "Yesterday, 12.31pm",
    unread: 5,
  },
  {
    id: 5,
    name: "Victoria H",
    avatar: "https://i.pravatar.cc/100?img=5",
    lastMessage: "..................",
    time: "Wednesday, 11.12am",
    unread: 0,
  },
];

const mockMessages = {
  1: [
    { id: 1, text: "....................", time: "Today, 8.30pm", sender: "them" },
    { id: 2, text: ".............................", time: "Today, 8.33pm", sender: "me" },
    { id: 3, text: ".............................................", time: "Today, 8.34pm", sender: "me" },
    { id: 4, text: ".............................................", time: "Today, 8.36pm", sender: "them" },
    { id: 5, text: "....................", time: "Today, 8.58pm", sender: "me" },
  ],
  2: [
    { id: 1, text: "Hey! How are you?", time: "Yesterday, 7.00pm", sender: "them" },
    { id: 2, text: "All good. You?", time: "Yesterday, 7.05pm", sender: "me" },
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
    <div className="flex h-screen bg-gradient-to-br from-gray-100 to-purple-100">
      {/* Sidebar */}
      <aside className="w-72 border-r bg-white/90 backdrop-blur-md flex flex-col shadow-lg">
        <h2 className="p-4 text-lg font-bold bg-gradient-to-r from-[#1B3C53] to-[#456882] text-white rounded-b-lg shadow">
          Messages
        </h2>

        {/* Search bar */}
        <div className="p-3">
          <div className="flex items-center bg-gray-100 rounded-full px-3 py-2">
            <Search size={16} className="text-[#1B3C53]" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent flex-1 ml-2 outline-none text-sm"
            />
          </div>
        </div>

        {/* Users List */}
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
                className={`flex items-center gap-3 p-3 cursor-pointer transition ${
                  selectedUser.id === user.id
                    ? "bg-gray-300 border-l-4 border-[#1B3C53]"
                    : "hover:bg-gray-100"
                }`}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full border shadow-sm "
                />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-gray-500">{user.time}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {user.lastMessage}
                  </p>
                </div>
                {user.unread > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow">
                    {user.unread}
                  </span>
                )}
              </div>
            ))}
        </div>
      </aside>

      {/* Chat Window */}
      <main className="flex-1 flex flex-col bg-white/95 backdrop-blur-md shadow-xl">
        {/* Chat Header */}
        <div className="p-4 border-b flex items-center gap-3 bg-gradient-to-r from-[#456882] to-[#1B3C53] text-white shadow">
          <img
            src={selectedUser.avatar}
            alt={selectedUser.name}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <div>
            <h3 className="font-semibold">{selectedUser.name}</h3>
            <p className="text-xs opacity-80 flex items-center gap-1">
                {selectedUser.online && (
                    <span className="w-2 h-2 bg-[#234C6A] rounded-full inline-block"></span>
                )}
                {selectedUser.online ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-3 bg-gradient-to-l from-white to-[#234C6A]">
          <div className="flex justify-center">
            <span className="text-xs bg-gray-200 px-3 py-1 rounded-full text-gray-600 shadow-sm">
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
                className={`px-4 py-2 rounded-2xl max-w-xs shadow transition-transform transform hover:scale-[1.02] ${
                  msg.sender === "me"
                    ? "bg-[#1B3C53] rounded-br-none text-white"
                    : "bg-gray-900 text-white rounded-bl-none"
                }`}
              >
                {msg.text}
                <div className="text-[10px] text-gray-200 mt-1">{msg.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Box */}
        <div className="p-4 border-t flex items-center gap-2 bg-white/80 backdrop-blur-md">
          <Paperclip size={20} className="text-gray-500 cursor-pointer" />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-1 focus:ring-gray-700"
          />
          <button
            onClick={handleSend}
            className="bg-gradient-to-r from-[#1B3C53] to-[#456882] p-2 rounded-full text-white hover:opacity-90 shadow"
          >
            <Send size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}
