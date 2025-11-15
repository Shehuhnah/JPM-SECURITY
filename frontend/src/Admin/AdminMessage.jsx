import { io } from "socket.io-client";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Paperclip, Send, Search, CircleUserRound, ArrowLeft, MessageSquare  } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const socket = io("http://localhost:5000");

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const hasNotifiedOnline = useRef(false);
  const fileInputRef = useRef();
  const [previewImage, setPreviewImage] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [file, setFile] = useState(null);

  // Scroll to bottom on new messages

  useEffect(() => {
    if (!user && !loading) {
      navigate("/admin/login");
      return;
    }
  }, [user, loading, navigate]);

  console.log(user)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    document.title = "Message | JPM Security Agency"
  })

  // Format timestamp
  const formatDateTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString([], { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const isUserOnline = (userId) => onlineUsers.includes(userId);

  const getParticipantName = (p) => {
    if (!p) return "Unknown";
    if (typeof p.userId === "object" && p.userId?.name) return p.userId.name;

    const match = availableUsers.find(u => u._id === (typeof p.userId === "string" ? p.userId : p.userId?._id));
    if (match) return match.name;
    if (p.userId === user._id) return user.name || "Me";

    return "Unknown";
  };

  // Notify backend that user is online
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
      setConversations(prev =>
        prev.map(conv =>
          conv._id === conversationId ? { ...conv, lastMessage: { ...conv.lastMessage, seen: true } } : conv
        )
      );
    });
    return () => socket.off("messages_seen");
  }, []);

  const isAdminConversation = (conversation) =>
    conversation?.type === "admin-subadmin" || conversation?.type === "subadmin-admin";

  // Fetch conversations (only Admin ↔ Subadmin)
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/messages/conversations", {
          credentials: "include",
        });
        const data = await res.json();
        const filtered = (Array.isArray(data) ? data : []).filter(conv =>
          conv.type === "admin-subadmin" || conv.type === "subadmin-admin"
        );
        setConversations(filtered);
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    };
    fetchConversations();
  }, [user]);

  // Fetch users for starting new chats
  useEffect(() => {
    if (!user) return;
    const fetchUsers = async () => {
      try {
        const endpoint = user.role === "Admin"
          ? "http://localhost:5000/api/auth/subadmins"
          : "http://localhost:5000/api/auth/admins";
        const res = await fetch(endpoint, { credentials: "include" });
        const data = await res.json();
        setAvailableUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, [user]);

  // Load messages for selected conversation & listen for updates
  useEffect(() => {
    if (!selectedConversation || selectedConversation.isTemp || !isAdminConversation(selectedConversation)) return;

    socket.emit("joinConversation", selectedConversation._id);
    socket.emit("mark_seen", { conversationId: selectedConversation._id, userId: user._id });

    const fetchMessages = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/messages/${selectedConversation._id}`, {
          credentials: "include",
        });
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading messages:", err);
      }
    };
    fetchMessages();

    const handleReceiveMessage = (msg) => {
      setConversations(prev =>
        prev.some(conv => conv._id === msg.conversationId && isAdminConversation(conv))
          ? prev.map(conv =>
              conv._id === msg.conversationId
                ? {
                    ...conv,
                    lastMessage: {
                      text: msg.text,
                      senderId: msg.senderId,
                      createdAt: msg.createdAt,
                      seen: msg.seen ?? false,
                    },
                  }
                : conv
            )
          : prev
      );

      setMessages(prev => {
        if (
          !selectedConversation ||
          !isAdminConversation(selectedConversation) ||
          selectedConversation._id !== msg.conversationId
        ) {
          return prev;
        }
        return prev.some(m => m._id === msg._id || m._tempId === msg._tempId) ? prev : [...prev, msg];
      });
    };

    socket.on("receiveMessage", handleReceiveMessage);
    return () => socket.off("receiveMessage", handleReceiveMessage);
  }, [selectedConversation?._id, user]);

  // Listen for conversation updates (other conversations)
  useEffect(() => {
    const handleConversationUpdated = async (updatedConv) => {
      if (!isAdminConversation(updatedConv)) return;

      setConversations(prev => {
        const exists = prev.some(c => c._id === updatedConv._id);
        if (exists) return prev.map(c => c._id === updatedConv._id ? updatedConv : c);
        return [updatedConv, ...prev];
      });

      if (selectedConversation?._id === updatedConv._id) {
        try {
          const res = await fetch(`http://localhost:5000/api/messages/${updatedConv._id}`, { credentials: "include" });
          const data = await res.json();
          setMessages(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error("Error refreshing active conversation:", err);
        }
      }
    };
    socket.on("conversationUpdated", handleConversationUpdated);
    return () => socket.off("conversationUpdated", handleConversationUpdated);
  }, [selectedConversation, user]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() && !file) return;
    if (!selectedConversation) return;

    if (!isAdminConversation(selectedConversation)) return;

    const receiver = selectedConversation.participants.find(p => (typeof p.userId === "string" ? p.userId : p.userId?._id) !== user._id);
    if (!receiver) return;

    const tempId = Date.now();

    const formData = new FormData();
    formData.append("text", newMessage);
    formData.append("type", selectedConversation.type || "admin-subadmin");
    formData.append("receiverId", typeof receiver.userId === "string" ? receiver.userId : receiver.userId?._id);
    formData.append("receiverRole", receiver.role);
    if (file) formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5000/api/messages", { method: "POST", credentials: "include", body: formData });
      if (!res.ok) return console.error("Failed to send message:", await res.text());

      const { message, conversation: realConversation } = await res.json();

      setConversations(prev => {
        if (selectedConversation?.isTemp) {
          const exists = prev.some(conv => conv._id === realConversation._id);
          const withoutTemp = prev.filter(conv => !conv.isTemp);
          return exists
            ? withoutTemp.map(conv => conv._id === realConversation._id ? realConversation : conv)
            : [realConversation, ...withoutTemp];
        }
        const exists = prev.some(conv => conv._id === realConversation._id);
        return exists
          ? prev.map(conv => conv._id === realConversation._id ? realConversation : conv)
          : [realConversation, ...prev];
      });

      setSelectedConversation(prev =>
        prev && prev._id === realConversation._id ? prev : realConversation
      );
      setNewMessage("");
      setFile(null);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Start new chat
  const handleStartChat = (targetUser) => {
    if (!targetUser?.role) return;

    const existing = conversations.find(conv =>
      (conv.participants ?? []).some(p => (typeof p.userId === "string" ? p.userId : p.userId?._id) === targetUser._id)
    );
    if (existing) return setSelectedConversation(existing);

    let type = "";
    if (user.role === "Admin" && targetUser.role === "Subadmin") type = "admin-subadmin";
    else if (user.role === "Subadmin" && targetUser.role === "Admin") type = "subadmin-admin";
    else return; // ignore other roles

    const tempConversation = {
      _id: `temp-${Date.now()}`,
      participants: [
        { userId: user._id, role: user.role, name: user.name },
        { userId: targetUser._id, role: targetUser.role, name: targetUser.name },
      ],
      type,
      lastMessage: null,
      isTemp: true,
    };
    setSelectedConversation(tempConversation);
  };

  // Merge conversations + available users for sidebar
  const shownUsers = [
    ...conversations.map(c => ({ type: "conversation", id: c._id, data: c })),
    ...availableUsers.filter(u => !conversations.some(c => (c.participants ?? []).some(p => (typeof p.userId === "string" ? p.userId : p.userId?._id) === u._id)))
      .map(u => ({ type: "user", id: u._id, data: u }))
  ];

  const filteredUsers = shownUsers.filter(item => {
    const name = item.type === "conversation"
      ? getParticipantName((item.data.participants ?? []).find(p => (typeof p.userId === "string" ? p.userId : p.userId?._id) !== user._id))
      : item.data?.name ?? "Unknown";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0f172a] text-gray-100">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-[#0b1220] border-r border-gray-800 flex flex-col">
        <h2 className="p-4 text-lg font-bold text-gray-100 bg-gradient-to-r from-[#1e293b] to-[#243447] shadow-md tracking-wide">
          <p className="flex gap-2"><MessageSquare/> Staff Messages</p>
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
                const lastMsgText = item.data.lastMessage?.text || (item.data.isTemp ? "Start conversation" : "No messages yet");
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
                  <div
                    key={msg._id || msg._tempId}
                    className={`flex ${isSender ? "justify-end" : "justify-start"} items-end gap-2`}
                  >
                    <div
                      className={`px-4 py-2 rounded-2xl max-w-xs break-words relative ${
                        isSender ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-200"
                      }`}
                    >
                      {msg.text}

                      {msg.file && (
                        msg.file.match(/\.(png|jpg|jpeg|gif)$/i) ? (
                          <img
                            src={`http://localhost:5000${msg.file}`}
                            alt={msg.fileName || "attachment"}
                            className="mt-1 rounded border max-w-full max-h-60 object-contain cursor-pointer"
                            onClick={() => setPreviewImage(`http://localhost:5000${msg.file}`)}
                          />
                        ) : (
                          <a
                            href={`http://localhost:5000${msg.file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-blue-400 block mt-1"
                          >
                            📎 {msg.fileName || "View attachment"}
                          </a>
                        )
                      )}

                      <div className="text-[10px] text-gray-300 mt-1 text-right">
                        {formatDateTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            {/* Modal for Image Preview */}
            {previewImage && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <button
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-4 right-4 text-white text-2xl"
                >
                  <ArrowLeft size={24} />
                </button>
                <img
                  src={previewImage}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain rounded shadow-lg"
                />
              </div>
            )}
            <div className="p-4 border-t border-gray-700 bg-[#1e293b] flex flex-col gap-2">
              {/* Attachment Preview */}
              {file && (
                <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2 max-w-xs">
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-16 h-16 object-contain rounded"
                    />
                  ) : (
                    <div className="flex-1 text-gray-200 truncate">{file.name}</div>
                  )}
                  <button
                    onClick={() => setFile(null)}
                    className="text-gray-400 hover:text-red-500"
                    title="Remove attachment"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                />
                <label>
                  <Paperclip
                    size={20}
                    onClick={() => fileInputRef.current.click()}
                    className="text-gray-400 cursor-pointer hover:text-blue-400"
                  />
                </label>

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
            </div>
          </>
        )}
      </main>
    </div>
  );
}
