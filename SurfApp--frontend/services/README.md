# API Services - Centralized API Client

All API calls should use the centralized service in `services/api.js`. This ensures consistent error handling, authentication, and network configuration.

## Network Configuration

The API automatically detects your development server IP using Expo's `Constants.expoConfig.hostUri`. If auto-detection fails, it falls back to the manual IP in `utils/networkConfig.js`.

**If your IP changes:**

- The app will automatically detect the new IP from Expo dev server
- If it doesn't work, update `MANUAL_HOST` in `utils/networkConfig.js`

## Usage Examples

### Import the API

```javascript
import { authAPI, spotsAPI, sessionsAPI, postsAPI } from "../services/api";
```

### Authentication

```javascript
// Login
const response = await authAPI.login({ email, password });

// Get current user
const user = await authAPI.getCurrentUser();

// Update preferences
await authAPI.updatePreferences({ skillLevel: "Intermediate" });
```

### Surf Spots

```javascript
// Get spots with filters
const spots = await spotsAPI.getSpots({
  minWaveHeight: 0.5,
  maxWaveHeight: 2,
  skillLevel: "Beginner",
  userId: user.id,
});

// Get single spot
const spot = await spotsAPI.getSpotById("spot-id");

// Get forecast
const forecast = await spotsAPI.getForecast("spot-id", "daily");
```

### Surf Sessions

```javascript
// Create session
const session = await sessionsAPI.createSession({
  spotId: "spot-id",
  startTime: new Date().toISOString(),
});

// End session with rating
await sessionsAPI.endSession(sessionId, {
  endTime: new Date().toISOString(),
  rating: 4,
  notes: "Great waves!",
});

// Get user sessions
const sessions = await sessionsAPI.getSessions({ userId: user.id });
```

### Posts & Social

```javascript
// Get feed
const posts = await postsAPI.getFeed({ page: 1, limit: 10 });

// Create post
await postsAPI.createPost({
  content: "Epic session today!",
  spotId: "spot-id",
});

// Like post
await postsAPI.likePost(postId);

// Add comment
await postsAPI.addComment(postId, { content: "Nice!" });
```

### User Management

```javascript
// Get profile
const profile = await userAPI.getProfile();

// Update profile
await userAPI.updateProfile({
  name: "John Doe",
  bio: "Surf enthusiast",
});

// Search users
const users = await userAPI.searchUsers("john");

// Follow user
await userAPI.followUser(userId);
```

### Messages

```javascript
// Get conversations
const conversations = await messagesAPI.getConversations();

// Send message
await messagesAPI.sendMessage(conversationId, {
  content: "Hey, want to surf tomorrow?",
});
```

## Error Handling

The API client automatically handles:

- **401 errors**: Clears auth tokens and logs user out
- **Network errors**: Includes timeout and retry logic
- **Token injection**: Automatically adds JWT token to requests

## Configuration

- **Base URL**: Automatically configured based on platform (Android emulator, iOS device, web)
- **Timeout**: 10 seconds default
- **Headers**: JSON content-type and Bearer auth
- **Auto-retry**: Available in `data/surfApi.js` for specific endpoints

## Adding New Endpoints

To add new API endpoints, edit `services/api.js`:

```javascript
export const newAPI = {
  getItems: () => api.get("/new-endpoint"),
  createItem: (data) => api.post("/new-endpoint", data),
};
```
