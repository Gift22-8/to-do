// Personal Productivity Application
// Core Modules: Safe Storage, Task CRUD, Productivity Dashboard, Search/Filter/Sort,
// Dark/Light Theme System, Personal Features (Verse of the Day, Food Notes, Daily Reflection)

// ============================================================================
// 1. DOM Elements
// ============================================================================

// --- Theme Switcher ---
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');

// --- Dashboard Elements ---
const statTotal = document.getElementById('statTotal');
const statPending = document.getElementById('statPending');
const statCompleted = document.getElementById('statCompleted');
const statOverdue = document.getElementById('statOverdue');
const statPercentage = document.getElementById('statPercentage');
const progressBarFill = document.getElementById('progressBarFill');

// --- Task Form & Controls ---
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskCategory = document.getElementById('taskCategory');
const taskPriority = document.getElementById('taskPriority');
const taskDueDate = document.getElementById('taskDueDate');
const taskFormFeedback = document.getElementById('taskFormFeedback');
const taskList = document.getElementById('taskList');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const clearAllBtn = document.getElementById('clearAllBtn');

// --- Search, Filter & Sort Elements ---
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const filterStatus = document.getElementById('filterStatus');
const filterCategory = document.getElementById('filterCategory');
const filterPriority = document.getElementById('filterPriority');
const sortBy = document.getElementById('sortBy');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');

// --- Edit Task Modal ---
const editModal = document.getElementById('editModal');
const editModalBackdrop = document.getElementById('editModalBackdrop');
const closeEditModalBtn = document.getElementById('closeEditModalBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editTaskForm = document.getElementById('editTaskForm');
const editTaskId = document.getElementById('editTaskId');
const editTaskInput = document.getElementById('editTaskInput');
const editTaskCategory = document.getElementById('editTaskCategory');
const editTaskPriority = document.getElementById('editTaskPriority');
const editTaskDueDate = document.getElementById('editTaskDueDate');
const editFormFeedback = document.getElementById('editFormFeedback');

// --- Verse of the Day ---
const verseInput = document.getElementById('verseInput');
const saveVerseBtn = document.getElementById('saveVerseBtn');
const verseContainer = document.getElementById('verseContainer');

// --- Food / Routine Notes ---
const foodInput = document.getElementById('foodInput');
const foodList = document.getElementById('foodList');
const foodForm = document.getElementById('foodForm');

// --- Daily Reflection ---
const dailyReflection = document.getElementById('dailyReflection');

// --- Toast Notification ---
const toastNotification = document.getElementById('toastNotification');

// ============================================================================
// 2. Storage Keys & State
// ============================================================================

const TASKS_KEY = 'prod-tasks-v1';
const TASKS_BACKUP_KEY = 'prod-tasks-v1-backup';
const THEME_KEY = 'prod-theme-v1';
const VERSE_KEY = 'prod-verse-v2';
const FOOD_KEY = 'prod-food-v2';
const REFLECT_KEY = 'prod-reflect-v1';

// Canonical application state
let tasks = [];
let verses = [];
let foods = [];
let toastTimeoutId = null;

// Search and filter state (kept strictly separate from tasks data)
const filterState = {
    search: '',
    status: 'all',
    category: 'all',
    priority: 'all',
    sortBy: 'newest'
};

// ============================================================================
// 3. Utility & Helper Functions
// ============================================================================

/**
 * Display a temporary feedback toast to the user.
 * @param {string} message - Text to display
 * @param {'info'|'success'|'error'} type - Style modifier
 */
function showToast(message, type = 'info') {
    if (!toastNotification) return;
    toastNotification.textContent = message;
    toastNotification.className = `toast toast-${type} toast-visible`;
    toastNotification.hidden = false;

    if (toastTimeoutId) clearTimeout(toastTimeoutId);
    toastTimeoutId = setTimeout(() => {
        toastNotification.className = 'toast';
        toastNotification.hidden = true;
    }, 3000);
}

/**
 * Display validation error messages in the form feedback container.
 * @param {HTMLElement} element - Feedback container element
 * @param {string} message - Error message
 */
function setFormFeedback(element, message = '') {
    if (element) {
        element.textContent = message;
    }
}

/**
 * Check if a task is overdue based on local date (YYYY-MM-DD).
 * A task is overdue only if it is NOT completed and due date is strictly before today.
 * @param {string} dueDate - 'YYYY-MM-DD'
 * @param {boolean} completed
 * @returns {boolean}
 */
function isTaskOverdue(dueDate, completed) {
    if (completed || !dueDate) return false;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    return dueDate < todayStr;
}

/**
 * Formats a YYYY-MM-DD string into a friendly, readable date (e.g. "Oct 26, 2026").
 * @param {string} dateStr
 * @returns {string}
 */
function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    try {
        const [year, month, day] = dateStr.split('-');
        if (!year || !month || !day) return dateStr;
        const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
        return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        return dateStr;
    }
}

