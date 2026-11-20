import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/api/api";

let socketInstance: Socket | null = null;
let activeToken: string | null = null;

export const getSocket = (): Socket | null => socketInstance;

// Token renewal updates the next handshake without interrupting a live session.
export const connectSocket = (token: string): Socket => {
  if (socketInstance) {
    const tokenChanged = activeToken !== token;
    activeToken = token;
    socketInstance.auth = { token };
    if (tokenChanged && !socketInstance.connected && !socketInstance.active) {
      socketInstance.connect();
    }
    return socketInstance;
  }
  activeToken = token;
  socketInstance = io(API_BASE_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    tryAllTransports: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
    timeout: 10000,
  });
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }
  activeToken = null;
};
