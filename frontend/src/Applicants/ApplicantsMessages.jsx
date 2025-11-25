import { useState, useEffect, useRef, useMemo, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { io } from "socket.io-client";
import {
  Paperclip,
  Send,
  FileText,
  X,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth.js"
import { useNavigate } from "react-router-dom";

const api = import.meta.env.VITE_API_URL;
export const socket = io(api, {
  withCredentials: true,
  transports: ["websocket", "polling"], 
});
const STORAGE_KEY = "jpm-applicant-chat";

const formatDateTime = (timestamp) =>
  timestamp
    ? new Date(timestamp).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value.toString) return value.toString();
  return String(value);
};

const getParticipantName = (p, session) => { // session is passed as an argument
  if (!p) return "Unknown";
  // Prioritize populated user object
  if (p.user?.fullName) return p.user.fullName; // For Guard
  if (p.user?.name) return p.user.name; // For Admin/Subadmin/Applicant

  // Fallback if userId itself might be the populated object (less likely with consistent populate)
  if (p.userId?.fullName) return p.userId.fullName;
  if (p.userId?.name) return p.userId.name;

  // Fallback to current session's name if this is the applicant's own entry
  if (normalizeId(p.userId) === normalizeId(session?.applicantId)) return session?.name || "Applicant";

  return "Unknown";
};

