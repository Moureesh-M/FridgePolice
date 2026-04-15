import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';

const InventoryForm = () => {
  const { createItem } = useApi();
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    servingSize: '',
    expiryDate: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.name || !formData.quantity || !formData.servingSize || !formData.expiryDate) {
        setError('All fields are required');
        return;
      }

      const quantity = parseInt(formData.quantity);
      const servingSize = parseInt(formData.servingSize);

      if (quantity < 0) {
        setError('Quantity cannot be negative');
        return;
      }

      if (servingSize <= 0) {
        setError('Serving size must be greater than 0');
        return;
      }

      await createItem({
        name: formData.name,
        quantity,
        servingSize,
        expiryDate: formData.expiryDate
      });

      setSuccess(`Added "${formData.name}" to inventory!`);
      setFormData({
        name: '',
        quantity: '',
        servingSize: '',
        expiryDate: ''
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Get today's date in YYYY-MM-DD format for default expiry
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="form-section">
      <h3>➕ Add New Item</h3>
      <form onSubmit={handleSubmit} className="item-form">
        <input
          type="text"
          name="name"
          placeholder="Item name (e.g., Milk)"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="quantity"
          placeholder="Initial quantity (units)"
          value={formData.quantity}
          onChange={handleChange}
          min="0"
          required
        />
        <input
          type="number"
          name="servingSize"
          placeholder="Serving size (units)"
          value={formData.servingSize}
          onChange={handleChange}
          min="1"
          required
        />
        <input
          type="date"
          name="expiryDate"
          value={formData.expiryDate}
          onChange={handleChange}
          min={today}
          required
        />
        <button type="submit">Add Item</button>
      </form>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </div>
  );
};

export default InventoryForm;
