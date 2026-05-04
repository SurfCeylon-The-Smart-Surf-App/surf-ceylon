# Comprehensive Guide: Surf Community & AI Video Analyzer

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Surf Community Module](#surf-community-module)
5. [AI Video Analyzer Module](#ai-video-analyzer-module)
6. [Integration Flow](#integration-flow)
7. [Setup & Deployment](#setup--deployment)

---

## Project Overview

**Surf Ceylon** is a comprehensive full-stack mobile platform designed for the surfing community in Sri Lanka. It integrates:

- **Social Networking**: User profiles, feeds, posts, comments, direct messaging
- **Community Features**: Follow system, content engagement, community moderation
- **AI Training Support**: Video analysis for technique improvement

This document provides comprehensive details on these core features through two major modules:

1. **Surf Community Module** - Social networking and community interaction
2. **AI Video Analyzer Module** - ML-powered video analysis for technique coaching

---

## Technology Stack

### Frontend (React Native + Expo)

| Technology           | Purpose                           | Version |
| -------------------- | --------------------------------- | ------- |
| React Native         | Cross-platform mobile development | Latest  |
| Expo Router          | Navigation and routing            | Latest  |
| NativeWind/Tailwind  | Utility-based styling             | Latest  |
| Axios                | HTTP client for API calls         | ^1.13.2 |
| AsyncStorage         | Local JWT token storage           | Latest  |
| Expo Image Picker    | Media/video selection             | Latest  |
| Expo Document Picker | File selection                    | Latest  |

### Backend (Node.js + Express)

| Technology        | Purpose               | Version      |
| ----------------- | --------------------- | ------------ |
| Node.js           | JavaScript runtime    | Latest       |
| Express           | REST API framework    | ^4.18.2      |
| MongoDB           | NoSQL database        | Via Mongoose |
| Mongoose          | MongoDB ODM           | ^7.5.0       |
| Multer            | File upload handling  | ^2.0.2       |
| JWT               | Authentication tokens | ^9.0.2       |
| bcryptjs          | Password hashing      | ^2.4.3       |
| express-validator | Request validation    | ^7.0.1       |
| Cors              | Cross-origin requests | ^2.8.5       |
| Morgan            | HTTP logging          | ^1.10.0      |

### ML Engine (Python)

| Technology   | Purpose                     | Version   |
| ------------ | --------------------------- | --------- |
| Python       | Language                    | 3.x       |
| MediaPipe    | Pose detection              | 0.10.14   |
| OpenCV       | Video processing            | 4.11.0.86 |
| Scikit-learn | Random Forest model         | 1.8.0     |
| NumPy        | Numerical computing         | 1.26.4    |
| Pandas       | Data processing             | 2.2.3     |
| TensorFlow   | Deep learning framework     | 2.18.0    |
| YOLOv8       | Object detection (optional) | Latest    |

---

## Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          SURF CEYLON PLATFORM                       │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      MOBILE APPLICATION LAYER                    │
│                  (React Native + Expo Router)                    │
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │  Community Tab  │  │  AI Video        │  │  Other Features │ │
│  │  - Feed         │  │  Analyzer        │  │  - Forecast     │ │
│  │  - Posts        │  │  - Upload Video  │  │  - Spots        │ │
│  │  - Messages     │  │  - Get Feedback  │  │  - Hazards      │ │
│  │  - Follow       │  │  - View Results  │  │  - Progress     │ │
│  └─────────────────┘  └──────────────────┘  └─────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                              │
                      Axios (HTTP Client)
                      JWT Authentication
                              │
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND API LAYER                              │
│                (Node.js + Express + MongoDB)                     │
│                                                                   │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │  Community Routes    │  │  Video Analysis Routes           │ │
│  ├──────────────────────┤  ├──────────────────────────────────┤ │
│  │ POST /api/posts      │  │ POST /api/video-analysis/analyze │ │
│  │ POST /api/comments   │  │ GET  /api/video-analysis/history │ │
│  │ POST /api/follow     │  │ GET  /api/video-analysis/health  │ │
│  │ POST /api/messages   │  │                                  │ │
│  └──────────────────────┘  └──────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │            Authentication Middleware (JWT)              │    │
│  │            Request Validation (express-validator)       │    │
│  │            Multer (File Upload Handler)                 │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                              │
                    Child Process (spawn)
                       Upload Storage
                              │
┌──────────────────────────────────────────────────────────────────┐
│                       ML ENGINE LAYER                             │
│                     (Python Services)                             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │      surf_pose_analyzer_service.py                       │    │
│  ├──────────────────────────────────────────────────────────┤    │
│  │  1. Video Input                                          │    │
│  │     └─ OpenCV video loading                              │    │
│  │  2. Pose Detection (MediaPipe)                           │    │
│  │     └─ 33 body landmarks per frame                       │    │
│  │  3. Feature Aggregation                                  │    │
│  │     └─ Statistical features (mean, std, min, max)        │    │
│  │  4. Classification (Random Forest)                       │    │
│  │     └─ Technique identification + confidence             │    │
│  │  5. Feedback Generation                                  │    │
│  │     └─ Rating, strengths, suggestions, next steps        │    │
│  │  6. JSON Output                                          │    │
│  │     └─ stdout for Node.js capture                        │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                              │
                       Data Models
                              │
┌──────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                               │
│                        (MongoDB)                                  │
│                                                                   │
│  Collections:                                                     │
│  • Users (profiles, authentication)                              │
│  • Posts (content, media, engagement)                            │
│  • Comments (replies, threads)                                   │
│  • Follows (social graph, relationships)                         │
│  • Conversations (1-to-1 messaging)                              │
│  • Messages (chat history)                                       │
│  • VideoAnalyses (analysis history, results)                     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Surf Community Module

### 1. Overview

The **Surf Community Module** provides a complete social networking infrastructure for the Surf Ceylon platform. It enables surfers to connect, share experiences, engage with content, and communicate with each other.

### 2. Core Features

#### 2.1 Feed System

- **Personalized Feed**: Displays posts from users that the current user follows, plus their own posts
- **Feed Retrieval**: Paginated endpoint with sorting by recency
- **Media Support**: Text and image-based posts
- **Engagement Metrics**: Real-time like and share counts

**Key Functions:**

```javascript
GET /api/posts/feed
- Returns paginated feed of followed users' posts
- Includes: author info, content, images, engagement counts
- Supports: pagination, filtering
```

#### 2.2 Post Management

**Create Posts:**

- Text-only posts
- Posts with up to 5 media attachments
- Automatic toxicity checking
- Author metadata capture

**Key Functions:**

```javascript
POST /api/posts/              // Create text post
POST /api/posts/with-media    // Create media post
GET  /api/posts/:postId       // Get single post
GET  /api/posts/user/:userId  // Get user's posts
PUT  /api/posts/:postId       // Edit post
DELETE /api/posts/:postId     // Delete post
```

**Engagement Actions:**

```javascript
POST   /api/posts/:postId/like    // Toggle like
POST   /api/posts/:postId/share   // Share post
POST   /api/posts/:postId/comments// Add comment
GET    /api/posts/:postId/comments// Get comments
```

#### 2.3 Comment System

- **Nested Replies**: Support for comment threads
- **Ownership Controls**: Comment author can edit/delete
- **Toxicity Moderation**: Checks before comment creation
- **Like Support**: Comments can be liked

**Key Functions:**

```javascript
POST   /api/posts/:postId/comments         // Add comment
GET    /api/posts/:postId/comments         // List comments
PUT    /api/comments/:commentId            // Edit comment
DELETE /api/comments/:commentId            // Delete comment
```

#### 2.4 Follow System

**Features:**

- Follow/unfollow users
- Private account support (pending follow requests)
- View followers and following lists
- Accept/reject follow requests
- Follower/following arrays maintained in User model

**Key Functions:**

```javascript
POST   /api/follow/:userId                 // Follow user
DELETE /api/follow/:userId                 // Unfollow user
GET    /api/follow/:userId/followers       // List followers
GET    /api/follow/:userId/following       // List following
GET    /api/follow/requests                // Get pending requests
POST   /api/follow/requests/:requestId/accept // Accept request
POST   /api/follow/requests/:requestId/reject // Reject request
```

**Follow Status Types:**

- `pending` - For private accounts awaiting acceptance
- `accepted` - Active follow relationship
- `blocked` - User has blocked follower

#### 2.5 Direct Messaging

**Features:**

- 1-to-1 direct messaging conversations
- Message history with pagination
- Edit and delete messages (soft delete)
- Mark messages as read
- Message status tracking
- Business account special flow

**Key Functions:**

```javascript
GET    /api/messages/conversations           // List conversations
GET    /api/messages/messageable-users       // Get eligible recipients
POST   /api/messages/conversations           // Create/get conversation
GET    /api/messages/conversations/:id       // Get messages
POST   /api/messages/conversations/:id       // Send message
POST   /api/messages/:messageId/read         // Mark read
PUT    /api/messages/:messageId              // Edit message
DELETE /api/messages/:messageId              // Delete message
DELETE /api/messages/conversations/:id       // Delete conversation
```

**Message Types:**

- Text messages
- Media messages (attachments)
- Soft-deleted messages (marked as deleted but retained)

### 3. Data Models

#### 3.1 User Model (Community Fields)

```javascript
{
  // Profile Identity
  name: String,
  username: String,
  profilePicture: String,
  bio: String,

  // Privacy & Account
  isPrivate: Boolean,
  isVerified: Boolean,
  accountType: { enum: ['Personal', 'Business'] },
  role: { enum: ['user', 'admin'] },

  // Social Graph
  followers: [{ type: ObjectId, ref: 'User' }],
  following: [{ type: ObjectId, ref: 'User' }],

  // Authentication
  email: String,
  passwordHash: String
}
```

#### 3.2 Follow Model

```javascript
{
  follower: { type: ObjectId, ref: 'User' },
  following: { type: ObjectId, ref: 'User' },
  status: { enum: ['pending', 'accepted', 'blocked'] },
  createdAt: Date,

  // Compound unique index on (follower, following)
  index: { follower: 1, following: 1 }
}
```

#### 3.3 Post Model

```javascript
{
  content: String,
  author: { type: ObjectId, ref: 'User' },
  images: [String],
  likes: [{ type: ObjectId, ref: 'User' }],
  shares: [{ type: ObjectId, ref: 'User' }],
  comments: [{ type: ObjectId, ref: 'Comment' }],
  isPublic: Boolean,
  createdAt: Date,
  updatedAt: Date,

  // Virtual fields
  likeCount: { virtual, count of likes array },
  shareCount: { virtual, count of shares array },
  commentCount: { virtual, count of comments array }
}
```

#### 3.4 Comment Model

```javascript
{
  content: String,
  author: { type: ObjectId, ref: 'User' },
  post: { type: ObjectId, ref: 'Post' },
  parentComment: { type: ObjectId, ref: 'Comment' }, // For replies
  replies: [{ type: ObjectId, ref: 'Comment' }],
  likes: [{ type: ObjectId, ref: 'User' }],
  createdAt: Date,
  updatedAt: Date
}
```

#### 3.5 Conversation Model

```javascript
{
  participants: [{ type: ObjectId, ref: 'User' }],
  lastMessage: { type: ObjectId, ref: 'Message' },
  lastActivity: Date,
  isGroup: Boolean,
  groupName: String,
  createdBy: { type: ObjectId, ref: 'User' },
  createdAt: Date
}
```

#### 3.6 Message Model

```javascript
{
  content: String,
  sender: { type: ObjectId, ref: 'User' },
  conversation: { type: ObjectId, ref: 'Conversation' },
  messageType: { enum: ['text', 'media'] },
  attachments: [String],
  readBy: [{ type: ObjectId, ref: 'User' }],
  edited: Boolean,
  editedAt: Date,
  deletedAt: Date, // Soft delete timestamp
  createdAt: Date
}
```

### 4. Community Workflow

#### 4.1 User Registration & Authentication Flow

```
┌─────────────────┐
│  User Opens App │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Sign Up / Login Screen          │
│  - Email & Password Entry        │
│  - Validation                    │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  POST /api/auth/register         │
│  - Hash password with bcryptjs   │
│  - Create User document          │
│  - Return JWT token              │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Store JWT in AsyncStorage       │
│  (Mobile device local storage)   │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Navigate to Community Feed      │
│  All future API calls include    │
│  Authorization: Bearer <token>   │
└──────────────────────────────────┘
```

#### 4.2 Feed & Post Engagement Workflow

```
┌─────────────────────────────────┐
│  User Views Community Tab       │
└────────┬────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  GET /api/posts/feed                     │
│  - Query: posts from followed users      │
│  - Sort: by createdAt (descending)       │
│  - Pagination: skip, limit               │
│  - Return: Post documents with author    │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Display Posts in Feed List              │
│  - Author info (name, avatar)            │
│  - Post content & images                 │
│  - Engagement buttons (like, comment)    │
└────────┬─────────────────────────────────┘
         │
         ├─ User clicks Like
         │  └─ POST /api/posts/:postId/like
         │     (Toggle like, update likes array)
         │
         ├─ User clicks Comment
         │  └─ Shows Comment Input Modal
         │     └─ POST /api/posts/:postId/comments
         │        (Toxicity check, save comment)
         │
         └─ User creates own post
            └─ Shows Post Creation Modal
               ├─ Text input
               ├─ Image picker (up to 5 files)
               └─ POST /api/posts/with-media
                  (Toxicity check, save post)
```

#### 4.3 Follow System Workflow

```
┌──────────────────────────────────┐
│  View Other User's Profile       │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Display Follow/Unfollow Button  │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Check if User is Private        │
└────────┬─────────────────────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
┌────────┐  ┌─────────────┐
│ Public │  │   Private   │
└───┬────┘  └──────┬──────┘
    │              │
    ▼              ▼
┌──────────────────────────────────┐
│ POST /api/follow/:userId         │
│ - Create Follow record           │
│ - Status: accepted (public)      │
│ - Status: pending (private)      │
│ - Update User followers[]        │
└──────────────────────────────────┘
    │
    └─► If pending:
        - Private user receives notification
        - Can accept/reject request
        └─ POST /api/follow/requests/:id/accept
```

#### 4.4 Messaging Workflow

```
┌──────────────────────────────────┐
│  User Opens Messenger            │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  GET /api/messages/conversations │
│  - List user's conversations     │
│  - Include last message          │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Display Conversations List      │
│  - Other participant info        │
│  - Last message preview          │
│  - Timestamp                     │
└────────┬─────────────────────────┘
         │
         ├─ Click existing conversation
         │  └─ GET /api/messages/conversations/:id
         │
         └─ Start new conversation
            └─ GET /api/messages/messageable-users
               (Get eligible recipients)
               └─ POST /api/messages/conversations
                  (Create conversation)
                  └─ GET /api/messages/conversations/:id
                     (Load messages)
                     └─ Display Chat Screen
```

#### 4.5 Message Sending & Management

```
┌──────────────────────────────────┐
│  User Types Message              │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Toxicity Check (Python service) │
└────────┬─────────────────────────┘
         │
    ┌────┴────┐
    │          │
   OK        Toxic
    │          │
    ▼          ▼
┌──────────┐ ┌──────────┐
│  Send    │ │  Block   │
│ Message  │ │ Message  │
└────┬─────┘ └──────────┘
     │
     ▼
┌──────────────────────────────────┐
│ POST /api/messages/conversations │
│        /:id                      │
│ - Save message to DB             │
│ - Update conversation.lastMessage│
│ - Mark readBy: [sender only]     │
└──────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│  Message Delivered               │
│  - Display in chat               │
│  - Show timestamp                │
│  - Enable edit/delete options    │
└──────────────────────────────────┘
```

### 5. Security & Moderation

#### 5.1 Toxicity Moderation

**Triggered on:**

- Post creation
- Comment creation
- Message sending

**Flow:**

```
Content Input
    │
    ▼
Toxicity Check (Python CLI)
    │
    ├─ Non-toxic → Save & Return
    │
    └─ Toxic → Reject with message
```

#### 5.2 Authorization Controls

**Post/Comment Deletion:**

- Allowed by: Post author OR admin
- Verified via: User role & ownership check

**Message Actions:**

- Edit: Only message author
- Delete: Only message author or conversation participant
- Read status: Updated by any conversation participant

---

## AI Video Analyzer Module

### 1. Overview

The **AI Video Analyzer Module** provides an intelligent system for analyzing surf video techniques. Users can upload videos of their surfing and receive personalized AI-powered feedback on their technique, form, and areas for improvement.

### 2. Core Features

#### 2.1 Video Upload & Validation

**Client-Side Validation:**

- File size < 50MB
- Supported formats: MP4, MOV, AVI, WEBM
- Media library permissions check
- Progress tracking (0-100%)

**Server-Side Validation:**

- File type verification
- Size enforcement
- Mime type checking
- Virus scanning (optional integration)

#### 2.2 Pose Detection & Analysis

**MediaPipe Pose Detection:**

- Extracts 33 body landmarks per frame
- Each landmark includes: x, y, z coordinates, visibility confidence
- Processes video frames sequentially
- Handles up to 300 frames per video

**Fallback Features:**

- If MediaPipe unavailable: basic motion/intensity features
- Frame differencing analysis using OpenCV
- Graceful degradation for edge cases

#### 2.3 Technique Classification

**Random Forest Model:**

- Classifies surf techniques into categories:
  - Popup (good, perfect, needs work)
  - Riding (smooth, aggressive, defensive)
  - Duck dive
  - Paddling
  - Wipeout
- Returns confidence scores (0-1)
- Provides probability distribution across all classes

**Classification Features:**

- Mean, standard deviation, min, max of pose landmarks
- Temporal features (frame count, duration)
- Motion indicators
- Pose stability metrics

#### 2.4 Intelligent Feedback Generation

**Feedback Components:**

1. **Rating System:**
   - Excellent (90-100% confidence)
   - Good (70-89%)
   - Decent (50-69%)
   - Needs Improvement (< 50%)

2. **Strengths Identification:**
   - Detected positive aspects of technique
   - Specific body part analysis
   - Form compliance metrics

3. **Improvement Suggestions:**
   - Specific actionable feedback
   - Technique modifications
   - Common mistakes identified

4. **Next Steps Roadmap:**
   - Progressive training recommendations
   - Skill progression path
   - Practice focus areas

5. **Confidence Notes:**
   - When model is uncertain
   - Video quality assessment
   - Recommendation validity

#### 2.5 Health & Status Monitoring

**Health Endpoint:**

```javascript
GET /api/video-analysis/health
- Checks Python service availability
- Verifies model files exist
- Tests MediaPipe installation
- Returns service status
```

### 3. API Endpoints

#### 3.1 Video Analysis Endpoint

```javascript
POST /api/video-analysis/analyze
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

Request:
- File: video file (50MB max)
- Format: MP4, MOV, AVI, WEBM

Response (Success):
{
  "success": true,
  "classification": {
    "pose": "good_popup",
    "confidence": 0.85,
    "frames_analyzed": 120,
    "all_classes": {
      "good_popup": 0.85,
      "perfect_popup": 0.10,
      "needs_work_popup": 0.05
    }
  },
  "feedback": {
    "rating": "good",
    "message": "Nice popup technique! Keep it up.",
    "strengths": [
      "Good body positioning",
      "Smooth weight transfer",
      "Quick transition timing"
    ],
    "suggestions": [
      "Slightly more hip engagement",
      "Work on arm positioning during transition"
    ],
    "next_steps": [
      "Practice on larger waves",
      "Focus on consistency",
      "Try more dynamic maneuvers"
    ]
  },
  "metadata": {
    "video_duration": 45,
    "frames_processed": 120,
    "processing_time": 8500,
    "alternatives": [
      {
        "technique": "perfect_popup",
        "probability": 0.10
      }
    ]
  }
}

Response (Failure - Not Surf Video):
{
  "success": false,
  "code": "NOT_SURFING_VIDEO",
  "message": "No surfboard detected in video",
  "details": "Please upload a video showing you surfing"
}

Response (Failure - Server Error):
{
  "success": false,
  "code": "ANALYSIS_ERROR",
  "error": "Error details...",
  "message": "Could not analyze video. Please try again."
}
```

#### 3.2 Analysis History Endpoint (Placeholder)

```javascript
GET /api/video-analysis/history
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "message": "Analysis history coming soon",
  "analyses": []
}
```

#### 3.3 Health Check Endpoint

```javascript
GET /api/video-analysis/health

Response:
{
  "status": "healthy",
  "python_available": true,
  "models_loaded": true,
  "mediapipe_available": true,
  "timestamp": "2024-05-03T10:30:00Z"
}
```

### 4. ML Pipeline Architecture

#### 4.1 Stage 1: Surfboard Presence Validation (YOLO)

**Purpose:** Ensure the video contains surfing content

**Process:**

```
Video Input
    │
    ▼
Sample Frames (every N frames)
    │
    ▼
YOLOv8 Object Detection
- Target class: surfboard (ID 37)
- Confidence threshold: 0.20
    │
    ├─ Surfboard found → Continue to pose detection
    │
    └─ No surfboard → Return error
       "NOT_SURFING_VIDEO"
```

**Benefits:**

- Prevents analysis of non-surfing videos
- Reduces false positives
- Saves processing time
- Improves user experience

#### 4.2 Stage 2: Pose Landmark Extraction (MediaPipe)

**Purpose:** Extract body keypoints from video frames

**Process:**

```
Video Stream (OpenCV)
    │
    ▼
Extract Frames
    │
    ▼
MediaPipe Pose Landmarker
    │
    ├─ 33 body landmarks per frame:
    │  • Head & neck (5 points)
    │  • Arms & shoulders (8 points)
    │  • Torso (4 points)
    │  • Legs & feet (16 points)
    │
    ├─ For each landmark:
    │  • X coordinate (horizontal, 0-1 normalized)
    │  • Y coordinate (vertical, 0-1 normalized)
    │  • Z coordinate (depth, relative)
    │  • Visibility confidence (0-1)
    │
    ▼
Collect Landmark Sequences
- Max 300 frames (configurable)
- Store as time-series data
    │
    └─ Feature Matrix
       Dimensions: (num_frames × 33 landmarks × 4 features)
       = (num_frames × 132 features)
```

**Landmarks Tracked:**

- Nose, left/right eyes, left/right ears
- Left/right shoulders, elbows, wrists, hands
- Left/right hips, knees, ankles, feet
- Torso keypoints

#### 4.3 Stage 3: Classification (Random Forest Model)

**Purpose:** Identify surf technique type

**Process:**

```
Pose Landmark Sequences
    │
    ▼
Feature Aggregation
    │
    ├─ Statistical features:
    │  • Mean of each landmark
    │  • Std dev of each landmark
    │  • Min/max of each landmark
    │
    ├─ Temporal features:
    │  • Frame count
    │  • Duration
    │
    └─ Motion features:
       • Change in positions
       • Velocity vectors
    │
    ▼
Feature Vector (fixed size)
    │
    ▼
Load Models
- Random Forest classifier (surf_model.pkl)
- Label encoder (label_encoder.pkl)
    │
    ▼
Prediction
    │
    ├─ Get predicted class
    ├─ Get confidence score
    ├─ Get probability distribution
    │
    └─ Output:
       {
         "class": "good_popup",
         "confidence": 0.85,
         "probabilities": {
           "good_popup": 0.85,
           "perfect_popup": 0.10,
           "needs_work_popup": 0.05
         }
       }
```

**Model Training (Reference):**

- Input: Pose sequences from labeled surf videos
- Output: Technique classification
- Algorithm: Random Forest (100+ trees)
- Cross-validation: k-fold (k=5)
- Performance metrics: Accuracy, Precision, Recall, F1

#### 4.4 Stage 4: Feedback Generation

**Purpose:** Generate personalized coaching feedback

**Process:**

```
Classification Result
    │
    ▼
Look up Feedback Template
(database or JSON file)
    │
    ├─ Technique name → Feedback template
    ├─ Confidence level → Tone adjustment
    └─ Detection certainty → Note generation
    │
    ▼
Build Feedback Object
    │
    ├─ Rating:
    │  • excellent (90-100% confidence)
    │  • good (70-89%)
    │  • decent (50-69%)
    │  • needs_improvement (<50%)
    │
    ├─ Message: Personalized message
    │
    ├─ Strengths: 2-4 positive aspects
    │
    ├─ Suggestions: 2-4 improvement areas
    │
    ├─ Next Steps: 2-3 progressive recommendations
    │
    └─ Alternatives: Other probable techniques
    │
    ▼
JSON Response
    │
    └─ Return to frontend for display
```

**Feedback Database (Illustrative):**

```python
FEEDBACK_DB = {
  "good_popup": {
    "excellent": {
      "message": "Excellent popup! Your technique is solid.",
      "strengths": [
        "Good weight distribution",
        "Quick transition",
        "Proper body alignment"
      ],
      "suggestions": [
        "Fine-tune your hip positioning",
        "Experiment with board pressure"
      ]
    },
    "good": {
      "message": "Nice popup technique!",
      "strengths": [...],
      "suggestions": [...]
    },
    # ... other confidence levels
  },
  # ... other techniques
}
```

### 5. Video Analyzer Workflow

#### 5.1 Complete End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                            │
└─────────────────────────────────────────────────────────────────┘

1. USER OPENS APP
   └─► Navigate: Home → Utils Tab → AI Video Analyzer Card

2. AI VIDEO ANALYZER PAGE LOADS
   └─► Display:
       • Header with back button
       • Info card (feature explanation)
       • "Select Video" button
       • Results section (hidden initially)
       • Tips card

3. USER CLICKS "SELECT VIDEO"
   └─► expo-image-picker opens
       • Request media library permissions
       • Filter for videos only
       • User selects video from device gallery

4. VIDEO VALIDATION (Frontend)
   └─► Checks:
       • File size < 50MB
       • Format: MP4, MOV, AVI, WEBM
       • File accessible
   └─► If valid: Show video info & "Analyze Video" button
   └─► If invalid: Show error message

5. USER CLICKS "ANALYZE VIDEO"
   └─► Frontend Actions:
       • Get auth token from AsyncStorage
       • Create FormData with video file
       • Show loading indicator ("Analyzing...")
       • Display upload progress bar

6. UPLOAD TO BACKEND
   └─► POST /api/video-analysis/analyze
       • Headers: Authorization: Bearer <token>
       • Body: multipart/form-data with video
       • Progress: 0% → 25% → 50% → 75% → 100%

7. BACKEND RECEIVES VIDEO
   └─► Node.js + Multer:
       • Authenticate user (JWT middleware)
       • Multer receives file upload
       • Save to: uploads/videos/surf-video-[timestamp].mp4
       • Validate file type and size
       • Show status: "Video received"

8. BACKEND CALLS PYTHON ML SERVICE
   └─► spawn PYTHON_EXECUTABLE:
       • Command: python surf_pose_analyzer_service.py <videoPath>
       • CWD: surfapp--ml-engine/
       • Status: "Analyzing your technique..."

9. PYTHON ML ENGINE - STAGE 1: SURFBOARD VALIDATION
   └─► YOLOv8 Gatekeeper:
       • Load yolov8n.pt model
       • Sample frames from video
       • Run object detection
       • Look for surfboard (class 37)
       • Confidence threshold: 0.20
   └─► If no surfboard found:
       • Return JSON: { success: false, code: "NOT_SURFING_VIDEO" }
       • Backend returns 400 response
       • Frontend shows: "Not a surfing video"

10. PYTHON ML ENGINE - STAGE 2: POSE DETECTION
    └─► MediaPipe Pose Landmarker:
        • Load MediaPipe models
        • Open video with OpenCV
        • Process frames sequentially
        • Extract 33 body landmarks per frame
        • Each landmark: (x, y, z, visibility)
        • Collect up to 300 frames

11. PYTHON ML ENGINE - STAGE 3: CLASSIFICATION
    └─► Feature Aggregation:
        • Calculate mean of all landmarks
        • Calculate std dev
        • Calculate min/max
        • Create fixed-size feature vector
    └─► Load Models:
        • Load surf_model.pkl (Random Forest)
        • Load label_encoder.pkl
    └─► Predict:
        • Run inference on feature vector
        • Get prediction: "good_popup"
        • Get confidence: 0.85
        • Get all class probabilities

12. PYTHON ML ENGINE - STAGE 4: FEEDBACK GENERATION
    └─► Generate Feedback:
        • Match detected pose to feedback templates
        • Determine rating based on confidence
        • Select relevant strengths
        • Generate specific suggestions
        • Create next steps roadmap
        • Build JSON response
    └─► Return Result:
        • Print JSON to stdout
        • Node.js captures output

13. BACKEND PROCESSES RESULT
    └─► Node.js:
        • Capture Python stdout
        • Extract JSON using regex
        • Parse response
        • Delete temporary video file
        • Validate response structure
        • Return JSON to frontend

14. FRONTEND DISPLAYS RESULTS
    └─► Show Results Screen:
        • Classification Card:
          - Pose: "Good Popup"
          - Confidence: 85%
          - Frames: 120 analyzed
        • Feedback Card:
          - Rating icon & color
          - Message: "Nice popup!"
          - 💪 Strengths section
          - 💡 Suggestions section
          - 🎯 Next steps section
          - Alternative techniques (if any)

15. USER READS FEEDBACK
    └─► Options:
        • Upload another video
        • Return to dashboard
        • Practice suggested techniques
        • Share results (optional)
```

#### 5.2 Timeline & Performance

```
Time (seconds) │ Event
───────────────┼────────────────────────────────
0              │ User selects video
1              │ Video picker opens
2              │ User confirms selection
3              │ File validated
4              │ User clicks "Analyze"
5              │ Upload begins ▓░░░░░░░
10             │ Upload 50% ▓▓▓▓░░░░
15             │ Upload complete ▓▓▓▓▓▓▓▓
16             │ Backend receives
17             │ Validates file
18             │ Python service starts
19             │ Models loading...
20             │ Video opened
25             │ Pose extraction ▓▓▓▓▓░░░░░░░░
40             │ Classification running
41             │ Feedback generation
42             │ Results ready
43             │ ✅ RESULTS DISPLAYED
───────────────┴────────────────────────────────
Total: ~43 seconds (varies by video size/quality)
```

#### 5.3 Error Handling Flow

```
┌──────────────────────────────────────┐
│         POTENTIAL ERRORS             │
└──────────────────────────────────────┘
         │
    ┌────┴──────────────────┬──────────────────┬──────┐
    │                       │                  │      │
    ▼                       ▼                  ▼      ▼
┌─────────────┐  ┌──────────────────┐ ┌────────┐ ┌──────┐
│File Upload  │  │  Python Service  │ │ Model  │ │Video │
│Issues       │  │  Issues          │ │ Files  │ │Issue │
└────┬────────┘  └────┬─────────────┘ └───┬────┘ └──┬───┘
     │                │                   │        │
     ├─ No file       ├─ Not found        ├─ Missing ├─ Corrupted
     ├─ Too large     ├─ Permission       ├─ Corrupt ├─ Invalid fmt
     ├─ Wrong format  ├─ Timeout          └─ Perms  └─ Not video
     └─ Not readable  └─ Import errors
     │                │                   │        │
     ▼                ▼                   ▼        ▼
┌─────────────────────────────────────────────────────────┐
│         Return Error Response to Frontend              │
│         Show User-Friendly Error Message               │
│         Suggest Troubleshooting Steps                  │
└─────────────────────────────────────────────────────────┘
```

### 6. Technical Implementation Details

#### 6.1 Backend Implementation

**File:** [surfapp--backend/controllers/videoAnalysisController.js](surfapp--backend/controllers/videoAnalysisController.js)

**Key Operations:**

```javascript
// 1. Receive and validate video
POST /api/video-analysis/analyze
  - Check file exists
  - Validate size (< 50MB)
  - Validate extension (.mp4, .mov, .avi, .webm)
  - Store to uploads/videos/

// 2. Spawn Python process
spawn(PYTHON_EXECUTABLE, [
  'surf_pose_analyzer_service.py',
  videoPath
])

// 3. Capture output
pythonProcess.stdout.on('data', (data) => {
  pythonOutput += data.toString();
})

// 4. Handle completion
pythonProcess.on('close', (code) => {
  // Extract JSON from output
  const jsonMatch = pythonOutput.match(/\{[\s\S]*\}/);
  const result = JSON.parse(jsonMatch[0]);

  // Clean up temp file
  fs.unlinkSync(videoPath);

  // Return to client
  res.json(result);
})
```

#### 6.2 ML Engine Implementation

**File:** [surfapp--ml-engine/surf_pose_analyzer_service.py](surfapp--ml-engine/surf_pose_analyzer_service.py)

**Key Components:**

```python
# 1. Load models
from services.video_analyzer import main

# 2. Process video
- Extract video path from command line args
- Load video with OpenCV
- Process with MediaPipe
- Classify with Random Forest
- Generate feedback

# 3. Return JSON
print(json.dumps({
    "success": true,
    "classification": {...},
    "feedback": {...}
}))
```

#### 6.3 Frontend Implementation

**File:** [SurfApp--frontend/app/aiVideoAnalyzer.js](SurfApp--frontend/app/aiVideoAnalyzer.js)

**Key Features:**

```javascript
// 1. Pick video
const { assets } = await DocumentPicker.getDocumentAsync({
  type: 'video/*'
});

// 2. Validate
- Check size < 50MB
- Validate format
- Check readability

// 3. Upload with progress
const formData = new FormData();
formData.append('file', {
  uri: videoUri,
  name: videoName,
  type: 'video/mp4'
});

axios.post('/api/video-analysis/analyze', formData, {
  headers: { 'Authorization': `Bearer ${token}` },
  onUploadProgress: (progress) => {
    setUploadProgress(progress.loaded / progress.total);
  }
});

// 4. Display results
- Show technique & confidence
- Display feedback card
- Show strengths/suggestions/next steps
```

---

## Integration Flow

### 1. Inter-Module Communication

```
┌─────────────────────────────────────────┐
│     Community Module & AI Analyzer      │
│        Integration Points               │
└─────────────────────────────────────────┘

The two modules operate independently but share:

1. Authentication Layer
   └─► JWT tokens issued by auth module
   └─► Used by both community & AI analyzer APIs
   └─► Stored in AsyncStorage on client

2. User Context
   └─► User ID from JWT claims
   └─► Used to associate posts, messages, videos
   └─► Enables personalization

3. Database (MongoDB)
   └─► Shared database instance
   └─► Separate collections per module
   └─► User model shared reference

4. Frontend Navigation
   └─► Tab-based navigation in Expo Router
   └─► Community tab for social features
   └─► Utils tab includes AI Analyzer
   └─► Seamless switching between modules

5. Potential Future Integration
   └─► Share video analysis results to community feed
   └─► Create posts from video feedback
   └─► Comment on analysis results
   └─► Tag friends for collaborative analysis
```

### 2. Deployment Architecture

```
┌────────────────────────────────────────────────┐
│         DEPLOYMENT STRUCTURE                   │
└────────────────────────────────────────────────┘

Local Development:
─────────────────
Device/PC
  ├─ Frontend (React Native + Expo Go)
  │   └─ Port: Expo (5173 or via tunnel)
  ├─ Backend (Node.js)
  │   └─ Port: 5001
  └─ ML Engine (Python)
      └─ Triggered via child_process

Cloud Deployment:
─────────────────
Frontend: Expo Cloud / PlayStore / AppStore
  └─ Binary APK/IPA

Backend: Server (AWS/Digital Ocean/Heroku)
  ├─ Port: 443 (HTTPS)
  ├─ Node.js runtime
  ├─ Upload directory: /uploads/videos
  └─ Environment: Node-specific

ML Engine: Same server as backend
  ├─ Python 3.x runtime
  ├─ Required packages: MediaPipe, OpenCV, etc.
  ├─ Models directory: /models
  └─ Spawn from Node backend

Database: MongoDB Cloud (Atlas)
  └─ Connection string in .env
```

---

## Setup & Deployment

### 1. Prerequisites

**Global Requirements:**

- Node.js 14+ (Backend & Frontend tooling)
- Python 3.8+ (ML Engine)
- Git
- npm or yarn

**For Development:**

- Visual Studio Code (or any code editor)
- Expo CLI (`npm install -g expo-cli`)
- Android emulator or physical device
- MongoDB (local or Atlas cloud)

### 2. Backend Setup

```bash
# Navigate to backend
cd surfapp--backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/surfceylon
# JWT_SECRET=your_secret_key
# PORT=5001
# PYTHON_EXECUTABLE=/path/to/python3

# Start backend
npm start
# or development with auto-reload:
npm run dev
```

### 3. ML Engine Setup

```bash
# Navigate to ML engine
cd surfapp--ml-engine

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Place trained models
# Copy surf_model.pkl → models/
# Copy label_encoder.pkl → models/

# Verify setup
python test_setup.py
```

### 4. Frontend Setup

```bash
# Navigate to frontend
cd SurfApp--frontend

# Install dependencies
npm install
npx expo install expo-document-picker expo-image-picker

# Configure environment
cp .env.example .env
# Edit .env with backend API URL:
# REACT_APP_API_URL=http://localhost:5001

# Start frontend
npm start
# Scan QR code with Expo Go app (iOS/Android)
```

### 5. Testing

**Backend API Tests:**

```bash
# Test community endpoints
curl -X GET http://localhost:5001/api/posts/feed \
  -H "Authorization: Bearer <JWT_TOKEN>"

# Test AI analyzer health
curl http://localhost:5001/api/video-analysis/health

# Test upload endpoint
curl -X POST http://localhost:5001/api/video-analysis/analyze \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "file=@test_video.mp4"
```

**Frontend Testing:**

- Use Expo Go app on mobile device
- Test video upload flow manually
- Verify JWT token persistence
- Check error handling for edge cases

### 6. Production Deployment

**Backend (Example: AWS EC2):**

```bash
# 1. SSH into server
ssh -i key.pem ec2-user@instance-ip

# 2. Clone repository
git clone https://github.com/yourusername/surfceylon.git
cd surfceylon/surfapp--backend

# 3. Install PM2 for process management
npm install -g pm2

# 4. Configure environment
nano .env  # Set production values

# 5. Start application
pm2 start server.js --name "surfceylon-api"
pm2 save
pm2 startup

# 6. Enable HTTPS
# Use nginx reverse proxy + Let's Encrypt SSL
```

**ML Engine on Same Server:**

```bash
# 1. Ensure Python and packages installed
python3 -m pip install --upgrade pip
pip install -r requirements.txt

# 2. Models should be in /opt/surfceylon/models/
mkdir -p /opt/surfceylon/models
cp surf_model.pkl /opt/surfceylon/models/
cp label_encoder.pkl /opt/surfceylon/models/

# 3. Set permissions
chmod 755 /opt/surfceylon/surfapp--ml-engine/surf_pose_analyzer_service.py
```

**Database (MongoDB Atlas):**

```bash
# 1. Create cluster on MongoDB Atlas
# 2. Configure IP whitelist
# 3. Create database user
# 4. Get connection string
# 5. Add to backend .env:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/surfceylon
```

---

## Conclusion

The Surf Ceylon platform combines powerful social networking capabilities with AI-driven video analysis to create a comprehensive training and community platform for surfers. The **Surf Community Module** provides essential social features like posting, messaging, and following, while the **AI Video Analyzer Module** leverages cutting-edge machine learning to provide personalized technique coaching.

Both modules are built with security, scalability, and user experience in mind, using modern technologies and best practices across the full stack.

### Key Achievements:

✅ **Community Module:**

- Complete social networking infrastructure
- Post creation, engagement, and comment system
- Follow system with private account support
- Direct messaging with toxicity moderation
- Robust authentication and authorization

✅ **AI Video Analyzer Module:**

- End-to-end video analysis pipeline
- MediaPipe pose detection
- Random Forest classification
- Intelligent feedback generation
- Health monitoring and error handling

✅ **Integration:**

- Seamless user experience across modules
- Shared authentication layer
- Scalable architecture
- Production-ready code

---

## References

- [React Native Documentation](https://reactnative.dev)
- [Express.js Documentation](https://expressjs.com)
- [MediaPipe Pose Documentation](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker)
- [Scikit-learn Random Forest](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Expo Documentation](https://docs.expo.dev)

---

**Document Version:** 1.0  
**Last Updated:** May 2024  
**Author:** Research Project Team  
**Status:** Complete
