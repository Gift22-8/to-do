# Bloom | Grow a little every day

A calm, responsive, client-side personal productivity application built with semantic **HTML5**, modern **CSS3**, and modular **vanilla JavaScript (ES6)**.

Bloom features a distinctive, minimalist dark interface (with an intentional complementary light theme), an under-stated daily progress tracker, multi-dimensional search and filtering, priority tags, due date tracking with overdue alerts, habit checklists, personal reflection journals, and persistent browser storage.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Actual Features](#actual-features)
3. [Technologies Used](#technologies-used)
4. [Running the Application Locally](#running-the-application-locally)
5. [How localStorage is Used](#how-localstorage-is-used)
6. [Project Structure](#project-structure)
7. [Known Limitations](#known-limitations)
8. [Possible Future Improvements](#possible-future-improvements)

---

## Project Overview

The **Personal Productivity Dashboard** is designed for students, freelancers, and professionals who need an organized way to track daily tasks, routine checklists, and personal reflections in a single place without relying on heavy third-party frameworks or external backend databases.

The application operates locally inside any modern browser, guaranteeing fast load times, zero telemetry, and complete data privacy.

---

## Actual Features

### 1. Task Management (CRUD)
* **Add Tasks**: Create tasks with a title (up to 150 characters), category, priority level, and an optional due date.
* **Input Validation**: Rejects empty or whitespace-only task entries with inline validation feedback.
* **Edit in Place**: An accessible modal dialog enables updating task titles, categories, priorities, and due dates while preserving task creation timestamps, completion state, and unique IDs.
* **Completion Toggle**: Click the task checkbox to mark items as completed or pending.
* **Destructive Action Confirmation**: Deleting an individual task or bulk-clearing completed tasks requires explicit confirmation to prevent accidental data loss.

### 2. Task Categorization & Priority
* **Categories**: Organize tasks into `Personal`, `University`, `Work`, or `Health`.
* **Priorities**: Assign `Low`, `Medium`, or `High` priority with dedicated color-coded badges.
* **Due Dates & Overdue Alerts**: Set due dates using the native HTML5 date picker. Tasks past their due date that remain incomplete are flagged with an **Overdue** warning badge.

### 3. Productivity Dashboard
* **Dynamic Overview**: Displays real-time counters for **Total Tasks**, **Pending Tasks**, **Completed Tasks**, and **Overdue Tasks**.
* **Visual Progress Bar**: Shows the percentage of completed tasks with an animated gradient progress bar.
* **Pure Computations**: All statistics are calculated directly from active task state rather than manually maintained counters.

### 4. Search, Filtering, and Sorting
* **Instant Search**: Case-insensitive text search matching task titles in real time with a quick-clear button.
* **Status Filter**: Filter tasks by `All`, `Pending`, `Completed`, or `Overdue`.
* **Category Filter**: Filter tasks by `Personal`, `University`, `Work`, or `Health`.
* **Priority Filter**: Filter tasks by `High`, `Medium`, or `Low`.
* **Sorting Options**: Sort tasks by `Newest Added`, `Due Date (Earliest First)`, `Priority (High to Low)`, or `Alphabetical (A - Z)`.
* **Filter Reset**: One-click reset restoring default view.
* **Non-Destructive**: Filtering and sorting operate on a cloned presentation array, ensuring the master list in storage is never corrupted or reordered accidentally.

### 5. Dual Theme (Dark & Light)
* **Dark Slate Theme**: Default modern dark palette (`#0f172a`) with subtle radial gradients.
* **Clean Light Theme**: High-contrast, clean light palette (`#f8fafc`) adhering to accessibility standards.
* **Theme Persistence**: Selected theme is saved to browser storage and restored on reload.

### 6. Personal Features
* **Verse of the Day**: Save personal inspirations or quotes; click any verse to remove it.
* **Food & Routine Notes**: Track daily habits, meals, or routine checklists.
* **Daily Reflection**: A self-saving journal area that updates storage automatically on typing.

---

## Technologies Used

* **HTML5**: Semantic elements (`<header>`, `<main>`, `<section>`, `<dialog>` equivalents, form controls, ARIA live regions).
* **CSS3**: Custom CSS variables, CSS Grid, Flexbox, responsive media queries, and smooth transitions.
* **JavaScript (ES6)**: Vanilla DOM manipulation, Array methods (`map`, `filter`, `sort`, `reduce`, `findIndex`), event delegation, and Web Storage API.
* **Font Awesome (6.4.0)**: Lightweight SVG iconography loaded via CDN.
* **Google Fonts**: Inter font family.

*Zero npm dependencies, zero build steps, and zero frameworks.*

---

## Running the Application Locally

Because the application uses standard client-side web technologies, no installation or compilation step is required.

### Method 1: Direct File Launch (Easiest)
1. Navigate to the project directory:
   ```
   C:\Users\Hp\Desktop\GITHUB\To-Do App
   ```
2. Double-click `index.html` to open it in your default web browser (Chrome, Edge, Firefox, Safari, or Opera).

Or launch from PowerShell:
```powershell
Start-Process "index.html"
```

### Method 2: Local HTTP Server (Recommended for Development)
If you prefer running through `localhost`:

Using Python (pre-installed on most development machines):
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.

Using VS Code:
Right-click `index.html` and select **"Open with Live Server"**.

---

## How localStorage is Used

All persistent data is stored in the browser's `window.localStorage` under dedicated, versioned keys:

| Storage Key | Format | Description |
| :--- | :--- | :--- |
| `prod-tasks-v1` | JSON Array of Objects | Stores task list with IDs, title, category, priority, dueDate, and completion state. |
| `prod-tasks-v1-backup` | JSON String | Automatic safety snapshot created before migration to prevent data loss. |
| `prod-theme-v1` | String (`'dark'` or `'light'`) | Stores active user theme preference. |
| `prod-verse-v2` | JSON Array of Objects | Stores saved verses/quotes (`[{ id, text }]`). |
| `prod-food-v2` | JSON Array of Objects | Stores food and routine checklist items (`[{ id, text, completed }]`). |
| `prod-reflect-v1` | String | Raw text content of the daily reflection journal. |

### Data Safety & Migration Strategy
* **Pre-Migration Backup**: Before any migration operations, the raw stored data is copied to `prod-tasks-v1-backup`.
* **Safe Error Handling**: All storage calls are wrapped in `try...catch` blocks to prevent unhandled `SyntaxError`s if stored data is ever corrupted.
* **Backward Compatibility**: Older task items with only `{ id, text, completed }` are normalized automatically on load, adding default values (`priority: 'medium'`, `category: 'Personal'`, `dueDate: ''`) without losing existing IDs or text.

---

## Project Structure

```
To-Do App/
├── index.html        # Main semantic markup, modal structures, and dashboard layout
├── style.css         # Complete styling, CSS custom properties, themes, and responsive queries
├── script.js         # Application logic, storage migration, CRUD handlers, dashboard, filters
└── README.md         # Comprehensive project documentation
```

---

## Known Limitations

1. **Origin-Bound Storage**: Data saved in `localStorage` is isolated to the specific browser and origin (`file://` or `localhost:8000`). Opening the file in a different browser will show a fresh state.
2. **Device Sync**: Because there is no external cloud database, tasks do not sync across different physical devices.
3. **Storage Quota**: Browser `localStorage` typically has a storage limit of ~5MB, which is more than enough for thousands of text tasks, but not intended for file attachments or images.

---

## Possible Future Improvements

* **Export & Import (JSON / CSV)**: Allow users to download a backup of their data or import tasks from another device.
* **Due Date Reminders**: Use the browser Web Notifications API to alert users when a task is due today.
* **Task Sub-tasks / Checklists**: Add nested sub-items within complex tasks.
* **PWA (Progressive Web App)**: Add a service worker and `manifest.json` for offline installability on mobile home screens.
