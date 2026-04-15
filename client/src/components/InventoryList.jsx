import React from 'react';
import { useApi } from '../hooks/useApi';
import InventoryItem from './InventoryItem';

const InventoryList = () => {
  const { inventory } = useApi();

  return (
    <div className="inventory-section">
      <h2>🥛 Inventory</h2>
      {inventory.length === 0 ? (
        <p>No items in inventory. Add some!</p>
      ) : (
        <div className="items-grid">
          {inventory.map(item => (
            <InventoryItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryList;
