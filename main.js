// ====================== FIREBASE SETUP (PLACEHOLDER) ======================
/*
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDSIJ0v69t-aawrUe0LgwEEBMWNc4QCkPQ",
  authDomain: "insan-cemerlang-17b1d.firebaseapp.com",
  projectId: "insan-cemerlang-17b1d",
  storageBucket: "insan-cemerlang-17b1d.firebasestorage.app",
  messagingSenderId: "142310126649",
  appId: "1:142310126649:web:405a132a34a658637e09e8"
};

const app = initializeApp(firebaseConfig);
const firestoreDB = getFirestore(app);
*/

// ====================== DATA STORE (LOCAL) ======================
let localDB = {
  buku: [
    { id: 1, judul: 'Laskar Pelangi', pengarang: 'Andrea Hirata', penerbit: 'Bentang', tahun: 2005, kategori: 'Fiksi', stok: 5, deskripsi: 'Novel tentang semangat anak-anak Belitung' },
    { id: 2, judul: 'Bumi Manusia', pengarang: 'Pramoedya Ananta Toer', penerbit: 'Lentera Dipantara', tahun: 1980, kategori: 'Fiksi', stok: 3, deskripsi: 'Kisah Minke di era kolonial Belanda' },
    { id: 3, judul: 'Algoritma & Pemrograman', pengarang: 'Rinaldi Munir', penerbit: 'Informatika', tahun: 2020, kategori: 'Teknologi', stok: 8, deskripsi: 'Dasar-dasar algoritma dan pemrograman' },
    { id: 4, judul: 'Sejarah Indonesia Modern', pengarang: 'M.C. Ricklefs', penerbit: 'Gadjah Mada UP', tahun: 2018, kategori: 'Sejarah', stok: 4, deskripsi: 'Sejarah Indonesia dari 1200 hingga kini' },
    { id: 5, judul: 'Kimia Dasar', pengarang: 'Raymond Chang', penerbit: 'Erlangga', tahun: 2021, kategori: 'Ilmu Pengetahuan', stok: 6, deskripsi: 'Kimia untuk mahasiswa dan pelajar' },
  ],
  anggota: [
    { id: 1, nis: '12001', nama: 'Budi Santoso', kelas: 'XII RPL 1', username: 'budi', password: 'budi123', status: 'aktif' },
    { id: 2, nis: '12002', nama: 'Siti Rahayu', kelas: 'XII RPL 2', username: 'siti', password: 'siti123', status: 'aktif' },
    { id: 3, nis: '12003', nama: 'Ahmad Fauzi', kelas: 'XI RPL 1', username: 'ahmad', password: 'ahmad123', status: 'aktif' },
  ],
  transaksi: [
    { id: 1, anggotaId: 1, bukuId: 1, tglPinjam: '2026-04-10', tglKembali: '2026-04-17', status: 'terlambat', denda: 0 },
    { id: 2, anggotaId: 2, bukuId: 3, tglPinjam: '2026-04-15', tglKembali: '2026-04-22', status: 'dipinjam', denda: 0 },
  ],
  admin: [{ username: 'admin', password: 'admin123', nama: 'Administrator' }],
  nextBukuId: 6,
  nextAnggotaId: 4,
  nextTrxId: 3
};

let currentUser = null;
let currentRole = 'admin';
let hapusCallback = null;

// ====================== LOCAL STORAGE ======================
function loadLocalDB() {
  const saved = localStorage.getItem('digilib_db');
  if (saved) {
    localDB = JSON.parse(saved);
    // Migrasi: tambahkan properti denda jika belum ada
    localDB.transaksi.forEach(t => {
      if (t.denda === undefined) t.denda = 0;
    });
  }
}

function saveLocalDB() {
  localStorage.setItem('digilib_db', JSON.stringify(localDB));
}

loadLocalDB();

// ====================== HELPER: HITUNG DENDA ======================
function hitungDenda(tglSeharusnya, tglDikembalikan = null) {
  const kembali = new Date(tglSeharusnya);
  const aktual = tglDikembalikan ? new Date(tglDikembalikan) : new Date();
  kembali.setHours(0, 0, 0, 0);
  aktual.setHours(0, 0, 0, 0);
  const selisih = Math.floor((aktual - kembali) / (1000 * 60 * 60 * 24));
  return selisih > 0 ? selisih * 1000 : 0;
}

