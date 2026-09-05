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
        nextTrack: document.getElementById('nextTrackBtn'),
    },
    // フォルダ選択
    folder: {
        selectBtn: document.getElementById('selectFolderBtn'),
        info: document.getElementById('folderInfo'),
        name: document.getElementById('folderName'),
        addFavoriteBtn: document.getElementById('addFolderFavoriteBtn'),
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
    currentFolderHandle: null,
    playlistQueue: [],
    playlistIndex: 0,
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
    getFavoriteFolders: () => JSON.parse(localStorage.getItem('favoriteFolders')) || [],
    saveFavoriteFolders: (folders) => localStorage.setItem('favoriteFolders', JSON.stringify(folders)),
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

function promptFileSelection(fileData) {
    const message = `📁 "${fileData.name}" を再度選択してください。\n\nマイクロSDカードから同じファイルを選択してください。`;
    alert(message);
    elements.file.input.click();
}

// ==========================================
// フォルダ管理
// ==========================================

async function selectFolder() {
    if (!window.showDirectoryPicker) {
        alert('このブラウザはファイルシステムアクセスに対応していません。\nChrome, Edge, Brave などを使用してください。');
        return;
    }

    try {
        const folderHandle = await window.showDirectoryPicker();
        playerState.currentFolderHandle = folderHandle;
        
        const folderName = folderHandle.name;
        displayFolderInfo(folderName);
        await loadPlaylistFromFolder(folderHandle);
        
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('フォルダ選択エラー:', err);
        }
    }
}

function displayFolderInfo(folderName) {
    const { info, name } = elements.folder;
    name.textContent = `📁 ${folderName}`;
    info.style.display = 'block';
}

async function loadPlaylistFromFolder(folderHandle) {
    playerState.playlistQueue = [];
    
    try {
        for await (const entry of folderHandle.values()) {
            if (entry.kind === 'file' && isMp3File(entry.name)) {
                const file = await entry.getFile();
                const url = URL.createObjectURL(file);
                playerState.playlistQueue.push({
                    name: entry.name,
                    size: file.size,
                    type: file.type,
                    url: url,
                    timestamp: Date.now(),
                });
            }
        }
        
        // ファイル名でソート
        playerState.playlistQueue.sort((a, b) => a.name.localeCompare(b.name));
        
        if (playerState.playlistQueue.length > 0) {
            playerState.playlistIndex = 0;
            loadFileData(playerState.playlistQueue[0]);
        } else {
            alert('MP3ファイルが見つかりません。');
        }
    } catch (err) {
        console.error('ファイル一覧取得エラー:', err);
    }
}

function isMp3File(filename) {
    return /\.(mp3|wav|ogg|flac|m4a)$/i.test(filename);
}

function addToFavoriteFolders() {
    if (!playerState.currentFolderHandle || playerState.playlistQueue.length === 0) {
        alert('フォルダが選択されていません。');
        return;
    }

    const folderName = playerState.currentFolderHandle.name;
    const playlistNames = playerState.playlistQueue.map((f) => f.name);
    
    const folderData = {
        id: Date.now().toString(),
        name: folderName,
        fileNames: playlistNames,
        timestamp: Date.now(),
    };

    let favoriteFolders = storage.getFavoriteFolders();
    const index = favoriteFolders.findIndex((f) => f.id === folderData.id);

    if (index >= 0) {
        favoriteFolders[index] = folderData;
        alert(`✅ "${folderName}" を更新しました。`);
    } else {
        favoriteFolders.unshift(folderData);
        alert(`✅ "${folderName}" をお気に入りに登録しました。`);
    }

    storage.saveFavoriteFolders(favoriteFolders);
    renderFavorites();
}

function removeFromFavoriteFolders(index) {
    let favoriteFolders = storage.getFavoriteFolders();
    favoriteFolders.splice(index, 1);
    storage.saveFavoriteFolders(favoriteFolders);
    renderFavorites();
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
    const favoriteFolders = storage.getFavoriteFolders();
    
    const allItems = [
        ...favoriteFolders.map((folder, index) => ({ ...folder, isFolder: true, index })),
        ...favorites.map((file, index) => ({ ...file, isFolder: false, index })),
    ];
    
    if (allItems.length === 0) {
        listEl.innerHTML = '<p class="empty-message">お気に入りはまだ登録されていません</p>';
        return;
    }
    
    listEl.innerHTML = allItems
        .map(
            (item) => {
                if (item.isFolder) {
                    return `<div class="file-item" style="background: #5a5a5a; border-left-color: #ffaa00;">
                        <span class="file-item-name" style="color: #ffaa00;">📁 ${item.name}</span>
                        <button class="file-item-remove" onclick="removeFromFavoriteFolders(${item.index})">削除</button>
                    </div>`;
                } else {
                    return `<div class="file-item">
                        <span class="file-item-name">${item.name}</span>
                        <button class="file-item-remove" onclick="removeFavorite(${item.index})">削除</button>
                    </div>`;
                }
            }
        )
        .join('');
    
    listEl.querySelectorAll('.file-item').forEach((itemEl, idx) => {
        itemEl.addEventListener('click', (e) => {
            if (!e.target.classList.contains('file-item-remove')) {
                const item = allItems[idx];
                if (item.isFolder) {
                    promptFolderSelection(item);
                } else {
                    promptFileSelection(item);
                }
            }
        });
    });
}

function promptFolderSelection(folderData) {
    const message = `📁 "${folderData.name}" フォルダを再度選択してください。`;
    alert(message);
    selectFolder();
}

window.removeFavorite = function (index) {
    const favorites = storage.getFavorites();
    favorites.splice(index, 1);
    storage.saveFavorites(favorites);
    renderFavorites();
    updateFavoriteBtn();
};

window.removeFromFavoriteFolders = function (index) {
    removeFromFavoriteFolders(index);
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
                promptFileSelection(recent[index]);
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

function playNextTrack() {
    if (playerState.playlistQueue.length === 0) {
        alert('プレイリストが設定されていません。');
        return;
    }

    playerState.playlistIndex++;

    if (playerState.playlistIndex < playerState.playlistQueue.length) {
        loadFileData(playerState.playlistQueue[playerState.playlistIndex]);
        play();
    } else {
        alert('プレイリストの最後に達しました。');
        playerState.playlistIndex = 0;
    }
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
    elements.controls.nextTrack.addEventListener('click', playNextTrack);
    elements.folder.selectBtn.addEventListener('click', selectFolder);
    elements.folder.addFavoriteBtn.addEventListener('click', addToFavoriteFolders);
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
