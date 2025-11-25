export type SocketAction = 'create' | 'update' | 'delete';
export type SocketResource = 'device' | 'settings';

export interface SocketMessage {
  resource: SocketResource;
  action: SocketAction;
  key?: string;
  value?: any;
  socketId?: string;
}