// ====================== AUTH ======================
function setRole(role) {
  currentRole = role;
  document.querySelectorAll('.role-tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && role === 'admin') || (i === 1 && role === 'siswa'));
  });
  document.getElementById('registerLink').style.display = role === 'siswa' ? 'block' : 'none';
}
setRole('admin');

function doLogin() {
  const u = document.getElementById('loginUsername').value.trim();
  const p = document.getElementById('loginPassword').value.trim();
  const alert = document.getElementById('loginAlert');

  if (!u || !p) {
    showLoginAlert('Isi username dan password!', 'danger');
    return;
  }

  if (currentRole === 'admin') {
    const admin = localDB.admin.find(a => a.username === u && a.password === p);
    if (admin) {
      currentUser = { ...admin, role: 'admin' };
      enterApp();
    } else {
      showLoginAlert('Username atau password salah!', 'danger');
    }
  } else {
    const siswa = localDB.anggota.find(a => a.username === u && a.password === p && a.status === 'aktif');
    if (siswa) {
      currentUser = { ...siswa, role: 'siswa' };
      enterApp();
    } else {
      showLoginAlert('Username/password salah atau akun tidak aktif!', 'danger');
    }
  }
}

function showLoginAlert(msg, type) {
  const el = document.getElementById('loginAlert');
  el.style.display = 'block';
  el.className = `alert alert-${type}`;
  el.textContent = msg;
}

function showRegister() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('registerScreen').style.display = 'flex';
}
function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('registerScreen').style.display = 'none';
}

function doRegister() {
  const nama = document.getElementById('regNama').value.trim();
  const nis = document.getElementById('regNis').value.trim();
  const kelas = document.getElementById('regKelas').value.trim();
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value.trim();

  if (!nama || !nis || !kelas || !username || !password) {
    showRegAlert('Semua field wajib diisi!', 'danger');
    return;
  }
  if (localDB.anggota.find(a => a.username === username)) {
    showRegAlert('Username sudah digunakan!', 'danger');
    return;
  }
  if (localDB.anggota.find(a => a.nis === nis)) {
    showRegAlert('NIS sudah terdaftar!', 'danger');
    return;
  }

  localDB.anggota.push({ id: localDB.nextAnggotaId++, nis, nama, kelas, username, password, status: 'aktif' });
  saveLocalDB();
  showRegAlert('Pendaftaran berhasil! Silakan login.', 'success');
  setTimeout(() => { showLogin(); clearRegForm(); }, 1500);
}

