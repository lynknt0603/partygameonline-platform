/**
 * Script giả lập bot tham gia phòng chơi (Lobby & In-Game)
 * Hỗ trợ tự động chơi các game:
 *  - Night of Bloodlines (Đêm Huyết Nguyệt)
 *  - Not In My Pot (Nồi Lẩu Của Ai)
 *  - Where's the Bone (Chó Trộm Xương)
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
  console.error('❌ Thiếu BOT_PASSWORD. Hãy đặt biến môi trường BOT_PASSWORD trước khi chạy bot.');
  process.exit(1);
}

function authHeaders(bot, json = false) {
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    'Authorization': `Bearer ${bot.accessToken}`
  };
}

async function authenticateBot(index) {
  let username = `bot_player_${index + 1}`;
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

  // Fallback nếu tài khoản cũ bị lệch mật khẩu
  if (!authRes.ok) {
    username = `bot_${index + 1}_${Date.now().toString(36).slice(-4)}`;
    authRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password, displayName: name })
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
  const commandId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const envelope = {
    version: 1,
    type: 'GAME_ACTION',
    roomId: bot.targetRoomId,
    requestId: commandId,
    lastServerSequence: bot.lastServerSequence || 0,
    payload: {
      commandId,
      ...payload
    }
  };
  bot.ws.send(JSON.stringify(envelope));
  return commandId;
}

function extractViewFromMessage(msg) {
  if (!msg) return null;
  if (msg.payload?.view) return msg.payload.view;
  if (msg.view) return msg.view;
  if (msg.payload?.gameType) return msg.payload;
  if (msg.gameType) return msg;
  return null;
}

async function fetchGameSnapshot(bot) {
  try {
    let snapUrl = null;
    if (bot.gameId === 'night-of-bloodlines') {
      snapUrl = `${BASE_URL}/api/v1/games/nob/rooms/${bot.targetRoomId}/snapshot`;
    } else if (bot.gameId === 'wheres-the-bone') {
      snapUrl = `${BASE_URL}/api/v1/games/wheres-the-bone/rooms/${bot.targetRoomId}/snapshot`;
    } else if (bot.gameId === 'liars-number') {
      snapUrl = `${BASE_URL}/api/v1/games/liars-number/rooms/${bot.targetRoomId}/snapshot`;
    } else {
      snapUrl = `${BASE_URL}/api/v1/games/not-in-my-pot/rooms/${bot.targetRoomId}/snapshot`;
    }
    const snapRes = await fetch(snapUrl, { headers: authHeaders(bot) });
    if (snapRes.ok) {
      return await snapRes.json();
    }
    return null;
  } catch {
    return null;
  }
}

function dispatchGameTurn(bot, view) {
  if (!view || view.finished || view.phase === 'GAME_OVER') return;
  const gameType = view.gameType || bot.gameId;
  if (view.you) bot.playerId = view.you;

  if (gameType === 'not-in-my-pot') {
    handleNotInMyPotTurn(bot, view);
  } else if (gameType === 'night-of-bloodlines') {
    handleNobTurn(bot, view);
  } else if (gameType === 'wheres-the-bone') {
    handleWheresTheBoneTurn(bot, view);
  } else if (gameType === 'liars-number') {
    handleLiarsNumberTurn(bot, view);
  }
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

/**
 * Xử lý lượt chơi của Bot trong Night of Bloodlines (Đêm Huyết Nguyệt)
 */
