/**
 * 微言 —— 简单本地化内容社区 Demo
 * 数据存储于 Local Storage，支持发布、查看、删除
 */

const STORAGE_KEY = "weyan_posts";
const MAX_LEN = 280;
const DEFAULT_USER = "小言";

const contentInput = document.getElementById("contentInput");
const charCount = document.getElementById("charCount");
const publishBtn = document.getElementById("publishBtn");
const toast = document.getElementById("toast");
const feedList = document.getElementById("feedList");
const emptyTip = document.getElementById("emptyTip");

/* ---------- 数据层 ---------- */
function loadPosts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

/* ---------- 发布 ---------- */
function publish() {
  const text = contentInput.value.trim();
  if (!text) {
    showToast("内容不能为空");
    return;
  }
  if (text.length > MAX_LEN) {
    showToast(`超出 ${MAX_LEN} 字上限`);
    return;
  }
  const posts = loadPosts();
  posts.unshift({
    id: Date.now() + Math.random().toString(16).slice(2, 6),
    user: DEFAULT_USER,
    content: text,
    time: Date.now(),
  });
  savePosts(posts);
  contentInput.value = "";
  updateCount();
  render();
  showToast("发布成功", false);
}

/* ---------- 渲染 ---------- */
function formatTime(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时前`;
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function render() {
  const posts = loadPosts();
  feedList.innerHTML = "";
  emptyTip.hidden = posts.length > 0;

  posts.forEach((post) => {
    const li = document.createElement("li");
    li.className = "post";
    li.innerHTML = `
      <div class="post-header">
        <span class="post-user"><span class="avatar">${escapeHtml(post.user[0])}</span>${escapeHtml(post.user)}</span>
        <span class="post-time">${formatTime(post.time)}</span>
      </div>
      <div class="post-content">${escapeHtml(post.content)}</div>
      <div class="post-actions">
        <button class="btn-delete" data-id="${post.id}">删除</button>
      </div>
    `;
    feedList.appendChild(li);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ---------- 删除 ---------- */
feedList.addEventListener("click", (e) => {
  if (!e.target.classList.contains("btn-delete")) return;
  const id = e.target.dataset.id;
  savePosts(loadPosts().filter((p) => p.id !== id));
  render();
});

/* ---------- 辅助 ---------- */
function updateCount() {
  const len = contentInput.value.length;
  charCount.textContent = `${len} / ${MAX_LEN}`;
  charCount.classList.toggle("over", len > MAX_LEN);
  publishBtn.disabled = len === 0 || len > MAX_LEN;
}

let toastTimer = null;
function showToast(msg, isError = true) {
  toast.textContent = msg;
  toast.hidden = false;
  toast.style.color = isError ? "#e0245e" : "#31a24c";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 2000);
}

/* ---------- 事件绑定 ---------- */
publishBtn.addEventListener("click", publish);
contentInput.addEventListener("input", updateCount);
contentInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) publish();
});

/* 初始化 */
updateCount();
render();
