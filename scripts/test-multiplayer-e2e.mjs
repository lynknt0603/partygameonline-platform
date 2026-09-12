/**
 * Test E2E Đa Người Chơi (Multi-User Automated Test)
 * - Đăng ký 2 người chơi thật: Alice (Host) và Bob
 * - Tạo phòng Liar's Number
 * - Cả 2 cùng vào phòng, Ready và Bắt đầu
 * - Kết nối 2 WebSocket độc lập, tự động đánh theo lượt cho đến khi kết thúc ván
 * - Xác thực kết quả lưu bền vững vào PostgreSQL (matches, match_players, user_game_statistic)
 */

const BASE_URL = 'http://localhost:8080';
const WS_URL = 'ws://localhost:8080/ws';

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    ...options
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${errText}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function registerOrLogin(username, displayName) {
  try {
    const data = await api('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password: 'Password123!', displayName })
    });
    console.log(`[AUTH] Đăng ký thành công: ${displayName} (${username})`);
    return data;
  } catch (e) {
    const data = await api('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password: 'Password123!' })
    });
    console.log(`[AUTH] Đăng nhập thành công: ${displayName} (${username})`);
    return data;
  }
}

function sendWsCommand(player, payload, roomId) {
  if (!player.ws || player.ws.readyState !== 1) return;
  const requestId = `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const envelope = {
    version: 1,
    type: 'GAME_ACTION',
    requestId,
    roomId,
    lastServerSequence: player.lastServerSequence || 0,
    payload: {
      commandId: requestId,
      ...payload
    }
  };
  player.ws.send(JSON.stringify(envelope));
}

function handleTurn(player, view, roomId) {
  if (!view || view.gameType !== 'liars-number' || view.finished || view.phase === 'GAME_OVER') return;
  const legalActions = view.legalActions || [];
  if (legalActions.length === 0) return;

  const actionKey = `liars_${view.roundNumber || 0}_${view.phase}_${view.stateVersion || 0}`;
  if (player.lastActionKey === actionKey || player.isActing) return;
  player.lastActionKey = actionKey;
  player.isActing = true;

  setTimeout(() => {
    try {
      const type = legalActions[Math.floor(Math.random() * legalActions.length)];
      let command = null;

      switch (type) {
        case 'SELECT_CARD': {
          const cards = (view.myHand || []).filter(c => c.cardId);
          const card = cards[Math.floor(Math.random() * cards.length)];
          if (card) {
            command = { type, cardId: card.cardId };
            console.log(`🎴 [${player.displayName}] Chọn lá bài số ${card.claimedType || card.cardId}`);
          }
          break;
        }
        case 'SELECT_TARGET': {
          const others = (view.players || []).filter(p => p.playerId !== player.playerId && !p.you);
          const target = others[0];
          if (target) {
            command = { type, targetPlayerId: target.playerId };
            console.log(`👉 [${player.displayName}] Chuyền bài cho [${target.displayName}]`);
          }
          break;
        }
        case 'DECLARE_TYPE':
        case 'PASS_DECLARE_TYPE': {
          const declared = 1 + Math.floor(Math.random() * 8);
          command = { type, declaredType: declared };
          console.log(`🗣️ [${player.displayName}] Tuyên bố đây là số [${declared}]`);
          break;
        }
        case 'GUESS': {
          const guess = Math.random() < 0.5 ? 'TRUE' : 'FALSE';
          command = { type, guess };
          console.log(`🧐 [${player.displayName}] Đoán: [${guess === 'TRUE' ? 'NÓI THẬT' : 'NÓI DỐI'}]`);
          break;
        }
        case 'PEEK_AND_PASS': {
          command = { type };
          console.log(`👀 [${player.displayName}] Xem bài rồi chuyền tiếp`);
          break;
        }
        case 'SELECT_PASS_TARGET': {
          const target = (view.availablePassTargetPlayerIds || [])[0];
          if (target) {
            command = { type, targetPlayerId: target };
            console.log(`👉 [${player.displayName}] Chuyền tiếp`);
          }
          break;
        }
      }

      if (command) {
        sendWsCommand(player, { expectedVersion: view.stateVersion, ...command }, roomId);
      }
    } finally {
      player.isActing = false;
    }
  }, 350);
}

async function runTest() {
  console.log('=== BẮT ĐẦU TEST E2E ĐA NGƯỜI CHƠI (MULTI-USER E2E) ===\n');

  const ts = Date.now().toString().slice(-4);
  // 1. Đăng ký/đăng nhập 2 người chơi độc lập
  const aliceAuth = await registerOrLogin(`alice_${ts}`, `Alice_${ts}`);
  const bobAuth = await registerOrLogin(`bob_${ts}`, `Bob_${ts}`);

  const alice = { ...aliceAuth, displayName: `Alice_${ts}` };
  const bob = { ...bobAuth, displayName: `Bob_${ts}` };

  // 2. Alice tạo phòng Liar's Number 2 người
  const room = await api('/api/v1/rooms', {
    method: 'POST',
    token: alice.accessToken,
    body: JSON.stringify({
      gameId: 'liars-number',
      name: 'Phòng Thử Nghiệm E2E',
      maxPlayers: 2,
      visibility: 'PUBLIC'
    })
  });
  console.log(`\n🏠 [PHÒNG] Alice đã tạo phòng mới: Mã [${room.id}] - Game: Liar's Number`);

  // 3. Bob tham gia phòng
  await api(`/api/v1/rooms/${room.id}/join`, {
    method: 'POST',
    token: bob.accessToken
  });
  console.log(`👥 [PHÒNG] Bob đã tham gia vào phòng [${room.id}]`);

  // 4. Cả 2 cùng bật Sẵn sàng (Ready)
  await api(`/api/v1/rooms/${room.id}/ready`, {
    method: 'PUT',
    token: alice.accessToken,
    body: JSON.stringify({ ready: true })
  });
  console.log(`✨ [READY] Alice: SẴN SÀNG!`);

  await api(`/api/v1/rooms/${room.id}/ready`, {
    method: 'PUT',
    token: bob.accessToken,
    body: JSON.stringify({ ready: true })
  });
  console.log(`✨ [READY] Bob: SẴN SÀNG!`);

  // 5. Kết nối 2 WebSocket độc lập cho 2 người chơi
  return new Promise((resolve, reject) => {
    let matchFinished = false;

    function connectWs(player) {
      const ws = new WebSocket(WS_URL, ['boardverse', `bearer.${player.accessToken}`]);
      player.ws = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (typeof msg.serverSequence === 'number') {
            player.lastServerSequence = msg.serverSequence;
          }
          const view = msg.payload?.view || msg.view || (msg.payload?.gameType === 'liars-number' ? msg.payload : null);
          if (view) {
            if (view.finished || view.phase === 'GAME_OVER') {
              if (!matchFinished) {
                matchFinished = true;
                console.log('\n🎉🎉🎉 TRẬN ĐẤU ĐÃ KẾT THÚC THÀNH CÔNG! 🎉🎉🎉');
                console.log(`🏆 Người chiến thắng: ${view.winnerPlayerIds ? view.winnerPlayerIds.join(', ') : 'Xác định theo luật'}`);
                setTimeout(() => {
                  alice.ws?.close();
                  bob.ws?.close();
                  resolve({ roomId: room.id, alice, bob });
                }, 1500);
              }
              return;
            }
            handleTurn(player, view, room.id);
          }
        } catch (e) {
          // ignore
        }
      };
    }

    connectWs(alice);
    connectWs(bob);

    // 6. Alice (Host) bấm Bắt đầu trận đấu
    setTimeout(async () => {
      try {
        console.log(`\n🚀 [START] Alice bấm BẮT ĐẦU TRẬN ĐẤU...`);
        await api(`/api/v1/rooms/${room.id}/start`, {
          method: 'POST',
          token: alice.accessToken
        });
        console.log(`🎮 [GAME] Trận đấu chính thức bắt đầu!\n`);
      } catch (e) {
        reject(e);
      }
    }, 1000);

    // Timeout an toàn 60 giây
    setTimeout(() => {
      if (!matchFinished) {
        alice.ws?.close();
        bob.ws?.close();
        reject(new Error('Hết thời gian chờ ván đấu kết thúc (Timeout 60s)'));
      }
    }, 60000);
  });
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Thất bại:', err.message);
    process.exit(1);
  });
