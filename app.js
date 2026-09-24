/**
 * Ứng dụng Tít Mã Vạch & Tự Động Lưu Bộ Nhớ
 * Tương thích Mobile, iOS Safari, Android Chrome, GitHub Pages
 */

// Trạng thái ứng dụng
const state = {
  scannedList: [],
  selectedDeviceId: null,
  videoDevices: [],
  isCameraActive: false,
  isTorchOn: false,
  mediaStreamTrack: null,
  lastScannedCode: null,
  lastScannedTime: 0,
  settings: {
    sound: true,
    vibrate: true,
    autoClipboard: true,
    duplicateDelay: true, // 2s delay for same code
  }
};

// Khởi tạo AudioContext cho âm thanh TÍT
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Phát âm thanh TÍT chuẩn máy tính tiền siêu thị / POS
function playBeepSound(type = 'success') {
  if (!state.settings.sound) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'success') {
      // Tiếng "TÍT" đanh, gọn (1850Hz trong 75ms)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1850, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'duplicate') {
      // Hai tiếng tít ngắn nếu mã đã tồn tại
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2200, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.06);

      setTimeout(() => {
        if (!state.settings.sound) return;
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        const t2 = ctx.currentTime;
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2200, t2);
        gain2.gain.setValueAtTime(0.2, t2);
        gain2.gain.exponentialRampToValueAtTime(0.01, t2 + 0.05);
        osc2.start(t2);
        osc2.stop(t2 + 0.06);
      }, 90);
    }
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}

// Rung điện thoại
function triggerHaptic() {
  if (state.settings.vibrate && 'vibrate' in navigator) {
    try {
      navigator.vibrate(80);
    } catch (e) {
      // Ignore vibration error
    }
  }
}

// Hiển thị thông báo Toast
let toastTimeout = null;
function showToast(message, duration = 2200) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, duration);
}

// Khởi tạo Barcode Reader (ZXing)
let codeReader = null;

function initBarcodeReader() {
  if (window.ZXing && window.ZXing.BrowserMultiFormatReader) {
    codeReader = new window.ZXing.BrowserMultiFormatReader();
    console.log('ZXing Barcode reader initialized successfully');
  } else {
    console.error('ZXing library not loaded yet');
  }
}

// Lấy danh sách camera và ưu tiên camera sau (environment/back)
async function setupCameras() {
  try {
    if (!codeReader) initBarcodeReader();
    const videoInputDevices = await codeReader.listVideoInputDevices();
    state.videoDevices = videoInputDevices;

    if (videoInputDevices.length === 0) {
      document.getElementById('cameraStatusTitle').textContent = 'Không tìm thấy Camera';
      document.getElementById('cameraStatusDesc').textContent = 'Vui lòng kiểm tra lại thiết bị hoặc quyền trên trình duyệt.';
      return;
    }

    // Tìm camera sau (back / environment)
    const backCamera = videoInputDevices.find(dev => {
      const label = dev.label.toLowerCase();
      return label.includes('back') || label.includes('rear') || label.includes('sau') || label.includes('environment');
    });

    state.selectedDeviceId = backCamera ? backCamera.deviceId : videoInputDevices[videoInputDevices.length - 1].deviceId;
  } catch (err) {
    console.error('Error listing cameras:', err);
  }
}

// Khởi động Camera và bắt đầu quét
async function startCamera() {
  // Kích hoạt audio context từ cử chỉ người dùng
  getAudioContext();

  try {
    if (!codeReader) initBarcodeReader();
    if (!state.selectedDeviceId) {
      await setupCameras();
    }

    const placeholder = document.getElementById('cameraPlaceholder');
    placeholder.classList.add('hidden');

    const videoElem = document.getElementById('videoPreview');

    // Decode từ video stream
    await codeReader.decodeFromVideoDevice(
      state.selectedDeviceId,
      videoElem,
      (result, err) => {
        if (result) {
          handleScannedBarcode(result.getText());
        }
        if (err && !(err instanceof ZXing.NotFoundException)) {
          // Bỏ qua lỗi NotFound khi quét từng frame
        }
      }
    );

    state.isCameraActive = true;

    // Kiểm tra khả năng bật đèn Flash (Torch)
    setTimeout(checkTorchCapability, 600);

  } catch (err) {
    console.error('Camera start failed:', err);
    const placeholder = document.getElementById('cameraPlaceholder');
    placeholder.classList.remove('hidden');
    document.getElementById('cameraStatusTitle').textContent = 'Lỗi cấp quyền Camera';
    document.getElementById('cameraStatusDesc').textContent = 'Hãy nhấn Cho phép (Allow) quyền Camera trong trình duyệt để quét.';
    showToast('❌ Không thể mở camera. Vui lòng cấp quyền.');
  }
}

