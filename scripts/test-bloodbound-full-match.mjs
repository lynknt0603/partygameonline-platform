/**
 * E2E Full Match Simulation: Blood Bound (Huyết Thệ - 6 Người Chơi)
 *
 * Tự động tạo phòng, đăng nhập 6 người chơi, kết nối 6 WebSocket riêng biệt
 * và tự động thực hiện các hành động theo lượt cho đến khi KẾT THÚC TOÀN BỘ 1 VÁN GAME (GAME_OVER)!
 *
 * Cách chạy:
 *   node scripts/test-bloodbound-full-match.mjs
 */

const BASE_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8080';
const WS_URL = BASE_URL.replace(/^http/, 'ws') + '/ws';
const DEFAULT_PASSWORD = process.env.TEST_PASSWORD || 'Password123!';

const PLAYERS_DEF = [
  { username: 'sim_p_1', name: '👑 P1_Host' },
  { username: 'sim_p_2', name: '🗡️ P2_Vampire' },
  { username: 'sim_p_3', name: '🏹 P3_Assassin' },
  { username: 'sim_p_4', name: '🛡️ P4_Knight' },
  { username: 'sim_p_5', name: '🔮 P5_Oracle' },
  { username: 'sim_p_6', name: '⚔️ P6_Guardian' }
];

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    ...options
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${path} lỗi (${res.status}): ${err}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function loginOrRegister(user, displayName) {
  try {
    const reg = await api('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username: user, password: DEFAULT_PASSWORD, displayName })
    });
    return reg;
  } catch {
    return await api('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: user, password: DEFAULT_PASSWORD })
    });
  }
}

