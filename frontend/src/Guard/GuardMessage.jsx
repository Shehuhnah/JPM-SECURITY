import { useEffect, useState, useRef } from "react";
import { Paperclip, Send, CircleUserRound, ArrowLeft, MessageSquare, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const api = import.meta.env.VITE_API_URL;
const socketUrl = import.meta.env.VITE_SOCKET_URL || "https://jpm-security.onrender.com";

export const socket = io(socketUrl, {
  withCredentials: true,
  transports: ["websocket", "polling"], 
});

export default function GuardMessage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
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
  const fileInputRef = useRef();
  const hasNotifiedOnline = useRef(false);

  // --- Effects ---

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    if (user && !hasNotifiedOnline.current) {
      socket.emit("userOnline", user._id);
      hasNotifiedOnline.current = true;
    }
    socket.on("onlineUsers", (users) => setOnlineUsers(users));
    return () => socket.off("onlineUsers");
  }, [user]);

  // Fetch Conversation
  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      try {
        const res = await fetch(`${api}/api/messages/conversations`, { credentials: "include" });
        const data = await res.json();
        const filtered = (Array.isArray(data) ? data : []).filter(
          (conv) => conv.type === "subadmin-guard" || conv.type === "guard-subadmin"
        );
        setConversations(filtered);
  
        if (filtered.length > 0) {
          setSelectedConversation(filtered[0]);
        } else {
          // Create Temp Conversation if none exists
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
  
  // Active Chat Logic
  useEffect(() => {
    if (!selectedConversation || selectedConversation.isTemp || !user) return;

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
      if (msg.conversationId === selectedConversation._id) {
        setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
      }
      setConversations((prev) =>
        prev.map((c) => (c._id === msg.conversationId ? { ...c, lastMessage: msg } : c))
      );
    };

    const handleConversationUpdated = (updatedConv) => {
      if (updatedConv._id === selectedConversation._id) {
        setSelectedConversation(updatedConv);
      }
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === updatedConv._id);
        return exists 
            ? prev.map((c) => (c._id === updatedConv._id ? updatedConv : c))
            : [updatedConv, ...prev];
      });
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("conversationUpdated", handleConversationUpdated);
    
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("conversationUpdated", handleConversationUpdated);
    };
  }, [selectedConversation?._id, user]);


  // --- Handlers ---
  const handleSend = async () => {
    if ((!newMessage.trim() && !file) || isSubmitting) return;
    if (!selectedConversation || !user) return;

    setIsSubmitting(true);

    // Determine Receiver
    let receiver = selectedConversation.participants?.find((p) => {
      const pid = (typeof p.userId === "string" ? p.userId : p.userId?._id) || "";
      return pid.toString() !== (user._id || "").toString();
    });

    // Auto-assign Subadmin for new chat
    if (!receiver && selectedConversation.isTemp) {
      try {
        const res = await fetch(`${api}/api/auth/subadmins`, { credentials: "include" });
        const data = await res.json();
        const subadmins = Array.isArray(data) ? data : [];
        if (subadmins.length > 0) {
          receiver = {
            userId: subadmins[0]._id,
            role: "Subadmin",
            name: subadmins[0].name,
          };
        } else {
          console.error("No subadmins available");
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        console.error("Error fetching subadmins:", err);
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
    formData.append("type", selectedConversation.type || "guard-subadmin");
    if (file) formData.append("file", file);

    try {
      const res = await fetch(`${api}/api/messages`, { method: "POST", credentials: "include", body: formData });
      if (!res.ok) {
          console.error(await res.text());
          setIsSubmitting(false);
          return;
      } 
      
      const { conversation } = await res.json();

      // Update State
      setConversations((prev) => {
        if (selectedConversation?.isTemp) {
          const exists = prev.some((c) => c._id === conversation._id);
          const withoutTemp = prev.filter((c) => !c.isTemp);
          return exists
            ? withoutTemp.map((c) => c._id === conversation._id ? conversation : c)
            : [conversation, ...withoutTemp];
        }
        const exists = prev.some((c) => c._id === conversation._id);
        return exists
          ? prev.map((c) => (c._id === conversation._id ? conversation : c))
          : [conversation, ...prev];
      });

      setSelectedConversation((prev) => prev && prev._id === conversation._id ? prev : conversation);
      setNewMessage("");
      setFile(null);
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
        return pid.toString() !== (user?._id || "").toString();
    }
  );

  const otherName = otherParticipant?.user?.name || otherParticipant?.user?.fullName || otherParticipant?.name || "HR Support";
  const otherId = (typeof otherParticipant?.userId === "string" ? otherParticipant.userId : otherParticipant?.userId?._id) || "";
  const isOnline = onlineUsers.includes(otherId);

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
            <h1 className="text-lg font-bold text-white leading-tight">{otherName}</h1>
            <p className="text-xs text-gray-400">{isOnline ? "Online" : "Offline"}</p>
        </div>
      </header>

      {/* Messages Area - Flexible Height */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#1e293b] scroll-smooth">
        {messages.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                <MessageSquare size={48} className="mb-2"/>
                <p>No messages yet. Start the conversation!</p>
             </div>
        )}
        
        {messages.map((msg) => {
            const senderId = (typeof msg.sender?.userId === "string" ? msg.sender.userId : msg.sender?.userId?._id) || msg.senderId || "";
            const isMe = senderId.toString() === (user?._id || "").toString();

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
                onChange={(e) => setFile(e.target.files[0])}
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
    </div>
  );
}