// ============================================================================
// 4. Safe Storage & Backward-Compatible Migration
// ============================================================================

/**
 * Normalizes an individual task object to ensure all required fields exist.
 * Preserves legacy 'text' or 'title', 'id', and 'completed' state.
 * @param {Object} rawItem - Raw object from storage
 * @returns {Object|null}
 */
function normalizeTask(rawItem) {
    if (!rawItem || typeof rawItem !== 'object') return null;

    const validPriorities = ['low', 'medium', 'high'];
    const validCategories = ['Personal', 'University', 'Work', 'Health'];

    const id = typeof rawItem.id === 'number' ? rawItem.id : Date.now() + Math.floor(Math.random() * 1000);
    const text = String(rawItem.text || rawItem.title || '').trim();
    const completed = Boolean(rawItem.completed);
    const priority = validPriorities.includes(rawItem.priority) ? rawItem.priority : 'medium';
    const category = validCategories.includes(rawItem.category) ? rawItem.category : 'Personal';
    const dueDate = typeof rawItem.dueDate === 'string' ? rawItem.dueDate : '';
    const createdAt = typeof rawItem.createdAt === 'number' ? rawItem.createdAt : (typeof rawItem.id === 'number' ? rawItem.id : Date.now());

    if (!text) return null;

    return {
        id,
        text,
        completed,
        priority,
        category,
        dueDate,
        createdAt
    };
}

/**
 * Loads tasks with pre-migration backup and error tolerance.
 */
function loadTasks() {
    try {
        const raw = localStorage.getItem(TASKS_KEY);
        if (!raw) {
            tasks = [];
            return;
        }

        // Safeguard: Create a backup copy before any mutation if backup doesn't exist yet
        if (!localStorage.getItem(TASKS_BACKUP_KEY)) {
            try {
                localStorage.setItem(TASKS_BACKUP_KEY, raw);
            } catch (backupErr) {
                console.warn('Could not create storage backup:', backupErr);
            }
        }

        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            tasks = parsed.map(normalizeTask).filter(Boolean);
        } else {
            console.warn('Stored tasks data is not an array. Initializing empty list.');
            tasks = [];
        }
    } catch (err) {
        console.error('Error parsing tasks from localStorage. Preserving stored data untouched.', err);
        tasks = [];
    }
}

/**
 * Saves tasks to localStorage.
 */
function saveTasks() {
    try {
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (err) {
        console.error('Failed to save tasks to localStorage:', err);
        showToast('Error saving data to browser storage', 'error');
    }
}

// ============================================================================
// 5. Productivity Dashboard Calculations
// ============================================================================

/**
 * Calculates current productivity statistics from canonical task array.
 * Pure function: Does not mutate the tasks array.
 * @param {Array} taskList
 * @returns {Object}
 */
function calculateTaskStats(taskList) {
    const total = taskList.length;
    const completed = taskList.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = taskList.filter(t => isTaskOverdue(t.dueDate, t.completed)).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, overdue, percentage };
}

