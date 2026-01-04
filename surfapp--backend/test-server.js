// Simple test to see if server can stay alive
const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  res.json({ message: 'Server is alive!' });
});

const PORT = 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
});

// Keep process alive
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  server.close(() => {
    console.log('Server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received');
  server.close(() => {
    console.log('Server closed');
  });
});

console.log('Test server initialized, waiting for requests...');
