# FridgePolice 🍋

A full-stack food inventory and request management system built with React and Express. Users can list items, request portions, approve requests, and manage inventory in real-time.

## Features

- 📦 **Inventory Management** — Add, edit, and delete food items with quantities, serving sizes, and expiry dates
- 🔔 **Request System** — Request portions from inventory (pending → approve → consume)
- ⏱️ **Auto-Expiry** — Approved requests expire after 30 seconds if not consumed; portions are automatically returned
- 🔒 **Double-Allocation Prevention** — Atomic quantity checks ensure the last portion can only be used once
- 🆔 **Unique IDs** — UUID-based tracking allows duplicate item names without confusion
- ✏️ **Manual Corrections** — Edit item quantities directly to fix inventory mismatches
- 💾 **Offline Support** — localStorage caching provides fallback when server is unavailable
- 📊 **Real-Time Updates** — Auto-refresh UI every 1-2 seconds to always show latest state

## Quick Start

### Prerequisites
- Node.js 14+ 
- npm or yarn

### Installation & Running

#### 1. Backend (Express Server)

```bash
cd server
npm install
npm start
```

The backend will start on `http://localhost:5000` and load 10 seed items.

Output:
```
🍋 FridgePolice server running on http://localhost:5000
📦 Loaded 10 seed items
```

#### 2. Frontend (React App)

In a new terminal:

```bash
cd client
npm install
npm start
```

The frontend will open automatically at `http://localhost:3000`.

### Verify It's Working

1. **Backend**: Open `http://localhost:5000/api/inventory` in your browser
   - Should see JSON array of 10 food items
   
2. **Frontend**: Open `http://localhost:3000` in your browser
   - Should see items listed in left column
   - Should see request form and all requests in right column

---

## How to Use

### Managing Inventory (Left Side)

#### Add New Item
1. Fill in the **"Add New Item"** form
   - Item name (e.g., "Milk")
   - Initial quantity in units (ml, grams, count, etc.)
   - Serving size (one typical portion)
   - Expiry date
2. Click **"Add Item"** button
3. New item appears in the list below

#### Edit Item Quantity
1. Click **"Edit"** button on any item card
2. Change the quantity (e.g., "I recounted: actually 120ml")
3. Click **"Save"**

#### Delete Item
1. Click **"Delete"** button on item card
2. Confirm deletion

### Managing Requests (Right Side)

#### Create Request
1. Select an item from **"Create Request"** dropdown
   - Dropdown shows: `"Item Name (quantity available)"`
2. Portion size is auto-filled with serving size, but you can change it
3. Click **"Create Request"**
4. Request appears in **"All Requests"** list with **PENDING** status

#### Approve Request
1. Find request in **"All Requests"** list with **PENDING** status (yellow badge)
2. Click **"Approve"** button
3. Request moves to **APPROVED** status (blue badge)
4. Countdown timer appears (e.g., "Expires in: 30s")
5. Item's inventory quantity decreases by requested amount

#### Consume Request
1. Find **APPROVED** request with countdown timer
2. Click **"Consume"** button **before timer reaches 0**
3. Request moves to **CONSUMED** status (green badge, ✓ mark)
4. Done!

#### Request Expires
1. If you don't consume an **APPROVED** request within 30 seconds
2. Countdown timer reaches 0
3. Status changes to **EXPIRED** (gray badge, ⏱ mark)
4. Item's inventory quantity is **automatically returned**
5. You can approve it again if needed

#### Reject Request
1. Find **PENDING** request
2. Click **"Reject"** button
3. Request moves to **REJECTED** status (red badge, ✗ mark)
4. Item's inventory unchanged (never decreased)

---

## Architecture

### Backend (Node.js + Express)

- **Port**: 5000
- **State**: In-memory (lost on restart)
- **Routes**:
  - `GET /api/inventory` — List all items
  - `POST /api/inventory/item` — Create item
  - `PUT /api/inventory/item/:id` — Edit item
  - `DELETE /api/inventory/item/:id` — Delete item
  - `GET /api/requests` — List all requests
  - `POST /api/request` — Create request
  - `PUT /api/requests/:id/approve` — Approve request (with atomic quantity check)
  - `PUT /api/requests/:id/consume` — Consume request
  - `PUT /api/requests/:id/reject` — Reject request

