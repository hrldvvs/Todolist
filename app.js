const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Configuration
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'todo_app',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Initialize Database
async function initializeDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                task_text VARCHAR(255) NOT NULL,
                is_completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL
            )
        `);
        console.log('Database initialized');
    } catch (err) {
        console.error('Database initialization failed:', err);
        process.exit(1);
    }
}

// Routes
app.get('/api/tasks', async (req, res) => {
    try {
        const [tasks] = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const { task_text } = req.body;
        if (!task_text) return res.status(400).json({ error: 'Task text is required' });

        const [result] = await pool.query(
            'INSERT INTO tasks (task_text) VALUES (?)',
            [task_text]
        );
        
        const [task] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
        res.status(201).json(task[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

app.put('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { task_text, is_completed } = req.body;

        await pool.query(
            'UPDATE tasks SET task_text = ?, is_completed = ?, completed_at = ? WHERE id = ?',
            [task_text, is_completed, is_completed ? new Date() : null, id]
        );

        const [task] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
        res.json(task[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// Start Server
initializeDB().then(() => {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
});