// DOM Elements
const noteModal = document.getElementById('note-modal');
const confirmModal = document.getElementById('confirm-modal');
const tagModal = document.getElementById('tag-modal');
const toast = document.getElementById('toast');
const newNoteBtn = document.getElementById('new-note-btn');
const saveNoteBtn = document.getElementById('save-note-btn');
const deleteNoteBtn = document.getElementById('delete-note-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const addTagBtn = document.getElementById('add-tag-btn');
const searchInput = document.getElementById('search-input');
const gridViewBtn = document.getElementById('grid-view-btn');
const listViewBtn = document.getElementById('list-view-btn');

const pinnedNotesGrid = document.getElementById('pinned-notes-grid');
const notesGrid = document.getElementById('notes-grid');
const notesContainer = document.querySelector('.notes-container');
const modalTitle = document.getElementById('modal-title');
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const pinNote = document.getElementById('pin-note');
const tagSelector = document.querySelector('.tag-selector');

// State Management
const appState = {
    notes: [], // Array to store all notes
    tags: [
        { name: 'work', color: '#2196f3' },
        { name: 'personal', color: '#ff9800' },
        { name: 'ideas', color: '#4caf50' },
        { name: 'important', color: '#f44336' }
    ],
    currentNote: null, // Currently selected note for editing
    currentView: 'grid', // Current view mode (grid or list)
    currentlyDeleting: null, // Note currently being deleted
    searchTerm: '', // Current search term
    filteredTag: null, // Currently filtered tag

};

// Initialize the app
function initializeApp() {
    loadFromLocalStorage();
    renderNotes();
    setupEventListeners();

    
    // Ensure modals are in correct initial state
    [noteModal, confirmModal, tagModal].forEach(modal => {
        if (modal) modal.classList.remove('active');
    });
}

// Load data from localStorage
function loadFromLocalStorage() {
    // Load notes
    const savedNotes = localStorage.getItem('notes');
    appState.notes = savedNotes ? JSON.parse(savedNotes) : [];
    
    // Load tags
    const savedTags = localStorage.getItem('tags');
    if (savedTags) {
        appState.tags = JSON.parse(savedTags);
    }
    
    // Load view preference
    const savedView = localStorage.getItem('currentView');
    if (savedView) {
        appState.currentView = savedView;
        updateViewButtons();
        notesContainer.className = `notes-container ${appState.currentView}-view`;
    }
    

}

// Save data to localStorage
function saveToLocalStorage() {
    localStorage.setItem('notes', JSON.stringify(appState.notes));
    localStorage.setItem('tags', JSON.stringify(appState.tags));
    localStorage.setItem('currentView', appState.currentView);

}

// Setup event listeners
function setupEventListeners() {
    // New note button
    newNoteBtn.addEventListener('click', openNewNoteModal);
    
    // Save note button
    saveNoteBtn.addEventListener('click', saveNote);
    
    // Delete note button
    deleteNoteBtn.addEventListener('click', showConfirmDeleteModal);
    
    // Confirm delete button
    confirmDeleteBtn.addEventListener('click', deleteNote);
    
    // Cancel delete button
    cancelDeleteBtn.addEventListener('click', () => {
        closeModal(confirmModal);
    });
    
    // Add tag button
    addTagBtn.addEventListener('click', addNewTag);
    
    // Search input
    searchInput.addEventListener('input', (e) => {
        appState.searchTerm = e.target.value.toLowerCase();
        renderNotes();
    });
    
    // View toggle buttons
    gridViewBtn.addEventListener('click', () => {
        setView('grid');
    });
    
    listViewBtn.addEventListener('click', () => {
        setView('list');
    });
    

    
    // Close modal buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(btn.closest('.modal'));
        });
    });
    
    // Tag filtering in sidebar
    document.querySelectorAll('.tag-list .tag').forEach(tag => {
        if (!tag.classList.contains('add-tag')) {
            tag.addEventListener('click', () => {
                const tagName = tag.dataset.tag;
                if (appState.filteredTag === tagName) {
                    appState.filteredTag = null;
                    document.querySelectorAll('.tag-list .tag').forEach(t => {
                        t.classList.remove('selected');
                    });
                } else {
                    appState.filteredTag = tagName;
                    document.querySelectorAll('.tag-list .tag').forEach(t => {
                        t.classList.remove('selected');
                    });
                    tag.classList.add('selected');
                }
                renderNotes();
            });
        }
    });
    
    // Add tag button in sidebar
    document.querySelector('.add-tag').addEventListener('click', openTagModal);
    
    // Tag selection in modal
    tagSelector.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => {
            tag.classList.toggle('selected');
        });
    });
    
    // Keyboard events for modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close any open modal
            [noteModal, confirmModal, tagModal].forEach(modal => {
                if (modal && modal.classList.contains('active')) {
                    closeModal(modal);
                }
            });
        } else if (e.key === 'Enter' && e.ctrlKey) {
            // Save note with Ctrl+Enter
            const activeModal = [noteModal, confirmModal, tagModal].find(modal => 
                modal && modal.classList.contains('active')
            );
            if (activeModal === noteModal) {
                saveNote();
            }
        }
    });
}