/**
 * Updates the dashboard UI with calculated statistics.
 */
function updateDashboardStats() {
    const stats = calculateTaskStats(tasks);

    if (statTotal) statTotal.textContent = String(stats.total);
    if (statPending) statPending.textContent = String(stats.pending);
    if (statCompleted) statCompleted.textContent = String(stats.completed);
    if (statOverdue) statOverdue.textContent = String(stats.overdue);
    if (statPercentage) statPercentage.textContent = `${stats.percentage}%`;

    if (progressBarFill) {
        progressBarFill.style.width = `${stats.percentage}%`;
        const container = progressBarFill.parentElement;
        if (container) {
            container.setAttribute('aria-valuenow', String(stats.percentage));
        }
    }
}

// ============================================================================
// 6. Search, Filter & Sort Engine
// ============================================================================

/**
 * Returns a filtered and sorted shallow copy of the task array.
 * Pure function: Canonical tasks array is never mutated.
 * @param {Array} taskList
 * @param {Object} state
 * @returns {Array}
 */
function getFilteredTasks(taskList, state) {
    let result = [...taskList];

    // 1. Text Search (title search)
    if (state.search) {
        const query = state.search.toLowerCase();
        result = result.filter(t => t.text.toLowerCase().includes(query));
    }

    // 2. Status Filter
    if (state.status === 'pending') {
        result = result.filter(t => !t.completed);
    } else if (state.status === 'completed') {
        result = result.filter(t => t.completed);
    } else if (state.status === 'overdue') {
        result = result.filter(t => isTaskOverdue(t.dueDate, t.completed));
    }

    // 3. Category Filter
    if (state.category !== 'all') {
        result = result.filter(t => t.category === state.category);
    }

    // 4. Priority Filter
    if (state.priority !== 'all') {
        result = result.filter(t => t.priority === state.priority);
    }

    // 5. Sorting
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    result.sort((a, b) => {
        if (state.sortBy === 'dueDate') {
            if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            return 0;
        }
        if (state.sortBy === 'priority') {
            const weightDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
            if (weightDiff !== 0) return weightDiff;
            return (b.createdAt || b.id) - (a.createdAt || a.id);
        }
        if (state.sortBy === 'alphabetical') {
            return a.text.localeCompare(b.text, undefined, { sensitivity: 'base' });
        }
        // Default: 'newest'
        return (b.createdAt || b.id) - (a.createdAt || a.id);
    });

    return result;
}

/**
 * Resets all filter controls and search inputs to default values.
 */
function resetFilters() {
    filterState.search = '';
    filterState.status = 'all';
    filterState.category = 'all';
    filterState.priority = 'all';
    filterState.sortBy = 'newest';

    if (searchInput) searchInput.value = '';
    if (clearSearchBtn) clearSearchBtn.hidden = true;
    if (filterStatus) filterStatus.value = 'all';
    if (filterCategory) filterCategory.value = 'all';
    if (filterPriority) filterPriority.value = 'all';
    if (sortBy) sortBy.value = 'newest';

    renderTasks();
}

// ============================================================================
// 7. Task CRUD Handlers
// ============================================================================

/**
 * Add a new task from the main task form.
 */
