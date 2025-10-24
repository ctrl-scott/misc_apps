// server.js — minimal stateless WebSocket relay (no storage)
const http = require('http');
const WebSocket = require('ws');
const server = http.createServer();
const wss = new WebSocket.Server({ server });

/** room -> Set<WebSocket> */
const rooms = new Map();

function joinRoom(ws, room) {
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room).add(ws);
  ws.room = room;
  broadcastRoster(room);
}

function leaveRoom(ws) {
  if (!ws.room) return;
  const set = rooms.get(ws.room);
  if (set) {
    set.delete(ws);
    if (set.size === 0) rooms.delete(ws.room);
    else broadcastRoster(ws.room);
  }
  ws.room = null;
}

function broadcastRoster(room) {
  const set = rooms.get(room);
  if (!set) return;
  const roster = [...set].map(s => s.clientId).filter(Boolean);
  const msg = JSON.stringify({ type: 'roster', roster });
  set.forEach(s => s.readyState === 1 && s.send(msg));
}

wss.on('connection', (ws) => {
  ws.clientId = `u_${Math.random().toString(36).slice(2, 10)}`;

  ws.on('message', (raw) => {
    let data;
    try { data = JSON.parse(raw.toString()); } catch { return; }

    if (data.type === 'join') {
      joinRoom(ws, data.room || 'default');
      ws.clientLabel = data.label || ws.clientId;
      // acknowledge
      ws.send(JSON.stringify({ type: 'joined', id: ws.clientId, room: ws.room, label: ws.clientLabel }));
      return;
    }

    if (!ws.room) return;

    // forward messages to everyone else in the same room
    const set = rooms.get(ws.room);
    if (!set) return;

    // attach sender id/label for presence
    if (data && typeof data === 'object') {
      data._from = { id: ws.clientId, label: ws.clientLabel || ws.clientId };
    }

    const payload = JSON.stringify(data);
    set.forEach(peer => {
      if (peer !== ws && peer.readyState === 1) peer.send(payload);
    });
  });

  ws.on('close', () => leaveRoom(ws));
  ws.on('error', () => leaveRoom(ws));
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WS relay listening on :${PORT}`);
});

