// App State Variables
let firebaseConfig = null;
let isMockMode = true;
let authToken = null;
let currentCallsign = null;
let currentEmail = null;

// Original uploaded file name (without extension)
let originalFileName = 'image';

// Template variables
let availableTemplates = [];
let activeTemplate = null;

// Image & Canvas state
let userImage = null;
let goldFrameImage = new Image();
let processedFrameCanvas = null; // Offscreen canvas for processed transparent frame (portrait)
let activeFrameCanvas = null;    // Frame canvas actually used for rendering (may be rotated)

// DOM Elements
const authAlert = document.getElementById('auth-alert');
const authAlertMsg = document.getElementById('auth-alert-message');
const sectionLogin = document.getElementById('section-login');
const btnLoginGoogle = document.getElementById('btn-login-google');
const mockLoginBox = document.getElementById('mock-login-box');
const inputMockEmail = document.getElementById('input-mock-email');
const btnLoginMock = document.getElementById('btn-login-mock');

const sectionGenerator = document.getElementById('section-generator');
const userProfile = document.getElementById('user-profile');
const userAvatar = document.getElementById('user-avatar');
const userCallsign = document.getElementById('user-callsign');
const btnLogout = document.getElementById('btn-logout');

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const cardPreview = document.getElementById('card-preview');
const cardDownload = document.getElementById('card-download');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const canvasLoading = document.getElementById('canvas-loading');
const templateSelectorContainer = document.getElementById('template-selector-container');
const attributionList = document.getElementById('attribution-list');



const sliderScale = document.getElementById('slider-scale');
const sliderX = document.getElementById('slider-x');
const sliderY = document.getElementById('slider-y');
const labelScale = document.getElementById('label-scale');
const labelX = document.getElementById('label-x');
const labelY = document.getElementById('label-y');

const btnReset = document.getElementById('btn-reset');
const btnGenerate = document.getElementById('btn-generate');
const btnDownload = document.getElementById('btn-download');

// Leaderboard Elements
const tabDaily = document.getElementById('tab-daily');
const tabWeekly = document.getElementById('tab-weekly');
const tabMonthly = document.getElementById('tab-monthly');
const tabAll = document.getElementById('tab-all');
const leaderboardList = document.getElementById('leaderboard-list');
const leaderboardLoading = document.getElementById('leaderboard-loading');
const leaderboardEmpty = document.getElementById('leaderboard-empty');

// Initialize App
window.addEventListener('DOMContentLoaded', async () => {
  // Fetch configurations and templates first
  await fetchConfig();
  await fetchTemplates();
  await fetchAttributions();


  // Setup image onload handler
  goldFrameImage.onload = () => {
    // Process frame pixels to make black parts transparent
    processGoldFrame(goldFrameImage);

    if (userImage) {
      // Frame switched while user already has a photo loaded —
      // apply the same auto-rotate / auto-fit logic as handleFile
      const imgW = userImage.naturalWidth || userImage.width;
      const imgH = userImage.naturalHeight || userImage.height;
      activeFrameCanvas = (imgW > imgH && processedFrameCanvas)
        ? rotateCanvas90(processedFrameCanvas)
        : processedFrameCanvas;

      const autoScale = computeAutoFitScale(userImage);
      sliderScale.value = Math.round(autoScale);
      labelScale.textContent = `${Math.round(autoScale)}%`;
      sliderX.value = 0;
      sliderY.value = 0;
      labelX.textContent = '0 px';
      labelY.textContent = '0 px';
    } else {
      activeFrameCanvas = processedFrameCanvas; // no photo yet — use portrait frame as-is
    }

    drawCanvas();
    canvasLoading.classList.add('hidden');
  };

  // Load initial template
  if (activeTemplate) {
    goldFrameImage.src = `/frame_template/${activeTemplate}`;
  } else {
    goldFrameImage.src = '/assets/gold_frame.png';
  }

  // Load Leaderboard stats initially
  await fetchStats('daily');

  // Setup Event Listeners
  setupEventListeners();
});

