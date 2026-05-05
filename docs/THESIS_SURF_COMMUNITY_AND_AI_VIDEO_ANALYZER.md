# Thesis Documentation: Surf Community and AI Video Analyzer Modules

## 1. Chapter Overview

This document presents the two modules I implemented in the Surf Ceylon project:

1. Surf Community Module
2. AI Video Analyzer Module

The objective of this chapter is to provide a complete technical explanation so that another developer can reproduce, extend, and maintain these modules with minimal ambiguity.

---

## 2. Project Context

Surf Ceylon is a full-stack mobile platform for surfers in Sri Lanka. It combines social networking, surf forecasting, safety analytics, and AI-based training support.

My contribution focuses on:

- Community interaction infrastructure (feed, engagement, follow graph, direct messaging, moderation hooks)
- AI-powered surf video technique analysis pipeline (mobile upload -> backend orchestration -> Python ML inference -> personalized feedback)

---

## 3. Technology Stack Used for My Modules

### 3.1 Frontend (Mobile)

- React Native + Expo Router
- Axios for REST API integration
- AsyncStorage for JWT token persistence
- Expo Image Picker / Media permissions for media and video selection
- NativeWind/Tailwind utility classes for styling

### 3.2 Backend

- Node.js + Express
- MongoDB + Mongoose
- JWT auth middleware
- Multer for media/video upload handling
- Express Validator for input validation

### 3.3 ML Engine (Video Analyzer)

- Python 3.x
- OpenCV for frame decoding
- MediaPipe Pose Landmarker for pose extraction
- Scikit-learn Random Forest model for classification
- Optional YOLOv8 gatekeeper for surfboard presence validation

---

## 4. High-Level Architecture of the Implemented Modules

### 4.1 Surf Community Data Flow

1. User authenticates and receives JWT.
2. Mobile app calls protected community APIs with Bearer token.
3. Express routes validate request and pass to controllers.
4. Controllers read/write MongoDB documents (User, Follow, Post, Comment, Conversation, Message).
5. Response payloads are normalized for app rendering.
6. Toxicity checks are triggered for text content in posts/comments/messages.

### 4.2 AI Video Analyzer Data Flow

1. User opens AI Video Analyzer screen and selects a video from gallery.
2. App validates basic constraints (e.g., 50MB max).
3. App uploads file to `POST /api/video-analysis/analyze` as multipart/form-data.
4. Backend stores temporary video in `uploads/videos` via Multer.
5. Backend spawns Python service script with video path argument.
6. Python service:
   - Optionally validates video as surf-related using YOLO (surfboard detection).
   - Extracts pose features with MediaPipe (fallback to basic visual-motion features).
   - Loads `surf_model.pkl` and `label_encoder.pkl`.
   - Classifies surf technique and generates personalized feedback.
7. Python emits JSON to stdout; Node parses JSON and returns API response.
8. Temporary uploaded video file is deleted by backend cleanup logic.

---

## 5. Detailed Implementation: Surf Community Module

## 5.1 Functional Scope Implemented

The Surf Community module includes the following implemented capabilities:

1. Personalized feed retrieval from followed users + own posts
2. Post creation (text and media)
3. Engagement actions: like and share
4. Comment system with replies support and moderation checks
5. Update/delete controls with ownership and role-based authorization
6. Follow/unfollow system with support for private-account follow requests
7. 1-to-1 direct messaging (conversation lifecycle + message CRUD)
8. User discovery/search within app workflows (search and messageable users)

## 5.2 Backend Routes and Controllers

### 5.2.1 Post and Comment APIs

Main route group: `/api/posts`

Key endpoints implemented:

- `GET /feed` -> personalized feed
- `GET /:postId` -> single post
- `GET /user/:userId` -> posts by profile
- `POST /` -> create text post
- `POST /with-media` -> create media post (up to 5 files)
- `POST /:postId/like` -> toggle like
- `POST /:postId/share` -> share post
- `POST /:postId/comments` -> add comment
- `GET /:postId/comments` -> list comments
- `PUT /comments/:commentId` -> edit comment
- `DELETE /comments/:commentId` -> delete comment
- `PUT /:postId` -> edit post
- `DELETE /:postId` -> delete post

