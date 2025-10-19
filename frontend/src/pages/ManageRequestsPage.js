import React, { useState, useEffect } from 'react';

function ManageRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/requests', {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });

        // to ensure we get fresh lists after actions

      const data = await res.json();
      if (res.ok) setRequests(data);
      else setError(data.error || 'Failed to fetch requests');
    } catch (err) { setError('Network error'); }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`/api/requests/${id}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      const data = await res.json();
      if (res.ok) fetchRequests();
      else alert(data.error || 'Action failed');
    } catch (err) { alert('Network error'); }
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
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table border="1" cellPadding="8" cellSpacing="0">
        <thead><tr><th>ID</th><th>Item</th><th>Requested By</th><th>Status</th><th>Requested</th><th>Approved</th><th>Returned</th><th>Actions</th></tr></thead>
        <tbody>
          {requests.map(req => (
            <tr key={req.id}>
              <td>{req.id}</td>
              <td>{req.item_name}</td>
              <td>{req.user_name} ({req.user_email})</td>
              <td style={statusStyle(req.status)}><strong>{req.status}</strong></td>
              <td>{req.request_date || '-'}</td>
              <td>{req.approve_date || '-'}</td>
              <td>{req.return_date || '-'}</td>
              <td>
                {req.status === 'PENDING' && (<><button onClick={() => handleAction(req.id, 'approve')}>Approve</button>{' '}<button onClick={() => handleAction(req.id, 'reject')}>Reject</button></>)}
                {req.status === 'APPROVED' && (<button onClick={() => handleAction(req.id, 'return')}>Mark Returned</button>)}
              </td>
            </tr>
          ))}
          {requests.length === 0 && !error && <tr><td colSpan="8">No requests to display.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default ManageRequestsPage;
