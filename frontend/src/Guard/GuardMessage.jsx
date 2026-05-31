import { useEffect, useState, useRef } from "react";
import { Paperclip, Send, CircleUserRound, ArrowLeft, MessageSquare, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { socket } from "../utils/socket";
import { getPersonName } from "../utils/name";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const api = import.meta.env.VITE_API_URL;

export default function GuardMessage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
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
    conversation?.type === "admin-guard" ||
    conversation?.type === "guard-admin" ||
    conversation?.type === "subadmin-guard" ||
    conversation?.type === "guard-subadmin";

  const mergeMessages = (current, incoming) => {
    const merged = [...current];
    for (const message of incoming) {
      const exists = merged.some(
        (item) => normalizeId(item?._id || item?._tempId) === normalizeId(message?._id || message?._tempId)
      );
      if (!exists) merged.push(message);
    }
    return merged.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  };

  // State
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const fileInputRef = useRef();
  const hasNotifiedOnline = useRef(false);

  // --- Effects ---

  // Scroll to bottom
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedConversation?._id]);

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 120;
  };

  // Auth Check
  useEffect(() => {
    if (!user && !loading) {
      navigate("/guard/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    document.title = "Messages | JPM Security Agency";
  }, []);

  // Socket: Online Status
  useEffect(() => {
    const registerOnline = () => {
      if (!user?._id) return;
      socket.emit("userOnline", user._id);
      console.log("[guard-message] userOnline", { userId: user._id, role: user.role, socketId: socket.id });
      hasNotifiedOnline.current = true;
    };

    if (user) registerOnline();
    const handleOnlineUsers = (users) => {
      console.log("[guard-message] onlineUsers", users);
      setOnlineUsers(users);
    };
    socket.on("connect", registerOnline);
    socket.on("onlineUsers", handleOnlineUsers);
    return () => {
      socket.off("connect", registerOnline);
      socket.off("onlineUsers", handleOnlineUsers);
    };
  }, [user]);

  // Fetch Conversation
  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      try {
        const res = await fetch(`${api}/api/messages/conversations`, { credentials: "include" });
        const data = await res.json();
        const filtered = (Array.isArray(data) ? data : []).filter(isGuardConversation);
        setConversations(sortConversations(filtered));
  
        if (filtered.length > 0) {
          setSelectedConversation(filtered[0]);
        } else {
          // Create Temp Conversation if none exists
          setSelectedConversation({
            _id: `temp-new`,
            participants: [
              { userId: user._id, role: user.role, name: getPersonName(user) },
            ],
            type: "guard-admin",
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
  
  // Active Chat Logic
  useEffect(() => {
    if (!selectedConversation || selectedConversation.isTemp || !user) {
      shouldAutoScrollRef.current = true;
      if (!selectedConversation?.isTemp) setMessages([]);
      return;
    }

    shouldAutoScrollRef.current = true;
    setMessages((prev) =>
      prev.length > 0 &&
      normalizeId(prev[0]?.conversationId) !== normalizeId(selectedConversation._id)
        ? []
        : prev
    );

    const joinActiveConversation = () => {
      socket.emit("joinConversation", selectedConversation._id);
      console.log("[guard-message] joinConversation", {
        conversationId: selectedConversation._id,
        userId: user._id,
        role: user.role,
        socketId: socket.id,
      });
    };

    joinActiveConversation();
    socket.on("connect", joinActiveConversation);
    socket.emit("mark_seen", { conversationId: selectedConversation._id, userId: user._id });

    setConversations((prev) =>
      sortConversations(
        prev.map((conv) =>
          normalizeId(conv._id) === normalizeId(selectedConversation._id)
            ? { ...conv, lastMessage: { ...conv.lastMessage, seen: true } }
            : conv
        )
      )
    );

    const refreshMessages = async (conversationId = selectedConversation._id) => {
      try {
        const res = await fetch(`${api}/api/messages/${conversationId}`, { credentials: "include" });
        const data = await res.json();
        setMessages((prev) => mergeMessages(prev, Array.isArray(data) ? data : []));
      } catch (err) {
        console.error("Error loading messages:", err);
      }
    };
    refreshMessages();
    const refreshInterval = setInterval(() => refreshMessages(), 1500);

    const handleReceiveMessage = (msg) => {
      console.log("[guard-message] receiveMessage", {
        conversationId: msg.conversationId,
        messageId: msg._id,
        selectedConversationId: selectedConversation._id,
      });
      setConversations((prev) =>
        sortConversations(
          prev.some((conv) => normalizeId(conv._id) === normalizeId(msg.conversationId))
            ? prev.map((conv) =>
                normalizeId(conv._id) === normalizeId(msg.conversationId)
                  ? { ...conv, lastMessage: msg }
                  : conv
              )
            : prev
        )
      );

      if (normalizeId(msg.conversationId) === normalizeId(selectedConversation._id)) {
        setMessages((prev) => (prev.some((m) => normalizeId(m._id) === normalizeId(msg._id)) ? prev : [...prev, msg]));
        socket.emit("mark_seen", { conversationId: msg.conversationId, userId: user._id });
        refreshMessages(msg.conversationId);
      }
    };

    const handleConversationUpdated = async (updatedConv) => {
      console.log("[guard-message] conversationUpdated", {
        conversationId: updatedConv?._id,
        type: updatedConv?.type,
        selectedConversationId: selectedConversation?._id,
      });
      if (!isGuardConversation(updatedConv)) return;

      if (normalizeId(updatedConv._id) === normalizeId(selectedConversation._id)) {
        setSelectedConversation(updatedConv);
        try {
          refreshMessages(updatedConv._id);
        } catch (err) {
          console.error("Error refreshing active conversation:", err);
        }
      }
      setConversations((prev) => {
        const exists = prev.some((c) => normalizeId(c._id) === normalizeId(updatedConv._id));
        const updated = exists
          ? prev.map((c) => (normalizeId(c._id) === normalizeId(updatedConv._id) ? updatedConv : c))
          : [updatedConv, ...prev];
        return sortConversations(updated);
      });
    };

    const handleMessagesSeen = ({ conversationId }) => {
      console.log("[guard-message] messages_seen", {
        conversationId,
        selectedConversationId: selectedConversation?._id,
      });
      setConversations((prev) =>
        prev.map((conv) =>
          normalizeId(conv._id) === normalizeId(conversationId)
            ? { ...conv, lastMessage: { ...conv.lastMessage, seen: true } }
            : conv
        )
      );

      if (normalizeId(selectedConversation._id) === normalizeId(conversationId)) {
        setMessages((prev) => prev.map((message) => ({ ...message, seen: true })));
        refreshMessages(conversationId);
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("conversationUpdated", handleConversationUpdated);
    socket.on("messages_seen", handleMessagesSeen);
    
    return () => {
      clearInterval(refreshInterval);
      socket.off("connect", joinActiveConversation);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("conversationUpdated", handleConversationUpdated);
      socket.off("messages_seen", handleMessagesSeen);
    };
  }, [selectedConversation?._id, user]);


  // --- Handlers ---
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    const ext = selected.name.split(".").pop().toLowerCase();
    const allowed = ["png", "jpg", "jpeg", "webp", "gif", "pdf", "docx"];
    if (!allowed.includes(ext)) {
      toast.error("Unsupported file type! Only image, pdf, docx are allowed.", { theme: "dark" });
      e.target.value = "";
      return;
    }
    setFile(selected);
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !file) || isSubmitting) return;
    if (!selectedConversation || !user) return;

    setIsSubmitting(true);

    // Determine Receiver
    let receiver = selectedConversation.participants?.find((p) => {
      const pid = (typeof p.userId === "string" ? p.userId : p.userId?._id) || "";
      return pid.toString() !== (user._id || "").toString();
    });

    // Auto-assign Admin for new chat
    if (!receiver && selectedConversation.isTemp) {
      try {
        const res = await fetch(`${api}/api/auth/admins`, { credentials: "include" });
        const data = await res.json();
        const admins = Array.isArray(data) ? data : [];
        if (admins.length > 0) {
          receiver = {
            userId: admins[0]._id,
            role: "Admin",
            name: admins[0].name,
          };
        } else {
          console.error("No admins available");
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        console.error("Error fetching admins:", err);
        setIsSubmitting(false);
        return;
      }
    }

    if (!receiver) {
        setIsSubmitting(false);
        return;
    }

    const formData = new FormData();
    formData.append("text", newMessage);
    formData.append("receiverId", typeof receiver.userId === "string" ? receiver.userId : receiver.userId?._id);
    formData.append("receiverRole", receiver.role);
    formData.append("type", selectedConversation.type || "guard-admin");
    if (file) formData.append("file", file);

    try {
      console.log("[guard-message] handleSend:start", {
        conversationId: selectedConversation._id,
        receiverId: typeof receiver.userId === "string" ? receiver.userId : receiver.userId?._id,
        receiverRole: receiver.role,
        type: selectedConversation.type || "guard-admin",
      });
      const res = await fetch(`${api}/api/messages`, { method: "POST", credentials: "include", body: formData });
      if (!res.ok) {
          console.error(await res.text());
          setIsSubmitting(false);
          return;
      } 
      
      const { message: sentMessage, conversation } = await res.json();
      console.log("[guard-message] handleSend:success", {
        conversationId: conversation?._id,
        messageId: sentMessage?._id,
      });

      // Update State
      setConversations((prev) => {
        if (selectedConversation?.isTemp) {
          const exists = prev.some((c) => normalizeId(c._id) === normalizeId(conversation._id));
          const withoutTemp = prev.filter((c) => !c.isTemp);
          const updated = exists
            ? withoutTemp.map((c) => normalizeId(c._id) === normalizeId(conversation._id) ? conversation : c)
            : [conversation, ...withoutTemp];
          return sortConversations(updated);
        }
        const exists = prev.some((c) => normalizeId(c._id) === normalizeId(conversation._id));
        const updated = exists
          ? prev.map((c) => (normalizeId(c._id) === normalizeId(conversation._id) ? conversation : c))
          : [conversation, ...prev];
        return sortConversations(updated);
      });

      setSelectedConversation(conversation);
      if (sentMessage) {
        shouldAutoScrollRef.current = true;
        setMessages((prev) =>
          prev.some((msg) => normalizeId(msg._id || msg._tempId) === normalizeId(sentMessage._id || sentMessage._tempId))
            ? prev
            : [...prev, sentMessage]
        );
      }
      setNewMessage("");
      setFile(null);
      shouldAutoScrollRef.current = true;
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleString([], {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  // Identify the "Other" participant for UI display
  const otherParticipant = selectedConversation?.participants?.find(
    (p) => {
        const pid = (typeof p.userId === "string" ? p.userId : p.userId?._id) || "";
        return normalizeId(pid) !== normalizeId(user?._id);
    }
  );

  const otherName = getPersonName(otherParticipant?.user || otherParticipant, "Admin Support");
  const otherId = (typeof otherParticipant?.userId === "string" ? otherParticipant.userId : otherParticipant?.userId?._id) || "";
  const isOnline = onlineUsers.includes(normalizeId(otherId));
  const headerName = isGuardConversation(selectedConversation) ? "HR Team" : otherName;

  // Use h-[100dvh] to fix mobile browser address bar issues
  return (
    <div className="flex flex-col h-[100dvh] bg-[#0f172a] text-gray-100 font-sans overflow-hidden">
      
      {/* Header - Fixed Height */}
      <header className="px-6 py-4 bg-[#0b1220] border-b border-gray-800 flex items-center gap-4 shadow-md z-20 shrink-0">
        <div className="relative">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-gray-300">
                <CircleUserRound size={24} />
            </div>
            {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0b1220] rounded-full"></span>}
        </div>
        <div>
            <h1 className="text-lg font-bold text-white leading-tight">{headerName}</h1>
            <p className="text-xs text-gray-400">{isOnline ? "Online" : "Offline"}</p>
        </div>
      </header>

      {/* Messages Area - Flexible Height */}
      <div
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#1e293b] scroll-smooth"
      >
        {messages.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                <MessageSquare size={48} className="mb-2"/>
                <p>No messages yet. Start the conversation!</p>
             </div>
        )}
        
        {messages.map((msg) => {
            const senderId = normalizeId(
              (typeof msg.sender?.userId === "string" ? msg.sender.userId : msg.sender?.userId?._id) || msg.senderId
            );
            const isMe = senderId === normalizeId(user?._id);

            return (
                <div key={msg._id || msg.tempId} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                    isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-[#0f172a] border border-gray-700 text-gray-200 rounded-bl-none"
                }`}>
                    {msg.text && <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>}
                    
                    {msg.file && (
                    <div className="mt-2">
                        {/\.(png|jpg|jpeg|gif|webp)$/i.test(msg.file) ? (
                        <img
                            src={`${api}${msg.file}`}
                            alt="attachment"
                            className="rounded-lg max-h-60 w-auto object-cover cursor-pointer hover:opacity-90 transition border border-white/10"
                            onClick={() => setPreviewImage(`${api}${msg.file}`)}
                        />
                        ) : (
                        <a href={`${api}${msg.file}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-black/20 rounded-lg text-xs hover:bg-black/30 transition text-blue-200 underline">
                            <Paperclip size={14}/> {msg.fileName || "Download Attachment"}
                        </a>
                        )}
                    </div>
                    )}
                    
                    <div className={`text-[10px] mt-1 text-right ${isMe ? "text-blue-200" : "text-gray-500"}`}>
                    {formatDateTime(msg.createdAt)}
                    </div>
                </div>
                </div>
            );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed Bottom */}
      <div className="p-3 sm:p-4 bg-[#0b1220] border-t border-gray-800 z-20 shrink-0 w-full">
        {/* File Preview */}
        {file && (
            <div className="flex items-center gap-3 mb-3 p-2 bg-[#1e293b] rounded-lg border border-gray-700 w-fit max-w-full animate-in slide-in-from-bottom-2 duration-200">
                {file.type.startsWith("image/") ? (
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-12 h-12 object-cover rounded" />
                ) : (
                    <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center"><Paperclip size={20}/></div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 truncate max-w-[150px]">{file.name}</p>
                    <p className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={() => setFile(null)} className="p-1 bg-gray-700 rounded-full hover:bg-red-500/20 hover:text-red-400 text-gray-400 transition">
                    <X size={14}/>
                </button>
            </div>
        )}

        <div className="flex items-center gap-3">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
            />
            <button 
                onClick={() => fileInputRef.current.click()} 
                className="p-3 rounded-full bg-[#1e293b] text-gray-400 hover:text-blue-400 hover:bg-slate-800 transition shadow-sm"
                title="Attach File"
            >
                <Paperclip size={20} />
            </button>

            <div className="flex-1 relative">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message..."
                    disabled={isSubmitting}
                    className="w-full bg-[#1e293b] border border-gray-700 text-white rounded-full pl-5 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition placeholder-gray-500 disabled:opacity-50"
                />
                <button 
                    onClick={handleSend}
                    disabled={(!newMessage.trim() && !file) || isSubmitting}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full transition shadow-md"
                >
                    <Send size={16} className="ml-0.5" />
                </button>
            </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <button onClick={() => setPreviewImage(null)} className="absolute top-6 right-6 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-full text-white transition">
                <X size={24}/>
            </button>
            <img src={previewImage} alt="Full Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
        </div>
      )}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