// Dừng Camera
function stopCamera() {
  if (codeReader) {
    codeReader.reset();
  }
  state.isCameraActive = false;
  state.isTorchOn = false;
  const placeholder = document.getElementById('cameraPlaceholder');
  placeholder.classList.remove('hidden');
}

// Chuyển đổi camera (Trước / Sau)
async function switchCamera() {
  if (state.videoDevices.length <= 1) {
    await setupCameras();
  }
  if (state.videoDevices.length <= 1) {
    showToast('Chỉ có 1 camera trên thiết bị này');
    return;
  }

  const currentIndex = state.videoDevices.findIndex(d => d.deviceId === state.selectedDeviceId);
  const nextIndex = (currentIndex + 1) % state.videoDevices.length;
  state.selectedDeviceId = state.videoDevices[nextIndex].deviceId;

  stopCamera();
  await startCamera();
  showToast(`Đã đổi: ${state.videoDevices[nextIndex].label || 'Camera ' + (nextIndex + 1)}`);
}

// Kiểm tra và bật/tắt đèn Flash
function checkTorchCapability() {
  const videoElem = document.getElementById('videoPreview');
  const btnFlash = document.getElementById('btnToggleFlash');

  if (videoElem.srcObject) {
    const track = videoElem.srcObject.getVideoTracks()[0];
    if (track) {
      state.mediaStreamTrack = track;
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        btnFlash.style.display = 'inline-flex';
        return;
      }
    }
  }
  btnFlash.style.display = 'none';
}

async function toggleTorch() {
  if (!state.mediaStreamTrack) return;
  try {
    state.isTorchOn = !state.isTorchOn;
    await state.mediaStreamTrack.applyConstraints({
      advanced: [{ torch: state.isTorchOn }]
    });
    const btnFlash = document.getElementById('btnToggleFlash');
    btnFlash.classList.toggle('active', state.isTorchOn);
    showToast(state.isTorchOn ? '🔦 Đã bật đèn flash' : 'Đã tắt đèn flash');
  } catch (err) {
    console.error('Torch error:', err);
    showToast('Thiết bị không hỗ trợ bật flash');
  }
}

// Quét mã từ ảnh tải lên
async function scanFromImageFile(file) {
  if (!file) return;
  try {
    if (!codeReader) initBarcodeReader();
    const imgUrl = URL.createObjectURL(file);
    const result = await codeReader.decodeFromImageUrl(imgUrl);
    if (result) {
      handleScannedBarcode(result.getText());
      showToast('✅ Quét mã từ ảnh thành công!');
    }
    URL.revokeObjectURL(imgUrl);
  } catch (err) {
    console.error('Image scan failed:', err);
    showToast('⚠️ Không tìm thấy mã vạch trong ảnh này');
  }
}

