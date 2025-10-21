import React, { useState, useEffect, useCallback } from 'react';

// Uses REACT_APP_API_BASE for Docker (e.g., http://backend:5000)
// or CRA proxy (http://localhost:5000) for local npm start.
const API_BASE = process.env.REACT_APP_API_BASE || '';


function ManageRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const role = (localStorage.getItem('userRole') || '').trim().toLowerCase();
  const token = localStorage.getItem('token') || '';

  // Guard: show clear message if non-admin opens this page
  if (role !== 'admin') {
    return (
      <div style={{ padding: '0 20px' }}>
        <h2>Manage Requests</h2>
        <p style={{ color: 'crimson' }}>
          You are not authorized to view this page. Current role: <b>{String(role || 'unknown')}</b>
        </p>
      </div>
    );
  }

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  });

  const normalize = (r) => ({
    ...r,
    status: String(r.status || '').trim().toUpperCase(),
    item_name: r.item_name || r.itemName || '-',
    user_name: r.user_name || r.userName || '-',
    user_email: r.user_email || r.userEmail || '-',
  });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/requests`, {
        method: 'GET',
        headers: authHeaders(),
        cache: 'no-store',
      });
      const text = await res.text();
      let data = [];
      try {
        data = text ? JSON.parse(text) : [];
      } catch (e) {
        console.error('Bad JSON from /api/requests:', text);
      }

      if (!res.ok) {
        setError(
          (data && data.error) || `Failed to fetch requests (HTTP ${res.status})`
        );
        setRequests([]);
        return;
      }

      const normalized = Array.isArray(data) ? data.map(normalize) : [];
      setRequests(normalized);
    } catch (err) {
      console.error('GET /api/requests error:', err);
      setError('Network error while loading requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (id, action) => {
    try {
      const url =
        action === 'approve'
          ? `${API_BASE}/api/requests/${id}/approve`
          : action === 'reject'
          ? `${API_BASE}/api/requests/${id}/reject`
          : action === 'return'
          ? `${API_BASE}/api/requests/${id}/return`
          : null;

      if (!url) return;
      console.log('POST', url);

      const res = await fetch(url, {
        method: 'POST',
        headers: authHeaders(),
      });
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {}

      if (!res.ok) {
        alert(
          (data && data.error) ||
            `Action failed (${action}, HTTP ${res.status})`
        );
        return;
      }

      // Refresh table after successful action
      await fetchRequests();
    } catch (err) {
      console.error(`POST /api/requests/${id}/${action} failed`, err);
      alert('Network error performing action');
    }
  };

  const statusStyle = (status) => {
    if (status === 'APPROVED') return { color: 'green' };
    if (status === 'REJECTED') return { color: 'red' };
    if (status === 'PENDING') return { color: 'orange' };
    return {};
  };

  return (
    <div style={{ padding: '0 20px' }}>
      <h2>Manage Requests</h2>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 10 }}>
        API Base: <b>{API_BASE || '(CRA proxy)'}</b> | Role: <b>{role}</b>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', maxWidth: 900 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Item</th>
            <th>Requested By</th>
            <th>Status</th>
            <th>Requested</th>
            <th>Approved</th>
            <th>Returned</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {!loading && requests.length === 0 && !error && (
            <tr><td colSpan="8">No requests to display.</td></tr>
          )}

          {requests.map((req) => (
            <tr key={req.id}>
              <td>{req.id}</td>
              <td>{req.item_name}</td>
              <td>{req.user_name} ({req.user_email})</td>
              <td style={statusStyle(req.status)}><strong>{req.status}</strong></td>
              <td>{req.request_date || '-'}</td>
              <td>{req.approve_date || '-'}</td>
              <td>{req.return_date || '-'}</td>
              {/* === Buttons exactly as required === */}
              <td>
                {req.status === 'PENDING' && (
                  <>
                    <button
                      style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        marginRight: '6px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                      }}
                      onClick={() => handleAction(req.id, 'approve')}
                    >
                      Approve
                    </button>
                    <button
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                      }}
                      onClick={() => handleAction(req.id, 'reject')}
                    >
                      Reject
                    </button>
                  </>
                )}

                {req.status === 'APPROVED' && (
                  <button
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                    }}
                    onClick={() => handleAction(req.id, 'return')}
                  >
                    Mark Returned
                  </button>
                )}

                {req.status !== 'PENDING' && req.status !== 'APPROVED' && <em>—</em>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ManageRequestsPage;