// Set view mode (grid or list)
function setView(view) {
    appState.currentView = view;
    updateViewButtons();
    notesContainer.className = `notes-container ${view}-view`;
    saveToLocalStorage();
}

// Update view toggle buttons
function updateViewButtons() {
    if (appState.currentView === 'grid') {
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
    } else {
        gridViewBtn.classList.remove('active');
        listViewBtn.classList.add('active');
    }
}

// Open modal for new note
function openNewNoteModal() {
    modalTitle.textContent = 'Add New Note';
    noteTitle.value = '';
    noteContent.value = '';
    pinNote.checked = false;
    
    // Reset tag selection
    tagSelector.querySelectorAll('.tag').forEach(tag => {
        tag.classList.remove('selected');
    });
    
    appState.currentNote = null;
    deleteNoteBtn.style.display = 'none';
    openModal(noteModal);
}

// Open modal for editing note
function openEditNoteModal(note) {
    modalTitle.textContent = 'Edit Note';
    noteTitle.value = note.title;
    noteContent.value = note.content;
    pinNote.checked = note.pinned;
    
    // Set tag selection
    tagSelector.querySelectorAll('.tag').forEach(tag => {
        const tagName = tag.dataset.tag;
        if (note.tags && note.tags.includes(tagName)) {
            tag.classList.add('selected');
        } else {
            tag.classList.remove('selected');
        }
    });
    
    appState.currentNote = note;
    deleteNoteBtn.style.display = 'flex';
    openModal(noteModal);
}

// Open tag modal
function openTagModal() {
    document.getElementById('tag-name').value = '';
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector('.color-option').classList.add('selected');
    openModal(tagModal);
}

// Open a modal
function openModal(modal) {
    modal.classList.add('active');
    
    // Add click handler for modal overlay
    const handleOverlayClick = (e) => {
        if (e.target === modal) {
            closeModal(modal);
            modal.removeEventListener('click', handleOverlayClick);
        }
    };
    modal.addEventListener('click', handleOverlayClick);
}

// Close a modal
function closeModal(modal) {
    modal.classList.remove('active');
}

// Show confirmation modal for delete
function showConfirmDeleteModal() {
    appState.currentlyDeleting = appState.currentNote;
    closeModal(noteModal);
    openModal(confirmModal);
}

// Delete the current note
function deleteNote() {
    if (appState.currentlyDeleting) {
        const noteIndex = appState.notes.findIndex(note => note.id === appState.currentlyDeleting.id);
        if (noteIndex !== -1) {
            appState.notes.splice(noteIndex, 1);
            saveToLocalStorage();
            renderNotes();
            showToast('Note deleted successfully', 'success');
        }
    }
    closeModal(confirmModal);
    appState.currentlyDeleting = null;
}

