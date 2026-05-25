import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageSquare, Paperclip, Search, Send, Shield, X, Trash2, CheckSquare } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { socket } from "../utils/socket";
import { getPersonName } from "../utils/name";

const api = import.meta.env.VITE_API_URL;

export default function SubAdminMessagePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const fileInputRef = useRef();
  const hasNotifiedOnline = useRef(false);
  // Ref keeps the selected conversation ID current inside socket closures,
  // preventing stale-closure mismatches when the component re-renders.
  const selectedConversationIdRef = useRef(null);

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [guards, setGuards] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

  // Keep ref in sync so socket handlers always read the latest value.
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversation?._id ?? null;
    shouldAutoScrollRef.current = true;
  }, [selectedConversation?._id]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

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

  const isGuardConversation = (conversation) =>
    conversation?.type === "subadmin-guard" ||
    conversation?.type === "guard-subadmin" ||
    conversation?.type === "admin-guard" ||
    conversation?.type === "guard-admin";

  const isUserOnline = (userId) => onlineUsers.includes(normalizeId(userId));

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const isToday = new Date().toDateString() === date.toDateString();
    return isToday
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
      : date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getGuardParticipant = (conversation) =>
    (conversation?.participants ?? []).find((participant) => participant.role === "Guard");

  const getGuardId = (conversation) => normalizeId(getGuardParticipant(conversation)?.userId);

  const getGuardName = (conversation) => {
    const guard = getGuardParticipant(conversation);
    const populated = getPersonName(guard?.user || guard, "");
    if (populated) return populated;
    const guardId = getGuardId(conversation);
    const found = guards.find((entry) => normalizeId(entry._id) === guardId);
    return getPersonName(found);
  };

  const getSenderLabel = (msg) => {
    const sender = msg?.sender?.userId;
    const senderName = getPersonName(sender || msg?.sender, "");
    const senderRole = msg?.sender?.role || sender?.role || "";

    if (senderRole === "Guard") return senderName ? `${senderName} • Guard` : "Guard";
    if (senderRole === "Subadmin") return senderName ? `${senderName} • HR / Subadmin` : "HR / Subadmin";
    if (senderRole === "Admin") return senderName ? `${senderName} • Admin` : "Admin";
    return senderName || "Unknown";
  };

  const fetchConversationMessages = async (conversationId, hardReset = false) => {
    try {
      const res = await fetch(`${api}/api/messages/${conversationId}`, { credentials: "include" });
      const data = await res.json();
      const msgs = Array.isArray(data) ? data : [];
      if (hardReset) {
        setMessages(msgs);
      } else {
        setMessages((prev) => mergeMessages(prev, msgs));
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  useEffect(() => {
    document.title = "Guard Messages | JPM Security Agency";
  }, []);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/admin/login");
    }
  }, [user, loading, navigate]);

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

  useEffect(() => {
    const registerOnline = () => {
      if (!user?._id) return;
      socket.emit("userOnline", user._id);
      hasNotifiedOnline.current = true;
    };

    if (user) registerOnline();
    const handleOnlineUsers = (users) => setOnlineUsers(users);
    socket.on("connect", registerOnline);
    socket.on("onlineUsers", handleOnlineUsers);
    return () => {
      socket.off("connect", registerOnline);
      socket.off("onlineUsers", handleOnlineUsers);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchGuards = async () => {
      try {
        const res = await fetch(`${api}/api/guards`, { credentials: "include" });
        const data = await res.json();
        setGuards(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching guards:", err);
      }
    };
    fetchGuards();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      try {
        const res = await fetch(`${api}/api/messages/conversations?scope=guard`, { credentials: "include" });
        const data = await res.json();
        setConversations(sortConversations(Array.isArray(data) ? data : []));
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    };
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (!selectedConversation || selectedConversation.isTemp || !isGuardConversation(selectedConversation)) {
      shouldAutoScrollRef.current = true;
      if (!selectedConversation?.isTemp) setMessages([]);
      return;
    }

    // Hard-reset immediately — prevents old conversation messages bleeding through.
    shouldAutoScrollRef.current = true;
    setMessages([]);

    const joinActiveConversation = () => {
      socket.emit("joinConversation", selectedConversation._id);
    };

    joinActiveConversation();
    socket.on("connect", joinActiveConversation);
    socket.emit("mark_seen", { conversationId: selectedConversation._id, userId: user._id });

    setConversations((prev) =>
      prev.map((conv) =>
        normalizeId(conv._id) === normalizeId(selectedConversation._id)
          ? { ...conv, lastMessage: { ...conv.lastMessage, seen: true } }
          : conv
      )
    );

    fetchConversationMessages(selectedConversation._id, true);

    // Polling fallback: mirrors GuardMessage's pattern to guarantee real-time
    // updates even when the socket event is missed or slightly delayed.
    const refreshMessages = async (conversationId = selectedConversation._id) => {
      try {
        const res = await fetch(`${api}/api/messages/${conversationId}`, { credentials: "include" });
        const data = await res.json();
        setMessages((prev) => mergeMessages(prev, Array.isArray(data) ? data : []));
      } catch (err) {
        console.error("[SubAdminMessage] poll error:", err);
      }
    };
    const refreshInterval = setInterval(() => refreshMessages(), 1500);

    const handleReceiveMessage = (msg) => {
      // Always update the sidebar conversation list.
      setConversations((prev) =>
        sortConversations(
          prev.map((conv) =>
            normalizeId(conv._id) === normalizeId(msg.conversationId)
              ? { ...conv, lastMessage: msg }
              : conv
          )
        )
      );

      // Use the ref (not closure) so we always compare against the CURRENT conversation.
      if (normalizeId(selectedConversationIdRef.current) === normalizeId(msg.conversationId)) {
        setMessages((prev) =>
          prev.some((message) => normalizeId(message._id || message._tempId) === normalizeId(msg._id || msg._tempId))
            ? prev
            : [...prev, msg]
        );
        socket.emit("mark_seen", { conversationId: msg.conversationId, userId: user._id });
        refreshMessages(msg.conversationId);
      }
    };

    const handleConversationUpdated = (updatedConv) => {
      if (!isGuardConversation(updatedConv)) return;
      if (normalizeId(selectedConversation?._id) === normalizeId(updatedConv._id)) {
        setSelectedConversation(updatedConv);
      }
      setConversations((prev) => {
        const exists = prev.some((conv) => normalizeId(conv._id) === normalizeId(updatedConv._id));
        const updated = exists
          ? prev.map((conv) => (normalizeId(conv._id) === normalizeId(updatedConv._id) ? updatedConv : conv))
          : [updatedConv, ...prev];
        return sortConversations(updated);
      });
    };

    const handleMessagesSeen = ({ conversationId }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          normalizeId(conv._id) === normalizeId(conversationId)
            ? { ...conv, lastMessage: { ...conv.lastMessage, seen: true } }
            : conv
        )
      );

      if (normalizeId(selectedConversation._id) === normalizeId(conversationId)) {
        setMessages((prev) => prev.map((message) => ({ ...message, seen: true })));
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

  // Global listener: keeps sidebar updated for conversations OTHER than the active one.
  // (The active-conversation handler above already covers the open chat panel.)
  useEffect(() => {
    const handleGlobalReceive = (msg) => {
      // Skip if already handled by the active-conversation effect.
      if (normalizeId(selectedConversationIdRef.current) === normalizeId(msg.conversationId)) return;
      setConversations((prev) =>
        sortConversations(
          prev.map((conv) =>
            normalizeId(conv._id) === normalizeId(msg.conversationId)
              ? { ...conv, lastMessage: msg }
              : conv
          )
        )
      );
    };

    const handleGlobalConvUpdated = (updatedConv) => {
      if (!isGuardConversation(updatedConv)) return;
      // Skip if the active-conversation handler already processed it.
      if (normalizeId(selectedConversationIdRef.current) === normalizeId(updatedConv._id)) return;
      setConversations((prev) => {
        const exists = prev.some((conv) => normalizeId(conv._id) === normalizeId(updatedConv._id));
        const updated = exists
          ? prev.map((conv) => (normalizeId(conv._id) === normalizeId(updatedConv._id) ? updatedConv : conv))
          : [updatedConv, ...prev];
        return sortConversations(updated);
      });
    };

    socket.on("receiveMessage", handleGlobalReceive);
    socket.on("conversationUpdated", handleGlobalConvUpdated);
    return () => {
      socket.off("receiveMessage", handleGlobalReceive);
      socket.off("conversationUpdated", handleGlobalConvUpdated);
    };
  }, []);

  const handleSend = async () => {
    if (!newMessage.trim() && !file) return;
    if (!selectedConversation) return;

    const receiver = selectedConversation.participants.find((participant) => participant.role === "Guard");
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

      const { message: sentMessage, conversation } = await res.json();

      setConversations((prev) => {
        if (selectedConversation?.isTemp) {
          const exists = prev.some((conv) => normalizeId(conv._id) === normalizeId(conversation._id));
          const withoutTemp = prev.filter((conv) => !conv.isTemp);
          const updated = exists
            ? withoutTemp.map((conv) => (normalizeId(conv._id) === normalizeId(conversation._id) ? conversation : conv))
            : [conversation, ...withoutTemp];
          return sortConversations(updated);
        }

        const exists = prev.some((conv) => normalizeId(conv._id) === normalizeId(conversation._id));
        const updated = exists
          ? prev.map((conv) => (normalizeId(conv._id) === normalizeId(conversation._id) ? conversation : conv))
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

  const handleStartChat = (guard) => {
    if (!guard?.role) return;

    const existing = conversations.find((conv) =>
      (conv.participants ?? []).some(
        (participant) => normalizeId(typeof participant.userId === "string" ? participant.userId : participant.userId?._id) === normalizeId(guard._id)
      )
    );
    if (existing) return setSelectedConversation(existing);

    const tempConversation = {
      _id: `temp-${Date.now()}`,
      participants: [
        { userId: user._id, role: user.role, name: user.name },
        { userId: guard._id, role: guard.role, name: getPersonName(guard) },
      ],
      type: user.role === "Admin" ? "admin-guard" : "subadmin-guard",
      lastMessage: null,
      isTemp: true,
    };
    setSelectedConversation(tempConversation);
    setMessages([]);
  };

  const filteredConversations = conversations.filter((conv) => getGuardName(conv).toLowerCase().includes(search.trim().toLowerCase()));
  const guardsWithoutConversation = guards.filter((guard) => !conversations.some((conv) => getGuardId(conv) === normalizeId(guard._id)));
  const filteredAvailableGuards = guardsWithoutConversation.filter((guard) =>
    getPersonName(guard, "").toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#0f172a] text-gray-100 font-sans overflow-hidden">
      <aside className={`w-full md:w-80 bg-[#0b1220] border-r border-gray-800 flex flex-col h-full ${selectedConversation ? "hidden md:flex" : "flex"}`}>
        <div className="p-5 bg-gradient-to-r from-[#1e293b] to-[#0f172a] border-b border-gray-800 flex-none">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="text-blue-500" size={24} /> Guard Chats
            </h2>
            <button
              onClick={() => { setIsDeleteMode((p) => !p); setSelectedForDelete([]); }}
              className={`p-2 rounded-lg transition ${
                isDeleteMode ? "bg-red-600/20 text-red-400 hover:bg-red-600/30" : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
              title="Bulk Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            {onlineUsers.filter((onlineUser) => guards.some((guard) => normalizeId(guard._id) === normalizeId(onlineUser))).length} Guards Online
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
              placeholder="Search guards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1e293b] border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const guardName = getGuardName(conv);
              const guardId = getGuardId(conv);
              const isOnline = isUserOnline(guardId);
              const isActive = normalizeId(selectedConversation?._id) === normalizeId(conv._id);
              const lastMsgText = conv.lastMessage?.text || (conv.lastMessage?.file ? "Sent an attachment" : "No messages");
              const time = formatDateTime(conv.lastMessage?.createdAt);
              const senderId = normalizeId(conv.lastMessage?.senderId || conv.lastMessage?.sender?._id);
              const isUnread = !conv.lastMessage?.seen && senderId !== normalizeId(user?._id);

              const convId = normalizeId(conv._id);
              const isChecked = selectedForDelete.includes(convId);
              return (
                <div
                  key={conv._id}
                  onClick={() => isDeleteMode ? toggleSelectConversation(convId) : setSelectedConversation(conv)}
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
                        <Shield size={20} />
                      </div>
                      {isOnline ? <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-[#0b1220]" /> : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <h4 className={`text-sm font-medium truncate ${isUnread ? "text-white" : "text-gray-200"}`}>{guardName}</h4>
                        <span className="text-[10px] text-gray-500">{time}</span>
                      </div>
                      <p className={`text-xs truncate ${isUnread ? "text-blue-400 font-bold" : "text-gray-500"}`}>{lastMsgText}</p>
                    </div>
                    {isUnread ? <span className="w-2 h-2 rounded-full bg-blue-500" /> : null}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">No active chats</div>
          )}

          {filteredAvailableGuards.length > 0 ? (
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
                      <Shield size={16} />
                    </div>
                    {isUserOnline(normalizeId(guard._id)) ? <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-[#0b1220]" /> : null}
                  </div>
                  <span className="text-sm text-gray-300 truncate">{getPersonName(guard)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </aside>

      <main className={`flex-1 flex flex-col h-full w-full bg-[#1e293b] relative ${!selectedConversation ? "hidden md:flex" : "flex"}`}>
        {!selectedConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-[#0f172a]/50">
            <MessageSquare size={64} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">Select a guard to start messaging</p>
          </div>
        ) : (
          <>
            <div className="flex-none w-full px-4 py-3 md:px-6 md:py-4 bg-[#0f172a] border-b border-gray-800 flex items-center gap-3 z-20 shadow-sm sticky top-0">
              <button onClick={() => setSelectedConversation(null)} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition">
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
                      {online ? <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-[#0f172a] block md:hidden" /> : null}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-base md:text-lg leading-tight truncate">{guardName}</h3>
                      <div className="flex items-center gap-1.5">
                        <span className={`hidden md:block w-1.5 h-1.5 rounded-full ${online ? "bg-green-500" : "bg-gray-500"}`}></span>
                        <span className="text-xs text-gray-400">{online ? "Online" : "Offline"}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
              className="flex-1 w-full overflow-y-auto overscroll-contain p-4 md:p-6 space-y-4 bg-slate-900/50 scroll-smooth"
            >
              {messages.map((msg) => {
                const isMe = normalizeId(msg.senderId) === normalizeId(user?._id);
                return (
                  <div key={msg._id || msg._tempId} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] md:max-w-[60%] rounded-2xl px-4 py-3 shadow-sm text-sm md:text-base ${isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-[#1e293b] border border-gray-700 text-gray-200 rounded-bl-none"}`}>
                      {!isMe ? <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-blue-300/90">{getSenderLabel(msg)}</p> : null}
                      {msg.text ? <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p> : null}

                      {msg.file ? (
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
                              <Paperclip size={14} className="flex-shrink-0" /> <span className="truncate">{msg.fileName || "Download Attachment"}</span>
                            </a>
                          )}
                        </div>
                      ) : null}

                      <div className="text-[10px] mt-1 text-right opacity-70">{formatDateTime(msg.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex-none w-full p-3 md:p-4 bg-[#0f172a] border-t border-gray-800 z-20">
              {file ? (
                <div className="flex items-center gap-3 mb-3 p-2 bg-[#1e293b] rounded-lg border border-gray-700 w-fit max-w-full">
                  {file.type.startsWith("image/") ? (
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-10 h-10 object-cover rounded" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center"><Paperclip size={18} /></div>
                  )}
                  <span className="text-xs text-gray-300 max-w-[150px] truncate">{file.name}</span>
                  <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-400 p-1"><X size={16} /></button>
                </div>
              ) : null}

              <div className="flex items-end gap-2 md:gap-3">
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                <button onClick={() => fileInputRef.current.click()} className="flex-shrink-0 p-3 mb-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-blue-400 transition">
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
                    style={{ height: "auto", overflowY: newMessage.length > 50 ? "auto" : "hidden" }}
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

      {previewImage ? (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 p-2 bg-gray-800/50 rounded-full text-white hover:bg-gray-700 transition">
            <X size={24} />
          </button>
          <img src={previewImage} alt="Full Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      ) : null}

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
