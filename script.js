// ==========================================
// DOM要素の管理
// ==========================================

const elements = {
    // ファイル入力
    file: {
        input: document.getElementById('audioFile'),
    },
    // オーディオ再生
    audio: {
        player: document.getElementById('audioPlayer'),
    },
    // 表示要素
    display: {
        fileName: document.getElementById('fileName'),
        currentTime: document.getElementById('currentTime'),
        duration: document.getElementById('duration'),
        playlistStatus: document.getElementById('playlistStatus'),
    },
    // コントロールボタン
    controls: {
        play: document.getElementById('playBtn'),
        pause: document.getElementById('pauseBtn'),
        stop: document.getElementById('stopBtn'),
        rewind: document.getElementById('rewindBtn'),
        forward: document.getElementById('forwardBtn'),
        favorite: document.getElementById('favoriteBtn'),
        autoplay: document.getElementById('autoplayBtn'),
    },
    // 再生速度
    speed: {
        buttons: document.querySelectorAll('.speed-btn'),
    },
    // プログレスバー
    progress: {
        bar: document.getElementById('progressBar'),
    },
    // タブ
    tabs: {
        buttons: document.querySelectorAll('.tab-btn'),
        contents: document.querySelectorAll('.tab-content'),
    },
    // ファイルリスト
    lists: {
        favorites: document.getElementById('favoritesList'),
        recent: document.getElementById('recentList'),
    },
};

// ==========================================
// 状態管理
// ==========================================

const playerState = {
    currentFile: null,
    autoplay: {
        enabled: false,
        queue: [],
        index: 0,
    },
};

// ==========================================
// LocalStorage管理
// ==========================================

const storage = {
    getFavorites: () => JSON.parse(localStorage.getItem('favorites')) || [],
    saveFavorites: (favorites) => localStorage.setItem('favorites', JSON.stringify(favorites)),
    getRecent: () => JSON.parse(localStorage.getItem('recent')) || [],
    saveRecent: (recent) => localStorage.setItem('recent', JSON.stringify(recent)),
};

// ==========================================
// ユーティリティ関数
// ==========================================

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// ==========================================
// ファイル管理
// ==========================================

function loadFileData(fileData) {
    const { player } = elements.audio;
    const { fileName } = elements.display;
    
    player.src = fileData.url;
    fileName.textContent = fileData.name;
    player.load();
    playerState.currentFile = fileData;
    updateFavoriteBtn();
}

function addToRecent(fileData) {
    let recent = storage.getRecent();
    recent = recent.filter((f) => f.name !== fileData.name);
    recent.unshift(fileData);
    recent = recent.slice(0, 5);
    storage.saveRecent(recent);
}

// ==========================================
// お気に入り管理
// ==========================================

function toggleFavorite() {
    if (!playerState.currentFile) return;
    
    const favorites = storage.getFavorites();
    const index = favorites.findIndex((f) => f.name === playerState.currentFile.name);
    
    if (index >= 0) {
        favorites.splice(index, 1);
    } else {
        favorites.push(playerState.currentFile);
    }
    
    storage.saveFavorites(favorites);
    updateFavoriteBtn();
}

function updateFavoriteBtn() {
    const { favorite } = elements.controls;
    
    if (!playerState.currentFile) {
        favorite.classList.remove('active');
        return;
    }
    
    const favorites = storage.getFavorites();
    const isFavorite = favorites.some((f) => f.name === playerState.currentFile.name);
    
    favorite.classList.toggle('active', isFavorite);
}

function renderFavorites() {
    const { favorites: listEl } = elements.lists;
    const favorites = storage.getFavorites();
    
    if (favorites.length === 0) {
        listEl.innerHTML = '<p class="empty-message">お気に入りはまだ登録されていません</p>';
        return;
    }
    
    listEl.innerHTML = favorites
        .map(
            (file, index) =>
                `<div class="file-item">
                <span class="file-item-name">${file.name}</span>
                <button class="file-item-remove" onclick="removeFavorite(${index})">削除</button>
            </div>`,
        )
        .join('');
    
    listEl.querySelectorAll('.file-item').forEach((item, index) => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('file-item-remove')) {
                loadFileData(favorites[index]);
            }
        });
    });
}

window.removeFavorite = function (index) {
    const favorites = storage.getFavorites();
    favorites.splice(index, 1);
    storage.saveFavorites(favorites);
    renderFavorites();
    updateFavoriteBtn();
};

// ==========================================
// 最近使用したファイル管理
// ==========================================

function renderRecent() {
    const { recent: listEl } = elements.lists;
    const recent = storage.getRecent();
    
    if (recent.length === 0) {
        listEl.innerHTML = '<p class="empty-message">最近使用したファイルはありません</p>';
        return;
    }
    
    listEl.innerHTML = recent
        .map(
            (file, index) =>
                `<div class="file-item">
                <span class="file-item-name">${file.name}</span>
                <button class="file-item-remove" onclick="removeRecent(${index})">削除</button>
            </div>`,
        )
        .join('');
    
    listEl.querySelectorAll('.file-item').forEach((item, index) => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('file-item-remove')) {
                loadFileData(recent[index]);
            }
        });
    });
}

