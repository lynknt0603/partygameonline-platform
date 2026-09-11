/**
 * Multi-Browser Real Simulation Launcher for BoardVerse
 *
 * Tự động tạo phòng, đăng nhập các tài khoản Member và mở N cửa sổ Chrome xếp lưới (Grid Tiling)
 * trên màn hình cho kiểm thử thực tế đa người chơi (ví dụ 6 người chơi Blood Bound).
 */

import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const isClean = args.includes('--clean');

// Thư mục chứa session/profiles tạm cho từng player
const PROFILES_ROOT = path.join(os.tmpdir(), 'boardverse_chrome_profiles');

if (isClean) {
  console.log('🧹 Đang dọn dẹp các profile Chrome kiểm thử tạm thời...');
  if (fs.existsSync(PROFILES_ROOT)) {
    fs.rmSync(PROFILES_ROOT, { recursive: true, force: true });
    console.log('✅ Đã xóa toàn bộ profile kiểm thử tại: ' + PROFILES_ROOT);
  } else {
    console.log('ℹ️ Thư mục profile đã sạch.');
  }
  process.exit(0);
}

// Parse số lượng cửa sổ (mặc định 6)
let playerCount = 6;
let targetRoomCode = null;
let targetGame = 'blood-bound';

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--create') {
    targetGame = args[i + 1] || 'blood-bound';
    i++;
  } else {
    const num = parseInt(arg, 10);
    if (!isNaN(num) && num >= 1 && num <= 12) {
      playerCount = num;
    } else if (!arg.startsWith('-')) {
      targetRoomCode = arg.toUpperCase();
    }
  }
}

const BASE_WEB_URL = process.env.WEB_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8080';
const DEFAULT_PASSWORD = process.env.TEST_PASSWORD || 'Password123!';

const PLAYER_ROLES = [
  { user: 'sim_p_1', name: '👑 P1_Host' },
  { user: 'sim_p_2', name: '🗡️ P2_Vampire' },
  { user: 'sim_p_3', name: '🏹 P3_Assassin' },
  { user: 'sim_p_4', name: '🛡️ P4_Knight' },
  { user: 'sim_p_5', name: '🔮 P5_Oracle' },
  { user: 'sim_p_6', name: '⚔️ P6_Guardian' },
  { user: 'sim_p_7', name: '🌑 P7_Shadow' },
  { user: 'sim_p_8', name: '🦅 P8_Hunter' }
];

// Tìm Chrome trên máy Windows
function findChromeExecutable() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env.PROGRAMFILES || '', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return 'chrome';
}

// Lấy độ phân giải màn hình qua PowerShell
function getScreenBounds() {
  try {
    const psCmd = 'Add-Type -AssemblyName System.Windows.Forms; $s = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; Write-Output "$($s.Width)x$($s.Height)"';
    const output = execSync(`powershell -NoProfile -Command "${psCmd}"`, { encoding: 'utf8' }).trim();
    const lines = output.split(/\r?\n/);
    const lastLine = lines[lines.length - 1]?.trim();
    const [w, h] = lastLine.split('x').map(Number);
    if (w && h) return { width: w, height: h };
  } catch {
    // fallback
  }
  return { width: 1920, height: 1280 };
}

// Tính layout vị trí cửa sổ dạng lưới
function calculateGridLayout(count, screen) {
  // Trừ hao thanh Taskbar Windows (~80px)
  const availWidth = screen.width;
  const availHeight = screen.height - 80;

  let cols = 3;
  let rows = 2;

  if (count <= 2) {
    cols = 2;
    rows = 1;
  } else if (count <= 4) {
    cols = 2;
    rows = 2;
  } else if (count <= 6) {
    cols = 3;
    rows = 2;
  } else if (count <= 8) {
    cols = 4;
    rows = 2;
  } else {
    cols = 4;
    rows = 3;
  }

  const winWidth = Math.floor(availWidth / cols);
  const winHeight = Math.floor(availHeight / rows);

  const layouts = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    layouts.push({
      x: col * winWidth,
      y: row * winHeight,
      width: winWidth,
      height: winHeight
    });
  }
  return layouts;
}

// Đăng ký hoặc Đăng nhập tài khoản Member
async function authenticateMember(username, displayName) {
  let authData = null;
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: DEFAULT_PASSWORD, displayName })
    });
    if (res.ok) {
      authData = await res.json();
    }
  } catch {
    // tiếp tục thử login
  }

  if (!authData) {
    const loginRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: DEFAULT_PASSWORD })
    });

    if (!loginRes.ok) {
      const err = await loginRes.text();
      throw new Error(`Đăng nhập ${username} thất bại: ${err}`);
    }
    authData = await loginRes.json();
  }

  // Dọn sạch phòng cũ nếu đang kẹt
  try {
    const meRes = await fetch(`${BACKEND_URL}/api/v1/session/me`, {
      headers: { 'Authorization': `Bearer ${authData.accessToken}` }
    });
    if (meRes.ok) {
      const me = await meRes.json();
      if (me.currentRoomId) {
        await fetch(`${BACKEND_URL}/api/v1/rooms/${me.currentRoomId}/leave`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authData.accessToken}` }
        });
      }
    }
  } catch {
    /* ignore */
  }

  return authData;
}

// Tạo phòng qua Backend API
async function createOnlineRoom(hostToken, gameId, count) {
  const res = await fetch(`${BACKEND_URL}/api/v1/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hostToken}`
    },
    body: JSON.stringify({
      gameId,
      name: `Phòng Test ${gameId} (${count}P)`,
      maxPlayers: count,
      visibility: 'PUBLIC'
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Tạo phòng thất bại: ${err}`);
  }
  return await res.json();
}