function showRegAlert(msg, type) {
  const el = document.getElementById('regAlert');
  el.style.display = 'block';
  el.className = `alert alert-${type}`;
  el.textContent = msg;
}
function clearRegForm() {
  ['regNama', 'regNis', 'regKelas', 'regUsername', 'regPassword'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('regAlert').style.display = 'none';
}

function enterApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('registerScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = 'block';

  document.getElementById('sidebarName').textContent = currentUser.nama;
  document.getElementById('sidebarRole').textContent = currentUser.role === 'admin' ? 'Administrator' : currentUser.kelas || 'Siswa';
  document.getElementById('avatarInitial').textContent = currentUser.nama[0].toUpperCase();

  buildSidebar();

  if (currentUser.role === 'admin') {
    document.getElementById('dashGreet').textContent = `Halo, ${currentUser.nama}! Kelola perpustakaan dengan mudah.`;
    showPage('dashboard');
    renderDashboard();
  } else {
    document.getElementById('siswaDashGreet').textContent = `Halo, ${currentUser.nama}! Selamat membaca 📚`;
    showPage('siswa-dashboard');
    renderSiswaDashboard();
  }
}

function doLogout() {
  currentUser = null;
  document.getElementById('appScreen').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginAlert').style.display = 'none';
}

// ====================== SIDEBAR ======================
function buildSidebar() {
  const nav = document.getElementById('sidebarNav');
  const menus = currentUser.role === 'admin' ? [
    { label: 'UTAMA', items: [{ icon: '📊', text: 'Dashboard', page: 'dashboard' }] },
    { label: 'KELOLA DATA', items: [
        { icon: '📚', text: 'Data Buku', page: 'buku' },
        { icon: '👥', text: 'Kelola Anggota', page: 'anggota' },
        { icon: '🔄', text: 'Transaksi', page: 'transaksi' },
    ]}
  ] : [
    { label: 'MENU', items: [
        { icon: '🏠', text: 'Dashboard', page: 'siswa-dashboard' },
        { icon: '📖', text: 'Katalog Buku', page: 'siswa-buku' },
        { icon: '📋', text: 'Pinjaman Saya', page: 'siswa-pinjaman' },
    ]}
  ];

  nav.innerHTML = menus.map(section => `
    <div class="nav-section-label">${section.label}</div>
    ${section.items.map(item => `
      <button class="nav-item" data-page="${item.page}" onclick="navClick('${item.page}')">
        <span class="icon">${item.icon}</span>${item.text}
      </button>
    `).join('')}
  `).join('');
}

function navClick(page) {
  showPage(page);
  if (page === 'dashboard') renderDashboard();
  if (page === 'buku') renderBuku();
  if (page === 'anggota') renderAnggota();
  if (page === 'transaksi') renderTransaksi();
  if (page === 'siswa-dashboard') renderSiswaDashboard();
  if (page === 'siswa-buku') renderKatalog();
  if (page === 'siswa-pinjaman') renderPinjamanSaya();
}

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === page);
  });
}

// ====================== DASHBOARD ADMIN ======================
function renderDashboard() {
  const totalBuku = localDB.buku.length;
  const totalAnggota = localDB.anggota.filter(a => a.status === 'aktif').length;
  const totalDipinjam = localDB.transaksi.filter(t => t.status !== 'dikembalikan').length;
  const totalTerlambat = localDB.transaksi.filter(t => t.status === 'terlambat').length;

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><span class="stat-icon">📚</span><div class="stat-label">Total Buku</div><div class="stat-value" style="color:var(--accent)">${totalBuku}</div></div>
    <div class="stat-card"><span class="stat-icon">👥</span><div class="stat-label">Anggota Aktif</div><div class="stat-value" style="color:var(--info)">${totalAnggota}</div></div>
    <div class="stat-card"><span class="stat-icon">📖</span><div class="stat-label">Sedang Dipinjam</div><div class="stat-value" style="color:var(--success)">${totalDipinjam}</div></div>
    <div class="stat-card"><span class="stat-icon">⚠️</span><div class="stat-label">Terlambat</div><div class="stat-value" style="color:var(--danger)">${totalTerlambat}</div></div>
  `;

  const recent = [...localDB.transaksi].reverse().slice(0, 5);
  document.getElementById('dashTransaksi').innerHTML = recent.length ? recent.map(t => {
    const a = localDB.anggota.find(x => x.id === t.anggotaId);
    const b = localDB.buku.find(x => x.id === t.bukuId);
    return `<tr><td>${a?.nama || '-'}</td><td>${b?.judul || '-'}</td><td>${t.tglPinjam}</td><td>${t.tglKembali}</td><td>${badgeStatus(t.status)}</td></tr>`;
  }).join('') : `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">📋</div>Belum ada transaksi</div></td></tr>`;
}

// ====================== BUKU ======================
function renderBuku(q = '') {
  const list = localDB.buku.filter(b => !q || b.judul.toLowerCase().includes(q.toLowerCase()) || b.pengarang.toLowerCase().includes(q.toLowerCase()));
  document.getElementById('tableBuku').innerHTML = list.length ? list.map(b => `
    <tr>
      <td>#${b.id}</td>
      <td><strong>${b.judul}</strong></td>
      <td>${b.pengarang}</td>
      <td><span class="badge badge-info">${b.kategori}</span></td>
      <td>${b.stok}</td>
      <td>${b.stok > 0 ? '<span class="badge badge-success">Tersedia</span>' : '<span class="badge badge-danger">Habis</span>'}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="editBuku(${b.id})">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteBuku(${b.id})">🗑️</button>
      </td>
    </tr>
  `).join('') : `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📚</div>Tidak ada buku ditemukan</div></td></tr>`;
}