// Save or update a note
function saveNote() {
    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();
    
    if (!title || !content) {
        showToast('Title and content are required', 'error');
        return;
    }
    
    // Get selected tags
    const selectedTags = [];
    tagSelector.querySelectorAll('.tag.selected').forEach(tag => {
        selectedTags.push(tag.dataset.tag);
    });
    
    if (appState.currentNote) {
        // Update existing note
        const noteIndex = appState.notes.findIndex(note => note.id === appState.currentNote.id);
        if (noteIndex !== -1) {
            appState.notes[noteIndex] = {
                ...appState.notes[noteIndex],
                title,
                content,
                pinned: pinNote.checked,
                tags: selectedTags,
                updatedAt: new Date().toISOString()
            };
            showToast('Note updated successfully', 'success');
        }
    } else {
        // Create new note
        const newNote = {
            id: generateId(),
            title,
            content,
            pinned: pinNote.checked,
            tags: selectedTags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        appState.notes.push(newNote);
        showToast('Note added successfully', 'success');
    }
    
    saveToLocalStorage();
    renderNotes();
    closeModal(noteModal);
}

// Add a new tag
function addNewTag() {
    const tagName = document.getElementById('tag-name').value.trim().toLowerCase();
    const selectedColor = document.querySelector('.color-option.selected').dataset.color;
    
    if (!tagName) {
        showToast('Tag name is required', 'error');
        return;
    }
    
    // Check if tag already exists
    if (appState.tags.some(tag => tag.name === tagName)) {
        showToast('Tag already exists', 'error');
        return;
    }
    
    // Add new tag
    appState.tags.push({
        name: tagName,
        color: selectedColor
    });
    
    saveToLocalStorage();
    updateTagsUI();
    closeModal(tagModal);
    showToast('Tag added successfully', 'success');
}

// Update tags UI elements
function updateTagsUI() {
    // Update sidebar tags
    const tagList = document.querySelector('.tag-list');
    const addTagBtn = tagList.querySelector('.add-tag');
    
    // Clear existing tags except add button
    Array.from(tagList.children).forEach(child => {
        if (!child.classList.contains('add-tag')) {
            tagList.removeChild(child);
        }
    });
    
    // Add tags
    appState.tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.dataset.tag = tag.name;
        tagElement.textContent = capitalizeFirstLetter(tag.name);
        tagElement.style.backgroundColor = tag.color;
        
        // Add event listener
        tagElement.addEventListener('click', () => {
            const tagName = tagElement.dataset.tag;
            if (appState.filteredTag === tagName) {
                appState.filteredTag = null;
                document.querySelectorAll('.tag-list .tag').forEach(t => {
                    t.classList.remove('selected');
                });
            } else {
                appState.filteredTag = tagName;
                document.querySelectorAll('.tag-list .tag').forEach(t => {
                    t.classList.remove('selected');
                });
                tagElement.classList.add('selected');
            }
            renderNotes();
        });
        
        // Insert before add button
        tagList.insertBefore(tagElement, addTagBtn);
    });
    
    // Update tag selector in modal
    updateTagSelector();
}

// Update tag selector in modal
function updateTagSelector() {
    // Clear existing tags
    tagSelector.innerHTML = '';
    
    // Add tags
    appState.tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag selectable';
        tagElement.dataset.tag = tag.name;
        tagElement.textContent = capitalizeFirstLetter(tag.name);
        tagElement.style.backgroundColor = tag.color;
        
        // Add event listener
        tagElement.addEventListener('click', () => {
            tagElement.classList.toggle('selected');
        });
        
        tagSelector.appendChild(tagElement);
    });
    
    // Update CSS for tag colors
    updateTagColorStyles();
}

// Update CSS for tag colors
function updateTagColorStyles() {
    // Remove existing style element if any
    const existingStyle = document.getElementById('dynamic-tag-styles');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    // Create new style element
    const style = document.createElement('style');
    style.id = 'dynamic-tag-styles';
    
    // Generate CSS for tags
    let css = '';
    appState.tags.forEach(tag => {
        css += `
            .note-tag[data-tag="${tag.name}"] {
                background-color: ${tag.color};
            }
            .tag[data-tag="${tag.name}"] {
                background-color: ${tag.color};
                color: white;
            }
        `;
    });
    
    style.textContent = css;
    document.head.appendChild(style);
}

