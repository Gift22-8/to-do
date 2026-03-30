// Personal Productivity app (beginner-friendly)
// Handles: Verse of the Day, To-Do list, Food Notes, Daily Reflection

// --- DOM elements ---
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const taskForm = document.getElementById('taskForm');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const clearAllBtn = document.getElementById('clearAllBtn');

const verseInput = document.getElementById('verseInput');
const saveVerseBtn = document.getElementById('saveVerseBtn');
const verseContainer = document.getElementById('verseContainer');

const foodInput = document.getElementById('foodInput');
const foodList = document.getElementById('foodList');
const foodForm = document.getElementById('foodForm');

const dailyReflection = document.getElementById('dailyReflection');

// --- Storage keys ---
const TASKS_KEY = 'prod-tasks-v1';
const VERSE_KEY = 'prod-verse-v2'; // Bumped version to avoid parsing crash on old text data
const FOOD_KEY = 'prod-food-v2';
const REFLECT_KEY = 'prod-reflect-v1';

// --- Data ---
let tasks = [];
let verses = [];
let foods = [];

// --- Generic List Handlers ---
function createListItem(item, listArray, saveCallback, renderCallback, baseClass = 'task-item') {
    const li = document.createElement('li');
    li.className = baseClass + (item.completed ? ' completed' : '');

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

// --- Tasks: load / save / render ---
function loadTasks() {
    const raw = localStorage.getItem(TASKS_KEY);
    tasks = raw ? JSON.parse(raw) : [];
}

function saveTasks() {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach(task => {
        taskList.appendChild(createListItem(task, tasks, saveTasks, renderTasks));
    });
}

function addTask() {
    const value = taskInput.value.trim();
    if (!value) return;
    tasks.push({ id: Date.now(), text: value, completed: false });
    taskInput.value = '';
    saveTasks();
    renderTasks();
}

function clearCompleted() {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
}

function clearAllTasks() {
    if (!confirm('Clear all tasks?')) return;
    tasks = [];
    saveTasks();
    renderTasks();
}

// --- Verses: load / save / render ---
function loadVerses() {
    const raw = localStorage.getItem(VERSE_KEY);
    verses = raw ? JSON.parse(raw) : [];
}

function saveVerses() {
    localStorage.setItem(VERSE_KEY, JSON.stringify(verses));
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
        
        // Allow removing a verse by clicking on it
        p.title = "Click to remove";
        p.style.cursor = "pointer";
        p.addEventListener('click', () => {
            verses = verses.filter(v => v.id !== verse.id);
            saveVerses();
            renderVerses();
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
}

// --- Food: load / save / render ---
function loadFoods() {
    const raw = localStorage.getItem(FOOD_KEY);
    foods = raw ? JSON.parse(raw) : [];
}

function saveFoods() {
    localStorage.setItem(FOOD_KEY, JSON.stringify(foods));
}

function renderFoods() {
    foodList.innerHTML = '';
    foods.forEach(food => {
        foodList.appendChild(createListItem(food, foods, saveFoods, renderFoods, 'checklist-item'));
    });
}

function addFood() {
    const value = foodInput.value.trim();
    if (!value) return;
    foods.push({ id: Date.now(), text: value, completed: false });
    foodInput.value = '';
    saveFoods();
    renderFoods();
}

// --- Daily Reflection ---
function loadReflection() {
    dailyReflection.value = localStorage.getItem(REFLECT_KEY) || '';
}

function saveReflection() {
    localStorage.setItem(REFLECT_KEY, dailyReflection.value);
}

// --- Event wiring ---
taskForm.addEventListener('submit', (e) => { e.preventDefault(); addTask(); });
clearCompletedBtn.addEventListener('click', clearCompleted);
clearAllBtn.addEventListener('click', clearAllTasks);

saveVerseBtn.addEventListener('click', addVerse);

foodForm.addEventListener('submit', (e) => { e.preventDefault(); addFood(); });

dailyReflection.addEventListener('input', saveReflection);

// --- Initialize ---
loadTasks();
loadVerses();
loadFoods();
loadReflection();

renderTasks();
renderVerses();
renderFoods();
