import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Paperclip, Send, Search, CircleUserRound, ArrowLeft, MessageSquare, X, Trash2, CheckSquare } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { socket } from "../utils/socket";
import { getPersonName } from "../utils/name";

const api = import.meta.env.VITE_API_URL;

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const hasNotifiedOnline = useRef(false);
  const fileInputRef = useRef();
  // Ref keeps selected conversation ID current inside all socket closures.
  const selectedConversationIdRef = useRef(null);
  
  // State
  const [previewImage, setPreviewImage] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [file, setFile] = useState(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Keep ref in sync so socket handlers always see the latest conversation ID.
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversation?._id ?? null;
  }, [selectedConversation?._id]);

  const fetchConversationMessages = async (conversationId, hardReset = false) => {
    try {
      const res = await fetch(`${api}/api/messages/${conversationId}`, { credentials: "include" });
      const data = await res.json();
      const msgs = Array.isArray(data) ? data : [];
      // Hard reset: replace all messages (used when switching conversations).
      // Soft merge: deduplicate & append (used by polling interval).
      if (hardReset) {
        setMessages(msgs);
      } else {
        setMessages((prev) => mergeMessages(prev, msgs));
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  // --- Auth Check ---
  useEffect(() => {
    if (!user && !loading) {
      navigate("/admin/login");
    }
  }, [user, loading, navigate]);

  // --- Scroll to Bottom ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    // If today, show time only; else show date
    const isToday = new Date().toDateString() === date.toDateString();
    return isToday 
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
      : date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const isUserOnline = (userId) => onlineUsers.includes(userId);

  const sortConversations = (list) =>
    [...list].sort((a, b) => {
      const aTime = a?.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b?.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

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

  const getParticipantName = (p) => {
    if (!p) return "Unknown";
    if (p.user) return getPersonName(p.user);
    if (p.userId && typeof p.userId === "object") return getPersonName(p.userId);

    const match = availableUsers.find(u => u._id === (typeof p.userId === "string" ? p.userId : p.userId?._id));
    if (match) return getPersonName(match);

    if (p.userId === user._id) return getPersonName(user, "Me");
    return "Unknown";
  };

  const getSenderLabel = (msg) => {
    const sender = msg?.sender?.userId;
    const senderName = getPersonName(sender || msg?.sender, "");
    const senderRole = msg?.sender?.role || sender?.role || "";

    if (senderRole === "Guard") {
      return senderName ? `${senderName} • Guard` : "Guard";
    }

    if (senderRole === "Subadmin") {
      return senderName ? `${senderName} • HR / Subadmin` : "HR / Subadmin";
    }

    if (senderRole === "Admin") {
      return senderName ? `${senderName} • Admin` : "Admin";
    }

    return senderName || "Unknown";
  };

  const isStaffConversation = (conversation) =>
    conversation?.type === "admin-subadmin" ||
    conversation?.type === "subadmin-admin";

  // --- Socket: User Online ---
  useEffect(() => {
    const registerOnline = () => {
      if (!user?._id) return;
      socket.emit("userOnline", user._id);
      console.log("[admin-message] userOnline", { userId: user._id, role: user.role, socketId: socket.id });
      hasNotifiedOnline.current = true;
    };

    if (user) registerOnline();
    const handleOnlineUsers = (users) => {
      console.log("[admin-message] onlineUsers", users);
      setOnlineUsers(users);
    };
    socket.on("connect", registerOnline);
    socket.on("onlineUsers", handleOnlineUsers);
    return () => {
      socket.off("connect", registerOnline);
      socket.off("onlineUsers", handleOnlineUsers);
    };
  }, [user]);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch(`${api}/api/messages/conversations?scope=staff`, { credentials: "include" });
        const data = await res.json();
        setConversations(sortConversations(Array.isArray(data) ? data : []));
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    };
    if (user) fetchConversations();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchUsers = async () => {
      try {
        if (user.role === "Admin") {
          const subadminsRes = await fetch(`${api}/api/auth/subadmins`, { credentials: "include" });
          const subadminsData = await subadminsRes.json();
          setAvailableUsers(Array.isArray(subadminsData) ? subadminsData : []);
          return;
        }

        const res = await fetch(`${api}/api/auth/admins`, { credentials: "include" });
        const data = await res.json();
        setAvailableUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, [user]);

  // --- Active Conversation Logic ---
  useEffect(() => {
    if (!selectedConversation || selectedConversation.isTemp || !isStaffConversation(selectedConversation)) {
      setMessages([]);
      return;
    }

    // Hard-reset messages immediately so old conversation's messages never bleed through.
    setMessages([]);

    const joinActiveConversation = () => {
      socket.emit("joinConversation", selectedConversation._id);
    };

    joinActiveConversation();
    socket.on("connect", joinActiveConversation);
    socket.emit("mark_seen", { conversationId: selectedConversation._id, userId: user._id });

    setConversations(prev =>
      prev.map(conv =>
        normalizeId(conv._id) === normalizeId(selectedConversation._id)
          ? { ...conv, lastMessage: { ...conv.lastMessage, seen: true } }
          : conv
      )
    );

    // Initial load: hard reset so only this conversation's messages appear.
    fetchConversationMessages(selectedConversation._id, true);

    // Polling fallback: mirrors GuardMessage — guarantees real-time updates
    // even when a socket event is missed or delayed.
    const refreshMessages = async (conversationId = selectedConversation._id) => {
      try {
        const res = await fetch(`${api}/api/messages/${conversationId}`, { credentials: "include" });
        const data = await res.json();
        setMessages((prev) => mergeMessages(prev, Array.isArray(data) ? data : []));
      } catch (err) {
        console.error("[AdminMessage] poll error:", err);
      }
    };
    const refreshInterval = setInterval(() => refreshMessages(), 1500);

    const handleReceiveMessage = (msg) => {
      // Update sidebar preview
      setConversations(prev =>
        sortConversations(
          prev.some(conv => normalizeId(conv._id) === normalizeId(msg.conversationId))
            ? prev.map(conv =>
              normalizeId(conv._id) === normalizeId(msg.conversationId)
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
        )
      );

      // Append to active chat — use ref to avoid stale closure
      if (normalizeId(selectedConversationIdRef.current) === normalizeId(msg.conversationId)) {
        setMessages(prev =>
          prev.some(m => normalizeId(m._id || m._tempId) === normalizeId(msg._id || msg._tempId))
            ? prev
            : [...prev, msg]
        );
        socket.emit("mark_seen", { conversationId: msg.conversationId, userId: user._id });
        refreshMessages(msg.conversationId);
      }
    };

    const handleMessageSeen = ({ conversationId }) => {
      if (normalizeId(conversationId) === normalizeId(selectedConversationIdRef.current)) {
        setMessages(prev => prev.map(m => ({ ...m, seen: true })));
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
      clearInterval(refreshInterval);
      socket.off("connect", joinActiveConversation);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messages_seen", handleMessageSeen);
    };
  }, [selectedConversation?._id, user]);

  // Global listener — keeps sidebar updated for all conversations including
  // the active one, without re-registering on every conversation change.
  useEffect(() => {
    const handleConversationUpdated = (updatedConv) => {
      if (!isStaffConversation(updatedConv)) return;

      setConversations(prev => {
        const exists = prev.some(c => normalizeId(c._id) === normalizeId(updatedConv._id));
        const updated = exists
          ? prev.map(c => normalizeId(c._id) === normalizeId(updatedConv._id) ? updatedConv : c)
          : [updatedConv, ...prev];
        return sortConversations(updated);
      });

      if (normalizeId(selectedConversationIdRef.current) === normalizeId(updatedConv._id)) {
        setSelectedConversation(updatedConv);
      }
    };
    socket.on("conversationUpdated", handleConversationUpdated);
    return () => socket.off("conversationUpdated", handleConversationUpdated);
  }, []);

  // --- Handlers ---
  const getReceiver = () => {
    return selectedConversation?.participants?.find(p => {
      const pid = p?.userId?._id || p?.userId;
      return pid?.toString() !== user._id.toString();
    });
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !file) return;
    if (!selectedConversation || !isStaffConversation(selectedConversation)) return;

    const receiver = getReceiver();
    if (!receiver) return;

    const receiverId = receiver?.userId?._id || receiver?.userId;
    const formData = new FormData();
    formData.append("text", newMessage);
    formData.append("type", selectedConversation.type || "admin-subadmin");
    formData.append("receiverId", receiverId);
    formData.append("receiverRole", receiver.role);
    if (file) formData.append("file", file);

    try {
      console.log("[admin-message] handleSend:start", {
        conversationId: selectedConversation._id,
        receiverId,
        receiverRole: receiver.role,
        type: selectedConversation.type || "admin-subadmin",
      });
      const res = await fetch(`${api}/api/messages`, { method: "POST", credentials: "include", body: formData });
      if (!res.ok) return console.error("Failed to send message");

      const { message: sentMessage, conversation: realConversation } = await res.json();
      console.log("[admin-message] handleSend:success", {
        conversationId: realConversation?._id,
        messageId: sentMessage?._id,
      });

      setConversations(prev => {
        const withoutTemp = prev.filter(conv => !conv.isTemp && normalizeId(conv._id) !== normalizeId(realConversation._id));
        return sortConversations([realConversation, ...withoutTemp]);
      });

      setSelectedConversation(realConversation);
      if (sentMessage) {
        setMessages(prev =>
          prev.some(msg => normalizeId(msg._id || msg._tempId) === normalizeId(sentMessage._id || sentMessage._tempId))
            ? prev
            : [...prev, sentMessage]
        );
      }
      setNewMessage("");
      setFile(null);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedForDelete.length === 0) return;
    try {
      const res = await fetch(`${api}/api/messages/bulk-delete`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationIds: selectedForDelete }),
      });
      if (!res.ok) return;
      setConversations((prev) => prev.filter((c) => !selectedForDelete.includes(normalizeId(c._id))));
      if (selectedForDelete.includes(normalizeId(selectedConversation?._id))) {
        setSelectedConversation(null);
      }
      setSelectedForDelete([]);
      setIsDeleteMode(false);
      setShowBulkDeleteModal(false);
    } catch (err) {
      console.error("Error bulk deleting:", err);
    }
  };

  const toggleSelectConversation = (id) => {
    setSelectedForDelete((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleStartChat = (targetUser) => {
    if (!targetUser?.role) return;
    
    // Check existing
    const existing = conversations.find(conv =>
      (conv.participants ?? []).some(p => (typeof p.userId === "string" ? p.userId : p.userId?._id) === targetUser._id)
    );
    if (existing) {
        setSelectedConversation(existing);
        return;
    }

    // Create Temp
    let type = "";
    if (user.role === "Admin" && targetUser.role === "Subadmin") type = "admin-subadmin";
    else if (user.role === "Subadmin" && targetUser.role === "Admin") type = "subadmin-admin";
    else return;

    const tempConversation = {
      _id: `temp-${Date.now()}`,
      participants: [
        { userId: user._id, role: user.role, user: { ...user } },
        { userId: targetUser._id, role: targetUser.role, user: { ...targetUser } },
      ],
      type,
      lastMessage: null,
      isTemp: true,
    };
    setSelectedConversation(tempConversation);
    setMessages([]); // Clear messages for new chat
  };

  // --- Filtering List ---
  const shownUsers = [
    ...conversations.map(c => ({ type: "conversation", id: c._id, data: c })),
    ...availableUsers.filter(u => !conversations.some(c => (c.participants ?? []).some(p => (typeof p.userId === "string" ? p.userId : p.userId?._id) === u._id)))
      .map(u => ({ type: "user", id: u._id, data: u }))
  ];

  const filteredUsers = shownUsers.filter(item => {
    const name = item.type === "conversation"
      ? getParticipantName((item.data.participants ?? []).find(p => (typeof p.userId === "string" ? p.userId : p.userId?._id) !== user._id))
      : getPersonName(item.data);
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
   <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#0f172a] text-gray-100 font-sans overflow-hidden">
      
      {/* Sidebar - Remains mostly the same, hidden on mobile when chat is open */}
      <aside className={`w-full md:w-80 bg-[#0b1220] border-r border-gray-800 flex flex-col h-full ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 bg-gradient-to-r from-[#1e293b] to-[#0f172a] border-b border-gray-800 flex-none">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageSquare className="text-blue-500" size={24}/> Messages
              </h2>
              <button
                onClick={() => { setIsDeleteMode((p) => !p); setSelectedForDelete([]); }}
                className={`p-2 rounded-lg transition text-sm flex items-center gap-1.5 ${
                  isDeleteMode ? "bg-red-600/20 text-red-400 hover:bg-red-600/30" : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
                title="Bulk Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
        </div>

        {isDeleteMode && (
          <div className="px-3 py-2 bg-red-950/30 border-b border-red-900/40 flex items-center justify-between gap-2 flex-none">
            <span className="text-xs text-red-300">{selectedForDelete.length} selected</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedForDelete(conversations.map(c => normalizeId(c._id)))}
                className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded"
              >Select All</button>
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                disabled={selectedForDelete.length === 0}
                className="text-xs bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white px-3 py-1 rounded-lg transition"
              >Delete ({selectedForDelete.length})</button>
              <button
                onClick={() => { setIsDeleteMode(false); setSelectedForDelete([]); }}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded"
              ><X size={14} /></button>
            </div>
          </div>
        )}
        
        <div className="p-3 flex-none">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1e293b] border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((item) => {
              if (item.type === "conversation") {
                 const other = (item.data.participants ?? []).find(p => (typeof p.userId === "string" ? p.userId : p.userId?._id) !== user._id);
                 const otherId = normalizeId(typeof other?.userId === "string" ? other.userId : other?.userId?._id);
                 const otherName = getParticipantName(other);
                 const isOnline = isUserOnline(otherId);
                 const isActive = selectedConversation?._id === item.data._id;
                 let lastMsg = "Start a conversation";
                 if(item.data.lastMessage?.text) lastMsg = item.data.lastMessage.text;
                 else if(item.data.lastMessage?.file) lastMsg = "Sent an attachment";
                 const time = item.data.lastMessage?.createdAt ? formatDateTime(item.data.lastMessage.createdAt) : "";
                 const senderId = normalizeId(item.data.lastMessage?.senderId || item.data.lastMessage?.sender?._id);
                 const isUnread = !item.data.lastMessage?.seen && senderId !== normalizeId(user._id);

                 const convId = normalizeId(item.data._id);
                 const isChecked = selectedForDelete.includes(convId);
                 return (
                  <div
                    key={item.id}
                    onClick={() => isDeleteMode ? toggleSelectConversation(convId) : setSelectedConversation(item.data)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      isDeleteMode && isChecked
                        ? "bg-red-600/10 border-red-500/50"
                        : isActive ? "bg-blue-600/10 border-blue-500/50" : "border-transparent hover:bg-[#1e293b]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                       {isDeleteMode && (
                         <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                           isChecked ? "bg-red-500 border-red-500" : "border-gray-500"
                         }`}>
                           {isChecked && <CheckSquare size={12} className="text-white" />}
                         </div>
                       )}
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-gray-300">
                            {otherName.charAt(0).toUpperCase()}
                        </div>
                        {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-[#0b1220]"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                            <h4 className={`text-sm font-medium truncate ${isUnread ? 'text-white' : 'text-gray-300'}`}>{otherName}</h4>
                            <span className="text-[10px] text-gray-500">{time}</span>
                        </div>
                        <p className={`text-xs truncate ${isUnread ? 'text-blue-400 font-medium' : 'text-gray-500'}`}>
                            {lastMsg}
                        </p>
                      </div>
                      {isUnread && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                  </div>
                 );
              } else {
                 const u = item.data;
                 const isOnline = isUserOnline(u._id);
                 return (
                  <div key={u._id} onClick={() => handleStartChat(u)} className="p-3 rounded-xl cursor-pointer hover:bg-[#1e293b] transition flex items-center gap-3 opacity-80 hover:opacity-100">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-gray-400">
                            <CircleUserRound size={24}/>
                        </div>
                        {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-[#0b1220]"/>}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-300">{getPersonName(u)}</h4>
                        <p className="text-xs text-gray-500">Click to message</p>
                      </div>
                  </div>
                 );
              }
            })
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">No users found.</div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={`flex-1 flex flex-col h-full w-full bg-[#1e293b] relative ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {!selectedConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-[#0f172a]/50">
            <MessageSquare size={64} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            <div className="flex-none w-full px-4 py-3 md:px-6 md:py-4 bg-[#0f172a] border-b border-gray-800 flex items-center gap-3 z-20 shadow-sm sticky top-0">
              {/* Back Button (Mobile Only) */}
              <button 
                onClick={() => setSelectedConversation(null)} 
                className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition"
              >
                <ArrowLeft size={22} />
              </button>
              
              {/* Recipient Info */}
              {(() => {
                const other = (selectedConversation.participants ?? []).find(p => (typeof p.userId === "string" ? p.userId : p.userId?._id) !== user._id);
                const otherId = normalizeId(typeof other?.userId === "string" ? other.userId : other?.userId?._id);
                const name = getParticipantName(other);
                const online = isUserOnline(otherId);

                return (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-lg shadow-lg relative">
                        {name.charAt(0).toUpperCase()}
                        {/* Online Status Dot */}
                        {online && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-[#0f172a]"/>}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-base md:text-lg leading-tight truncate">{name}</h3>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-green-500" : "bg-gray-500"}`}/>
                        <span className="text-xs text-gray-400">{online ? "Online" : "Offline"}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* --- 2. MESSAGES LIST (SCROLLABLE MIDDLE) --- */}
            <div className="flex-1 w-full overflow-y-auto overscroll-contain p-4 md:p-6 space-y-4 bg-slate-900/50 scroll-smooth">
              {messages.map((msg) => {
                const isMe = normalizeId(msg.senderId || msg.sender?.userId) === normalizeId(user._id);
                return (
                  <div key={msg._id || msg._tempId} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] md:max-w-[65%] rounded-2xl px-4 py-3 shadow-sm text-sm md:text-base ${
                        isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-[#1e293b] border border-gray-700 text-gray-200 rounded-bl-none"
                    }`}>
                      {!isMe && (
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-blue-300/90">
                          {getSenderLabel(msg)}
                        </p>
                      )}
                      {msg.text && <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>}

                      {msg.file && (
                        <div className="mt-2">
                            {msg.file.match(/\.(png|jpg|jpeg|gif)$/i) ? (
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

            {/* --- 3. INPUT AREA (FIXED BOTTOM) --- */}
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

                <div className="flex items-end gap-2 md:gap-3 ">
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
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
            <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 p-2 bg-gray-800/50 rounded-full text-white hover:bg-gray-700 transition">
                <X size={24}/>
            </button>
            <img src={previewImage} alt="Full Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}/>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-red-500/20 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <Trash2 className="text-red-400" size={22} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Delete Conversations?</h3>
              <p className="text-sm text-gray-400 mb-6">
                You are about to permanently delete{" "}
                <span className="text-white font-semibold">{selectedForDelete.length}</span>{" "}
                conversation{selectedForDelete.length !== 1 ? "s" : ""} and all their messages. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-medium text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-white text-sm font-bold shadow-lg shadow-red-900/30 transition"
                >
                  Delete {selectedForDelete.length}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
