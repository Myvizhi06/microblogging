/**
 * Pulse Microblogging Platform - Core Application Logic
 * Pure Vanilla JavaScript with LocalStorage Persistence
 */

// ============================================================================
// Initial Seed Data (Used if LocalStorage is empty)
// ============================================================================
const DEFAULT_POSTS = [
  {
    id: "post-101",
    authorId: "devin",
    authorName: "Devin Brooks",
    authorHandle: "@devinb",
    authorAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
    verified: true,
    content: "Just deployed our new microservices pipeline using #OpenSource tooling. Latency dropped by 42%! If you're building modern distributed apps, keep it modular and observe everything. #WebDevelopment",
    image: null,
    createdAt: Date.now() - 1000 * 60 * 18, // 18 minutes ago
    likes: 24,
    reposts: 5,
    replies: [
      {
        id: "rep-1",
        authorName: "Alex Chen",
        authorHandle: "@alexc_dev",
        authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
        content: "Huge win! Are you using gRPC or standard REST for internal comms?",
        createdAt: Date.now() - 1000 * 60 * 8
      }
    ],
    likedByMe: false,
    repostedByMe: false,
    bookmarkedByMe: false
  },
  {
    id: "post-102",
    authorId: "mayaui",
    authorName: "Maya Lin",
    authorHandle: "@mayaui",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    verified: true,
    content: "Micro-interactions are the heartbeat of good digital products. Notice how subtle transitions make an interface feel responsive and alive? ✨ Never underestimate tactile feedback in UI design. #DesignTrends #WebDevelopment",
    image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80",
    createdAt: Date.now() - 1000 * 60 * 75, // 75 minutes ago
    likes: 89,
    reposts: 19,
    replies: [],
    likedByMe: true,
    repostedByMe: false,
    bookmarkedByMe: true
  },
  {
    id: "post-103",
    authorId: "alexc",
    authorName: "Alex Chen",
    authorHandle: "@alexc_dev",
    authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    verified: false,
    content: "The latest #JavaScript features are making vanilla JS as pleasant to write as most frameworks. Native signals and temporal API are going to be game changers! 🚀 What's your favorite upcoming standard?",
    image: null,
    createdAt: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
    likes: 47,
    reposts: 11,
    replies: [],
    likedByMe: false,
    repostedByMe: false,
    bookmarkedByMe: false
  },
  {
    id: "post-104",
    authorId: "sarahc",
    authorName: "Sarah Connor",
    authorHandle: "@sarahc",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    verified: true,
    content: "Excited to launch my profile on Pulse! Building in public and sharing snippets every day. Say hello in the replies! 👋 #ArtificialIntelligence",
    image: null,
    createdAt: Date.now() - 1000 * 60 * 60 * 6, // 6 hours ago
    likes: 12,
    reposts: 2,
    replies: [],
    likedByMe: false,
    repostedByMe: false,
    bookmarkedByMe: false
  }
];

// ============================================================================
// Application State
// ============================================================================
const CURRENT_USER = {
  id: "sarahc",
  name: "Sarah Connor",
  handle: "@sarahc",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
  verified: true
};

const STORAGE_KEYS = {
  POSTS: "pulse_posts_data_v1",
  THEME: "pulse_theme_pref",
  FOLLOWING: "pulse_following_users"
};

let posts = [];
let followingUsers = new Set(["mayaui"]); // default following Maya
let currentNavFilter = "all"; // 'all', 'bookmarks', 'my-posts', 'explore'
let currentFeedTab = "all";   // 'all', 'following'
let currentSearchQuery = "";
let attachedImageBase64 = null;

// ============================================================================
// DOM Elements
// ============================================================================
const postForm = document.getElementById("postForm");
const postContent = document.getElementById("postContent");
const charCount = document.getElementById("charCount");
const publishBtn = document.getElementById("publishBtn");
const imageUploadInput = document.getElementById("imageUploadInput");
const imageByUrlBtn = document.getElementById("imageByUrlBtn");
const imagePreviewWrapper = document.getElementById("imagePreviewWrapper");
const imagePreview = document.getElementById("imagePreview");
const removeImageBtn = document.getElementById("removeImageBtn");
const addTagBtn = document.getElementById("addTagBtn");
const addEmojiBtn = document.getElementById("addEmojiBtn");

