// ==========================================
// 1. KISI-KISI KONFIGURASI
// ==========================================
const cloudName = "dsqwf6trc"; 
const uploadPreset = "preset_ig_clone"; 

const firebaseConfig = {
  apiKey: "AIzaSyCnHsylgi9PDRQeu_8ORYd1l7WHmAsIw0M",
  authDomain: "igkw-1723.firebaseapp.com",
  projectId: "igkw-1723",
  storageBucket: "igkw-1723.firebasestorage.app",
  messagingSenderId: "430181778119",
  appId: "1:430181778119:web:4e3e5333ee328c10ee74e2"
};

const databaseURL = "https://igkw-1723-default-rtdb.asia-southeast1.firebasedatabase.app/";
const passAdmin = "123456"; 

let emailPenerimaAdmin = ""; 
const teleToken = "ISI_TOKEN_BOT_TELE_DISINI";
const teleChatID = "ISI_CHAT_ID_TELE_DISINI";
const emailServiceID = "service_fene71o";
const emailTemplateID = "template_zjnqojm";

// ==========================================
// 2. INISIALISASI FIREBASE AUTH
// ==========================================
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

auth.getRedirectResult().catch(err => { showToast("Error Google: " + err.message); });

let currentUser = null; 
let profilSedangDilihat = null; 

auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        profilSedangDilihat = user.uid;
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("page-profil").style.display = "block";
        
        loadConfig();
        loadGridOtomatis();
    } else {
        currentUser = null;
        profilSedangDilihat = null;
        document.getElementById("login-screen").style.display = "flex";
        document.getElementById("page-profil").style.display = "none";
        const lagu = document.getElementById("musik-utama");
        if(lagu) lagu.pause();
    }
});

function showToast(pesan) {
    const toast = document.getElementById("ig-toast");
    document.getElementById("toast-text").innerText = pesan;
    toast.style.visibility = "visible";
    toast.style.opacity = "1";
    toast.style.bottom = "50px"; 
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.bottom = "30px";
        setTimeout(() => { toast.style.visibility = "hidden"; }, 300);
    }, 3000);
}

function loginEmail() {
    const e = document.getElementById("email-input").value;
    const p = document.getElementById("pass-input").value;
    if(!e || !p) return showToast("Isi email dan password dulu ya!");
    auth.signInWithEmailAndPassword(e, p).catch(err => { showToast("Gagal login: " + err.message); });
}

function registerEmail() {
    const e = document.getElementById("email-input").value;
    const p = document.getElementById("pass-input").value;
    if(!e || !p) return showToast("Isi email dan password buat daftar!");
    auth.createUserWithEmailAndPassword(e, p)
        .then((userCredential) => {
            fetch(`${databaseURL}users/${userCredential.user.uid}/config.json`, {
                method: "PUT",
                body: JSON.stringify({ username: "Pengguna Baru", bio: "Halo, saya pengguna baru!" })
            }).then(() => { showToast("Daftar berhasil, memuat..."); });
        }).catch(err => { showToast("Gagal daftar: " + err.message); });
}

function loginGoogle() { auth.signInWithPopup(googleProvider).catch(err => { showToast("Error Google: " + err.message); }); }
function logoutUser() { auth.signOut().then(() => location.reload()); }
function getNamaUser() {
    if(!currentUser) return "Anonim";
    if(currentUser.displayName) return currentUser.displayName;
    return currentUser.email.split('@')[0]; 
}

// ==========================================
// 3. UI GLOBAL & ADMIN PANEL
// ==========================================
let fotoAktif = ""; 
let listMomen = [];
let indexSkrg = 0;

function bukaTab(tab) {
    document.getElementById('tab-grid').className = (tab === 'grid') ? 'tab-active' : 'tab-inactive';
    document.getElementById('tab-upload').className = (tab === 'upload') ? 'tab-active' : 'tab-inactive';
    document.getElementById('grid-section').style.display = (tab === 'grid') ? 'grid' : 'none';
    document.getElementById('upload-section').style.display = (tab === 'upload') ? 'block' : 'none';
}

function bukaAdmin() {
    const pwd = prompt("Masukkan Password Admin:");
    if (pwd === passAdmin) document.getElementById("admin-panel").style.display = "block";
    else if (pwd !== null) alert("Password Salah!");
}
function tutupAdmin() { document.getElementById("admin-panel").style.display = "none"; }