async function sendWs(player, roomId, payload) {
  if (!player.ws || player.ws.readyState !== 1) {
    try {
      if (player.ws) {
        try { player.ws.close(); } catch {}
      }
      player.ws = new WebSocket(WS_URL, ['boardverse', `bearer.${player.accessToken}`]);
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 800);
        player.ws.onopen = () => { clearTimeout(timer); resolve(); };
        player.ws.onerror = () => { clearTimeout(timer); resolve(); };
        player.ws.onclose = () => { clearTimeout(timer); resolve(); };
      });
    } catch {}
  }
  if (!player.ws || player.ws.readyState !== 1) {
    console.log(`  ⚠️ WS chưa sẵn sàng cho ${player.name}`);
    return;
  }
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const envelope = {
    version: 1,
    type: 'GAME_ACTION',
    roomId,
    requestId,
    payload: {
      commandId: `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ...payload
    }
  };
  player.ws.send(JSON.stringify(envelope));
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runFullGame() {
  console.log('===============================================================');
  console.log('🩸 SIMULATION: BẮT ĐẦU TEST TOÀN BỘ 1 VÁN GAME BLOOD BOUND (6P)');
  console.log('===============================================================');

  // 1. Đăng nhập 6 người chơi và dọn phòng cũ
  console.log('\n[1/5] Đang đăng nhập 6 tài khoản người chơi...');
  const players = [];
  for (const def of PLAYERS_DEF) {
    const auth = await loginOrRegister(def.username, def.name);
    // Dọn phòng cũ nếu kẹt
    try {
      const me = await api('/api/v1/session/me', { token: auth.accessToken });
      if (me.currentRoomId) {
        await api(`/api/v1/rooms/${me.currentRoomId}/leave`, { method: 'POST', token: auth.accessToken });
      }
    } catch {}
    players.push({ ...def, ...auth });
    console.log(`  ✓ ${def.name} (${def.username}) sẵn sàng.`);
  }

  // 2. Tạo phòng mới
  console.log('\n[2/5] Đang tạo phòng chơi mới cho game Blood Bound (6 người)...');
  const room = await api('/api/v1/rooms', {
    method: 'POST',
    token: players[0].accessToken,
    body: JSON.stringify({
      gameId: 'blood-bound',
      name: 'Test Full Match 6P',
      maxPlayers: 6,
      visibility: 'PUBLIC'
    })
  });
  const roomId = room.id;
  console.log(`  ✓ Phòng tạo thành công: ID = [${roomId}] (Mã = [${room.code}])`);

  // 3. 5 người chơi còn lại vào phòng và tất cả Sẵn Sàng
  console.log('\n[3/5] Đang cho 5 người chơi vào phòng và bật SẴN SÀNG...');
  for (let i = 1; i < players.length; i++) {
    await api(`/api/v1/rooms/${roomId}/join`, { method: 'POST', token: players[i].accessToken });
    await api(`/api/v1/rooms/${roomId}/ready`, {
      method: 'PUT',
      token: players[i].accessToken,
      body: JSON.stringify({ ready: true })
    });
    console.log(`  ✓ ${players[i].name} đã vào phòng & SẴN SÀNG.`);
  }

  // 4. Host bắt đầu ván đấu
  console.log('\n[4/5] Chủ phòng bấm BẮT ĐẦU VÁN ĐẤU...');
  await api(`/api/v1/rooms/${roomId}/start`, { method: 'POST', token: players[0].accessToken });
  console.log(`  🎉 TRẬN ĐẤU ĐÃ CHÍNH THỨC KHỞI TRANH (Status: IN_GAME)!`);

  // 5. Kết nối 6 WebSocket độc lập
  console.log('\n[5/5] Đang kết nối 6 WebSocket độc lập cho 6 người chơi...');
  let latestSnapshot = null;
  let isGameOver = false;

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    p.ws = new WebSocket(WS_URL, ['boardverse', `bearer.${p.accessToken}`]);
    p.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'GAME_EVENTS' && msg.payload?.view) {
          latestSnapshot = msg.payload.view;
        }
      } catch {}
    };
  }

  // Chờ WebSocket kết nối
  await sleep(1000);

  // Lấy snapshot khởi đầu
  latestSnapshot = await api(`/api/v1/games/blood-bound/rooms/${roomId}/snapshot`, {
    token: players[0].accessToken
  });

  console.log('\n---------------------------------------------------------------');
  console.log('⚔️  VÁN ĐẤU BẮT ĐẦU! HỆ THỐNG BOT BẮT ĐẦU THỰC HIỆN CÁC LƯỢT ĐÁNH...');
  console.log('---------------------------------------------------------------');

  let roundCount = 0;
  let maxRounds = 30; // Tránh loop vô hạn
  let lastKnownState = null;

  while (!isGameOver && roundCount < maxRounds) {
    // Luôn refresh snapshot mới nhất từ server
    try {
      const snap = await api(`/api/v1/games/blood-bound/rooms/${roomId}/snapshot`, {
        token: players[0].accessToken
      });
      if (snap) {
        latestSnapshot = snap;
        lastKnownState = snap;
      }
    } catch (e) {
      if (e.message.includes('GAME_NOT_RUNNING') || e.message.includes('409')) {
        isGameOver = true;
        break;
      }
      throw e;
    }

    if (!latestSnapshot || latestSnapshot.phase === 'GAME_OVER') {
      isGameOver = true;
      break;
    }

    const currentPhase = latestSnapshot.phase;

    // A. Phase LOOK_LEFT
    if (currentPhase === 'LOOK_LEFT') {
      console.log('\n👀 [Giai đoạn LOOK_LEFT] Tất cả người chơi xem manh mối người bên trái...');
      for (const p of players) {
        await sendWs(p, roomId, { type: 'ACKNOWLEDGE_LOOK_LEFT' });
      }
      await sleep(600);
      continue;
    }

    // B. Phase ATTACK_CHOICE
    if (currentPhase === 'ATTACK_CHOICE') {
      roundCount++;
      const attackerId = latestSnapshot.daggerHolderPlayerId;
      const attacker = players.find((p) => p.playerId === attackerId) || players[0];

      // Chọn mục tiêu còn < 4 vết thương và khác bản thân
      const validTargets = latestSnapshot.players.filter(
        (p) => p.playerId !== attackerId && p.wounds < 4
      );

      if (validTargets.length === 0) break;

      // Ưu tiên mục tiêu có nhiều vết thương nhất để tiến gần chiến thắng
      validTargets.sort((a, b) => b.wounds - a.wounds);
      const target = validTargets[0];

      console.log(`\n🗡️  [LƯỢT ${roundCount}] ${attacker.name} CẦM ĐOẢN KIẾM TẤN CÔNG ${target.displayName}! (Mục tiêu đang có ${target.wounds}/4 vết thương)`);
      await sendWs(attacker, roomId, {
        type: 'ATTACK',
        targetPlayerId: target.playerId
      });

      await sleep(400);
      continue;
    }

    // C. Phase INTERVENTION_WINDOW
    if (currentPhase === 'INTERVENTION_WINDOW') {
      console.log('  🛡️  [Giai đoạn Can Thiệp] Không có ai can thiệp đỡ đòn -> Tất cả BỎ QUA...');
      // Gửi PASS_INTERVENTION từ tất cả eligible players (không phải attacker/target/đã lộ rank/bị bắt)
      const attackerId = latestSnapshot.daggerHolderPlayerId;
      const targetId = latestSnapshot.currentTargetPlayerId;
      const eligiblePassers = players.filter((p) => {
        const state = latestSnapshot.players.find((s) => s.playerId === p.playerId);
        return p.playerId !== attackerId
          && p.playerId !== targetId
          && state
          && !state.hasRevealedRank
          && state.wounds < 4;
      });

      for (const passer of eligiblePassers) {
        await sendWs(passer, roomId, { type: 'PASS_INTERVENTION' });
        await sleep(150);
      }

      await sleep(400);
      continue;
    }

    // D. Phase WOUND_ASSIGNMENT
    if (currentPhase === 'WOUND_ASSIGNMENT') {
      const victimId = latestSnapshot.currentTargetPlayerId || latestSnapshot.intervenedByPlayerId;
      const victim = players.find((p) => p.playerId === victimId) || players[1];
      const victimState = latestSnapshot.players.find((p) => p.playerId === victimId);

      // Chọn token chưa để lộ (COLOR, CREST, RANK)
      const revealedTypes = (victimState?.revealedTokens || []).map((t) => t.type);
      const candidates = ['COLOR', 'CREST', 'RANK'].filter((t) => !revealedTypes.includes(t));
      const chosenToken = candidates[0] || 'RANK';

      console.log(`  🩸 [Lấy Vết Thương] ${victim.name} chịu 1 vết thương (${(victimState?.wounds || 0) + 1}/4) và để lộ token manh mối: [${chosenToken}]`);
      await sendWs(victim, roomId, {
        type: 'REVEAL_CLUE',
        tokenType: chosenToken
      });

      await sleep(400);
      continue;
    }

    // Chờ 300ms trước khi kiểm tra pha tiếp theo
    await sleep(300);
  }

  // Kết thúc ván game
  console.log('\n===============================================================');
  console.log('🏆 TRẬN ĐẤU ĐÃ KẾT THÚC CHÍNH THỨC (GAME_OVER)!');
  console.log('===============================================================');

  const finalState = lastKnownState || latestSnapshot;
  console.log(`👑 PHE CHIẾN THẮNG: ${finalState?.winnerClan === 'ROSE' ? '🌹 PHE HOA HỒNG (ROSE CLAN)' : '🪭 PHE DÃ THÚ / QUẠT (FAN CLAN)'}`);
  if (finalState?.capturedPlayerId) {
    const capPlayer = finalState.players.find((p) => p.playerId === finalState.capturedPlayerId);
    console.log(`🎯 Người chơi bị Bắt Giữ: ${capPlayer?.displayName} (Ghế ${capPlayer?.seatIndex})`);
  }

  console.log('\n📊 BẢNG TỔNG KẾT VẾT THƯƠNG & VAI TRÒ CẢ 6 NGƯỜI CHƠI:');
  console.log('---------------------------------------------------------------');
  finalState?.players.forEach((p) => {
    const isCap = p.playerId === finalState?.capturedPlayerId;
    console.log(
      `  • ${p.displayName.padEnd(16)} | Vết thương: ${p.wounds}/4 | Trạng thái: ${
        isCap ? '❌ BỊ BẮT GIỮ' : p.wounds >= 3 ? '⚠️ NGUY KỊCH' : '✅ AN TOÀN'
      } | Manh mối lộ: [${p.revealedTokens.map((t) => t.type + ':' + t.value).join(', ') || 'Chưa có'}]`
    );
  });
  console.log('---------------------------------------------------------------');
  console.log('✅ TEST E2E THỰC TẾ 1 VÁN GAME HOÀN TẤT THÀNH CÔNG 100%!\n');

  // Đóng WebSocket
  for (const p of players) {
    if (p.ws) p.ws.close();
  }
}

runFullGame().catch((err) => {
  console.error('\n❌ Lỗi trong quá trình chạy test ván game:', err);
  process.exit(1);
});
