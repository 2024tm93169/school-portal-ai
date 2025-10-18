import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Signup successful! You can now log in.');
        setTimeout(() => navigate('/login'), 1000);
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>Sign Up</h2>
      <form onSubmit={handleSignup}>
        <div>
          <label>Name:</label><br/>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label>Email:</label><br/>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Password:</label><br/>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <div>
          <label>Role:</label><br/>
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="student">Student</option>
            <option value="staff">Staff</option>
          </select>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {message && <p style={{ color: 'green' }}>{message}</p>}
        <button type="submit">Sign Up</button>
      </form>
      <p>Already have an account? <Link to="/login">Login here</Link></p>
    </div>
  );
}

export default RegisterPage;
