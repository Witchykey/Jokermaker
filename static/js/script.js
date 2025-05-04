// JokeSmith - Client-side JavaScript

// Elements
const jokeForm = document.getElementById('jokeForm');
const generateBtn = document.getElementById('generateBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const dynamicJokeResult = document.getElementById('dynamicJokeResult');
const dynamicJokeText = document.getElementById('dynamicJokeText');

// Event listeners
if (jokeForm) {
    jokeForm.addEventListener('submit', function(e) {
        // Let the form submit normally for non-JS fallback
        // For enhanced UX, we'll add AJAX later
    });
}

// Copy joke to clipboard
function copyJoke() {
    const jokeText = document.getElementById('jokeText');
    if (jokeText) {
        navigator.clipboard.writeText(jokeText.textContent)
            .then(() => {
                // Show toast or other notification
                showToast('Joke copied to clipboard!');
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
                showToast('Failed to copy joke', 'danger');
            });
    }
}

// Copy dynamic joke to clipboard
function copyDynamicJoke() {
    if (dynamicJokeText) {
        navigator.clipboard.writeText(dynamicJokeText.textContent)
            .then(() => {
                showToast('Joke copied to clipboard!');
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
                showToast('Failed to copy joke', 'danger');
            });
    }
}

// Share joke via Web Share API if available
function shareJoke() {
    const jokeText = document.getElementById('jokeText');
    if (jokeText && navigator.share) {
        navigator.share({
            title: 'Check out this joke from JokeSmith!',
            text: jokeText.textContent,
            url: window.location.href
        })
        .then(() => console.log('Successful share'))
        .catch(error => console.log('Error sharing:', error));
    } else {
        // Fallback for browsers that don't support Web Share API
        copyJoke();
        showToast('Joke copied! You can now paste it to share.');
    }
}

// Share dynamic joke
function shareDynamicJoke() {
    if (dynamicJokeText && navigator.share) {
        navigator.share({
            title: 'Check out this joke from JokeSmith!',
            text: dynamicJokeText.textContent,
            url: window.location.href
        })
        .then(() => console.log('Successful share'))
        .catch(error => console.log('Error sharing:', error));
    } else {
        copyDynamicJoke();
        showToast('Joke copied! You can now paste it to share.');
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }

    // Create toast
    const toastElement = document.createElement('div');
    toastElement.className = `toast align-items-center text-white bg-${type} border-0`;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');

    // Toast content
    toastElement.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    // Add to container
    toastContainer.appendChild(toastElement);

    // Initialize and show toast
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 3000
    });
    toast.show();

    // Remove toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function () {
        toastElement.remove();
    });
}

// Enhanced form submission with AJAX to avoid page refresh
document.addEventListener('DOMContentLoaded', function() {
    if (jokeForm) {
        jokeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const jokeType = document.querySelector('#joke_type').value;
            const topic = document.querySelector('#topic').value;
            
            // Validate form
            if (!jokeType || !topic) {
                showToast('Please fill in all fields', 'warning');
                return;
            }
            
            // Show loading indicator
            if (loadingIndicator) loadingIndicator.classList.remove('d-none');
            if (dynamicJokeResult) dynamicJokeResult.classList.add('d-none');
            if (generateBtn) generateBtn.disabled = true;
            
            // Send AJAX request
            fetch('/generate-joke', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    joke_type: jokeType,
                    topic: topic
                })
            })
            .then(response => {
                // Always parse the JSON, even if the status code is not 200
                return response.json().then(data => {
                    // If there's an error and it's a 500, throw it to be caught by the catch block
                    if (!response.ok && !data.error) {
                        throw new Error('Network response was not ok');
                    }
                    return data;
                });
            })
            .then(data => {
                // Hide loading indicator
                if (loadingIndicator) loadingIndicator.classList.add('d-none');
                
                // Display joke
                if (data.joke) {
                    if (dynamicJokeText) dynamicJokeText.textContent = data.joke;
                    if (dynamicJokeResult) dynamicJokeResult.classList.remove('d-none');
                } else if (data.error) {
                    // Check if it's a quota error
                    if (data.error.startsWith('⚠️')) {
                        if (dynamicJokeText) {
                            dynamicJokeText.innerHTML = `<div class="alert alert-warning mb-0">${data.error}</div>`;
                            if (dynamicJokeResult) dynamicJokeResult.classList.remove('d-none');
                        }
                    } else {
                        showToast(data.error, 'danger');
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                if (loadingIndicator) loadingIndicator.classList.add('d-none');
                showToast('Failed to generate joke. Please try again.', 'danger');
            })
            .finally(() => {
                if (generateBtn) generateBtn.disabled = false;
            });
        });
    }
});
