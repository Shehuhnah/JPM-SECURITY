import { useEffect, useState, useRef } from "react";
import { Paperclip, Send, CircleUserRound, ArrowLeft } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

import { io } from "socket.io-client";
const api = import.meta.env.VITE_API_URL;
export const socket = io(api, {
  withCredentials: true,
  transports: ["websocket", "polling"], 
});

export default function GuardMessage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef();
  const hasNotifiedOnline = useRef(false);

  // Auto-scroll when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Notify server that Guard is online
  useEffect(() => {
    if (user && !hasNotifiedOnline.current) {
      socket.emit("userOnline", user._id);
      hasNotifiedOnline.current = true;
    }
    socket.on("onlineUsers", (users) => setOnlineUsers(users));
    return () => socket.off("onlineUsers");
  }, [user]);


  // Fetch Guard ↔ Subadmin conversations
  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      try {
        const res = await fetch(`${api}/api/messages/conversations`, {
          credentials: "include"
        });
        const data = await res.json();
        const filtered = (Array.isArray(data) ? data : []).filter(
          (conv) =>
            conv.type === "subadmin-guard" || conv.type === "guard-subadmin"
        );
        setConversations(filtered);
  
        // Automatically select the first conversation (with subadmin) only if there are conversations
        if (filtered.length > 0) {
          setSelectedConversation(filtered[0]);
        } else {
          // If no conversations, create a temp conversation so guard can send message
          setSelectedConversation({
            _id: `temp-new`,
            participants: [
              { userId: user._id, role: user.role, name: user.fullName || user.name },
            ],
            type: "guard-subadmin",
            lastMessage: null,
            isTemp: true,
          });
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    };
    fetchConversations();
  }, [user]);
  

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation || selectedConversation.isTemp || !user) return;

    socket.emit("joinConversation", selectedConversation._id);
    socket.emit("mark_seen", { conversationId: selectedConversation._id, userId: user?._id });

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${api}/api/messages/${selectedConversation._id}`,
          { credentials: "include" }
        );
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading messages:", err);
      }
    };
    fetchMessages();

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
      setConversations((prev) =>
        prev.map((c) => (c._id === msg.conversationId ? { ...c, lastMessage: msg } : c))
      );
    };

    const handleConversationUpdated = (updatedConv) => {
      if (updatedConv._id === selectedConversation?._id) {
        setSelectedConversation(updatedConv);
      }
      setConversations((prev) =>
        prev.map((c) => (c._id === updatedConv._id ? updatedConv : c))
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("conversationUpdated", handleConversationUpdated);
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("conversationUpdated", handleConversationUpdated);
    };
  }, [selectedConversation?._id, user]);

  // Listen for conversation updates to keep the list fresh
  useEffect(() => {
    const handleConversationUpdated = (updatedConv) => {
      // Update selected conversation if it's the current one
      if (selectedConversation && updatedConv._id === selectedConversation._id) {
        setSelectedConversation(updatedConv);
      }
      
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === updatedConv._id);
        if (exists) {
          return prev.map((c) => (c._id === updatedConv._id ? updatedConv : c));
        }
        return [updatedConv, ...prev];
      });
    };
    socket.on("conversationUpdated", handleConversationUpdated);
    return () => socket.off("conversationUpdated", handleConversationUpdated);
  }, [selectedConversation?._id]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() && !file) return;
    if (!selectedConversation || !user) return;

    // If this is a temp conversation without a receiver, we need to fetch a subadmin
    let receiver = selectedConversation.participants.find((p) => {
      const pid =
        (typeof p.userId === "string" ? p.userId : p.userId?._id) || "";
      return pid.toString() !== (user?._id || "").toString();
    });

    // If no receiver (new conversation), fetch first available subadmin
    if (!receiver && selectedConversation.isTemp) {
      try {
        const res = await fetch(`${api}/api/auth/subadmins`, {
          credentials: "include"
        });
        const data = await res.json();
        const subadmins = Array.isArray(data) ? data : [];
        if (subadmins.length > 0) {
          // Use the first subadmin available
          receiver = {
            userId: subadmins[0]._id,
            role: "Subadmin",
            name: subadmins[0].name,
          };
        } else {
          console.error("No subadmins available");
          return;
        }
      } catch (err) {
        console.error("Error fetching subadmins:", err);
        return;
      }
    }

    if (!receiver) return;

    const formData = new FormData();
    formData.append("text", newMessage);
    formData.append(
      "receiverId",
      typeof receiver.userId === "string" ? receiver.userId : receiver.userId?._id
    );
    formData.append("receiverRole", receiver.role);
    formData.append("type", selectedConversation.type || "guard-subadmin");
    if (file) formData.append("file", file);

    try {
      const res = await fetch(`${api}/api/messages`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) return console.error(await res.text());
      const { message, conversation } = await res.json();

      // Update or insert conversation in the list
      setConversations((prev) => {
        if (selectedConversation?.isTemp) {
          const exists = prev.some((c) => c._id === conversation._id);
          const withoutTemp = prev.filter((c) => !c.isTemp);
          return exists
            ? withoutTemp.map((c) =>
                c._id === conversation._id ? conversation : c
              )
            : [conversation, ...withoutTemp];
        }
        const exists = prev.some((c) => c._id === conversation._id);
        return exists
          ? prev.map((c) => (c._id === conversation._id ? conversation : c))
          : [conversation, ...prev];
      });

      // Ensure selection is on the real conversation
      setSelectedConversation((prev) =>
        prev && prev._id === conversation._id ? prev : conversation
      );
      setNewMessage("");
      setFile(null);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const formatDateTime = (timestamp) =>
    timestamp
      ? new Date(timestamp).toLocaleString([], {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "";

  const normalizeId = (id) => {
    if (!id) return "";
    if (typeof id === "string") return id;
    if (typeof id === "object" && id?._id) return id._id.toString();
    return "";
  };

  const isUserOnline = (userId) => onlineUsers.includes(normalizeId(userId));

  return (
    <div className="flex flex-col h-screen bg-[#0f172a] text-gray-100">
      {/* Header */}
      <header className="p-3 sm:p-4 border-b border-gray-700 flex items-center gap-3 bg-[#0b1220]">
        <h1 className="text-base sm:text-lg font-semibold truncate">
          {selectedConversation
            ? (() => {
                if (selectedConversation.isTemp && selectedConversation.participants.length === 1) {
                  return "Message HR";
                }
                const other = selectedConversation.participants?.find(
                  (p) =>
                    String(
                      typeof p.userId === "string" ? p.userId : p.userId?._id
                    ) !== String(user?._id)
                ) || {};
                return other?.user?.name || other?.user?.fullName || other?.name || "HR";
              })()
            : "Chats"}
        </h1>
      </header>

      {!selectedConversation ? (
        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          {/* Chat list... */}
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-[#0b1220]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex items-end ${
                  ((typeof msg.sender?.userId === "string" ? msg.sender.userId : msg.sender?.userId?._id) || "") ===
                  user?._id
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div className={`px-3 py-2 sm:px-4 sm:py-2 rounded-2xl max-w-[80%] break-words ${
                  ((typeof msg.sender?.userId === "string" ? msg.sender.userId : msg.sender?.userId?._id) || "") ===
                  user?._id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-200"
                }`}>
                  {msg.text}
                  {msg.file && (
                    /\.(png|jpg|jpeg|gif|webp)$/i.test(msg.file) ? (
                      <img
                        src={`${api}${msg.file}`}
                        alt={msg.fileName || "attachment"}
                        className="mt-2 rounded border max-w-full h-auto object-contain cursor-pointer"
                        onClick={() => setPreviewImage(`${api}${msg.file}`)}
                      />
                    ) : (
                      <a
                        href={`${api}${msg.file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-200 block mt-2 text-xs sm:text-sm"
                      >
                        📎 {msg.fileName || "View attachment"}
                      </a>
                    )
                  )}
                  <div className="text-[9px] sm:text-[10px] text-gray-300 mt-1 text-right">
                    {formatDateTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input - Sticky */}
          <div className="sticky bottom-0 p-2 sm:p-3 border-t border-gray-700 bg-[#0b1220] z-10">
            {file && (
              <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2 max-w-full">
                {file.type.startsWith("image/") ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded"
                  />
                ) : (
                  <div className="flex-1 text-gray-200 truncate text-sm">{file.name}</div>
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
            <div className="flex items-center gap-2 mt-1">
              <label onClick={() => fileInputRef.current.click()}>
                <Paperclip size={20} className="text-gray-400 cursor-pointer hover:text-blue-400" />
              </label>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-[#0f172a] border border-gray-700 rounded-full px-3 py-2 text-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSend}
                className="bg-gradient-to-r from-[#1B3C53] to-[#456882] p-2 rounded-full hover:brightness-110 transition"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