function openModalBuku(id = null) {
  document.getElementById('modalBukuTitle').textContent = id ? 'Edit Buku' : 'Tambah Buku';
  document.getElementById('bukuId').value = id || '';
  if (id) {
    const b = localDB.buku.find(x => x.id === id);
    document.getElementById('bukuJudul').value = b.judul;
    document.getElementById('bukuPengarang').value = b.pengarang;
    document.getElementById('bukuPenerbit').value = b.penerbit;
    document.getElementById('bukuTahun').value = b.tahun;
    document.getElementById('bukuKategori').value = b.kategori;
    document.getElementById('bukuStok').value = b.stok;
    document.getElementById('bukuDeskripsi').value = b.deskripsi || '';
  } else {
    ['bukuJudul', 'bukuPengarang', 'bukuPenerbit', 'bukuTahun', 'bukuStok', 'bukuDeskripsi'].forEach(id => document.getElementById(id).value = '');
  }
  openModal('modalBuku');
}
function editBuku(id) { openModalBuku(id); }

function saveBuku() {
  const id = document.getElementById('bukuId').value;
  const judul = document.getElementById('bukuJudul').value.trim();
  const pengarang = document.getElementById('bukuPengarang').value.trim();
  const stok = parseInt(document.getElementById('bukuStok').value);

  if (!judul || !pengarang || isNaN(stok)) {
    showToast('Isi field yang wajib diisi!', 'error');
    return;
  }

  const data = {
    judul, pengarang,
    penerbit: document.getElementById('bukuPenerbit').value.trim(),
    tahun: parseInt(document.getElementById('bukuTahun').value) || new Date().getFullYear(),
    kategori: document.getElementById('bukuKategori').value,
    stok,
    deskripsi: document.getElementById('bukuDeskripsi').value.trim()
  };

  if (id) {
    const idx = localDB.buku.findIndex(b => b.id === parseInt(id));
    localDB.buku[idx] = { ...localDB.buku[idx], ...data };
    showToast('Buku berhasil diperbarui!', 'success');
  } else {
    localDB.buku.push({ id: localDB.nextBukuId++, ...data });
    showToast('Buku berhasil ditambahkan!', 'success');
  }
  saveLocalDB(); closeModal('modalBuku'); renderBuku();
}

function deleteBuku(id) {
  hapusCallback = () => {
    localDB.buku = localDB.buku.filter(b => b.id !== id);
    saveLocalDB(); renderBuku(); showToast('Buku dihapus!', 'success');
  };
  document.getElementById('hapusMsg').textContent = 'Yakin ingin menghapus data buku ini?';
  openModal('modalHapus');
}

// ====================== ANGGOTA ======================
function renderAnggota(q = '') {
  const list = localDB.anggota.filter(a => !q || a.nama.toLowerCase().includes(q.toLowerCase()) || a.nis.includes(q));
  document.getElementById('tableAnggota').innerHTML = list.length ? list.map(a => `
    <tr>
      <td>${a.nis}</td>
      <td><strong>${a.nama}</strong></td>
      <td>${a.kelas}</td>
      <td>${a.username}</td>
      <td>${a.status === 'aktif' ? '<span class="badge badge-success">Aktif</span>' : '<span class="badge badge-danger">Non-Aktif</span>'}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="editAnggota(${a.id})">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteAnggota(${a.id})">🗑️</button>
      </td>
    </tr>
  `).join('') : `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">👥</div>Tidak ada anggota ditemukan</div></td></tr>`;
}

