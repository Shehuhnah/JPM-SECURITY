import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "https://jpm-security.onrender.com";

export const socket = io(socketUrl, {
  withCredentials: true,
  transports: ["websocket", "polling"],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

socket.on("connect", () => {
  console.log("[socket-client] connected", { socketId: socket.id });
});

socket.on("disconnect", (reason) => {
  console.log("[socket-client] disconnected", { reason });
});

socket.on("connect_error", (error) => {
  console.error("[socket-client] connect_error", {
    message: error?.message,
    description: error?.description,
    type: error?.type,
  });
});
