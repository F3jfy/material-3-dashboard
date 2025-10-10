// search.js

document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const suggestionsBox = document.getElementById('suggestions-box');

    if (!searchForm || !searchInput || !suggestionsBox) {
        console.error("Search elements not found in the DOM.");
        return;
    }

    const LOCAL_STORAGE_KEY = 'homepageSearchHistory';

    const getHistory = () => {
        const history = localStorage.getItem(LOCAL_STORAGE_KEY);
        return history ? JSON.parse(history) : [];
    };

    const saveToHistory = (query) => {
        if (!query) return;
        let history = getHistory();
        history = history.filter(item => item !== query);
        history.unshift(query);
        history = history.slice(0, 10);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
    };
    
    searchForm.addEventListener('submit', () => {
        const query = searchInput.value.trim();
        if (query) {
            saveToHistory(query);
        }
    });

    searchInput.addEventListener('input', () => {
        const query = searchInput.value;

        if (query.length < 1) {
            // EDITED: Use classList to hide
            suggestionsBox.classList.remove('visible');
            return;
        }
        
        // EDITED: Use classList to show
        suggestionsBox.classList.add('visible');

        const oldScript = document.getElementById('jsonp-script');
        if (oldScript) oldScript.remove();

        const script = document.createElement('script');
        script.id = 'jsonp-script';
        script.src = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}&callback=handleSuggestions`;
        document.head.appendChild(script);
    });

    window.handleSuggestions = (data) => {
        const liveSuggestions = data[1] || [];
        const query = searchInput.value.toLowerCase();

        const history = getHistory();
        const historySuggestions = history.filter(item => item.toLowerCase().includes(query));

        const uniqueLiveSuggestions = liveSuggestions.filter(item => !historySuggestions.includes(item));

        const combinedSuggestions = [...historySuggestions, ...uniqueLiveSuggestions].slice(0, 3);

        suggestionsBox.innerHTML = ''; 
        if (combinedSuggestions.length > 0) {
            combinedSuggestions.forEach(suggestion => {
                const isHistory = historySuggestions.includes(suggestion);
                const li = document.createElement('li');
                li.innerHTML = `<span class="material-icons-round">${isHistory ? 'history' : 'search'}</span> ${suggestion}`;
                li.addEventListener('mousedown', () => {
                    searchInput.value = suggestion;
                    searchForm.submit();
                });
                suggestionsBox.appendChild(li);
            });
        } else {
            // EDITED: Use classList to hide if no suggestions
            suggestionsBox.classList.remove('visible');
        }

        document.getElementById('jsonp-script')?.remove();
    };

    searchInput.addEventListener('focus', () => {
        if (searchInput.value) {
            searchInput.dispatchEvent(new Event('input'));
        }
    });

    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            if (!suggestionsBox.matches(':hover')) {
                // EDITED: Use classList to hide
                suggestionsBox.classList.remove('visible');
            }
        }, 150);
    });
});