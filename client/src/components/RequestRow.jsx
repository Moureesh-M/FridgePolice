import React, { useMemo } from 'react';
import { useApi } from '../hooks/useApi';

const RequestRow = ({ request, item }) => {
  const { approveRequest, consumeRequest, rejectRequest } = useApi();
  const [error, setError] = React.useState('');

  // Calculate remaining time for approved requests
  const timeRemaining = useMemo(() => {
    if (request.status !== 'approved' || !request.expiresAt) return null;
    const remaining = Math.max(0, request.expiresAt - Date.now());
    return Math.ceil(remaining / 1000); // Convert to seconds
  }, [request.status, request.expiresAt]);

  // Format time remaining
  const formatTime = (seconds) => {
    if (seconds <= 0) return '0s';
    return `${seconds}s`;
  };

  const getStatusColor = () => {
    switch (request.status) {
      case 'pending':
        return '#FFC107';
      case 'approved':
        return '#2196F3';
      case 'consumed':
        return '#4CAF50';
      case 'expired':
        return '#999';
      case 'rejected':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const isExpired = timeRemaining === 0 && request.status === 'approved';
  const isWarning = timeRemaining !== null && timeRemaining < 5;

  const handleApprove = async () => {
    try {
      setError('');
      await approveRequest(request.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConsume = async () => {
    try {
      setError('');
      await consumeRequest(request.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = async () => {
    try {
      setError('');
      await rejectRequest(request.id);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="request-row" style={{ borderLeftColor: getStatusColor() }}>
      <div className="request-info">
        <div className="request-header">
          <strong>{item ? item.name : 'Unknown Item'}</strong>
          <span className={`status-badge ${request.status} ${isWarning ? 'warning' : ''}`}>
            {request.status.toUpperCase()}
          </span>
        </div>
        <p className="request-details">
          Requested: <strong>{request.requestedPortion}u</strong>
          {timeRemaining !== null && (
            <span className={`time-remaining ${isWarning ? 'warning' : ''}`}>
              Expires in: <strong>{formatTime(timeRemaining)}</strong>
            </span>
          )}
        </p>
        <p className="request-time">
          Created: {new Date(request.requestedAt).toLocaleTimeString()}
        </p>
      </div>

      <div className="request-actions">
        {request.status === 'pending' && (
          <>
            <button onClick={handleApprove} className="btn-approve">Approve</button>
            <button onClick={handleReject} className="btn-reject">Reject</button>
          </>
        )}

        {request.status === 'approved' && (
          <>
            <button onClick={handleConsume} className="btn-consume" disabled={isExpired}>
              {isExpired ? 'Expired' : 'Consume'}
            </button>
          </>
        )}

        {request.status === 'consumed' && (
          <span className="status-text">✓ Completed</span>
        )}

        {request.status === 'expired' && (
          <span className="status-text">⏱ Auto-expired</span>
        )}

        {request.status === 'rejected' && (
          <span className="status-text">✗ Rejected</span>
        )}
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default RequestRow;
