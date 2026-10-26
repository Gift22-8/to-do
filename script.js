// Personal Productivity Application
// Core Modules: Safe Storage, Task CRUD, Verse of the Day, Food Notes, Daily Reflection

// ============================================================================
// 1. DOM Elements
// ============================================================================

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
const VERSE_KEY = 'prod-verse-v2';
const FOOD_KEY = 'prod-food-v2';
const REFLECT_KEY = 'prod-reflect-v1';

let tasks = [];
let verses = [];
let foods = [];
let toastTimeoutId = null;

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

    // Fallback: don't store completely empty tasks
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
// 5. Task CRUD Handlers
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
// 6. Task Rendering
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
 * Render all tasks into the DOM.
 */
function renderTasks() {
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.className = 'task-item';
        emptyLi.style.justifyContent = 'center';
        emptyLi.style.color = 'var(--muted)';
        emptyLi.style.padding = '24px 16px';
        emptyLi.textContent = 'No tasks yet. Add one above to get started!';
        taskList.appendChild(emptyLi);
        return;
    }

    tasks.forEach(task => {
        taskList.appendChild(createTaskElement(task));
    });
}

// ============================================================================
// 7. Personal Features: Verse, Food, Daily Reflection (Preserved Intact)
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
// 8. Event Listeners & Keyboard Accessibility
// ============================================================================

// --- Main Task Form ---
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask();
});

clearCompletedBtn.addEventListener('click', clearCompleted);
clearAllBtn.addEventListener('click', clearAllTasks);

// Clear form validation feedback on input
taskInput.addEventListener('input', () => {
    if (taskFormFeedback.textContent) {
        setFormFeedback(taskFormFeedback, '');
    }
});

// --- Edit Modal Events ---
editTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveTaskEdit();
});

closeEditModalBtn.addEventListener('click', closeEditModal);
cancelEditBtn.addEventListener('click', closeEditModal);
editModalBackdrop.addEventListener('click', closeEditModal);

// Close modal on Escape key press
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
// 9. Application Initialization
// ============================================================================

function initializeApp() {
    loadTasks();
    loadVerses();
    loadFoods();
    loadReflection();

    renderTasks();
    renderVerses();
    renderFoods();
}

// Run when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
