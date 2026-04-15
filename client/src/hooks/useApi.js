import { useContext, useCallback, useEffect } from 'react';
import { InventoryContext } from '../context/InventoryContext';

const API_URL = 'http://localhost:5000/api';

export const useApi = () => {
  const { state, dispatch } = useContext(InventoryContext);

  // Fetch all inventory
  const fetchInventory = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/inventory`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const data = await response.json();
      dispatch({ type: 'SET_INVENTORY', payload: data });
    } catch (error) {
      console.error('Error fetching inventory:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [dispatch]);

  // Fetch all requests
  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/requests`);
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      dispatch({ type: 'SET_REQUESTS', payload: data });
    } catch (error) {
      console.error('Error fetching requests:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [dispatch]);

  // Create new food item
  const createItem = useCallback(async (itemData) => {
    try {
      const response = await fetch(`${API_URL}/inventory/item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      if (!response.ok) throw new Error('Failed to create item');
      const data = await response.json();
      dispatch({ type: 'ADD_ITEM', payload: data });
      return data;
    } catch (error) {
      console.error('Error creating item:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [dispatch]);

  // Edit food item
  const editItem = useCallback(async (id, updates) => {
    try {
      const response = await fetch(`${API_URL}/inventory/item/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to edit item');
      const data = await response.json();
      dispatch({ type: 'EDIT_ITEM', payload: data });
      return data;
    } catch (error) {
      console.error('Error editing item:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [dispatch]);

  // Delete food item
  const deleteItem = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_URL}/inventory/item/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete item');
      dispatch({ type: 'DELETE_ITEM', payload: id });
    } catch (error) {
      console.error('Error deleting item:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [dispatch]);

  // Create request
  const createRequest = useCallback(async (requestData) => {
    try {
      const response = await fetch(`${API_URL}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      if (!response.ok) throw new Error('Failed to create request');
      const data = await response.json();
      dispatch({ type: 'ADD_REQUEST', payload: data });
      return data;
    } catch (error) {
      console.error('Error creating request:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [dispatch]);

  // Approve request
  const approveRequest = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_URL}/requests/${id}/approve`, {
        method: 'PUT'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve request');
      }
      const data = await response.json();
      dispatch({ type: 'UPDATE_REQUEST', payload: data });
      // Refresh inventory to reflect decreased quantity
      await fetchInventory();
      return data;
    } catch (error) {
      console.error('Error approving request:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [dispatch, fetchInventory]);

  // Consume request
  const consumeRequest = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_URL}/requests/${id}/consume`, {
        method: 'PUT'
      });
      if (!response.ok) throw new Error('Failed to consume request');
      const data = await response.json();
      dispatch({ type: 'UPDATE_REQUEST', payload: data });
      return data;
    } catch (error) {
      console.error('Error consuming request:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [dispatch]);

  // Reject request
  const rejectRequest = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_URL}/requests/${id}/reject`, {
        method: 'PUT'
      });
      if (!response.ok) throw new Error('Failed to reject request');
      const data = await response.json();
      dispatch({ type: 'UPDATE_REQUEST', payload: data });
      return data;
    } catch (error) {
      console.error('Error rejecting request:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [dispatch]);

  // Auto-refresh inventory every 2 seconds
  useEffect(() => {
    fetchInventory();
    const inventoryInterval = setInterval(fetchInventory, 2000);
    return () => clearInterval(inventoryInterval);
  }, [fetchInventory]);

  // Auto-refresh requests every 1 second (for countdown timers)
  useEffect(() => {
    fetchRequests();
    const requestsInterval = setInterval(fetchRequests, 1000);
    return () => clearInterval(requestsInterval);
  }, [fetchRequests]);

  return {
    inventory: state.inventory,
    requests: state.requests,
    loading: state.loading,
    error: state.error,
    createItem,
    editItem,
    deleteItem,
    createRequest,
    approveRequest,
    consumeRequest,
    rejectRequest
  };
};
