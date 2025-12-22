import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { Paperclip, Send, CircleUserRound, Search, ArrowLeft, MessageSquare, X, Shield } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const api = import.meta.env.VITE_API_URL;
const socketUrl = import.meta.env.VITE_SOCKET_URL || "https://jpm-security.onrender.com";

export const socket = io(socketUrl, {
  withCredentials: true,
  transports: ["websocket", "polling"], 
});

export default function SubAdminMessagePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef();
  const hasNotifiedOnline = useRef(false);

  // State
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [guards, setGuards] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    document.title = "Messages | JPM Security Agency";
  }, []);

  // --- Helpers ---
  const normalizeId = (id) => {
    if (!id) return "";
    if (typeof id === "string") return id;
    if (typeof id === "object") {
      if (id?._id) return id._id.toString();
      if (typeof id.toString === "function") return id.toString();
    }
    return "";
  };

  const sortConversations = (list) =>
    [...list].sort((a, b) => {
      const aTime = a?.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b?.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

  const isGuardConversation = (conversation) =>
    conversation?.type === "subadmin-guard" || conversation?.type === "guard-subadmin";

  const sortGuardConversations = (list) => sortConversations(list.filter(isGuardConversation));

  const getGuardParticipant = (conversation) =>
    (conversation?.participants ?? []).find((p) => p.role === "Guard");

  const getGuardId = (conversation) => normalizeId(getGuardParticipant(conversation)?.userId);

  const getGuardName = (conversation) => {
    const guard = getGuardParticipant(conversation);
    // Prefer populated participant name
    const populated = guard?.user?.fullName || guard?.user?.name || guard?.name || "";
    if (populated) return populated;
    // Fallback: lookup from guards list by id
    const gid = getGuardId(conversation);
    const found = guards.find((g) => normalizeId(g._id) === gid);
    return found?.fullName || found?.name || "Unknown";
  };

  const isUserOnline = (userId) => onlineUsers.includes(userId);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const isToday = new Date().toDateString() === date.toDateString();
    return isToday 
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
      : date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // --- Effects ---

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auth Check
  useEffect(() => {
    if (!user && !loading) {
      navigate("/admin/login");
    }
  }, [user, loading, navigate]);

  // Socket: User Online
  useEffect(() => {
    if (user && !hasNotifiedOnline.current) {
      socket.emit("userOnline", user._id);
      hasNotifiedOnline.current = true;
    }
    socket.on("onlineUsers", (users) => setOnlineUsers(users));
    return () => socket.off("onlineUsers");
  }, [user]);

  // Fetch Guards
  useEffect(() => {
    const fetchGuards = async () => {
      try {
        const res = await fetch(`${api}/api/guards`, { credentials: "include" });
        const data = await res.json();
        setGuards(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching guards:", err);
      }
    };
    if (user) fetchGuards();
  }, [user]);

  // Fetch Conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch(`${api}/api/messages/conversations`, { credentials: "include" });
        const data = await res.json();
        const filtered = (Array.isArray(data) ? data : []).filter(
          (conv) => conv.type === "subadmin-guard" || conv.type === "guard-subadmin"
        );
        setConversations(sortGuardConversations(filtered));
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    };
    if (user) fetchConversations();
  }, [user]);

  // Active Chat Logic
  useEffect(() => {
    if (!selectedConversation || selectedConversation.isTemp) {
      if(!selectedConversation?.isTemp) setMessages([]);
      return;
    }

    setMessages([]); // Clear previous messages
    socket.emit("joinConversation", selectedConversation._id);
    socket.emit("mark_seen", { conversationId: selectedConversation._id, userId: user._id });

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${api}/api/messages/${selectedConversation._id}`, { credentials: "include" });
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading messages:", err);
      }
    };
    fetchMessages();

    const handleReceiveMessage = (msg) => {
      // Update sidebar list
      setConversations((prev) =>
        sortGuardConversations(
          prev.map((conv) =>
            normalizeId(conv._id) === normalizeId(msg.conversationId)
              ? { ...conv, lastMessage: msg }
              : conv
          )
        )
      );

      // Add to current chat if active
      if (normalizeId(selectedConversation?._id) === normalizeId(msg.conversationId)) {
        setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
      }
    };

    const handleConversationUpdated = (updatedConv) => {
      if (!isGuardConversation(updatedConv)) return;
      if (normalizeId(selectedConversation?._id) === normalizeId(updatedConv._id)) {
        setSelectedConversation(updatedConv);
      }
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === updatedConv._id);
        if (exists) return sortGuardConversations(prev.map((c) => (c._id === updatedConv._id ? updatedConv : c)));
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

  // General Updates (when not in specific chat)
  useEffect(() => {
    const handleConversationUpdated = (updatedConv) => {
      if (!isGuardConversation(updatedConv)) return;
      if (normalizeId(selectedConversation?._id) === normalizeId(updatedConv._id)) return;
      
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === updatedConv._id);
        if (exists) return sortGuardConversations(prev.map((c) => (c._id === updatedConv._id ? updatedConv : c)));
        return sortGuardConversations([updatedConv, ...prev]);
      });
    };
    socket.on("conversationUpdated", handleConversationUpdated);
    return () => socket.off("conversationUpdated", handleConversationUpdated);
  }, [selectedConversation?._id]);

  // --- Handlers ---

  const handleSend = async () => {
    if (!newMessage.trim() && !file) return;
    if (!selectedConversation) return;

    const receiver = selectedConversation.participants.find((p) => p.role === "Guard");
    if (!receiver) return;

    const formData = new FormData();
    formData.append("text", newMessage);
    formData.append("receiverId", typeof receiver.userId === "string" ? receiver.userId : receiver.userId?._id);
    formData.append("receiverRole", receiver.role);
    formData.append("type", selectedConversation.type);
    if (file) formData.append("file", file);

    try {
      const res = await fetch(`${api}/api/messages`, { method: "POST", credentials: "include", body: formData });
      if (!res.ok) return console.error(await res.text());
      const { conversation } = await res.json();

      setConversations((prev) => {
        if (selectedConversation?.isTemp) {
          const exists = prev.some((c) => c._id === conversation._id);
          const withoutTemp = prev.filter((c) => !c.isTemp);
          const updated = exists
            ? withoutTemp.map((c) => (c._id === conversation._id ? conversation : c))
            : [conversation, ...withoutTemp];
          return sortGuardConversations(updated);
        }
        const exists = prev.some((c) => c._id === conversation._id);
        const updated = exists
          ? prev.map((c) => (c._id === conversation._id ? conversation : c))
          : [conversation, ...prev];
        return sortGuardConversations(updated);
      });

      setSelectedConversation((prev) => (prev && prev._id === conversation._id ? prev : conversation));
      setNewMessage("");
      setFile(null);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleStartChat = async (guard) => {
    if (!guard?.role) return;

    const existing = conversations.find((conv) =>
      (conv.participants ?? []).some(
        (p) => ((typeof p.userId === "string" ? p.userId : p.userId?._id) || "").toString() === (guard._id || "").toString()
      )
    );
    if (existing) return setSelectedConversation(existing);

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
    setMessages([]); // Start clean for temp chat
  };

  // --- Filtering ---
  const filteredConversations = conversations.filter((conv) => {
    const guardName = getGuardName(conv).toLowerCase();
    return guardName.includes(search.trim().toLowerCase());
  });

  const guardsWithoutConversation = guards.filter((guard) => {
    const guardId = normalizeId(guard._id);
    return !conversations.some((conv) => getGuardId(conv) === guardId);
  });

  const filteredAvailableGuards = guardsWithoutConversation.filter((guard) =>
    (guard.fullName || guard.name || "").toLowerCase().includes(search.trim().toLowerCase())
  );

 return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#0f172a] text-gray-100 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`w-full md:w-80 bg-[#0b1220] border-r border-gray-800 flex flex-col h-full ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 bg-gradient-to-r from-[#1e293b] to-[#0f172a] border-b border-gray-800 flex-none">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="text-blue-500" size={24}/> Guard Chats
            </h2>
            <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                {onlineUsers.filter((u) => guards.some((g) => g._id === u)).length} Guards Online
            </div>
        </div>

        <div className="p-3 flex-none">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search guards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1e293b] border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const guardName = getGuardName(conv);
              const guardId = getGuardId(conv);
              const isOnline = isUserOnline(guardId);
              const isActive = normalizeId(selectedConversation?._id) === normalizeId(conv._id);
              const lastMsgText = conv.lastMessage?.text || (conv.lastMessage?.file ? "Sent an attachment" : "No messages");
              const time = formatDateTime(conv.lastMessage?.createdAt);

              return (
                <div
                  key={conv._id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border border-transparent ${
                    isActive ? "bg-blue-600/10 border-blue-500/50" : "hover:bg-[#1e293b]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-gray-300">
                        <Shield size={20} />
                      </div>
                      {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-[#0b1220]"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                            <h4 className="text-sm font-medium text-gray-200 truncate">{guardName}</h4>
                            <span className="text-[10px] text-gray-500">{time}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{lastMsgText}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">No active chats</div>
          )}

          {/* New Chat List */}
          {filteredAvailableGuards.length > 0 && (
            <div className="pt-4 mt-2 border-t border-gray-800">
                <p className="text-[11px] uppercase tracking-wide text-gray-500 px-3 mb-2">Start New Chat</p>
                {filteredAvailableGuards.map((guard) => (
                    <div
                        key={guard._id}
                        onClick={() => handleStartChat(guard)}
                        className="p-3 mx-2 rounded-xl cursor-pointer hover:bg-[#1e293b] transition flex items-center gap-3 opacity-80 hover:opacity-100"
                    >
                        <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-gray-400">
                                <Shield size={16}/>
                            </div>
                            {isUserOnline(normalizeId(guard._id)) && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-[#0b1220]"/>}
                        </div>
                        <span className="text-sm text-gray-300 truncate">{guard.fullName || guard.name}</span>
                    </div>
                ))}
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className={`flex-1 flex flex-col h-full w-full bg-[#1e293b] relative ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {!selectedConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-[#0f172a]/50">
            <MessageSquare size={64} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">Select a guard to start messaging</p>
          </div>
        ) : (
          <>
            <div className="flex-none w-full px-4 py-3 md:px-6 md:py-4 bg-[#0f172a] border-b border-gray-800 flex items-center gap-3 z-20 shadow-sm sticky top-0">
              <button 
                onClick={() => setSelectedConversation(null)} 
                className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition"
              >
                <ArrowLeft size={22} />
              </button>
              
              {(() => {
                const guardName = getGuardName(selectedConversation);
                const guardId = getGuardId(selectedConversation);
                const online = isUserOnline(guardId);

                return (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-lg shadow-lg relative">
                        <Shield size={20} />
                        {online && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-[#0f172a] block md:hidden"/>}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-base md:text-lg leading-tight truncate">{guardName}</h3>
                      <div className="flex items-center gap-1.5">
                        <span className={`hidden md:block w-1.5 h-1.5 rounded-full ${online ? "bg-green-500" : "bg-gray-500"}`}/>
                        <span className="text-xs text-gray-400">{online ? "Online" : "Offline"}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* SCROLLABLE MESSAGES */}
            <div className="flex-1 w-full overflow-y-auto overscroll-contain p-4 md:p-6 space-y-4 bg-slate-900/50 scroll-smooth">
              {messages.map((msg) => {
                const isMe = normalizeId(msg.senderId) === normalizeId(user._id);
                return (
                  <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] md:max-w-[60%] rounded-2xl px-4 py-3 shadow-sm text-sm md:text-base ${
                        isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-[#1e293b] border border-gray-700 text-gray-200 rounded-bl-none"
                    }`}>
                      {msg.text && <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>}
                      
                      {msg.file && (
                        <div className="mt-2">
                            {/\.(png|jpg|jpeg|gif|webp)$/i.test(msg.file) ? (
                                <img
                                    src={`${api}${msg.file}`}
                                    alt="attachment"
                                    className="rounded-lg max-h-48 md:max-h-60 w-auto object-cover cursor-pointer hover:opacity-90 transition border border-white/10"
                                    onClick={() => setPreviewImage(`${api}${msg.file}`)}
                                />
                            ) : (
                                <a href={`${api}${msg.file}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-black/20 rounded-lg text-xs hover:bg-black/30 transition break-all">
                                    <Paperclip size={14} className="flex-shrink-0"/> <span className="truncate">{msg.fileName || "Download Attachment"}</span>
                                </a>
                            )}
                        </div>
                      )}
                      
                      <div className={`text-[10px] mt-1 text-right opacity-70`}>
                        {formatDateTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* FIXED INPUT AREA */}
            <div className="flex-none w-full p-3 md:p-4 bg-[#0f172a] border-t border-gray-800 z-20">
                {file && (
                    <div className="flex items-center gap-3 mb-3 p-2 bg-[#1e293b] rounded-lg border border-gray-700 w-fit animate-in slide-in-from-bottom-2 fade-in">
                        {file.type.startsWith("image/") ? (
                            <img src={URL.createObjectURL(file)} alt="preview" className="w-10 h-10 object-cover rounded" />
                        ) : (
                            <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center"><Paperclip size={18}/></div>
                        )}
                        <span className="text-xs text-gray-300 max-w-[150px] truncate">{file.name}</span>
                        <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-400 p-1"><X size={16}/></button>
                    </div>
                )}

                <div className="flex items-end gap-2 md:gap-3">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={(e) => setFile(e.target.files[0])}
                    />
                    <button 
                        onClick={() => fileInputRef.current.click()} 
                        className="flex-shrink-0 p-3 mb-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-blue-400 transition"
                    >
                        <Paperclip size={20} />
                    </button>
                    
                    <div className="flex-1 relative">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Type a message..."
                            rows={1}
                            className="w-full bg-[#1e293b] border border-gray-700 text-white rounded-3xl pl-5 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition placeholder-gray-500 resize-none min-h-[46px] max-h-[120px] scrollbar-hide"
                            style={{height: 'auto', overflowY: newMessage.length > 50 ? 'auto' : 'hidden'}}
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!newMessage.trim() && !file}
                            className="absolute right-2 bottom-3.5 p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-full transition shadow-lg flex items-center justify-center"
                        >
                            <Send size={18} className="ml-0.5" />
                        </button>
                    </div>
                </div>
            </div>
          </>
        )}
      </main>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
            <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 p-2 bg-gray-800/50 rounded-full text-white hover:bg-gray-700 transition">
                <X size={24}/>
            </button>
            <img src={previewImage} alt="Full Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}/>
        </div>
      )}
    </div>
);
}