Important implementation details:

- Input validation via `express-validator`
- Authorization via `auth` middleware
- Toxicity check before creating posts/comments
- For updates, toxicity is checked and returned in payload (currently after update save)
- Comment deletion is allowed for comment author or post owner
- Post deletion is allowed for owner or admin

### 5.2.2 Follow System APIs

Main route group: `/api/follow`

Endpoints implemented:

- `POST /:userId` -> follow user
- `DELETE /:userId` -> unfollow user
- `GET /:userId/followers` -> list followers
- `GET /:userId/following` -> list following
- `GET /requests` -> pending follow requests
- `POST /requests/:requestId/accept` -> accept request
- `POST /requests/:requestId/reject` -> reject request

Important implementation details:

- Self-follow prevention
- Duplicate follow prevention via compound unique index in `Follow` model
- Private account logic: create follow in `pending` state
- Public account logic: immediate `accepted` status and follower/following arrays update

### 5.2.3 Messaging APIs

Main route group: `/api/messages`

Endpoints implemented:

- `GET /conversations` -> get user conversations
- `GET /messageable-users` -> users eligible for chat
- `POST /conversations` -> create/get direct conversation
- `POST /business-conversations` -> business account conversation flow
- `GET /conversations/:conversationId` -> list messages with pagination
- `POST /conversations/:conversationId` -> send message
- `POST /:messageId/read` -> mark message read
- `PUT /:messageId` -> edit message
- `DELETE /:messageId` -> soft-delete message
- `DELETE /conversations/:conversationId` -> hard-delete conversation + messages

Important implementation details:

- Standard users require mutual follow relation for DMs
- Business account path allows communication without strict mutual-follow gate
- Conversation list is transformed for frontend (other participant + last message)
- Toxicity check runs for text messages before saving

## 5.3 Data Model Design (Community)

### 5.3.1 User Model

Relevant fields used by community feature:

- profile identity: `name`, `username`, `profilePicture`, `bio`
- privacy: `isPrivate`
- verification: `isVerified`
- social graph arrays: `followers[]`, `following[]`
- account type: `Personal` or `Business`
- role: `user` or `admin` (authorization path for moderation/delete)

### 5.3.2 Follow Model

Core structure:

- `follower` (User ref)
- `following` (User ref)
- `status` in `{pending, accepted, blocked}`
- unique compound index `(follower, following)`

### 5.3.3 Post Model

Core structure:

- `content`, `images[]`, `author`
- `likes[]`, `shares[]`, `comments[]`
- virtual counters: `likeCount`, `shareCount`, `commentCount`
- `isPublic` gate

### 5.3.4 Comment Model

Core structure:

- `content`, `author`, `post`
- `parentComment` for thread replies
- `replies[]`
- `likes[]`

### 5.3.5 Conversation + Message Models

Conversation:

- `participants[]`
- `lastMessage`
- `lastActivity`
- `isGroup` / `groupName` / `createdBy`

Message:

- `content`, `sender`, `conversation`
- `messageType`, `attachments[]`
- `readBy[]`
- `edited`, `editedAt`
- `deletedAt` (soft delete)

## 5.4 Frontend Integration (Community)

### 5.4.1 Community Feed Screen

The community tab screen implements:

- feed fetch with refresh and pagination
- create post modal with text and optional media
- image/camera integration through Expo Image Picker
- post engagement actions (likes/comments)
- user search with debounce behavior
- toxicity-related error handling from backend responses

### 5.4.2 Messenger and Chat Screens

Messenger screen features:

- conversation listing
- participant search for new conversation
- long-press action to delete conversation

Chat screen features:

- fetch paginated message history
- send/edit/delete own messages
- grouped timeline rendering with date separators
- role-based action menu (only own messages editable)

---

## 6. Detailed Implementation: AI Video Analyzer Module

## 6.1 Functional Scope Implemented

1. Mobile UI for selecting and uploading surf videos
2. Secure backend upload endpoint with auth, file-type filtering, and size limits
3. Python inference orchestration from Node backend
4. Multi-stage ML pipeline:
   - Surfboard validation (YOLO-based gatekeeper)
   - Pose landmark extraction (MediaPipe)
   - Technique classification (Random Forest)
   - Feedback generation (rating, strengths, suggestions, next steps)
5. Structured JSON result contract and frontend rendering
6. Health check endpoint for script/model readiness

## 6.2 Backend API and Validation

Route group: `/api/video-analysis`

Endpoints:

- `POST /analyze` (auth required)
- `GET /history` (placeholder; returns empty with coming-soon message)
- `GET /health` (readiness check)

Upload configuration:

- Multer disk storage to `uploads/videos`
- accepted MIME types: MP4, MOV, AVI, WEBM
- max size: 50MB

Controller safeguards:

- missing file rejection
- extension + size checks
- Python stderr capture for diagnostics
- JSON extraction from mixed stdout logs
- robust cleanup of temporary uploaded file

Special handling:

- If Python returns `success: false` with code `NOT_SURFING_VIDEO`, API returns 400 and frontend shows targeted user guidance.

## 6.3 Python ML Pipeline Logic

Implemented in the video analyzer service layer:

### 6.3.1 Stage A: Surfboard Presence Validation

- YOLOv8 (`yolov8n.pt`) scans sampled frames
- target class id: surfboard (`37`)
- confidence threshold around 0.20
- if no surfboard is found after configured checks, analysis is rejected early

This gate reduces false analyses on irrelevant videos.

### 6.3.2 Stage B: Pose / Feature Extraction

Primary path:

- MediaPipe Pose Landmarker extracts 33 landmarks/frame
- each landmark contributes `(x, y, z, visibility)` features
- frame sequence up to configured max (e.g., 300)

Fallback path:

- if MediaPipe unavailable or fails, extract basic motion/intensity features via frame differencing in OpenCV

### 6.3.3 Stage C: Classification

- load `surf_model.pkl` + `label_encoder.pkl`
- aggregate sequence with statistical features (mean/std/min/max)
- infer class probabilities and top label
- include confidence and alternative-class probabilities
- include metadata fields (`frames_analyzed`, motion indicators)

### 6.3.4 Stage D: Feedback Generation

Generated output includes:

- rating (`excellent`, `good`, etc.)
- message
- strengths list
- suggestions list
- next steps list
- confidence note when uncertain
- alternative probable techniques

## 6.4 Frontend Integration (AI Video Analyzer Screen)

Main frontend behavior:

1. Request media library permission
2. Pick video from gallery
3. Check size threshold before upload
4. Upload with progress callback and loading state
5. Parse API response and render:
   - detected technique
   - confidence
   - frame count
   - strengths / suggestions / next steps
   - alternative detections and notes
6. Handle non-surfing rejection with explicit alert

This provides a complete end-user feedback loop from capture to interpretable coaching output.

---

## 7. Toxicity Moderation Integration (Cross-cutting Community Safety)

A Python CLI toxicity classifier is integrated into backend moderation flow through `toxicityChecker.js`.

Implemented checks:

- post text creation path
- comment creation path
- message sending path

Current behavior:

- if toxicity service fails/unavailable, backend defaults to non-toxic response (fail-open approach)
- confidence score is returned and surfaced in rejection paths

This design prioritizes availability while still enforcing moderation where service is healthy.

---

## 8. Security, Validation, and Reliability Considerations

## 8.1 Security Controls Implemented

- JWT-protected endpoints for write operations
- ownership/role checks for edit/delete actions
- strict upload limits and MIME filters
- express-validator request payload checks