async function handleNobTurn(bot, view) {
  if (!view || view.finished || view.phase === 'GAME_OVER') return;

  const myPlayerId = bot.playerId || view.you;
  if (!myPlayerId) return;
  bot.playerId = myPlayerId;

  const pending = view.myPendingDecision;
  const pendingId = pending?.decisionId || 'none';
  const actionKey = `${view.roundNumber || 0}_${view.phase}_${view.phaseState || 'none'}_${pendingId}_${view.version || 0}`;

  if (bot.lastActionKey === actionKey || bot.isActing) {
    return;
  }

  // 1. Xử lý quyết định đang chờ (Pending Decision)
  if (pending) {
    bot.isActing = true;
    bot.lastActionKey = actionKey;
    await new Promise((r) => setTimeout(r, 400 + Math.floor(Math.random() * 500)));

    try {
      if (pending.type === 'CHOOSE_TARGET') {
        const allowed = pending.allowedTargetIds || [];
        const validTargets = allowed.filter(id => id !== myPlayerId);
        const targetId = validTargets[0] || allowed[0];
        if (targetId) {
          sendWsCommand(bot, {
            type: 'NOB_CHOOSE_TARGET',
            decisionId: pending.decisionId,
            targetPlayerId: targetId,
            targetPlayerIds: [targetId]
          });
          const targetPlayer = (view.players || []).find(p => p.playerId === targetId);
          console.log(`🎯 [${bot.name}] Chọn mục tiêu: [${targetPlayer?.displayName || targetId}]`);
        }
        return;
      }

      if (pending.type === 'HUNTER_DECISION') {
        const opts = pending.allowedOptions || [];
        const option = opts.includes('ELIMINATE') ? 'ELIMINATE' : opts[0];
        sendWsCommand(bot, {
          type: 'NOB_HUNTER_DECISION',
          decisionId: pending.decisionId,
          option: option
        });
        console.log(`🏹 [${bot.name}] Quyết định Thợ Săn: [${option}]`);
        return;
      }

      if (pending.type === 'REACTION') {
        const option = (pending.allowedOptions || [])[0] || 'SKIP';
        sendWsCommand(bot, {
          type: 'NOB_REACTION',
          decisionId: pending.decisionId,
          option: option
        });
        console.log(`🛡️ [${bot.name}] Phản ứng: [${option}]`);
        return;
      }

      if (pending.type === 'ECHO_CHOOSE') {
        const echoCard = (view.echoCards || [])[0];
        sendWsCommand(bot, {
          type: 'NOB_CHOOSE_OPTION',
          decisionId: pending.decisionId,
          option: 'PLAY_NOW',
          cardInstanceId: echoCard?.instanceId
        });
        console.log(`✨ [${bot.name}] Chọn Thẻ Vọng Âm`);
        return;
      }

      if (pending.type === 'CHOOSE_HIDDEN_CARD') {
        const hiddenId = (pending.allowedOptions || [])[0];
        sendWsCommand(bot, {
          type: 'NOB_CHOOSE_OPTION',
          decisionId: pending.decisionId,
          option: hiddenId,
          cardInstanceId: hiddenId
        });
        console.log(`🔮 [${bot.name}] Chọn Thẻ Ẩn`);
        return;
      }

      // Các quyết định chọn Option khác (MOON_MARK_PICK, CHOOSE_MOON_TOKEN, MOON_BROKER, etc.)
      const option = (pending.allowedOptions || [])[0];
      if (option) {
        sendWsCommand(bot, {
          type: 'NOB_CHOOSE_OPTION',
          decisionId: pending.decisionId,
          option: option
        });
        console.log(`⚡ [${bot.name}] Chọn tùy chọn: [${option}]`);
      }
    } catch (err) {
      console.error(`⚠️ [${bot.name}] Lỗi pending decision NOB:`, err.message);
    } finally {
      setTimeout(() => { bot.isActing = false; }, 350);
    }
    return;
  }

  // 2. Xử lý pha Draft bài (DRAFT_PICK_1, DRAFT_PICK_2)
  if (view.phase === 'DRAFT_PICK_1' || view.phase === 'DRAFT_PICK_2') {
    if ((view.submittedPlayerIds || []).includes(myPlayerId)) return;
    const cards = view.myDraftHand || [];
    if (cards.length === 0) return;

    bot.isActing = true;
    bot.lastActionKey = actionKey;
    await new Promise((r) => setTimeout(r, 400 + Math.floor(Math.random() * 500)));

    try {
      const pickCard = cards[0];
      sendWsCommand(bot, {
        type: 'NOB_DRAFT_PICK',
        cardInstanceId: pickCard.instanceId,
        cardCode: pickCard.cardCode
      });
      console.log(`🃏 [${bot.name}] Draft chọn thẻ [${pickCard.cardCode}]`);
    } catch (err) {
      console.error(`⚠️ [${bot.name}] Lỗi draft NOB:`, err.message);
    } finally {
      setTimeout(() => { bot.isActing = false; }, 350);
    }
    return;
  }

  // 3. Xử lý pha Ban đêm (SHADOW_STALKER, BLOOD_SEER, SHAPESHIFTER, FERAL_KILLER, HUNTER)
  const nightPhases = ['SHADOW_STALKER', 'BLOOD_SEER', 'SHAPESHIFTER', 'FERAL_KILLER', 'HUNTER'];
  if (nightPhases.includes(view.phase)) {
    if (view.phaseState === 'PHASE_INTRO' || view.phaseState === 'RESOLUTION_RESULT_DISPLAY') {
      return;
    }
    const you = (view.players || []).find(p => p.you || p.playerId === myPlayerId);
    if (you && you.alive === false) return;
    if ((view.submittedPlayerIds || []).includes(myPlayerId)) return;

    const roleCodePrefix = {
      SHADOW_STALKER: 'NOB-SS-',
      BLOOD_SEER: 'NOB-BS-',
      SHAPESHIFTER: 'NOB-SF-',
      FERAL_KILLER: 'NOB-FK-',
      HUNTER: 'NOB-HT-'
    }[view.phase];

    const matchingCard = (view.myHand || []).find(c =>
      c.roleType === view.phase || (c.cardCode && roleCodePrefix && c.cardCode.startsWith(roleCodePrefix))
    );

    if (matchingCard) {
      bot.isActing = true;
      bot.lastActionKey = actionKey;
      await new Promise((r) => setTimeout(r, 500 + Math.floor(Math.random() * 500)));

      try {
        sendWsCommand(bot, {
          type: 'NOB_PHASE_SUBMIT',
          cardInstanceId: matchingCard.instanceId,
          cardCode: matchingCard.cardCode
        });
        console.log(`🌙 [${bot.name}] [${view.phase}] Đánh thẻ: [${matchingCard.cardCode}]`);
      } catch (err) {
        console.error(`⚠️ [${bot.name}] Lỗi submit đêm NOB:`, err.message);
      } finally {
        setTimeout(() => { bot.isActing = false; }, 350);
      }
    }
  }
}

