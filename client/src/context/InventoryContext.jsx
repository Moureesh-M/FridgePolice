import React, { createContext, useReducer, useEffect } from 'react';

export const InventoryContext = createContext();

const initialState = {
  inventory: [],
  requests: [],
  loading: false,
  error: null
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_INVENTORY':
      return { ...state, inventory: action.payload, error: null };

    case 'SET_REQUESTS':
      return { ...state, requests: action.payload, error: null };

    case 'ADD_ITEM':
      return { ...state, inventory: [...state.inventory, action.payload], error: null };

    case 'EDIT_ITEM':
      return {
        ...state,
        inventory: state.inventory.map(item =>
          item.id === action.payload.id ? action.payload : item
        ),
        error: null
      };

    case 'DELETE_ITEM':
      return {
        ...state,
        inventory: state.inventory.filter(item => item.id !== action.payload),
        error: null
      };

    case 'UPDATE_REQUEST':
      return {
        ...state,
        requests: state.requests.map(req =>
          req.id === action.payload.id ? action.payload : req
        ),
        error: null
      };

    case 'ADD_REQUEST':
      return { ...state, requests: [...state.requests, action.payload], error: null };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    default:
      return state;
  }
};

export const InventoryProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem('fridgepolice-state');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        dispatch({ type: 'SET_INVENTORY', payload: parsed.inventory || [] });
        dispatch({ type: 'SET_REQUESTS', payload: parsed.requests || [] });
      } catch (e) {
        console.warn('Failed to load from localStorage:', e);
      }
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('fridgepolice-state', JSON.stringify({
      inventory: state.inventory,
      requests: state.requests
    }));
  }, [state.inventory, state.requests]);

  return (
    <InventoryContext.Provider value={{ state, dispatch }}>
      {children}
    </InventoryContext.Provider>
  );
};
