# FridgePolice: Changes & Implementation Documentation

## Application Overview

**FridgePolice** is a full-stack food inventory management system that allows users to request, approve, and consume food portions from a shared refrigerator or pantry.

### What It Does
- **List food items** with current quantity, serving size, and expiry date
- **Request portions** from available items (requests enter "pending" state)
- **Approve requests** atomically, decreasing inventory quantity (requests move to "approved" state and start a 30-second countdown timer)
- **Consume approved requests** before the timer expires (requests move to "consumed" state)
- **Auto-expire unapproved requests** after 30 seconds (requests move to "expired" state, quantity is automatically returned)
- **Manually correct inventory** via edit, delete, or reset buttons (for inventory discrepancies)

### Tech Stack
- **Backend**: Node.js + Express (port 5000)
- **Frontend**: React (port 3000)
- **Communication**: REST API with JSON payloads
- **State Management**: In-memory on server, localStorage on client
- **No Database**: All state is ephemeral (lost on server restart) with optional localStorage fallback

---

## How Each Scenario is Handled

### Scenario 1: Prevent Double Allocation (Last Portion Lock)

**Problem**: Prevent two users from requesting and using the same portion simultaneously.

**Solution**: Atomic quantity check at **approval time**, not request time.

**Flow**:
1. User A requests 25ml of Milk (current inventory: 100ml)
   - Request created with `status: "pending"`
   - Inventory **unchanged** (still 100ml)
   
2. User B simultaneously requests 100ml of Milk
   - Request created with `status: "pending"`
   - Inventory **unchanged** (still 100ml)
   
3. User A approves their request
   - **Atomic check**: Is `item.quantity (100ml) >= request.requestedPortion (25ml)`? YES
   - Inventory decreases by 25ml → `75ml`
   - Request marked `status: "approved"`, 30-second timer set
   
4. User B tries to approve their request
   - **Atomic check**: Is `item.quantity (75ml) >= request.requestedPortion (100ml)`? NO
   - Server returns `409 Conflict` error
   - Request stays in `"pending"` state
   - Inventory unchanged

**Key Design Decision**: 
- Quantity check happens **at approval time**, not request time
- This allows users to create requests optimistically (even if low on stock) but prevents "double-booking"
- Only one approval succeeds for the last portion; others fail with clear error message

**Code Location**: 
- Backend: `server/index.js` → `PUT /api/requests/:id/approve` endpoint
- Logic: Check `item.quantity >= request.requestedPortion`, then atomically decrease quantity

---

### Scenario 2: Expiring Approvals (30-Second Timeout)

**Problem**: Approved requests should only be held for a limited time; if not consumed quickly, the portion should be returned to inventory.

**Solution**: Server-side background timer that runs every 5 seconds, combined with client-side countdown UI.

**Flow**:
1. User approves request
   - `request.approvedAt = now`
   - `request.expiresAt = now + 30 seconds`
   - Quantity decreases immediately
   
2. Frontend displays countdown timer
   - Calculates: `timeRemaining = expiresAt - currentTime`
   - Updates every 1 second with auto-refresh from backend
   - Timer turns **red** when < 5 seconds remain (warning state)
   
3. User has 30 seconds to click "Consume" button
   - If consumed before timeout → request moves to `"consumed"` state, done
   - If user doesn't click → approval expires
   
4. Backend background task (every 5 seconds)
   - Finds all requests with `status: "approved"` and `expiresAt < now`
   - Marks them as `"expired"`
   - Returns quantity to inventory: `item.quantity += request.requestedPortion`
   
5. Frontend auto-refreshes (every 1 second)
   - Shows expired request with gray status badge
   - Shows "Request expired" countdown
   - Disables "Consume" button (too late)

**Key Design Decision**:
- **30-second timeout** balances urgency (quick decision) with UX (not rushed)
- Backend handles expiry (deterministic, not browser-dependent)
- Client-side countdown timer is **visual only** — actual expiry is server-driven
- If browser countdown and server expiry desync slightly, server decision wins