const postsStream = document.getElementById("postsStream");
const emptyState = document.getElementById("emptyState");
const feedTitle = document.getElementById("feedTitle");
const tabForYou = document.getElementById("tabForYou");
const tabFollowing = document.getElementById("tabFollowing");

const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const filterBanner = document.getElementById("filterBanner");
const filterQueryLabel = document.getElementById("filterQueryLabel");
const clearFilterBtn = document.getElementById("clearFilterBtn");

const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");
const toastContainer = document.getElementById("toastContainer");
const focusComposerBtn = document.getElementById("focusComposerBtn");
const trendingList = document.getElementById("trendingList");
const followList = document.getElementById("followList");
const navItems = document.querySelectorAll(".nav-item");

// ============================================================================
// Initialization
// ============================================================================
function initApp() {
  loadTheme();
  loadData();
  bindEvents();
  renderFeed();
  updateFollowButtonsState();
}

// ----------------------------------------------------------------------------
// Storage & Data Handling
// ----------------------------------------------------------------------------
function loadData() {
  const storedPosts = localStorage.getItem(STORAGE_KEYS.POSTS);
  if (storedPosts) {
    try {
      posts = JSON.parse(storedPosts);
    } catch (e) {
      console.error("Failed to parse stored posts", e);
      posts = [...DEFAULT_POSTS];
    }
  } else {
    posts = [...DEFAULT_POSTS];
    savePosts();
  }

  const storedFollowing = localStorage.getItem(STORAGE_KEYS.FOLLOWING);
  if (storedFollowing) {
    try {
      followingUsers = new Set(JSON.parse(storedFollowing));
    } catch (e) {
      console.error("Failed to parse following users", e);
    }
  }
}

function savePosts() {
  localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
}

function saveFollowing() {
  localStorage.setItem(STORAGE_KEYS.FOLLOWING, JSON.stringify(Array.from(followingUsers)));
}

// ----------------------------------------------------------------------------
// Theme Switching (Dark / Light)
// ----------------------------------------------------------------------------
function loadTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || "dark";
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEYS.THEME, theme);

  if (theme === "light") {
    themeIcon.className = "fa-solid fa-moon";
    themeText.textContent = "Dark Mode";
  } else {
    themeIcon.className = "fa-solid fa-sun";
    themeText.textContent = "Light Mode";
  }
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute("data-theme") || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(newTheme);
  showToast(`Switched to ${newTheme} mode`);
}

// ============================================================================
// Composer Handlers
// ============================================================================
function handleContentInput() {
  const length = postContent.value.length;
  const remaining = 280 - length;
  charCount.textContent = remaining;

  // Visual cues for character limit
  const wrap = charCount.parentElement;
  if (remaining < 20) {
    wrap.className = "char-count-wrap danger";
  } else if (remaining < 50) {
    wrap.className = "char-count-wrap warning";
  } else {
    wrap.className = "char-count-wrap";
  }

  // Auto resize textarea height
  postContent.style.height = "auto";
  postContent.style.height = postContent.scrollHeight + "px";

  // Enable / disable publish button
  const hasText = postContent.value.trim().length > 0;
  const hasImage = Boolean(attachedImageBase64);
  publishBtn.disabled = (!hasText && !hasImage) || remaining < 0;
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Please select a valid image file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    attachedImageBase64 = event.target.result;
    imagePreview.src = attachedImageBase64;
    imagePreviewWrapper.style.display = "block";
    handleContentInput();
  };
  reader.readAsDataURL(file);
}

function handleAddImageUrl() {
  const url = prompt("Enter the public image URL (https://...):");
  if (url && url.trim().startsWith("http")) {
    attachedImageBase64 = url.trim();
    imagePreview.src = attachedImageBase64;
    imagePreviewWrapper.style.display = "block";
    handleContentInput();
  } else if (url) {
    showToast("Please enter a valid URL starting with http/https");
  }
}

function removeAttachedImage() {
  attachedImageBase64 = null;
  imagePreview.src = "";
  imagePreviewWrapper.style.display = "none";
  imageUploadInput.value = "";
  handleContentInput();
}