## 8.2 Reliability Controls Implemented

- temporary file cleanup after video processing
- explicit health endpoint for analyzer dependency checks
- pagination for heavy list APIs (feed/comments/messages)
- structured error responses for frontend handling

## 8.3 Noted Implementation Caveats

1. `Post` schema defines `content` as required, while controller allows media-only posts. This can cause validation mismatch unless content is still sent.
2. Some update flows check toxicity after persisting update instead of blocking before save.
3. Message unread count is currently placeholder (`unreadCount: 0` with TODO).
4. AI video history endpoint is scaffolded but not yet persisted.
5. Python requirements file does not currently pin all video-analyzer runtime libraries (e.g., MediaPipe/Ultralytics), so environment setup must include them explicitly.

---

## 9. Reproducibility Guide (How Another Developer Can Rebuild These Parts)

## 9.1 Clone and Install

1. Backend:

```bash
cd surfapp--backend
npm install
```

2. Frontend:

```bash
cd SurfApp--frontend
npm install
```

3. ML Engine:

```bash
cd surfapp--ml-engine
pip install -r requirements.txt
pip install mediapipe opencv-python ultralytics
```

## 9.2 Required Model Assets

Place in `surfapp--ml-engine/models/`:

- `surf_model.pkl`
- `label_encoder.pkl`
- `pose_landmarker_lite.task` (auto-download may occur in code)

YOLO weights expected:

- `yolov8n.pt` (available at ML engine root in current project)

## 9.3 Runtime Configuration

- Configure backend `.env` with MongoDB and JWT settings.
- Ensure backend can resolve Python executable path through:
  - `PYTHON_PATH` env var, or
  - default venv path resolution in backend config.

## 9.4 Run Services

1. Start backend API:

```bash
cd surfapp--backend
npm run dev
```

2. Start frontend app:

```bash
cd SurfApp--frontend
npm start
```

## 9.5 Verification Tests

Community checks:

1. Register/login two users
2. Follow/unfollow cycle and private follow request path
3. Create posts (text + media), like/share/comment lifecycle
4. Open messenger, create conversation, send/edit/delete message

AI analyzer checks:

1. `GET /api/video-analysis/health` should report model/script readiness
2. Upload valid surfing clip (<50MB) and confirm classification feedback
3. Upload non-surfing video and confirm `NOT_SURFING_VIDEO` rejection flow
4. Confirm temporary file removal in uploads path after completion

---

## 10. Contribution Summary (What I Completed)

### Surf Community

- Designed and implemented social feed APIs with post engagement and comments.
- Implemented follow graph logic including pending requests for private accounts.
- Implemented direct messaging system with conversation management and message CRUD.
- Integrated toxicity moderation checks into community text workflows.
- Implemented mobile UI flows for feed, interaction, user search, messenger, and chat.

### AI Video Analyzer

- Implemented secure video upload API and backend Python orchestration.
- Implemented Python analysis pipeline with YOLO gatekeeping + MediaPipe + Random Forest inference.
- Implemented explainable feedback generation from model output.
- Implemented frontend analyzer screen with upload progress, result rendering, and specific rejection handling.
- Implemented health diagnostics endpoint for analyzer readiness.

---

## 11. Suggested Future Improvements

1. Persist AI analysis history per user and build progress trend charts.
2. Add websocket-based real-time updates for long-running video analysis.
3. Enforce toxicity checks before update persistence in all update paths.
4. Complete unread message counting logic and notification indicators.
5. Standardize dependency pinning for MediaPipe/Ultralytics in requirements.
6. Add automated integration tests for upload + Python inference path.

---

## 12. Conclusion

The Surf Community and AI Video Analyzer modules provide both social engagement and AI-driven skill improvement within the same surf ecosystem. The community features increase retention and interaction, while the analyzer contributes personalized coaching value. Together, these modules establish a practical and extensible foundation for data-driven surf training and community-led growth in the Surf Ceylon platform.
