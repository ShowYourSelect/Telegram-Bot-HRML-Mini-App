const newNoteText = document.getElementById('newNoteText');
const addNoteBtn = document.getElementById('addNoteBtn');
const notesList = document.getElementById('notes-list');
const clearAllBtn = document.getElementById('clearAllBtn');
const searchInput = document.getElementById('searchInput'); // Новый элемент
const sortSelect = document.getElementById('sortSelect'); // Новый элемент

const STORAGE_KEY = 'tg_notes_list';

// ------------------------------------------------
// 1. УПРАВЛЕНИЕ ДАННЫМИ
// ------------------------------------------------

function getNotes() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
}

function saveNotes(notesArray) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notesArray));
}

// ------------------------------------------------
// 2. РЕНДЕРИНГ и СОРТИРОВКА
// ------------------------------------------------

function renderNotes() {
    const notes = getNotes();
    const filterText = searchInput.value.trim();
    const sortValue = sortSelect.value;

    notesList.innerHTML = '';

    // 1. ФИЛЬТРАЦИЯ (Поиск)
    let filteredNotes = notes.filter(note =>
        note.text.toLowerCase().includes(filterText.toLowerCase())
    );

    // 2. СОРТИРОВКА
    filteredNotes.sort((a, b) => {
        // Главный приоритет — Закрепление (Pinned)
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        // Дополнительные правила сортировки
        switch (sortValue) {
            case 'priority':
                if (a.priority && !b.priority) return -1; // Приоритетные выше
                if (!a.priority && b.priority) return 1;
                break;
            case 'date-asc':
                return new Date(a.date) - new Date(b.date); // Сначала старые
            case 'pinned':
                // Если оба не закреплены, сортируем по дате
                if (!a.isPinned && !b.isPinned) {
                    return new Date(b.date) - new Date(a.date);
                }
                break;
            case 'date-desc':
            default:
                return new Date(b.date) - new Date(a.date); // Сначала новые (дефолт)
        }

        // Если закрепление/приоритет/сортировка не сработали, сортируем по дате
        return new Date(b.date) - new Date(a.date);
    });

    // 3. РЕНДЕРИНГ
    if (filteredNotes.length === 0) {
        notesList.innerHTML = `<p style="text-align: center; color: #666; padding: 20px;">${filterText ? 'Нет совпадений для вашего запроса.' : 'Заметок пока нет. Добавьте первую!'}</p>`;
        return;
    }

    filteredNotes.forEach(note => {
        const noteElement = document.createElement('div');
        // Добавляем классы 'priority' и 'pinned' для стилей
        noteElement.className = `note-item ${note.priority ? 'priority' : ''} ${note.isPinned ? 'pinned' : ''}`;
        noteElement.dataset.id = note.id;

        const date = new Date(note.date);
        const dateString = date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

        noteElement.innerHTML = `
            <div class="note-text">${note.text}</div>
            <div class="note-meta">
                <span class="note-date">${dateString}</span>
                <div class="note-actions">
                    <button onclick="togglePin('${note.id}')" title="Закрепить/Открепить">
                        ${note.isPinned ? '📍' : '📌'}
                    </button>
                    <button onclick="togglePriority('${note.id}')" title="Высокий приоритет">
                        ${note.priority ? '★' : '☆'}
                    </button>
                    <button onclick="editNote('${note.id}')" title="Редактировать">✏️</button>
                    <button onclick="deleteNote('${note.id}')" title="Удалить">🗑️</button>
                </div>
            </div>
        `;
        notesList.appendChild(noteElement);
    });
}

// ------------------------------------------------
// 3. ЛОГИКА ДЕЙСТВИЙ
// ------------------------------------------------

// Добавление новой заметки
addNoteBtn.addEventListener('click', () => {
    const text = newNoteText.value.trim();
    if (text === '') return;

    const notes = getNotes();
    const newNote = {
        id: Date.now().toString(),
        text: text,
        date: new Date().toISOString(),
        priority: false,
        isPinned: false // Добавили новый флаг для закрепления
    };

    notes.unshift(newNote);
    saveNotes(notes);
    newNoteText.value = '';
    renderNotes();
});

// Переключение Закрепления
function togglePin(id) {
    const notes = getNotes();
    const index = notes.findIndex(note => note.id === id);
    if (index > -1) {
        notes[index].isPinned = !notes[index].isPinned;
        saveNotes(notes);
        renderNotes();
    }
}

// Переключение Приоритета (старую логику оставили, но она теперь участвует в сортировке)
function togglePriority(id) {
    const notes = getNotes();
    const index = notes.findIndex(note => note.id === id);
    if (index > -1) {
        notes[index].priority = !notes[index].priority;
        saveNotes(notes);
        renderNotes();
    }
}

// Удаление заметки (остается без изменений)
function deleteNote(id) {
    if (!confirm('Удалить эту заметку?')) return;

    let notes = getNotes();
    notes = notes.filter(note => note.id !== id);
    saveNotes(notes);
    renderNotes();
}

// Редактирование заметки (остается без изменений)
function editNote(id) {
    const notes = getNotes();
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const newText = prompt('Редактировать заметку:', note.text);
    if (newText !== null && newText.trim() !== '') {
        note.text = newText.trim();
        saveNotes(notes);
        renderNotes();
    }
}

// Очистка всех заметок (остается без изменений)
clearAllBtn.addEventListener('click', () => {
    if (confirm('Вы уверены, что хотите удалить ВСЕ заметки?')) {
        localStorage.removeItem(STORAGE_KEY);
        renderNotes();
    }
});

// ------------------------------------------------
// 4. ЗАПУСК
// ------------------------------------------------

// Обработчики для Поиска и Сортировки
searchInput.addEventListener('input', renderNotes);
sortSelect.addEventListener('change', renderNotes);


// Интеграция с Telegram Web App (остается без изменений)
if (window.Telegram && window.Telegram.WebApp) {
    Telegram.WebApp.setHeaderColor('#1c1c1e');
    Telegram.WebApp.setBackgroundColor('#0d0d0d');
    Telegram.WebApp.ready();
}

// Инициализация
renderNotes();