/**
 * Xử lý lượt chơi của Bot trong Where's The Bone (Chó Trộm Xương)
 */
async function handleWheresTheBoneTurn(bot, view) {
  if (!view || view.finished) return;
  const myPlayerId = bot.playerId || view.viewerPlayerId;
  if (!myPlayerId) return;

  const legal = view.legalActions || [];
  if (legal.length === 0) return;

  const actionKey = `${view.phase}_${view.currentHour || 0}_${view.version || 0}_${legal.join(',')}`;
  if (bot.lastActionKey === actionKey || bot.isActing) return;

  bot.isActing = true;
  bot.lastActionKey = actionKey;

  await new Promise((r) => setTimeout(r, 500 + Math.floor(Math.random() * 500)));

  try {
    if (legal.includes('SELECT_WAKE_TIME') && view.myDice?.length > 0) {
      const hour = view.myDice[0];
      sendWsCommand(bot, { type: 'SELECT_WAKE_TIME', hour });
      console.log(`⏰ [${bot.name}] Chọn giờ thức: ${hour}:00am`);
      return;
    }

    if (legal.includes('TAKE_BONE')) {
      sendWsCommand(bot, { type: 'TAKE_BONE' });
      console.log(`🦴 [${bot.name}] Lấy trộm xương!`);
      return;
    }

    if (legal.includes('SELECT_PACKMATE') && view.packmateCandidateIds?.length > 0) {
      const needed = view.requiredPackmateCount || 1;
      const candidates = view.packmateCandidateIds.slice(0, needed);
      sendWsCommand(bot, { type: 'SELECT_PACKMATE', targetPlayerIds: candidates });
      console.log(`🐾 [${bot.name}] Chọn đồng bọn`);
      return;
    }

    if (legal.includes('PEEK_WAKE_TIME')) {
      const candidates = (view.players || []).filter(p => !p.me && p.playerId !== myPlayerId);
      if (candidates.length > 0) {
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        sendWsCommand(bot, { type: 'PEEK_WAKE_TIME', targetPlayerId: target.playerId });
        console.log(`👁️ [${bot.name}] Xem dấu vết của [${target.displayName}]`);
        return;
      }
    }

    if (legal.includes('VOTE')) {
      const candidates = (view.players || []).filter(p => !p.me && p.playerId !== myPlayerId);
      if (candidates.length > 0) {
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        sendWsCommand(bot, { type: 'VOTE', targetPlayerId: target.playerId });
        console.log(`🗳️ [${bot.name}] Bỏ phiếu nghi ngờ [${target.displayName}]`);
        return;
      }
    }

    if (legal.includes('RESPOND_SKIP_DISCUSSION')) {
      sendWsCommand(bot, { type: 'RESPOND_SKIP_DISCUSSION', agree: true });
      return;
    }

    if (legal.includes('WAIT')) {
      sendWsCommand(bot, { type: 'WAIT' });
      console.log(`💤 [${bot.name}] Đợi qua giờ`);
      return;
    }
  } catch (err) {
    console.error(`⚠️ [${bot.name}] Lỗi Where's The Bone:`, err.message);
  } finally {
    setTimeout(() => {
      bot.isActing = false;
    }, 400);
  }
}

