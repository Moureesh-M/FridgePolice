import React from 'react';
import { useApi } from '../hooks/useApi';
import RequestRow from './RequestRow';

const AllRequests = () => {
  const { requests, inventory } = useApi();

  // Helper to find item by ID
  const getItemName = (itemId) => {
    const item = inventory.find(i => i.id === itemId);
    return item;
  };

  const noRequests = requests.length === 0;

  return (
    <div className="requests-section">
      <h2>📋 All Requests</h2>
      {noRequests ? (
        <p>No requests yet. Request some items from inventory!</p>
      ) : (
        <div className="requests-list">
          {requests.map(request => (
            <RequestRow
              key={request.id}
              request={request}
              item={getItemName(request.itemId)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllRequests;
