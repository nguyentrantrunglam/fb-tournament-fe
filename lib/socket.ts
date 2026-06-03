import { io, type Socket } from 'socket.io-client'

/**
 * Socket.IO client (replaces Firestore onSnapshot). Single shared connection;
 * `withCredentials` reuses the connect.sid session cookie. Subscribe to read-only
 * rooms: `tournament:{tid}`, `category:{cid}`, `match:{mid}`.
 */
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, { withCredentials: true, transports: ['websocket'] })
  }
  return socket
}

export function subscribeRooms(rooms: string[]): void {
  getSocket().emit('subscribe', { rooms })
}

export function unsubscribeRooms(rooms: string[]): void {
  getSocket().emit('unsubscribe', { rooms })
}

export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}