function appendQuickTag() {
  const tags = ["#WebDevelopment", "#JavaScript", "#ArtificialIntelligence", "#OpenSource", "#DesignTrends"];
  const randomTag = tags[Math.floor(Math.random() * tags.length)];
  const currentVal = postContent.value;
  postContent.value = currentVal ? `${currentVal} ${randomTag} ` : `${randomTag} `;
  postContent.focus();
  handleContentInput();
}

function appendQuickEmoji() {
  const emojis = ["🚀", "🔥", "💡", "✨", "❤️", "⚡", "💻", "🎉"];
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
  postContent.value += randomEmoji;
  postContent.focus();
  handleContentInput();
}

function handlePublishPost(e) {
  e.preventDefault();
  const text = postContent.value.trim();
  if (!text && !attachedImageBase64) return;

  const newPost = {
    id: "post-" + Date.now(),
    authorId: CURRENT_USER.id,
    authorName: CURRENT_USER.name,
    authorHandle: CURRENT_USER.handle,
    authorAvatar: CURRENT_USER.avatar,
    verified: CURRENT_USER.verified,
    content: text,
    image: attachedImageBase64,
    createdAt: Date.now(),
    likes: 0,
    reposts: 0,
    replies: [],
    likedByMe: false,
    repostedByMe: false,
    bookmarkedByMe: false
  };

  posts.unshift(newPost);
  savePosts();

  // Reset Composer
  postContent.value = "";
  removeAttachedImage();
  handleContentInput();
  postContent.style.height = "auto";

  showToast("Your post is live!");
  renderFeed();
}

// ============================================================================
// Feed Rendering & Filtering
// ============================================================================
function getFilteredPosts() {
  let list = [...posts];

  // Tab Filter
  if (currentFeedTab === "following") {
    list = list.filter((p) => followingUsers.has(p.authorId) || p.authorId === CURRENT_USER.id);
  }

  // Navigation Filter
  if (currentNavFilter === "bookmarks") {
    list = list.filter((p) => p.bookmarkedByMe);
  } else if (currentNavFilter === "my-posts") {
    list = list.filter((p) => p.authorId === CURRENT_USER.id);
  }

  // Search Query / Hashtag Filter
  if (currentSearchQuery.trim()) {
    const q = currentSearchQuery.trim().toLowerCase();
    list = list.filter((p) => {
      const matchText = p.content.toLowerCase().includes(q);
      const matchAuthor = p.authorName.toLowerCase().includes(q) || p.authorHandle.toLowerCase().includes(q);
      return matchText || matchAuthor;
    });
  }

  return list;
}

function renderFeed() {
  const filtered = getFilteredPosts();
  postsStream.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.style.display = "flex";
  } else {
    emptyState.style.display = "none";
    filtered.forEach((post) => {
      postsStream.appendChild(createPostElement(post));
    });
  }

  // Update Active Filter Banner state
  if (currentSearchQuery.trim()) {
    filterBanner.style.display = "flex";
    filterQueryLabel.textContent = `"${currentSearchQuery.trim()}"`;
  } else {
    filterBanner.style.display = "none";
  }
}

