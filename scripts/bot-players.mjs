/**
 * Script giả lập bot tham gia phòng chơi (Lobby & In-Game)
 * Cách dùng: node bot-players.mjs <ROOM_ID> [SỐ_LƯỢNG_BOT=7]
 * Ví dụ: node bot-players.mjs ABCD 7
 */

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const WS_URL = BASE_URL.replace(/^http/, 'ws') + '/ws';
const roomId = process.argv[2]?.toUpperCase();
const botCount = parseInt(process.argv[3] || '7', 10);

if (!roomId) {
  console.log('\n❌ Vui lòng cung cấp Mã Phòng (Room ID)!');
  console.log('👉 Cách dùng: node scripts/bot-players.mjs <MÃ_PHÒNG> [SỐ_BOT]');
  console.log('👉 Ví dụ: node scripts/bot-players.mjs ABCD 7\n');
  process.exit(1);
}

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

async function createBot(index) {
  const username = `bot_player_${index + 1}`;
  const password = `password123`;
  const name = BOT_NAMES[index] || `🤖 Bot_${index + 1}`;
  let cookies = {};

  try {
    // 1. Lấy CSRF Token
    const csrfRes = await fetch(`${BASE_URL}/api/v1/csrf`);
    cookies = extractCookies(csrfRes, cookies);
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.token;

    // 2. Đăng ký hoặc Đăng nhập tài khoản Member
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

    // Nếu tài khoản đã tồn tại -> Đăng nhập
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

    // 3. Đổi Display Name đẹp cho Bot
    await fetch(`${BASE_URL}/api/v1/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieString(cookies),
        'X-XSRF-TOKEN': csrfToken
      },
      body: JSON.stringify({ displayName: name })
    });

    // 4. Tham gia phòng (nếu đã ở trong phòng thì bỏ qua lỗi)
    const joinRes = await fetch(`${BASE_URL}/api/v1/rooms/${roomId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieString(cookies),
        'X-XSRF-TOKEN': csrfToken
      }
    });
    
    if (!joinRes.ok) {
      const joinData = await joinRes.json();
      if (joinData.errorCode !== 'ROOM_ALREADY_JOINED') {
        throw new Error(`Tham gia phòng thất bại: ${JSON.stringify(joinData)}`);
      }
    }

    // 5. Bật Sẵn sàng (Ready)
    await fetch(`${BASE_URL}/api/v1/rooms/${roomId}/ready`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieString(cookies),
        'X-XSRF-TOKEN': csrfToken
      },
      body: JSON.stringify({ ready: true })
    });

    // 6. Kết nối WebSocket để duy trì kết nối Online
    const ws = new WebSocket(WS_URL, {
      headers: {
        'Cookie': cookieString(cookies),
        'Origin': 'http://localhost:5173'
      }
    });

    ws.onopen = () => {
      console.log(`✅ [${name}] đã vào phòng ${roomId} và SẴN SÀNG (READY)!`);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'GAME_STARTED') {
          console.log(`🎮 [${name}] Trò chơi đã bắt đầu!`);
        }
      } catch (err) {
        // ignore parse error
      }
    };

    ws.onerror = (err) => {
      console.error(`⚠️ [${name}] WebSocket lỗi:`, err.message || err);
    };

    ws.onclose = () => {
      // console.log(`🔌 [${name}] Mất kết nối WebSocket.`);
    };

    return { name, cookies, csrfToken, ws };
  } catch (err) {
    console.error(`❌ [${name}] Lỗi:`, err.message);
    return null;
  }
}

async function leaveBot(bot) {
  try {
    // 1. Đóng kết nối WebSocket
    if (bot.ws && bot.ws.readyState === WebSocket.OPEN) {
      bot.ws.close();
    }

    // 2. Gửi request Out phòng
    await fetch(`${BASE_URL}/api/v1/rooms/${roomId}/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieString(bot.cookies),
        'X-XSRF-TOKEN': bot.csrfToken
      }
    });
    console.log(`👋 [${bot.name}] đã out khỏi phòng ${roomId}.`);
  } catch (err) {
    console.error(`⚠️ [${bot.name}] Lỗi khi out phòng:`, err.message);
  }
}

async function main() {
  console.log(`\n🚀 Đang tạo ${botCount} bot tham gia phòng: ${roomId} ...\n`);
  const bots = [];
  for (let i = 0; i < botCount; i++) {
    const bot = await createBot(i);
    if (bot) bots.push(bot);
    await new Promise((r) => setTimeout(r, 200)); // Tránh dồn request cùng lúc
  }

  console.log(`\n✨ Đã đưa thành công ${bots.length}/${botCount} bot vào phòng ${roomId}!`);
  console.log(`💡 Nhấn Ctrl + C để dừng bot và tự động OUT PHÒNG.\n`);

  let isExiting = false;
  const handleExit = async () => {
    if (isExiting) return;
    isExiting = true;
    console.log('\n🛑 Đang cho tất cả các bot out phòng, vui lòng chờ...');
    await Promise.all(bots.map((b) => leaveBot(b)));
    console.log('🎉 Tất cả bot đã rời phòng thành công!\n');
    process.exit(0);
  };

  process.on('SIGINT', handleExit);
  process.on('SIGTERM', handleExit);
}

main();

