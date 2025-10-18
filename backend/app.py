import sqlite3
from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
DATABASE = 'equipment_lending_phase2.db'

def get_db():
    """Connect to SQLite DB and enable foreign keys."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    """Create tables and seed admin."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        token TEXT
    )""")
    cur.execute("""CREATE TABLE IF NOT EXISTS equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT,
        cond TEXT,
        total_quantity INTEGER NOT NULL,
        available_quantity INTEGER NOT NULL
    )""")
    cur.execute("""CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        status TEXT,
        request_date TEXT,
        approve_date TEXT,
        return_date TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(item_id) REFERENCES equipment(id)
    )""")
    conn.commit()
    cur.execute("SELECT id FROM users WHERE email=?", ('[REDACTED_EMAIL_ADDRESS_1]',))
    if cur.fetchone() is None:
        hashed = generate_password_hash('admin')
        cur.execute("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                    ('Admin User', '[REDACTED_EMAIL_ADDRESS_1]', hashed, 'admin'))
        conn.commit()
    conn.close()

init_db()

def authenticate():
    """Get user row for bearer token if present and valid."""
    auth_header = request.headers.get('Authorization', '')
    token = auth_header.split(' ', 1)[1] if auth_header.startswith('Bearer ') else None
    if not token:
        return None
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, name, email, role FROM users WHERE token=?", (token,))
    user = cur.fetchone()
    conn.close()
    return user

@app.route('/api/signup', methods=['POST'])
def signup():
    """Register new student/staff user."""
    data = request.get_json() or {}
    name = data.get('name'); email = data.get('email'); password = data.get('password')
    role = data.get('role', 'student')
    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required'}), 400
    conn = get_db()
    cur = conn.cursor()
    try:
        hashed = generate_password_hash(password)
        cur.execute("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                    (name, email, hashed, role))
        conn.commit()
        uid = cur.lastrowid
        conn.close()
        return jsonify({'message': 'Signup successful', 'user_id': uid}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Email already registered'}), 409

@app.route('/api/login', methods=['POST'])
def login():
    """Authenticate and return token + user payload."""
    data = request.get_json() or {}
    email = data.get('email'); password = data.get('password')
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, name, email, role, password FROM users WHERE email=?", (email,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Invalid credentials'}), 401
    user = dict(row)
    if not check_password_hash(user['password'], password):
        conn.close()
        return jsonify({'error': 'Invalid credentials'}), 401
    import uuid
    token = str(uuid.uuid4())
    cur.execute("UPDATE users SET token=? WHERE id=?", (token, user['id']))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Login successful', 'token': token,
                    'user': {'id': user['id'], 'name': user['name'], 'email': user['email'], 'role': user['role']}})

@app.route('/api/equipment', methods=['GET'])
def list_equipment():
    """List all equipment."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM equipment")
    rows = cur.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/equipment', methods=['POST'])
def add_equipment():
    """Create equipment (admin)."""
    user = authenticate()
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json() or {}
    name = data.get('name'); category = data.get('category'); cond = data.get('cond')
    total = data.get('total_quantity')
    if not name or total is None:
        return jsonify({'error': 'Missing required fields'}), 400
    try:
        total = int(total)
    except:
        return jsonify({'error': 'Total quantity must be a number'}), 400
    if total < 0:
        return jsonify({'error': 'Total quantity cannot be negative'}), 400
    avail = total
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO equipment (name, category, cond, total_quantity, available_quantity) VALUES (?, ?, ?, ?, ?)",
                (name, category, cond, total, avail))
    conn.commit()
    eid = cur.lastrowid
    conn.close()
    return jsonify({'message': 'Equipment added', 'equipment_id': eid}), 201

@app.route('/api/equipment/<int:item_id>', methods=['PUT'])
def update_equipment(item_id):
    """Update equipment (admin)."""
    user = authenticate()
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json() or {}
    fields = []; values = []
    if 'total_quantity' in data:
        try:
            new_total = int(data['total_quantity'])
        except:
            return jsonify({'error': 'Total quantity must be a number'}), 400
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT total_quantity, available_quantity FROM equipment WHERE id=?", (item_id,))
        rec = cur.fetchone()
        if not rec:
            conn.close()
            return jsonify({'error': 'Item not found'}), 404
        old_total = rec['total_quantity']; old_avail = rec['available_quantity']
        diff = new_total - old_total
        new_avail = old_avail + diff
        if new_avail < 0:
            new_avail = 0
        fields.extend(["total_quantity=?", "available_quantity=?"])
        values.extend([new_total, new_avail])
        conn.close()
    for field in ['name', 'category', 'cond']:
        if field in data:
            fields.append(f"{field}=?"); values.append(data[field])
    if not fields:
        return jsonify({'error': 'No fields to update'}), 400
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE equipment SET " + ", ".join(fields) + " WHERE id=?", (*values, item_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Equipment updated'})

@app.route('/api/equipment/<int:item_id>', methods=['DELETE'])
def delete_equipment(item_id):
    """Delete equipment (admin)."""
    user = authenticate()
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM equipment WHERE id=?", (item_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Equipment deleted'})