async function uploadKeCloudinary(file, tipeMedia) {
    if (cloudName.includes("ISI_") || uploadPreset.includes("ISI_")) throw new Error("Cloudinary belum disetting!");
    const urlCloudinary = `https://api.cloudinary.com/v1_1/${cloudName}/${tipeMedia}/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    const res = await fetch(urlCloudinary, { method: "POST", body: formData });
    const result = await res.json();
    if (result.secure_url) return result.secure_url;
    throw new Error(result.error.message || "Gagal upload ke server Cloudinary");
}

async function simpanConfig() {
    if(!currentUser) return;
    const emailBaru = document.getElementById("inp-email-notif").value.trim();
    const unameBaru = document.getElementById("inp-username").value.trim();
    const bioBaru = document.getElementById("inp-bio").value.trim();
    const filePP = document.getElementById("inp-file-pp").files[0];
    const fileMusik = document.getElementById("inp-file-musik").files[0];

    if (!emailBaru && !unameBaru && !bioBaru && !filePP && !fileMusik) { 
        return alert("Isi formnya atau pilih file yang mau diubah dong!"); 
    }
    
    const btn = document.getElementById("btn-simpan-config");
    btn.innerHTML = "Menyimpan Data... ⏳"; btn.disabled = true;

    let dataUpdate = {};
    if (emailBaru) dataUpdate.emailNotif = emailBaru;
    if (unameBaru) dataUpdate.username = unameBaru;
    if (bioBaru) dataUpdate.bio = bioBaru;

    try {
        if (filePP) { btn.innerHTML = "Lagi Upload Foto Profil... ⏳"; dataUpdate.fotoProfil = await uploadKeCloudinary(filePP, "image"); }
        if (fileMusik) { btn.innerHTML = "Lagi Upload Lagu... ⏳"; dataUpdate.musikUtama = await uploadKeCloudinary(fileMusik, "video"); }
        
        btn.innerHTML = "Menyimpan ke Database... ⏳";
        await fetch(`${databaseURL}users/${currentUser.uid}/config.json`, { 
            method: "PATCH", body: JSON.stringify(dataUpdate) 
        });
        
        alert("Mantap! Profil berhasil diupdate! 💾"); 
        window.location.href = window.location.pathname + "?t=" + Date.now();
    } catch (e) { 
        alert("Yah, ada yang gagal: " + e.message); 
        btn.innerHTML = "Simpan Profil 💾"; btn.disabled = false; 
    }
}

function loadConfig() {
    if(!currentUser) return;
    fetch(`${databaseURL}users/${currentUser.uid}/config.json?t=${Date.now()}`)
    .then(r => r.json()).then(data => {
        if (!data) return;
        if (data.emailNotif) { emailPenerimaAdmin = data.emailNotif; document.getElementById("inp-email-notif").value = data.emailNotif; }
        if (data.fotoProfil) document.getElementById("tampil-foto-profil").src = data.fotoProfil;
        if (data.musikUtama) {
            const lagu = document.getElementById("musik-utama");
            if (lagu) { lagu.src = data.musikUtama; lagu.play().catch(e => console.log("Menunggu sentuhan layar")); }
        }
        if (data.username) {
            document.getElementById("tampil-username-profil").innerText = data.username;
            document.getElementById("inp-username").value = data.username; 
        }
        if (data.bio) { 
            document.getElementById("tampil-bio").innerText = data.bio; 
            document.getElementById("inp-bio").value = data.bio; 
        }
    }).catch(e => console.log("Gagal memuat config"));
}

// ==========================================
// 4. UPLOAD FOTO & VIDEO
// ==========================================
function previewFile() {
    const file = document.getElementById('inp-file').files[0];
    const imgPreview = document.getElementById('img-preview');
    const vidPreview = document.getElementById('vid-preview');
    const label = document.getElementById('label-pilih');

    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            label.style.display = 'none';
            if (file.type.startsWith('video/')) {
                imgPreview.style.display = 'none'; vidPreview.src = e.target.result; vidPreview.style.display = 'block';
            } else {
                vidPreview.style.display = 'none'; imgPreview.src = e.target.result; imgPreview.style.display = 'block';
            }
        }
        reader.readAsDataURL(file);
    }
}

async function prosesUpload() {
    if(!currentUser) return;
    const fileInput = document.getElementById('inp-file').files[0];
    const caption = document.getElementById('inp-cap').value.trim();
    if (!fileInput) return alert("Pilih foto/video!");
    if (!caption) return alert("Tulis captionnya!");
    
    const btn = document.getElementById('btn-upload'); 
    btn.innerHTML = "Upload ke Server... ⏳"; btn.disabled = true;

    const isVideo = fileInput.type.startsWith('video/');
    const tipeMedia = isVideo ? 'video' : 'image';
    try {
        const urlCloudinary = await uploadKeCloudinary(fileInput, tipeMedia);
        btn.innerHTML = "Menyimpan ke Database... ⏳";
        await fetch(`${databaseURL}users/${currentUser.uid}/posts.json`, { 
            method: "POST", body: JSON.stringify({ url: urlCloudinary, cap: caption, type: tipeMedia, t: Date.now() }) 
        });
        notifTele(`📸 MOMEN BARU oleh ${getNamaUser()}!`);
        kirimEmailKeEka("Sistem Notif", `Ada momen baru!`, urlCloudinary);
        
        alert("Berhasil Terkirim!");
        document.getElementById('inp-file').value = "";
        document.getElementById('inp-cap').value = "";
        document.getElementById('img-preview').style.display = "none";
        document.getElementById('vid-preview').style.display = "none";
        document.getElementById('label-pilih').style.display = "block";
        btn.innerHTML = "Bagikan 🚀"; 
        btn.disabled = false;
        
        bukaTab('grid');
        loadGridOtomatis(); 
    } catch (error) { 
        alert("Upload gagal: " + error.message); 
        btn.innerHTML = "Bagikan 🚀"; btn.disabled = false; 
    }
}

function loadGridOtomatis() {
    if(!currentUser) return;
    profilSedangDilihat = currentUser.uid;
    fetch(`${databaseURL}users/${currentUser.uid}/posts.json?t=${Date.now()}`).then(r => r.json()).then(data => {
        const grid = document.getElementById("grid-section");
        if(!data) { grid.innerHTML = ""; document.getElementById("post-count").innerText = "0"; return; }
        
        listMomen = Object.keys(data).reverse().map(k => ({ key: k, uid: currentUser.uid, ...data[k] }));
        document.getElementById("post-count").innerText = listMomen.length;
        let h = "";
        listMomen.forEach((i, idx) => {
            const isVid = i.type === "video" || i.url.includes(".mp4") || i.url.includes("/video/upload");
            h += `<div onclick="bukaModalIndex(${idx})" style="width: 100%; aspect-ratio: 1/1; position: relative; overflow: hidden; cursor: pointer; border: 1px solid #fff;">
                    ${isVid ? `<video src="${i.url}" autoplay loop muted playsinline style="position: absolute; width: 100%; height: 100%; object-fit: cover;"></video>` : `<img src="${i.url}" style="position: absolute; width: 100%; height: 100%; object-fit: cover;">`}
                  </div>`;
        });
        grid.innerHTML = h;
    });
}

// MODAL FOTO LOGIC & HAPUS POST
function bukaModalIndex(idx) {
    indexSkrg = idx; const item = listMomen[idx]; fotoAktif = item.url.replace(/[\.\/\:\#\$\[\]]/g, '_');
    document.getElementById("myModal").style.display = "flex"; 
    
    let namaTampil = profilSedangDilihat === currentUser.uid ? document.getElementById("tampil-username-profil").innerText : document.getElementById("tampil-username-teman").innerText;
    document.getElementById("tampil-username-caption").innerText = namaTampil;
    document.getElementById("caption-text").innerText = item.cap;
    
    const btnHapus = document.getElementById("btn-hapus-post");
    if(item.uid === currentUser.uid) btnHapus.style.display = "inline";
    else btnHapus.style.display = "none";

    const cont = document.getElementById("modal-media-container");
    const lagu = document.getElementById("musik-utama");
    const isVid = item.type === "video" || item.url.includes(".mp4") || item.url.includes("/video/upload");
    
    // FIX: style ukuran foto 100% tinggi biar proporsional dan ga tumpah
    if(isVid) { if(lagu) lagu.volume = 0.1; cont.innerHTML = `<video src="${item.url}" controls autoplay loop style="width:100%; height:100%; object-fit:contain;"></video>`; } 
    else { if(lagu) lagu.volume = 1.0; cont.innerHTML = `<img src="${item.url}" style="width:100%; height:100%; object-fit:contain;">`; }
    tampilkanKomentar(true);
}

function geserMomen(arah) { indexSkrg += arah; if (indexSkrg < 0) indexSkrg = listMomen.length - 1; if (indexSkrg >= listMomen.length) indexSkrg = 0; bukaModalIndex(indexSkrg); }
function tutupModal() { 
    document.getElementById("myModal").style.display = "none"; 
    document.getElementById("modal-media-container").innerHTML = ""; 
    const lagu = document.getElementById("musik-utama"); if(lagu) lagu.volume = 1.0; 
}

function hapusPostingan() {
    if(!confirm("Yakin mau hapus postingan ini? Gak bisa dibalikin lho!")) return;
    const item = listMomen[indexSkrg];
    fetch(`${databaseURL}users/${currentUser.uid}/posts/${item.key}.json`, { method: "DELETE" })
    .then(() => {
        alert("Postingan berhasil dihapus 🗑️");
        tutupModal();
        loadGridOtomatis();
    });
}

// ==========================================
// 5. KOMENTAR 
// ==========================================
function tampilkanKomentar(scroll) {
    if(!currentUser) return;
    fetch(`${databaseURL}users/${profilSedangDilihat}/comments/${fotoAktif}.json?t=${Date.now()}`).then(r => r.json()).then(data => {
        const list = document.getElementById("comment-list");
        if(!data) { list.innerHTML = "<p style='font-size:12px; color:gray;'>Belum ada komen...</p>"; return; }
        let h = "";
        Object.keys(data).forEach(k => {
            const item = data[k]; let warnaNama = (item.uid === currentUser.uid) ? "#0095f6" : "#262626";
            h += `<div style="margin-bottom: 8px; font-size: 14px; text-align: left;">
                    <b style="font-family: 'Style Script', cursive; font-size: 18px; color: ${warnaNama};">${item.nama_user}</b> 
                    <div style="font-size: 13px; white-space: pre-wrap; margin-top: 2px;">${item.teks}</div>
                  </div>`;
        });
        list.innerHTML = h; if(scroll) list.scrollTop = list.scrollHeight;
    });
}

function kirimKomentar() {
    if(!currentUser) return;
    const inp = document.getElementById("input-komen"); let teks = inp.value.trim(); if(!teks) return;
    let u_nama = getNamaUser(); let u_id = currentUser.uid;
    fetch(`${databaseURL}users/${profilSedangDilihat}/comments/${fotoAktif}.json`, { 
        method: "POST", body: JSON.stringify({ nama_user: u_nama, uid: u_id, teks: teks, t: Date.now() }) 
    }).then(() => { inp.value = ""; tampilkanKomentar(true); notifTele(`🔔 KOMEN: ${u_nama} bilang "${teks}"`); });
}

// ==========================================
// 6. FITUR CARI TEMAN, PROFIL TEMAN & DM PRIBADI
// ==========================================
let semuaUser = {};
let idTemanChat = null;
let namaTemanChat = "";
let intervalDM = null;

function bukaInbox() {
    if(!currentUser) return;
    document.getElementById('modal-kontak').style.display = 'flex';
    const wadah = document.getElementById("daftar-teman-container");
    wadah.innerHTML = "<p style='text-align:center; color:gray;'>Mencari pengguna lain... ⏳</p>";
    
    fetch(`${databaseURL}users.json?t=${Date.now()}`).then(r => r.json()).then(data => {
        if(!data) { wadah.innerHTML = "<p style='text-align:center;'>Belum ada pengguna terdaftar.</p>"; return; }
        semuaUser = data;
        renderDaftarTeman("");
    });
}

function cariTeman() { renderDaftarTeman(document.getElementById("input-cari-teman").value.toLowerCase()); }

function renderDaftarTeman(kata) {
    const wadah = document.getElementById("daftar-teman-container");
    let h = "";
    Object.keys(semuaUser).forEach(uid => {
        if(uid === currentUser.uid) return; 
        const usr = semuaUser[uid];
        if(!usr.config) return;
        const uname = usr.config.username || "Anonim";
        
        if(uname.toLowerCase().includes(kata)) {
            const pp = usr.config.fotoProfil || "https://via.placeholder.com/150";
            const bio = usr.config.bio ? usr.config.bio.substring(0, 30) + "..." : "Pengguna Instagram";
            
            h += `<div onclick="bukaProfilTeman('${uid}')" style="display:flex; align-items:center; margin-bottom:15px; padding:10px; background:white; border-radius:12px; box-shadow:0 2px 5px rgba(0,0,0,0.05); cursor:pointer;">
                    <img src="${pp}" style="width:50px; height:50px; border-radius:50%; object-fit:cover; margin-right:15px; border:1px solid #efefef;">
                    <div style="flex-grow:1;">
                        <b style="font-size:16px; color:#262626; display:block;">${uname}</b>
                        <span style="font-size:12px; color:gray;">${bio}</span>
                    </div>
                    <button style="background:#0095f6; color:white; border:none; padding:8px 15px; border-radius:8px; font-weight:bold; font-size:12px;">Lihat Profil</button>
                  </div>`;
        }
    });
    wadah.innerHTML = h || "<p style='text-align:center; color:gray; margin-top:20px;'>Pengguna tidak ditemukan.</p>";
}

function bukaProfilTeman(uidTarget) {
    profilSedangDilihat = uidTarget;
    document.getElementById('modal-kontak').style.display = 'none';
    document.getElementById('page-profil').style.display = 'none';
    document.getElementById('page-profil-teman').style.display = 'block';
    
    const usr = semuaUser[uidTarget];
    document.getElementById('tampil-username-teman').innerText = usr.config?.username || "Anonim";
    document.getElementById('tampil-foto-teman').src = usr.config?.fotoProfil || "https://via.placeholder.com/150";
    document.getElementById('tampil-bio-teman').innerText = usr.config?.bio || "Bio kosong";
    
    document.getElementById('btn-chat-teman').onclick = () => {
        bukaChatPribadi(uidTarget, usr.config?.username, usr.config?.fotoProfil);
    };

    const grid = document.getElementById("grid-section-teman");
    if(usr.posts) {
        listMomen = Object.keys(usr.posts).reverse().map(k => ({ key: k, uid: uidTarget, ...usr.posts[k] }));
        document.getElementById("post-count-teman").innerText = listMomen.length;
        let h = "";
        listMomen.forEach((i, idx) => {
            const isVid = i.type === "video" || i.url.includes(".mp4") || i.url.includes("/video/upload");
            h += `<div onclick="bukaModalIndex(${idx})" style="width: 100%; aspect-ratio: 1/1; position: relative; overflow: hidden; cursor: pointer; border: 1px solid #fff;">
                    ${isVid ? `<video src="${i.url}" autoplay loop muted playsinline style="position: absolute; width: 100%; height: 100%; object-fit: cover;"></video>` : `<img src="${i.url}" style="position: absolute; width: 100%; height: 100%; object-fit: cover;">`}
                  </div>`;
        });
        grid.innerHTML = h;
    } else {
        grid.innerHTML = ""; document.getElementById("post-count-teman").innerText = "0"; listMomen = [];
    }
}

function tutupProfilTeman() {
    document.getElementById('page-profil-teman').style.display = 'none';
    document.getElementById('page-profil').style.display = 'block';
    profilSedangDilihat = currentUser.uid;
    loadGridOtomatis(); 
}

function getRoomID(uid1, uid2) { return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`; }