// 1. Config and Auth logic
async function fetchConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();

    if (data.isMock) {
      isMockMode = true;
      mockLoginBox.classList.remove('hidden');
      btnLoginGoogle.classList.add('hidden');
      showLoginState();
    } else {
      isMockMode = false;
      firebaseConfig = data.config;
      mockLoginBox.classList.add('hidden');
      btnLoginGoogle.classList.remove('hidden');

      // Initialize Firebase App
      firebase.initializeApp(firebaseConfig);

      // Listen for Firebase Auth changes
      firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
          try {
            const token = await user.getIdToken();
            authToken = token;
            await checkWhitelist(token);
          } catch (err) {
            showError("เกิดข้อผิดพลาดในการตรวจสอบโทเคนของกูเกิล");
            logout();
          }
        } else {
          showLoginState();
        }
      });
    }
  } catch (err) {
    console.error("Config fetch failed, using fallback mock mode:", err);
    isMockMode = true;
    mockLoginBox.classList.remove('hidden');
  }
}

// Pool of snarky rejection messages for non-whitelisted users
const REJECTION_MESSAGES = [
  "ไม่ขออภัย! สัญญาณเรียกขานของท่านยังไม่มีอยู่ในทะเบียนเศรษฐี กรุณากลับไปสะสมแต้มบุญใหม่ก่อนนะคะ 🙏",
  "โอ้โห! ระบบตรวจพบความจนขัดข้องในสัญญาณของคุณ บารมียังไม่ถึงขั้นเลี่ยมทอง โปรดติดต่อเพื่อขอสิทธิ์ก่อนนะจ๊ะ 💸",
  "555+ ขำมากเลย! คิดว่าจะเข้าได้เหรอ? นี่มันระบบเฉพาะคนมีบารมีเท่านั้น ไม่ใช่ที่สาธารณะนะจ๊ะ 👑",
  "สัญญาณของคุณถูกรบกวนโดยความจน กรุณากลับไปทำบุญสร้างวัดก่อนแล้วค่อยลองใหม่ะครับ 🏯",
  "ระบบปฏิเสธการเข้าใช้งาน... เนื่องจากตรวจพบว่าคุณไม่ได้รับเชิญ ลองติดต่อแอดมินขอสิทธิ์ก่อนนะ 🚫",
  "อ๊ะ อ๊ะ! หยุดก่อน! ท่านไม่มีชื่ออยู่ในบัญชีรายชื่อผู้ทรงเกียรติ คงต้องสะสมเงินแล้วซื้อสิทธิ์เอาเองแหละ 😂",
  "แหม... ความกล้ามาจากไหนเนี่ย ระบบนี้เฉพาะสมาชิกกิตติมศักดิ์เท่านั้น ไม่ใช่ที่ฟรีวิลล์นะจ๊ะ ✋",
  "โชคร้ายจริงๆ ท่านไม่อยู่ใน VIP List ของเรา ลองไปเลี่ยมภาพด้วยโปรแกรมฟรีอื่นๆ ดูก่อนได้เลยนะ 🤡",
  "เฮ้ย! ใครให้มา? ท่านไม่มีสิทธิ์เข้าใช้ระบบนี้ กลับไปก่อน แล้วพาบอสใหญ่มาขอสิทธิ์ให้ก่อนนะ 🚷",
  "ตรวจสอบฐานข้อมูลความรวยแล้ว... ไม่พบชื่อท่าน กรุณาอย่าเสียใจนะคะ ความจนไม่ใช่อาชญากรรม (แต่ก็ห้ามเข้าระบบนี้นะ) 💎",
  "ขออภัย ท่านไม่มีสิทธิ์ใช้ระบบทองอร่าม เพราะแอดมินยังไม่ได้ลงรายชื่อให้ ลองส่ง DM หาแอดมินก่อนนะครับ 📱",
  "ERROR 403: บารมีไม่พอ — ท่านถูกปฏิเสธโดยระบบ AI ความรวย กรุณาสะสมทอง 99.99% ให้ได้ก่อนแล้วค่อยลองใหม่ 🥇",
];

function getRandomRejectionMessage() {
  return REJECTION_MESSAGES[Math.floor(Math.random() * REJECTION_MESSAGES.length)];
}

