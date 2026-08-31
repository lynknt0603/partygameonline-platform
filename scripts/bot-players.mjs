/**
 * Script giả lập bot tham gia phòng chơi (Lobby & In-Game)
 * Cách dùng: node bot-players.mjs <ROOM_ID> [SỐ_LƯỢNG_BOT=7]
 * Hoặc dọn sạch phòng cũ cho tất cả bot: node bot-players.mjs --clean
 * Ví dụ: node bot-players.mjs ABCD 7
 */

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const WS_URL = BASE_URL.replace(/^http/, 'ws') + '/ws';
const arg2 = process.argv[2]?.trim();
const isCleanMode = arg2 === '--clean' || arg2 === 'clean';
const roomId = isCleanMode ? null : arg2?.toUpperCase();
const botCount = Math.min(10, Math.max(1, parseInt(process.argv[3] || '7', 10)));

const BOT_NAMES = [
  '🤖 Bot_Alpha',
  '🤖 Bot_Bravo',
  '🤖 Bot_Charlie',
  '🤖 Bot_Delta',
  '🤖 Bot_Echo',
  '🤖 Bot_Foxtrot',
  '🤖 Bot_Golf',
  '🤖 Bot_Hotel',
  '🤖 Bot_India',
  '🤖 Bot_Juliet'
];

if (!isCleanMode && !roomId) {
  console.log('\n❌ Vui lòng cung cấp Mã Phòng (Room ID)!');
  console.log('👉 Cách dùng: node scripts/bot-players.mjs <MÃ_PHÒNG> [SỐ_BOT]');
  console.log('👉 Dọn sạch bot kẹt: node scripts/bot-players.mjs --clean');
  console.log('👉 Ví dụ: node scripts/bot-players.mjs ABCD 7\n');
  process.exit(1);
}

function extractCookies(response, currentCookies = {}) {
  const setCookieHeaders = response.headers.getSetCookie 
    ? response.headers.getSetCookie() 
    : [response.headers.get('set-cookie')].filter(Boolean);

  for (const header of setCookieHeaders) {
    const parts = header.split(';')[0].split('=');
    if (parts.length >= 2) {
      currentCookies[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  }
  return currentCookies;
}

function cookieString(cookieObj) {
  return Object.entries(cookieObj)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function getCsrfToken(cookies) {
  const csrfRes = await fetch(`${BASE_URL}/api/v1/csrf`);
  const updatedCookies = extractCookies(csrfRes, { ...cookies });
  const csrfData = await csrfRes.json();
  return { csrfToken: csrfData.token, cookies: updatedCookies };
}

async function authenticateBot(index) {
  const username = `bot_player_${index + 1}`;
  const password = `password123`;
  const name = BOT_NAMES[index] || `🤖 Bot_${index + 1}`;
  let { csrfToken, cookies } = await getCsrfToken({});

  // 1. Đăng ký hoặc Đăng nhập tài khoản Member
  let authRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieString(cookies),
      'X-XSRF-TOKEN': csrfToken
    },
    body: JSON.stringify({ username, password })
  });
  cookies = extractCookies(authRes, cookies);

  if (!authRes.ok) {
    authRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieString(cookies),
        'X-XSRF-TOKEN': csrfToken
      },
      body: JSON.stringify({ username, password })
    });
    cookies = extractCookies(authRes, cookies);
  }

  if (!authRes.ok) {
    const errBody = await authRes.text();
    throw new Error(`Đăng nhập Member thất bại: ${errBody}`);
  }

  // 2. Cập nhật Display Name
  await fetch(`${BASE_URL}/api/v1/profile/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieString(cookies),
      'X-XSRF-TOKEN': csrfToken
    },
    body: JSON.stringify({ displayName: name })
  });

  return { name, username, cookies, csrfToken };
}

async function checkAndLeaveCurrentRoom(bot) {
  try {
    const meRes = await fetch(`${BASE_URL}/api/v1/session/me`, {
      headers: { 'Cookie': cookieString(bot.cookies) }
    });
    if (!meRes.ok) return null;
    const meData = await meRes.json();
    const currentRoomId = meData.currentRoomId;

    if (currentRoomId) {
      await fetch(`${BASE_URL}/api/v1/rooms/${currentRoomId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookieString(bot.cookies),
          'X-XSRF-TOKEN': bot.csrfToken
        }
      });
      return currentRoomId;
    }
    return null;
  } catch (err) {
    return null;
  }
}

