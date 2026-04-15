import React from 'react';
import { InventoryProvider } from './context/InventoryContext';
import { useApi } from './hooks/useApi';
import InventoryList from './components/InventoryList';
import InventoryForm from './components/InventoryForm';
import AllRequests from './components/AllRequests';
import RequestForm from './components/RequestForm';
import './App.css';

const AppContent = () => {
  const { error } = useApi();

  return (
    <div className="app">
      <header className="app-header">
        <h1>🍋 FridgePolice</h1>
        <p>Inventory & Request Management System</p>
      </header>

      {error && (
        <div className="app-error">
          <p>⚠️ {error}</p>
        </div>
      )}

      <main className="app-main">
        <div className="column left-column">
          <InventoryForm />
          <InventoryList />
        </div>

        <div className="divider"></div>

        <div className="column right-column">
          <RequestForm />
          <AllRequests />
        </div>
      </main>

      <footer className="app-footer">
        <p>Built with React + Express | In-memory state with localStorage persistence</p>
      </footer>
    </div>
  );
};

function App() {
  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  );
}

export default App;