/**
 * ============================================================
 * GAME: Liar's Number (Ăn Gian Nói Dối)
 * ============================================================
 */
async function handleLiarsNumberTurn(bot, view) {
  if (!view || view.finished || view.phase === 'GAME_OVER') return;

  const myPlayerId = bot.playerId || view.you;
  if (!myPlayerId) return;
  bot.playerId = myPlayerId;

  const legalActions = Array.isArray(view.legalActions) ? view.legalActions : [];
  if (legalActions.length === 0) return;

  const actionKey = `liars_${view.roundNumber || 0}_${view.phase}_${view.stateVersion || 0}_${legalActions.join(',')}`;
  if (bot.lastActionKey === actionKey || bot.isActing) return;

  bot.isActing = true;
  bot.lastActionKey = actionKey;

  // Giả lập thời gian suy nghĩ (500ms - 1100ms)
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.floor(Math.random() * 600)));

  try {
    // 1. Pha SELECT_CARD: Chọn 1 lá bài trên tay
    if (view.phase === 'SELECT_CARD' && legalActions.includes('SELECT_CARD')) {
      const cards = (view.myHand || []).filter(c => c.cardId);
      if (cards.length > 0) {
        const chosen = cards[Math.floor(Math.random() * cards.length)];
        bot.lastSelectedCard = chosen;
        sendWsCommand(bot, {
          type: 'SELECT_CARD',
          cardId: chosen.cardId
        });
        console.log(`🃏 [${bot.name}] Liar's Number: Đánh lá bài [${chosen.label || chosen.typeId}]`);
      }
      return;
    }

    // 2. Pha SELECT_TARGET: Chọn người nhận bài úp
    if (view.phase === 'SELECT_TARGET' && legalActions.includes('SELECT_TARGET')) {
      const candidates = (view.availableTargetPlayerIds || []).filter(id => id !== myPlayerId);
      const fallbackTargets = (view.players || [])
        .filter(p => p.playerId !== myPlayerId && !p.you)
        .map(p => p.playerId);
      const pool = candidates.length > 0 ? candidates : fallbackTargets;
      const targetId = pool[Math.floor(Math.random() * pool.length)];
      if (targetId) {
        const targetPlayer = (view.players || []).find(p => p.playerId === targetId);
        sendWsCommand(bot, {
          type: 'SELECT_TARGET',
          targetPlayerId: targetId
        });
        console.log(`🎯 [${bot.name}] Liar's Number: Đưa bài úp cho [${targetPlayer?.displayName || targetId}]`);
      }
      return;
    }

    // 3. Pha DECLARE_TYPE: Tuyên bố số (1 - 8)
    if (view.phase === 'DECLARE_TYPE' && legalActions.includes('DECLARE_TYPE')) {
      let declared = 1 + Math.floor(Math.random() * 8);
      // 70% nói thật theo số của bài vừa chọn, 30% nói dối
      if (bot.lastSelectedCard?.typeId && Math.random() < 0.7) {
        declared = bot.lastSelectedCard.typeId;
      }
      sendWsCommand(bot, {
        type: 'DECLARE_TYPE',
        declaredType: declared
      });
      console.log(`🗣️ [${bot.name}] Liar's Number: Tuyên bố là số [${declared}]`);
      return;
    }

    // 4. Pha RECEIVER_DECISION: Người nhận đoán hoặc xem & chuyền
    if (view.phase === 'RECEIVER_DECISION') {
      const canPeek = legalActions.includes('PEEK_AND_PASS');
      const canGuess = legalActions.includes('GUESS');
      const roll = Math.random();

      if (canPeek && roll < 0.35) {
        sendWsCommand(bot, { type: 'PEEK_AND_PASS' });
        console.log(`👁️ [${bot.name}] Liar's Number: Xem bài rồi chuyền tiếp`);
        return;
      }

      if (canGuess) {
        const guess = roll < 0.65 ? 'FALSE' : 'TRUE';
        sendWsCommand(bot, {
          type: 'GUESS',
          guess: guess
        });
        console.log(`🤔 [${bot.name}] Liar's Number: Đoán [${guess === 'TRUE' ? 'NÓI THẬT' : 'NÓI DỐI'}]!`);
        return;
      }
    }

    // 5. Pha SELECT_PASS_TARGET: Chọn người chuyền tiếp sau khi xem bài
    if (view.phase === 'SELECT_PASS_TARGET' && legalActions.includes('SELECT_PASS_TARGET')) {
      const candidates = (view.availablePassTargetPlayerIds || []).filter(id => id !== myPlayerId);
      const targetId = candidates[Math.floor(Math.random() * candidates.length)];
      if (targetId) {
        const targetPlayer = (view.players || []).find(p => p.playerId === targetId);
        sendWsCommand(bot, {
          type: 'SELECT_PASS_TARGET',
          targetPlayerId: targetId
        });
        console.log(`🔄 [${bot.name}] Liar's Number: Chuyền tiếp cho [${targetPlayer?.displayName || targetId}]`);
      }
      return;
    }

    // 6. Pha PASS_DECLARE_TYPE: Tuyên bố lại số khi chuyền tiếp
    if (view.phase === 'PASS_DECLARE_TYPE' && legalActions.includes('PASS_DECLARE_TYPE')) {
      const declared = 1 + Math.floor(Math.random() * 8);
      sendWsCommand(bot, {
        type: 'PASS_DECLARE_TYPE',
        declaredType: declared
      });
      console.log(`🗣️ [${bot.name}] Liar's Number: Tuyên bố số mới [${declared}]`);
      return;
    }
  } catch (err) {
    bot.lastActionKey = null;
    console.error(`⚠️ [${bot.name}] Lỗi Liar's Number:`, err.message);
  } finally {
    setTimeout(() => {
      bot.isActing = false;
    }, 350);
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

    // 2. Lấy thông tin phòng để biết gameId
    try {
      const roomRes = await fetch(`${BASE_URL}/api/v1/rooms/${targetRoomId}`, {
        headers: authHeaders(bot)
      });
      if (roomRes.ok) {
        const roomData = await roomRes.json();
        bot.gameId = roomData.gameId;
      }
    } catch {
      // ignore
    }

    // 3. Tham gia phòng mục tiêu
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

    // 4. Bật Sẵn sàng (Ready)
    const readyRes = await fetch(`${BASE_URL}/api/v1/rooms/${targetRoomId}/ready`, {
      method: 'PUT',
      headers: {
        ...authHeaders(bot, true)
      },
      body: JSON.stringify({ ready: true })
    });
    if (readyRes.ok) {
      const readyRoom = await readyRes.json().catch(() => ({}));
      if (readyRoom.gameId) {
        bot.gameId = readyRoom.gameId;
      }
    }

    // 5. Kết nối WebSocket
    const ws = new WebSocket(WS_URL, ["boardverse", `bearer.${bot.accessToken}`]);

    bot.ws = ws;
    bot.targetRoomId = targetRoomId;
    bot.lastServerSequence = 0;

    ws.onopen = () => {
      console.log(`✅ [${name}] đã vào phòng ${targetRoomId} và SẴN SÀNG (READY)!`);
      // Thử snapshot ngay nếu ván đã bắt đầu
      setTimeout(async () => {
        const snapView = await fetchGameSnapshot(bot);
        if (snapView) {
          dispatchGameTurn(bot, snapView);
        }
      }, 500);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (typeof msg.serverSequence === 'number') {
          bot.lastServerSequence = msg.serverSequence;
        }
        if (msg.type === 'ACTION_REJECTED') {
          bot.lastActionKey = null;
          bot.isActing = false;
          console.warn(`⚠️ [${name}] Server từ chối action: ${msg.payload?.errorCode || 'UNKNOWN'}`);
        }
        if (msg.type === 'GAME_STARTED') {
          console.log(`🎮 [${name}] Trò chơi đã bắt đầu!`);
          setTimeout(async () => {
            const snapView = await fetchGameSnapshot(bot);
            if (snapView) {
              dispatchGameTurn(bot, snapView);
            }
          }, 600);
        }

        const view = extractViewFromMessage(msg);
        if (view) {
          dispatchGameTurn(bot, view);
        }
      } catch (err) {
        // ignore parse errors
      }
    };

    ws.onerror = (err) => {
      // ignore normal disconnect errors
    };

    // Kiểm tra định kỳ mỗi 2.5s phòng trường hợp mất gói tin WebSocket
    const poller = setInterval(async () => {
      if (!bot.ws || bot.ws.readyState !== 1) return;
      try {
        const snapView = await fetchGameSnapshot(bot);
        if (snapView) {
          dispatchGameTurn(bot, snapView);
        }
      } catch {
        // ignore
      }
    }, 2500);
    bot.poller = poller;

    return bot;
  } catch (err) {
    console.error(`❌ [${name}] Lỗi:`, err.message);
    return null;
  }
}

async function leaveBot(bot) {
  try {
    if (bot.poller) {
      clearInterval(bot.poller);
    }
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