function createPostElement(post) {
  const article = document.createElement("article");
  article.className = "post-card";
  article.dataset.postId = post.id;

  const isOwnPost = post.authorId === CURRENT_USER.id;
  const formattedContent = highlightTagsAndMentions(post.content);
  const timeFormatted = formatTimeAgo(post.createdAt);

  const imageHtml = post.image
    ? `<div class="post-media"><img src="${escapeHtml(post.image)}" alt="Attachment" loading="lazy" /></div>`
    : "";

  const verifiedBadgeHtml = post.verified
    ? `<i class="fa-solid fa-circle-check verified-badge" title="Verified"></i>`
    : "";

  const deleteBtnHtml = isOwnPost
    ? `<button class="post-menu-btn btn-delete-post" data-post-id="${post.id}" title="Delete post"><i class="fa-regular fa-trash-can"></i></button>`
    : "";

  // Replies render
  const repliesHtml = post.replies && post.replies.length > 0
    ? post.replies
        .map(
          (rep) => `
        <div class="reply-item">
          <img src="${escapeHtml(rep.authorAvatar)}" class="avatar" alt="${escapeHtml(rep.authorName)}" />
          <div class="reply-content">
            <div class="reply-header">
              <span class="name">${escapeHtml(rep.authorName)}</span>
              <span class="handle">${escapeHtml(rep.authorHandle)}</span>
              <span class="timestamp">· ${formatTimeAgo(rep.createdAt)}</span>
            </div>
            <div class="reply-text">${escapeHtml(rep.content)}</div>
          </div>
        </div>
      `
        )
        .join("")
    : "";

  article.innerHTML = `
    <div class="post-avatar-col">
      <img src="${escapeHtml(post.authorAvatar)}" alt="${escapeHtml(post.authorName)}" class="avatar" />
    </div>
    <div class="post-main-col">
      <header class="post-header">
        <div class="post-user-info">
          <span class="name">${escapeHtml(post.authorName)}</span>
          ${verifiedBadgeHtml}
          <span class="handle">${escapeHtml(post.authorHandle)}</span>
          <span class="dot-separator">·</span>
          <span class="timestamp">${timeFormatted}</span>
        </div>
        ${deleteBtnHtml}
      </header>

      <div class="post-text">${formattedContent}</div>

      ${imageHtml}

      <div class="post-actions-bar">
        <button class="action-btn reply" data-post-id="${post.id}" title="Reply">
          <i class="fa-regular fa-comment"></i>
          <span>${post.replies ? post.replies.length : 0}</span>
        </button>

        <button class="action-btn repost ${post.repostedByMe ? "active" : ""}" data-post-id="${post.id}" title="Repost">
          <i class="fa-solid fa-repeat"></i>
          <span>${post.reposts}</span>
        </button>

        <button class="action-btn like ${post.likedByMe ? "active" : ""}" data-post-id="${post.id}" title="Like">
          <i class="${post.likedByMe ? "fa-solid" : "fa-regular"} fa-heart"></i>
          <span>${post.likes}</span>
        </button>

        <button class="action-btn bookmark ${post.bookmarkedByMe ? "active" : ""}" data-post-id="${post.id}" title="Bookmark">
          <i class="${post.bookmarkedByMe ? "fa-solid" : "fa-regular"} fa-bookmark"></i>
        </button>

        <button class="action-btn share" data-post-id="${post.id}" title="Share / Copy Link">
          <i class="fa-regular fa-share-from-square"></i>
        </button>
      </div>

      <!-- Replies Drawer (Hidden by default unless expanded) -->
      <div class="replies-container" id="replies-${post.id}" style="display: none;">
        <div class="replies-list">${repliesHtml}</div>
        <form class="reply-form" data-post-id="${post.id}">
          <input type="text" class="reply-input" placeholder="Post your reply..." maxlength="200" required />
          <button type="submit" class="btn btn-primary btn-send-reply">Reply</button>
        </form>
      </div>
    </div>
  `;

  return article;
}

// ----------------------------------------------------------------------------
// Post Interactions (Likes, Reposts, Bookmarks, Replies, Deletion)
// ----------------------------------------------------------------------------
function handlePostActionClick(e) {
  // Like button
  const likeBtn = e.target.closest(".action-btn.like");
  if (likeBtn) {
    const postId = likeBtn.dataset.postId;
    toggleLike(postId);
    return;
  }

  // Repost button
  const repostBtn = e.target.closest(".action-btn.repost");
  if (repostBtn) {
    const postId = repostBtn.dataset.postId;
    toggleRepost(postId);
    return;
  }

  // Bookmark button
  const bookmarkBtn = e.target.closest(".action-btn.bookmark");
  if (bookmarkBtn) {
    const postId = bookmarkBtn.dataset.postId;
    toggleBookmark(postId);
    return;
  }

  // Reply drawer toggle button
  const replyBtn = e.target.closest(".action-btn.reply");
  if (replyBtn) {
    const postId = replyBtn.dataset.postId;
    toggleRepliesDrawer(postId);
    return;
  }

  // Share button
  const shareBtn = e.target.closest(".action-btn.share");
  if (shareBtn) {
    const postId = shareBtn.dataset.postId;
    handleSharePost(postId);
    return;
  }

  // Delete button
  const deleteBtn = e.target.closest(".btn-delete-post");
  if (deleteBtn) {
    const postId = deleteBtn.dataset.postId;
    deletePost(postId);
    return;
  }

  // Clicking a hashtag or mention inside the post text
  const tagLink = e.target.closest(".hashtag, .mention");
  if (tagLink) {
    const tag = tagLink.textContent;
    setSearchQuery(tag);
    return;
  }
}

