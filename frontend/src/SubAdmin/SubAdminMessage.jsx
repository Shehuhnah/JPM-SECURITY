import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { Paperclip, Send, CircleUserRound, Search, ArrowLeft } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const socket = io("http://localhost:5000");

export default function SubAdminMessagePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [guards, setGuards] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef();
  const hasNotifiedOnline = useRef(false);

  useEffect(() => {
    document.title = "Message | JPM Security Agency"
  })

  const sortConversations = (list) =>
    [...list].sort((a, b) => {
      const aTime = a?.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b?.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

  const isGuardConversation = (conversation) =>
    conversation?.type === "subadmin-guard" || conversation?.type === "guard-subadmin";

  const normalizeId = (id) => {
    if (!id) return "";
    if (typeof id === "string") return id;
    if (typeof id === "object") {
      if (id?._id) return id._id.toString();
      if (typeof id.toString === "function") return id.toString();
    }
    return "";
  };

  const sortGuardConversations = (list) => sortConversations(list.filter(isGuardConversation));

  const getGuardParticipant = (conversation) =>
    (conversation?.participants ?? []).find((p) => p.role === "Guard");

  const getGuardId = (conversation) => normalizeId(getGuardParticipant(conversation)?.userId);

  const getGuardName = (conversation) => {
    const guard = getGuardParticipant(conversation);
    // Prefer populated participant name
    const populated =
      guard?.user?.fullName || guard?.user?.name || guard?.name || "";
    if (populated) return populated;
    // Fallback: lookup from guards list by id
    const gid = getGuardId(conversation);
    const found = guards.find((g) => normalizeId(g._id) === gid);
    return found?.fullName || found?.name || "Unknown";
  };

  const isUserOnline = (userId) => onlineUsers.includes(userId);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Notify server that Subadmin is online
  useEffect(() => {
    if (user && !hasNotifiedOnline.current) {
      socket.emit("userOnline", user._id);
      hasNotifiedOnline.current = true;
    }
    socket.on("onlineUsers", (users) => setOnlineUsers(users));
    return () => socket.off("onlineUsers");
  }, [user]);

  // Fetch Guards only
  useEffect(() => {
     if (!user && !loading) {
      navigate("/admin/login");
      return;
    }
    const fetchGuards = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/guards", {
          credentials: "include"
        });
        const data = await res.json();
        setGuards(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching guards:", err);
      }
    };
    fetchGuards();
  }, [user]);

  // Fetch conversations (Subadmin ↔ Guard)
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/api/messages/conversations",{ 
            credentials: "include"
          }
        );
        const data = await res.json();
        const filtered = (Array.isArray(data) ? data : []).filter(
          (conv) =>
            conv.type === "subadmin-guard" || conv.type === "guard-subadmin"
        );
        setConversations(sortGuardConversations(filtered));
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    };
    fetchConversations();
  }, [user]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    if (selectedConversation.isTemp) {
      setMessages([]);
      return;
    }

    setMessages([]);

    socket.emit("joinConversation", selectedConversation._id);
    socket.emit("mark_seen", {
      conversationId: selectedConversation._id,
      userId: user._id,
    });

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/messages/${selectedConversation._id}`,{
            credentials: "include"
          }
        );
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading messages:", err);
      }
    };
    fetchMessages();

    const handleReceiveMessage = (msg) => {
      // Update conversation previews regardless
      setConversations((prev) =>
        sortGuardConversations(
          prev.map((conv) =>
            normalizeId(conv._id) === normalizeId(msg.conversationId)
              ? { ...conv, lastMessage: msg }
              : conv
          )
        )
      );

      // Only append to messages if this is the active conversation
      if (normalizeId(selectedConversation?._id) !== normalizeId(msg.conversationId)) {
        return;
      }

      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]
      );
    };

    const handleConversationUpdated = (updatedConv) => {
      if (!isGuardConversation(updatedConv)) return;
      
      // Update selected conversation if it's the current one
      if (normalizeId(selectedConversation?._id) === normalizeId(updatedConv._id)) {
        setSelectedConversation(updatedConv);
      }
      
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === updatedConv._id);
        if (exists)
          return sortGuardConversations(
            prev.map((c) => (c._id === updatedConv._id ? updatedConv : c))
          );
        return sortGuardConversations([updatedConv, ...prev]);
      });
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("conversationUpdated", handleConversationUpdated);
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("conversationUpdated", handleConversationUpdated);
    };
  }, [selectedConversation?._id, user]);

  // Handle conversation updates (for sidebar list when not in selected conversation)
  useEffect(() => {
    const handleConversationUpdated = (updatedConv) => {
      if (!isGuardConversation(updatedConv)) return;
      
      // Only update if it's not the currently selected conversation (handled above)
      if (normalizeId(selectedConversation?._id) === normalizeId(updatedConv._id)) {
        return;
      }
      
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === updatedConv._id);
        if (exists)
          return sortGuardConversations(
            prev.map((c) => (c._id === updatedConv._id ? updatedConv : c))
          );
        return sortGuardConversations([updatedConv, ...prev]);
      });
    };
    socket.on("conversationUpdated", handleConversationUpdated);
    return () => socket.off("conversationUpdated", handleConversationUpdated);
  }, [selectedConversation?._id]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() && !file) return;
    if (!selectedConversation) return;

    const receiver = selectedConversation.participants.find((p) => p.role === "Guard");
    if (!receiver) return;

    const formData = new FormData();
    formData.append("text", newMessage);
    formData.append(
      "receiverId",
      typeof receiver.userId === "string" ? receiver.userId : receiver.userId?._id
    );
    formData.append("receiverRole", receiver.role);
    formData.append("type", selectedConversation.type); // <-- dynamic
    if (file) formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) return console.error(await res.text());
      const { message, conversation } = await res.json();

      // Update conversation list: handle temp -> real replacement or regular update
      setConversations((prev) => {
        // If we were on a temp conversation, replace/prepend the real one
        if (selectedConversation?.isTemp) {
          // If conversation already exists in list, update it, otherwise add it
          const exists = prev.some((c) => c._id === conversation._id);
          const withoutTemp = prev.filter((c) => !c.isTemp);
          const updated = exists
            ? withoutTemp.map((c) =>
                c._id === conversation._id ? conversation : c
              )
            : [conversation, ...withoutTemp];
          return sortGuardConversations(updated);
        }
        // Regular path: update if exists else add
        const exists = prev.some((c) => c._id === conversation._id);
        const updated = exists
          ? prev.map((c) => (c._id === conversation._id ? conversation : c))
          : [conversation, ...prev];
        return sortGuardConversations(updated);
      });

      // Switch selection to the real conversation
      setSelectedConversation((prev) =>
        prev && prev._id === conversation._id ? prev : conversation
      );
      setNewMessage("");
      setFile(null);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Start chat with a Guard
  const handleStartChat = async (guard) => {
    if (!guard?.role) return;

    // Check if conversation already exists
    const existing = conversations.find((conv) =>
      (conv.participants ?? []).some(
        (p) =>
          ((typeof p.userId === "string" ? p.userId : p.userId?._id) || "").toString() ===
          (guard._id || "").toString()
      )
    );
    if (existing) return setSelectedConversation(existing);

    // Create a temporary conversation locally
    const tempConversation = {
      _id: `temp-${Date.now()}`,
      participants: [
        { userId: user._id, role: user.role, name: user.name },
        { userId: guard._id, role: guard.role, name: guard.fullName || guard.name },
      ],
      type: "subadmin-guard",
      lastMessage: null,
      isTemp: true,
    };
    setSelectedConversation(tempConversation);
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

  const filteredConversations = conversations.filter((conv) => {
    const guardName = getGuardName(conv).toLowerCase();
    return guardName.includes(search.trim().toLowerCase());
  });

  const guardsWithoutConversation = guards.filter((guard) => {
    const guardId = normalizeId(guard._id);
    return !conversations.some((conv) => getGuardId(conv) === guardId);
  });

  const filteredAvailableGuards = guardsWithoutConversation.filter((guard) =>
    (guard.fullName || guard.name || "")
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0f172a] text-gray-100">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-[#0b1220] border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Guard Chats</h2>
          <span className="text-xs text-gray-400">
            {onlineUsers.filter((u) => guards.some((g) => g._id === u)).length} Online
          </span>
        </div>

        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search guards or chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0f172a] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-[#0b1220]">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const guardName = getGuardName(conv);
              const guardId = getGuardId(conv);
              const lastMessage = conv.lastMessage;
              const lastSenderId = normalizeId(lastMessage?.senderId);
              const userId = normalizeId(user._id);
              const hasUnread =
                lastMessage && !lastMessage.seen && lastSenderId && lastSenderId !== userId;
              const previewText = lastMessage?.text?.trim()
                ? lastMessage.text
                : lastMessage
                ? "Sent a message"
                : "No messages yet";
              const timestamp = lastMessage?.createdAt ? formatDateTime(lastMessage.createdAt) : "";
              const isSelected =
                normalizeId(selectedConversation?._id) === normalizeId(conv._id);

              return (
                <div
                  key={conv._id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-3 mb-2 cursor-pointer transition-all rounded-xl border ${
                    isSelected
                      ? "bg-[#1e293b] border-blue-500 shadow-md"
                      : "border-transparent hover:bg-[#162236] hover:border-[#1e3a5f]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <CircleUserRound strokeWidth={1.5} size={36} className="text-gray-300" />
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[#0b1220] ${
                          isUserOnline(guardId) ? "bg-green-500" : "bg-gray-500"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate text-gray-100">{guardName}</p>
                        {timestamp && (
                          <span className="text-[10px] text-gray-500 whitespace-nowrap">
                            {timestamp}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs truncate mt-1 ${
                          hasUnread ? "text-gray-100 font-semibold" : "text-gray-400"
                        }`}
                      >
                        {previewText}
                      </p>
                    </div>
                    {hasUnread && <span className="w-2 h-2 rounded-full bg-blue-400" />}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 text-sm text-center mt-4">No conversations yet</p>
          )}
        </div>

        {filteredAvailableGuards.length > 0 && (
          <div className="border-t border-gray-800 px-2 pt-3 pb-4 space-y-2 bg-[#0b1220]">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 px-1">
              Start new chat
            </p>
            {filteredAvailableGuards.map((guard) => (
              <button
                key={guard._id}
                onClick={() => handleStartChat(guard)}
                className="w-full text-left px-3 py-2 rounded-lg bg-[#111c33] hover:bg-[#162236] transition flex items-center justify-between text-sm text-gray-200"
              >
                <span className="truncate">{guard.fullName || guard.name}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isUserOnline(normalizeId(guard._id)) ? "bg-green-500" : "bg-gray-600"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* Chat Window */}
      <main className="flex-1 flex flex-col bg-[#1e293b] border-l border-gray-700">
        <div className="p-4 border-b border-gray-700 bg-[#0f172a] flex items-center gap-3">
          <CircleUserRound size={38} />
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">
              {selectedConversation
                ? (() => {
                    const other = selectedConversation.participants?.find((p) => p.role === "Guard");
                    // Try populated user first
                    const populatedName = other?.user?.fullName || other?.user?.name;
                    if (populatedName) return populatedName;
                    // Fallback to guards list lookup
                    const guardId = normalizeId(other?.userId);
                    if (guardId) {
                      const found = guards.find((g) => normalizeId(g._id) === guardId);
                      if (found) return found.fullName || found.name;
                    }
                    return other?.name || "Unknown";
                  })()
                : "Select a guard"}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs ${selectedConversation && (() => {
                  const other = selectedConversation.participants?.find((p) => p.role === "Guard");
                  const otherId = (typeof other?.userId === "string" ? other?.userId : other?.userId?._id) || "";
                  return isUserOnline(otherId);
                })()
                  ? "text-green-400"
                  : "text-gray-500"
              }`}>
                {selectedConversation &&
                (() => {
                  const other = selectedConversation.participants?.find((p) => p.role === "Guard");
                  const otherId = (typeof other?.userId === "string" ? other?.userId : other?.userId?._id) || "";
                  return isUserOnline(otherId);
                })()
                  ? "Online"
                  : "Offline"}
              </span>
              {selectedConversation?.servingSubadmin && (
                <>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-blue-400">
                    Serving: <span className="font-semibold">
                      {selectedConversation.servingSubadmin?.user?.name || 
                       selectedConversation.servingSubadmin?.name || 
                       "Unknown"}
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0b1220]">
          {messages.map((msg) => {
            const isFromSubadmin =
              msg?.sender?.role === "Subadmin" ||
              msg?.senderUser?.role === "Subadmin" ||
              ((msg?.senderId || "").toString() === (user._id || "").toString());
            const isImage = msg.file && /\.(png|jpg|jpeg|gif|webp)$/i.test(msg.file);
            return (
              <div
                key={msg._id}
                className={`flex items-end ${isFromSubadmin ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl max-w-xs break-words ${
                    isFromSubadmin ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-200"
                  }`}
                >
                  {msg.text}
                  {msg.file && (
                    isImage ? (
                      <img
                        src={`http://localhost:5000${msg.file}`}
                        alt={msg.fileName || "attachment"}
                        className="mt-2 rounded border max-w-full max-h-60 object-contain cursor-pointer"
                        onClick={() => setPreviewImage(`http://localhost:5000${msg.file}`)}
                      />
                    ) : (
                      <a
                        href={`http://localhost:5000${msg.file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-200 block mt-2"
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

        {/* Image Preview Modal */}
        {previewImage && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 left-4 text-white text-2xl"
              aria-label="Back"
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

        {/* Input */}
        <div className="p-4 border-t border-gray-700 bg-[#1e293b] flex flex-col gap-2">
          {file && (
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2 max-w-xs">
              {file.type?.startsWith("image/") ? (
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
              className="flex-1 bg-[#0f172a] border border-gray-700 rounded-full px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              className="bg-gradient-to-r from-[#1B3C53] to-[#456882] p-2 rounded-full hover:brightness-110 transition"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
