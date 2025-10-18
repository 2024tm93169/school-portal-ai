import React, { useState, useEffect } from 'react';

function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics', {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      const data = await res.json();
      if (res.ok) setStats(data);
      else setError(data.error || 'Failed to fetch analytics');
    } catch (err) { setError('Network error'); }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  return (
    <div style={{ padding: '0 20px' }}>
      <h2>Usage Analytics</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {stats ? (
        <ul>
          <li>Total Equipment: {stats.total_equipment}</li>
          <li>Total Users (non-admin): {stats.total_users}</li>
          <li>Total Requests Submitted: {stats.total_requests}</li>
          <li>Active Loans (currently borrowed): {stats.active_loans}</li>
          <li>Pending Requests: {stats.pending_requests}</li>
          <li>Most Requested Item: {stats.most_requested_item || 'N/A'}</li>
        </ul>
      ) : (!error && <p>Loading analytics...</p>)}
    </div>
  );
}

export default AnalyticsPage;