function toggleLike(postId) {
  const post = posts.find((p) => p.id === postId);
  if (!post) return;

  post.likedByMe = !post.likedByMe;
  post.likes += post.likedByMe ? 1 : -1;
  savePosts();
  renderFeed();
}

function toggleRepost(postId) {
  const post = posts.find((p) => p.id === postId);
  if (!post) return;

  post.repostedByMe = !post.repostedByMe;
  post.reposts += post.repostedByMe ? 1 : -1;
  savePosts();
  renderFeed();
  showToast(post.repostedByMe ? "Reposted to your feed!" : "Removed repost");
}

function toggleBookmark(postId) {
  const post = posts.find((p) => p.id === postId);
  if (!post) return;

  post.bookmarkedByMe = !post.bookmarkedByMe;
  savePosts();
  renderFeed();
  showToast(post.bookmarkedByMe ? "Added to your Bookmarks" : "Removed from Bookmarks");
}

function toggleRepliesDrawer(postId) {
  const drawer = document.getElementById(`replies-${postId}`);
  if (!drawer) return;

  const isHidden = drawer.style.display === "none";
  drawer.style.display = isHidden ? "flex" : "none";

  if (isHidden) {
    const input = drawer.querySelector(".reply-input");
    if (input) input.focus();
  }
}

function handleReplySubmit(e) {
  const form = e.target.closest(".reply-form");
  if (!form) return;

  e.preventDefault();
  const postId = form.dataset.postId;
  const input = form.querySelector(".reply-input");
  const replyText = input.value.trim();

  if (!replyText) return;

  const post = posts.find((p) => p.id === postId);
  if (!post) return;

  if (!post.replies) post.replies = [];

  post.replies.push({
    id: "rep-" + Date.now(),
    authorName: CURRENT_USER.name,
    authorHandle: CURRENT_USER.handle,
    authorAvatar: CURRENT_USER.avatar,
    content: replyText,
    createdAt: Date.now()
  });

  savePosts();
  renderFeed();

  // Re-open reply drawer so user sees their new reply
  const drawer = document.getElementById(`replies-${postId}`);
  if (drawer) drawer.style.display = "flex";

  showToast("Reply posted!");
}

function deletePost(postId) {
  if (!confirm("Are you sure you want to delete this post?")) return;

  posts = posts.filter((p) => p.id !== postId);
  savePosts();
  renderFeed();
  showToast("Post deleted");
}

function handleSharePost(postId) {
  const post = posts.find((p) => p.id === postId);
  if (!post) return;

  const textToCopy = `"${post.content}" by ${post.authorName} on Pulse`;
  navigator.clipboard.writeText(textToCopy).then(() => {
    showToast("Post copied to clipboard!");
  }).catch(() => {
    showToast("Could not copy link");
  });
}

// ============================================================================
// Follow Suggestions & Trending Handlers
// ============================================================================
function handleFollowToggle(e) {
  const btn = e.target.closest(".btn-follow");
  if (!btn) return;

  const userId = btn.dataset.user;
  if (!userId) return;

  if (followingUsers.has(userId)) {
    followingUsers.delete(userId);
    showToast(`Unfollowed user`);
  } else {
    followingUsers.add(userId);
    showToast(`Now following user!`);
  }

  saveFollowing();
  updateFollowButtonsState();

  // If currently in Following tab, refresh feed
  if (currentFeedTab === "following") {
    renderFeed();
  }
}

function updateFollowButtonsState() {
  const buttons = followList.querySelectorAll(".btn-follow");
  buttons.forEach((btn) => {
    const userId = btn.dataset.user;
    if (followingUsers.has(userId)) {
      btn.textContent = "Following";
      btn.classList.add("following");
    } else {
      btn.textContent = "Follow";
      btn.classList.remove("following");
    }
  });
}