function addTask() {
    setFormFeedback(taskFormFeedback, '');
    const title = taskInput.value.trim();

    if (!title) {
        setFormFeedback(taskFormFeedback, 'Please enter a task title.');
        taskInput.focus();
        return;
    }

    if (title.length > 150) {
        setFormFeedback(taskFormFeedback, 'Task title cannot exceed 150 characters.');
        return;
    }

    const newTask = {
        id: Date.now(),
        text: title,
        completed: false,
        category: taskCategory.value || 'Personal',
        priority: taskPriority.value || 'medium',
        dueDate: taskDueDate.value || '',
        createdAt: Date.now()
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();

    // Reset form inputs
    taskInput.value = '';
    taskDueDate.value = '';
    taskPriority.value = 'medium';
    taskCategory.value = 'Personal';

    showToast('Task added successfully!', 'success');
}

/**
 * Toggle task completion status.
 * @param {number} id
 */
function toggleTaskCompletion(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
}

/**
 * Delete a single task after confirmation.
 * @param {number} id
 */
function deleteTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const confirmed = confirm(`Are you sure you want to delete "${task.text}"?`);
    if (!confirmed) return;

    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    showToast('Task deleted.', 'info');
}

/**
 * Opens the Edit Task Modal pre-populated with the task's existing data.
 * @param {Object} task
 */
function openEditModal(task) {
    if (!task) return;
    setFormFeedback(editFormFeedback, '');

    editTaskId.value = String(task.id);
    editTaskInput.value = task.text;
    editTaskCategory.value = task.category || 'Personal';
    editTaskPriority.value = task.priority || 'medium';
    editTaskDueDate.value = task.dueDate || '';

    editModal.hidden = false;
    editTaskInput.focus();
}

/**
 * Closes the Edit Task Modal.
 */
function closeEditModal() {
    editModal.hidden = true;
    setFormFeedback(editFormFeedback, '');
}

/**
 * Saves changes from the Edit Modal back to the original task object.
 * Strictly preserves task ID, completion status, and creation timestamp.
 */
function saveTaskEdit() {
    setFormFeedback(editFormFeedback, '');
    const id = Number(editTaskId.value);
    const updatedTitle = editTaskInput.value.trim();

    if (!updatedTitle) {
        setFormFeedback(editFormFeedback, 'Task title cannot be empty.');
        editTaskInput.focus();
        return;
    }

    if (updatedTitle.length > 150) {
        setFormFeedback(editFormFeedback, 'Task title cannot exceed 150 characters.');
        return;
    }

    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
        setFormFeedback(editFormFeedback, 'Task not found.');
        return;
    }

    // Preserve original ID, completed state, and createdAt
    tasks[taskIndex].text = updatedTitle;
    tasks[taskIndex].category = editTaskCategory.value;
    tasks[taskIndex].priority = editTaskPriority.value;
    tasks[taskIndex].dueDate = editTaskDueDate.value;

    saveTasks();
    renderTasks();
    closeEditModal();
    showToast('Task updated successfully!', 'success');
}

/**
 * Clears all completed tasks after confirmation.
 */
function clearCompleted() {
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) {
        showToast('No completed tasks to clear.', 'info');
        return;
    }

    const confirmed = confirm(`Clear all ${completedTasks.length} completed task(s)?`);
    if (!confirmed) return;

    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
    showToast(`Cleared ${completedTasks.length} completed task(s).`, 'success');
}

/**
 * Clears all tasks after confirmation (preserves original feature).
 */
function clearAllTasks() {
    if (tasks.length === 0) {
        showToast('No tasks to clear.', 'info');
        return;
    }

    const confirmed = confirm(`Clear all ${tasks.length} task(s)? This action cannot be undone.`);
    if (!confirmed) return;

    tasks = [];
    saveTasks();
    renderTasks();
    showToast('All tasks cleared.', 'info');
}

// ============================================================================
// 8. Task Rendering
// ============================================================================

/**
 * Creates a DOM task item with complete badges, edit button, and delete button.
 * Uses safe textContent to prevent HTML injection vulnerabilities.
 * @param {Object} task
 * @returns {HTMLLIElement}
 */