// Xử lý khi bắt được một mã vạch
function handleScannedBarcode(rawCode) {
  const code = rawCode.trim();
  if (!code) return;

  const now = Date.now();

  // Kiểm tra chống quét trùng lặp trong 2 giây (cooldown)
  if (state.settings.duplicateDelay) {
    if (state.lastScannedCode === code && (now - state.lastScannedTime) < 2200) {
      return;
    }
  }

  state.lastScannedCode = code;
  state.lastScannedTime = now;

  // Kiểm tra mã đã có trong danh sách chưa
  const existingIndex = state.scannedList.findIndex(item => item.code === code);
  const isDuplicate = existingIndex !== -1;

  if (isDuplicate) {
    // Tăng số lần quét và đưa lên đầu
    const existing = state.scannedList[existingIndex];
    existing.count = (existing.count || 1) + 1;
    existing.timestamp = now;
    state.scannedList.splice(existingIndex, 1);
    state.scannedList.unshift(existing);
    playBeepSound('duplicate');
  } else {
    // Thêm mới vào đầu
    const newItem = {
      id: 'code_' + now + '_' + Math.random().toString(36).substr(2, 4),
      code: code,
      count: 1,
      timestamp: now
    };
    state.scannedList.unshift(newItem);
    playBeepSound('success');
  }

  triggerHaptic();

  // Tự động sao chép vào bộ nhớ tạm (Clipboard)
  if (state.settings.autoClipboard) {
    copyToClipboard(code, false);
  }

  // Lưu vào bộ nhớ LocalStorage
  saveHistoryToStorage();

  // Cập nhật giao diện
  updateLatestBanner(code, isDuplicate);
  renderHistory();
  updateStats();
}

// Hiển thị banner vừa quét
function updateLatestBanner(code, isDuplicate) {
  const banner = document.getElementById('latestResultBanner');
  const val = document.getElementById('latestResultValue');
  const meta = document.getElementById('latestResultMeta');

  val.textContent = code;
  meta.textContent = isDuplicate 
    ? `⚠️ Mã đã quét lần ${(state.scannedList[0]?.count || 2)} - Đã lưu & cập nhật` 
    : '✅ Đã lưu vào bộ nhớ máy & chép vào khay tạm';
  
  banner.classList.remove('hidden');
}

// Quản lý LocalStorage
function saveHistoryToStorage() {
  try {
    localStorage.setItem('scanned_barcodes_list', JSON.stringify(state.scannedList));
  } catch (e) {
    console.error('LocalStorage save error:', e);
  }
}

function loadHistoryFromStorage() {
  try {
    const data = localStorage.getItem('scanned_barcodes_list');
    if (data) {
      state.scannedList = JSON.parse(data);
    }
  } catch (e) {
    state.scannedList = [];
  }
}

// Quản lý Cài đặt LocalStorage
function saveSettingsToStorage() {
  try {
    localStorage.setItem('scanner_settings', JSON.stringify(state.settings));
  } catch (e) {}
}

function loadSettingsFromStorage() {
  try {
    const data = localStorage.getItem('scanner_settings');
    if (data) {
      state.settings = { ...state.settings, ...JSON.parse(data) };
    }
  } catch (e) {}
}

// Sao chép chuỗi vào Clipboard
async function copyToClipboard(text, notify = true) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      if (notify) showToast(`📋 Đã sao chép: ${text}`);
      return true;
    } else {
      // Fallback cho trình duyệt cũ
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      if (notify) showToast(`📋 Đã sao chép: ${text}`);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard failed:', err);
    if (notify) showToast('Không thể sao chép tự động');
    return false;
  }
}

// Cập nhật số liệu thống kê
function updateStats() {
  const total = state.scannedList.reduce((acc, item) => acc + (item.count || 1), 0);
  const unique = state.scannedList.length;

  document.getElementById('statTotalCount').textContent = total;
  document.getElementById('statUniqueCount').textContent = unique;
}

