# Board Game Development Rules

These rules apply across the entire workspace for developing tabletop and party card games:

1. **Domain Isolation**:
   - Each game module belongs inside its own folder `apps/web/src/games/<gameId>/`.
   - Never import internal implementation details across different game modules (e.g., `bloodBound` must not import internals of `nob`).

2. **Pure Logic Separation**:
   - Logic in `model/<gameId>Rules.ts` must remain 100% pure TypeScript functions.
   - Do NOT import React hooks (`useState`, `useEffect`) or access the browser DOM in `model/`.

3. **Automated Unit Tests Mandatory**:
   - Every rule transition, victory condition, and command validation MUST be covered by Vitest in `model/<gameId>Rules.test.ts`.
   - Never proceed to UI implementation until all unit tests pass with zero failures.

4. **UI & Theme Tokens**:
   - Always use CSS Modules for page and component styles.
   - Use design tokens (`var(--brand)`, `var(--surface)`, `var(--bg)`, `var(--text)`, `var(--on-brand)`).
   - Never hardcode `#000000` or raw colors that break contrast in Daybreak or Midnight modes.
   - Touch targets must be at least 44px x 44px. Layout must support 360px width.

5. **Client Simulation Fallback**:
   - Every PlayPage must include self-contained mock/bot simulation state so that users and developers can playtest the game immediately without needing an active backend server.

6. **Production Security & Debug Guards**:
   - Debug utilities (God View secret identity badges, AI reasoning logs, auto-play takeover) must only be accessible when `canDebug = isDemo || import.meta.env.DEV`.
   - In production multiplayer rooms (`!isDemo`), client-side bot loops and God View must be completely disabled to prevent cheating and preserve fair play.

7. **Clan Visual Identity & Aesthetic Alignment**:
   - Khi thiết kế huy hiệu, thẻ bài và nhân vật cho từng phe (Clan / Faction), **tông màu chủ đạo của phe đó phải bao trùm toàn bộ** (ví dụ: Phe Quạt = Xanh lá Emerald/Jade -> trang phục, mắt, ngọc bội, vũ khí đều là xanh lá; Phe Hoa Hồng = Đỏ thẫm Crimson; Phe Phán Xét = Vàng kim). Tuyệt đối không để lẫn chi tiết màu sắc của phe đối lập (như tua rua đỏ trên quạt xanh).
   - **Phong cách nghệ thuật**: Nghiêm cấm vẽ nhân vật chibi hoạt hình dễ thương/má hồng cho các game mang tính chất kỳ bí, ma cà rồng, ma sói hay đấu trí u tối. Luôn tuân thủ phong cách **Dark Gothic Fantasy**, Vector huy hiệu hoặc Semi-realistic trang trọng, sắc sảo.

8. **Screen Space & Rich Information Density**:
   - Bàn chơi và giao diện không được để các khoảng trống đen mênh mông, cô lập. Cần tận dụng tối đa chiều rộng và chiều cao màn hình (responsive flex/grid, mở rộng kích thước bàn và thẻ người chơi từ 200px+).
   - Tích hợp thanh **Sidebar bên phải (320px - 360px)** với các tab: **Sổ tay hướng dẫn / Chỉ số**, **Nhật ký sự kiện game**, và **AI suy luận logic** để vừa lấp kín không gian vừa hỗ trợ đắc lực cho người chơi.

9. **Detailed Annotations & Explanatory Tooltips (Minh Bạch Chỉ Số)**:
   - Tuyệt đối không để các con số trừu tượng (như `0/4`) mà không có giải thích. Phải ghi rõ nghĩa cụ thể (ví dụ: `🩸 Vết thương: 0/4`, kèm thanh máu trực quan, giải thích rõ "chịu 4 vết thương sẽ bị Bắt Giữ", có nhãn cảnh báo `NGUY KỊCH`, `BỊ BẮT`).
   - Các token manh mối phải có nhãn tiếng Việt rõ nghĩa (`🔴 Màu: Đỏ 🌹`, `🟢 Màu: Xanh 🪭`, `🔢 Cấp X: [Tên vai trò]`, `⚜️ Huy Hiệu...`) kèm tooltip chi tiết.
   - Luôn có sẵn một tab **Sổ Tay / Cheatsheet** tóm lược luật chơi, điều kiện Thắng/Thua (bắt đúng Thủ lĩnh thì thắng, bắt nhầm người khác thì thua), quy tắc can thiệp đỡ đòn.

10. **Zero-Dependency Web Audio API Sound Effects**:
    - Mỗi board game phải trang bị hệ thống âm thanh SFX tổng hợp bằng **Web Audio API** (độ trễ 0ms, không phụ thuộc file mp3/wav tải từ mạng ngoài, không lo gãy link).
    - Cung cấp đầy đủ âm thanh cho các tương tác: Tấn công, Trúng đòn / Vết thương, Khiên đỡ, Can thiệp, Lật manh mối, Kỹ năng đặc biệt, Tới lượt, Chiến thắng hoàng gia, và Thất bại u tối.
    - Bố trí nút Bật/Tắt âm thanh trên Header và lưu trạng thái vào LocalStorage qua Zustand store.

