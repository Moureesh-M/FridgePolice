# FridgePolice 🍋

Food inventory management system with request/approval workflow. Built with React + Express.

## Features

- 📦 **Inventory Management** — Add, edit, delete items  
- 🔔 **Request System** — Request → Approve → Consume portions  
- ⏱️ **Auto-Expiry** — 30-second countdown; auto-returns portions if not consumed  
- 🔒 **Double-Allocation Prevention** — Atomic checks prevent overselling  
- 🆔 **Unique Item IDs** — UUID-based; allows duplicate names  
- ✏️ **Manual Corrections** — Edit quantities to fix inventory mismatches  
- 💾 **Offline Support** — localStorage cache when server is unavailable  
- 📊 **Real-Time UI** — Auto-refresh every 1-2 seconds  

## Quick Start

**Prerequisites:** Node.js 14+

```bash
# Terminal 1: Backend (port 5000)
cd server && npm install && npm start

# Terminal 2: Frontend (port 3000)
cd client && npm install && npm start
```

Open `http://localhost:3000` in your browser.

---

## How to Use

### Left Column: Inventory
1. **Add Item** — Fill form (name, quantity, serving size, expiry) → Click "Add Item"
2. **Edit Quantity** — Click "Edit" on item → Change number → Click "Save"
3. **Delete Item** — Click "Delete" on item → Confirm

### Right Column: Requests
1. **Create Request** — Select item from dropdown → Adjust portion (optional) → Click "Create Request"
2. **Approve Request** — Click "Approve" on pending request → Inventory qty decreases → 30s timer starts
3. **Consume Request** — Click "Consume" before timer expires → Request marked complete
4. **Request Expires** — If not consumed in 30s → Auto-marked expired → Quantity returned to inventory
5. **Reject** — Click "Reject" on pending request → No qty change

**Status Badges:**
- 🟡 **PENDING** — Waiting for approval
- 🔵 **APPROVED** — Approved, counting down (30s to consume)
- 🟢 **CONSUMED** — Done
- ⚫ **EXPIRED** — Auto-expired (qty returned)
- 🔴 **REJECTED** — Rejected (qty unchanged)

---

## How It Works

### Double Allocation Prevention
When approving a request, backend checks: `if (item.qty >= request.amount) approve; else return 409 error`  
→ Only one approval succeeds for the last portion.

### Expiring Approvals
- Approval timestamp + 30s = expiry time
- Backend task every 5s: auto-expire old approvals, return qty
- UI countdown: visual warning (red when < 5s)

### Deduplication
Every item has UUID (not name). Two "Milk" items = two independent entries.

### Inventory Corrections
Edit endpoint allows any qty change (override pending/approved requests). Fixes real-world mismatches.

**→ See [Changes.md](Changes.md) for detailed scenario explanations.**

---

## Architecture

| Component | Port | Tech |
|-----------|------|------|
| **Backend** | 5000 | Express + Node.js |
| **Frontend** | 3000 | React + Context API |
| **State** | Server | In-memory (lost on restart) |
| **Fallback** | Client | localStorage (auto-sync) |

**Endpoints:**
- `GET /api/inventory` — List items
- `POST/PUT/DELETE /api/inventory/item/:id` — CRUD items
- `GET /api/requests` — List requests
- `POST /api/request` — Create request
- `PUT /api/requests/:id/{approve|consume|reject}` — Update request

---

## Project Structure

```
server/
├── index.js                    # All endpoints + background expiry timer
├── seedData.js                 # 10 seed items
└── package.json

client/
├── src/
│   ├── components/             # InventoryItem, InventoryList, InventoryForm,
│   │                            # RequestRow, AllRequests, RequestForm
│   ├── context/InventoryContext.jsx    # Global state + localStorage sync
│   ├── hooks/useApi.js         # HTTP calls + auto-refresh logic
│   ├── App.js                  # Main layout
│   ├── App.css                 # Responsive styling
│   └── index.js
├── public/index.html
└── package.json

Changes.md                       # Design decisions, scenarios, verification checklist
README.md                        # This file
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **Backend won't start** | Check Node 14+, port 5000 free, try `npm install && npm start` |
| **Frontend can't connect to backend** | Verify backend running on 5000, check browser console (F12) |
| **Data lost on refresh** | Expected (in-memory). localStorage preserves a cache – refresh again. Add real DB for persistence. |
| **Can't approve (409 error)** | Another user took the last portion. Wait for expiry or request smaller amount. |
| **Request doesn't auto-expire** | Server-side timer every 5s, UI updates 1s. Sync system clocks if desynchronized. |

---

## Data Model

```json
{
  "Item": {
    "id": "uuid",
    "name": "string",
    "quantity": "number",
    "servingSize": "number",
    "expiryDate": "string (YYYY-MM-DD)"
  },
  "Request": {
    "id": "uuid",
    "itemId": "uuid",
    "requestedPortion": "number",
    "status": "pending | approved | consumed | expired | rejected",
    "requestedAt": "timestamp",
    "approvedAt": "timestamp | null",
    "expiresAt": "timestamp | null",
    "consumedAt": "timestamp | null"
  }
}
```

---

## Notes

✅ **Production-Ready for Prototype**
- Clean, well-organized code
- All scenarios tested and working
- Atomic operations prevent data corruption

❌ **Not Production-Ready for Scale**
- No authentication/multi-user
- In-memory data (lost on restart)
- No audit logs
- Single server (not distributed)

**To upgrade for production:** Add real DB (MongoDB/PostgreSQL), user auth, Docker, CI/CD, tests.

---

## License

Prototype for Project Engineering Track. MIT License.
