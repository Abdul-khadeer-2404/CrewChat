# Real-Time Chatroom App

A simple, real-time chatroom application built with Node.js, Express, and Socket.IO.

## Features

- Join chatrooms with a username
- Real-time messaging
- User join/leave notifications
- Online user list
- Clean, responsive UI
- Multiple room support

## Project Structure

```
chatroom-app/
├── backend/
│   ├── server.js          # Express server with Socket.IO
│   ├── package.json       # Dependencies and scripts
│   └── .gitignore        # Git ignore file
├── frontend/
│   ├── index.html        # Landing/join page
│   ├── room.html         # Chat room interface
│   ├── css/
│   │   └── styles.css    # Styling for the app
│   ├── js/
│   │   ├── join.js       # Join room logic
│   │   └── chat.js       # Chat functionality
│   └── assets/
│       └── (images/icons)
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Steps

1. **Clone or download the project**
   ```bash
   cd chatroom-app
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Open your browser and navigate to:**
   ```
   http://localhost:3000
   ```

## How to Use

1. **Join a Room:**
   - Enter your username
   - Enter a room name (or use an existing one)
   - Click "Join Room"

2. **Chat:**
   - Type messages in the input field
   - Press Enter or click Send
   - See real-time messages from other users
   - View who's online in the sidebar

3. **Leave:**
   - Close the browser tab or click "Leave Room"
   - Other users will be notified you left

## API Endpoints

- `GET /` - Serves the join page
- `GET /room` - Serves the chat room page
- `GET /css/styles.css` - Serves CSS file
- `GET /js/*.js` - Serves JavaScript files

## Socket Events

### Client to Server:
- `join-room` - Join a specific room
- `send-message` - Send a message to the room
- `disconnect` - Leave the room

### Server to Client:
- `user-joined` - Notify when user joins
- `user-left` - Notify when user leaves
- `receive-message` - Receive new messages
- `room-users` - Get list of users in room

## Technologies Used

- **Backend:** Node.js, Express.js, Socket.IO
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Real-time Communication:** WebSockets via Socket.IO

## Development

To run in development mode with auto-restart:
```bash
cd backend
npm run dev
```

## Deployment

For production deployment:

1. Set environment variables:
   ```bash
   export PORT=3000
   export NODE_ENV=production
   ```

2. Install production dependencies:
   ```bash
   npm install --production
   ```

3. Start the server:
   ```bash
   npm start
   ```

## Customization

- **Styling:** Modify `frontend/css/styles.css`
- **Client Logic:** Edit files in `frontend/js/`
- **Server Logic:** Modify `backend/server.js`
- **Add Features:** Extend socket events and handlers

## Troubleshooting

**Port already in use:**
- Change the PORT in server.js or set environment variable
- Kill existing processes: `pkill -f node`

**Connection issues:**
- Check if server is running on correct port
- Ensure firewall allows the port
- Verify Socket.IO client/server versions match

**Messages not appearing:**
- Check browser console for errors
- Verify network connectivity
- Ensure room names match exactly

## License

MIT License - Feel free to use and modify as needed.