function bukaChatPribadi(uidTarget, namaTarget, ppTarget) {
    idTemanChat = uidTarget; namaTemanChat = namaTarget;
    document.getElementById("nama-teman-dm").innerText = namaTarget;
    const ppEl = document.getElementById("pp-teman-dm");
    ppEl.src = ppTarget || "https://via.placeholder.com/150"; ppEl.style.display = "block";
    
    document.getElementById("page-profil-teman").style.display = "none";
    document.getElementById("modal-pesan").style.display = "flex";
    
    loadPesanPribadi();
    if(intervalDM) clearInterval(intervalDM);
    intervalDM = setInterval(loadPesanPribadi, 2000); 
}

function tutupDM() { 
    document.getElementById('modal-pesan').style.display = 'none'; 
    idTemanChat = null;
    if(intervalDM) clearInterval(intervalDM);
    
    if(profilSedangDilihat !== currentUser.uid) {
        document.getElementById('page-profil-teman').style.display = 'block';
    } else {
        document.getElementById('page-profil').style.display = 'block';
    }
}

function kirimPesanPribadi() {
    if(!currentUser || !idTemanChat) return;
    const inp = document.getElementById("isi-pesan-eka");
    let teks = inp.value.trim(); if(!teks) return;
    
    const roomID = getRoomID(currentUser.uid, idTemanChat);
    const u_nama = getNamaUser();
    
    fetch(`${databaseURL}chats/${roomID}.json`, { 
        method: "POST", body: JSON.stringify({ uid: currentUser.uid, nama_user: u_nama, m: teks, t: Date.now() }) 
    }).then(() => {
        fetch(`${databaseURL}chats_status/${roomID}.json`, { method: "PATCH", body: JSON.stringify({ lastSender: currentUser.uid, read: false }) });
        inp.value = ""; loadPesanPribadi();
        notifTele(`📩 DM Pribadi ke ${namaTemanChat}\nIsi: "${teks}"`);
    });
}

