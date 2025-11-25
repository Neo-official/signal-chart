import { io, Socket } from 'socket.io-client';
import { useEffect, useRef } from 'react';

export function useSocket(role: 'user' | 'admin' = 'user') {
	const socketRef = useRef<Socket | null>(null);

	useEffect(() => {
		if (typeof window !== 'undefined' && typeof document !== 'undefined') {
			socketRef.current = io('/', {
				auth: { role },
				transports: ['websocket', 'polling'],
				reconnection: true
			});
		}
		return () => {
			socketRef.current?.disconnect();
		};
	}, [role]);

	return socketRef.current;
}
