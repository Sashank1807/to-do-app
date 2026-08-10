/**
 * TASK PULSE - FRONTEND APPLICATION SCRIPT
 * Manages API requests, DOM updates, micro-animations, theme toggles, and confetti effects.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const todoForm = document.getElementById('todo-form');
  const todoTitleInput = document.getElementById('todo-title-input');
  const todoDescInput = document.getElementById('todo-desc-input');
  const todoCategoryInput = document.getElementById('todo-category-input');
  const todoDueDateInput = document.getElementById('todo-duedate-input');
  const toggleCreatorDetailsBtn = document.getElementById('toggle-creator-details');
  const creatorDetailsPanel = document.getElementById('creator-details-panel');

  const subtaskDraftInput = document.getElementById('subtask-draft-input');
  const addDraftSubtaskBtn = document.getElementById('add-draft-subtask-btn');
  const draftSubtasksList = document.getElementById('draft-subtasks-list');

  const todoListContainer = document.getElementById('todo-list');
  const emptyState = document.getElementById('empty-state');
  const loadingSpinner = document.getElementById('loading-spinner');

  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const statusFilters = document.getElementById('status-filters');
  const categoryFilterSelect = document.getElementById('category-filter-select');
  const clearCompletedBtn = document.getElementById('clear-completed-btn');

  const themeToggleBtn = document.getElementById('theme-toggle');
  const toastContainer = document.getElementById('toast-container');

  // Stats DOM
  const statTotal = document.getElementById('stat-total');
  const statPending = document.getElementById('stat-pending');
  const statCompleted = document.getElementById('stat-completed');
  const statRate = document.getElementById('stat-rate');
  const progressBarCircle = document.getElementById('progress-bar-circle');
  const productivityMessage = document.getElementById('productivity-message');

  // --- State Variables ---
  let todos = [];
  let draftSubtasks = [];
  let activeStatusFilter = 'all';
  let activeCategoryFilter = 'all';
  let searchQuery = '';

  // --- API Endpoint Base ---
  const API_BASE = '/api';

  // ==========================================
  // 1. THEME ENGINE
  // ==========================================
  function initTheme() {
    const savedTheme = localStorage.getItem('taskpulse_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('taskpulse_theme', newTheme);
    showToast(`Switched to ${newTheme} mode`, 'info');
  });

  // ==========================================
  // 2. CONFETTI CELEBRATION SYSTEM
  // ==========================================
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 8 + 4;
      this.color = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'][Math.floor(Math.random() * 5)];
      this.vx = (Math.random() - 0.5) * 12;
      this.vy = (Math.random() - 0.8) * 14;
      this.gravity = 0.4;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = (Math.random() - 0.5) * 10;
      this.alpha = 1;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.rotation += this.rotationSpeed;
      this.alpha -= 0.015;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      ctx.restore();
    }
  }

  function triggerConfetti(originX, originY) {
    const startX = originX || window.innerWidth / 2;
    const startY = originY || window.innerHeight / 2;

    for (let i = 0; i < 60; i++) {
      particles.push(new Particle(startX, startY));
    }
  }

  function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, index) => {
      p.update();
      p.draw();
      if (p.alpha <= 0) particles.splice(index, 1);
    });
    requestAnimationFrame(animateConfetti);
  }
  animateConfetti();

  // ==========================================
  // 3. TOAST NOTIFICATION ENGINE
  // ==========================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconClass = type === 'success' ? 'fa-circle-check' : 'fa-circle-info';
    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // ==========================================
  // 4. API & DATA FETCHING
  // ==========================================
  async function fetchTodos() {
    showLoading(true);
    try {
      let url = `${API_BASE}/todos?`;
      if (activeCategoryFilter !== 'all') url += `category=${encodeURIComponent(activeCategoryFilter)}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      todos = await response.json();
      
      renderTodoList();
      fetchStats();
    } catch (err) {
      console.error(err);
      showToast('Error loading tasks from backend', 'info');
    } finally {
      showLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      if (!response.ok) return;
      const stats = await response.json();
      updateStatsUI(stats);
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  }

  function updateStatsUI(stats) {
    statTotal.textContent = stats.total;
    statPending.textContent = stats.pending;
    statCompleted.textContent = stats.completed;
    statRate.textContent = `${stats.completion_rate}%`;

    // SVG stroke offset calculation (circle perimeter = 2 * PI * 42 ≈ 264)
    const maxOffset = 264;
    const offset = maxOffset - (maxOffset * (stats.completion_rate / 100));
    progressBarCircle.style.strokeDashoffset = offset;

    // Motivational message
    if (stats.total === 0) {
      productivityMessage.textContent = "Your list is empty! Add your first goal below.";
    } else if (stats.completion_rate === 100) {
      productivityMessage.textContent = "🎉 Outstanding! You completed all your tasks!";
    } else if (stats.completion_rate >= 50) {
      productivityMessage.textContent = "🔥 Great job! You are more than halfway through!";
    } else {
      productivityMessage.textContent = "Keep momentum going! Completing tasks boosts your score.";
    }
  }

  function showLoading(isLoading) {
    if (isLoading) {
      loadingSpinner.classList.remove('hidden');
    } else {
      loadingSpinner.classList.add('hidden');
    }
  }

  // ==========================================
  // 5. RENDER TODO CARDS
  // ==========================================
  function renderTodoList() {
    todoListContainer.innerHTML = '';

    // Apply status filter locally if needed
    const filtered = todos.filter(todo => {
      if (activeStatusFilter === 'active') return !todo.completed;
      if (activeStatusFilter === 'completed') return todo.completed;
      return true;
    });

    if (filtered.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    } else {
      emptyState.classList.add('hidden');
    }

    filtered.forEach((todo, idx) => {
      const card = createTodoCardElement(todo, idx);
      todoListContainer.appendChild(card);
    });
  }

  function createTodoCardElement(todo, index) {
    const card = document.createElement('div');
    card.className = `todo-card prio-${(todo.priority || 'medium').toLowerCase()} ${todo.completed ? 'completed' : ''}`;
    card.style.animationDelay = `${index * 0.05}s`;

    // Subtasks HTML
    let subtasksHtml = '';
    if (todo.subtasks && todo.subtasks.length > 0) {
      subtasksHtml = `
        <div class="card-subtasks">
          ${todo.subtasks.map((st, i) => `
            <div class="subtask-item ${st.completed ? 'done' : ''}" data-st-index="${i}">
              <input type="checkbox" ${st.completed ? 'checked' : ''} onchange="window.handleSubtaskToggle(${todo.id}, ${i}, this.checked)">
              <span>${escapeHtml(st.title)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-top-row">
        <div class="checkbox-wrapper">
          <input type="checkbox" id="chk-${todo.id}" ${todo.completed ? 'checked' : ''}>
          <label for="chk-${todo.id}" class="custom-checkbox">
            <i class="fa-solid fa-check"></i>
          </label>
        </div>

        <div class="card-content">
          <div class="card-title-row">
            <h4 class="card-title">${escapeHtml(todo.title)}</h4>
            <div class="card-actions">
              <button class="action-btn delete-btn" title="Delete task">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>

          <div class="card-badges">
            <span class="badge badge-cat">${escapeHtml(todo.category || 'Personal')}</span>
            <span class="badge badge-prio ${todo.priority}">${todo.priority || 'Medium'}</span>
            ${todo.due_date ? `<span class="badge badge-date"><i class="fa-regular fa-clock"></i> ${todo.due_date}</span>` : ''}
          </div>

          ${todo.description ? `<p class="card-description">${escapeHtml(todo.description)}</p>` : ''}
          ${subtasksHtml}
        </div>
      </div>
    `;

    // Event listeners
    const checkbox = card.querySelector(`#chk-${todo.id}`);
    checkbox.addEventListener('change', (e) => toggleTodoStatus(todo.id, e.clientX, e.clientY));

    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteTodoItem(todo.id));

    return card;
  }

  // Helper escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  // ==========================================
  // 6. FORM & SUBTASK DRAFT LOGIC
  // ==========================================
  toggleCreatorDetailsBtn.addEventListener('click', () => {
    creatorDetailsPanel.classList.toggle('collapsed');
    toggleCreatorDetailsBtn.classList.toggle('active');
  });

  addDraftSubtaskBtn.addEventListener('click', addDraftSubtask);
  subtaskDraftInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDraftSubtask();
    }
  });

  function addDraftSubtask() {
    const text = subtaskDraftInput.value.trim();
    if (!text) return;

    draftSubtasks.push({ id: Date.now().toString(), title: text, completed: false });
    subtaskDraftInput.value = '';
    renderDraftSubtasks();
  }

  function renderDraftSubtasks() {
    draftSubtasksList.innerHTML = '';
    draftSubtasks.forEach((st, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${escapeHtml(st.title)}</span>
        <button type="button" onclick="window.removeDraftSubtask(${idx})"><i class="fa-solid fa-xmark"></i></button>
      `;
      draftSubtasksList.appendChild(li);
    });
  }

  window.removeDraftSubtask = function(idx) {
    draftSubtasks.splice(idx, 1);
    renderDraftSubtasks();
  };

  todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = todoTitleInput.value.trim();
    if (!title) return;

    const description = todoDescInput.value.trim();
    const category = todoCategoryInput.value;
    const due_date = todoDueDateInput.value;
    const selectedPriority = document.querySelector('input[name="priority"]:checked')?.value || 'Medium';

    const payload = {
      title,
      description,
      category,
      priority: selectedPriority,
      due_date,
      completed: false,
      subtasks: draftSubtasks
    };

    try {
      const response = await fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to create task');

      todoTitleInput.value = '';
      todoDescInput.value = '';
      todoDueDateInput.value = '';
      draftSubtasks = [];
      renderDraftSubtasks();

      showToast('New task added successfully!', 'success');
      fetchTodos();
    } catch (err) {
      console.error(err);
      showToast('Could not create task', 'info');
    }
  });

  // ==========================================
  // 7. TASK ACTIONS (TOGGLE, SUBTASK, DELETE)
  // ==========================================
  async function toggleTodoStatus(id, clickX, clickY) {
    try {
      const response = await fetch(`${API_BASE}/todos/${id}/toggle`, { method: 'PATCH' });
      if (!response.ok) throw new Error('Failed to toggle task');
      const updated = await response.json();

      if (updated.completed) {
        triggerConfetti(clickX, clickY);
        showToast('Task completed! Great job! 🎉', 'success');
      }

      fetchTodos();
    } catch (err) {
      console.error(err);
    }
  }

  window.handleSubtaskToggle = async function(todoId, subtaskIdx, isCompleted) {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    const updatedSubtasks = [...todo.subtasks];
    updatedSubtasks[subtaskIdx].completed = isCompleted;

    try {
      await fetch(`${API_BASE}/todos/${todoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtasks: updatedSubtasks })
      });
      fetchTodos();
    } catch (err) {
      console.error(err);
    }
  };

  async function deleteTodoItem(id) {
    try {
      const response = await fetch(`${API_BASE}/todos/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete task');
      showToast('Task removed', 'info');
      fetchTodos();
    } catch (err) {
      console.error(err);
    }
  }

  clearCompletedBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to remove all completed tasks?')) return;

    try {
      const response = await fetch(`${API_BASE}/todos/action/clear-completed`, { method: 'DELETE' });
      const data = await response.json();
      showToast(`Cleared ${data.cleared} finished task(s)`, 'success');
      triggerConfetti();
      fetchTodos();
    } catch (err) {
      console.error(err);
    }
  });

  // ==========================================
  // 8. FILTERS & SEARCH CONTROLS
  // ==========================================
  statusFilters.addEventListener('click', (e) => {
    if (!e.target.classList.contains('filter-tab')) return;

    statusFilters.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    activeStatusFilter = e.target.dataset.filter;
    renderTodoList();
  });

  categoryFilterSelect.addEventListener('change', (e) => {
    activeCategoryFilter = e.target.value;
    fetchTodos();
  });

  let searchTimeout = null;
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    if (searchQuery) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      fetchTodos();
    }, 300);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    fetchTodos();
  });

  // ==========================================
  // INITIALIZATION
  // ==========================================
  initTheme();
  fetchTodos();
});
