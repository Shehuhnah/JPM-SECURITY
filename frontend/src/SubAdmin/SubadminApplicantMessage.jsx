import { useEffect, useState, useRef, useCallback } from "react";
import { Paperclip, Send, CircleUserRound, Search, ArrowLeft, MessageSquare, Briefcase, MapPin, Clock, Calendar, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const api = import.meta.env.VITE_API_URL;
const socketUrl = import.meta.env.VITE_SOCKET_URL || "https://jpm-security.onrender.com";

export const socket = io(socketUrl, {
  withCredentials: true,
  transports: ["websocket", "polling"], 
});

export default function SubadminApplicantMessage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef();
  const hasNotifiedOnline = useRef(false);

  // State
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    document.title = "Applicant Messages | JPM Security Agency";
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

  const isApplicantConversation = (conversation) =>
    conversation?.type === "subadmin-applicant" || conversation?.type === "applicant-subadmin";

  const sortApplicantConversations = (list) => sortConversations(list.filter(isApplicantConversation));

  const getApplicantParticipant = (conversation) =>
    (conversation?.participants ?? []).find((p) => p.role === "Applicant");

  const getApplicantId = (conversation) => normalizeId(getApplicantParticipant(conversation)?.userId);

  const getApplicantName = (conversation) => {
    if (conversation?.applicantDisplayName) return conversation.applicantDisplayName;
    const applicant = getApplicantParticipant(conversation);
    
    // Check populated user object
    if (applicant?.user?.firstName && applicant?.user?.lastName) return `${applicant.user.firstName} ${applicant.user.lastName}`;
    if (applicant?.user?.name) return applicant.user.name;
    if (applicant?.user?.fullName) return applicant.user.fullName;
    
    // Check direct name property
    if (applicant?.name) return applicant.name;
    
    // Check nested userId object
    if (typeof applicant?.userId === "object") {
       return applicant?.userId?.name || applicant?.userId?.fullName || "Unknown Applicant";
    }

    return "Unknown Applicant";
  };

  const isUserOnline = (userId) => onlineUsers.includes(normalizeId(userId));

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const isToday = new Date().toDateString() === date.toDateString();
    return isToday 
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
      : date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // --- Parsing Forwarded Job Posts ---
  const renderForwardedPost = (text) => {
    if (!text || typeof text !== "string") return null;
    if (!text.startsWith("[Forwarded Job Post]")) return null;

    const parts = text.split(/\n\n+/);
    const forwardedBlock = parts[0] || "";
    const remaining = text.slice(forwardedBlock.length).trim();

    const lines = forwardedBlock.split("\n").slice(1);
    const details = {};
    let inDescription = false;
    let descLines = [];

    for (const line of lines) {
      if (line.trim().toLowerCase().startsWith("description:")) {
        inDescription = true;
        const first = line.split(":")[1]?.trim();
        if (first) descLines.push(first);
        continue;
      }
      if (inDescription) {
        descLines.push(line);
      } else {
        const [k, ...rest] = line.split(":");
        const key = k?.trim();
        const value = rest.join(":").trim();
        if (key && value) details[key] = value;
      }
    }

    return (
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-[#1e293b] to-[#0f172a] shadow-lg overflow-hidden">
          <div className="bg-blue-600/20 px-4 py-2 border-b border-blue-500/20 flex items-center gap-2">
            <Briefcase size={14} className="text-blue-400"/>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Forwarded Job Opportunity</span>
          </div>
          
          <div className="p-4 space-y-3">
            {details["Title"] && (
                <h4 className="text-white font-bold text-lg leading-tight">{details["Title"]}</h4>
            )}
            
            <div className="space-y-2 text-sm">
                {details["Position"] && (
                    <div className="flex items-center gap-2 text-gray-300">
                        <span className="font-semibold text-gray-500 min-w-[70px]">Position:</span> 
                        {details["Position"]}
                    </div>
                )}
                {details["Location"] && (
                    <div className="flex items-center gap-2 text-gray-300">
                        <MapPin size={14} className="text-red-400"/> 
                        {details["Location"]}
                    </div>
                )}
                {details["Employment"] && (
                    <div className="flex items-center gap-2 text-gray-300">
                        <Clock size={14} className="text-yellow-400"/> 
                        {details["Employment"]}
                    </div>
                )}
                {details["Posted"] && (
                    <div className="flex items-center gap-2 text-gray-400 text-xs mt-2 pt-2 border-t border-gray-700">
                        <Calendar size={12}/> 
                        Posted: {details["Posted"]}
                    </div>
                )}
            </div>

            {descLines.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Description</p>
                    <p className="text-gray-300 text-xs line-clamp-3 italic">"{descLines.join(" ")}"</p>
                </div>
            )}
          </div>
        </div>
        
        {remaining && (
          <div className="mt-2 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
            <p className="text-xs text-gray-300 italic">"{remaining}"</p>
          </div>
        )}
      </div>
    );
  };

  // --- Effects ---

  // Auth & Scroll
  useEffect(() => {
    if (!user && !loading) {
      navigate("/admin/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket: User Online
  useEffect(() => {
    if (user && !hasNotifiedOnline.current) {
      socket.emit("userOnline", user._id);
      hasNotifiedOnline.current = true;
    }
    socket.on("onlineUsers", (users) => setOnlineUsers(users));
    return () => socket.off("onlineUsers");
  }, [user]);

  // Fetch Conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${api}/api/messages/conversations`, { credentials: "include" });
      if (!res.ok) return;
      
      const data = await res.json();
      const filtered = (Array.isArray(data) ? data : []).filter(
        (conv) => conv.type === "subadmin-applicant" || conv.type === "applicant-subadmin"
      );
      
      // Deduplicate and process
      const unique = filtered.filter((conv, index, self) => 
        index === self.findIndex((c) => normalizeId(c._id) === normalizeId(conv._id))
      ).map((conv) => ({
        ...conv,
        applicantDisplayName: getApplicantName(conv),
      }));
      
      setConversations(sortApplicantConversations(unique));
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Active Chat Logic
  useEffect(() => {
    if (!selectedConversation || selectedConversation.isTemp) {
      if(!selectedConversation?.isTemp) setMessages([]);
      return;
    }

    setMessages([]);
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

    // Socket Listeners for Active Chat
    const handleReceiveMessage = (msg) => {
      // 1. Update Messages if current chat
      if (normalizeId(selectedConversation?._id) === normalizeId(msg.conversationId)) {
        setMessages((prev) => prev.some((m) => normalizeId(m._id) === normalizeId(msg._id)) ? prev : [...prev, msg]);
        socket.emit("mark_seen", { conversationId: msg.conversationId, userId: user._id });
      }
    
      // 2. Update Conversations List (Preview)
      setConversations((prev) => {
        const msgConvId = normalizeId(msg.conversationId);
        const existingConv = prev.find((c) => normalizeId(c._id) === msgConvId);
        
        if (!existingConv) return prev; // If new convo, usually fetchConversations handles it or explicit add
        
        return sortApplicantConversations(
          prev.map((conv) => {
            if (normalizeId(conv._id) === msgConvId) {
              const existingLM = conv.lastMessage || {};
              const nextSender = msg.sender || msg.senderUser || existingLM.sender;
              return {
                ...conv,
                lastMessage: {
                  ...existingLM,
                  ...msg,
                  sender: nextSender,
                  seen: normalizeId(selectedConversation?._id) === msgConvId ? true : msg.seen,
                },
                applicantDisplayName: conv.applicantDisplayName || getApplicantName(conv)
              };
            }
            return conv;
          })
        );
      });
    };

    const handleMessageSeen = ({ conversationId }) => {
        if (normalizeId(conversationId) === normalizeId(selectedConversation?._id)) {
            // Update UI inside active chat
            setMessages(prev => prev.map(m => ({...m, seen: true}))); // simplified logic
            
            // Update Sidebar preview
            setConversations((prev) =>
                prev.map((conv) =>
                normalizeId(conv._id) === normalizeId(conversationId)
                    ? { ...conv, lastMessage: { ...conv.lastMessage, seen: true } }
                    : conv
                )
            );
        }
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messages_seen", handleMessageSeen);
    
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messages_seen", handleMessageSeen);
    };
  }, [selectedConversation?._id, user]);

  // General Updates (New conversations, etc.)
  useEffect(() => {
    const handleConversationUpdated = (updatedConv) => {
      if (!isApplicantConversation(updatedConv)) return;
      const updatedConvId = normalizeId(updatedConv._id);

      // If active chat updated, merge details
      if (normalizeId(selectedConversation?._id) === updatedConvId) {
         setSelectedConversation((prev) => ({
             ...prev, 
             ...updatedConv,
             applicantDisplayName: prev?.applicantDisplayName || getApplicantName(updatedConv)
         }));
      }

      // Update List
      setConversations((prev) => {
        const unique = prev.filter((c, index, self) => index === self.findIndex((conv) => normalizeId(conv._id) === normalizeId(c._id)));
        const exists = unique.some((c) => normalizeId(c._id) === updatedConvId);
        
        if (exists) {
          return sortApplicantConversations(
            unique.map((c) => normalizeId(c._id) === updatedConvId ? { ...c, ...updatedConv, applicantDisplayName: c.applicantDisplayName || getApplicantName(updatedConv) } : c)
          );
        }
        const withName = { ...updatedConv, applicantDisplayName: getApplicantName(updatedConv) };
        return sortApplicantConversations([withName, ...unique]);
      });
    };

    socket.on("conversationUpdated", handleConversationUpdated);
    return () => socket.off("conversationUpdated", handleConversationUpdated);
  }, [selectedConversation?._id]);


  // --- Handlers ---

  const handleSend = async () => {
    if (!newMessage.trim() && !file) return;
    if (!selectedConversation) return;

    const applicant = selectedConversation.participants.find((p) => p.role === "Applicant");
    if (!applicant) return;

    const formData = new FormData();
    formData.append("text", newMessage);
    formData.append("receiverId", typeof applicant.userId === "string" ? applicant.userId : applicant.userId?._id);
    formData.append("receiverRole", applicant.role);
    formData.append("type", selectedConversation.type);
    if (file) formData.append("file", file);

    try {
      const res = await fetch(`${api}/api/messages`, { method: "POST", credentials: "include", body: formData });
      if (!res.ok) return console.error(await res.text());
      const { conversation } = await res.json();

      // Update state immediately
      setConversations((prev) => {
        const convWithName = { ...conversation, applicantDisplayName: getApplicantName(conversation) };
        const exists = prev.some((c) => c._id === conversation._id);
        const withoutTemp = prev.filter((c) => !c.isTemp);
        
        const updated = exists
            ? withoutTemp.map((c) => c._id === conversation._id ? convWithName : c)
            : [convWithName, ...withoutTemp];
            
        return sortApplicantConversations(updated);
      });

      setSelectedConversation((prev) => prev && prev._id === conversation._id ? { ...prev, ...conversation } : conversation);
      setNewMessage("");
      setFile(null);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const applicantName = (conv.applicantDisplayName || getApplicantName(conv)).toLowerCase();
    return applicantName.includes(search.trim().toLowerCase());
  });

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0f172a] text-gray-100 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className={`w-full md:w-80 bg-[#0b1220] border-r border-gray-800 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 bg-gradient-to-r from-[#1e293b] to-[#0f172a] border-b border-gray-800">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="text-blue-500" size={24}/> Inquiries
            </h2>
            <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                {conversations.length} Active Conversations
            </div>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search applicants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1e293b] border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const applicantName = conv.applicantDisplayName || getApplicantName(conv);
              const applicantId = getApplicantId(conv);
              const isOnline = isUserOnline(applicantId);
              const isActive = normalizeId(selectedConversation?._id) === normalizeId(conv._id);
              
              const lastMsgText = conv.lastMessage?.text || (conv.lastMessage?.file ? "Sent an attachment" : "No messages");
              const displayMsg = lastMsgText.startsWith("[Forwarded Job Post]") ? "Forwarded a Job Post" : lastMsgText;
              
              const time = formatDateTime(conv.lastMessage?.createdAt);
              const senderId = normalizeId(conv.lastMessage?.senderId || conv.lastMessage?.sender?._id);
              const isUnread = !conv.lastMessage?.seen && senderId !== normalizeId(user._id);

              return (
                <div
                  key={conv._id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border border-transparent ${
                    isActive 
                        ? "bg-blue-600/10 border-blue-500/50" 
                        : "hover:bg-[#1e293b] border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-gray-300 font-bold border border-slate-600">
                        {applicantName.charAt(0).toUpperCase()}
                      </div>
                      {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-[#0b1220]"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <h4 className={`text-sm font-medium truncate ${isUnread ? 'text-white' : 'text-gray-200'}`}>{applicantName}</h4>
                        <span className="text-[10px] text-gray-500">{time}</span>
                      </div>
                      <p className={`text-xs truncate ${isUnread ? 'text-blue-400 font-bold' : 'text-gray-500'}`}>
                        {displayMsg}
                      </p>
                    </div>
                    {isUnread && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">No conversations found.</div>
          )}
        </div>
      </aside>

      {/* Chat Area */}
      <main className={`flex-1 flex flex-col bg-[#1e293b] ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {!selectedConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-[#0f172a]/50">
            <MessageSquare size={64} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">Select an applicant to view messages</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 bg-[#0f172a] border-b border-gray-800 flex items-center gap-4">
              <button onClick={() => setSelectedConversation(null)} className="md:hidden text-gray-400 hover:text-white">
                <ArrowLeft size={24} />
              </button>
              
              {(() => {
                const name = selectedConversation.applicantDisplayName || getApplicantName(selectedConversation);
                const id = getApplicantId(selectedConversation);
                const online = isUserOnline(id);

                return (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white leading-tight">{name}</h3>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-green-500" : "bg-gray-500"}`}/>
                        <span className="text-xs text-gray-400">{online ? "Online" : "Offline"}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-900/50">
              {messages.map((msg) => {
                const senderId = normalizeId(msg.senderId || msg.sender?._id || msg.senderUser?._id);
                const isMe = senderId === normalizeId(user._id);
                const isSystem = msg.sender?.role === "System"; // If you have system messages

                if (isSystem) return null; // Or render differently

                const isImage = msg.file && /\.(png|jpg|jpeg|gif|webp)$/i.test(msg.file);
                const isJobPost = msg.text && msg.text.startsWith("[Forwarded Job Post]");

                return (
                  <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                        isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-[#1e293b] border border-gray-700 text-gray-200 rounded-bl-none"
                    }`}>
                      {/* Content */}
                      {isJobPost ? (
                          renderForwardedPost(msg.text)
                      ) : (
                          <>
                            {msg.text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                          </>
                      )}

                      {/* File */}
                      {msg.file && (
                        <div className="mt-2">
                            {isImage ? (
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

            {/* Input */}
            <div className="p-4 border-t border-gray-700 bg-[#1e293b]">
                {file && (
                    <div className="flex items-center gap-3 mb-3 p-2 bg-[#0f172a] rounded-lg border border-gray-600 w-fit">
                        {file.type.startsWith("image/") ? (
                            <img src={URL.createObjectURL(file)} alt="preview" className="w-10 h-10 object-cover rounded" />
                        ) : (
                            <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center"><Paperclip size={18}/></div>
                        )}
                        <span className="text-xs text-gray-300 max-w-[150px] truncate">{file.name}</span>
                        <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-400"><X size={16}/></button>
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
                        className="p-2.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-blue-400 transition"
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
                            className="w-full bg-[#0f172a] border border-gray-600 text-white rounded-full pl-5 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition placeholder-gray-500"
                        />
                        <button 
                            onClick={handleSend}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition shadow-lg"
                        >
                            <Send size={16} className="ml-0.5" />
                        </button>
                    </div>
                </div>
            </div>
          </>
        )}
      </main>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <button onClick={() => setPreviewImage(null)} className="absolute top-5 right-5 p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700">
                <X size={24}/>
            </button>
            <img src={previewImage} alt="Full Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
}