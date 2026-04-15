import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';

const InventoryItem = ({ item }) => {
  const { editItem, deleteItem, createRequest } = useApi();
  const [isEditing, setIsEditing] = useState(false);
  const [quantity, setQuantity] = useState(item.quantity);
  const [error, setError] = useState('');

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await editItem(item.id, { quantity: parseInt(quantity) });
      setIsEditing(false);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete "${item.name}"?`)) {
      try {
        await deleteItem(item.id);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const canRequest = item.quantity >= item.servingSize;

  const handleQuickRequest = async () => {
    try {
      await createRequest({
        itemId: item.id,
        requestedPortion: item.servingSize
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="inventory-item">
      <div className="item-header">
        <strong>{item.name}</strong>
        <span className="item-id">ID: {item.id.substring(0, 8)}</span>
      </div>

      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="edit-form">
          <input
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantity"
          />
          <button type="submit">Save</button>
          <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
        </form>
      ) : (
        <div className="item-details">
          <p>Quantity: <strong>{item.quantity}</strong> units</p>
          <p>Serving Size: <strong>{item.servingSize}</strong> units</p>
          <p>Expiry: <strong>{item.expiryDate}</strong></p>
        </div>
      )}

      <div className="item-actions">
        <button onClick={() => setIsEditing(!isEditing)} className="btn-edit">
          {isEditing ? 'Editing...' : 'Edit'}
        </button>
        <button onClick={handleDelete} className="btn-delete">Delete</button>
        <button
          onClick={handleQuickRequest}
          disabled={!canRequest}
          className="btn-request"
          title={!canRequest ? `Need at least ${item.servingSize} units` : 'Request one serving'}
        >
          {canRequest ? `Request (${item.servingSize}u)` : 'Low Stock'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default InventoryItem;