function openModalAnggota(id = null) {
  document.getElementById('modalAnggotaTitle').textContent = id ? 'Edit Anggota' : 'Tambah Anggota';
  document.getElementById('anggotaId').value = id || '';
  if (id) {
    const a = localDB.anggota.find(x => x.id === id);
    document.getElementById('anggotaNis').value = a.nis;
    document.getElementById('anggotaNama').value = a.nama;
    document.getElementById('anggotaKelas').value = a.kelas;
    document.getElementById('anggotaUsername').value = a.username;
    document.getElementById('anggotaPassword').value = '';
    document.getElementById('anggotaStatus').value = a.status;
  } else {
    ['anggotaNis', 'anggotaNama', 'anggotaKelas', 'anggotaUsername', 'anggotaPassword'].forEach(i => document.getElementById(i).value = '');
    document.getElementById('anggotaStatus').value = 'aktif';
  }
  openModal('modalAnggota');
}
function editAnggota(id) { openModalAnggota(id); }

function saveAnggota() {
  const id = document.getElementById('anggotaId').value;
  const nis = document.getElementById('anggotaNis').value.trim();
  const nama = document.getElementById('anggotaNama').value.trim();
  const kelas = document.getElementById('anggotaKelas').value.trim();
  const username = document.getElementById('anggotaUsername').value.trim();
  const password = document.getElementById('anggotaPassword').value.trim();
  const status = document.getElementById('anggotaStatus').value;

  if (!nis || !nama || !kelas) {
    showToast('Isi NIS, Nama, dan Kelas!', 'error');
    return;
  }

  if (id) {
    const idx = localDB.anggota.findIndex(a => a.id === parseInt(id));
    localDB.anggota[idx] = { ...localDB.anggota[idx], nis, nama, kelas, username: username || localDB.anggota[idx].username, status };
    if (password) localDB.anggota[idx].password = password;
    showToast('Anggota berhasil diperbarui!', 'success');
  } else {
    if (!username || !password) { showToast('Username dan password wajib diisi!', 'error'); return; }
    if (localDB.anggota.find(a => a.username === username)) { showToast('Username sudah digunakan!', 'error'); return; }
    localDB.anggota.push({ id: localDB.nextAnggotaId++, nis, nama, kelas, username, password, status });
    showToast('Anggota berhasil ditambahkan!', 'success');
  }
  saveLocalDB(); closeModal('modalAnggota'); renderAnggota();
}

function deleteAnggota(id) {
  hapusCallback = () => {
    localDB.anggota = localDB.anggota.filter(a => a.id !== id);
    saveLocalDB(); renderAnggota(); showToast('Anggota dihapus!', 'success');
  };
  document.getElementById('hapusMsg').textContent = 'Yakin ingin menghapus data anggota ini?';
  openModal('modalHapus');
}

// ====================== TRANSAKSI ======================
function updateStatus() {
  const today = new Date().toISOString().split('T')[0];
  localDB.transaksi.forEach(t => {
    if (t.status === 'dipinjam' && t.tglKembali < today) t.status = 'terlambat';
    if (t.status === 'terlambat' && t.tglKembali >= today) t.status = 'dipinjam';
  });
}

