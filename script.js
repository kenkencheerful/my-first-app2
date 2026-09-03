const audioFile = document.getElementById('audioFile');
const audioPlayer = document.getElementById('audioPlayer');
const fileName = document.getElementById('fileName');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');

// ファイル選択時の処理
audioFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        audioPlayer.src = url;
        fileName.textContent = file.name;
        audioPlayer.load();
    }
});

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