function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item${task.completed ? ' completed' : ''}`;
    li.dataset.id = String(task.id);

    // Checkbox for completed status
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!task.completed;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'pending' : 'complete'}`);
    checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));

    // Main content container
    const mainDiv = document.createElement('div');
    mainDiv.className = 'task-main';

    // Title / text
    const textSpan = document.createElement('span');
    textSpan.className = 'task-text';
    textSpan.textContent = task.text;

    // Badges container
    const badgesDiv = document.createElement('div');
    badgesDiv.className = 'task-badges';

    // Category badge
    if (task.category) {
        const catBadge = document.createElement('span');
        catBadge.className = 'badge badge-category';
        catBadge.innerHTML = `<i class="fa-solid fa-folder"></i> ${task.category}`;
        badgesDiv.appendChild(catBadge);
    }

    // Priority badge
    if (task.priority) {
        const prioBadge = document.createElement('span');
        prioBadge.className = `badge badge-priority-${task.priority}`;
        prioBadge.innerHTML = `<i class="fa-solid fa-flag"></i> ${task.priority}`;
        badgesDiv.appendChild(prioBadge);
    }

    // Due Date badge & overdue check
    if (task.dueDate) {
        const overdue = isTaskOverdue(task.dueDate, task.completed);
        const dueBadge = document.createElement('span');
        dueBadge.className = `badge badge-due${overdue ? ' badge-overdue' : ''}`;
        const displayDate = formatDisplayDate(task.dueDate);
        dueBadge.innerHTML = overdue
            ? `<i class="fa-solid fa-triangle-exclamation"></i> Overdue (${displayDate})`
            : `<i class="fa-solid fa-calendar-day"></i> ${displayDate}`;
        badgesDiv.appendChild(dueBadge);
    }

    mainDiv.appendChild(textSpan);
    mainDiv.appendChild(badgesDiv);

    // Actions container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'action-btn edit-btn';
    editBtn.title = 'Edit task';
    editBtn.setAttribute('aria-label', `Edit "${task.text}"`);
    editBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
    editBtn.addEventListener('click', () => openEditModal(task));

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'action-btn delete-btn';
    delBtn.title = 'Delete task';
    delBtn.setAttribute('aria-label', `Delete "${task.text}"`);
    delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    delBtn.addEventListener('click', () => deleteTask(task.id));

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(delBtn);

    li.appendChild(checkbox);
    li.appendChild(mainDiv);
    li.appendChild(actionsDiv);

    return li;
}

/**
 * Render tasks into the DOM using active search, filter, and sorting state.
 * Also keeps dashboard statistics updated.
 */
function renderTasks() {
    updateDashboardStats();
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.className = 'empty-task-state';
        emptyLi.innerHTML = `
            <i class="fa-solid fa-clipboard-check"></i>
            <p>No tasks yet. Add one above to get started!</p>
        `;
        taskList.appendChild(emptyLi);
        return;
    }

    const visibleTasks = getFilteredTasks(tasks, filterState);

    if (visibleTasks.length === 0) {
        const noMatchLi = document.createElement('li');
        noMatchLi.className = 'empty-task-state';
        noMatchLi.innerHTML = `
            <i class="fa-solid fa-filter-circle-xmark"></i>
            <p>No tasks match your current filters.</p>
        `;
        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Reset Filters';
        resetBtn.addEventListener('click', resetFilters);
        noMatchLi.appendChild(resetBtn);
        taskList.appendChild(noMatchLi);
        return;
    }

    visibleTasks.forEach(task => {
        taskList.appendChild(createTaskElement(task));
    });
}

// ============================================================================
// 9. Personal Features: Verse, Food, Daily Reflection (Preserved Intact)
// ============================================================================

