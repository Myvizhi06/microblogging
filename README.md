# Pulse - Modern Microblogging Platform

A lightweight, modern, responsive microblogging web application built with **HTML5**, **CSS3**, and **Vanilla JavaScript**.

---

## 📁 File Structure

```text
microblogging/
│
├── index.html       # Application markup and semantic layout
├── style.css        # Responsive styling, theming (Dark & Light), animations
├── script.js        # Core logic, state management, and LocalStorage persistence
└── README.md        # Documentation and feature guide
```

---

## 🚀 Key Features

1. **Rich Post Composer**:
   - Character counter with warning indicators (up to 280 characters).
   - Auto-resizing text area.
   - Upload local images or attach public image URLs with instant preview and remove button.
   - Quick insertion of trending hashtags and emojis.
2. **Interactive Social Feed**:
   - **Like** system with heart pulse animation and counter.
   - **Repost** toggle with live count.
   - **Bookmarks**: Save posts and view them in the Bookmarks filter tab.
   - **Interactive Replies / Comments**: Expand any post's replies drawer to read and add new replies directly.
   - **Delete**: Remove your own posts with one click.
   - **Share**: Copy post content to clipboard with a toast notification.
3. **Data Persistence**:
   - All posts, replies, likes, bookmarks, followed users, and theme preferences are saved in your browser's `localStorage`.
   - Seeded with sample posts on first load so the app looks alive immediately.
4. **Hashtag & Mention Highlights**:
   - Automatically detects and styles `#hashtags` and `@mentions`. Clicking any hashtag immediately filters the feed!
5. **Real-Time Search & Filters**:
   - Filter by tabs: **For You** (all posts) vs. **Following**.
   - Filter by navigation: **Home**, **Bookmarks**, **Profile** (My Posts).
   - Live search bar that filters posts by content, author name, or handle.
   - Clickable **Trending Topics** list.
6. **Theme Customization**:
   - Toggle between Dark Mode and Light Mode with a single click.
7. **Responsive Design**:
   - Desktop 3-column layout (Navigation | Feed | Widgets).
   - Tablet compressed view.
   - Mobile-first bottom navigation bar.

---

## 💻 How to Run

1. Open the project folder `c:\Users\myvizhi\OneDrive\Desktop\microblogging\`.
2. Double-click **`index.html`** or right-click and choose **"Open with"** -> Google Chrome, Edge, or Firefox.
3. No server or build tools required!

