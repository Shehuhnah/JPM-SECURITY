import { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { Paperclip, Send, CircleUserRound, Search, ArrowLeft } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const socket = io("http://localhost:5000");

export default function SubadminApplicantMessage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [onlineUsers, setOnlineUsers] = useState([]);
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
    if (!user && !loading) {
      navigate("/admin/login");
      return;
    }
    document.title = "Applicant Messages | JPM Security Agency";
    
  }, [user, loading, navigate]);

  const sortConversations = (list) =>
    [...list].sort((a, b) => {
      const aTime = a?.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b?.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

  const isApplicantConversation = (conversation) =>
    conversation?.type === "subadmin-applicant" || conversation?.type === "applicant-subadmin";

  const normalizeId = (id) => {
    if (!id) return "";
    if (typeof id === "string") return id;
    if (typeof id === "object") {
      if (id?._id) return id._id.toString();
      if (typeof id.toString === "function") return id.toString();
    }
    return "";
  };

  const sortApplicantConversations = (list) => sortConversations(list.filter(isApplicantConversation));

  const getApplicantParticipant = (conversation) =>
    (conversation?.participants ?? []).find((p) => p.role === "Applicant");

  const getApplicantId = (conversation) => normalizeId(getApplicantParticipant(conversation)?.userId);

  const getApplicantName = (conversation) => {
    const applicant = getApplicantParticipant(conversation);
    const populated = applicant?.user?.name || applicant?.name;
    if (populated) return populated;
    const lm = conversation?.lastMessage;
    const lmName = lm?.sender?.name || lm?.sender?.fullName;
    if (lmName) return lmName;
    return "Unknown Applicant";
  };

  const isUserOnline = (userId) => onlineUsers.includes(normalizeId(userId));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (user && !hasNotifiedOnline.current) {
      socket.emit("userOnline", user._id);
      hasNotifiedOnline.current = true;
    }
    socket.on("onlineUsers", (users) => setOnlineUsers(users));
    return () => socket.off("onlineUsers");
  }, [user]);

  const fetchConversations = useCallback(async () => {
    try {
      console.log("🔍 [SubadminApplicantMessage] Fetching conversations...");
      
      const res = await fetch(
        "http://localhost:5000/api/messages/conversations", {
          credentials: "include"
        }
      );
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ [SubadminApplicantMessage] Response error:", errorText);
        return;
      }
      
      const data = await res.json();
      
      const filtered = (Array.isArray(data) ? data : []).filter(
        (conv) => conv.type === "subadmin-applicant" || conv.type === "applicant-subadmin"
      );
      
      const unique = filtered.filter((conv, index, self) => 
        index === self.findIndex((c) => normalizeId(c._id) === normalizeId(conv._id))
      );
      
      setConversations(sortApplicantConversations(unique));
    } catch (err) {
      console.error("❌ [SubadminApplicantMessage] Error fetching conversations:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

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
    
    // FIX 1: Mark messages as seen when opening conversation
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
      if (normalizeId(selectedConversation?._id) === normalizeId(msg.conversationId)) {
        setMessages((prev) =>
          prev.some((m) => normalizeId(m._id) === normalizeId(msg._id)) ? prev : [...prev, msg]
        );
        
        // Auto-mark as seen if conversation is open
        socket.emit("mark_seen", {
          conversationId: msg.conversationId,
          userId: user._id,
        });
      }
    
      // FIX: Preserve participant data when updating conversation
      setConversations((prev) => {
        const msgConvId = normalizeId(msg.conversationId);
        const existingConv = prev.find((c) => normalizeId(c._id) === msgConvId);
        
        if (!existingConv) {
          return prev; // Don't add new conversations here
        }
        
        return sortApplicantConversations(
          prev.map((conv) => {
            if (normalizeId(conv._id) === msgConvId) {
              // IMPORTANT: Keep the existing conversation's participants
              // Only update the lastMessage
              return {
                ...conv,
                lastMessage: {
                  ...msg,
                  // ensure sender is present for name fallback (e.g., Applicant name)
                  sender: msg.senderUser || conv.lastMessage?.sender,
                  seen: normalizeId(selectedConversation?._id) === msgConvId ? true : msg.seen,
                },
              };
            }
            return conv;
          })
        );
      });
    };

    const handleMessageSeen = ({ conversationId }) => {
      if (normalizeId(conversationId) === normalizeId(selectedConversation?._id)) {
        setSelectedConversation((prev) => prev ? { ...prev, lastMessage: { ...prev.lastMessage, seen: true } } : prev);
        setConversations((prev) =>
          prev.map((conv) =>
            normalizeId(conv._id) === normalizeId(conversationId)
              ? { ...conv, lastMessage: { ...conv.lastMessage, seen: true } }
              : conv
          )
        );
      }
    };

    const handleConversationUpdated = (updatedConv) => {
      if (!isApplicantConversation(updatedConv)) return;
      
      const updatedConvId = normalizeId(updatedConv._id);
      
      const applicantPart = (updatedConv?.participants || []).find((p) => p.role === "Applicant");
      if (applicantPart && !applicantPart.user) {
        fetchConversations();
      }

      if (normalizeId(selectedConversation?._id) === updatedConvId) {
        setSelectedConversation(updatedConv);
      }
      
      setConversations((prev) => {
        const unique = prev.filter((c, index, self) => 
          index === self.findIndex((conv) => normalizeId(conv._id) === normalizeId(c._id))
        );
        
        const exists = unique.some((c) => normalizeId(c._id) === updatedConvId);
        if (exists) {
          return sortApplicantConversations(
            unique.map((c) => (normalizeId(c._id) === updatedConvId ? updatedConv : c))
          );
        }
        return sortApplicantConversations([updatedConv, ...unique]);
      });
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("conversationUpdated", handleConversationUpdated);
    socket.on("messages_seen", handleMessageSeen);
    
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("conversationUpdated", handleConversationUpdated);
      socket.off("messages_seen", handleMessageSeen);
    };
  }, [selectedConversation?._id, user, fetchConversations]);

  useEffect(() => {
    const handleConversationUpdated = (updatedConv) => {
      if (!isApplicantConversation(updatedConv)) return;
      
      const updatedConvId = normalizeId(updatedConv._id);
      
      if (normalizeId(selectedConversation?._id) === updatedConvId) {
        return;
      }
      
      setConversations((prev) => {
        const unique = prev.filter((c, index, self) => 
          index === self.findIndex((conv) => normalizeId(conv._id) === normalizeId(c._id))
        );
        
        const exists = unique.some((c) => normalizeId(c._id) === updatedConvId);
        if (exists) {
          return sortApplicantConversations(
            unique.map((c) => (normalizeId(c._id) === updatedConvId ? updatedConv : c))
          );
        }
        return sortApplicantConversations([updatedConv, ...unique]);
      });
    };
    socket.on("conversationUpdated", handleConversationUpdated);
    return () => socket.off("conversationUpdated", handleConversationUpdated);
  }, [selectedConversation?._id]);

  const handleSend = async () => {
    if (!newMessage.trim() && !file) return;
    if (!selectedConversation) return;

    const applicant = selectedConversation.participants.find((p) => p.role === "Applicant");
    if (!applicant) return;

    const formData = new FormData();
    formData.append("text", newMessage);
    formData.append(
      "receiverId",
      typeof applicant.userId === "string" ? applicant.userId : applicant.userId?._id
    );
    formData.append("receiverRole", applicant.role);
    const conversationType = selectedConversation.type === "applicant-subadmin" || selectedConversation.type === "subadmin-applicant" 
      ? selectedConversation.type 
      : "applicant-subadmin";
    formData.append("type", conversationType);
    if (file) formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) return console.error(await res.text());
      const { message, conversation } = await res.json();

      setConversations((prev) => {
        if (selectedConversation?.isTemp) {
          const exists = prev.some((c) => c._id === conversation._id);
          const withoutTemp = prev.filter((c) => !c.isTemp);
          const updated = exists
            ? withoutTemp.map((c) =>
                c._id === conversation._id ? conversation : c
              )
            : [conversation, ...withoutTemp];
          return sortApplicantConversations(updated);
        }
        const exists = prev.some((c) => c._id === conversation._id);
        const updated = exists
          ? prev.map((c) => (c._id === conversation._id ? conversation : c))
          : [conversation, ...prev];
        return sortApplicantConversations(updated);
      });

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

  const renderForwardedPost = (text) => {
    if (!text || typeof text !== "string") return null;
    if (!text.startsWith("[Forwarded Job Post]")) return null;

    // Separate forwarded block from any additional user text
    const parts = text.split(/\n\n+/);
    const forwardedBlock = parts[0] || "";
    const remaining = text.slice(forwardedBlock.length).trim();

    // Parse key-value lines and optional Description section
    const lines = forwardedBlock.split("\n").slice(1); // skip header line
    const details = {};
    let inDescription = false;
    const descLines = [];
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

    const title = details["Title"]; 
    const position = details["Position"]; 
    const location = details["Location"]; 
    const employment = details["Employment"]; 
    const posted = details["Posted"]; 
    const ref = (text.match(/\nRef:\s*(.+)$/m) || [])[1];
    const description = descLines.join("\n").trim();

    return (
      <div>
        <div className="mb-2 rounded-xl border border-blue-400/30 bg-blue-400/10 p-3 text-sm">
          <div className="text-xs uppercase tracking-wide text-blue-200 mb-2">Forwarded Job Post</div>
          {title && (
            <div className="text-gray-100"><span className="text-blue-300">Title:</span> {title}</div>
          )}
          {position && (
            <div className="text-gray-100"><span className="text-blue-300">Position:</span> {position}</div>
          )}
          {location && (
            <div className="text-gray-100"><span className="text-blue-300">Location:</span> {location}</div>
          )}
          {employment && (
            <div className="text-gray-100"><span className="text-blue-300">Employment:</span> {employment}</div>
          )}
          {posted && (
            <div className="text-gray-100"><span className="text-blue-300">Posted:</span> {posted}</div>
          )}
          {ref && (
            <div className="text-xs text-gray-400 mt-1">Ref: {ref}</div>
          )}
          {description && (
            <div className="mt-2 text-gray-200 whitespace-pre-line">{description}</div>
          )}
        </div>
        {remaining && (
          <div className="whitespace-pre-wrap break-words">{remaining}</div>
        )}
      </div>
    );
  };

  const filteredConversations = conversations.filter((conv) => {
    const applicantName = getApplicantName(conv).toLowerCase();
    return applicantName.includes(search.trim().toLowerCase());
  });

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0f172a] text-gray-100">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-[#0b1220] border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Applicant Chats</h2>
          <span className="text-xs text-gray-400">
            {conversations.length} {conversations.length === 1 ? "Chat" : "Chats"}
          </span>
        </div>

        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search applicants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0f172a] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-[#0b1220]">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const applicantName = getApplicantName(conv);
              const applicantId = getApplicantId(conv);
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
                          isUserOnline(applicantId) ? "bg-green-500" : "bg-gray-500"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate text-gray-100">{applicantName}</p>
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
      </aside>

      {/* Chat Window */}
      <main className="flex-1 flex flex-col bg-[#1e293b] border-l border-gray-700">
        <div className="p-4 border-b border-gray-700 bg-[#0f172a] flex items-center gap-3">
          <CircleUserRound size={38} />
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">
              {selectedConversation ? getApplicantName(selectedConversation) : "Select an applicant"}
            </h3>
            <span className={`text-xs ${selectedConversation && (() => {
                const applicant = selectedConversation.participants?.find((p) => p.role === "Applicant");
                const applicantId = (typeof applicant?.userId === "string" ? applicant?.userId : applicant?.userId?._id) || "";
                return isUserOnline(applicantId);
              })()
                ? "text-green-400"
                : "text-gray-500"
            }`}>
              {selectedConversation &&
              (() => {
                const applicant = selectedConversation.participants?.find((p) => p.role === "Applicant");
                const applicantId = (typeof applicant?.userId === "string" ? applicant?.userId : applicant?.userId?._id) || "";
                return isUserOnline(applicantId);
              })()
                ? "Online"
                : "Offline"}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0b1220]">
          {messages.map((msg) => {
            const isFromSubadmin =
              msg?.sender?.role === "Subadmin" ||
              msg?.senderUser?.role === "Subadmin" ||
              normalizeId(msg?.senderId) === normalizeId(user._id);
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
                  {renderForwardedPost(msg.text) || (
                    msg.text && <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                  )}
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