function renderTransaksi(q = '', filterStatus = '') {
  updateStatus();
  let list = localDB.transaksi;
  if (q) {
    list = list.filter(t => {
      const a = localDB.anggota.find(x => x.id === t.anggotaId);
      const b = localDB.buku.find(x => x.id === t.bukuId);
      return a?.nama.toLowerCase().includes(q.toLowerCase()) || b?.judul.toLowerCase().includes(q.toLowerCase());
    });
  }
  if (filterStatus) list = list.filter(t => t.status === filterStatus);

  document.getElementById('tableTransaksi').innerHTML = list.length ? [...list].reverse().map(t => {
    const a = localDB.anggota.find(x => x.id === t.anggotaId);
    const b = localDB.buku.find(x => x.id === t.bukuId);

    // Hitung denda: estimasi untuk aktif, final untuk selesai
    let dendaTampil = 0;
    if (t.status === 'dikembalikan') {
      dendaTampil = t.denda || 0;
    } else {
      dendaTampil = hitungDenda(t.tglKembali);
    }

    const aksi = t.status !== 'dikembalikan'
      ? `<button class="btn btn-outline btn-sm" onclick="adminKembalikan(${t.id})">↩️ Kembalikan</button>`
      : `<span style="color:var(--muted);font-size:12px">Selesai</span>`;
    return `<tr>
      <td>#${t.id}</td><td>${a?.nama || '?'}</td><td>${b?.judul || '?'}</td>
      <td>${t.tglPinjam}</td><td>${t.tglKembali}</td><td>${badgeStatus(t.status)}</td>
      <td>${dendaTampil > 0 ? `Rp ${dendaTampil.toLocaleString('id-ID')}` : '-'}</td>
      <td>${aksi}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">🔄</div>Tidak ada transaksi</div></td></tr>`;
}

function openModalTransaksi() {
  const anggotaOpts = localDB.anggota.filter(a => a.status === 'aktif').map(a => `<option value="${a.id}">${a.nama} (${a.kelas})</option>`).join('');
  const bukuOpts = localDB.buku.filter(b => b.stok > 0).map(b => `<option value="${b.id}">${b.judul} (Stok: ${b.stok})</option>`).join('');
  document.getElementById('trxAnggota').innerHTML = anggotaOpts || '<option>Tidak ada anggota</option>';
  document.getElementById('trxBuku').innerHTML = bukuOpts || '<option>Tidak ada buku tersedia</option>';
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('trxTglPinjam').value = today;
  const ret = new Date(); ret.setDate(ret.getDate() + 7);
  document.getElementById('trxTglKembali').value = ret.toISOString().split('T')[0];
  openModal('modalTransaksi');
}

function saveTransaksi() {
  const anggotaId = parseInt(document.getElementById('trxAnggota').value);
  const bukuId = parseInt(document.getElementById('trxBuku').value);
  const tglPinjam = document.getElementById('trxTglPinjam').value;
  const tglKembali = document.getElementById('trxTglKembali').value;

  if (!anggotaId || !bukuId || !tglPinjam || !tglKembali) { showToast('Lengkapi semua data!', 'error'); return; }

  const buku = localDB.buku.find(b => b.id === bukuId);
  if (buku.stok < 1) { showToast('Stok buku habis!', 'error'); return; }

  localDB.transaksi.push({ id: localDB.nextTrxId++, anggotaId, bukuId, tglPinjam, tglKembali, status: 'dipinjam', denda: 0 });
  buku.stok--;
  saveLocalDB(); closeModal('modalTransaksi'); renderTransaksi();
  showToast('Transaksi berhasil disimpan!', 'success');
}

function adminKembalikan(id) {
  const t = localDB.transaksi.find(x => x.id === id);
  if (t.status === 'dikembalikan') return;

  const today = new Date().toISOString().split('T')[0];
  const denda = hitungDenda(t.tglKembali, today);
  t.status = 'dikembalikan';
  t.denda = denda;
  t.tglDikembalikan = today;

  const buku = localDB.buku.find(b => b.id === t.bukuId);
  if (buku) buku.stok++;

  saveLocalDB(); renderTransaksi();
  const msg = denda > 0 ? `Buku dikembalikan. Denda: Rp ${denda.toLocaleString('id-ID')}` : 'Buku berhasil dikembalikan!';
  showToast(msg, 'success');
}

// ====================== SISWA VIEWS ======================
function renderSiswaDashboard() {
  updateStatus();
  const myTrx = localDB.transaksi.filter(t => t.anggotaId === currentUser.id);
  const aktif = myTrx.filter(t => t.status !== 'dikembalikan').length;
  const selesai = myTrx.filter(t => t.status === 'dikembalikan').length;
  const terlambat = myTrx.filter(t => t.status === 'terlambat').length;

  document.getElementById('siswaStats').innerHTML = `
    <div class="stat-card"><span class="stat-icon">📖</span><div class="stat-label">Sedang Dipinjam</div><div class="stat-value" style="color:var(--accent)">${aktif}</div></div>
    <div class="stat-card"><span class="stat-icon">✅</span><div class="stat-label">Sudah Dikembalikan</div><div class="stat-value" style="color:var(--success)">${selesai}</div></div>
    <div class="stat-card"><span class="stat-icon">⚠️</span><div class="stat-label">Terlambat</div><div class="stat-value" style="color:var(--danger)">${terlambat}</div></div>
    <div class="stat-card"><span class="stat-icon">📚</span><div class="stat-label">Total Buku Tersedia</div><div class="stat-value" style="color:var(--info)">${localDB.buku.filter(b => b.stok > 0).length}</div></div>
  `;

  document.getElementById('siswaRiwayat').innerHTML = myTrx.length ? [...myTrx].reverse().map(t => {
    const b = localDB.buku.find(x => x.id === t.bukuId);
    let dendaTampil = 0;
    if (t.status === 'dikembalikan') {
      dendaTampil = t.denda || 0;
    } else {
      dendaTampil = hitungDenda(t.tglKembali);
    }
    return `<tr>
      <td>${b?.judul || '?'}</td><td>${t.tglPinjam}</td><td>${t.tglKembali}</td>
      <td>${badgeStatus(t.status)}</td>
      <td>${dendaTampil > 0 ? `Rp ${dendaTampil.toLocaleString('id-ID')}` : '-'}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">📋</div>Belum ada riwayat pinjaman</div></td></tr>`;
}

function renderKatalog(q = '') {
  const list = localDB.buku.filter(b => !q || b.judul.toLowerCase().includes(q.toLowerCase()) || b.pengarang.toLowerCase().includes(q.toLowerCase()));
  document.getElementById('tableKatalog').innerHTML = list.length ? list.map(b => `
    <tr>
      <td><strong>${b.judul}</strong><br><span style="color:var(--muted);font-size:12px">${b.deskripsi || ''}</span></td>
      <td>${b.pengarang}</td>
      <td><span class="badge badge-info">${b.kategori}</span></td>
      <td>${b.stok > 0 ? `<span class="badge badge-success">${b.stok} tersedia</span>` : '<span class="badge badge-danger">Habis</span>'}</td>
      <td>${b.stok > 0 ? `<button class="btn btn-gold btn-sm" onclick="openPinjamSiswa(${b.id})">📖 Pinjam</button>` : '-'}</td>
    </tr>
  `).join('') : `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">📚</div>Tidak ada buku ditemukan</div></td></tr>`;
}

function renderPinjamanSaya() {
  updateStatus();
  const myTrx = localDB.transaksi.filter(t => t.anggotaId === currentUser.id && t.status !== 'dikembalikan');
  document.getElementById('tablePinjamanSaya').innerHTML = myTrx.length ? myTrx.map(t => {
    const b = localDB.buku.find(x => x.id === t.bukuId);
    return `<tr>
      <td><strong>${b?.judul || '?'}</strong></td><td>${t.tglPinjam}</td><td>${t.tglKembali}</td>
      <td>${badgeStatus(t.status)}</td>
      <td><button class="btn btn-outline btn-sm" onclick="openKembali(${t.id})">↩️ Kembalikan</button></td>
    </tr>`;
  }).join('') : `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">📋</div>Tidak ada pinjaman aktif</div></td></tr>`;
}

function openPinjamSiswa(bukuId) {
  const b = localDB.buku.find(x => x.id === bukuId);
  document.getElementById('pinjamBukuId').value = bukuId;
  document.getElementById('pinjamBukuInfo').innerHTML = `<strong>${b.judul}</strong><br><span style="color:var(--muted)">${b.pengarang} • ${b.kategori}</span>`;
  const ret = new Date(); ret.setDate(ret.getDate() + 7);
  document.getElementById('pinjamTglKembali').value = ret.toISOString().split('T')[0];
  openModal('modalPinjamSiswa');
}

function doPinjamSiswa() {
  const bukuId = parseInt(document.getElementById('pinjamBukuId').value);
  const tglKembali = document.getElementById('pinjamTglKembali').value;
  const today = new Date().toISOString().split('T')[0];

  if (!tglKembali) { showToast('Pilih tanggal kembali!', 'error'); return; }

  const sudahPinjam = localDB.transaksi.find(t => t.anggotaId === currentUser.id && t.bukuId === bukuId && t.status !== 'dikembalikan');
  if (sudahPinjam) { showToast('Anda sudah meminjam buku ini!', 'error'); return; }

  const buku = localDB.buku.find(b => b.id === bukuId);
  if (buku.stok < 1) { showToast('Stok buku habis!', 'error'); return; }

  localDB.transaksi.push({ id: localDB.nextTrxId++, anggotaId: currentUser.id, bukuId, tglPinjam: today, tglKembali, status: 'dipinjam', denda: 0 });
  buku.stok--;
  saveLocalDB();
  closeModal('modalPinjamSiswa');
  showToast('Buku berhasil dipinjam!', 'success');
  renderKatalog(); renderSiswaDashboard();
}

function openKembali(trxId) {
  const t = localDB.transaksi.find(x => x.id === trxId);
  const b = localDB.buku.find(x => x.id === t.bukuId);
  const today = new Date().toISOString().split('T')[0];
  const estimasiDenda = hitungDenda(t.tglKembali, today);

  document.getElementById('kembaliTrxId').value = trxId;
  document.getElementById('kembaliInfo').innerHTML = `
    <strong>${b?.judul || '?'}</strong><br>
    <span style="color:var(--muted)">Tgl pinjam: ${t.tglPinjam} | Tgl kembali: ${t.tglKembali}</span>
    ${estimasiDenda > 0 ? `<br><span style="color:var(--danger)">⚠️ Denda keterlambatan: Rp ${estimasiDenda.toLocaleString('id-ID')}</span>` : ''}
  `;
  openModal('modalKembali');
}

function doKembali() {
  const trxId = parseInt(document.getElementById('kembaliTrxId').value);
  const t = localDB.transaksi.find(x => x.id === trxId);
  if (t.status === 'dikembalikan') return;

  const today = new Date().toISOString().split('T')[0];
  const denda = hitungDenda(t.tglKembali, today);
  t.status = 'dikembalikan';
  t.denda = denda;
  t.tglDikembalikan = today;

  const buku = localDB.buku.find(b => b.id === t.bukuId);
  if (buku) buku.stok++;

  saveLocalDB();
  closeModal('modalKembali');
  const msg = denda > 0 ? `Buku dikembalikan. Denda: Rp ${denda.toLocaleString('id-ID')}` : 'Buku berhasil dikembalikan!';
  showToast(msg, 'success');
  renderPinjamanSaya(); renderSiswaDashboard();
}

// ====================== HELPERS ======================
function badgeStatus(status) {
  const map = {
    'dipinjam': '<span class="badge badge-info">📖 Dipinjam</span>',
    'dikembalikan': '<span class="badge badge-success">✅ Dikembalikan</span>',
    'terlambat': '<span class="badge badge-danger">⚠️ Terlambat</span>',
  };
  return map[status] || status;
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); });
});

