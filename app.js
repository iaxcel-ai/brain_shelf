// brain_shelf

// Global state for search results and reading list
let allResults = [];
let readingList = [];

// Handle page initialization and global event listeners
document.addEventListener('DOMContentLoaded', function () {
    loadReadingList();
    loadTheme();
    // Let user press Enter to search
    document.getElementById('searchInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') handleSearch();
    });
});


// 1. put together search across multiple APIs in parallel
function surpriseMe() {
    const topics = [
        'Cosmology', 'Quantum Physics', 'Ancient Egypt', 'Renaissance Art', 
        'Machine Learning', 'Oceanography', 'Jazz History', 'Gastronomy', 
        'Sustainable Energy', 'Architecture', 'Genetics', 'Psychology'
    ];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    document.getElementById('searchInput').value = randomTopic;
    handleSearch();
}

async function handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
        showStatus('Please type something to search for.', 'error');
        return;
    }

    showStatus('Searching books and Wikipedia...', 'loading');
    allResults = [];
    document.getElementById('results').innerHTML = '';

    try {
        const results = await Promise.allSettled([
            ApiService.fetchBooks(query),
            ApiService.fetchWikipedia(query)
        ]);

        const books = results[0].status === 'fulfilled' ? results[0].value : [];
        const wikiArticles = results[1].status === 'fulfilled' ? results[1].value : [];
        allResults = [...books, ...wikiArticles];

        if (allResults.length === 0) {
            showStatus('No results found. Try a different search term.', 'info');
            return;
        }

        hideStatus();
        applyFilters();
    } catch (error) {
        console.error('Search error:', error);
        showStatus('Something went wrong. Please try again.', 'error');
    }
}

// 2. API Service Object for modularity
const ApiService = {
    async fetchBooks(query) {
        const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12&fields=key,title,author_name,first_publish_year,subject,cover_i,edition_count`;
        try {
            const response = await fetch(url);
            if (!response.ok) return [];
            const data = await response.json();
            return data.docs.map(book => ({
                type: 'book',
                title: book.title || 'Untitled',
                author: book.author_name ? book.author_name.join(', ') : 'Unknown author',
                year: book.first_publish_year || null,
                description: book.subject ? book.subject.slice(0, 5).join(', ') : 'No subjects listed',
                url: `https://openlibrary.org${book.key}`,
                cover: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,
                editions: book.edition_count || 0
            }));
        } catch (error) {
            return [];
        }
    },

    async fetchWikipedia(query) {
        const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=8&format=json&origin=*&utf8=`;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) return [];
            const data = await response.json();
            if (!data.query || !data.query.search) return [];
            return data.query.search.map(article => ({
                type: 'wiki',
                title: article.title,
                author: 'Wikipedia',
                year: null,
                description: article.snippet.replace(/<[^>]+>/g, ''),
                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(article.title)}`,
                cover: null,
                editions: 0
            }));
        } catch (error) {
            return [];
        }
    }
};


// 4. Content filtering and sorting logic
function applyFilters() {
    const filterType = document.getElementById('filterType').value;
    const sortBy = document.getElementById('sortBy').value;

    // Step 1: Filter by type
    let filtered = allResults;

    if (filterType === 'books') {
        filtered = allResults.filter(function (item) {
            return item.type === 'book';
        });
    } else if (filterType === 'wiki') {
        filtered = allResults.filter(function (item) {
            return item.type === 'wiki';
        });
    }

    // Step 2: Sort (only affects books, wiki stays in relevance order)
    if (sortBy === 'newest') {
        filtered.sort(function (a, b) {
            // Items without a year go to the end
            if (!a.year) return 1;
            if (!b.year) return -1;
            return b.year - a.year; // higher year first
        });
    } else if (sortBy === 'oldest') {
        filtered.sort(function (a, b) {
            if (!a.year) return 1;
            if (!b.year) return -1;
            return a.year - b.year; // lower year first
        });
    }

    // Step 3: Render the filtered results
    renderResults(filtered);
}