function loadPesanPribadi() {
    if(!currentUser || !idTemanChat) return;
    const roomID = getRoomID(currentUser.uid, idTemanChat);
    
    fetch(`${databaseURL}chats_status/${roomID}.json?t=${Date.now()}`).then(r=>r.json()).then(st => {
        if(st && st.lastSender !== currentUser.uid && !st.read) {
            fetch(`${databaseURL}chats_status/${roomID}.json`, { method: "PATCH", body: JSON.stringify({ read: true }) });
        }
        
        fetch(`${databaseURL}chats/${roomID}.json?t=${Date.now()}`).then(r => r.json()).then(data => {
            const c = document.getElementById("chat-container");
            if(!data) { c.innerHTML = "<div style='text-align:center; color:gray; margin-top:20px; font-size:14px;'>Belum ada pesan. Sapa dia! 👋</div>"; return; }
            
            const isScrolledToBottom = c.scrollHeight - c.clientHeight <= c.scrollTop + 50;
            let h = "";
            const keys = Object.keys(data);
            
            keys.forEach((k, idx) => {
                const i = data[k];
                const isMe = i.uid === currentUser.uid;
                
                const btnHapus = isMe ? `<span onclick="hapusPesan('${k}')" style="cursor:pointer; color:#ff4d4d; font-size:16px; margin-right:8px; display:flex; align-items:flex-end; padding-bottom:5px;" title="Hapus">🗑️</span>` : '';
                
                // DITAMBAHIN width: fit-content; BIAR MURNI NGE-PAS SAMA TEKS!
                h += `<div style="display:flex; justify-content:${isMe ? 'flex-end' : 'flex-start'}; margin-bottom: 8px; width: 100%;">
                        ${isMe ? btnHapus : ''}
                        <div style="background:${isMe ? '#0095f6' : '#efefef'}; color:${isMe ? '#fff' : '#000'}; padding:8px 12px; border-radius:15px; max-width:80%; font-size:14px; white-space: pre-wrap; word-break: break-word; text-align: left; width: fit-content;">
                            ${i.m}
                            <div style="font-size:9px; color:${isMe ? '#e0e0e0' : 'gray'}; text-align:right; margin-top:4px;">${new Date(i.t).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                      </div>`;
                      
                if(idx === keys.length - 1 && isMe && st) {
                    h += `<div style="font-size:10px; color:gray; text-align:${isMe ? 'right' : 'left'}; margin-top:-5px; margin-bottom:10px; padding-right:5px;">${st.read ? 'Dibaca ✓✓' : 'Terkirim ✓'}</div>`;
                }
            });
            
            c.innerHTML = h; 
            if(isScrolledToBottom) c.scrollTop = c.scrollHeight;
        });
    });
}

function hapusPesan(msgKey) {
    if(!confirm("Hapus pesan ini?")) return;
    const roomID = getRoomID(currentUser.uid, idTemanChat);
    fetch(`${databaseURL}chats/${roomID}/${msgKey}.json`, { method: 'DELETE' })
    .then(() => { loadPesanPribadi(); });
}

// 7. NOTIFIKASI API
function notifTele(m) { 
    if(teleToken.includes("ISI_TOKEN")) return;
    fetch(`https://api.telegram.org/bot${teleToken}/sendMessage?chat_id=${teleChatID}&text=${encodeURIComponent(m)}`); 
}
function kirimEmailKeEka(sub, isi, foto = "Momen Kita") { 
    if(emailServiceID.includes("ISI_SERVICE") || !emailPenerimaAdmin) return;
    emailjs.send(emailServiceID, emailTemplateID, { from_name: sub, message: isi, foto_url: foto, to_email: emailPenerimaAdmin }); 
}
