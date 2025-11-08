import { io } from "socket.io-client";
import { useEffect, useState, useRef } from "react";
import { Paperclip, Send, Search, CircleUserRound  } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const socket = io("http://localhost:5000");

export default function MessagesPage() {
  const { admin: user, token } = useAuth();
  const messagesEndRef = useRef(null);
  const hasNotifiedOnline = useRef(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");

  // Check if user is online
  const isUserOnline = (userId) => onlineUsers.includes(userId);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Format date/time
  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Online users handling
  useEffect(() => {
    if (user && !hasNotifiedOnline.current) {
      socket.emit("userOnline", user._id);
      hasNotifiedOnline.current = true;
    }

    socket.on("onlineUsers", (users) => setOnlineUsers(users));

    return () => socket.off("onlineUsers");
  }, [user]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/messages/conversations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setConversations(Array.isArray(data) ? data : data.data ? [data.data] : []);
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    };
    fetchConversations();
  }, [token]);

  // Fetch available users
  useEffect(() => {
    if (!user) return;
    const fetchUsers = async () => {
      try {
        const endpoint =
          user.role === "Admin"
            ? "http://localhost:5000/api/auth/subadmins"
            : "http://localhost:5000/api/auth/admins";

        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setAvailableUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, [user, token]);

  // Load messages & listen for new messages
  useEffect(() => {
    if (!selectedConversation) return;

    socket.emit("joinConversation", selectedConversation._id);

    const fetchMessages = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/messages/${selectedConversation._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading messages:", err);
      }
    };
    fetchMessages();

    const handleReceiveMessage = (msg) => {
      if (msg.conversationId === selectedConversation._id && msg.senderId !== user._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);
    return () => socket.off("receiveMessage", handleReceiveMessage);
  }, [selectedConversation, token, user._id]);

  // Send message
  const handleSend = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const receiver = selectedConversation.participants.find(
      (p) => (typeof p.userId === "string" ? p.userId : p.userId._id) !== user._id
    );

    const conversationType =
      selectedConversation.type || `${user.role.toLowerCase()}-${receiver.role.toLowerCase()}`;

    const msg = {
      text: newMessage,
      conversationId: selectedConversation._id,
      type: conversationType,
      senderId: user._id,
      senderRole: user.role,
      receiverId: typeof receiver.userId === "string" ? receiver.userId : receiver.userId._id,
      receiverRole: receiver.role,
    };

    // Show locally
    setMessages((prev) => [...prev, { ...msg, _id: Date.now(), createdAt: new Date() }]);
    setNewMessage("");

    // Emit to server
    socket.emit("sendMessage", msg);
  };

  // Start new chat
  const handleStartChat = async (targetUser) => {
    if (!targetUser.role) return;

    const existing = conversations.find((conv) =>
      conv.participants.some((p) => {
        const pid = typeof p.userId === "string" ? p.userId : p.userId._id;
        return pid === targetUser._id;
      })
    );

    if (existing) {
      setSelectedConversation(existing);
      return;
    }

    let type = "";
    if (user.role === "Admin" && targetUser.role === "Subadmin") type = "admin-subadmin";
    else if (user.role === "Subadmin" && targetUser.role === "Admin") type = "subadmin-admin";
    else if (targetUser.role === "Applicant") type = "subadmin-applicant";
    else return;

    const body = {
      participants: [
        { userId: user._id, role: user.role },
        { userId: targetUser._id, role: targetUser.role },
      ],
      type,
      text: "👋 Hello!",
      lastMessage: "👋 Hello!",
      receiverId: targetUser._id,
      receiverRole: targetUser.role,
    };

    try {
      const res = await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error("Failed to create conversation:", errData);
        return;
      }

      const newConvo = await res.json();
      const convoRes = await fetch("http://localhost:5000/api/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(await convoRes.json());
      setSelectedConversation(newConvo);
    } catch (err) {
      console.error("Error starting chat:", err);
    }
  };

  // Merge conversations and available users
  const shownUsers = [
    ...conversations.map((c) => ({ type: "conversation", id: c._id, data: c })),
    ...availableUsers
      .filter(
        (u) =>
          !conversations.some((c) =>
            c.participants.some((p) => {
              const pid = typeof p.userId === "string" ? p.userId : p.userId._id;
              return pid === u._id;
            })
          )
      )
      .map((u) => ({ type: "user", id: u._id, data: u })),
  ];

  const filteredUsers = shownUsers.filter((item) => {
    const name =
      item.type === "conversation"
        ? item.data.participants.find(
            (p) => (typeof p.userId === "string" ? p.userId : p.userId._id) !== user._id
          )?.userId?.name ?? ""
        : item.data.name ?? "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0f172a] text-gray-100">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-[#1e293b] border-r border-gray-700 flex flex-col">
        <h2 className="p-4 text-lg font-bold text-white bg-gradient-to-r from-[#1B3C53] to-[#456882]">
          Messages
        </h2>
        <div className="p-3">
          <div className="flex items-center bg-[#0f172a] border border-gray-600 rounded-lg px-3 py-2 focus-within:ring-2 ring-blue-500">
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
       <div className="flex-1 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((item) => {
              if (item.type === "conversation") {
                const other = item.data.participants.find(
                  (p) =>
                    (typeof p.userId === "string" ? p.userId : p.userId._id) !== user._id
                );

                // Extract ID and name safely
                const otherId =
                  typeof other.userId === "string" ? other.userId : other.userId._id;
                const otherName =
                  typeof other.userId === "object" ? other.userId.name : other.name || "Unknown";

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedConversation(item.data)}
                    className={`p-3 cursor-pointer transition-all rounded-lg ${
                      selectedConversation?._id === item.data._id
                        ? "bg-[#1B3C53]"
                        : "hover:bg-[#243447]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-200 font-medium">{otherName}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isUserOnline(otherId) ? "bg-green-500" : "bg-gray-500"
                        }`}
                        title={isUserOnline(otherId) ? "Online" : "Offline"}
                      ></span>
                    </div>
                    <p className="text-sm text-gray-400 truncate mt-1">
                      Click to Message
                    </p>
                  </div>
                );
              } else {
                const u = item.data;
                return (
                  <div
                    key={u._id}
                    onClick={() => handleStartChat(u)}
                    className="p-3 cursor-pointer hover:bg-[#243447] rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-200 font-medium">{u.name}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isUserOnline(u._id) ? "bg-green-500" : "bg-gray-500"
                        }`}
                        title={isUserOnline(u._id) ? "Online" : "Offline"}
                      ></span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{u.role}</p>
                  </div>
                );
              }
            })
          ) : (
            <p className="text-center text-gray-500 mt-4 text-sm">No users found</p>
          )}
        </div>
      </aside>

      {/* Chat Window */}
      <main className="flex-1 flex flex-col bg-[#1e293b] border-l border-gray-700">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a conversation to start messaging
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-[#1B3C53] to-[#456882]">
              <h3 className="font-semibold text-white">
                {selectedConversation.participants.find(
                  (p) => (typeof p.userId === "string" ? p.userId : p.userId?._id) !== user._id
                )?.userId?.name || "Unknown"}
              </h3>
            </div>
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-3 bg-[#0f172a]">
              {messages.map((msg) => {
                const isSender = msg.senderId === user._id;

                // Find sender info for messages from the receiver
                const sender =
                  !isSender &&
                  selectedConversation.participants.find(
                    (p) => (typeof p.userId === "string" ? p.userId : p.userId?._id) === msg.senderId
                  );

                return (
                  <div
                    key={msg._id}
                    className={`flex ${isSender ? "justify-end" : "justify-start"} items-end gap-2`}
                  >
                    {/* Show CircleUserRound only for receiver */}
                    {!isSender && <CircleUserRound user={sender?.userId} strokeWidth={1} size={32} className="text-blue-400 font-light"/>}
                    
                    <div
                      className={`px-4 py-2 rounded-2xl max-w-xs break-words relative ${
                        isSender ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-200"
                      }`}
                    >
                      {msg.text}
                      <div className="text-[10px] text-gray-300 mt-1 text-right">
                        {formatDateTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>


            <div className="p-4 border-t border-gray-700 flex items-center gap-3 bg-[#1e293b]">
              <Paperclip size={20} className="text-gray-400 cursor-pointer hover:text-blue-400" />
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-[#0f172a] border border-gray-700 rounded-full px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={handleSend}
                className="bg-gradient-to-r from-[#1B3C53] to-[#456882] p-2 rounded-full hover:brightness-110 transition"
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
