import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function EquipmentListPage() {
  const [equipment, setEquipment] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [reqSuccess, setReqSuccess] = useState('');
  const [reqError, setReqError] = useState('');
  const userRole = localStorage.getItem('userRole');
  const navigate = useNavigate();

  const fetchEquipment = async () => {
    try {
      const res = await fetch('/api/equipment');
      const data = await res.json();
      if (res.ok) setEquipment(data);
    } catch (err) { /* silent */ }
  };

  useEffect(() => { fetchEquipment(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      const res = await fetch('/api/equipment/' + id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      const data = await res.json();
      if (res.ok) fetchEquipment();
      else alert(data.error || 'Failed to delete');
    } catch (err) { alert('Network error'); }
  };

  const handleRequest = async (id) => {
    setReqSuccess(''); setReqError('');
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ item_id: id })
      });
      const data = await res.json();
      if (res.ok) setReqSuccess('Request submitted successfully.');
      else setReqError(data.error || 'Request failed');
    } catch (err) { setReqError('Network error'); }
  };

  const categories = ['All', ...new Set(equipment.map(item => item.category))];
  const filtered = equipment.filter(item => {
    const catOK = (categoryFilter === 'All' || item.category === categoryFilter);
    const availOK = (!availableOnly || item.available_quantity > 0);
    return catOK && availOK;
  });

  return (
    <div style={{ padding: '0 20px' }}>
      <h2>Equipment Catalog</h2>
      <div style={{ marginBottom: '10px' }}>
        <label>Category: </label>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <label style={{ marginLeft: '20px' }}>
          <input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)} />
          {' '}Show available only
        </label>
        {userRole === 'admin' && <button onClick={() => navigate('/equipment/new')} style={{ float: 'right' }}>Add New Equipment</button>}
      </div>
      {reqSuccess && <p style={{ color: 'green' }}>{reqSuccess}</p>}
      {reqError && <p style={{ color: 'red' }}>{reqError}</p>}
      <table border="1" cellPadding="8" cellSpacing="0">
        <thead><tr><th>Name</th><th>Category</th><th>Condition</th><th>Total</th><th>Available</th>{userRole==='admin'?<th>Actions</th>:<th>Request</th>}</tr></thead>
        <tbody>
          {filtered.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.category}</td>
              <td>{item.cond}</td>
              <td>{item.total_quantity}</td>
              <td>{item.available_quantity}</td>
              {userRole === 'admin' ? (
                <td>
                  <button onClick={() => navigate(`/equipment/edit/${item.id}`, { state: { item } })}>Edit</button>{' '}
                  <button onClick={() => handleDelete(item.id)}>Delete</button>
                </td>
              ) : (
                <td>
                  <button disabled={item.available_quantity === 0} onClick={() => handleRequest(item.id)}>
                    {item.available_quantity > 0 ? 'Request' : 'Unavailable'}
                  </button>
                </td>
              )}
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan="6">No equipment found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default EquipmentListPage;