// Render notes based on current state
function renderNotes() {
    // Filter notes based on search term and tag filter
    const filteredNotes = appState.notes.filter(note => {
        const matchesSearch = appState.searchTerm ? 
            (note.title.toLowerCase().includes(appState.searchTerm) || 
             note.content.toLowerCase().includes(appState.searchTerm)) : 
            true;
        
        const matchesTag = appState.filteredTag ? 
            (note.tags && note.tags.includes(appState.filteredTag)) : 
            true;
        
        return matchesSearch && matchesTag;
    });
    
    // Sort notes: pinned first, then by most recent update
    const sortedNotes = [...filteredNotes].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
    
    // Separate pinned and unpinned notes
    const pinnedNotes = sortedNotes.filter(note => note.pinned);
    const unpinnedNotes = sortedNotes.filter(note => !note.pinned);
    
    // Render pinned notes
    renderNoteSection(pinnedNotesGrid, pinnedNotes);
    
    // Render unpinned notes
    renderNoteSection(notesGrid, unpinnedNotes);
    
    // Toggle visibility of pinned section
    const pinnedSection = document.getElementById('pinned-notes');
    pinnedSection.style.display = pinnedNotes.length > 0 ? 'block' : 'none';
    
    // Show empty state if no notes
    const otherNotesSection = document.getElementById('other-notes');
    if (unpinnedNotes.length === 0 && pinnedNotes.length === 0) {
        if (!document.querySelector('.empty-state')) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <i class="fas fa-sticky-note"></i>
                <h3>No notes found</h3>
                <p>Create a new note or adjust your search.</p>
            `;
            otherNotesSection.appendChild(emptyState);
        }
    } else {
        const emptyState = document.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
    }
}

// Render a section of notes
function renderNoteSection(container, notes) {
    container.innerHTML = '';
    
    notes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.style.animationDelay = `${Math.random() * 0.2}s`;
        
        // Create note header
        const noteHeader = document.createElement('div');
        noteHeader.className = 'note-card-header';
        
        const noteTitle = document.createElement('h3');
        noteTitle.className = 'note-card-title';
        noteTitle.textContent = note.title;
        
        const notePin = document.createElement('span');
        notePin.className = `note-card-pin ${note.pinned ? 'pinned' : ''}`;
        notePin.innerHTML = '<i class="fas fa-thumbtack"></i>';
        
        noteHeader.appendChild(noteTitle);
        noteHeader.appendChild(notePin);
        
        // Create note content
        const noteContent = document.createElement('div');
        noteContent.className = 'note-card-content';
        noteContent.textContent = note.content;
        
        // Create note footer with tags
        const noteFooter = document.createElement('div');
        noteFooter.className = 'note-card-footer';
        
        if (note.tags && note.tags.length > 0) {
            note.tags.forEach(tagName => {
                const tag = document.createElement('span');
                tag.className = 'note-tag';
                tag.dataset.tag = tagName;
                tag.textContent = capitalizeFirstLetter(tagName);
                noteFooter.appendChild(tag);
            });
        }
        
        // Assemble note card
        noteCard.appendChild(noteHeader);
        noteCard.appendChild(noteContent);
        noteCard.appendChild(noteFooter);
        
        // Add event listener for opening the note
        noteCard.addEventListener('click', () => {
            openEditNoteModal(note);
        });
        
        container.appendChild(noteCard);
    });
}

// Show toast notification
function showToast(message, type = 'success') {
    const toastMessage = document.getElementById('toast-message');
    toastMessage.textContent = message;
    
    toast.className = `toast ${type}`;
    toast.classList.add('active');
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// Generate a unique ID for new notes
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Capitalize first letter of a string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Color selection in tag modal
document.querySelectorAll('.color-option').forEach(option => {
    // Set initial background color
    option.style.backgroundColor = option.dataset.color;
    
    option.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(o => {
            o.classList.remove('selected');
        });
        option.classList.add('selected');
    });
});

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);