@app.route('/api/requests', methods=['POST'])
def create_request():
    """Create borrow request (student/staff)."""
    user = authenticate()
    if not user or user['role'] not in ['student', 'staff']:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json() or {}
    item_id = data.get('item_id')
    if not item_id:
        return jsonify({'error': 'Item ID required'}), 400
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT available_quantity FROM equipment WHERE id=?", (item_id,))
    item = cur.fetchone()
    if not item:
        conn.close()
        return jsonify({'error': 'Item not found'}), 404
    if item['available_quantity'] <= 0:
        conn.close()
        return jsonify({'error': 'Item not available'}), 400
    now = __import__('datetime').datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cur.execute("INSERT INTO requests (user_id, item_id, status, request_date) VALUES (?, ?, ?, ?)", (user['id'], item_id, 'PENDING', now))
    conn.commit()
    rid = cur.lastrowid
    conn.close()
    return jsonify({'message': 'Request submitted', 'request_id': rid}), 201

@app.route('/api/requests', methods=['GET'])
def get_requests():
    """List requests for user/admin."""
    user = authenticate()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db()
    cur = conn.cursor()
    if user['role'] == 'admin':
        cur.execute("""SELECT r.id, r.status, r.request_date, r.approve_date, r.return_date,
                              u.name as user_name, u.email as user_email,
                              e.name as item_name
                       FROM requests r
                       JOIN users u ON r.user_id = u.id
                       JOIN equipment e ON r.item_id = e.id""")
    else:
        cur.execute("""SELECT r.id, r.status, r.request_date, r.approve_date, r.return_date,
                              e.name as item_name
                       FROM requests r
                       JOIN equipment e ON r.item_id = e.id
                       WHERE r.user_id = ?""", (user['id'],))
    rows = cur.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

def update_request_status(req_id, new_status):
    """Internal helper for APPROVED/REJECTED/RETURNED transitions."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM requests WHERE id=?", (req_id,))
    req = cur.fetchone()
    if not req:
        conn.close()
        return None, {'error': 'Request not found'}
    req = dict(req)
    if new_status == 'APPROVED':
        if req['status'] != 'PENDING':
            conn.close()
            return None, {'error': 'Request already processed'}
        cur.execute("SELECT available_quantity FROM equipment WHERE id=?", (req['item_id'],))
        itm = cur.fetchone()
        if itm and itm['available_quantity'] <= 0:
            conn.close()
            return None, {'error': 'Item not available'}
        approve_date = __import__('datetime').datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cur.execute("UPDATE requests SET status=?, approve_date=? WHERE id=?", (new_status, approve_date, req_id))
        cur.execute("UPDATE equipment SET available_quantity = available_quantity - 1 WHERE id=?", (req['item_id'],))
        conn.commit(); conn.close(); return new_status, None
    elif new_status == 'REJECTED':
        if req['status'] != 'PENDING':
            conn.close()
            return None, {'error': 'Request already processed'}
        cur.execute("UPDATE requests SET status=? WHERE id=?", (new_status, req_id))
        conn.commit(); conn.close(); return new_status, None
    elif new_status == 'RETURNED':
        if req['status'] != 'APPROVED':
            conn.close()
            return None, {'error': 'Return not applicable'}
        return_date = __import__('datetime').datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cur.execute("UPDATE requests SET status=?, return_date=? WHERE id=?", (new_status, return_date, req_id))
        cur.execute("UPDATE equipment SET available_quantity = available_quantity + 1 WHERE id=?", (req['item_id'],))
        conn.commit(); conn.close(); return new_status, None
    else:
        conn.close(); return None, {'error': 'Invalid status'}

@app.route('/api/requests/<int:req_id>/approve', methods=['POST'])
def approve_request(req_id):
    """Approve pending (admin)."""
    user = authenticate()
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    status, err = update_request_status(req_id, 'APPROVED')
    if not status:
        return jsonify(err), 400
    return jsonify({'message': 'Request approved'})

@app.route('/api/requests/<int:req_id>/reject', methods=['POST'])
def reject_request(req_id):
    """Reject pending (admin)."""
    user = authenticate()
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    status, err = update_request_status(req_id, 'REJECTED')
    if not status:
        return jsonify(err), 400
    return jsonify({'message': 'Request rejected'})

@app.route('/api/requests/<int:req_id>/return', methods=['POST'])
def return_request(req_id):
    """Mark approved as returned (admin)."""
    user = authenticate()
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    status, err = update_request_status(req_id, 'RETURNED')
    if not status:
        return jsonify(err), 400
    return jsonify({'message': 'Marked as returned'})

@app.route('/api/analytics', methods=['GET'])
def analytics():
    """Summary stats (admin)."""
    user = authenticate()
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM equipment"); total_equip = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM users WHERE role != 'admin'"); total_users = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM requests"); total_requests = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM requests WHERE status='APPROVED'"); active_loans = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM requests WHERE status='PENDING'"); pending_requests = cur.fetchone()[0]
    cur.execute("SELECT e.name, COUNT(r.id) as cnt FROM requests r JOIN equipment e ON r.item_id = e.id GROUP BY r.item_id ORDER BY cnt DESC LIMIT 1")
    top = cur.fetchone(); top_item = top['name'] if top else None
    stats = {'total_equipment': total_equip,'total_users': total_users,'total_requests': total_requests,
             'active_loans': active_loans,'pending_requests': pending_requests,'most_requested_item': top_item}
    conn.close(); return jsonify(stats)

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=False)