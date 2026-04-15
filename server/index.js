const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const seedData = require('./seedData');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory state
let inventory = [...seedData];
let requests = [];

// ===== INVENTORY ENDPOINTS =====

// GET all items
app.get('/api/inventory', (req, res) => {
  res.json(inventory);
});

// POST - create new item
app.post('/api/inventory/item', (req, res) => {
  const { name, quantity, servingSize, expiryDate } = req.body;

  if (!name || quantity === undefined || servingSize === undefined || !expiryDate) {
    return res.status(400).json({ error: 'Missing required fields: name, quantity, servingSize, expiryDate' });
  }

  if (quantity < 0 || servingSize <= 0) {
    return res.status(400).json({ error: 'Quantity must be >= 0, servingSize must be > 0' });
  }

  const newItem = {
    id: uuidv4(),
    name,
    quantity,
    servingSize,
    expiryDate
  };

  inventory.push(newItem);
  res.status(201).json(newItem);
});

// PUT - edit item (admin correction)
app.put('/api/inventory/item/:id', (req, res) => {
  const { id } = req.params;
  const { quantity, servingSize, expiryDate, name } = req.body;

  const item = inventory.find(i => i.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  if (quantity !== undefined) {
    if (quantity < 0) {
      return res.status(400).json({ error: 'Quantity must be >= 0' });
    }
    item.quantity = quantity;
  }

  if (servingSize !== undefined) {
    if (servingSize <= 0) {
      return res.status(400).json({ error: 'ServingSize must be > 0' });
    }
    item.servingSize = servingSize;
  }

  if (expiryDate !== undefined) {
    item.expiryDate = expiryDate;
  }

  if (name !== undefined) {
    item.name = name;
  }

  res.json(item);
});

// DELETE - remove item
app.delete('/api/inventory/item/:id', (req, res) => {
  const { id } = req.params;
  const index = inventory.findIndex(i => i.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const deleted = inventory.splice(index, 1);
  res.json(deleted[0]);
});

// ===== REQUEST ENDPOINTS =====

// GET all requests
app.get('/api/requests', (req, res) => {
  // Sort by status and creation time (most recent first)
  const sorted = [...requests].sort((a, b) => {
    const statusOrder = { pending: 0, approved: 1, consumed: 2, expired: 3, rejected: 4 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return b.requestedAt - a.requestedAt;
  });
  res.json(sorted);
});

// POST - create request
app.post('/api/request', (req, res) => {
  const { itemId, requestedPortion } = req.body;

  if (!itemId || requestedPortion === undefined) {
    return res.status(400).json({ error: 'Missing required fields: itemId, requestedPortion' });
  }

  const item = inventory.find(i => i.id === itemId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  if (requestedPortion <= 0) {
    return res.status(400).json({ error: 'Requested portion must be > 0' });
  }

  // Note: We check quantity at approval time, not at request time
  // This allows users to request even if low on inventory, but approval will fail if insufficient

  const now = Date.now();
  const newRequest = {
    id: uuidv4(),
    itemId,
    requestedPortion,
    status: 'pending',
    requestedAt: now,
    approvedAt: null,
    expiresAt: null, // Will be set on approval
    consumedAt: null
  };

  requests.push(newRequest);
  res.status(201).json(newRequest);
});

// PUT - approve request
app.put('/api/requests/:id/approve', (req, res) => {
  const { id } = req.params;
  const request = requests.find(r => r.id === id);

  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  if (request.status !== 'pending') {
    return res.status(400).json({ error: `Cannot approve request with status: ${request.status}` });
  }

  const item = inventory.find(i => i.id === request.itemId);
  if (!item) {
    return res.status(404).json({ error: 'Associated item not found' });
  }

  // ATOMIC CHECK: At approval time, verify quantity is still sufficient
  if (item.quantity < request.requestedPortion) {
    return res.status(409).json({ 
      error: 'Insufficient quantity to approve request',
      available: item.quantity,
      requested: request.requestedPortion
    });
  }

  // Approve: decrease quantity, set expiry
  item.quantity -= request.requestedPortion;
  request.status = 'approved';
  request.approvedAt = Date.now();
  request.expiresAt = request.approvedAt + (30 * 1000); // 30 seconds

  res.json(request);
});

// PUT - consume request
app.put('/api/requests/:id/consume', (req, res) => {
  const { id } = req.params;
  const request = requests.find(r => r.id === id);

  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  if (request.status !== 'approved') {
    return res.status(400).json({ error: `Can only consume approved requests. Current status: ${request.status}` });
  }

  // Check if already expired
  const now = Date.now();
  if (now > request.expiresAt) {
    return res.status(400).json({ error: 'Approval already expired' });
  }

  request.status = 'consumed';
  request.consumedAt = now;
  res.json(request);
});

// PUT - reject request
app.put('/api/requests/:id/reject', (req, res) => {
  const { id } = req.params;
  const request = requests.find(r => r.id === id);

  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  if (request.status !== 'pending') {
    return res.status(400).json({ error: `Can only reject pending requests. Current status: ${request.status}` });
  }

  request.status = 'rejected';
  res.json(request);
});

// ===== BACKGROUND TASK: AUTO-EXPIRE APPROVALS =====

setInterval(() => {
  const now = Date.now();

  requests.forEach(request => {
    if (request.status === 'approved' && request.expiresAt && now > request.expiresAt) {
      // Auto-expire: mark as expired and return quantity
      const item = inventory.find(i => i.id === request.itemId);
      if (item) {
        item.quantity += request.requestedPortion;
      }
      request.status = 'expired';
    }
  });
}, 5000); // Check every 5 seconds

// ===== START SERVER =====

app.listen(PORT, () => {
  console.log(`🍋 FridgePolice server running on http://localhost:${PORT}`);
  console.log(`📦 Loaded ${inventory.length} seed items`);
});