### Frontend (React)

- **Port**: 3000
- **State Management**: React Context + localStorage
- **Auto-Refresh**: Inventory every 2s, Requests every 1s
- **Components**: 6 components for items, requests, forms, and lists
- **Styling**: CSS Grid + Flexbox, gradient background, responsive design

---

## Design Highlights

### 1. Atomic Double-Allocation Prevention
When approving a request, the backend checks if quantity is available **at that moment**. Only one approval succeeds for the last portion; others fail with a `409 Conflict` error.

### 2. Event-Driven Expiry
Approved requests have a 30-second timer. A background task runs every 5 seconds to auto-expire old requests and return quantities to inventory. The UI countdown timer updates every 1 second.

### 3. UUID-Based Deduplication
Every item and request has a UUID, not a name. You can have two "Milk" items and they won't conflict.

### 4. Manual Correction
Users can manually edit item quantities at any time. This allows recovery from inventory mismatches (e.g., "I physically counted, it's 150ml not 100ml").

### 5. Offline Fallback
State is cached in browser localStorage. If the server is down, you can still view cached inventory (read-only).

See `Changes.md` for detailed explanation of all design decisions and scenarios.

---

## Data Model

### Food Item
```json
{
  "id": "uuid",
  "name": "Milk",
  "quantity": 1000,
  "servingSize": 250,
  "expiryDate": "2026-04-20"
}
```

### Request
```json
{
  "id": "uuid",
  "itemId": "uuid",
  "requestedPortion": 250,
  "status": "pending|approved|consumed|expired|rejected",
  "requestedAt": 1713148800000,
  "approvedAt": null,
  "expiresAt": null,
  "consumedAt": null
}
```

---

## Troubleshooting

### Backend won't start
- Ensure Port 5000 is not in use: `netstat -ano | findstr :5000` (Windows)
- Try: `npm install` then `npm start` again
- Check Node version: `node --version` (need 14+)

### Frontend won't connect to backend
- Ensure backend is running on port 5000
- Check browser console (F12) for errors
- Verify proxy in `client/package.json` points to `http://localhost:5000`

### Data disappears on refresh
- This is expected — server data is lost on restart
- But localStorage should preserve a cached snapshot (reload page once more)
- To persist data: add a real database (MongoDB, PostgreSQL, etc.)

### Request doesn't expire automatically
- Expiry happens server-side every 5 seconds
- UI updates every 1 second
- If server and client time are desynchronized, expiry may be delayed
- Solution: Sync system clocks or implement NTP check

### Can't approve request (409 error)
- Another user already approved the last portion
- Try requesting a smaller amount or wait for that request to expire/be consumed

---

## Future Enhancements

- [ ] User authentication & multi-user support
- [ ] Real database (MongoDB, PostgreSQL)
- [ ] Audit logs & consumption history
- [ ] Advanced search & filtering
- [ ] Mobile-responsive design (currently basic)
- [ ] WebSocket real-time updates (instead of polling)
- [ ] Unit & integration tests
- [ ] Docker deployment
- [ ] Analytics dashboard

---

## Project Structure

```
FridgePolice/
├── server/
│   ├── index.js           # Express server with all routes & background timer
│   ├── seedData.js        # 10 sample food items
│   └── package.json
├── client/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/    # 6 React components
│   │   ├── context/       # InventoryContext with reducer
│   │   ├── hooks/         # useApi hook for HTTP + auto-refresh
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
├── Changes.md             # Detailed documentation of design decisions
├── README.md              # This file
```

---

## License

This is a prototype built for the Project Engineering Track. Feel free to use, modify, and distribute.

---

## Notes

- This is a **prototype** — not production-ready for shared environments
- All data is **ephemeral** (in-memory); add a real database for persistence
- No **authentication** — everyone can edit everything
- Designed for **low concurrency** (< 100 users)
- Fully **testable** via manual UI interaction; automated tests can be added

Enjoy managing your fridge! 🍋