async function checkWhitelist(token) {
  try {
    const response = await fetch('/api/auth/check', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (response.ok && data.status === 'success') {
      currentCallsign = data.callsign;
      currentEmail = data.email;
      authToken = token;
      hideError();
      showGeneratorState();
    } else if (response.status === 403) {
      // Not in whitelist — show random snarky message
      showError(getRandomRejectionMessage());
      logout();
    } else {
      showError(data.detail || "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์");
      logout();
    }
  } catch (err) {
    showError("ไม่สามารถติดต่อเซิฟเวอร์ความรวยเพื่อเช็คสิทธิ์ Whitelist ได้");
    logout();
  }
}

function showLoginState() {
  sectionLogin.classList.remove('hidden');
  sectionGenerator.classList.add('hidden');
  userProfile.classList.add('hidden');
}

function showGeneratorState() {
  sectionLogin.classList.add('hidden');
  sectionGenerator.classList.remove('hidden');

  // Set User Profile UI
  userProfile.classList.remove('hidden');
  userCallsign.textContent = currentCallsign;

  // Initial Avatar character
  userAvatar.textContent = currentCallsign.substring(0, 2);
}

function logout() {
  authToken = null;
  currentCallsign = null;
  currentEmail = null;

  if (!isMockMode) {
    firebase.auth().signOut().catch(console.error);
  }
  showLoginState();
}

function showError(message) {
  authAlert.classList.remove('hidden');
  authAlertMsg.textContent = message;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideError() {
  authAlert.classList.add('hidden');
}

// 2. Client-Side Image Merging & Canvas processing
function processGoldFrame(frameImg) {
  const offscreen = document.createElement('canvas');
  // Use natural dimensions or defaults
  const w = frameImg.naturalWidth || 800;
  const h = frameImg.naturalHeight || 800;
  offscreen.width = w;
  offscreen.height = h;

  const oCtx = offscreen.getContext('2d');
  oCtx.drawImage(frameImg, 0, 0, w, h);

  try {
    const imgData = oCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Convert near-black pixels to transparent
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Threshold: if R, G, B are all < 35, set alpha = 0
      if (r < 35 && g < 35 && b < 35) {
        data[i + 3] = 0;
      }
    }
    oCtx.putImageData(imgData, 0, 0);
    processedFrameCanvas = offscreen;
  } catch (e) {
    console.error("Canvas pixel clearing failed (likely CORS issue if image loaded from external domain). Using default image.", e);
    processedFrameCanvas = frameImg; // Fallback
  }
}

function drawCanvas() {
  // Set canvas size from the ACTIVE frame (may be rotated to match user photo)
  const targetWidth = activeFrameCanvas ? (activeFrameCanvas.naturalWidth || activeFrameCanvas.width) : 800;
  const targetHeight = activeFrameCanvas ? (activeFrameCanvas.naturalHeight || activeFrameCanvas.height) : 800;

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw user image if loaded
  if (userImage) {
    // 3. Fill transparent frame area with dominant color of user photo
    const [r, g, b] = getDominantColor(userImage);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scale = parseFloat(sliderScale.value) / 100;
    const xOffset = parseInt(sliderX.value);
    const yOffset = parseInt(sliderY.value);

    // Draw user photo under the frame
    const uW = userImage.width * scale;
    const uH = userImage.height * scale;

    // Center alignment + offsets
    const dx = (canvas.width - uW) / 2 + xOffset;
    const dy = (canvas.height - uH) / 2 + yOffset;

    ctx.drawImage(userImage, dx, dy, uW, uH);
  } else {
    // Placeholder background inside the frame area if no image
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '30px Noto Sans Thai';
    ctx.fillStyle = '#d5a337';
    ctx.textAlign = 'center';
    ctx.fillText('กรุณาอัปโหลดรูปภาพความยากจน', canvas.width / 2, canvas.height / 2);
  }

  // Draw the processed transparent gold frame on top
  if (activeFrameCanvas) {
    ctx.drawImage(activeFrameCanvas, 0, 0, canvas.width, canvas.height);
  }
}

// 3. Event Listeners Setup
function setupEventListeners() {

  // Auth Triggers
  btnLoginGoogle.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).catch((err) => {
      showError("ไม่สามารถเปิดล็อกอินด้วย Google ได้: " + err.message);
    });
  });

  btnLoginMock.addEventListener('click', async () => {
    const email = inputMockEmail.value.trim();
    if (!email) {
      alert("กรุณากรอก Email เพื่อจำลองสิทธิ์!");
      return;
    }
    const mockToken = `mock-token-${email}`;
    await checkWhitelist(mockToken);
  });

  btnLogout.addEventListener('click', logout);

  // File Upload Handlers
  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-gold-500', 'bg-slate-900/80');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-gold-500', 'bg-slate-900/80');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-gold-500', 'bg-slate-900/80');
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  // Slider controls handlers
  sliderScale.addEventListener('input', () => {
    labelScale.textContent = `${sliderScale.value}%`;
    drawCanvas();
  });

  sliderX.addEventListener('input', () => {
    labelX.textContent = `${sliderX.value} px`;
    drawCanvas();
  });

  sliderY.addEventListener('input', () => {
    labelY.textContent = `${sliderY.value} px`;
    drawCanvas();
  });

  // Action Buttons
  btnReset.addEventListener('click', () => {
    sliderScale.value = 100;
    sliderX.value = 0;
    sliderY.value = 0;
    labelScale.textContent = '100%';
    labelX.textContent = '0 px';
    labelY.textContent = '0 px';
    drawCanvas();
  });

  btnGenerate.addEventListener('click', async () => {
    if (!userImage) {
      alert("กรุณาอัปโหลดรูปภาพก่อนเลี่ยมทอง!");
      return;
    }

    // Show loading state
    canvasLoading.classList.remove('hidden');

    try {
      // Send telemetry API call to register log
      const res = await fetch('/api/logs/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        // Refresh leaderboard in background
        const activeTab = document.querySelector('[id^="tab-"].bg-gold-500');
        const activePeriod = activeTab ? activeTab.id.replace('tab-', '') : 'daily';
        fetchStats(activePeriod === 'all' ? 'all_time' : activePeriod);
      } else {
        console.warn("Log failed:", data.detail);
      }
    } catch (err) {
      console.warn("Logging generation failed (download will continue):", err);
    } finally {
      canvasLoading.classList.add('hidden');
    }

    // Download immediately regardless of log success/failure
    triggerDownload();
  });

  btnDownload.addEventListener('click', triggerDownload);

  // Leaderboard Period Tabs
  const tabs = [
    { el: tabDaily, period: 'daily' },
    { el: tabWeekly, period: 'weekly' },
    { el: tabMonthly, period: 'monthly' },
    { el: tabAll, period: 'all_time' }
  ];

  tabs.forEach(tab => {
    tab.el.addEventListener('click', async () => {
      // Reset active styles
      tabs.forEach(t => {
        t.el.className = 'py-1.5 rounded-md hover:text-slate-200 transition-all';
      });
      // Set active
      tab.el.className = 'py-1.5 rounded-md bg-gold-500 text-slate-950 font-bold';

      await fetchStats(tab.period);
    });
  });
}

