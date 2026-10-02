const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');

menuBtn.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  });
});

const photoKeys = ['profile', 'school', 'food', 'sport'];
const DB_NAME = 'maciboi-photos';
const STORE = 'photos';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function savePhoto(key, blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function loadPhoto(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
    req.onsuccess = () => { db.close(); resolve(req.result || null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

function renderPhoto(key, blob) {
  const slot = document.getElementById(`${key}-photo`);
  if (!slot || !blob) return;
  if (slot.dataset.url) URL.revokeObjectURL(slot.dataset.url);

  const url = URL.createObjectURL(blob);
  slot.dataset.url = url;
  slot.classList.add('has-photo');
  slot.replaceChildren();

  const img = document.createElement('img');
  img.className = 'uploaded';
  img.src = url;
  img.alt = `${key} photo`;
  slot.appendChild(img);
}

photoKeys.forEach((key) => {
  const input = document.getElementById(`${key}-input`);
  document.querySelectorAll(`[data-photo="${key}"]`).forEach((button) => {
    button.addEventListener('click', () => input.click());
  });

  input.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    try {
      await savePhoto(key, file);
      renderPhoto(key, file);
    } catch (error) {
      console.error(error);
      alert('The image could not be saved in this browser.');
    }
    input.value = '';
  });

  loadPhoto(key).then((blob) => {
    if (blob) renderPhoto(key, blob);
  }).catch(console.error);
});

window.addEventListener('beforeunload', () => {
  photoKeys.forEach((key) => {
    const slot = document.getElementById(`${key}-photo`);
    if (slot?.dataset.url) URL.revokeObjectURL(slot.dataset.url);
  });
});

document.getElementById('contact-form').addEventListener('submit', (event) => {
  event.preventDefault();
  document.getElementById('status').textContent =
    'Thanks! This demo form is ready to be connected to an email service.';
  event.target.reset();
});
