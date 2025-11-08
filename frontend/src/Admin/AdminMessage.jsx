import { io } from "socket.io-client";
import { useEffect, useState, useRef } from "react";
import { Paperclip, Send, Search, CircleUserRound } from "lucide-react";
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

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "";
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

  const isUserOnline = (userId) => onlineUsers.includes(userId);

  // Normalize participant names
  const getParticipantName = (p) => {
    if (!p) return "Unknown";
    if (typeof p.userId === "object" && p.userId?.name) return p.userId.name;

    // Check availableUsers
    const match = availableUsers.find(
      (u) => u._id === (typeof p.userId === "string" ? p.userId : p.userId?._id)
    );
    if (match) return match.name;

    // Check logged-in user
    if (p.userId === user._id) return user.name || "Me";

    return "Unknown";
  };

  // Notify online
  useEffect(() => {
    if (user && !hasNotifiedOnline.current) {
      socket.emit("userOnline", user._id);
      hasNotifiedOnline.current = true;
    }
    socket.on("onlineUsers", (users) => setOnlineUsers(users));
    return () => socket.off("onlineUsers");
  }, [user]);

  // Listen for seen messages
  useEffect(() => {
    socket.on("messages_seen", ({ conversationId }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversationId
            ? { ...conv, lastMessage: { ...conv.lastMessage, seen: true } }
            : conv
        )
      );
    });
    return () => socket.off("messages_seen");
  }, []);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/messages/conversations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setConversations(Array.isArray(data) ? data : []);
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

  // Load messages & listen
  useEffect(() => {
    if (!selectedConversation) return;

    socket.emit("joinConversation", selectedConversation._id);
    socket.emit("mark_seen", { conversationId: selectedConversation._id, userId: user._id });

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
      setMessages((prev) => [...prev.filter((m) => m._tempId !== msg._tempId), msg]);
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === msg.conversationId
            ? { ...conv, lastMessage: { text: msg.text, senderId: msg.senderId, createdAt: msg.createdAt } }
            : conv
        )
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);
    return () => socket.off("receiveMessage", handleReceiveMessage);
  }, [selectedConversation, token, user._id]);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const receiver = (selectedConversation.participants ?? []).find(
      (p) => (typeof p.userId === "string" ? p.userId : p.userId?._id) !== user._id
    );

    const tempId = Date.now();

    const msg = {
      text: newMessage,
      conversationId: selectedConversation._id,
      senderId: user._id,
      senderRole: user.role,
      receiverId: typeof receiver?.userId === "string" ? receiver.userId : receiver?.userId?._id,
      receiverRole: receiver?.role,
      _tempId: tempId,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, msg]);
    setNewMessage("");

    setConversations((prev) =>
      prev.map((conv) =>
        conv._id === selectedConversation._id
          ? { ...conv, lastMessage: { text: msg.text, senderId: msg.senderId, createdAt: msg.createdAt } }
          : conv
      )
    );

    socket.emit("sendMessage", msg);
  };

  const handleStartChat = async (targetUser) => {
    if (!targetUser?.role) return;

    const existing = conversations.find((conv) =>
      (conv.participants ?? []).some((p) => {
        const pid = typeof p.userId === "string" ? p.userId : p.userId?._id;
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
        { userId: user._id, role: user.role, name: user.name },
        { userId: targetUser._id, role: targetUser.role, name: targetUser.name },
      ],
      type,
      text: "👋 Hello!",
      lastMessage: {
        text: "👋 Hello!",
        senderId: user._id,
        createdAt: new Date(),
      },
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
        console.error("Failed to create conversation:", await res.json());
        return;
      }

      const data = await res.json();

      // ✅ use populated conversation from backend
      setConversations((prev) => [...prev, data.conversation]);
      setSelectedConversation(data.conversation);
    } catch (err) {
      console.error("Error starting chat:", err);
    }
  };

  const shownUsers = [
    ...conversations.map((c) => ({ type: "conversation", id: c._id, data: c })),
    ...availableUsers
      .filter(
        (u) =>
          !conversations.some((c) =>
            (c.participants ?? []).some((p) => {
              const pid = typeof p.userId === "string" ? p.userId : p.userId?._id;
              return pid === u._id;
            })
          )
      )
      .map((u) => ({ type: "user", id: u._id, data: u })),
  ];

  const filteredUsers = shownUsers.filter((item) => {
    const name =
      item.type === "conversation"
        ? getParticipantName(
            (item.data.participants ?? []).find(
              (p) => (typeof p.userId === "string" ? p.userId : p.userId?._id) !== user._id
            )
          )
        : item.data?.name ?? "Unknown";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0f172a] text-gray-100">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-[#0b1220] border-r border-gray-800 flex flex-col">
        <h2 className="p-4 text-lg font-bold text-gray-100 bg-gradient-to-r from-[#1e293b] to-[#243447] shadow-md tracking-wide">
          Messages
        </h2>
        <div className="p-3">
          <div className="flex items-center bg-[#111827] border border-gray-700 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent flex-1 ml-2 outline-none text-sm text-gray-200 placeholder-gray-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-[#0b1220]">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((item) => {
              if (item.type === "conversation") {
                const other = (item.data.participants ?? []).find(
                  (p) => (typeof p.userId === "string" ? p.userId : p.userId?._id) !== user._id
                );
                const otherId = typeof other?.userId === "string" ? other.userId : other?.userId?._id;
                const otherName = getParticipantName(other);
                const lastMsgText = item.data.lastMessage?.text || "No messages yet";
                const lastMsgTime = item.data.lastMessage?.createdAt
                  ? formatDateTime(item.data.lastMessage.createdAt)
                  : "";

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedConversation(item.data)}
                    className={`p-3 mb-2 cursor-pointer transition-all rounded-xl border border-transparent ${
                      selectedConversation?._id === item.data._id
                        ? "bg-[#1e293b] border-blue-500 shadow-md"
                        : "hover:bg-[#162236] hover:border-[#1e3a5f]"
                    }`}
                  >
                    <div className="flex items-center gap-x-3 w-full">
                      <div className="relative">
                        <CircleUserRound strokeWidth={1.5} size={36} className="text-gray-300" />
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[#0b1220] ${
                            isUserOnline(otherId) ? "bg-green-500" : "bg-gray-500"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-100 font-medium truncate">{otherName}</span>
                          <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">{lastMsgTime}</span>
                        </div>
                        <p
                          className={`text-sm mt-1 truncate ${
                            !item.data.lastMessage?.seen && item.data.lastMessage?.senderId !== user._id
                              ? "text-gray-100 font-semibold"
                              : "text-gray-400"
                          }`}
                        >
                          {lastMsgText}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              } else {
                const u = item.data;
                return (
                  <div
                    key={u._id}
                    onClick={() => handleStartChat(u)}
                    className="p-3 mb-1 cursor-pointer hover:bg-[#162236] transition rounded-xl border border-transparent hover:border-[#1e3a5f]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-100 font-medium truncate">{u.name}</span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isUserOnline(u._id) ? "bg-green-500" : "bg-gray-500"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 truncate">{u.role}</p>
                  </div>
                );
              }
            })
          ) : (
            <p className="text-center text-gray-500 mt-6 text-sm italic">No users found</p>
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
            <div className="p-4 border-b border-gray-700 bg-[#0f172a]">
              {(() => {
                const otherParticipant = (selectedConversation.participants ?? []).find(
                  (p) => (typeof p.userId === "string" ? p.userId : p.userId?._id) !== user._id
                );
                const otherId = typeof otherParticipant?.userId === "string" ? otherParticipant.userId : otherParticipant?.userId?._id;
                const otherName = getParticipantName(otherParticipant);
                const online = isUserOnline(otherId);

                return (
                  <div className="flex items-center gap-3">
                    <CircleUserRound size={38} />
                    <div>
                      <h3 className="font-semibold text-white mb-1">{otherName}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full inline-block ${online ? "bg-green-400" : "bg-gray-400"}`} />
                        <span className={`text-xs ${online ? "text-green-400" : "text-gray-400"}`}>{online ? "Online" : "Offline"}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-3 bg-[#0b1220]">
              {messages.map((msg) => {
                const isSender = msg.senderId === user._id;
                return (
                  <div key={msg._id || msg._tempId} className={`flex ${isSender ? "justify-end" : "justify-start"} items-end gap-2`}>
                    <div className={`px-4 py-2 rounded-2xl max-w-xs break-words relative ${isSender ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-200"}`}>
                      {msg.text}
                      <div className="text-[10px] text-gray-300 mt-1 text-right">{formatDateTime(msg.createdAt)}</div>
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
              <button onClick={handleSend} className="bg-gradient-to-r from-[#1B3C53] to-[#456882] p-2 rounded-full hover:brightness-110 transition">
                <Send size={18} />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