function triggerDownload() {
  // Build filename: originalname_framed_YYYYMMDD_HHmmss.png
  const now = new Date();
  const ts = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') + '_' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const filename = `${originalFileName}_framed_${ts}.png`;
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

// --- Image processing helpers ---

// 1. Rotate a canvas 90° clockwise — used to rotate the frame to match landscape photos
function rotateCanvas90(src) {
  const srcW = src.naturalWidth || src.width;
  const srcH = src.naturalHeight || src.height;
  const offscreen = document.createElement('canvas');
  offscreen.width = srcH;
  offscreen.height = srcW;
  const oCtx = offscreen.getContext('2d');
  oCtx.translate(srcH / 2, srcW / 2);
  oCtx.rotate(Math.PI / 2); // 90° clockwise
  oCtx.drawImage(src, -srcW / 2, -srcH / 2);
  return offscreen;
}

// 2. Compute best-fit scale (%) so user image fills the active frame with 5% buffer on each side
function computeAutoFitScale(img) {
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;
  const frameW = activeFrameCanvas ? (activeFrameCanvas.naturalWidth || activeFrameCanvas.width) : 800;
  const frameH = activeFrameCanvas ? (activeFrameCanvas.naturalHeight || activeFrameCanvas.height) : 800;
  const usable = 0.90; // 90% of frame = 5% buffer each side
  const scaleX = (frameW * usable) / imgW;
  const scaleY = (frameH * usable) / imgH;
  return Math.min(scaleX, scaleY) * 100; // return as %
}

// 3. Compute MEDIAN RGB color from an image/canvas via downsampled read
function getDominantColor(img) {
  const offscreen = document.createElement('canvas');
  offscreen.width = 100;
  offscreen.height = 100;
  const oCtx = offscreen.getContext('2d');
  oCtx.drawImage(img, 0, 0, 100, 100);
  try {
    const data = oCtx.getImageData(0, 0, 100, 100).data;
    const rs = [], gs = [], bs = [];
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 32) { // skip near-transparent pixels
        rs.push(data[i]);
        gs.push(data[i + 1]);
        bs.push(data[i + 2]);
      }
    }
    if (rs.length > 0) {
      const med = arr => {
        arr.sort((a, b) => a - b);
        const mid = Math.floor(arr.length / 2);
        return arr.length % 2 === 0 ? Math.round((arr[mid - 1] + arr[mid]) / 2) : arr[mid];
      };
      return [med(rs), med(gs), med(bs)];
    }
  } catch (e) {
    console.warn('getDominantColor failed (possible CORS):', e);
  }
  return [15, 23, 42]; // fallback: dark slate
}