// Format thời gian hiển thị thân thiện
function formatTime(timestamp) {
  const d = new Date(timestamp);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${hours}:${minutes}:${seconds} (${day}/${month})`;
}

// Render danh sách lịch sử
function renderHistory(filterKeyword = '') {
  const listElem = document.getElementById('historyList');
  const emptyState = document.getElementById('emptyState');
  listElem.innerHTML = '';

  const keyword = filterKeyword.trim().toLowerCase();
  const itemsToRender = keyword 
    ? state.scannedList.filter(item => item.code.toLowerCase().includes(keyword))
    : state.scannedList;

  if (itemsToRender.length === 0) {
    emptyState.classList.remove('hidden');
    if (keyword) {
      emptyState.querySelector('p').textContent = 'Không tìm thấy mã phù hợp.';
      emptyState.querySelector('small').textContent = 'Thử tìm với từ khoá khác.';
    } else {
      emptyState.querySelector('p').textContent = 'Chưa có mã nào được quét.';
      emptyState.querySelector('small').textContent = 'Hướng camera vào mã vạch để bắt đầu tít!';
    }
    return;
  }

  emptyState.classList.add('hidden');

  itemsToRender.forEach((item, index) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'history-item';
    itemEl.innerHTML = `
      <div class="item-left">
        <span class="item-index">#${itemsToRender.length - index}</span>
        <div class="item-content">
          <span class="item-code" title="${escapeHtml(item.code)}">${escapeHtml(item.code)}</span>
          <div class="item-meta">
            <span>${formatTime(item.timestamp)}</span>
            ${item.count > 1 ? `<span class="count-badge">${item.count} lần</span>` : ''}
          </div>
        </div>
      </div>
      <div class="item-actions">
        <button class="action-btn btn-copy-single" data-code="${escapeHtml(item.code)}" title="Sao chép">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        <button class="action-btn delete btn-delete-single" data-id="${item.id}" title="Xoá">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;
    listElem.appendChild(itemEl);
  });

  // Gán sự kiện cho từng nút trong item
  listElem.querySelectorAll('.btn-copy-single').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = e.currentTarget.getAttribute('data-code');
      copyToClipboard(code);
    });
  });

  listElem.querySelectorAll('.btn-delete-single').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      deleteHistoryItem(id);
    });
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

// Xoá 1 mục khỏi lịch sử
function deleteHistoryItem(id) {
  state.scannedList = state.scannedList.filter(item => item.id !== id);
  saveHistoryToStorage();
  renderHistory(document.getElementById('searchInput').value);
  updateStats();
  showToast('Đã xoá 1 mã');
}

// Xoá tất cả
function clearAllHistory() {
  if (state.scannedList.length === 0) {
    showToast('Danh sách đang trống');
    return;
  }
  if (confirm('Bạn có chắc chắn muốn xoá toàn bộ lịch sử quét mã không?')) {
    state.scannedList = [];
    state.lastScannedCode = null;
    saveHistoryToStorage();
    renderHistory();
    updateStats();
    document.getElementById('latestResultBanner').classList.add('hidden');
    showToast('Đã làm trống lịch sử');
  }
}

// Sao chép toàn bộ danh sách
function copyAllHistory() {
  if (state.scannedList.length === 0) {
    showToast('Chưa có mã nào để sao chép');
    return;
  }
  const allCodes = state.scannedList.map(item => item.code).join('\n');
  copyToClipboard(allCodes, false);
  showToast(`📋 Đã sao chép tất cả (${state.scannedList.length} mã)`);
}

// Xuất file TXT
function exportAsTxt() {
  if (state.scannedList.length === 0) {
    showToast('Chưa có dữ liệu để xuất file');
    return;
  }
  const content = state.scannedList.map(item => item.code).join('\r\n');
  downloadFile(content, `titcode_${getFormattedDate()}.txt`, 'text/plain;charset=utf-8');
  closeModals();
  showToast('Đã tải xuống file .TXT');
}

// Xuất file CSV (Excel)
function exportAsCsv() {
  if (state.scannedList.length === 0) {
    showToast('Chưa có dữ liệu để xuất file');
    return;
  }
  // Thêm UTF-8 BOM (\uFEFF) để Excel hiển thị tiếng Việt chuẩn không lỗi font
  let csv = '\uFEFF"STT","Mã Vạch (Barcode)","Số lần quét","Thời gian quét"\r\n';
  state.scannedList.forEach((item, idx) => {
    const timeStr = formatTime(item.timestamp);
    csv += `"${idx + 1}","${item.code}","${item.count || 1}","${timeStr}"\r\n`;
  });

  downloadFile(csv, `titcode_${getFormattedDate()}.csv`, 'text/csv;charset=utf-8');
  closeModals();
  showToast('Đã tải xuống file .CSV');
}

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getFormattedDate() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
}

// Đóng toàn bộ modals
function closeModals() {
  document.getElementById('settingsModal').classList.add('hidden');
  document.getElementById('exportModal').classList.add('hidden');
}

