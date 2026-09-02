/**
 * Script giả lập bot tham gia phòng chơi (Lobby & In-Game)
 * Tự động chơi Not In My Pot và ƯU TIÊN đánh thẻ OUT_OF_HOUSE (Đuổi Khỏi Nhà / Out You Go!)
 * 
 * Cách dùng: node scripts/bot-players.mjs <ROOM_ID> [SỐ_LƯỢNG_BOT=7]
 * Bắt buộc: BOT_PASSWORD=<mật khẩu bot> (và BOT_ORIGIN nếu chạy khác localhost)
 * Hoặc dọn sạch phòng cũ cho tất cả bot: node scripts/bot-players.mjs --clean
 * Ví dụ: node scripts/bot-players.mjs ABCD 7
 */

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const WS_URL = BASE_URL.replace(/^http/, 'ws') + '/ws';
const BOT_PASSWORD = process.env.BOT_PASSWORD;
const BOT_ORIGIN = process.env.BOT_ORIGIN || 'http://localhost:5173';
const arg2 = process.argv[2]?.trim();
const isCleanMode = arg2 === '--clean' || arg2 === 'clean';
const roomId = isCleanMode ? null : arg2?.toUpperCase();
const botCount = Math.min(10, Math.max(1, parseInt(process.argv[3] || '7', 10)));

const BOT_NAMES = [
  '🤖 Alpha',
  '🤖 Bravo',
  '🤖 Charlie',
  '🤖 Delta',
  '🤖 Echo',
  '🤖 Fox',
  '🤖 Golf',
  '🤖 Hotel',
  '🤖 India',
  '🤖 Juliet'
];

if (!isCleanMode && !roomId) {
  console.log('\n❌ Vui lòng cung cấp Mã Phòng (Room ID)!');
  console.log('👉 Cách dùng: node scripts/bot-players.mjs <MÃ_PHÒNG> [SỐ_BOT]');
  console.log('👉 Dọn sạch bot kẹt: node scripts/bot-players.mjs --clean');
  console.log('👉 Ví dụ: node scripts/bot-players.mjs ABCD 7\n');
  process.exit(1);
}

if (!BOT_PASSWORD) {
  console.error('❌ Thiếu BOT_PASSWORD. Không dùng mật khẩu mặc định; hãy đặt biến môi trường BOT_PASSWORD.');
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
  const password = BOT_PASSWORD;
  const rawName = BOT_NAMES[index] || `🤖 Bot_${index + 1}`;
  const name = rawName.slice(0, 10);
  let { csrfToken, cookies } = await getCsrfToken({});

  // 1. Đăng ký hoặc Đăng nhập tài khoản Member
  let authRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieString(cookies),
      'X-XSRF-TOKEN': csrfToken
    },
    body: JSON.stringify({ username, password, displayName: name })
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

  // 3. Lấy thông tin session hiện tại (PlayerId)
  let playerId = null;
  try {
    const meRes = await fetch(`${BASE_URL}/api/v1/session/me`, {
      headers: { 'Cookie': cookieString(cookies) }
    });
    if (meRes.ok) {
      const meData = await meRes.json();
      playerId = meData.playerId;
    }
  } catch {
    // ignore
  }

  return { name, username, playerId, cookies, csrfToken };
}

