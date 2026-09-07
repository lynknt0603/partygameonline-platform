/**
 * Script giả lập bot tham gia phòng chơi (Lobby & In-Game)
 * Tự động chơi Liar's Number bằng hành động ngẫu nhiên.
 * Với Not In My Pot, bot vẫn ưu tiên thẻ OUT_OF_HOUSE (Đuổi Khỏi Nhà / Out You Go!).
 * 
 * Cách dùng: node scripts/bot-players.mjs <ROOM_ID> [SỐ_LƯỢNG_BOT=7]
 * Bắt buộc: BOT_PASSWORD=<mật khẩu bot>
 * Hoặc dọn sạch phòng cũ cho tất cả bot: node scripts/bot-players.mjs --clean
 * Ví dụ: node scripts/bot-players.mjs ABCD 7
 */

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const WS_URL = BASE_URL.replace(/^http/, 'ws') + '/ws';
const BOT_PASSWORD = process.env.BOT_PASSWORD;
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

function authHeaders(bot, json = false) {
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    'Authorization': `Bearer ${bot.accessToken}`
  };
}

async function authenticateBot(index) {
  const username = `bot_player_${index + 1}`;
  const password = BOT_PASSWORD;
  const rawName = BOT_NAMES[index] || `🤖 Bot_${index + 1}`;
  const name = rawName.slice(0, 10);
  // 1. Đăng ký hoặc Đăng nhập tài khoản Member
  let authRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password, displayName: name })
  });
  if (!authRes.ok) {
    authRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
  }

  if (!authRes.ok) {
    const errBody = await authRes.text();
    throw new Error(`Đăng nhập Member thất bại: ${errBody}`);
  }

  const authData = await authRes.json();
  const bot = { name, username, playerId: authData.playerId, accessToken: authData.accessToken };

  // 2. Cập nhật Display Name
  const profileRes = await fetch(`${BASE_URL}/api/v1/profile/me`, {
    method: 'PATCH',
    headers: authHeaders(bot, true),
    body: JSON.stringify({ displayName: name })
  });
  if (profileRes.ok) {
    const profile = await profileRes.json();
    bot.accessToken = profile.accessToken || bot.accessToken;
  }

  // 3. Lấy thông tin session hiện tại (PlayerId)
  let playerId = null;
  try {
    const meRes = await fetch(`${BASE_URL}/api/v1/session/me`, {
      headers: authHeaders(bot)
    });
    if (meRes.ok) {
      const meData = await meRes.json();
      playerId = meData.playerId;
      bot.accessToken = meData.accessToken || bot.accessToken;
    }
  } catch {
    // ignore
  }

  bot.playerId = playerId || bot.playerId;
  return bot;
}

