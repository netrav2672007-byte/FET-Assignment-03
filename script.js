// Initialize
let feedbackData = [];
let currentDisplayCount = 0;
const DISPLAY_INCREMENT = 4;

// DOM Elements
const feedbackForm = document.getElementById('feedbackForm');
const feedbackList = document.getElementById('feedbackList');
const searchInput = document.getElementById('searchFeedback');
const filterCategory = document.getElementById('filterCategory');
const loadMoreBtn = document.getElementById('loadMore');
const clearAllBtn = document.getElementById('clearAllFeedback');
const clearFormBtn = document.getElementById('clearForm');

// Stats Elements
const totalFeedbackEl = document.getElementById('totalFeedback');
const avgRatingEl = document.getElementById('avgRating');
const positiveFeedbackEl = document.getElementById('positiveFeedback');
const negativeFeedbackEl = document.getElementById('negativeFeedback');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    loadFeedback();
    renderFeedback();
    updateStats();
    setupEvents();
});

// Load from localStorage
function loadFeedback() {
    const stored = localStorage.getItem('feedbackData');
    if (stored) {
        feedbackData = JSON.parse(stored);
        feedbackData.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
}

// Save to localStorage
function saveFeedback() {
    localStorage.setItem('feedbackData', JSON.stringify(feedbackData));
}

// Setup Event Listeners
function setupEvents() {
    feedbackForm.addEventListener('submit', handleSubmit);
    searchInput.addEventListener('input', renderFeedback);
    filterCategory.addEventListener('change', renderFeedback);
    
    loadMoreBtn.addEventListener('click', function() {
        currentDisplayCount += DISPLAY_INCREMENT;
        renderFeedback();
    });
    
    clearAllBtn.addEventListener('click', function() {
        if (confirm('Delete all feedback?')) {
            feedbackData = [];
            saveFeedback();
            currentDisplayCount = 0;
            renderFeedback();
            updateStats();
        }
    });
    
    clearFormBtn.addEventListener('click', function() {
        feedbackForm.reset();
        document.querySelectorAll('.star-rating input').forEach(radio => radio.checked = false);
    });
}

// Handle Form Submit
function handleSubmit(e) {
    e.preventDefault();
    
    const feedback = {
        id: Date.now(),
        name: document.getElementById('name').value,
        email: document.getElementById('email').value || 'Not provided',
        category: document.getElementById('category').value,
        rating: parseInt(document.querySelector('input[name="rating"]:checked').value),
        comments: document.getElementById('comments').value,
        date: new Date().toISOString()
    };
    
    feedbackData.unshift(feedback);
    saveFeedback();
    
    feedbackForm.reset();
    document.querySelectorAll('.star-rating input').forEach(radio => radio.checked = false);
    
    showAlert('Feedback submitted!', 'success');
    
    currentDisplayCount = 0;
    renderFeedback();
    updateStats();
    
    document.getElementById('view').scrollIntoView({ behavior: 'smooth' });
}

// Render Feedback List
function renderFeedback() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = filterCategory.value;
    
    let filtered = feedbackData.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(searchTerm) || 
                             f.comments.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });
    
    const displayCount = Math.min(currentDisplayCount + DISPLAY_INCREMENT, filtered.length);
    const toDisplay = filtered.slice(0, displayCount);
    
    feedbackList.innerHTML = '';
    
    if (toDisplay.length === 0) {
        feedbackList.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-chat-square"></i>
                <h4>No feedback found</h4>
                <p>${feedbackData.length === 0 ? 'Be the first to share!' : 'Try changing search/filter'}</p>
            </div>
        `;
        loadMoreBtn.style.display = 'none';
        return;
    }
    
    toDisplay.forEach(feedback => {
        const card = createCard(feedback);
        feedbackList.appendChild(card);
    });
    
    loadMoreBtn.style.display = displayCount < filtered.length ? 'block' : 'none';
    currentDisplayCount = displayCount;
}

// Create Feedback Card
function createCard(feedback) {
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-3';
    
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        starsHTML += i <= feedback.rating ? '<i class="bi bi-star-fill"></i> ' : '<i class="bi bi-star"></i> ';
    }
    
    const date = new Date(feedback.date);
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const shortComments = feedback.comments.length > 80 
        ? feedback.comments.substring(0, 80) + '...' 
        : feedback.comments;
    
    card.innerHTML = `
        <div class="card feedback-card" data-id="${feedback.id}">
            <div class="card-body">
                <div class="d-flex justify-content-between mb-2">
                    <h6 class="card-title mb-0">${feedback.name}</h6>
                    <span class="badge bg-primary">${feedback.category}</span>
                </div>
                <div class="rating-stars mb-2">${starsHTML}</div>
                <p class="card-text small">${shortComments}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">${formattedDate}</small>
                    <button class="btn btn-sm btn-outline-primary view-btn">View</button>
                </div>
            </div>
        </div>
    `;
    
    card.querySelector('.view-btn').addEventListener('click', function() {
        showDetails(feedback.id);
    });
    
    return card;
}

// Show Details Modal
function showDetails(feedbackId) {
    const feedback = feedbackData.find(f => f.id === feedbackId);
    if (!feedback) return;
    
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        starsHTML += i <= feedback.rating ? '<i class="bi bi-star-fill"></i> ' : '<i class="bi bi-star"></i> ';
    }
    
    document.getElementById('modalName').textContent = feedback.name;
    document.getElementById('modalEmail').textContent = feedback.email;
    document.getElementById('modalRating').innerHTML = starsHTML;
    document.getElementById('modalComments').textContent = feedback.comments;
    
    const modal = new bootstrap.Modal(document.getElementById('feedbackModal'));
    modal.show();
}

// Update Statistics
function updateStats() {
    if (feedbackData.length === 0) {
        totalFeedbackEl.textContent = '0';
        avgRatingEl.textContent = '0.0';
        positiveFeedbackEl.textContent = '0';
        negativeFeedbackEl.textContent = '0';
        return;
    }
    
    const total = feedbackData.length;
    const totalRating = feedbackData.reduce((sum, f) => sum + f.rating, 0);
    const averageRating = (totalRating / total).toFixed(1);
    
    const positive = feedbackData.filter(f => f.rating >= 4).length;
    const negative = feedbackData.filter(f => f.rating <= 2).length;
    
    totalFeedbackEl.textContent = total;
    avgRatingEl.textContent = averageRating;
    positiveFeedbackEl.textContent = positive;
    negativeFeedbackEl.textContent = negative;
}

// Show Alert
function showAlert(message, type) {
    const existingAlert = document.querySelector('.alert-dismissible:not(.alert-info)');
    if (existingAlert) existingAlert.remove();
    
    const alertEl = document.createElement('div');
    alertEl.className = `alert alert-${type} alert-dismissible fade show mt-3`;
    alertEl.innerHTML = `${message} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertEl, container.children[2]);
    
    setTimeout(() => {
        if (alertEl.parentNode) {
            new bootstrap.Alert(alertEl).close();
        }
    }, 3000);
}

// Sample Data (Optional - remove for production)
function addSampleData() {
    if (feedbackData.length === 0 && confirm('Add sample data for demonstration?')) {
        const samples = [
            {id: 1, name: "Alex", email: "alex@test.com", category: "Academic", rating: 5, comments: "Great course material!", date: new Date(2025, 10, 15).toISOString()},
            {id: 2, name: "Maria", email: "maria@test.com", category: "Administrative", rating: 4, comments: "Good service overall.", date: new Date(2025, 10, 12).toISOString()},
            {id: 3, name: "David", email: "david@test.com", category: "Facilities", rating: 3, comments: "Could use improvement.", date: new Date(2025, 10, 10).toISOString()}
        ];
        
        feedbackData = samples;
        saveFeedback();
        renderFeedback();
        updateStats();
        showAlert('Sample data loaded.', 'info');
    }
}

// Uncomment to enable sample data prompt on load
// addSampleData();
