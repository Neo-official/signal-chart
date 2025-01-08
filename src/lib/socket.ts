import { io, Socket } from 'socket.io-client';

let socket: Socket;

export const initSocket = () => {
	socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000');
	return socket;
};

export const getSocket = () => {
	// if (!socket) {
	// 	socket = initSocket();
	// 	// throw new Error('Socket not initialized. Call initSocket first.');
	// }
	return socket ?? initSocket();
};