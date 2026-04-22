// ==========================================
// 1. KISI-KISI KONFIGURASI
// ==========================================

// --- KONFIGURASI CLOUDINARY ---
const cloudName = "dsqwf6trc"; 
// !!! PENTING: Ganti nama ini kalau lu bikin nama presetnya beda di web Cloudinary !!!
const uploadPreset = "preset_ig_clone"; 

// --- KONFIGURASI FIREBASE ---
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

// --- NOTIFIKASI EMAILJS & TELEGRAM ---
let emailPenerimaAdmin = ""; // Biarin kosong, ntar web yang ngisi dari Admin Panel
// !!! ISI BAGIAN BAWAH INI !!!
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

let currentUser = null; 

auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("page-profil").style.display = "block";
        loadGridOtomatis();
        setInterval(cekStatusPesan, 3000);
        if(lagu) lagu.play().catch(e => console.log("Auto-play diblok"));
    } else {
        currentUser = null;
        document.getElementById("login-screen").style.display = "flex";
        document.getElementById("page-profil").style.display = "none";
        if(lagu) lagu.pause();
    }
});

// --- FUNGSI BUAT NAMPILIN POPUP KEREN ---
function showToast(pesan) {
    const toast = document.getElementById("ig-toast");
    document.getElementById("toast-text").innerText = pesan;
    toast.style.visibility = "visible";
    toast.style.opacity = "1";
    toast.style.bottom = "50px"; 
    
    // Hilang otomatis setelah 3 detik
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
    
    auth.signInWithEmailAndPassword(e, p).catch(err => {
        if(err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            showToast("Akun tidak ditemukan atau password salah.");
        } else if (err.code === 'auth/invalid-email') {
            showToast("Format email salah Bos.");
        } else {
            showToast("Gagal login: " + err.message);
        }
    });
}

function registerEmail() {
    const e = document.getElementById("email-input").value;
    const p = document.getElementById("pass-input").value;
    if(!e || !p) return showToast("Isi email dan password buat daftar!");
    
    auth.createUserWithEmailAndPassword(e, p).catch(err => {
        if(err.code === 'auth/email-already-in-use') showToast("Email ini sudah dipakai akun lain.");
        else if(err.code === 'auth/weak-password') showToast("Password minimal 6 karakter Bos!");
        else showToast("Gagal daftar: " + err.message);
    });
}

function loginGoogle() { auth.signInWithRedirect(googleProvider); }


// ==========================================
// 3. UI GLOBAL & ADMIN PANEL
// ==========================================
const lagu = document.getElementById("musik-utama");
let fotoAktif = ""; 
let listMomen = [];
let indexSkrg = 0;

function putarMusik() { if(lagu) lagu.play().catch(e => {}); }

function bukaTab(tab) {
    document.getElementById('tab-grid').className = (tab === 'grid') ? 'tab-active' : 'tab-inactive';
    document.getElementById('tab-upload').className = (tab === 'upload') ? 'tab-active' : 'tab-inactive';
    document.getElementById('grid-section').style.display = (tab === 'grid') ? 'block' : 'none';
    document.getElementById('upload-section').style.display = (tab === 'upload') ? 'block' : 'none';
}

function bukaAdmin() {
    const pwd = prompt("Masukkan Password Admin:");
    if (pwd === passAdmin) document.getElementById("admin-panel").style.display = "block";
    else if (pwd !== null) alert("Password Salah!");
}
function tutupAdmin() { document.getElementById("admin-panel").style.display = "none"; }

