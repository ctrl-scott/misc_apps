const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Allow all origins (relax for demos; restrict in prod)
app.use(cors());

// OR, customize CORS:
// app.use(cors({
//   origin: ['http://localhost:5173','http://127.0.0.1:8080'],
//   methods: ['GET','POST','OPTIONS'],
//   allowedHeaders: ['Content-Type','Authorization'],
//   credentials: true
// }));

// Serve static files from ./
app.use(express.static(path.join(__dirname, '/')));

// Example API route (shows CORS on JSON endpoints)
app.get('/api/hello', (req, res) => {
  res.json({ msg: 'Hello from Node API' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