async function checkAndLeaveCurrentRoom(bot) {
  try {
    const meRes = await fetch(`${BASE_URL}/api/v1/session/me`, {
      headers: { 'Cookie': cookieString(bot.cookies) }
    });
    if (!meRes.ok) return null;
    const meData = await meRes.json();
    if (meData.playerId) {
      bot.playerId = meData.playerId;
    }
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

function sendWsCommand(bot, payload) {
  if (!bot.ws || bot.ws.readyState !== 1) { // 1 = OPEN
    return;
  }
  const commandId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const envelope = {
    type: 'GAME_ACTION',
    roomId: bot.targetRoomId,
    payload: {
      commandId,
      ...payload
    }
  };
  bot.ws.send(JSON.stringify(envelope));
}

function extractViewFromMessage(msg) {
  if (!msg) return null;
  if (msg.payload?.view) return msg.payload.view;
  if (msg.view) return msg.view;
  if (msg.payload?.gameType === 'not-in-my-pot' || msg.gameType === 'not-in-my-pot') {
    return msg.payload || msg;
  }
  return null;
}

/**
 * Xử lý lượt chơi của Bot trong Not In My Pot
 * Ưu tiên: Thẻ OUT_OF_HOUSE (Đuổi khỏi nhà / Out You Go!)
 */
async function handleNotInMyPotTurn(bot, view) {
  if (!view || view.finished || view.phase === 'GAME_OVER') return;

  const myPlayerId = bot.playerId || view.you;
  if (!myPlayerId) return;
  bot.playerId = myPlayerId;

  const isMyTurn = (view.phase === 'PLAYING' && view.currentPlayerId === myPlayerId);
  const hasPendingForMe = (view.pendingAction && view.pendingAction.actorPlayerId === myPlayerId);

  if (!isMyTurn && !hasPendingForMe) {
    return;
  }

  // Khóa chống gửi trùng lặp action
  const actionKey = `${view.turnNumber || 0}_${view.phase}_${view.pendingAction?.type || 'none'}_${view.stateVersion || 0}`;
  if (bot.lastActionKey === actionKey || bot.isActing) {
    return;
  }
  bot.isActing = true;
  bot.lastActionKey = actionKey;

  // Giả lập thời gian suy nghĩ (500ms - 1000ms)
  await new Promise((r) => setTimeout(r, 500 + Math.floor(Math.random() * 500)));

  try {
    // 1. Xử lý khi có hành động chờ (Pending Action)
    if (hasPendingForMe && view.pendingAction) {
      const pending = view.pendingAction;

      if (pending.type === 'SELECT_TARGET') {
        const allowedTargets = pending.allowedTargetPlayerIds || [];
        const candidates = (view.players || []).filter(p =>
          !p.you && p.playerId !== myPlayerId && p.active && !p.expelled &&
          (allowedTargets.length === 0 || allowedTargets.includes(p.playerId))
        );
        // Ưu tiên chọn mục tiêu có doorCount cao nhất để nhanh loại bỏ đối thủ
        candidates.sort((a, b) => (b.doorCount || 0) - (a.doorCount || 0));
        const target = candidates[0] || (view.players || []).find(p => !p.you && p.playerId !== myPlayerId);

        if (target) {
          sendWsCommand(bot, {
            type: 'SELECT_TARGET',
            targetPlayerId: target.playerId
          });
          console.log(`🎯 [${bot.name}] Chọn mục tiêu: [${target.displayName}] (đang có ${target.doorCount || 0} cửa)`);
        }
        return;
      }

      if (pending.type === 'INSPECT_SHUFFLED_POT') {
        sendWsCommand(bot, {
          type: 'ACKNOWLEDGE_SLOTTED_SPOON'
        });
        console.log(`🥄 [${bot.name}] Xác nhận đã xem nồi (Thìa Có Rãnh)`);
        return;
      }

      if (pending.type === 'RETURN_SHOPPING_CARDS') {
        const myHand = view.myHand || [];
        const returnCards = myHand.slice(0, 2).map(c => c.cardId);
        sendWsCommand(bot, {
          type: 'RETURN_SHOPPING_CARDS',
          cardIds: returnCards
        });
        console.log(`🛒 [${bot.name}] Trả lại 2 thẻ sau khi Đi Chợ Khẩn Cấp`);
        return;
      }
    }

    // 2. Xử lý lượt chơi chính (PLAYING)
    if (isMyTurn && view.phase === 'PLAYING') {
      const myHand = view.myHand || [];
      if (myHand.length === 0) return;

      const otherActivePlayers = (view.players || []).filter(p =>
        !p.you && p.playerId !== myPlayerId && p.active && !p.expelled
      );
      // Sắp xếp đối thủ theo số cửa giảm dần để ưu tiên hạ gục người nhiều cửa nhất
      otherActivePlayers.sort((a, b) => (b.doorCount || 0) - (a.doorCount || 0));
      const bestTarget = otherActivePlayers[0];

      // ⭐ TUYỆT ĐỐI ƯU TIÊN: Đánh thẻ OUT_OF_HOUSE (Đuổi Khỏi Nhà / Out You Go!)
      const outOfHouseCard = myHand.find(c =>
        c.type === 'OUT_OF_HOUSE' ||
        c.actionType === 'OUT_OF_HOUSE' ||
        c.action === 'OUT_OF_HOUSE'
      );

      if (outOfHouseCard && bestTarget) {
        sendWsCommand(bot, {
          type: 'PLAY_ACTION',
          cardId: outOfHouseCard.cardId,
          actionType: 'OUT_OF_HOUSE',
          targetPlayerId: bestTarget.playerId
        });
        console.log(`🚪 [${bot.name}] 👉 ƯU TIÊN ĐÁNH THẺ ĐUỔI KHỎI NHÀ (OUT YOU GO)! Nhắm vào [${bestTarget.displayName}] (${bestTarget.doorCount || 0}/3 cửa)`);
        return;
      }

      // Nếu không có OUT_OF_HOUSE -> Đánh các thẻ hành động khác
      const otherActionCard = myHand.find(c =>
        c.category === 'ACTION' ||
        ['SCOOP_OUT', 'SLOTTED_SPOON', 'EMERGENCY_SHOPPING', 'TRASH_OUT'].includes(c.type)
      );

      if (otherActionCard) {
        const actionType = otherActionCard.type || otherActionCard.actionType;
        const requiresTarget = actionType === 'TRASH_OUT';
        sendWsCommand(bot, {
          type: 'PLAY_ACTION',
          cardId: otherActionCard.cardId,
          actionType: actionType,
          ...(requiresTarget && bestTarget ? { targetPlayerId: bestTarget.playerId } : {})
        });
        console.log(`⚡ [${bot.name}] Đánh thẻ hành động: [${actionType}]`);
        return;
      }

      // Nếu không có thẻ hành động -> Đánh thẻ nguyên liệu (VEGETABLE, MEAT, SALT, TOFU)
      const ingredientCard = myHand.find(c =>
        c.category === 'INGREDIENT' ||
        ['VEGETABLE', 'MEAT', 'SALT', 'TOFU'].includes(c.type)
      ) || myHand[0];

      if (ingredientCard) {
        const declaredType = ingredientCard.type || ingredientCard.ingredientType || 'VEGETABLE';
        sendWsCommand(bot, {
          type: 'PLAY_INGREDIENT',
          cardId: ingredientCard.cardId,
          declaredType: declaredType
        });
        console.log(`🍲 [${bot.name}] Đánh nguyên liệu [${declaredType}] vào nồi`);
      }
    }
  } catch (err) {
    console.error(`⚠️ [${bot.name}] Lỗi khi đánh bài:`, err.message);
  } finally {
    setTimeout(() => {
      bot.isActing = false;
    }, 400);
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

    // 4. Kết nối WebSocket
    const ws = new WebSocket(WS_URL, {
      headers: {
        'Cookie': cookieString(bot.cookies),
        'Origin': BOT_ORIGIN
      }
    });

    bot.ws = ws;
    bot.targetRoomId = targetRoomId;

    ws.onopen = () => {
      console.log(`✅ [${name}] đã vào phòng ${targetRoomId} và SẴN SÀNG (READY)!`);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'GAME_STARTED') {
          console.log(`🎮 [${name}] Trò chơi đã bắt đầu!`);
          // Gọi snapshot kiểm tra lượt đầu
          setTimeout(async () => {
            try {
              const snapRes = await fetch(`${BASE_URL}/api/v1/games/not-in-my-pot/rooms/${targetRoomId}/snapshot`, {
                headers: { 'Cookie': cookieString(bot.cookies) }
              });
              if (snapRes.ok) {
                const snapView = await snapRes.json();
                handleNotInMyPotTurn(bot, snapView);
              }
            } catch {
              // ignore
            }
          }, 600);
        }

        const view = extractViewFromMessage(msg);
        if (view && view.gameType === 'not-in-my-pot') {
          handleNotInMyPotTurn(bot, view);
        }
      } catch (err) {
        // ignore parse errors
      }
    };

    ws.onerror = (err) => {
      // ignore normal disconnect errors
    };

    return bot;
  } catch (err) {
    console.error(`❌ [${name}] Lỗi:`, err.message);
    return null;
  }
}

async function leaveBot(bot) {
  try {
    if (bot.ws) {
      try {
        bot.ws.close();
      } catch {
        // ignore
      }
    }

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
