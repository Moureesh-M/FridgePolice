import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';

const RequestForm = () => {
  const { inventory, createRequest } = useApi();
  const [selectedItemId, setSelectedItemId] = useState('');
  const [requestedPortion, setRequestedPortion] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedItem = inventory.find(i => i.id === selectedItemId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (!selectedItemId) {
        setError('Please select an item');
        return;
      }

      const portion = parseInt(requestedPortion);
      if (!portion || portion <= 0) {
        setError('Portion must be greater than 0');
        return;
      }

      await createRequest({
        itemId: selectedItemId,
        requestedPortion: portion
      });

      setSuccess(`Request created! Now pending approval.`);
      setSelectedItemId('');
      setRequestedPortion('');

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="form-section">
      <h3>🔔 Create Request</h3>
      <form onSubmit={handleSubmit} className="request-form">
        <div className="form-group">
          <label>Select Item:</label>
          <select
            value={selectedItemId}
            onChange={(e) => {
              setSelectedItemId(e.target.value);
              // Auto-fill with serving size if item has one
              if (inventory.find(i => i.id === e.target.value)) {
                setRequestedPortion(inventory.find(i => i.id === e.target.value).servingSize.toString());
              }
            }}
            required
          >
            <option value="">-- Choose an item --</option>
            {inventory.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.quantity}u available)
              </option>
            ))}
          </select>
        </div>

        {selectedItem && (
          <div className="form-group">
            <label>Portion Size (units):</label>
            <input
              type="number"
              min="1"
              value={requestedPortion}
              onChange={(e) => setRequestedPortion(e.target.value)}
              placeholder="Portion size"
              required
            />
            <small>
              Available: {selectedItem.quantity}u | Default serving: {selectedItem.servingSize}u
            </small>
          </div>
        )}

        <button type="submit" disabled={!selectedItemId}>Create Request</button>
      </form>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </div>
  );
};

export default RequestForm;