function handleFile(file) {
  if (!file.type.startsWith('image/')) {
    alert("กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง!");
    return;
  }

  // Store original filename without extension for download naming
  originalFileName = file.name.replace(/\.[^/.]+$/, '') || 'image';

  const reader = new FileReader();
  reader.onload = (e) => {
    const rawImg = new Image();
    rawImg.src = e.target.result;
    rawImg.onload = () => {
      // Trust user's photo orientation — rotate the FRAME to match if photo is landscape
      userImage = rawImg;
      const imgW = rawImg.naturalWidth || rawImg.width;
      const imgH = rawImg.naturalHeight || rawImg.height;
      activeFrameCanvas = (imgW > imgH && processedFrameCanvas)
        ? rotateCanvas90(processedFrameCanvas)
        : processedFrameCanvas;

      // 2. Auto-fit scale with 5% buffer + reset offsets
      const autoScale = computeAutoFitScale(userImage);
      sliderScale.value = Math.round(autoScale);
      labelScale.textContent = `${Math.round(autoScale)}%`;
      sliderX.value = 0;
      sliderY.value = 0;
      labelX.textContent = '0 px';
      labelY.textContent = '0 px';

      cardPreview.classList.remove('hidden');
      cardDownload.classList.add('hidden');
      drawCanvas();
    };
  };
  reader.readAsDataURL(file);
}

// 4. Leaderboard Statistics Fetcher
async function fetchStats(period) {
  leaderboardLoading.classList.remove('hidden');
  leaderboardList.classList.add('hidden');
  leaderboardEmpty.classList.add('hidden');

  try {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error("API error");
    const data = await res.json();

    // Map internal periods
    let periodKey = period;
    if (period === 'weekly') periodKey = 'weekly';
    if (period === 'all_time') periodKey = 'all_time';

    const statsList = data[periodKey] || [];

    leaderboardList.innerHTML = '';

    if (statsList.length === 0) {
      leaderboardEmpty.classList.remove('hidden');
      return;
    }

    statsList.forEach((stat, idx) => {
      const li = document.createElement('li');
      li.className = 'flex items-center justify-between py-2.5';

      let badge = '';
      if (idx === 0) badge = '🥇';
      else if (idx === 1) badge = '🥈';
      else if (idx === 2) badge = '🥉';
      else badge = `<span class="inline-block w-5 text-center text-xs text-slate-500 font-semibold">${idx + 1}</span>`;

      li.innerHTML = `
        <div class="flex items-center space-x-3">
          ${badge}
          <span class="font-semibold text-slate-200">${stat.callsign}</span>
        </div>
        <div class="flex items-center space-x-1.5">
          <span class="text-gold-400 font-black font-mono">${stat.count}</span>
          <span class="text-[10px] text-slate-500">เลี่ยม</span>
        </div>
      `;
      leaderboardList.appendChild(li);
    });

    leaderboardList.classList.remove('hidden');
  } catch (err) {
    console.error("Leaderboard fetch failed:", err);
    leaderboardEmpty.classList.remove('hidden');
    leaderboardEmpty.innerHTML = `
      <i class="fa-solid fa-triangle-exclamation text-xl text-amber-500/80 mb-2 block"></i>
      ไม่สามารถดึงข้อมูลสถิติความรวยได้ในขณะนี้
    `;
  } finally {
    leaderboardLoading.classList.add('hidden');
  }
}