**Code Location**:
- Backend: `server/index.js` → Background task (`setInterval` every 5 seconds)
- Frontend: `client/src/components/RequestRow.jsx` → Countdown timer calculation
- Frontend: `client/src/hooks/useApi.js` → Auto-refresh every 1 second

---

### Scenario 3: Duplicate Items (Unique ID Tracking)

**Problem**: Two items with the same name (e.g., "Milk from store A" and "Milk from store B") should be tracked independently.

**Solution**: Use UUID for each item, never index by name.

**Implementation**:
```
Item 1: { id: "uuid-123", name: "Milk", quantity: 100, ... }
Item 2: { id: "uuid-456", name: "Milk", quantity: 50, ... }
```

Both items can coexist. Requests reference `itemId` (UUID), not item name.

**Frontend UX**:
- Each item displays its UUID (shortened to first 8 chars) so users can distinguish
- Dropdown in "Create Request" shows both: `"Milk (Item #uuid... | 100u available)"`
- Users cannot accidentally confuse which Milk they're requesting

**Key Design Decision**:
- UUIDs prevent any ambiguity or name-based lookups
- Allows legitimate duplicate item names (different sources/containers)
- Clear deduplication strategy: unique ID is the source of truth

**Code Location**:
- Backend: `seedData.js` → Each item generated with `uuidv4()`
- Frontend: `client/src/components/InventoryItem.jsx` → Shows item ID
- Frontend: `client/src/components/RequestForm.jsx` → Dropdown filters by ID

---

### Scenario 4: Inventory Mismatch (Manual Correction)

**Problem**: Real-world inventory can go wrong (human count errors, accidental consumption, spills). Users need to correct the system to match physical reality.

**Solution**: Admin-style "Edit" and "Delete" buttons on each inventory item.

**Available Actions**:

1. **Edit Item**
   - Click "Edit" button on any item
   - Form appears to change: quantity, serving size, expiry date, or name
   - Submit → sends `PUT /api/inventory/item/:id` to server
   - Inventory updates immediately, bypasses any pending/approved requests
   
2. **Delete Item**
   - Click "Delete" button on item
   - Confirms: "Delete 'Milk'?"
   - If confirmed → sends `DELETE /api/inventory/item/:id`
   - Item removed entirely (all its requests stay in history though)
   
3. **Reset Quantity**
   - Edit item, set quantity to new value (e.g., "I recounted, actually 120ml")
   - Submit → quantity updated directly

**Edge Cases**:
- User edits quantity while a request is approved
  - Quantity **can go negative** if user manually decreases it below approved request amount
  - This is **expected behavior** — manual override is intentional
  - Example: User edits "Milk" from 100ml to 50ml, but 75ml is already approved → new quantity is 50ml (allowing negative in the display indicates a mismatch that should be fixed)

**Key Design Decision**:
- Manual edits are **unrestricted** — they override requests
- Assumes a human reviewed physical inventory and knows more than the system
- Allows recovery from any state mismatch

**Code Location**:
- Frontend: `client/src/components/InventoryItem.jsx` → Edit form + Delete button
- Frontend: `client/src/hooks/useApi.js` → `editItem()` and `deleteItem()` functions
- Backend: `server/index.js` → `PUT /api/inventory/item/:id` and `DELETE /api/inventory/item/:id` endpoints

---

## Key Design Decisions

### 1. In-Memory State (No Database)
- **Decision**: Keep all inventory and requests in RAM on the server
- **Rationale**: Simplicity for prototype; easier to test and debug
- **Trade-off**: Data lost on server restart
- **Mitigation**: localStorage on client provides a fallback cache

### 2. localStorage Persistence on Client
- **Decision**: Save inventory and requests to browser localStorage after every mutation
- **Rationale**: Allows UI to work even if server restarts or is temporarily down (read-only)
- **Trade-off**: Client cache can become stale if other users make changes
- **Mitigation**: Auto-refresh every 2 seconds (inventory) and 1 second (requests) from server