// --- Generic List Handler for Food / Routine Items ---
function createFoodListItem(item, listArray, saveCallback, renderCallback) {
    const li = document.createElement('li');
    li.className = 'checklist-item' + (item.completed ? ' completed' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!item.completed;
    checkbox.addEventListener('change', () => {
        item.completed = checkbox.checked;
        saveCallback();
        renderCallback();
    });

    const text = document.createElement('span');
    text.textContent = item.text;
    text.addEventListener('click', () => {
        item.completed = !item.completed;
        saveCallback();
        renderCallback();
    });

    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.innerHTML = '<i class="fa-solid fa-trash"></i>';
    del.title = 'Delete item';
    del.addEventListener('click', () => {
        const index = listArray.findIndex(t => t.id === item.id);
        if (index > -1) listArray.splice(index, 1);
        saveCallback();
        renderCallback();
    });

    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(del);
    return li;
}

// --- Verses ---
function loadVerses() {
    try {
        const raw = localStorage.getItem(VERSE_KEY);
        verses = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(verses)) verses = [];
    } catch (err) {
        console.warn('Could not parse verses from localStorage:', err);
        verses = [];
    }
}

function saveVerses() {
    try {
        localStorage.setItem(VERSE_KEY, JSON.stringify(verses));
    } catch (err) {
        console.error('Failed to save verses:', err);
    }
}

function renderVerses() {
    verseContainer.innerHTML = '';
    if (verses.length === 0) {
        const p = document.createElement('p');
        p.className = 'verse-display';
        p.textContent = 'No verse yet.';
        verseContainer.appendChild(p);
        return;
    }

    verses.forEach(verse => {
        const p = document.createElement('p');
        p.className = 'verse-display';
        p.textContent = verse.text;
        p.title = 'Click to remove';
        p.style.cursor = 'pointer';
        p.addEventListener('click', () => {
            verses = verses.filter(v => v.id !== verse.id);
            saveVerses();
            renderVerses();
            showToast('Verse removed.', 'info');
        });
        verseContainer.appendChild(p);
    });
}

function addVerse() {
    const value = verseInput.value.trim();
    if (!value) return;
    verses.push({ id: Date.now(), text: value });
    verseInput.value = '';
    saveVerses();
    renderVerses();
    showToast('Verse saved!', 'success');
}

// --- Food / Routine Notes ---
function loadFoods() {
    try {
        const raw = localStorage.getItem(FOOD_KEY);
        foods = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(foods)) foods = [];
    } catch (err) {
        console.warn('Could not parse foods from localStorage:', err);
        foods = [];
    }
}

function saveFoods() {
    try {
        localStorage.setItem(FOOD_KEY, JSON.stringify(foods));
    } catch (err) {
        console.error('Failed to save food notes:', err);
    }
}

function renderFoods() {
    foodList.innerHTML = '';
    foods.forEach(food => {
        foodList.appendChild(createFoodListItem(food, foods, saveFoods, renderFoods));
    });
}

function addFood() {
    const value = foodInput.value.trim();
    if (!value) return;
    foods.push({ id: Date.now(), text: value, completed: false });
    foodInput.value = '';
    saveFoods();
    renderFoods();
    showToast('Food/routine item added!', 'success');
}

// --- Daily Reflection ---
function loadReflection() {
    try {
        dailyReflection.value = localStorage.getItem(REFLECT_KEY) || '';
    } catch (err) {
        console.warn('Could not load reflection from localStorage:', err);
        dailyReflection.value = '';
    }
}

function saveReflection() {
    try {
        localStorage.setItem(REFLECT_KEY, dailyReflection.value);
    } catch (err) {
        console.error('Failed to save reflection:', err);
    }
}

// ============================================================================
// 10. Theme Management (Light / Dark)
// ============================================================================

/**
 * Applies the selected theme to the document and updates toggle icon.
 * @param {'dark'|'light'} theme
 */
function applyTheme(theme) {
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        if (themeIcon) {
            themeIcon.className = 'fa-solid fa-moon';
        }
        if (themeToggleBtn) {
            themeToggleBtn.setAttribute('title', 'Switch to dark theme');
            themeToggleBtn.setAttribute('aria-label', 'Switch to dark theme');
        }
    } else {
        document.documentElement.removeAttribute('data-theme');
        if (themeIcon) {
            themeIcon.className = 'fa-solid fa-sun';
        }
        if (themeToggleBtn) {
            themeToggleBtn.setAttribute('title', 'Switch to light theme');
            themeToggleBtn.setAttribute('aria-label', 'Switch to light theme');
        }
    }
}