// Khởi chạy khi tải trang
window.addEventListener('DOMContentLoaded', async () => {
  loadSettingsFromStorage();
  loadHistoryFromStorage();
  initBarcodeReader();

  // Đồng bộ UI cài đặt
  document.getElementById('setSound').checked = state.settings.sound;
  document.getElementById('setVibrate').checked = state.settings.vibrate;
  document.getElementById('setAutoClipboard').checked = state.settings.autoClipboard;
  document.getElementById('setDuplicateDelay').checked = state.settings.duplicateDelay;

  // Âm thanh header button
  updateSoundButtonUI();

  // Render lịch sử ban đầu
  renderHistory();
  updateStats();

  // Đăng ký Service Worker nếu hỗ trợ (PWA)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.log('SW register skipped:', err);
    });
  }

  // Tự động thử bật camera nếu người dùng nhấn vào nút hoặc đã cấp quyền
  document.getElementById('btnStartCamera').addEventListener('click', () => {
    startCamera();
  });

  // Tự động yêu cầu camera khi tải trang (nếu trình duyệt cho phép)
  try {
    startCamera();
  } catch (e) {
    // Trình duyệt sẽ hiển thị placeholder cho phép bấm tay
  }

  // Gắn các sự kiện điều khiển
  document.getElementById('btnSwitchCamera').addEventListener('click', switchCamera);
  document.getElementById('btnToggleFlash').addEventListener('click', toggleTorch);
  
  document.getElementById('fileInput').addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      scanFromImageFile(e.target.files[0]);
    }
  });

  // Bật/tắt nhanh âm thanh
  document.getElementById('btnSoundToggle').addEventListener('click', () => {
    state.settings.sound = !state.settings.sound;
    saveSettingsToStorage();
    updateSoundButtonUI();
    document.getElementById('setSound').checked = state.settings.sound;
    showToast(state.settings.sound ? '🔊 Đã bật âm thanh tít' : '🔇 Đã tắt âm thanh');
  });

  // Mở Settings Modal
  document.getElementById('btnSettingsToggle').addEventListener('click', () => {
    document.getElementById('settingsModal').classList.remove('hidden');
  });
  document.getElementById('btnCloseSettings').addEventListener('click', closeModals);

  // Mở Export Modal
  document.getElementById('btnExportMenu').addEventListener('click', () => {
    document.getElementById('exportModal').classList.remove('hidden');
  });
  document.getElementById('btnCloseExport').addEventListener('click', closeModals);

  // Các nút xuất file
  document.getElementById('btnExportTxt').addEventListener('click', exportAsTxt);
  document.getElementById('btnExportCsv').addEventListener('click', exportAsCsv);
  document.getElementById('btnCopyAll').addEventListener('click', copyAllHistory);
  document.getElementById('btnClearHistory').addEventListener('click', clearAllHistory);

  // Tìm kiếm
  document.getElementById('searchInput').addEventListener('input', (e) => {
    renderHistory(e.target.value);
  });

  // Thay đổi cài đặt
  document.getElementById('setSound').addEventListener('change', (e) => {
    state.settings.sound = e.target.checked;
    saveSettingsToStorage();
    updateSoundButtonUI();
  });
  document.getElementById('setVibrate').addEventListener('change', (e) => {
    state.settings.vibrate = e.target.checked;
    saveSettingsToStorage();
  });
  document.getElementById('setAutoClipboard').addEventListener('change', (e) => {
    state.settings.autoClipboard = e.target.checked;
    saveSettingsToStorage();
  });
  document.getElementById('setDuplicateDelay').addEventListener('change', (e) => {
    state.settings.duplicateDelay = e.target.checked;
    saveSettingsToStorage();
  });

  // Đóng modal khi click ra ngoài backdrop
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      closeModals();
    }
  });
});

function updateSoundButtonUI() {
  const btn = document.getElementById('btnSoundToggle');
  const iconOn = document.getElementById('iconSoundOn');
  const iconOff = document.getElementById('iconSoundOff');
  if (state.settings.sound) {
    btn.classList.add('active');
    iconOn.classList.remove('hidden');
    iconOff.classList.add('hidden');
  } else {
    btn.classList.remove('active');
    iconOn.classList.add('hidden');
    iconOff.classList.remove('hidden');
  }
}
