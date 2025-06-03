// join.js - Handles room creation and joining logic

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const joinForm = document.getElementById('join-form');
    const createForm = document.getElementById('create-form');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    // Form elements
    const roomIdInput = document.getElementById('room-id');
    const usernameInput = document.getElementById('username');
    const roomNameInput = document.getElementById('room-name');
    const creatorNameInput = document.getElementById('creator-name');

    // Helper functions
    function showLoading() {
        loading.classList.remove('hidden');
        joinForm.style.display = 'none';
        createForm.style.display = 'none';
    }

    function hideLoading() {
        loading.classList.add('hidden');
        joinForm.style.display = 'block';
        createForm.style.display = 'block';
    }

    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);
    }

    function validateInput(value, fieldName) {
        if (!value || value.trim().length === 0) {
            showError(`${fieldName} is required`);
            return false;
        }
        if (value.trim().length < 2) {
            showError(`${fieldName} must be at least 2 characters long`);
            return false;
        }
        if (value.trim().length > 50) {
            showError(`${fieldName} must be less than 50 characters`);
            return false;
        }
        return true;
    }

    function sanitizeInput(input) {
        return input.trim().replace(/[<>]/g, '');
    }

    // Handle joining existing room
    joinForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const roomId = sanitizeInput(roomIdInput.value);
        const username = sanitizeInput(usernameInput.value);

        // Validate inputs
        if (!validateInput(roomId, 'Room ID')) return;
        if (!validateInput(username, 'Username')) return;

        // Additional validation for room ID format
        if (!/^[A-Z0-9]{8}$/.test(roomId.toUpperCase())) {
            showError('Room ID must be 8 characters long and contain only letters and numbers');
            return;
        }

        showLoading();

        try {
            // Check if room exists
            const response = await fetch(`/api/rooms/${roomId.toUpperCase()}`);
            const data = await response.json();

            if (!data.success) {
                hideLoading();
                showError('Room not found. Please check the Room ID and try again.');
                return;
            }

            // Store user data in sessionStorage for the room page
            sessionStorage.setItem('chatroom_user', JSON.stringify({
                username: username,
                roomId: roomId.toUpperCase()
            }));

            // Redirect to room
            window.location.href = `/room/${roomId.toUpperCase()}`;

        } catch (error) {
            hideLoading();
            console.error('Error joining room:', error);
            showError('Failed to join room. Please check your connection and try again.');
        }
    });

    // Handle creating new room
    createForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const roomName = sanitizeInput(roomNameInput.value);
        const creatorName = sanitizeInput(creatorNameInput.value);

        // Validate inputs
        if (!validateInput(roomName, 'Room name')) return;
        if (!validateInput(creatorName, 'Your name')) return;

        showLoading();

        try {
            const response = await fetch('/api/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomName: roomName,
                    createdBy: creatorName
                })
            });

            const data = await response.json();

            if (!data.success) {
                hideLoading();
                showError('Failed to create room. Please try again.');
                return;
            }

            // Store user data in sessionStorage for the room page
            sessionStorage.setItem('chatroom_user', JSON.stringify({
                username: creatorName,
                roomId: data.room.id,
                isCreator: true
            }));

            // Redirect to the new room
            window.location.href = `/room/${data.room.id}`;

        } catch (error) {
            hideLoading();
            console.error('Error creating room:', error);
            showError('Failed to create room. Please check your connection and try again.');
        }
    });

    // Auto-format room ID input
    roomIdInput.addEventListener('input', function(e) {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (value.length > 8) {
            value = value.substring(0, 8);
        }
        e.target.value = value;
    });

    // Character limit indicators
    function addCharacterCounter(input, maxLength) {
        const counter = document.createElement('div');
        counter.className = 'character-counter';
        counter.style.cssText = 'font-size: 0.8rem; color: #888; text-align: right; margin-top: 0.25rem;';
        input.parentNode.appendChild(counter);

        function updateCounter() {
            const remaining = maxLength - input.value.length;
            counter.textContent = `${remaining} characters remaining`;
            if (remaining < 10) {
                counter.style.color = '#ff6b6b';
            } else {
                counter.style.color = '#888';
            }
        }

        input.addEventListener('input', updateCounter);
        updateCounter();
    }

    // Add character counters
    addCharacterCounter(usernameInput, 50);
    addCharacterCounter(roomNameInput, 50);
    addCharacterCounter(creatorNameInput, 50);

    // Auto-focus on first input
    roomIdInput.focus();

    // Handle Enter key navigation
    roomIdInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            usernameInput.focus();
        }
    });

    usernameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            joinForm.dispatchEvent(new Event('submit'));
        }
    });

    roomNameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            creatorNameInput.focus();
        }
    });

    creatorNameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            createForm.dispatchEvent(new Event('submit'));
        }
    });

    // Handle browser back button
    window.addEventListener('popstate', function(e) {
        // Clear any stored user data if going back
        sessionStorage.removeItem('chatroom_user');
    });

    // Check if coming back from a room (handle refresh/back navigation)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('from') === 'room') {
        // Clear any stored user data
        sessionStorage.removeItem('chatroom_user');
        
        // Show a message if needed
        const message = urlParams.get('message');
        if (message) {
            showError(decodeURIComponent(message));
        }
    }

    // Prevent form submission on disabled buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.disabled) {
                e.preventDefault();
                return false;
            }
        });
    });

    // Handle connection status
    let isOnline = navigator.onLine;
    
    window.addEventListener('online', function() {
        isOnline = true;
        if (errorMessage.textContent.includes('connection')) {
            errorMessage.classList.add('hidden');
        }
    });

    window.addEventListener('offline', function() {
        isOnline = false;
        showError('You are offline. Please check your internet connection.');
    });

    // Periodically check connection
    setInterval(function() {
        if (!navigator.onLine && isOnline) {
            isOnline = false;
            showError('Connection lost. Please check your internet connection.');
        } else if (navigator.onLine && !isOnline) {
            isOnline = true;
            if (errorMessage.textContent.includes('connection')) {
                errorMessage.classList.add('hidden');
            }
        }
    }, 5000);
});