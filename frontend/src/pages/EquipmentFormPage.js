import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

function EquipmentFormPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { id } = useParams();
  const editing = Boolean(id);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [cond, setCond] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editing) {
      if (state && state.item) {
        const item = state.item;
        setName(item.name); setCategory(item.category); setCond(item.cond); setTotalQuantity(item.total_quantity);
      } else {
        fetch('/api/equipment').then(res => res.json()).then(data => {
          const item = data.find(it => it.id === Number(id));
          if (item) {
            setName(item.name); setCategory(item.category); setCond(item.cond); setTotalQuantity(item.total_quantity);
          }
        }).catch(() => {});
      }
    }
  }, [editing, id, state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
    const payload = { name, category, cond, total_quantity: Number(totalQuantity) };
    try {
      let res;
      if (editing) {
        res = await fetch('/api/equipment/' + id, { method: 'PUT', headers, body: JSON.stringify(payload) });
      } else {
        res = await fetch('/api/equipment', { method: 'POST', headers, body: JSON.stringify(payload) });
      }
      const data = await res.json();
      if (res.ok) navigate('/');
      else setError(data.error || 'Save failed');
    } catch (err) { setError('Network error'); }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '20px auto' }}>
      <h2>{editing ? 'Edit Equipment' : 'Add New Equipment'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label><br/>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label>Category:</label><br/>
          <input type="text" value={category} onChange={e => setCategory(e.target.value)} required />
        </div>
        <div>
          <label>Condition:</label><br/>
          <input type="text" value={cond} onChange={e => setCond(e.target.value)} required />
        </div>
        <div>
          <label>Total Quantity:</label><br/>
          <input type="number" min="1" value={totalQuantity} onChange={e => setTotalQuantity(e.target.value)} required />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">{editing ? 'Save Changes' : 'Add Equipment'}</button>
        <button type="button" onClick={() => navigate('/')}>Cancel</button>
      </form>
    </div>
  );
}

export default EquipmentFormPage;