// 5. Template selection management
async function fetchTemplates() {
  try {
    const res = await fetch('/api/templates');
    availableTemplates = await res.json();
    if (availableTemplates && availableTemplates.length > 0) {
      // Default to the first classic template if available
      activeTemplate = availableTemplates.find(t => t.includes('classic')) || availableTemplates[0];

      // Randomly pick a template to show as hero image on the landing page
      const heroImg = document.getElementById('hero-frame-img');
      if (heroImg) {
        const randomTemplate = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
        heroImg.onload = () => { heroImg.style.opacity = '1'; };
        heroImg.onerror = () => { heroImg.style.opacity = '1'; }; // fallback: show default
        heroImg.src = `/frame_template/${randomTemplate}`;
      }
    } else {
      // No templates from API — just show default with fade-in
      const heroImg = document.getElementById('hero-frame-img');
      if (heroImg) heroImg.style.opacity = '1';
    }
    renderTemplateSelector();
  } catch (err) {
    console.error("Failed to load templates:", err);
    const heroImg = document.getElementById('hero-frame-img');
    if (heroImg) heroImg.style.opacity = '1';
  }
}

function renderTemplateSelector() {
  if (!templateSelectorContainer) return;
  templateSelectorContainer.innerHTML = '';

  if (availableTemplates.length === 0) {
    templateSelectorContainer.innerHTML = '<span class="text-xs text-slate-500">ไม่พบเทมเพลตอื่นในระบบ</span>';
    return;
  }

  availableTemplates.forEach(template => {
    const btn = document.createElement('button');
    // Format display name (e.g. gold_frame_classic.png -> Gold Frame Classic)
    const displayName = template
      .replace(/\.[^/.]+$/, "") // Remove extension
      .replace(/[_-]/g, " ")   // Replace dashes/underscores with space
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    btn.type = 'button';
    btn.className = `px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${activeTemplate === template
        ? 'bg-gold-500/20 border-gold-400 text-gold-300 shadow-md shadow-gold-500/10'
        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
      }`;

    btn.innerHTML = `<i class="fa-solid fa-gem mr-1.5 ${activeTemplate === template ? 'text-gold-300' : 'text-slate-500'}"></i>${displayName}`;

    btn.addEventListener('click', () => {
      if (activeTemplate === template) return;
      activeTemplate = template;
      renderTemplateSelector();
      canvasLoading.classList.remove('hidden');
      goldFrameImage.src = `/frame_template/${template}`;
    });

    templateSelectorContainer.appendChild(btn);
  });
}

// 6. Image attribution management
async function fetchAttributions() {
  try {
    const res = await fetch('/attribution.json');
    const data = await res.json();
    renderAttributions(data);
  } catch (err) {
    console.error("Failed to load attributions:", err);
  }
}

function renderAttributions(data) {
  if (!attributionList || !data) return;
  attributionList.innerHTML = '';

  // Only process if data is an array
  if (Array.isArray(data)) {
    data.forEach(item => {
      if (!item || !item.title) return; // Skip invalid entries

      const li = document.createElement('li');
      let html = `<strong>${item.title}</strong>`;

      if (item.author) {
        html += ` โดย ${item.author}`;
      }
      if (item.license) {
        html += ` (${item.license})`;
      }
      if (item.source) {
        html += ` - <a href="${item.source}" target="_blank" class="hover:text-gold-400 underline transition-all">ลิงก์ต้นฉบับ</a>`;
      }

      li.innerHTML = html;
      attributionList.appendChild(li);
    });
  }
}