export default function ApplicantsMessages() {
  const { user: admin, loading } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.error("Failed to parse applicant session:", err);
      return null;
    }
  });
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isPromptOpen, setIsPromptOpen] = useState(!session);
  const [nameInput, setNameInput] = useState(session?.name ?? "");
  const [emailInput, setEmailInput] = useState(session?.email ?? "");
  const [phoneInput, setPhoneInput] = useState(session?.phone ?? "");
  const [loadingPage, setLoadingPage] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const bootstrappedRef = useRef(false);
  const subjectSentRef = useRef(false); // legacy, no longer auto-sending
  const [hiringContext, setHiringContext] = useState(null);
  const [hiringDetails, setHiringDetails] = useState(null);

  useEffect(() => {
    // Capture hiring context from URL params
    try {
      const params = new URLSearchParams(window.location.search);
      const hiringId = params.get("hiringId");
      const title = params.get("title");
      const position = params.get("position");
      const location = params.get("location");
      if (hiringId || title || position || location) {
        setHiringContext({ hiringId, title, position, location });
      }
    } catch (_) {}

    document.title = "Connect with HR | JPM Security Agency";
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const persistSession = (data) => {
    setSession(data);
    if (data.phone !== undefined) setPhoneInput(data.phone ?? "");
    if (data.email !== undefined) setEmailInput(data.email ?? "");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const fetchMessages = async (conversationId, applicantId) => {
    try {
      const res = await fetch(
        `${api}/api/applicant-messages/${conversationId}?applicantId=${applicantId}`, {
          credentials: "include"
        }
      );
      if (!res.ok) throw new Error("Failed to load messages");
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load conversation history right now.");
    }
  };

  useEffect(() => {
    if (!session?.email || !session?.phone) {
      setIsPromptOpen(true);
    }
  }, [session?.email, session?.phone]);

  useEffect(() => {
    if (!session || bootstrappedRef.current) return;
    if (!session.name) {
      setIsPromptOpen(true);
      return;
    }

    bootstrappedRef.current = true;
    (async () => {
      try {
        setLoadingPage(true);
        const phonePayload = session.phone ?? phoneInput;
        const res = await fetch(`${api}/api/applicant-messages/session`, {
          credentials: "include",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: session.name,
            email: session.email,
            phone: phonePayload,
            position: hiringContext?.position,
          }),
        });

        if (!res.ok) {
          throw new Error(await res.text());
        }

        const data = await res.json();
        const updatedSession = {
          name: data.applicant.name,
          email: data.applicant.email ?? session.email ?? "",
          applicantId: data.applicant._id,
          conversationId: data.conversation._id,
          phone: data.applicant.phone ?? phoneInput,
        };
        persistSession(updatedSession);
        setPhoneInput(data.applicant.phone ?? phoneInput ?? "");
        setEmailInput(data.applicant.email ?? session.email ?? "");
        setConversation(data.conversation);

        socket.emit("userOnline", data.applicant._id);
        socket.emit("joinConversation", data.conversation._id);
        await fetchMessages(data.conversation._id, data.applicant._id);
      } catch (err) {
        console.error(err);
        setError("We couldn't start the conversation. Please try again.");
        setIsPromptOpen(true);
        bootstrappedRef.current = false;
      } finally {
        setLoadingPage(false);
      }
    })();
  }, [session]);

  // Fetch full hiring details if hiringId is present
  useEffect(() => {
    const loadHiring = async () => {
      if (!hiringContext?.hiringId) return;
      try {
        const res = await fetch(`${api}/api/hirings/${hiringContext.hiringId}`,{
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          setHiringDetails(data);
        } else {
          setHiringDetails(null);
        }
      } catch {
        setHiringDetails(null);
      }
    };
    loadHiring();
  }, [hiringContext?.hiringId]);

  useEffect(() => {
    if (!session?.conversationId || !session?.applicantId) return;

    const handleReceiveMessage = (msg) => {
      if (normalizeId(msg.conversationId) !== normalizeId(session.conversationId)) return;
      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]
      );
    };

    const handleConversationUpdated = (conv) => {
      if (normalizeId(conv._id) !== normalizeId(session.conversationId)) return;
      setConversation(conv);
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("conversationUpdated", handleConversationUpdated);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("conversationUpdated", handleConversationUpdated);
    };
  }, [session?.conversationId, session?.applicantId]);

  const handleSubmitIdentity = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setError("Please provide your name so we can personalize the chat.");
      return;
    }
    const emailTrim = emailInput.trim();
    const phoneTrim = phoneInput.trim();
    if (!phoneTrim) {
      setError("Please provide your phone number so we can contact you.");
      return;
    }
    if (!emailTrim || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(emailTrim)) {
      setError("Please provide a valid email address.");
      return;
    }
    setError("");
    persistSession({ name: nameInput.trim(), email: emailTrim, phone: phoneTrim });
    setEmailInput(emailTrim);
    setPhoneInput(phoneTrim);
    setIsPromptOpen(false);
  };

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setFile(selected);
  };

  const resetComposer = () => {
    setNewMessage("");
    setFile(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!session?.conversationId || !session?.applicantId) {
      console.error("❌ [ApplicantsMessages] Missing session data:", {
        hasConversationId: !!session?.conversationId,
        hasApplicantId: !!session?.applicantId,
        conversationId: session?.conversationId,
        applicantId: session?.applicantId
      });
      setIsPromptOpen(true);
      return;
    }
    if (!newMessage.trim() && !file && !hiringContext) return;

    try {
      setSending(true);
      console.log("📤 [ApplicantsMessages] Sending message:", {
        conversationId: session.conversationId,
        applicantId: session.applicantId,
        hasText: !!newMessage.trim(),
        hasFile: !!file
      });

      // Prepare message text with forwarded post context if present
      let composedText = newMessage || "";
      if (hiringContext) {
        const job = hiringDetails || {};
        const title = job.title || hiringContext.title || "";
        const position = job.position || hiringContext.position || "";
        const location = job.location || hiringContext.location || "";
        const employmentType = job.employmentType || job.employment || "";
        const createdAt = job.createdAt ? new Date(job.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
        const description = job.description || "";
        const header = `[Forwarded Job Post]\n`;
        const block = [
          title ? `Title: ${title}` : "",
          position ? `Position: ${position}` : "",
          location ? `Location: ${location}` : "",
          employmentType ? `Employment: ${employmentType}` : "",
          createdAt ? `Posted: ${createdAt}` : "",
        ].filter(Boolean).join("\n");
        const descBlock = description ? `\n\nDescription:\n${description}` : "";
        const ref = hiringContext.hiringId ? `\nRef: ${hiringContext.hiringId}` : "";
        const forwarded = `${header}${block}${descBlock}${ref}`;
        composedText = composedText ? `${forwarded}\n\n${composedText}` : forwarded;
      }

      const formData = new FormData();
      formData.append("text", composedText);
      formData.append("applicantId", session.applicantId);
      if (hiringContext?.position) {
        formData.append("jobPosition", hiringContext.position);
      }
      if (file) formData.append("file", file);

      const url = `${api}/api/applicant-messages/${session.conversationId}/messages`;
      console.log("🌐 [ApplicantsMessages] Request URL:", url);

      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      console.log("📡 [ApplicantsMessages] Response status:", res.status, res.statusText);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ [ApplicantsMessages] Error response:", errorText);
        
        // If conversation not found, try to re-initialize
        if (res.status === 404 && errorText.includes("Conversation not found")) {
          console.log("🔄 [ApplicantsMessages] Conversation not found, re-initializing...");
          // Clear session and re-initialize
          const res = await fetch(`${api}/api/applicant-messages/session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: session.name, email: session.email, phone: phoneInput, position: hiringContext?.position }),
          });
          
          if (res.ok) {
            const reinitData = await res.json();
            const updatedSession = {
              name: reinitData.applicant.name,
              email: reinitData.applicant.email ?? session.email ?? "",
              applicantId: reinitData.applicant._id,
              conversationId: reinitData.conversation._id,
            };
            persistSession(updatedSession);
            setConversation(reinitData.conversation);
            
            // Retry sending the message with the new conversationId
            const retryFormData = new FormData();
            retryFormData.append("text", newMessage);
            retryFormData.append("applicantId", updatedSession.applicantId);
            if (file) retryFormData.append("file", file);
            
            const retryRes = await fetch(
              `${api}/api/applicant-messages/${updatedSession.conversationId}/messages`,
              {
                method: "POST",
                body: retryFormData,
              }
            );
            
            if (!retryRes.ok) {
              throw new Error(await retryRes.text());
            }
            
            const retryData = await retryRes.json();
            setMessages((prev) => [...prev, retryData.message]);
            setConversation(retryData.conversation);
            resetComposer();
            return;
          }
        }
        
        throw new Error(errorText);
      }

      const data = await res.json();
      setMessages((prev) =>
        prev.some((m) => (m?._id || "").toString() === (data?.message?._id || "").toString())
          ? prev
          : [...prev, data.message]
      );
      setConversation(data.conversation);
      resetComposer();
      // Clear hiring context after first send to avoid duplication
      setHiringContext(null);
      setHiringDetails(null);
      try {
        const url = new URL(window.location.href);
        url.search = "";
        window.history.replaceState({}, "", url.toString());
      } catch (_) {}
    } catch (err) {
      console.error("❌ [ApplicantsMessages] Error:", err);
      setError("Your message couldn't be sent. Please retry.");
    } finally {
      setSending(false);
    }
  };

  const headerSubtitle = useMemo(() => {
    if (!conversation?.lastMessage?.createdAt) {
      return "We're online Monday to Saturday, 8AM – 5PM.";
    }
    return `Last response • ${formatDateTime(conversation.lastMessage.createdAt)}`;
  }, [conversation?.lastMessage?.createdAt]);

  const renderMessageAttachment = (msg) => {
    if (!msg.file) return null;
    const isImage = /\.(png|jpe?g|gif|webp)$/i.test(msg.file);

    if (isImage) {
      return (
        <img
          src={`${api}${msg.file}`}
          alt={msg.fileName || "attachment"}
          className="mt-3 rounded-lg border border-white/10 max-w-full max-h-64 object-cover cursor-pointer"
          onClick={() => setPreviewImage(`${api}${msg.file}`)}
        />
      );
    }

    return (
      <a
        href={`${api}${msg.file}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-2 text-sm text-blue-200 underline hover:text-blue-100"
      >
        <FileText className="w-4 h-4" />
        {msg.fileName || "View attachment"}
      </a>
    );
  };

  const isSender = (msg) =>
    normalizeId(msg.senderId) === normalizeId(session?.applicantId);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0b1220] via-[#102137] to-[#0b1220] text-gray-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0f172a]/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-white">Talk with JPM Recruitment</h1>
            <p className="text-sm text-gray-400">{headerSubtitle}</p>
          </div>
          {session?.name && (
            <div className="text-xs text-gray-400">
              Chatting as{" "}
              <span className="text-blue-300 font-semibold">{session.name}</span>
            </div>
          )}
        </div>
      </header>
  
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col px-4 py-6">
          <div className="flex-1 flex flex-col rounded-3xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
            {/* Sub-header */}
            <div className="px-6 py-5 border-b border-white/5 bg-white/5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-500/20 text-blue-200 px-3 py-1 text-xs uppercase tracking-wide">
                  Applicant Support
                </div>
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Connecting to HR...
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-300 mt-2">
                Ask us anything about your application. We’ll keep this conversation active so
                you can return anytime.
              </p>
            </div>
  
            {/* Messages area (scrollable) */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 scrollbar-thin scrollbar-thumb-blue-600/60 scrollbar-track-transparent">
              {messages.map((msg) => {
                const mine = isSender(msg);

                const renderForwardedPost = (text) => {
                  if (!text || typeof text !== "string") return null;
                  if (!text.startsWith("[Forwarded Job Post]")) return null;

                  const parts = text.split(/\n\n+/);
                  const forwardedBlock = parts[0] || "";
                  const remaining = text.slice(forwardedBlock.length).trim();

                  const lines = forwardedBlock.split("\n").slice(1);
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
                        {description && (
                          <div className="mt-2 text-gray-200 whitespace-pre-line">{description}</div>
                        )}
                      </div>
                      {remaining && (
                        <div>
                          <div className="my-2 flex items-center gap-2">
                            <span className="flex-1 h-px bg-gray-600" />
                            <span className="text-[10px] uppercase tracking-wider text-gray-400">Your message</span>
                            <span className="flex-1 h-px bg-gray-600" />
                          </div>
                          <div className="mt-2 whitespace-pre-wrap break-words text-gray-100">{remaining}</div>
                        </div>
                      )}
                    </div>
                  );
                };

                const content = renderForwardedPost(msg.text) || (msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>);

                return (
                  <div key={msg._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] sm:max-w-md rounded-2xl px-4 py-3 shadow-lg ring-1 ring-white/5 ${
                        mine
                          ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white"
                          : "bg-white/10 text-gray-100"
                      }`}
                    >
                      {content}
                      {renderMessageAttachment(msg)}
                      <div
                        className={`text-[10px] mt-3 ${
                          mine ? "text-blue-100/70" : "text-gray-300/70"
                        } text-right`}
                      >
                        {formatDateTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
              {!messages.length && !loading && (
                <div className="text-center text-sm text-gray-400 mt-8">
                  Start the conversation and our HR team will respond shortly.
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
  
            {/* Composer */}
            <div className="px-3 sm:px-6 py-4 sm:py-5 border-t border-white/10 bg-[#101d32]/70 flex-shrink-0 pb-[env(safe-area-inset-bottom)]">
              {error && (
                <div className="mb-3 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              {hiringContext && (
                <div className="mb-3 flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  <div className="flex-1 text-sm text-gray-100">
                    <div className="text-blue-200 font-semibold mb-1">Forwarding Job Post</div>
                    <div className="text-gray-200">
                      {(hiringDetails?.title || hiringContext.title) && (
                        <div><span className="text-blue-300">Title:</span> {hiringDetails?.title || hiringContext.title}</div>
                      )}
                      {(hiringDetails?.position || hiringContext.position) && (
                        <div><span className="text-blue-300">Position:</span> {hiringDetails?.position || hiringContext.position}</div>
                      )}
                      {(hiringDetails?.location || hiringContext.location) && (
                        <div><span className="text-blue-300">Location:</span> {hiringDetails?.location || hiringContext.location}</div>
                      )}
                      {(hiringDetails?.employmentType || hiringDetails?.employment) && (
                        <div><span className="text-blue-300">Employment:</span> {hiringDetails?.employmentType || hiringDetails?.employment}</div>
                      )}
                      {hiringDetails?.createdAt && (
                        <div><span className="text-blue-300">Posted:</span> {new Date(hiringDetails.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</div>
                      )}
                      {hiringDetails?.description && (
                        <div className="mt-2 text-gray-300 whitespace-pre-line">
                          {hiringDetails.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setHiringContext(null); setHiringDetails(null); }}
                    className="text-gray-400 hover:text-white transition mt-1"
                    aria-label="Remove forwarded post"
                  >
                    ✕
                  </button>
                </div>
              )}
              {file && (
                <div className="mb-3 flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-3">
                  {file.type?.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded-lg border border-white/10"
                    />
                  ) : (
                    <FileText className="w-6 h-6 text-blue-200" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-gray-200 truncate">{file.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-gray-400 hover:text-white transition"
                    aria-label="Remove attachment"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
  
              <form onSubmit={handleSend} className="flex items-center gap-2 sm:gap-3 mb-2">
                <label className="flex-shrink-0">
                  <div className="rounded-full bg-white/5 border border-white/10 p-2.5 sm:p-3 hover:bg-white/10 transition cursor-pointer">
                    <Paperclip className="w-5 h-5 text-gray-300" />
                  </div>
                  <input type="file" className="hidden" onChange={handleFileChange} />
                </label>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 sm:py-3 text-white font-medium shadow-lg hover:shadow-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
  
      <footer className="border-t border-white/10 bg-[#0f172a]/80 text-center text-xs text-gray-500 py-4">
        © {new Date().getFullYear()} JPM Security Agency • Talent & Recruitment Desk
      </footer>
  
      <Transition appear show={isPromptOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={() => setIsPromptOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </Transition.Child>
  
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl">
                <Dialog.Title className="text-lg font-semibold text-white">
                  Let's introduce ourselves
                </Dialog.Title>
                <p className="text-sm text-gray-400 mt-2">
                  Share your name so our recruitment team knows who they're speaking with.
                </p>
  
                <form onSubmit={handleSubmitIdentity} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/70 focus:outline-none"
                      placeholder="Juan Dela Cruz"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/70 focus:outline-none"
                      placeholder="09XXXXXXXXX"
                      required
                      pattern="^(09\d{9}|\+639\d{9})$"
                      title="Enter a valid PH mobile number (09XXXXXXXXX or +639XXXXXXXXX)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/70 focus:outline-none"
                      placeholder="you@email.com"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition"
                  >
                    Start chatting
                  </button>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
  
      {previewImage && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 left-6 text-white flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to chat
          </button>
          <img
            src={previewImage}
            alt="Attachment preview"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10"
          />
        </div>
      )}
    </div>
  );
  
}