async function checkAndLeaveCurrentRoom(bot) {
  try {
    const meRes = await fetch(`${BASE_URL}/api/v1/session/me`, {
      headers: authHeaders(bot)
    });
    if (!meRes.ok) return null;
    const meData = await meRes.json();
    bot.accessToken = meData.accessToken || bot.accessToken;
    if (meData.playerId) {
      bot.playerId = meData.playerId;
    }
    const currentRoomId = meData.currentRoomId;

    if (currentRoomId) {
      await fetch(`${BASE_URL}/api/v1/rooms/${currentRoomId}/leave`, {
        method: 'POST',
        headers: {
          ...authHeaders(bot, true)
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
    return null;
  }
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const envelope = {
    version: 1,
    type: 'GAME_ACTION',
    requestId,
    roomId: bot.targetRoomId,
    lastServerSequence: bot.lastServerSequence || 0,
    payload: {
      commandId: requestId,
      ...payload
    }
  };
  bot.ws.send(JSON.stringify(envelope));
  return requestId;
}

function extractViewFromMessage(msg) {
  if (!msg) return null;
  if (msg.payload?.view) return msg.payload.view;
  if (msg.view) return msg.view;
  if (
    ['not-in-my-pot', 'liars-number'].includes(msg.payload?.gameType) ||
    ['not-in-my-pot', 'liars-number'].includes(msg.gameType)
  ) {
    return msg.payload || msg;
  }
  return null;
}

function randomItem(items) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

async function handleLiarsNumberTurn(bot, view) {
  if (!view || view.gameType !== 'liars-number' || view.finished || view.phase === 'GAME_OVER') return;

  const legalActions = Array.isArray(view.legalActions) ? view.legalActions : [];
  if (legalActions.length === 0) return;

  const actionKey = `liars_${view.roundNumber || 0}_${view.phase}_${view.stateVersion || 0}`;
  if (bot.lastActionKey === actionKey || bot.isActing) return;

  bot.lastActionKey = actionKey;
  bot.isActing = true;
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.floor(Math.random() * 700)));

  try {
    const type = randomItem(legalActions);
    let command = null;
    let description = type;

    switch (type) {
      case 'SELECT_CARD': {
        const card = randomItem((view.myHand || []).filter((item) => item.cardId));
        if (card) {
          command = { type, cardId: card.cardId };
          description = `chọn ngẫu nhiên lá ${card.label || card.cardId}`;
        }
        break;
      }
      case 'SELECT_TARGET': {
        const fallbackTargets = (view.players || [])
          .filter((player) => player.playerId !== bot.playerId && !player.you)
          .map((player) => player.playerId);
        const targetPlayerId = randomItem(view.availableTargetPlayerIds || []) || randomItem(fallbackTargets);
        if (targetPlayerId) {
          command = { type, targetPlayerId };
          const target = (view.players || []).find((player) => player.playerId === targetPlayerId);
          description = `chuyền bài cho ${target?.displayName || targetPlayerId}`;
        }
        break;
      }
      case 'DECLARE_TYPE':
      case 'PASS_DECLARE_TYPE': {
        const declaredType = 1 + Math.floor(Math.random() * 8);
        command = { type, declaredType };
        description = `tuyên bố số ${declaredType}`;
        break;
      }
      case 'GUESS': {
        const guess = Math.random() < 0.5 ? 'TRUE' : 'FALSE';
        command = { type, guess };
        description = `đoán ${guess === 'TRUE' ? 'NÓI THẬT' : 'NÓI DỐI'}`;
        break;
      }
      case 'PEEK_AND_PASS':
        command = { type };
        description = 'xem bài rồi chuyền tiếp';
        break;
      case 'SELECT_PASS_TARGET': {
        const targetPlayerId = randomItem(view.availablePassTargetPlayerIds || []);
        if (targetPlayerId) {
          command = { type, targetPlayerId };
          const target = (view.players || []).find((player) => player.playerId === targetPlayerId);
          description = `chuyền tiếp cho ${target?.displayName || targetPlayerId}`;
        }
        break;
      }
      default:
        break;
    }

    if (!command) {
      bot.lastActionKey = null;
      return;
    }

    sendWsCommand(bot, {
      expectedVersion: view.stateVersion,
      ...command
    });
    console.log(`🎲 [${bot.name}] Liar's Number: ${description}`);
  } catch (err) {
    bot.lastActionKey = null;
    console.error(`⚠️ [${bot.name}] Lỗi khi chơi Liar's Number:`, err.message);
  } finally {
    setTimeout(() => {
      bot.isActing = false;
    }, 400);
  }
}

function handleGameView(bot, view) {
  if (!view?.gameType) return;
  if (view.you) bot.playerId = view.you;

  if (view.gameType === 'liars-number') {
    void handleLiarsNumberTurn(bot, view);
  } else if (view.gameType === 'not-in-my-pot') {
    void handleNotInMyPotTurn(bot, view);
  }
}

async function fetchGameSnapshot(bot) {
  if (!['liars-number', 'not-in-my-pot'].includes(bot.gameId)) return null;
  const response = await fetch(
    `${BASE_URL}/api/v1/games/${bot.gameId}/rooms/${bot.targetRoomId}/snapshot`,
    { headers: authHeaders(bot) }
  );
  return response.ok ? response.json() : null;
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
        ...authHeaders(bot, true)
      }
    });

    if (!joinRes.ok) {
      const joinData = await joinRes.json().catch(() => ({}));
      if (joinData.errorCode === 'ALREADY_IN_ROOM') {
        await checkAndLeaveCurrentRoom(bot);
        joinRes = await fetch(`${BASE_URL}/api/v1/rooms/${targetRoomId}/join`, {
          method: 'POST',
          headers: {
            ...authHeaders(bot, true)
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
    const readyRes = await fetch(`${BASE_URL}/api/v1/rooms/${targetRoomId}/ready`, {
      method: 'PUT',
      headers: {
        ...authHeaders(bot, true)
      },
      body: JSON.stringify({ ready: true })
    });
    if (!readyRes.ok) {
      const readyError = await readyRes.json().catch(() => ({}));
      throw new Error(`Không thể sẵn sàng: ${JSON.stringify(readyError)}`);
    }
    const readyRoom = await readyRes.json();
    bot.gameId = readyRoom.gameId;

    // 4. Kết nối WebSocket
    const ws = new WebSocket(WS_URL, ["boardverse", `bearer.${bot.accessToken}`]);

    bot.ws = ws;
    bot.targetRoomId = targetRoomId;
    bot.lastServerSequence = 0;

    ws.onopen = () => {
      console.log(`✅ [${name}] đã vào phòng ${targetRoomId} và SẴN SÀNG (READY)!`);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (typeof msg.serverSequence === 'number') {
          bot.lastServerSequence = msg.serverSequence;
        }
        if (msg.type === 'ACTION_REJECTED') {
          bot.lastActionKey = null;
          console.warn(`⚠️ [${name}] Server từ chối action: ${msg.payload?.errorCode || 'UNKNOWN'}`);
        }
        if (msg.type === 'GAME_STARTED') {
          console.log(`🎮 [${name}] Trò chơi đã bắt đầu!`);
          // Gọi snapshot kiểm tra lượt đầu
          setTimeout(async () => {
            try {
              const snapView = await fetchGameSnapshot(bot);
              handleGameView(bot, snapView);
            } catch {
              // ignore
            }
          }, 600);
        }

        const view = extractViewFromMessage(msg);
        handleGameView(bot, view);
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