function handleTrendingClick(e) {
  const item = e.target.closest(".trending-item");
  if (!item) return;

  const tag = item.dataset.tag;
  if (tag) {
    setSearchQuery(tag);
  }
}

function setSearchQuery(query) {
  currentSearchQuery = query;
  searchInput.value = query;
  clearSearchBtn.style.display = query ? "block" : "none";
  renderFeed();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============================================================================
// Navigation & Tab Switching
// ============================================================================
function handleNavClick(e) {
  const navItem = e.target.closest(".nav-item");
  if (!navItem) return;

  e.preventDefault();
  const filter = navItem.dataset.filter;

  if (filter === "notifications") {
    showToast("You're all caught up on notifications! 🎉");
    return;
  }

  navItems.forEach((item) => item.classList.remove("active"));
  navItem.classList.add("active");

  currentNavFilter = filter;

  // Set Feed Title accordingly
  if (filter === "bookmarks") {
    feedTitle.textContent = "Bookmarks";
  } else if (filter === "my-posts") {
    feedTitle.textContent = "My Profile Posts";
  } else if (filter === "explore") {
    feedTitle.textContent = "Explore";
  } else {
    feedTitle.textContent = "Home";
  }

  renderFeed();
}

function handleTabClick(e) {
  const tab = e.target.closest(".tab-btn");
  if (!tab) return;

  tabForYou.classList.remove("active");
  tabFollowing.classList.remove("active");
  tab.classList.add("active");

  currentFeedTab = tab.dataset.tab;
  renderFeed();
}

// ============================================================================
// Utilities: Formats, Helpers, Toast
// ============================================================================
function formatTimeAgo(timestamp) {
  const diffMs = Date.now() - timestamp;
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function highlightTagsAndMentions(text) {
  if (!text) return "";
  let safe = escapeHtml(text);

  // Hashtags
  safe = safe.replace(/(#[a-zA-Z0-9_]+)/g, '<span class="hashtag">$1</span>');

  // Mentions
  safe = safe.replace(/(@[a-zA-Z0-9_]+)/g, '<span class="mention">$1</span>');

  return safe;
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>${escapeHtml(message)}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ============================================================================
// Event Listeners Binding
// ============================================================================
function bindEvents() {
  // Composer events
  postContent.addEventListener("input", handleContentInput);
  postForm.addEventListener("submit", handlePublishPost);
  imageUploadInput.addEventListener("change", handleImageUpload);
  imageByUrlBtn.addEventListener("click", handleAddImageUrl);
  removeImageBtn.addEventListener("click", removeAttachedImage);
  addTagBtn.addEventListener("click", appendQuickTag);
  addEmojiBtn.addEventListener("click", appendQuickEmoji);

  // Focus composer button
  focusComposerBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    postContent.focus();
  });

  // Feed stream delegation
  postsStream.addEventListener("click", handlePostActionClick);
  postsStream.addEventListener("submit", handleReplySubmit);

  // Tabs
  tabForYou.addEventListener("click", handleTabClick);
  tabFollowing.addEventListener("click", handleTabClick);

  // Nav menu
  document.querySelector(".nav-menu").addEventListener("click", handleNavClick);

  // Logo returns to home
  document.getElementById("logoLink").addEventListener("click", (e) => {
    e.preventDefault();
    currentNavFilter = "all";
    currentSearchQuery = "";
    searchInput.value = "";
    clearSearchBtn.style.display = "none";
    navItems.forEach((item) => item.classList.remove("active"));
    navItems[0].classList.add("active");
    feedTitle.textContent = "Home";
    renderFeed();
  });

  // Search
  searchInput.addEventListener("input", (e) => {
    currentSearchQuery = e.target.value;
    clearSearchBtn.style.display = currentSearchQuery ? "block" : "none";
    renderFeed();
  });

  clearSearchBtn.addEventListener("click", () => {
    setSearchQuery("");
  });

  clearFilterBtn.addEventListener("click", () => {
    setSearchQuery("");
  });

  // Trending & Follow
  trendingList.addEventListener("click", handleTrendingClick);
  followList.addEventListener("click", handleFollowToggle);

  // Theme toggle
  themeToggleBtn.addEventListener("click", toggleTheme);
}

// Start Application on DOM ready
document.addEventListener("DOMContentLoaded", initApp);