// FUNGSI BANTUAN BUAT UPLOAD FILE KE CLOUDINARY
async function uploadKeCloudinary(file, tipeMedia) {
    if (cloudName.includes("ISI_") || uploadPreset.includes("ISI_")) throw new Error("Cloudinary belum disetting di kodingan!");
    const urlCloudinary = `https://api.cloudinary.com/v1_1/${cloudName}/${tipeMedia}/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const res = await fetch(urlCloudinary, { method: "POST", body: formData });
    const result = await res.json();
    if (result.secure_url) return result.secure_url;
    throw new Error(result.error.message || "Gagal upload ke server");
}

// LOGIKA BARU BUAT SIMPAN CONFIG (TERMASUK UPLOAD FILE OTOMATIS)
async function simpanConfig() {
    const emailBaru = document.getElementById("inp-email-notif").value.trim();
    const unameBaru = document.getElementById("inp-username").value.trim();
    const bioBaru = document.getElementById("inp-bio").value.trim();
    
    // Nangkep file yang dipilih
    const filePP = document.getElementById("inp-file-pp").files[0];
    const fileMusik = document.getElementById("inp-file-musik").files[0];

    if (!emailBaru && !unameBaru && !bioBaru && !filePP && !fileMusik) {
        return alert("Isi formnya atau pilih file yang mau diubah dong!");
    }

    const btn = document.getElementById("btn-simpan-config");
    btn.innerHTML = "Menyiapkan Data... ⏳"; 
    btn.disabled = true;

    let dataUpdate = {};
    if (emailBaru) dataUpdate.emailNotif = emailBaru;
    if (unameBaru) dataUpdate.username = unameBaru;
    if (bioBaru) dataUpdate.bio = bioBaru;

    try {
        // Kalau dia milih file PP, upload dulu secara rahasia ke Cloudinary
        if (filePP) {
            btn.innerHTML = "Lagi Upload Foto Profil... ⏳";
            dataUpdate.fotoProfil = await uploadKeCloudinary(filePP, "image");
        }
        
        // Kalau dia milih file MP3, upload dulu ke Cloudinary
        // Note: Cloudinary ngebaca file audio/MP3 lewat jalur "video"
        if (fileMusik) {
            btn.innerHTML = "Lagi Upload Lagu... ⏳";
            dataUpdate.musikUtama = await uploadKeCloudinary(fileMusik, "video");
        }

        btn.innerHTML = "Menyimpan ke Database... ⏳";
        await fetch(databaseURL + "config.json", { method: "PATCH", body: JSON.stringify(dataUpdate) });
        
        alert("Mantap! Profil berhasil diupdate! 💾"); 
        location.reload();
    } catch (e) { 
        alert("Yah, ada yang gagal: " + e.message); 
        btn.innerHTML = "Simpan Perubahan 💾"; 
        btn.disabled = false; 
    }
}

// NGAMBIL DATA PAS WEB DIBUKA
fetch(databaseURL + "config.json").then(r => r.json()).then(data => {
    if (!data) return;
    
    if (data.emailNotif) {
        emailPenerimaAdmin = data.emailNotif;
        document.getElementById("inp-email-notif").value = data.emailNotif; 
    }
    if (data.fotoProfil) document.getElementById("tampil-foto-profil").src = data.fotoProfil;
    if (data.musikUtama) document.getElementById("musik-utama").src = data.musikUtama;
    
    if (data.username) {
        document.getElementById("tampil-username-profil").innerText = data.username;
        document.getElementById("tampil-username-modal").innerText = data.username;
        document.getElementById("tampil-username-caption").innerText = data.username;
        document.getElementById("inp-username").value = data.username; 
    }
    if (data.bio) { 
        document.getElementById("tampil-bio").innerText = data.bio; 
        document.getElementById("inp-bio").value = data.bio; 
    }
}).catch(e => console.log("Gagal memuat config profil dari database"));


// ==========================================
// 4. UPLOAD FOTO & VIDEO (VIA CLOUDINARY)
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
                imgPreview.style.display = 'none';
                vidPreview.src = e.target.result;
                vidPreview.style.display = 'block';
            } else {
                vidPreview.style.display = 'none';
                imgPreview.src = e.target.result;
                imgPreview.style.display = 'block';
            }
        }
        reader.readAsDataURL(file);
    }
}

async function prosesUpload() {
    const fileInput = document.getElementById('inp-file').files[0];
    const caption = document.getElementById('inp-cap').value.trim();

    if (!fileInput) return alert("Pilih foto atau video dulu dari galeri!");
    if (!caption) return alert("Tulis captionnya dong!");
    if (cloudName.includes("ISI_") || uploadPreset.includes("ISI_")) return alert("Cloudinary belum disetting di kodingan!");

    const btn = document.getElementById('btn-upload'); 
    btn.innerHTML = "Lagi Upload ke Cloudinary... ⏳"; 
    btn.disabled = true;

    const isVideo = fileInput.type.startsWith('video/');
    const tipeMedia = isVideo ? 'video' : 'image';
    
    const urlCloudinary = `https://api.cloudinary.com/v1_1/${cloudName}/${tipeMedia}/upload`;

    const formData = new FormData();
    formData.append("file", fileInput);
    formData.append("upload_preset", uploadPreset);

    try {
        const res = await fetch(urlCloudinary, { method: "POST", body: formData });
        const result = await res.json();
        
        if (result.secure_url) {
            simpanKeFirebase(result.secure_url, caption, tipeMedia);
        } else {
            throw new Error(result.error.message || "Upload gagal dari server");
        }
    } catch (error) {
        alert("Upload gagal Bos: " + error.message); 
        btn.innerHTML = "Kirim Momen 🚀"; 
        btn.disabled = false;
    }
}

