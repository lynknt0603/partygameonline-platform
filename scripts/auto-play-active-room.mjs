/**
 * Auto-Play Active Room Script
 * Tự động mô phỏng các lượt chơi thực tế theo nhịp độ vừa phải (2 giây/lượt)
 * để người dùng có thể trực tiếp quan sát diễn biến trên 6 cửa sổ Chrome.
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8080';
const DEFAULT_PASSWORD = process.env.TEST_PASSWORD || 'Password123!';

const targetRoomId = process.argv[2] || 'KP99PWC3';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loginPlayer(username) {
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: DEFAULT_PASSWORD })
  });
  if (!res.ok) {
    throw new Error(`Đăng nhập ${username} thất bại: ${await res.text()}`);
  }
  return await res.json();
}

async function fetchSnapshot(token, roomId) {
  const res = await fetch(`${BACKEND_URL}/api/v1/games/blood-bound/rooms/${roomId}/snapshot`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error(`Lấy snapshot thất bại: ${res.status} - ${await res.text()}`);
  }
  return await res.json();
}

async function sendCommand(token, roomId, command) {
  const res = await fetch(`${BACKEND_URL}/api/v1/games/blood-bound/rooms/${roomId}/command`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(command)
  });
  if (!res.ok) {
    const text = await res.text();
    console.warn(`  ⚠️ Lệnh ${command.type} không thành công (${res.status}): ${text}`);
    return null;
  }
  return await res.json();
}

async function main() {
  console.log('======================================================================');
  console.log(`🎮 BOARDVERSE — TỰ ĐỘNG CHƠI THỰC TẾ TRÊN PHÒNG [${targetRoomId}]`);
  console.log('======================================================================\n');

  console.log('🔑 Đang đăng nhập 6 người chơi...');
  const players = [];
  for (let i = 1; i <= 6; i++) {
    const username = `sim_p_${i}`;
    const auth = await loginPlayer(username);
    players.push({
      index: i,
      username,
      playerId: auth.playerId,
      name: auth.displayName || `Player_${i}`,
      token: auth.accessToken
    });
    console.log(`  ✓ Đã kết nối: ${auth.displayName || username} (ID: ${auth.playerId})`);
  }

  const tokenByPlayerId = new Map();
  for (const p of players) {
    tokenByPlayerId.set(p.playerId, p.token);
  }

  const hostToken = players[0].token;
  let turnNumber = 0;
  let running = true;

  console.log('\n🚀 Bắt đầu vòng lặp tự động chơi trực tiếp trên UI (delay 2s/lượt)...\n');

  while (running) {
    let snapshot;
    try {
      snapshot = await fetchSnapshot(hostToken, targetRoomId);
    } catch (err) {
      console.error('Lỗi lấy snapshot:', err.message);
      break;
    }

    if (!snapshot) {
      console.log('Không nhận được snapshot, đợi 2s...');
      await sleep(2000);
      continue;
    }

    if (snapshot.phase === 'GAME_OVER') {
      console.log('\n======================================================================');
      console.log('🏆 TRẬN ĐẤU ĐÃ KẾT THÚC (GAME_OVER)!');
      console.log(`👑 PHE CHIẾN THẮNG: ${snapshot.winnerClan === 'ROSE' ? '🌹 HOA HỒNG (ROSE CLAN)' : '🪶 DẠ THÚ (FAN CLAN)'}`);
      if (snapshot.capturedPlayerId) {
        const cap = snapshot.players.find((p) => p.playerId === snapshot.capturedPlayerId);
        console.log(`🎯 Người chơi bị Bắt Giữ: ${cap?.displayName || snapshot.capturedPlayerId}`);
      }
      console.log('======================================================================');
      break;
    }

    // 1. Phase LOOK_LEFT
    if (snapshot.phase === 'LOOK_LEFT') {
      console.log('👀 [LOOK_LEFT] Đang đồng bộ xác nhận manh mối cho tất cả người chơi...');
      for (const p of players) {
        await sendCommand(p.token, targetRoomId, { type: 'LOOK_LEFT_ACK' });
        await sleep(300);
      }
      await sleep(1500);
      continue;
    }

    // 2. Phase ATTACK_CHOICE
    if (snapshot.phase === 'ATTACK_CHOICE') {
      turnNumber++;
      const attackerId = snapshot.daggerHolderPlayerId;
      const attacker = players.find((p) => p.playerId === attackerId) || players[0];
      const attackerToken = tokenByPlayerId.get(attackerId) || hostToken;

      // Chọn mục tiêu hợp lệ: khác người tấn công và chưa bị bắt giữ (wounds < 4)
      const validTargets = snapshot.players.filter(
        (p) => p.playerId !== attackerId && p.wounds < 4
      );

      if (validTargets.length === 0) {
        console.log('Không còn mục tiêu hợp lệ!');
        break;
      }

      // Chiến thuật: Ưu tiên tấn công mục tiêu đã chịu nhiều vết thương nhất để dồn sát thương
      validTargets.sort((a, b) => b.wounds - a.wounds);
      const target = validTargets[0];

      console.log(`🗡️  [LƯỢT ${turnNumber}] ${attacker.name} CẦM ĐOẢN KIẾM TẤN CÔNG ${target.displayName} (Hiện có ${target.wounds}/4 vết thương)...`);
      await sleep(2000); // Cho người dùng kịp quan sát giao diện

      await sendCommand(attackerToken, targetRoomId, {
        type: 'ATTACK',
        targetPlayerId: target.playerId
      });

      await sleep(1500);
      continue;
    }

    // 3. Phase INTERVENTION_WINDOW
    if (snapshot.phase === 'INTERVENTION_WINDOW') {
      const targetId = snapshot.currentTargetPlayerId;
      const target = snapshot.players.find((p) => p.playerId === targetId);
      console.log(`  🛡️  [CAN THIỆP] Mở cửa sổ 15s can thiệp cứu ${target?.displayName || 'mục tiêu'}...`);
      await sleep(2000); // Giữ cửa sổ 2s cho UI hiển thị nút can thiệp

      // Cho các người chơi đủ điều kiện gửi PASS_INTERVENTION
      const attackerId = snapshot.daggerHolderPlayerId;
      const eligiblePassers = players.filter((p) => {
        const state = snapshot.players.find((s) => s.playerId === p.playerId);
        return p.playerId !== attackerId
          && p.playerId !== targetId
          && state
          && !state.hasRevealedRank
          && state.wounds < 4;
      });

      console.log(`  🛡️  Không ai can thiệp -> Các người chơi lần lượt BỎ QUA...`);
      for (const passer of eligiblePassers) {
        await sendCommand(passer.token, targetRoomId, { type: 'PASS_INTERVENTION' });
        await sleep(300);
      }

      await sleep(1500);
      continue;
    }

    // 4. Phase WOUND_ASSIGNMENT
    if (snapshot.phase === 'WOUND_ASSIGNMENT') {
      const victimId = snapshot.intervenedByPlayerId || snapshot.currentTargetPlayerId;
      const victim = players.find((p) => p.playerId === victimId) || players[1];
      const victimToken = tokenByPlayerId.get(victimId) || hostToken;
      const victimState = snapshot.players.find((p) => p.playerId === victimId);

      const currentWounds = (victimState?.wounds || 0) + 1;
      const revealedTypes = (victimState?.revealedTokens || []).map((t) => t.type);

      // Ưu tiên lộ COLOR -> CREST -> RANK
      const order = ['COLOR', 'CREST', 'RANK'];
      const candidate = order.find((t) => !revealedTypes.includes(t)) || 'RANK';

      console.log(`  🩸 [NHẬN ĐÒN] ${victim.name} chịu 1 vết thương (${currentWounds}/4) -> Đang lật token manh mối [${candidate}]...`);
      await sleep(2000); // Để người xem thấy modal chọn token trên màn hình

      await sendCommand(victimToken, targetRoomId, {
        type: 'REVEAL_WOUND_TOKEN',
        tokenType: candidate
      });

      await sleep(2000);
      continue;
    }

    await sleep(1000);
  }

  console.log('\n✅ Quá trình tự động chơi đã hoàn thành!');
}

main().catch((err) => {
  console.error('Lỗi nghiêm trọng:', err);
  process.exit(1);
});
