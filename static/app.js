/**
 * TASK PULSE - SPATIAL WEB SUITE APPLICATION SCRIPT
 * Features: Multi-Page SPA Navigation, Hamburger Drawer, Web Audio Sound Engine,
 * Dedicated Spatial Focus Page, Category/Priority Breakdown Analytics, Glyph Icons.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- SPA Navigation & Drawer DOM ---
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const closeDrawerBtn = document.getElementById('close-drawer-btn');
  const navDrawer = document.getElementById('nav-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const desktopNavBtns = document.querySelectorAll('.desktop-nav .nav-btn');
  const drawerNavBtns = document.querySelectorAll('.drawer-nav .drawer-nav-btn');
  const navToPageBtns = document.querySelectorAll('.nav-to-page');
  const brandHomeLink = document.querySelector('.nav-link-home');
  const appPages = document.querySelectorAll('.app-page');

  // --- Task Creator Form DOM ---
  const todoForm = document.getElementById('todo-form');
  const homeQuickForm = document.getElementById('home-quick-form');
  const homeTitleInput = document.getElementById('home-title-input');

  const todoTitleInput = document.getElementById('todo-title-input');
  const todoDescInput = document.getElementById('todo-desc-input');
  const todoCategoryInput = document.getElementById('todo-category-input');
  const todoDueDateInput = document.getElementById('todo-duedate-input');
  const toggleCreatorDetailsBtn = document.getElementById('toggle-creator-details');
  const creatorDetailsPanel = document.getElementById('creator-details-panel');

  const subtaskDraftInput = document.getElementById('subtask-draft-input');
  const addDraftSubtaskBtn = document.getElementById('add-draft-subtask-btn');
  const draftSubtasksList = document.getElementById('draft-subtasks-list');
  const aiGenerateSubtasksBtn = document.getElementById('ai-generate-subtasks-btn');

  // --- Lists & Controls DOM ---
  const todoListContainer = document.getElementById('todo-list');
  const homePreviewList = document.getElementById('home-preview-list');
  const emptyState = document.getElementById('empty-state');
  const loadingSpinner = document.getElementById('loading-spinner');

  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const statusFilters = document.getElementById('status-filters');
  const categoryFilterSelect = document.getElementById('category-filter-select');
  const clearCompletedBtn = document.getElementById('clear-completed-btn');

  const themeToggleBtn = document.getElementById('theme-toggle');
  const soundToggleBtn = document.getElementById('sound-toggle');
  const soundOnIcon = soundToggleBtn ? soundToggleBtn.querySelector('.sound-on-icon') : null;
  const soundOffIcon = soundToggleBtn ? soundToggleBtn.querySelector('.sound-off-icon') : null;
  const toastContainer = document.getElementById('toast-container');

  // --- Dedicated Focus Timer Page DOM ---
  const focusTimerDisplay = document.getElementById('focus-timer-display');
  const focusTimerStartBtn = document.getElementById('focus-timer-start-btn');
  const focusTimerPauseBtn = document.getElementById('focus-timer-pause-btn');
  const focusTimerResetBtn = document.getElementById('focus-timer-reset-btn');
  const focusTaskSelect = document.getElementById('focus-task-select');

  // --- State Variables ---
  let todos = [];
  let draftSubtasks = [];
  let activeStatusFilter = 'all';
  let activeCategoryFilter = 'all';
  let searchQuery = '';
  let soundEnabled = true;

  // Focus Timer State
  let timerInterval = null;
  let timerTotalSeconds = 1500; // 25 min
  let timerRemainingSeconds = 1500;
  let isTimerRunning = false;

  const API_BASE = '/api';

  // ==========================================
  // 1. PAGE NAVIGATION & DRAWER ENGINE
  // ==========================================
  function switchPage(targetPageId) {
    playPopSound();

    // Toggle active page view
    appPages.forEach(page => {
      if (page.id === targetPageId) {
        page.classList.add('active');
      } else {
        page.classList.remove('active');
      }
    });

    // Sync Desktop Nav Active State
    desktopNavBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === targetPageId);
    });

    // Sync Drawer Nav Active State
    drawerNavBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === targetPageId);
    });

    closeDrawer();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (targetPageId === 'page-focus') {
      populateFocusTaskSelector();
    }
  }

  function openDrawer() {
    navDrawer.classList.add('open');
    drawerBackdrop.classList.add('open');
    playPopSound();
  }

  function closeDrawer() {
    navDrawer.classList.remove('open');
    drawerBackdrop.classList.remove('open');
  }

  if (hamburgerBtn) hamburgerBtn.addEventListener('click', openDrawer);
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

  desktopNavBtns.forEach(btn => btn.addEventListener('click', () => switchPage(btn.dataset.page)));
  drawerNavBtns.forEach(btn => btn.addEventListener('click', () => switchPage(btn.dataset.page)));
  navToPageBtns.forEach(btn => btn.addEventListener('click', () => switchPage(btn.dataset.page)));
  if (brandHomeLink) brandHomeLink.addEventListener('click', () => switchPage('page-home'));

  // ==========================================
  // 2. SYNTHESIZED WEB AUDIO SOUND ENGINE
  // ==========================================
  let audioCtx = null;

  function initAudioCtx() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
  }

  function playTone(freq, duration, type = 'sine', gainVal = 0.15) {
    if (!soundEnabled) return;
    try {
      initAudioCtx();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.log('Audio playback error:', e);
    }
  }

  function playCompletionChime() {
    if (!soundEnabled) return;
    // Major triad arpeggio: C5 -> E5 -> G5
    setTimeout(() => playTone(523.25, 0.25, 'triangle', 0.2), 0);
    setTimeout(() => playTone(659.25, 0.25, 'triangle', 0.2), 120);
    setTimeout(() => playTone(783.99, 0.45, 'sine', 0.25), 240);
  }

  function playPopSound() {
    playTone(440, 0.08, 'sine', 0.15);
  }

  function playDeleteSound() {
    playTone(180, 0.15, 'sawtooth', 0.1);
  }

  function playTimerDoneBell() {
    setTimeout(() => playTone(880, 0.5, 'sine', 0.3), 0);
    setTimeout(() => playTone(1046.5, 0.6, 'sine', 0.3), 300);
  }

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      if (soundOnIcon && soundOffIcon) {
        soundOnIcon.classList.toggle('hidden', !soundEnabled);
        soundOffIcon.classList.toggle('hidden', soundEnabled);
      }
      showToast(soundEnabled ? 'Sound effects enabled' : 'Sound effects muted', 'info');
      if (soundEnabled) playPopSound();
    });
  }

  // ==========================================
  // 3. THEME ENGINE
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
    playPopSound();
    showToast(`Switched to ${newTheme} mode`, 'info');
  });

  // ==========================================
  // 4. CONFETTI CELEBRATION SYSTEM
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
    playCompletionChime();
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
  // 5. TOAST NOTIFICATION ENGINE (NO EMOJIS)
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
  // 6. SPATIAL FOCUS TIMER ENGINE
  // ==========================================
  function updateTimerDisplay() {
    const mins = Math.floor(timerRemainingSeconds / 60);
    const secs = timerRemainingSeconds % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (focusTimerDisplay) focusTimerDisplay.textContent = timeStr;
    const mainTimerDisplay = document.getElementById('timer-display');
    if (mainTimerDisplay) mainTimerDisplay.textContent = timeStr;
  }

  function startTimer() {
    if (isTimerRunning) return;
    initAudioCtx();
    isTimerRunning = true;

    if (focusTimerStartBtn) focusTimerStartBtn.classList.add('hidden');
    if (focusTimerPauseBtn) focusTimerPauseBtn.classList.remove('hidden');

    timerInterval = setInterval(() => {
      if (timerRemainingSeconds > 0) {
        timerRemainingSeconds--;
        updateTimerDisplay();
      } else {
        pauseTimer();
        playTimerDoneBell();
        triggerConfetti();
        showToast('Focus Session Complete! Outstanding momentum!', 'success');
      }
    }, 1000);
  }

  function pauseTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
    if (focusTimerStartBtn) focusTimerStartBtn.classList.remove('hidden');
    if (focusTimerPauseBtn) focusTimerPauseBtn.classList.add('hidden');
  }

  function resetTimer() {
    pauseTimer();
    timerRemainingSeconds = timerTotalSeconds;
    updateTimerDisplay();
  }

  if (focusTimerStartBtn) focusTimerStartBtn.addEventListener('click', () => { playPopSound(); startTimer(); });
  if (focusTimerPauseBtn) focusTimerPauseBtn.addEventListener('click', () => { playPopSound(); pauseTimer(); });
  if (focusTimerResetBtn) focusTimerResetBtn.addEventListener('click', () => { playPopSound(); resetTimer(); });

  document.querySelectorAll('.timer-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playPopSound();
      document.querySelectorAll('.timer-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      timerTotalSeconds = parseInt(btn.dataset.time, 10);
      resetTimer();
    });
  });

  function populateFocusTaskSelector() {
    if (!focusTaskSelect) return;
    focusTaskSelect.innerHTML = '<option value="">-- General Focus Session --</option>';
    todos.filter(t => !t.completed).forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `[${t.priority}] ${t.title}`;
      focusTaskSelect.appendChild(opt);
    });
  }

  // ==========================================
  // 7. API & DATA FETCHING
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
      renderHomePreviewList();
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
      updateAllStatsUI(stats);
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  }

  function updateAllStatsUI(stats) {
    const streak = stats.completed > 0 ? Math.min(stats.completed, 7) : 1;

    // Home Page Stats
    const homeTotal = document.getElementById('home-stat-total');
    const homePending = document.getElementById('home-stat-pending');
    const homeCompleted = document.getElementById('home-stat-completed');
    const homeRate = document.getElementById('home-stat-rate');
    const homeStreak = document.getElementById('home-streak-days');
    const homeCircle = document.getElementById('home-progress-bar-circle');
    const homeMsg = document.getElementById('home-productivity-message');

    if (homeTotal) homeTotal.textContent = stats.total;
    if (homePending) homePending.textContent = stats.pending;
    if (homeCompleted) homeCompleted.textContent = stats.completed;
    if (homeRate) homeRate.textContent = `${stats.completion_rate}%`;
    if (homeStreak) homeStreak.textContent = streak;

    const maxOffset = 264;
    const offset = maxOffset - (maxOffset * (stats.completion_rate / 100));
    if (homeCircle) homeCircle.style.strokeDashoffset = offset;

    if (homeMsg) {
      if (stats.total === 0) homeMsg.textContent = "Your list is empty! Add your first goal below.";
      else if (stats.completion_rate === 100) homeMsg.textContent = "Outstanding! You completed all your tasks!";
      else if (stats.completion_rate >= 50) homeMsg.textContent = "Great job! You are more than halfway through!";
      else homeMsg.textContent = "Keep momentum going! Completing tasks boosts your score.";
    }

    // Dashboard Stats
    const dashTotal = document.getElementById('dash-stat-total');
    const dashPending = document.getElementById('dash-stat-pending');
    const dashCompleted = document.getElementById('dash-stat-completed');
    const dashRate = document.getElementById('dash-stat-rate');
    const dashStreak = document.getElementById('dash-streak-days');
    const dashCircle = document.getElementById('dash-progress-bar-circle');

    if (dashTotal) dashTotal.textContent = stats.total;
    if (dashPending) dashPending.textContent = stats.pending;
    if (dashCompleted) dashCompleted.textContent = stats.completed;
    if (dashRate) dashRate.textContent = `${stats.completion_rate}%`;
    if (dashStreak) dashStreak.textContent = streak;
    if (dashCircle) dashCircle.style.strokeDashoffset = offset;

    renderBreakdownCharts(stats);
  }

  function renderBreakdownCharts(stats) {
    const catList = document.getElementById('category-breakdown-list');
    const prioList = document.getElementById('priority-breakdown-list');

    if (catList) {
      catList.innerHTML = '';
      const categories = stats.by_category || {};
      const maxCount = Math.max(...Object.values(categories), 1);

      Object.entries(categories).forEach(([cat, count]) => {
        const pct = Math.round((count / maxCount) * 100);
        const item = document.createElement('div');
        item.className = 'breakdown-item';
        item.innerHTML = `
          <div class="breakdown-label-row">
            <span>${escapeHtml(cat)}</span>
            <span>${count} task(s)</span>
          </div>
          <div class="breakdown-bar-bg">
            <div class="breakdown-bar-fill" style="width: ${pct}%"></div>
          </div>
        `;
        catList.appendChild(item);
      });
    }

    if (prioList) {
      prioList.innerHTML = '';
      const priorities = stats.by_priority || { High: 0, Medium: 0, Low: 0 };
      const maxPrio = Math.max(...Object.values(priorities), 1);

      Object.entries(priorities).forEach(([prio, count]) => {
        const pct = Math.round((count / maxPrio) * 100);
        const item = document.createElement('div');
        item.className = 'breakdown-item';
        item.innerHTML = `
          <div class="breakdown-label-row">
            <span><i class="fa-solid fa-flag"></i> ${prio} Priority</span>
            <span>${count}</span>
          </div>
          <div class="breakdown-bar-bg">
            <div class="breakdown-bar-fill" style="width: ${pct}%"></div>
          </div>
        `;
        prioList.appendChild(item);
      });
    }
  }

  function showLoading(isLoading) {
    if (isLoading) {
      if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    } else {
      if (loadingSpinner) loadingSpinner.classList.add('hidden');
    }
  }

  // ==========================================
  // 8. RENDER TODO CARDS & DRAG-AND-DROP
  // ==========================================
  function renderTodoList() {
    if (!todoListContainer) return;
    todoListContainer.innerHTML = '';

    const filtered = todos.filter(todo => {
      if (activeStatusFilter === 'active') return !todo.completed;
      if (activeStatusFilter === 'completed') return todo.completed;
      return true;
    });

    if (filtered.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    } else {
      if (emptyState) emptyState.classList.add('hidden');
    }

    filtered.forEach((todo, idx) => {
      const card = createTodoCardElement(todo, idx);
      todoListContainer.appendChild(card);
    });
  }

  function renderHomePreviewList() {
    if (!homePreviewList) return;
    homePreviewList.innerHTML = '';

    const activeOrPinned = todos.filter(t => t.pinned || !t.completed).slice(0, 4);

    if (activeOrPinned.length === 0) {
      homePreviewList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No active tasks right now. Create a new task above!</p>';
      return;
    }

    activeOrPinned.forEach((todo, idx) => {
      const card = createTodoCardElement(todo, idx);
      homePreviewList.appendChild(card);
    });
  }

  function createTodoCardElement(todo, index) {
    const card = document.createElement('div');
    card.className = `todo-card prio-${(todo.priority || 'medium').toLowerCase()} ${todo.completed ? 'completed' : ''}`;
    card.style.animationDelay = `${index * 0.05}s`;
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-id', todo.id);

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
              <button class="action-btn pin-btn ${todo.pinned ? 'active' : ''}" title="${todo.pinned ? 'Unpin task' : 'Pin task to top'}">
                <i class="fa-solid fa-thumbtack"></i>
              </button>
              <button class="action-btn delete-btn" title="Delete task">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>

          <div class="card-badges">
            ${todo.pinned ? `<span class="badge badge-pinned"><i class="fa-solid fa-thumbtack"></i> Pinned</span>` : ''}
            <span class="badge badge-cat">${escapeHtml(todo.category || 'Personal')}</span>
            <span class="badge badge-prio ${todo.priority}">${todo.priority || 'Medium'}</span>
            ${todo.due_date ? `<span class="badge badge-date"><i class="fa-regular fa-clock"></i> ${todo.due_date}</span>` : ''}
          </div>

          ${todo.description ? `<p class="card-description">${escapeHtml(todo.description)}</p>` : ''}
          ${subtasksHtml}
        </div>
      </div>
    `;

    const checkbox = card.querySelector(`#chk-${todo.id}`);
    checkbox.addEventListener('change', (e) => toggleTodoStatus(todo.id, e.clientX, e.clientY));

    const pinBtn = card.querySelector('.pin-btn');
    pinBtn.addEventListener('click', () => togglePinStatus(todo.id));

    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteTodoItem(todo.id));

    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('dragleave', handleDragLeave);
    card.addEventListener('drop', handleDrop);
    card.addEventListener('dragend', handleDragEnd);

    return card;
  }

  let draggedElement = null;

  function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (this !== draggedElement) {
      this.classList.add('drag-over');
    }
  }

  function handleDragLeave() {
    this.classList.remove('drag-over');
  }

  function handleDrop(e) {
    e.stopPropagation();
    this.classList.remove('drag-over');

    if (draggedElement && draggedElement !== this) {
      const container = this.parentNode;
      const allCards = Array.from(container.children);
      const draggedIdx = allCards.indexOf(draggedElement);
      const targetIdx = allCards.indexOf(this);

      if (draggedIdx < targetIdx) {
        container.insertBefore(draggedElement, this.nextSibling);
      } else {
        container.insertBefore(draggedElement, this);
      }
      playPopSound();
    }
  }

  function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.todo-card').forEach(c => c.classList.remove('drag-over'));
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  // ==========================================
  // 9. FORM & AI SUBTASK GENERATOR
  // ==========================================
  if (toggleCreatorDetailsBtn) {
    toggleCreatorDetailsBtn.addEventListener('click', () => {
      creatorDetailsPanel.classList.toggle('collapsed');
      toggleCreatorDetailsBtn.classList.toggle('active');
      playPopSound();
    });
  }

  if (addDraftSubtaskBtn) addDraftSubtaskBtn.addEventListener('click', addDraftSubtask);
  if (subtaskDraftInput) {
    subtaskDraftInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addDraftSubtask();
      }
    });
  }

  function addDraftSubtask() {
    const text = subtaskDraftInput.value.trim();
    if (!text) return;

    draftSubtasks.push({ id: Date.now().toString(), title: text, completed: false });
    subtaskDraftInput.value = '';
    playPopSound();
    renderDraftSubtasks();
  }

  function renderDraftSubtasks() {
    if (!draftSubtasksList) return;
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
    playPopSound();
    renderDraftSubtasks();
  };

  if (aiGenerateSubtasksBtn) {
    aiGenerateSubtasksBtn.addEventListener('click', async () => {
      const title = todoTitleInput.value.trim();
      if (!title) {
        showToast('Please type a task title first to generate AI subtasks!', 'info');
        todoTitleInput.focus();
        return;
      }

      playPopSound();
      aiGenerateSubtasksBtn.disabled = true;
      aiGenerateSubtasksBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';

      try {
        const response = await fetch(`${API_BASE}/ai/suggest-subtasks?title=${encodeURIComponent(title)}`);
        if (!response.ok) throw new Error('AI suggestion failed');
        const data = await response.json();

        if (data.suggestions && data.suggestions.length > 0) {
          draftSubtasks = data.suggestions.map((st, i) => ({
            id: (Date.now() + i).toString(),
            title: st,
            completed: false
          }));
          renderDraftSubtasks();
          showToast(`Generated ${data.suggestions.length} smart subtask steps!`, 'success');
        }
      } catch (err) {
        console.error(err);
        showToast('Could not auto-generate subtasks', 'info');
      } finally {
        aiGenerateSubtasksBtn.disabled = false;
        aiGenerateSubtasksBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> AI Smart Breakdown';
      }
    });
  }

  // Task Creation Submission
  if (todoForm) {
    todoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitNewTask(todoTitleInput.value.trim(), todoDescInput.value.trim(), todoCategoryInput.value, todoDueDateInput.value);
      todoTitleInput.value = '';
      todoDescInput.value = '';
      todoDueDateInput.value = '';
      draftSubtasks = [];
      renderDraftSubtasks();
    });
  }

  if (homeQuickForm) {
    homeQuickForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = homeTitleInput.value.trim();
      if (!title) return;
      await submitNewTask(title, '', 'Personal', '');
      homeTitleInput.value = '';
    });
  }

  async function submitNewTask(title, description, category, due_date) {
    const selectedPriority = document.querySelector('input[name="priority"]:checked')?.value || 'Medium';

    const payload = {
      title,
      description,
      category,
      priority: selectedPriority,
      due_date,
      completed: false,
      pinned: false,
      subtasks: draftSubtasks
    };

    try {
      const response = await fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to create task');

      playPopSound();
      showToast('New task added successfully!', 'success');
      fetchTodos();
    } catch (err) {
      console.error(err);
      showToast('Could not create task', 'info');
    }
  }

  // ==========================================
  // 10. TASK ACTIONS (TOGGLE, PIN, SUBTASK, DELETE)
  // ==========================================
  async function toggleTodoStatus(id, clickX, clickY) {
    try {
      const response = await fetch(`${API_BASE}/todos/${id}/toggle`, { method: 'PATCH' });
      if (!response.ok) throw new Error('Failed to toggle task');
      const updated = await response.json();

      if (updated.completed) {
        triggerConfetti(clickX, clickY);
        showToast('Task completed! Outstanding work!', 'success');
      } else {
        playPopSound();
      }

      fetchTodos();
    } catch (err) {
      console.error(err);
    }
  }

  async function togglePinStatus(id) {
    try {
      const response = await fetch(`${API_BASE}/todos/${id}/pin`, { method: 'PATCH' });
      if (!response.ok) throw new Error('Failed to pin task');
      const updated = await response.json();
      playPopSound();
      showToast(updated.pinned ? 'Task pinned to top' : 'Task unpinned', 'info');
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
    playPopSound();

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
      playDeleteSound();
      showToast('Task removed', 'info');
      fetchTodos();
    } catch (err) {
      console.error(err);
    }
  }

  if (clearCompletedBtn) {
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
  }

  // ==========================================
  // 11. FILTERS & SEARCH CONTROLS
  // ==========================================
  if (statusFilters) {
    statusFilters.addEventListener('click', (e) => {
      if (!e.target.classList.contains('filter-tab')) return;

      statusFilters.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeStatusFilter = e.target.dataset.filter;
      playPopSound();
      renderTodoList();
    });
  }

  if (categoryFilterSelect) {
    categoryFilterSelect.addEventListener('change', (e) => {
      activeCategoryFilter = e.target.value;
      playPopSound();
      fetchTodos();
    });
  }

  let searchTimeout = null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      if (searchQuery) {
        if (clearSearchBtn) clearSearchBtn.classList.remove('hidden');
      } else {
        if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
      }

      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        fetchTodos();
      }, 300);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.classList.add('hidden');
      playPopSound();
      fetchTodos();
    });
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================
  initTheme();
  fetchTodos();
});