### 3. Serial Request Processing (No Complex Locks)
- **Decision**: Rely on Express's native single-threaded request handling for atomicity
- **Rationale**: Sufficient for prototype; avoids complex lock management
- **Trade-off**: Cannot handle truly parallel requests well (but express-queue could be added later)
- **Mitigation**: Atomic quantity check at approval time ensures correctness

### 4. Fixed Portions (Not Percentage-Based)
- **Decision**: Each item has a `servingSize` (e.g., 250ml); users request fixed amounts
- **Rationale**: Simpler UX and logic; easier to understand and verify
- **Trade-off**: Less flexible than percentage-based requests
- **Mitigation**: Users can create custom requests with any portion (not just default serving size)

### 5. 30-Second Approval Timeout
- **Decision**: Approved requests expire after 30 seconds if not consumed
- **Rationale**: Balances urgency (can't hoard) with UX (enough time to click button)
- **Trade-off**: Might be too short for slow users or network delays
- **Mitigation**: Only affects client-side experience; can be tuned server-side in future

### 6. UUID for All Entities
- **Decision**: Every item and request gets a UUID, not an auto-incrementing ID
- **Rationale**: Avoid ID collisions; allow easy client-side generation if needed
- **Trade-off**: UUIDs longer than integers (minor UI trade-off)
- **Mitigation**: Display only first 8 chars in UI, full UUID in hover/copy

---

## How Correctness is Ensured

### 1. Atomic Quantity Checks
- **Mechanism**: At approval time, server checks `item.quantity >= request.requestedPortion` before decreasing
- **Ensures**: No double-booking of last portion
- **Fallback**: If two approvals race, the second one gets a `409 Conflict` error and can retry

### 2. Server-Side Expiry Logic
- **Mechanism**: Background task every 5 seconds auto-expires old approvals
- **Ensures**: Quantity is always returned even if client forgets to reject
- **Fallback**: Client-side countdown gives user visual warning

### 3. State Validation on Every Mutation
- **Mechanism**: Each endpoint checks preconditions (e.g., request exists, has correct status)
- **Ensures**: Invalid state transitions are rejected (e.g., can't consume a "pending" request)
- **Fallback**: Frontend disables buttons that would fail (e.g., "Consume" grayed out for pending requests)

### 4. Manual Corrections
- **Mechanism**: Edit/delete endpoints allow unrestricted inventory changes
- **Ensures**: Can recover from any discrepancy between system state and physical reality
- **Fallback**: localStorage provides a backup of last good state

### 5. Auto-Refresh UI
- **Mechanism**: Frontend auto-refreshes inventory (2s) and requests (1s) from server
- **Ensures**: UI always shows latest server state despite network delays
- **Fallback**: If server down, localStorage provides cached view

### 6. Clear State Transitions
- **Mechanism**: Each entity (request) follows a strict state machine:
  ```
  pending → {approved → {consumed, expired}, rejected}
  ```
- **Ensures**: Only valid transitions allowed (e.g., can't go from expired to consumed)
- **Fallback**: Server rejects invalid transitions with clear error messages

---

## Testing Verification Checklist

### Backend Endpoints
- [ ] `GET /api/inventory` returns all items
- [ ] `POST /api/inventory/item` creates new item with validation
- [ ] `PUT /api/inventory/item/:id` edits item (quantity can be set to any value)
- [ ] `DELETE /api/inventory/item/:id` removes item
- [ ] `POST /api/request` creates pending request without decreasing quantity
- [ ] `GET /api/requests` returns all requests sorted by status
- [ ] `PUT /api/requests/:id/approve` checks quantity, returns 409 if insufficient
- [ ] `PUT /api/requests/:id/consume` marks request consumed if still approved
- [ ] Background task auto-expires unapproved requests after 30s

### Frontend UI
- [ ] App loads, displays items from API
- [ ] localStorage populated after first load
- [ ] "Add Item" form creates new item, appears in list
- [ ] "Edit" button allows changing quantity
- [ ] "Delete" button removes item (with confirmation)
- [ ] "Request" button creates pending request, appears in all requests list
- [ ] Approve button: request moves to "approved" status, countdown timer appears, inventory qty decreases
- [ ] Consume button: request moves to "consumed" status
- [ ] Wait 30s: approved request auto-expires, status badge changes to "expired" (gray), quantity restored in inventory
- [ ] Refresh page: state loads from localStorage and syncs with server

### Integration
- [ ] Create item (200ml), request 5 portions (40ml each)
- [ ] Approve 5 requests one by one: first 5 succeed (0ml remaining), 6th fails with 409
- [ ] Don't consume request 5: after 30s it expires, qty returns to 40ml
- [ ] Request list shows clear status progression: pending → approved → {expired/consumed}

---

## Assumptions & Limitations

### Assumptions
1. Single server instance (no horizontal scaling)
2. Low concurrency (< 100 simultaneous users)
3. Time is in sync across client/server (no clock skew issues)
4. Portions are fixed per item (no custom serving sizes per request... actually users CAN customize, but default is serving size)
5. All data loss on server restart is acceptable
6. localStorage is available and trusted on client (no data tampering)

### Limitations & Future Improvements
- No user authentication (everyone is admin)
- No audit logs (can't see who approved what)
- No database persistence (data lost on restart)
- No conflict resolution (if two users edit same item simultaneously, last write wins)
- No mobile responsiveness (CSS media queries exist but not fully tested)
- No test suite (manual testing only)
- No GraphQL API (REST only)
- No real-time WebSocket updates (polling instead)

---

## File Structure

```
FridgePolice/
├── server/
│   ├── index.js              # Express app, all routes, background timer
│   ├── seedData.js           # 10 sample food items (UUIDs + quantities)
│   └── package.json
│
├── client/
│   ├── public/
│   │   └── index.html        # React mount point
│   ├── src/
│   │   ├── components/       # 6 UI components
│   │   │   ├── InventoryItem.jsx
│   │   │   ├── InventoryList.jsx
│   │   │   ├── InventoryForm.jsx
│   │   │   ├── RequestRow.jsx
│   │   │   ├── AllRequests.jsx
│   │   │   └── RequestForm.jsx
│   │   ├── context/
│   │   │   └── InventoryContext.jsx  # Global state + localStorage
│   │   ├── hooks/
│   │   │   └── useApi.js             # HTTP calls + auto-refresh
│   │   ├── App.js            # Main layout
│   │   ├── App.css           # Styled with gradient background
│   │   └── index.js          # React entry point
│   └── package.json
│
├── Changes.md                # This file
├── README.md                 # Setup & run instructions
└── .gitignore (optional)
```

---

## How to Run

### Backend
```bash
cd server
npm install
npm start
# Server should output: "🍋 FridgePolice server running on http://localhost:5000"
```

### Frontend
```bash
cd client
npm install
npm start
# React Dev Server should open browser to http://localhost:3000
```

### Full Integration
1. Start backend first (port 5000)
2. Start frontend second (port 3000)
3. Both should connect automatically (proxy in package.json)
4. Open browser to `http://localhost:3000`

---

## Summary

FridgePolice is a **functional prototype** that demonstrates:
1. ✅ Clear handling of 4 critical scenarios (double allocation, expiry, deduplication, correction)
2. ✅ Atomic operations for inventory correctness
3. ✅ Graceful expiry recovery (auto-return quantities)
4. ✅ Simple state machine for requests (pending → approved → {consumed/expired})
5. ✅ Manual override for inventory mismatches
6. ✅ Full-stack integration (React + Express, REST API, localStorage cache)
7. ✅ Clean, testable code with clear separation of concerns

The app is **production-ready for a prototype** but would need authentication, real database, audit logs, and scalability improvements for production use.
