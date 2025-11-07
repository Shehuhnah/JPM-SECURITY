import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import { Paperclip, Send, Search } from "lucide-react";
import { useAuth } from "../hooks/useAuth"; // ✅ adjust if path differs

const socket = io("http://localhost:5000");

export default function MessagesPage() {
  const { admin: user, token } = useAuth(); // ✅ rename for clarity
  const [conversations, setConversations] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");

  // ✅ Load conversations and available users
  useEffect(() => {
    if (!token || !user) return;

    // Load existing conversations
    fetch("http://localhost:5000/api/messages/conversations", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setConversations(data))
      .catch((err) => console.error("Error loading conversations:", err));

    // Load available users depending on role
    if (user.role === "Admin") {
      fetch("http://localhost:5000/api/users/subadmins", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setAvailableUsers(data))
        .catch((err) => console.error("Error loading subadmins:", err));
    } else if (user.role === "Subadmin") {
      fetch("http://localhost:5000/api/users/admins", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setAvailableUsers(data))
        .catch((err) => console.error("Error loading admins:", err));
    }
  }, [token, user]);

  // ✅ Join selected conversation and load messages
  useEffect(() => {
    if (!selectedConversation) return;

    socket.emit("joinConversation", selectedConversation._id);

    fetch(`http://localhost:5000/api/messages/${selectedConversation._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch((err) => console.error("Error loading messages:", err));

    socket.on("receiveMessage", (msg) => {
      if (msg.conversationId === selectedConversation._id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => socket.off("receiveMessage");
  }, [selectedConversation, token]);

  // ✅ Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const receiver = selectedConversation.participants.find(
      (p) => p.userId._id !== user._id
    );

    const msg = {
      text: newMessage,
      conversationId: selectedConversation._id,
      receiverId: receiver.userId._id,
      receiverRole: receiver.role,
    };

    socket.emit("sendMessage", msg);

    const res = await fetch("http://localhost:5000/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(msg),
    });

    const savedMsg = await res.json();
    setMessages((prev) => [...prev, savedMsg]);
    setNewMessage("");
  };

  // ✅ Start new chat with a user (if no existing conversation)
  const handleStartChat = async (targetUser) => {
    const existing = conversations.find((conv) =>
      conv.participants.some((p) => p.userId._id === targetUser._id)
    );

    if (existing) {
      setSelectedConversation(existing);
      return;
    }

    // Create new conversation
    const res = await fetch("http://localhost:5000/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        receiverId: targetUser._id,
        receiverRole: targetUser.role,
        text: "👋 Hello!",
        type: `${user.role.toLowerCase()}-${targetUser.role.toLowerCase()}`,
      }),
    });

    const newMsg = await res.json();

    // Refresh conversations
    const convoRes = await fetch("http://localhost:5000/api/messages/conversations", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const updatedConvos = await convoRes.json();
    setConversations(updatedConvos);

    const newConvo = updatedConvos.find((c) =>
      c.participants.some((p) => p.userId._id === targetUser._id)
    );
    setSelectedConversation(newConvo);
  };

  // ✅ Combine conversations + users (admins ↔ subadmins)
  const shownUsers =
    user.role === "Admin"
      ? [
          ...conversations.map((c) => ({
            type: "conversation",
            id: c._id,
            data: c,
          })),
          ...availableUsers
            .filter(
              (s) =>
                !conversations.some((c) =>
                  c.participants.some((p) => p.userId._id === s._id)
                )
            )
            .map((s) => ({
              type: "user",
              id: s._id,
              data: s,
            })),
        ]
      : conversations.map((c) => ({
          type: "conversation",
          id: c._id,
          data: c,
        }));

  // ✅ Filter by search input
  const filteredUsers = shownUsers.filter((item) => {
    const name =
      item.type === "conversation"
        ? item.data.participants.find((p) => p.userId._id !== user._id)?.userId
            ?.fullName
        : item.data.fullName;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  console.log("Shown users:", shownUsers);

  return (
    <div className="flex h-screen bg-[#0f172a] text-gray-100">
      {/* Sidebar */}
      <aside className="w-72 bg-[#1e293b] border-r border-gray-700 flex flex-col">
        <h2 className="p-4 text-lg font-bold text-white bg-gradient-to-r from-[#1B3C53] to-[#456882]">
          Messages
        </h2>

        {/* Search */}
        <div className="p-3">
          <div className="flex items-center bg-[#0f172a] border border-gray-600 rounded-lg px-3 py-2">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent flex-1 ml-2 outline-none text-sm text-gray-200 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Conversations / Available Users */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.map((item) => {
            if (item.type === "conversation") {
              const other = item.data.participants.find(
                (p) => p.userId._id !== user._id
              );
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedConversation(item.data)}
                  className={`p-3 cursor-pointer transition-all ${
                    selectedConversation?._id === item.data._id
                      ? "bg-[#1B3C53]"
                      : "hover:bg-[#243447]"
                  }`}
                >
                  <span className="font-medium">
                    {other?.userId?.fullName || "Unknown"}
                  </span>
                  <p className="text-sm text-gray-400 truncate">
                    {item.data.lastMessage || "No messages yet"}
                  </p>
                </div>
              );
            } else {
              const userData = item.data;
              return (
                <div
                  key={userData._id}
                  onClick={() => handleStartChat(userData)}
                  className="p-3 cursor-pointer hover:bg-[#243447]"
                >
                  <span className="font-medium">{userData.fullName}</span>
                  <p className="text-sm text-gray-400">{userData.role}</p>
                </div>
              );
            }
          })}
          {filteredUsers.length === 0 && (
            <p className="text-center text-gray-500 mt-4 text-sm">
              No users found
            </p>
          )}
        </div>
      </aside>

      {/* Chat window */}
      <main className="flex-1 flex flex-col bg-[#1e293b] border-l border-gray-700">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a conversation to start messaging
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-[#1B3C53] to-[#456882]">
              <h3 className="font-semibold text-white">
                {
                  selectedConversation.participants.find(
                    (p) => p.userId._id !== user._id
                  )?.userId.fullName
                }
              </h3>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-3 bg-[#0f172a]">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${
                    msg.sender.userId === user._id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl max-w-xs ${
                      msg.sender.userId === user._id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-200"
                    }`}
                  >
                    {msg.text}
                    <div className="text-[10px] text-gray-300 mt-1 text-right">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-700 flex items-center gap-3 bg-[#1e293b]">
              <Paperclip size={20} className="text-gray-400" />
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-[#0f172a] border border-gray-700 rounded-full px-4 py-2 text-gray-200"
              />
              <button
                onClick={handleSend}
                className="bg-gradient-to-r from-[#1B3C53] to-[#456882] p-2 rounded-full"
              >
                <Send size={18} />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
