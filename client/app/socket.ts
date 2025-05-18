import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_HOST, { autoConnect: false,  path: '/socket.io', withCredentials: true });

export default socket;