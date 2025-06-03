// chat.js - Handles all chat room functionality

document.addEventListener('DOMContentLoaded', function() {
    // Socket.IO connection
    let socket = null;
    let currentUser = null;
    let currentRoom = null;
    let typingTimer = null;
    let isTyping = false;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    // DOM elements
    const roomNameEl = document.getElementById('room-name');
    const roomIdEl = document.getElementById('room-id');
    const userCountEl = document.getElementById('user-count');
    const messagesContainer = document.getElementById('messages-container');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const usersListEl = document.getElementById('users-list');
    const usersSidebar = document.getElementById('users-sidebar');
    const toggleUsersBtn = document.getElementById('toggle-users');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const leaveRoomBtn = document.getElementById('leave-room');
    const typingIndicator = document.getElementById('typing-indicator');
    const typingText = document.getElementById('typing-text');
    const connectionStatus = document.getElementById('connection-status');

    // Modal elements
    const privateMessageModal = document.getElementById('private-message-modal');
    const privateRecipient = document.getElementById('private-recipient');
    const privateMessageInput = document.getElementById('private-message-input');
    const sendPrivateBtn = document.getElementById('send-private');
    const cancelPrivateBtn = document.getElementById('cancel-private');
    const closePrivateModalBtn = document.getElementById('close-private-modal');
    const roomDeletedModal = document.getElementById('room-deleted-modal');
    const returnHomeBtn = document.getElementById('return-home');

    // Initialize
    init();

    function init() {
        // Get user data from sessionStorage
        const userData = sessionStorage.getItem('chatroom_user');
        if (!userData) {
            window.location.href = '/?from=room&message=Please join a room first';
            return;
        }

        currentUser = JSON.parse(userData);
        
        // Get room ID from URL
        const pathParts = window.location.pathname.split('/');
        const roomId = pathParts[pathParts.length - 1];
        
        if (!roomId || roomId === 'room') {
            window.location.href = '/?from=room&message=Invalid room URL';
            return;
        }

        currentUser.roomId = roomId;
        initializeSocket();
        setupEventListeners();
    }

    function initializeSocket() {
        // Initialize Socket.IO connection
        socket = io({
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: maxReconnectAttempts,
            timeout: 20000
        });

        // Socket event listeners
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('reconnect', handleReconnect);
        socket.on('reconnect_error', handleReconnectError);
        socket.on('room-joined', handleRoomJoined);
        socket.on('new-message', handleNewMessage);
        socket.on('user-joined', handleUserJoined);
        socket.on('user-left', handleUserLeft);
        socket.on('user-typing', handleUserTyping);
        socket.on('private-message', handlePrivateMessage);
        socket.on('private-message-sent', handlePrivateMessageSent);
        socket.on('room-deleted', handleRoomDeleted);
        socket.on('error', handleSocketError);
    }

    function setupEventListeners() {
        // Send message
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Typing indicator
        messageInput.addEventListener('input', handleTypingInput);
        messageInput.addEventListener('blur', stopTyping);

        // UI interactions
        toggleUsersBtn.addEventListener('click', toggleUsersSidebar);
        closeSidebarBtn.addEventListener('click', closeUsersSidebar);
        leaveRoomBtn.addEventListener('click', leaveRoom);

        // Private message modal
        sendPrivateBtn.addEventListener('click', sendPrivateMessage);
        cancelPrivateBtn.addEventListener('click', closePrivateMessageModal);
        closePrivateModalBtn.addEventListener('click', closePrivateMessageModal);
        returnHomeBtn.addEventListener('click', () => window.location.href = '/');

        // Close modal when clicking outside
        privateMessageModal.addEventListener('click', function(e) {
            if (e.target === privateMessageModal) {
                closePrivateMessageModal();
            }
        });

        roomDeletedModal.addEventListener('click', function(e) {
            if (e.target === roomDeletedModal) {
                window.location.href = '/';
            }
        });

        // Handle window events
        window.addEventListener('beforeunload', function() {
            if (socket) {
                socket.disconnect();
            }
        });

        // Handle visibility change (tab switching)
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden && socket && !socket.connected) {
                socket.connect();
            }
        });
    }

    // Socket event handlers
    function handleConnect() {
        console.log('Connected to server');
        hideConnectionStatus();
        reconnectAttempts = 0;
        
        // Join the room
        socket.emit('join-room', {
            roomId: currentUser.roomId,
            username: currentUser.username
        });
    }

    function handleDisconnect(reason) {
        console.log('Disconnected:', reason);
        showConnectionStatus('Disconnected', false);
        
        if (reason === 'io server disconnect') {
            // Server disconnected, try to reconnect
            socket.connect();
        }
    }

    function handleReconnect() {
        console.log('Reconnected to server');
        showConnectionStatus('Reconnected', true);
        setTimeout(hideConnectionStatus, 2000);
        
        // Rejoin the room
        socket.emit('join-room', {
            roomId: currentUser.roomId,
            username: currentUser.username
        });
    }

    function handleReconnectError(error) {
        console.error('Reconnection failed:', error);
        reconnectAttempts++;
        
        if (reconnectAttempts >= maxReconnectAttempts) {
            showConnectionStatus('Connection failed', false);
        } else {
            showConnectionStatus('Reconnecting...', false);
        }
    }

    function handleRoomJoined(data) {
        currentRoom = data.room;
        
        // Update UI
        roomNameEl.textContent = currentRoom.name;
        roomIdEl.textContent = currentRoom.id;
        updateUsersList(currentRoom.users);
        
        // Load previous messages
        if (data.messages && data.messages.length > 0) {
            data.messages.forEach(message => {
                displayMessage(message);
            });
        }
        
        // Show welcome message
        displaySystemMessage(`Welcome to ${currentRoom.name}!`);
    }

    function handleNewMessage(message) {
        displayMessage(message);
        playNotificationSound();
    }

    function handleUserJoined(data) {
        updateUsersList(data.users);
        displaySystemMessage(`${data.username} joined the room`);
    }

    function handleUserLeft(data) {
        updateUsersList(data.users);
        displaySystemMessage(`${data.username} left the room`);
    }

    function handleUserTyping(data) {
        if (data.isTyping) {
            showTypingIndicator(data.username);
        } else {
            hideTypingIndicator();
        }
    }

    function handlePrivateMessage(message) {
        displayPrivateMessage(message, false);
        playNotificationSound();
    }

    function handlePrivateMessageSent(message) {
        displayPrivateMessage(message, true);
    }

    function handleRoomDeleted(data) {
        displaySystemMessage(data.message);
        showRoomDeletedModal();
    }

    function handleSocketError(error) {
        console.error('Socket error:', error);
        displaySystemMessage(`Error: ${error.message}`, 'error');
    }

    // Message handling
    function sendMessage() {
        const message = messageInput.value.trim();
        if (!message || !socket || !socket.connected) return;

        socket.emit('send-message', {
            message: message,
            type: 'text'
        });

        messageInput.value = '';
        stopTyping();
        messageInput.focus();
    }

    function sendPrivateMessage() {
        const message = privateMessageInput.value.trim();
        const recipient = privateRecipient.dataset.socketId;
        
        if (!message || !recipient) return;

        socket.emit('private-message', {
            targetSocketId: recipient,
            message: message
        });

        privateMessageInput.value = '';
        closePrivateMessageModal();
    }

    function displayMessage(message) {
        const messageEl = createMessageElement(message);
        messagesContainer.appendChild(messageEl);
        scrollToBottom();
    }

    function displayPrivateMessage(message, isSent) {
        const messageEl = createPrivateMessageElement(message, isSent);
        messagesContainer.appendChild(messageEl);
        scrollToBottom();
    }

    function displaySystemMessage(text, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `system-message ${type}`;
        messageEl.textContent = text;
        messagesContainer.appendChild(messageEl);
        scrollToBottom();
    }

    function createMessageElement(message) {
        const messageEl = document.createElement('div');
        const isOwnMessage = message.socketId === socket.id;
        messageEl.className = `message ${isOwnMessage ? 'own' : ''}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = message.username.charAt(0).toUpperCase();

        const content = document.createElement('div');
        content.className = 'message-content';

        const header = document.createElement('div');
        header.className = 'message-header';

        const username = document.createElement('span');
        username.className = 'message-username';
        username.textContent = message.username;

        const time = document.createElement('span');
        time.className = 'message-time';
        time.textContent = formatTime(new Date(message.timestamp));

        header.appendChild(username);
        header.appendChild(time);

        const text = document.createElement('div');
        text.className = 'message-text';
        text.textContent = message.message;

        content.appendChild(header);
        content.appendChild(text);

        messageEl.appendChild(avatar);
        messageEl.appendChild(content);

        return messageEl;
    }

    function createPrivateMessageElement(message, isSent) {
        const messageEl = document.createElement('div');
        messageEl.className = `message private-message ${isSent ? 'own' : ''}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = (isSent ? message.to : message.from).charAt(0).toUpperCase();

        const content = document.createElement('div');
        content.className = 'message-content';

        const header = document.createElement('div');
        header.className = 'message-header';

        const username = document.createElement('span');
        username.className = 'message-username';
        username.textContent = `${isSent ? 'To' : 'From'} ${isSent ? message.to : message.from}`;

        const time = document.createElement('span');
        time.className = 'message-time';
        time.textContent = formatTime(new Date(message.timestamp));

        const privateLabel = document.createElement('span');
        privateLabel.className = 'private-label';
        privateLabel.textContent = 'Private';
        privateLabel.style.cssText = 'background: #ff6b6b; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem; margin-left: 8px;';

        header.appendChild(username);
        header.appendChild(privateLabel);
        header.appendChild(time);

        const text = document.createElement('div');
        text.className = 'message-text';
        text.textContent = message.message;

        content.appendChild(header);
        content.appendChild(text);

        messageEl.appendChild(avatar);
        messageEl.appendChild(content);

        return messageEl;
    }

    // Typing indicator
    function handleTypingInput() {
        if (!isTyping) {
            isTyping = true;
            socket.emit('typing', { isTyping: true });
        }

        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            stopTyping();
        }, 1500);
    }

    function stopTyping() {
        if (isTyping) {
            isTyping = false;
            socket.emit('typing', { isTyping: false });
        }
        clearTimeout(typingTimer);
    }

    function showTypingIndicator(username) {
        typingText.textContent = `${username} is typing...`;
        typingIndicator.classList.remove('hidden');
        scrollToBottom();
    }

    function hideTypingIndicator() {
        typingIndicator.classList.add('hidden');
    }

    // Users list management
    function updateUsersList(users) {
        userCountEl.textContent = users.length;
        usersListEl.innerHTML = '';

        users.forEach(user => {
            const userEl = createUserElement(user);
            usersListEl.appendChild(userEl);
        });
    }

    function createUserElement(user) {
        const userEl = document.createElement('div');
        userEl.className = 'user-item';
        userEl.dataset.socketId = user.id;

        const avatar = document.createElement('div');
        avatar.className = 'user-avatar';
        avatar.textContent = user.username.charAt(0).toUpperCase();

        const info = document.createElement('div');
        info.className = 'user-info';

        const name = document.createElement('div');
        name.className = 'user-name';
        name.textContent = user.username;

        const status = document.createElement('div');
        status.className = 'user-status';
        status.textContent = user.id === socket.id ? 'You' : 'Online';

        info.appendChild(name);
        info.appendChild(status);

        userEl.appendChild(avatar);
        userEl.appendChild(info);

        // Add click handler for private messaging
        if (user.id !== socket.id) {
            userEl.addEventListener('click', () => {
                openPrivateMessageModal(user);
            });
            userEl.style.cursor = 'pointer';
        }

        return userEl;
    }

    // UI helpers
    function toggleUsersSidebar() {
        usersSidebar.classList.toggle('active');
    }

    function closeUsersSidebar() {
        usersSidebar.classList.remove('active');
    }

    function openPrivateMessageModal(user) {
        privateRecipient.textContent = user.username;
        privateRecipient.dataset.socketId = user.id;
        privateMessageModal.classList.remove('hidden');
        privateMessageInput.focus();
        closeUsersSidebar();
    }

    function closePrivateMessageModal() {
        privateMessageModal.classList.add('hidden');
        privateMessageInput.value = '';
    }

    function showRoomDeletedModal() {
        roomDeletedModal.classList.remove('hidden');
    }

    function leaveRoom() {
        if (confirm('Are you sure you want to leave this room?')) {
            sessionStorage.removeItem('chatroom_user');
            window.location.href = '/';
        }
    }

    function showConnectionStatus(message, isConnected) {
        connectionStatus.querySelector('span').textContent = message;
        connectionStatus.className = `connection-status ${isConnected ? 'connected' : ''}`;
        connectionStatus.classList.remove('hidden');
    }

    function hideConnectionStatus() {
        connectionStatus.classList.add('hidden');
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function formatTime(date) {
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    function playNotificationSound() {
        // Create a subtle notification sound
        if ('AudioContext' in window || 'webkitAudioContext' in window) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);
            } catch (error) {
                // Fail silently if audio context is not available
                console.log('Audio notification not available');
            }
        }
    }

    // Handle page visibility for notifications
    let unreadCount = 0;
    const originalTitle = document.title;

    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            unreadCount = 0;
            document.title = originalTitle;
        }
    });

    // Update unread count when new messages arrive
    function updateUnreadCount() {
        if (document.hidden) {
            unreadCount++;
            document.title = `(${unreadCount}) ${originalTitle}`;
        }
    }

    // Modify message handlers to update unread count
    const originalHandleNewMessage = handleNewMessage;
    handleNewMessage = function(message) {
        originalHandleNewMessage(message);
        updateUnreadCount();
    };

    const originalHandlePrivateMessage = handlePrivateMessage;
    handlePrivateMessage = function(message) {
        originalHandlePrivateMessage(message);
        updateUnreadCount();
    };
});