function confirmHapus() {
  if (hapusCallback) { hapusCallback(); hapusCallback = null; }
  closeModal('modalHapus');
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `show ${type}`;
  setTimeout(() => { t.className = ''; }, 3000);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('loginScreen').style.display !== 'none') doLogin();
  if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
});

// ====================== EKSPOR FUNGSI GLOBAL ======================
window.setRole = setRole;
window.doLogin = doLogin;
window.showRegister = showRegister;
window.showLogin = showLogin;
window.doRegister = doRegister;
window.doLogout = doLogout;
window.navClick = navClick;
window.renderBuku = renderBuku;
window.openModalBuku = openModalBuku;
window.editBuku = editBuku;
window.saveBuku = saveBuku;
window.deleteBuku = deleteBuku;
window.renderAnggota = renderAnggota;
window.openModalAnggota = openModalAnggota;
window.editAnggota = editAnggota;
window.saveAnggota = saveAnggota;
window.deleteAnggota = deleteAnggota;
window.renderTransaksi = renderTransaksi;
window.openModalTransaksi = openModalTransaksi;
window.saveTransaksi = saveTransaksi;
window.adminKembalikan = adminKembalikan;
window.renderKatalog = renderKatalog;
window.openPinjamSiswa = openPinjamSiswa;
window.doPinjamSiswa = doPinjamSiswa;
window.openKembali = openKembali;
window.doKembali = doKembali;
window.closeModal = closeModal;
window.confirmHapus = confirmHapus;