async function joinOnlineRoom(playerToken, roomId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/rooms/${roomId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${playerToken}`
      }
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  const chromePath = findChromeExecutable();
  console.log(`\n======================================================`);
  console.log(`🎮 BOARDVERSE — MULTI-BROWSER REAL-TIME SIMULATOR`);
  console.log(`======================================================`);
  console.log(`🌐 Trình duyệt: ${chromePath}`);
  console.log(`👥 Số người chơi: ${playerCount} cửa sổ`);

  const screen = getScreenBounds();
  console.log(`🖥️  Màn hình hiển thị: ${screen.width} x ${screen.height}`);
  const layouts = calculateGridLayout(playerCount, screen);

  let backendAvailable = false;
  const players = [];

  console.log(`\n🔑 Đang chuẩn bị xác thực ${playerCount} tài khoản người chơi...`);
  try {
    for (let i = 0; i < playerCount; i++) {
      const p = PLAYER_ROLES[i] || { user: `sim_p_${i + 1}`, name: `Player_${i + 1}` };
      const auth = await authenticateMember(p.user, p.name);
      players.push({ ...p, ...auth });
      console.log(`  ✓ Đăng nhập thành công: ${p.name} (${p.user})`);
    }
    backendAvailable = true;
  } catch (e) {
    console.log(`⚠️  Backend chưa sẵn sàng hoặc lỗi auth (${e.message}). Sẽ chạy chế độ URL thông thường.`);
  }

  // Tự động tạo phòng nếu có backend và chưa có room code
  if (backendAvailable && !targetRoomCode) {
    try {
      console.log(`\n🏠 Đang tạo phòng tự động cho game [${targetGame}] với ${playerCount} người chơi...`);
      const room = await createOnlineRoom(players[0].accessToken, targetGame, playerCount);
      targetRoomCode = room.id || room.code;
      console.log(`🎉 Phòng đã tạo thành công! ID: [${room.id}] - Mã mời: [${room.code}]`);

      // Cho các người chơi còn lại vào phòng trước
      for (let i = 1; i < players.length; i++) {
        await joinOnlineRoom(players[i].accessToken, targetRoomCode);
        console.log(`  ✓ ${players[i].name} đã vào phòng chờ!`);
      }
    } catch (e) {
      console.log(`⚠️ Không thể tạo phòng tự động: ${e.message}`);
    }
  }

  if (!fs.existsSync(PROFILES_ROOT)) {
    fs.mkdirSync(PROFILES_ROOT, { recursive: true });
  }

  console.log(`\n🚀 Đang mở ${playerCount} cửa sổ Chrome theo lưới màn hình...`);

  const psLines = [
    `$chrome = "${chromePath.replace(/"/g, '`"')}"`
  ];

  for (let i = 0; i < playerCount; i++) {
    const p = players[i] || PLAYER_ROLES[i] || { name: `Player_${i + 1}` };
    const profileDir = path.join(PROFILES_ROOT, `player_${i + 1}`);
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }

    const layout = layouts[i];

    // Tạo link đích
    let targetUrl;
    const tokenParam = p.accessToken ? `&token=${encodeURIComponent(p.accessToken)}` : '';
    const nameParam = `name=${encodeURIComponent(p.name)}`;

    if (targetRoomCode) {
      targetUrl = `${BASE_WEB_URL}/rooms/${targetRoomCode}?${nameParam}${tokenParam}`;
    } else {
      targetUrl = `${BASE_WEB_URL}/rooms?${nameParam}${tokenParam}`;
    }

    const chromeArgs = [
      `--user-data-dir=${profileDir}`,
      `--window-position=${layout.x},${layout.y}`,
      `--window-size=${layout.width},${layout.height}`,
      '--no-first-run',
      '--no-default-browser-check',
      targetUrl
    ];

    const argListStr = chromeArgs.map((a) => `"${a.replace(/"/g, '`"')}"`).join(', ');
    psLines.push(`Start-Process -FilePath $chrome -ArgumentList @(${argListStr})`);
    console.log(`  [Cửa sổ ${i + 1}] ${p.name} -> Vị trí (${layout.x}, ${layout.y}) [${layout.width}x${layout.height}]`);
  }

  const psScriptPath = path.join(os.tmpdir(), 'launch_grid_browsers.ps1');
  fs.writeFileSync(psScriptPath, psLines.join('\r\n'), 'utf8');

  try {
    execSync(`powershell -ExecutionPolicy Bypass -File "${psScriptPath}"`, { stdio: 'inherit' });
  } catch (err) {
    console.warn('  ⚠️ Lỗi khi thực thi script mở trình duyệt:', err.message);
  }

  console.log(`\n======================================================`);
  console.log(`✅ TẤT CẢ ${playerCount} CỬA SỔ ĐÃ ĐƯỢC MỞ THÀNH CÔNG!`);
  console.log(`======================================================`);
  if (targetRoomCode) {
    console.log(`📍 Tất cả người chơi đã tự động tham gia phòng: ${targetRoomCode}`);
    console.log(`👉 Bạn chỉ cần:`);
    console.log(`   1. Nhấn "Sẵn sàng" trên các cửa sổ Player 2..${playerCount}`);
    console.log(`   2. Nhấn "Bắt đầu ván chơi" trên Cửa sổ 1 (Host) để vào trận!`);
  }
  console.log(`\n💡 Dọn dẹp profile sau khi test xong: node scripts/launch-multiplayer-browsers.mjs --clean\n`);
}

main().catch((err) => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
