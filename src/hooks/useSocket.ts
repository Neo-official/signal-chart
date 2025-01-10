import { io, Socket } from 'socket.io-client';
import { useEffect, useRef } from 'react';

export function useSocket(namespace: string = '/user') {
	const socketRef = useRef<Socket | null>(null);

	useEffect(() => {
		// const token = localStorage.getItem('authToken');

		// if (!token) {
		// 	return;
		// }

		if (typeof window !== 'undefined' && typeof document !== 'undefined') {
			socketRef.current = io(namespace, {
				// auth                : {
				// 	token,
				// },
				// transports          : ['websocket'],
				// reconnection        : true,
				// reconnectionAttempts: 5,
				// reconnectionDelay   : 1000,
			});
		}
		return () => {
			socketRef.current?.disconnect();
		};
	}, []);

	return socketRef.current;
}