// 5. Generate and inject HTML for result cards
function renderResults(items) {
    const container = document.getElementById('results');

    // If no items match the filter
    if (items.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#6b6b6b;grid-column:1/-1;padding:2rem;">No results match your current filter.</p>';
        return;
    }

    // Generate card HTML from result items
    container.innerHTML = items.map(function (item, index) {
        // Determine the CSS class based on type
        const cardClass = item.type === 'book' ? 'book-card' : 'wiki-card';
        const badgeText = item.type === 'book' ? 'Book' : 'Wikipedia';

        // Build the meta info line
        let meta = '';
        if (item.type === 'book') {
            meta = item.author;
            if (item.year) meta += ' · ' + item.year;
            if (item.editions > 1) meta += ' · ' + item.editions + ' editions';
        }

        // Check if this item is already in the reading list
        const isSaved = readingList.some(function (saved) {
            return saved.url === item.url;
        });

        // Build cover image HTML (books with covers get an image on the left)
        let coverHTML = '';
        if (item.cover) {
            coverHTML = `<div class="card-cover"><img src="${item.cover}" alt="Cover of ${item.title}" loading="lazy"></div>`;
        }

        // Build the read/open button depending on type
        let readBtn = '';
        if (item.type === 'book') {
            readBtn = `<a href="${item.url}" target="_blank" rel="noopener" class="btn-read">Read / Borrow →</a>`;
        } else {
            readBtn = `<a href="${item.url}" target="_blank" rel="noopener" class="btn-read">Read Article →</a>`;
        }

        return `
            <div class="card ${cardClass}">
                ${coverHTML}
                <div class="card-body">
                    <span class="card-badge">${badgeText}</span>
                    <h3 class="card-title">
                        <a href="${item.url}" target="_blank" rel="noopener">${item.title}</a>
                    </h3>
                    ${meta ? `<p class="card-meta">${meta}</p>` : ''}
                    <p class="card-description">${item.description}</p>
                    <div class="card-actions">
                        <button 
                            class="btn-save ${isSaved ? 'saved' : ''}" 
                            onclick="toggleSave(${index}, this)"
                        >
                            ${isSaved ? '✓ Saved' : '+ Save'}
                        </button>
                        <button class="btn-copy" onclick="copyToClipboard('${item.url}', this)">
                            🔗 Copy
                        </button>
                        ${readBtn}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Helper to copy text to clipboard
function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}


// 6. Reading list persistence and sidebar management

// Load reading list from localStorage on startup
function loadReadingList() {
    try {
        const stored = localStorage.getItem('brain_shelf_reading_list');
        if (stored) {
            readingList = JSON.parse(stored);
        }
    } catch (e) {
        // If localStorage is corrupted, start fresh
        readingList = [];
    }
    updateListCount();
}

// Save reading list to localStorage
function saveReadingList() {
    localStorage.setItem('brain_shelf_reading_list', JSON.stringify(readingList));
    updateListCount();
}

// Update the counter badge
function updateListCount() {
    document.getElementById('listCount').textContent = readingList.length;
}

// Toggle save/unsave for a result
function toggleSave(index, buttonElement) {
    // Get the current filtered results (what's on screen)
    const filterType = document.getElementById('filterType').value;
    let filtered = allResults;
    if (filterType === 'books') {
        filtered = allResults.filter(function (item) { return item.type === 'book'; });
    } else if (filterType === 'wiki') {
        filtered = allResults.filter(function (item) { return item.type === 'wiki'; });
    }

    const item = filtered[index];
    if (!item) return;

    // Check if already saved
    const existingIndex = readingList.findIndex(function (saved) {
        return saved.url === item.url;
    });

    if (existingIndex >= 0) {
        // Remove it
        readingList.splice(existingIndex, 1);
        buttonElement.textContent = '+ Save';
        buttonElement.classList.remove('saved');
    } else {
        // Add it
        readingList.push({
            title: item.title,
            type: item.type,
            url: item.url
        });
        buttonElement.textContent = '✓ Saved';
        buttonElement.classList.add('saved');
    }

    saveReadingList();
}

// Show or hide the reading list sidebar
function toggleReadingList() {
    const panel = document.getElementById('readingList');
    panel.classList.toggle('hidden');

    // Render the items inside the sidebar
    renderReadingList();
}

// Render saved items in the sidebar
function renderReadingList() {
    const container = document.getElementById('readingListItems');

    if (readingList.length === 0) {
        container.innerHTML = '<p class="empty-list">No saved items yet.<br>Click "+ Save" on any result to add it here.</p>';
        return;
    }

    container.innerHTML = readingList.map(function (item, index) {
        const typeLabel = item.type === 'book' ? 'Book' : 'Wikipedia';
        return `
            <div class="rl-item">
                <div class="rl-item-info">
                    <div class="rl-item-title">
                        <a href="${item.url}" target="_blank" rel="noopener">${item.title}</a>
                    </div>
                    <span class="rl-item-type">${typeLabel}</span>
                </div>
                <button class="rl-remove" onclick="removeFromList(${index})" title="Remove">✕</button>
            </div>
        `;
    }).join('');
}

// Remove a single item from reading list
function removeFromList(index) {
    readingList.splice(index, 1);
    saveReadingList();
    renderReadingList();
    // Also refresh the main results so "Save" buttons update
    if (allResults.length > 0) applyFilters();
}

// Clear entire reading list
function clearReadingList() {
    if (readingList.length === 0) return;
    
    // Show custom modal instead of window.confirm
    const modal = document.getElementById('confirmModal');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    
    modal.classList.remove('hidden');
    
    // Set up one-time event listener for confirm button
    confirmBtn.onclick = function() {
        readingList = [];
        saveReadingList();
        renderReadingList();
        if (allResults.length > 0) applyFilters();
        closeModal();
    };
}

function closeModal() {
    document.getElementById('confirmModal').classList.add('hidden');
}


// 7. UI status display (loading, error, info)
function showStatus(message, type) {
    const el = document.getElementById('statusMessage');
    
    if (type === 'loading') {
        el.innerHTML = `
            <div class="spinner"></div>
            <div class="spinner-text">${message}</div>
        `;
    } else {
        el.textContent = message;
    }
    
    el.className = 'status-message ' + type; // removes 'hidden', adds type
}

function hideStatus() {
    const el = document.getElementById('statusMessage');
    el.className = 'status-message hidden';
}

// 8. Theme management
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('brain_shelf_theme', newTheme);
    
    // Update toggle icon
    const btn = document.getElementById('themeToggle');
    btn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('brain_shelf_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}