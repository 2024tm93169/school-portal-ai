import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function NavBar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userName = localStorage.getItem('userName');
  const userRole = (localStorage.getItem('userRole') || '').trim().toLowerCase();


  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (!token) return null;

  return (
    <nav style={{ padding: '10px', background: '#eee', marginBottom: '20px' }}>
      <strong style={{ marginRight: '15px' }}>Equipment Lending Portal (Phase 2)</strong>
      <Link to="/" style={{ marginRight: '10px' }}>Equipment</Link>
      <Link to="/requests" style={{ marginRight: '10px' }}>{userRole === 'admin' ? 'Manage Requests' : 'My Requests'}</Link>
      {userRole === 'admin' && <Link to="/analytics" style={{ marginRight: '10px' }}>Analytics</Link>}
      <span style={{ float: 'right' }}>
        {userName && <span>Welcome, {userName} ({userRole}) | </span>}
        <button onClick={handleLogout}>Logout</button>
      </span>
    </nav>
  );
}

export default NavBar;
