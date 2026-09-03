const audioFile = document.getElementById('audioFile');
const audioPlayer = document.getElementById('audioPlayer');
const fileName = document.getElementById('fileName');
const favoriteBtn = document.getElementById('favoriteBtn');
const rewindBtn = document.getElementById('rewindBtn');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const forwardBtn = document.getElementById('forwardBtn');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const speedBtns = document.querySelectorAll('.speed-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const favoritesList = document.getElementById('favoritesList');
const recentList = document.getElementById('recentList');

// LocalStorage管理
const storage = {
    getFavorites: () => JSON.parse(localStorage.getItem('favorites')) || [],
    saveFavorites: (favorites) => localStorage.setItem('favorites', JSON.stringify(favorites)),
    getRecent: () => JSON.parse(localStorage.getItem('recent')) || [],
    saveRecent: (recent) => localStorage.setItem('recent', JSON.stringify(recent)),
};

let currentFileData = null;

// タブ切り替え
tabBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        tabBtns.forEach((b) => b.classList.remove('active'));
        tabContents.forEach((tc) => tc.classList.remove('active'));
        e.target.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        if (tabName === 'favorites') renderFavorites();
        if (tabName === 'recent') renderRecent();
    });
});

// ファイル選択時の処理
audioFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        audioPlayer.src = url;
        fileName.textContent = file.name;
        audioPlayer.load();
        
        currentFileData = {
            name: file.name,
            size: file.size,
            type: file.type,
            timestamp: Date.now(),
            url: url,
        };
        
        // 最近使用したファイルに追加
        addToRecent(currentFileData);
        updateFavoriteBtn();
    }
});

// お気に入りに追加/削除
favoriteBtn.addEventListener('click', () => {
    if (!currentFileData) return;
    
    const favorites = storage.getFavorites();
    const index = favorites.findIndex((f) => f.name === currentFileData.name);
    
    if (index >= 0) {
        favorites.splice(index, 1);
    } else {
        favorites.push(currentFileData);
    }
    
    storage.saveFavorites(favorites);
    updateFavoriteBtn();
});

// 最近使用したファイルリストを更新
function addToRecent(fileData) {
    let recent = storage.getRecent();
    recent = recent.filter((f) => f.name !== fileData.name);
    recent.unshift(fileData);
    recent = recent.slice(0, 5);
    storage.saveRecent(recent);
}

// お気に入りボタンの状態を更新
function updateFavoriteBtn() {
    if (!currentFileData) {
        favoriteBtn.classList.remove('active');
        return;
    }
    
    const favorites = storage.getFavorites();
    const isFavorite = favorites.some((f) => f.name === currentFileData.name);
    
    if (isFavorite) {
        favoriteBtn.classList.add('active');
    } else {
        favoriteBtn.classList.remove('active');
    }
}

// お気に入りリスト表示
function renderFavorites() {
    const favorites = storage.getFavorites();
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<p class="empty-message">お気に入りはまだ登録されていません</p>';
        return;
    }
    
    favoritesList.innerHTML = favorites
        .map(
            (file, index) =>
                `<div class="file-item">
                <span class="file-item-name">${file.name}</span>
                <button class="file-item-remove" onclick="removeFavorite(${index})">削除</button>
            </div>`,
        )
        .join('');
    
    // ファイルアイテムをクリックして再生
    favoritesList.querySelectorAll('.file-item').forEach((item, index) => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('file-item-remove')) {
                loadFileData(favorites[index]);
            }
        });
    });
}

// 最近使用したファイルリスト表示
function renderRecent() {
    const recent = storage.getRecent();
    
    if (recent.length === 0) {
        recentList.innerHTML = '<p class="empty-message">最近使用したファイルはありません</p>';
        return;
    }
    
    recentList.innerHTML = recent
        .map(
            (file, index) =>
                `<div class="file-item">
                <span class="file-item-name">${file.name}</span>
                <button class="file-item-remove" onclick="removeRecent(${index})">削除</button>
            </div>`,
        )
        .join('');
    
    // ファイルアイテムをクリックして再生
    recentList.querySelectorAll('.file-item').forEach((item, index) => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('file-item-remove')) {
                loadFileData(recent[index]);
            }
        });
    });
}

// ファイルデータを読み込んで再生
function loadFileData(fileData) {
    audioPlayer.src = fileData.url;
    fileName.textContent = fileData.name;
    audioPlayer.load();
    currentFileData = fileData;
    updateFavoriteBtn();
}

// お気に入りから削除
window.removeFavorite = function (index) {
    const favorites = storage.getFavorites();
    favorites.splice(index, 1);
    storage.saveFavorites(favorites);
    renderFavorites();
    updateFavoriteBtn();
};

// 最近使用したファイルから削除
window.removeRecent = function (index) {
    const recent = storage.getRecent();
    recent.splice(index, 1);
    storage.saveRecent(recent);
    renderRecent();
};

// 再生ボタン
playBtn.addEventListener('click', () => {
    if (audioPlayer.src) {
        audioPlayer.play();
    } else {
        alert('ファイルを選択してください');
    }
});

// 一時停止ボタン
pauseBtn.addEventListener('click', () => {
    audioPlayer.pause();
});

// 停止ボタン
stopBtn.addEventListener('click', () => {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
});

// 10秒戻すボタン
rewindBtn.addEventListener('click', () => {
    audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 10);
});

// 10秒進むボタン
forwardBtn.addEventListener('click', () => {
    audioPlayer.currentTime = Math.min(audioPlayer.duration, audioPlayer.currentTime + 10);
});

// 再生速度ボタン
speedBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
        const speed = parseFloat(e.target.dataset.speed);
        audioPlayer.playbackRate = speed;
        
        speedBtns.forEach((b) => b.classList.remove('active'));
        e.target.classList.add('active');
    });
});

// 再生時間の更新
audioPlayer.addEventListener('timeupdate', () => {
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.value = progress || 0;
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
});

// 曲の総時間を表示
audioPlayer.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audioPlayer.duration);
});

// プログレスバーをクリックして時間をシーク
progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioPlayer.currentTime = percent * audioPlayer.duration;
});

// 時間をMM:SSフォーマットに変換
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