async function createBot(index, targetRoomId) {
  const name = BOT_NAMES[index] || `🤖 Bot_${index + 1}`;
  try {
    const bot = await authenticateBot(index);

    // 1. Tự động kiểm tra và rời phòng/game cũ nếu đang bị kẹt
    const leftOldRoom = await checkAndLeaveCurrentRoom(bot);
    if (leftOldRoom && leftOldRoom !== targetRoomId) {
      console.log(`🔄 [${name}] Đã tự động rời khỏi phòng/ván cũ: ${leftOldRoom}`);
    }

    // 2. Tham gia phòng mục tiêu
    let joinRes = await fetch(`${BASE_URL}/api/v1/rooms/${targetRoomId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieString(bot.cookies),
        'X-XSRF-TOKEN': bot.csrfToken
      }
    });

    if (!joinRes.ok) {
      const joinData = await joinRes.json().catch(() => ({}));
      if (joinData.errorCode === 'ALREADY_IN_ROOM') {
        // Rời phòng cũ và thử lại 1 lần nữa
        await checkAndLeaveCurrentRoom(bot);
        joinRes = await fetch(`${BASE_URL}/api/v1/rooms/${targetRoomId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookieString(bot.cookies),
            'X-XSRF-TOKEN': bot.csrfToken
          }
        });
      }

      if (!joinRes.ok) {
        const retryData = await joinRes.json().catch(() => ({}));
        if (retryData.errorCode !== 'ROOM_ALREADY_JOINED') {
          if (retryData.errorCode === 'ROOM_FULL') {
            throw new Error(`Phòng ${targetRoomId} đã đủ số lượng người chơi.`);
          }
          throw new Error(`Tham gia phòng thất bại: ${JSON.stringify(retryData)}`);
        }
      }
    }

    // 3. Bật Sẵn sàng (Ready)
    await fetch(`${BASE_URL}/api/v1/rooms/${targetRoomId}/ready`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieString(bot.cookies),
        'X-XSRF-TOKEN': bot.csrfToken
      },
      body: JSON.stringify({ ready: true })
    });

    // 4. Kết nối WebSocket để duy trì kết nối Online
    const ws = new WebSocket(WS_URL, {
      headers: {
        'Cookie': cookieString(bot.cookies),
        'Origin': 'http://localhost:5173'
      }
    });

    ws.onopen = () => {
      console.log(`✅ [${name}] đã vào phòng ${targetRoomId} và SẴN SÀNG (READY)!`);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'GAME_STARTED') {
          console.log(`🎮 [${name}] Trò chơi đã bắt đầu!`);
        }
      } catch (err) {
        // ignore parse errors
      }
    };

    ws.onerror = (err) => {
      // ignore normal disconnect errors on teardown
    };

    bot.ws = ws;
    bot.targetRoomId = targetRoomId;
    return bot;
  } catch (err) {
    console.error(`❌ [${name}] Lỗi:`, err.message);
    return null;
  }
}

async function leaveBot(bot) {
  try {
    // 1. Đóng kết nối WebSocket
    if (bot.ws) {
      try {
        bot.ws.close();
      } catch {
        // ignore
      }
    }

    // 2. Gửi request Out phòng / Out game
    const leftRoom = await checkAndLeaveCurrentRoom(bot);
    const roomToReport = leftRoom || bot.targetRoomId;
    if (roomToReport) {
      console.log(`👋 [${bot.name}] đã out khỏi phòng/game ${roomToReport}.`);
    } else {
      console.log(`👋 [${bot.name}] đã ngắt kết nối.`);
    }
  } catch (err) {
    console.error(`⚠️ [${bot.name}] Lỗi khi out phòng:`, err.message);
  }
}

async function cleanAllBots() {
  console.log('\n🧹 Đang kiểm tra và dọn dẹp tất cả các bot kẹt phòng...\n');
  for (let i = 0; i < 10; i++) {
    try {
      const bot = await authenticateBot(i);
      const leftRoom = await checkAndLeaveCurrentRoom(bot);
      if (leftRoom) {
        console.log(`👋 [${bot.name}] đã thoát khỏi phòng cũ: ${leftRoom}`);
      } else {
        console.log(`✨ [${bot.name}] không kẹt phòng nào.`);
      }
    } catch (err) {
      console.error(`⚠️ Bot_${i + 1} lỗi:`, err.message);
    }
  }
  console.log('\n🎉 Đã dọn dẹp xong toàn bộ bot!\n');
}

async function main() {
  if (isCleanMode) {
    await cleanAllBots();
    process.exit(0);
  }

  console.log(`\n🚀 Đang tạo ${botCount} bot tham gia phòng: ${roomId} ...\n`);
  const bots = [];
  for (let i = 0; i < botCount; i++) {
    const bot = await createBot(i, roomId);
    if (bot) bots.push(bot);
    await new Promise((r) => setTimeout(r, 150)); // Tránh dồn request cùng lúc
  }

  console.log(`\n✨ Đã đưa thành công ${bots.length}/${botCount} bot vào phòng ${roomId}!`);
  console.log(`💡 Nhấn Ctrl + C để dừng bot và tự động OUT PHÒNG / OUT GAME.\n`);

  let isExiting = false;
  const handleExit = async () => {
    if (isExiting) return;
    isExiting = true;
    console.log('\n🛑 Đang cho tất cả các bot out phòng/game, vui lòng chờ...');
    
    // Safety timeout để không bị treo
    const forceExitTimeout = setTimeout(() => {
      console.log('⚡ Buộc thoát...');
      process.exit(0);
    }, 4000);

    try {
      await Promise.all(bots.map((b) => leaveBot(b)));
      console.log('🎉 Tất cả bot đã rời phòng/game thành công!\n');
    } catch (err) {
      console.error('Lỗi khi thoát:', err);
    } finally {
      clearTimeout(forceExitTimeout);
      process.exit(0);
    }
  };

  process.on('SIGINT', handleExit);
  process.on('SIGTERM', handleExit);
  process.on('SIGHUP', handleExit);
  process.on('SIGQUIT', handleExit);
}

main();