window.removeRecent = function (index) {
    const recent = storage.getRecent();
    recent.splice(index, 1);
    storage.saveRecent(recent);
    renderRecent();
};

// ==========================================
// 再生制御
// ==========================================

function play() {
    const { player } = elements.audio;
    if (player.src) {
        player.play();
    } else {
        alert('ファイルを選択してください');
    }
}

function pause() {
    const { player } = elements.audio;
    player.pause();
}

function stop() {
    const { player } = elements.audio;
    player.pause();
    player.currentTime = 0;
}

function rewind() {
    const { player } = elements.audio;
    player.currentTime = Math.max(0, player.currentTime - 10);
}

function forward() {
    const { player } = elements.audio;
    player.currentTime = Math.min(player.duration, player.currentTime + 10);
}

function seek(percent) {
    const { player } = elements.audio;
    player.currentTime = percent * player.duration;
}

// ==========================================
// 連続再生機能
// ==========================================

function toggleAutoplay() {
    playerState.autoplay.enabled = !playerState.autoplay.enabled;
    updateAutoplayStatus();
    
    if (playerState.autoplay.enabled) {
        playerState.autoplay.queue = storage.getFavorites();
        playerState.autoplay.index = 0;
        
        if (playerState.autoplay.queue.length > 0) {
            loadFileData(playerState.autoplay.queue[0]);
            play();
        } else {
            alert('お気に入りにファイルがありません');
            playerState.autoplay.enabled = false;
            updateAutoplayStatus();
        }
    }
}

function updateAutoplayStatus() {
    const { autoplay: autoplayBtn } = elements.controls;
    const { playlistStatus } = elements.display;
    const { enabled, queue, index } = playerState.autoplay;
    
    autoplayBtn.classList.toggle('active', enabled);
    
    if (enabled) {
        playlistStatus.textContent = `連続再生: ON (${index + 1}/${queue.length})`;
    } else {
        playlistStatus.textContent = '連続再生: OFF';
    }
}

function playNextInAutoplayQueue() {
    const { enabled, queue, index } = playerState.autoplay;
    
    if (!enabled || queue.length === 0) return;
    
    playerState.autoplay.index++;
    
    if (playerState.autoplay.index < queue.length) {
        loadFileData(queue[playerState.autoplay.index]);
        updateAutoplayStatus();
        play();
    } else {
        playerState.autoplay.enabled = false;
        updateAutoplayStatus();
    }
}

// ==========================================
// 再生速度制御
// ==========================================

function setPlaybackSpeed(speed) {
    const { player } = elements.audio;
    const { buttons: speedBtns } = elements.speed;
    
    player.playbackRate = speed;
    speedBtns.forEach((btn) => btn.classList.remove('active'));
    event.target.classList.add('active');
}

// ==========================================
// UI更新
// ==========================================

function updateProgress() {
    const { player } = elements.audio;
    const { bar } = elements.progress;
    const { currentTime } = elements.display;
    
    const progress = (player.currentTime / player.duration) * 100;
    bar.value = progress || 0;
    currentTime.textContent = formatTime(player.currentTime);
}

function updateDuration() {
    const { player } = elements.audio;
    const { duration } = elements.display;
    
    duration.textContent = formatTime(player.duration);
}

// ==========================================
// イベントリスナー設定
// ==========================================

function setupFileUpload() {
    elements.file.input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            
            playerState.currentFile = {
                name: file.name,
                size: file.size,
                type: file.type,
                timestamp: Date.now(),
                url: url,
            };
            
            loadFileData(playerState.currentFile);
            addToRecent(playerState.currentFile);
        }
    });
}

function setupControlButtons() {
    elements.controls.play.addEventListener('click', play);
    elements.controls.pause.addEventListener('click', pause);
    elements.controls.stop.addEventListener('click', stop);
    elements.controls.rewind.addEventListener('click', rewind);
    elements.controls.forward.addEventListener('click', forward);
    elements.controls.favorite.addEventListener('click', toggleFavorite);
    elements.controls.autoplay.addEventListener('click', toggleAutoplay);
}

function setupSpeedControl() {
    elements.speed.buttons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const speed = parseFloat(e.target.dataset.speed);
            setPlaybackSpeed(speed);
        });
    });
}

function setupProgressBar() {
    elements.progress.bar.addEventListener('click', (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        seek(percent);
    });
}

function setupAudioEvents() {
    const { player } = elements.audio;
    
    player.addEventListener('timeupdate', updateProgress);
    player.addEventListener('loadedmetadata', updateDuration);
    player.addEventListener('ended', () => {
        if (playerState.autoplay.enabled) {
            playNextInAutoplayQueue();
        }
    });
}

function setupTabs() {
    const { buttons: tabBtns, contents: tabContents } = elements.tabs;
    
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
}

// ==========================================
// 初期化
// ==========================================

function init() {
    setupFileUpload();
    setupControlButtons();
    setupSpeedControl();
    setupProgressBar();
    setupAudioEvents();
    setupTabs();
}

document.addEventListener('DOMContentLoaded', init);
