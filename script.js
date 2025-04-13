class TaskManager {
    constructor() {
        this.taskList = document.getElementById('taskList');
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTask');
        
        this.initEventListeners();
        this.loadTasks();
    }

    initEventListeners() {
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
    }

    async loadTasks() {
        try {
            const response = await fetch('/api/tasks');
            if (!response.ok) throw new Error('Failed to load tasks');
            const tasks = await response.json();
            
            this.taskList.innerHTML = '';
            tasks.forEach(task => this.renderTask(task));
        } catch (error) {
            console.error('Error:', error);
            alert('Error loading tasks. See console for details.');
        }
    }

    async addTask() {
        const taskText = this.taskInput.value.trim();
        if (!taskText) return;

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ task_text: taskText })
            });
            
            if (!response.ok) throw new Error('Failed to add task');
            this.taskInput.value = '';
            this.loadTasks();
        } catch (error) {
            console.error('Error:', error);
            alert('Error adding task. See console for details.');
        }
    }

    async updateTask(taskId, newText, isCompleted) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    task_text: newText,
                    is_completed: isCompleted
                })
            });
            if (!response.ok) throw new Error('Failed to update task');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            alert('Error updating task. See console for details.');
            throw error;
        }
    }

    async deleteTask(taskId) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete task');
            this.loadTasks();
        } catch (error) {
            console.error('Error:', error);
            alert('Error deleting task. See console for details.');
        }
    }

    renderTask(task) {
        const li = document.createElement('li');
        li.dataset.id = task.id;
        if (task.is_completed) li.classList.add('completed');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.is_completed;
        checkbox.addEventListener('change', (e) => {
            const span = li.querySelector('span');
            this.updateTask(task.id, span.textContent, e.target.checked)
                .then(() => li.classList.toggle('completed'));
        });

        const span = document.createElement('span');
        span.textContent = task.task_text;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task-actions';

        const updateBtn = document.createElement('button');
        updateBtn.className = 'update-btn';
        updateBtn.textContent = 'Update';
        updateBtn.addEventListener('click', () => {
            const newText = prompt('Update your task:', task.task_text);
            if (newText !== null && newText.trim() !== '') {
                this.updateTask(task.id, newText.trim(), checkbox.checked)
                    .then(() => {
                        span.textContent = newText.trim();
                        task.task_text = newText.trim();
                    });
            }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

        actionsDiv.append(updateBtn, deleteBtn);
        li.append(checkbox, span, actionsDiv);
        this.taskList.appendChild(li);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});