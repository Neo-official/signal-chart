# 🏗️ Architecture - REST API + Real-Time Updates

## Design Pattern

### ✅ Initial Data: REST API
### ✅ Real-Time Updates: Socket.IO + WebSocket

## Flow Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. GET /api/devices (Initial Load)
       ├──────────────────────────────────┐
       │                                   │
       │                              ┌────▼────┐
       │                              │  REST   │
       │                              │   API   │
       │                              └────┬────┘
       │                                   │
       │ ◄─────────────────────────────────┘
       │ Returns: All devices data
       │
       │ 2. Connect Socket.IO (Real-Time)
       ├──────────────────────────────────┐
       │                                   │
       │                              ┌────▼────┐
       │                              │ Socket  │
       │                              │   .IO   │
       │                              └────┬────┘
       │                                   │
       │ ◄─────────────────────────────────┘
       │ Receives: Real-time updates only
       │
       
┌──────────────┐
│ IoT Device   │
└──────┬───────┘
       │
       │ WebSocket (Port 3000)
       │ Sends: Sensor data
       │
  ┌────▼────┐
  │ Server  │
  │ Process │
  └────┬────┘
       │
       ├─► Database (Store)
       │
       └─► Socket.IO Broadcast
           (Real-time to all browsers)
```

## API Endpoints

### GET `/api/devices`
**Purpose**: Fetch all devices with data
**Query Params**: 
- `active=true` - Only active devices (for users)
- No params - All devices (for admin)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "socketId": "abc123",
      "state": "active",
      "status": "online",
      "data": [[v1,i1], [v2,i2]],
      "labels": [t1, t2]
    }
  ]
}
```

### GET `/api/settings`
**Purpose**: Fetch system settings
**Response**:
```json
{
  "success": true,
  "data": {
    "maxDataPoints": 31557600,
    "maxDataSend": 300
  }
}
```

## Socket.IO Events

### User Namespace (`/user`)
**Receives**:
- `devices` - Real-time device updates

### Admin Namespace (`/admin`)
**Sends**:
- `device:delete` - Delete device
- `device:state` - Change device state
- `device:V-out` - Change voltage output
- `settings` - Update settings

**Receives**:
- `devices` - Real-time device updates
- `settings` - Real-time settings updates

## WebSocket (Port 3000)

### Device → Server
```json
{
  "type": "device:data:add",
  "data": [voltage, current]
}
```

### Server → Device
```json
{
  "type": "device:V-out",
  "data": 100
}
```

## Client Implementation

### User Page
```typescript
// 1. Fetch initial data (REST API)
useEffect(() => {
  fetch('/api/devices?active=true')
    .then(res => res.json())
    .then(result => setDevices(result.data));
}, []);

// 2. Listen for real-time updates (Socket.IO)
useEffect(() => {
  socket.on('devices', setDevices);
  return () => socket.off('devices');
}, [socket]);
```

### Admin Page
```typescript
// 1. Fetch initial data (REST API)
useEffect(() => {
  Promise.all([
    fetch('/api/devices'),
    fetch('/api/settings')
  ]).then(([devices, settings]) => {
    setDevices(devices.data);
    setSettings(settings.data);
  });
}, []);

// 2. Listen for real-time updates (Socket.IO)
useEffect(() => {
  socket.on('devices', setDevices);
  socket.on('settings', setSettings);
  return () => {
    socket.off('devices');
    socket.off('settings');
  };
}, [socket]);

// 3. Send actions (Socket.IO)
const deleteDevice = (socketId) => {
  socket.emit('device:delete', socketId);
};
```

## Benefits

### ✅ Separation of Concerns
- REST API: Initial data load
- Socket.IO: Real-time updates only
- WebSocket: Device communication

### ✅ Performance
- No unnecessary data in Socket.IO connection
- REST API can be cached
- Socket.IO only sends updates

### ✅ Scalability
- REST API can be load balanced
- Socket.IO handles real-time only
- Clear separation of responsibilities

### ✅ Reliability
- If Socket.IO disconnects, data still available via REST
- Reconnection doesn't require full data reload
- Graceful degradation

## Real-Time Triggers

Socket.IO broadcasts happen on:

1. **Device sends new data** → Broadcast to all users/admins
2. **Admin changes device state** → Broadcast to all users/admins
3. **Admin deletes device** → Broadcast to all users/admins
4. **Admin updates settings** → Broadcast to all admins
5. **Device connects/disconnects** → Broadcast to all users/admins

## Summary

**REST API**: Initial data load (on page load)
**Socket.IO**: Real-time updates (when something changes)
**WebSocket**: Device communication (sensor data)

This architecture provides:
- ✅ Fast initial load (REST API)
- ✅ Instant updates (Socket.IO)
- ✅ Efficient device communication (WebSocket)
- ✅ Clear separation of concerns
- ✅ Production-ready scalability