function simpanKeFirebase(url, cap, tipe) {
    fetch(databaseURL + "posts.json", { method: "POST", body: JSON.stringify({ url: url, cap: cap, type: tipe, t: Date.now() }) })
    .then(() => {
        notifTele(`📸 MOMEN BARU oleh ${getNamaUser()}!`);
        kirimEmailKeEka("Sistem Notif", `Ada momen baru! Cek web ya`, url);
        alert("Berhasil Terkirim!"); location.reload();
    });
}

function loadGridOtomatis() {
    fetch(databaseURL + "posts.json").then(r => r.json()).then(data => {
        const grid = document.getElementById("main-grid");
        if(!data) return;
        listMomen = Object.keys(data).reverse().map(k => data[k]);
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

// MODAL FOTO LOGIC
function bukaModalIndex(idx) {
    indexSkrg = idx; const item = listMomen[idx];
    fotoAktif = item.url.replace(/[\.\/\:\#\$\[\]]/g, '_');
    document.getElementById("myModal").style.display = "block";
    document.getElementById("caption-text").innerText = item.cap;
    const cont = document.getElementById("modal-media-container");
    const isVid = item.type === "video" || item.url.includes(".mp4") || item.url.includes("/video/upload");

    if(isVid) { if(lagu) lagu.volume = 0.1; cont.innerHTML = `<video src="${item.url}" controls autoplay loop style="width:100%"></video>`; } 
    else { if(lagu) lagu.volume = 1.0; cont.innerHTML = `<img src="${item.url}" style="width:100%; max-height:80vh; object-fit:contain;">`; }
    tampilkanKomentar(true);
}
function geserMomen(arah) { indexSkrg += arah; if (indexSkrg < 0) indexSkrg = listMomen.length - 1; if (indexSkrg >= listMomen.length) indexSkrg = 0; bukaModalIndex(indexSkrg); }
function tutupModal() { document.getElementById("myModal").style.display = "none"; document.getElementById("modal-media-container").innerHTML = ""; if(lagu) lagu.volume = 1.0; }

let touchstartX = 0; let touchendX = 0;
document.getElementById('myModal').addEventListener('touchstart', e => { touchstartX = e.changedTouches[0].screenX; });
document.getElementById('myModal').addEventListener('touchend', e => { touchendX = e.changedTouches[0].screenX; if (touchendX < touchstartX - 50) geserMomen(1); if (touchendX > touchstartX + 50) geserMomen(-1); });

// ==========================================
// 5. KOMENTAR 
// ==========================================
function tampilkanKomentar(scroll) {
    fetch(databaseURL + fotoAktif + ".json").then(r => r.json()).then(data => {
        const list = document.getElementById("comment-list");
        if(!data) { list.innerHTML = "<p style='font-size:12px; color:gray;'>Belum ada komen...</p>"; return; }
        let h = "";
        Object.keys(data).forEach(k => {
            const item = data[k];
            let warnaNama = (item.uid === currentUser.uid) ? "#0095f6" : "#262626";
            h += `<div style="margin-bottom: 8px; font-size: 14px; text-align: left;">
                    <b style="font-family: 'Style Script', cursive; font-size: 18px; color: ${warnaNama};">${item.nama_user}</b> 
                    <div style="font-size: 13px; white-space: pre-wrap; margin-top: 2px;">${item.teks}</div>
                  </div>`;
        });
        list.innerHTML = h;
        if(scroll) list.scrollTop = list.scrollHeight;
    });
}

function kirimKomentar() {
    const inp = document.getElementById("input-komen");
    let teks = inp.value.trim(); if(!teks) return;
    let u_nama = getNamaUser();
    let u_id = currentUser.uid;

    fetch(databaseURL + fotoAktif + ".json", { 
        method: "POST", body: JSON.stringify({ nama_user: u_nama, uid: u_id, teks: teks, t: Date.now() }) 
    }).then(() => {
        inp.value = ""; tampilkanKomentar(true);
        notifTele(`🔔 KOMEN: ${u_nama} bilang "${teks}"`);
    });
}

// ==========================================
// 6. DM RAHASIA
// ==========================================
function handleTyping() {
    fetch(databaseURL + "status.json", { method: "PATCH", body: JSON.stringify({ typing: Date.now(), typperUID: currentUser.uid }) });
}

function cekStatusPesan() {
    fetch(databaseURL + "status.json").then(r => r.json()).then(data => {
        if(!data) return;
        const sedangNgetik = (Date.now() - data.typing) < 3000;
        const bukanGua = data.typperUID !== currentUser.uid; 
        const typingEl = document.getElementById("typing-indicator");
        if(typingEl) typingEl.style.display = (sedangNgetik && bukanGua) ? "block" : "none";
    });
}

function bukaBoxPesan() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    document.getElementById('modal-pesan').style.display = 'block';
    loadPesanDM();
    
    fetch(databaseURL + "status.json").then(r => r.json()).then(data => {
        if(data && data.lastSenderUID !== currentUser.uid) {
            fetch(databaseURL + "status.json", { method: "PATCH", body: JSON.stringify({ read: true }) });
        }
    });
}

function tutupDM() { document.getElementById('modal-pesan').style.display = 'none'; }

function kirimPesanDM() {
    const inp = document.getElementById("isi-pesan-eka");
    let teks = inp.value.trim(); if(!teks) return;
    let u_nama = getNamaUser();
    
    fetch(databaseURL + "pesan_rahasia.json", { method: "POST", body: JSON.stringify({ nama_user: u_nama, uid: currentUser.uid, m: teks, t: Date.now() }) }).then(() => {
        fetch(databaseURL + "status.json", { method: "PATCH", body: JSON.stringify({ read: false, lastSenderUID: currentUser.uid }) });
        inp.value = ""; loadPesanDM();
        notifTele(`📩 DM DARI: ${u_nama}\nIsi: "${teks}"`);
    });
}

function loadPesanDM() {
    fetch(databaseURL + "pesan_rahasia.json").then(r => r.json()).then(data => {
        const c = document.getElementById("chat-container");
        fetch(databaseURL + "status.json").then(r => r.json()).then(st => {
            if(!data) return;
            let h = "";
            const keys = Object.keys(data);
            keys.forEach((k, idx) => {
                const i = data[k]; 
                const isMe = i.uid === currentUser.uid;
                
                h += `<div style="display:flex; justify-content:${isMe ? 'flex-end' : 'flex-start'}; margin-bottom: 8px;">
                        <div style="background:${isMe ? '#0095f6' : '#efefef'}; color:${isMe ? '#fff' : '#000'}; padding:8px 12px; border-radius:15px; max-width:80%; font-size:14px; white-space: pre-wrap;">
                            ${!isMe ? `<b style="font-size:10px; color:gray; display:block; margin-bottom:2px;">${i.nama_user}</b>` : ''}
                            ${i.m}
                        </div>
                      </div>`;
                
                if(idx === keys.length - 1 && isMe && st && st.read) h += `<div class="status-read">Dibaca</div>`;
                else if(idx === keys.length - 1 && isMe && st && !st.read) h += `<div class="status-read">Terkirim</div>`;
            });
            c.innerHTML = h; c.scrollTop = c.scrollHeight;
        });
    });
}

// 7. NOTIFIKASI API PENGIRIM
function notifTele(m) { 
    if(teleToken.includes("ISI_TOKEN")) return;
    fetch(`https://api.telegram.org/bot${teleToken}/sendMessage?chat_id=${teleChatID}&text=${encodeURIComponent(m)}`); 
}
function kirimEmailKeEka(sub, isi, foto = "Momen Kita") { 
    if(emailServiceID.includes("ISI_SERVICE") || !emailPenerimaAdmin) return;
    emailjs.send(emailServiceID, emailTemplateID, { from_name: sub, message: isi, foto_url: foto, to_email: emailPenerimaAdmin }); 
}