/**
 * Toggles theme and persists choice in localStorage.
 */
function toggleTheme() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const newTheme = isLight ? 'dark' : 'light';

    try {
        localStorage.setItem(THEME_KEY, newTheme);
    } catch (err) {
        console.warn('Could not save theme preference:', err);
    }

    applyTheme(newTheme);
    showToast(`Switched to ${newTheme} theme`, 'info');
}

/**
 * Loads saved theme preference from storage on start.
 */
function loadTheme() {
    try {
        const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
        applyTheme(savedTheme);
    } catch (err) {
        applyTheme('dark');
    }
}

// ============================================================================
// 11. Event Listeners & Keyboard Accessibility
// ============================================================================

// --- Theme Toggle ---
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
}

// --- Main Task Form ---
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask();
});

clearCompletedBtn.addEventListener('click', clearCompleted);
clearAllBtn.addEventListener('click', clearAllTasks);

taskInput.addEventListener('input', () => {
    if (taskFormFeedback.textContent) {
        setFormFeedback(taskFormFeedback, '');
    }
});

// --- Search, Filter & Sort Events ---
if (searchInput) {
    searchInput.addEventListener('input', () => {
        filterState.search = searchInput.value.trim();
        if (clearSearchBtn) {
            clearSearchBtn.hidden = !searchInput.value;
        }
        renderTasks();
    });
}

if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.hidden = true;
        filterState.search = '';
        searchInput.focus();
        renderTasks();
    });
}

if (filterStatus) {
    filterStatus.addEventListener('change', () => {
        filterState.status = filterStatus.value;
        renderTasks();
    });
}

if (filterCategory) {
    filterCategory.addEventListener('change', () => {
        filterState.category = filterCategory.value;
        renderTasks();
    });
}

if (filterPriority) {
    filterPriority.addEventListener('change', () => {
        filterState.priority = filterPriority.value;
        renderTasks();
    });
}

if (sortBy) {
    sortBy.addEventListener('change', () => {
        filterState.sortBy = sortBy.value;
        renderTasks();
    });
}

if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', resetFilters);
}

// --- Edit Modal Events ---
editTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveTaskEdit();
});

closeEditModalBtn.addEventListener('click', closeEditModal);
cancelEditBtn.addEventListener('click', closeEditModal);
editModalBackdrop.addEventListener('click', closeEditModal);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !editModal.hidden) {
        closeEditModal();
    }
});

editTaskInput.addEventListener('input', () => {
    if (editFormFeedback.textContent) {
        setFormFeedback(editFormFeedback, '');
    }
});

// --- Personal Features Events ---
saveVerseBtn.addEventListener('click', addVerse);
foodForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addFood();
});
dailyReflection.addEventListener('input', saveReflection);

// ============================================================================
// 12. Application Initialization
// ============================================================================

/**
 * Updates the header greeting and date display based on local time.
 */
function updateGreetingAndDate() {
    const greetingEl = document.getElementById('greetingText');
    const dateEl = document.getElementById('currentDateDisplay');

    const now = new Date();
    const hours = now.getHours();
    let greeting = 'Welcome back';
    if (hours < 12) greeting = 'Good morning';
    else if (hours < 18) greeting = 'Good afternoon';
    else greeting = 'Good evening';

    if (greetingEl) greetingEl.textContent = greeting;
    if (dateEl) {
        dateEl.textContent = now.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
    }
}

function initializeApp() {
    loadTheme();
    updateGreetingAndDate();
    loadTasks();
    loadVerses();
    loadFoods();
    loadReflection();

    renderTasks();
    renderVerses();
    renderFoods();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
