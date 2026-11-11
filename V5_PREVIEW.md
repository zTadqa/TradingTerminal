# V5 preview: 86 Drawing Tools & Native Pane

Bản chính giữ Lightweight Charts 4.2.2. Mở `/?engine=v5` để kích hoạt bản chính chủ **5.3.0** với **86 công cụ vẽ TradingView** (`lightweight-charts-drawing v0.9.0`), native cycle pane và dialog cài đặt chi tiết 4 tab. Không đổi framework, backend, nguồn giá hoặc `sync_controller.js`.

---

## 1. Tích hợp 86 Drawing Tools (`lightweight-charts-drawing v0.9.0`)

Khi mở `?engine=v5`, toàn bộ 86 công cụ vẽ được nạp trực tiếp vào chart series:

### Danh mục công cụ (chia nhóm chuẩn TradingView):
1. **Trend tools (17 tools)**:
   - Lines (9): `trend-line`, `ray`, `info-line`, `extended-line`, `trend-angle`, `horizontal-line`, `horizontal-ray`, `vertical-line`, `cross-line`
   - Channels (4): `parallel-channel`, `regression-trend`, `flat-top-bottom`, `disjoint-channel`
   - Pitchforks (4): `pitchfork`, `schiff-pitchfork`, `modified-schiff-pitchfork`, `inside-pitchfork`
2. **Gann and Fibonacci (15 tools)**:
   - Fibonacci (11): `fib-retracement`, `trend-based-fib-extension`, `fib-channel`, `fib-time-zone`, `fib-speed-resistance-fan`, `trend-based-fib-time`, `fib-circles`, `fib-spiral`, `fib-speed-resistance-arcs`, `fib-wedge`, `pitchfan`
   - Gann (4): `gann-box`, `gann-square-fixed`, `gann-square`, `gann-fan`
3. **Patterns (14 tools)**:
   - Chart patterns (6): `xabcd-pattern`, `cypher-pattern`, `head-and-shoulders`, `abcd-pattern`, `triangle-pattern`, `three-drives-pattern`
   - Elliott waves (5): `elliott-impulse`, `elliott-correction`, `elliott-triangle`, `elliott-double-combo`, `elliott-triple-combo`
   - Cycles (3): `cyclic-lines`, `time-cycles`, `sine-line`
4. **Forecasting and measurement tools (12 tools)**:
   - Forecasting (6): `long-position`, `short-position`, `position-forecast`, `bar-pattern`, `ghost-feed`, `sector`
   - Volume-based (3): `anchored-vwap`, `fixed-range-volume-profile`, `anchored-volume-profile`
   - Measurers (3): `price-range`, `date-range`, `date-and-price-range`
5. **Geometric shapes (16 tools)**:
   - Brushes (2): `brush`, `highlighter`
   - Arrows (4): `arrow-marker`, `arrow`, `arrow-mark-up`, `arrow-mark-down`
   - Shapes (10): `rectangle`, `rotated-rectangle`, `path`, `circle`, `ellipse`, `polyline`, `triangle`, `arc`, `curve`, `double-curve`
6. **Annotation tools (11 tools)**:
   - Text & notes (10): `text`, `note`, `price-note`, `pin`, `table`, `callout`, `comment`, `price-label`, `signpost`, `flag-mark`
   - Content (1): `image`
7. **Icons & Emojis**:
   - `font-icon`: Lưới 32 biểu tượng/emoji thông dụng trên thị trường tài chính

---

## 2. Giao diện người dùng (TradingView Parity)

- **Sidebar trái 86 Tool (`v5_drawing_toolbar.js`)**: Menu nhóm trực quan với mũi tên xổ ra flyout drawer. Bấm một công cụ sẽ kích hoạt chế độ vẽ ngay lập tức. Có phím tắt Esc để trở về con trỏ chuột.
- **Thanh nổi khi chọn hình (`v5_drawing_floatbar.js`)**: Nổi ngay cạnh hình đang chọn:
  - Đổi màu nét nhanh (Color picker)
  - Đổi độ dày nét (1px, 2px, 3px, 4px)
  - Đổi kiểu nét (Solid, Dashed, Dotted)
  - Khóa / Mở khóa hình
  - Nhân bản hình (Clone)
  - Thay đổi thứ tự lớp (Đưa lên trên / Đưa xuống dưới)
  - Nút bánh răng mở Settings Dialog
  - Xóa hình
- **Dialog cài đặt chi tiết 4 Tab (`v5_drawing_settings.js`)**:
  - **Tab Style**: Tự động hiển thị các thông số phù hợp theo từng loại hình:
    - Nét vẽ, màu, độ dày, kiểu nét
    - Mở rộng đường (Extend Left / Right)
    - Nền hình khối (Fill background, màu nền, thanh trượt độ trong suốt 0-100%)
    - Đường giữa cho Rectangle (Middle Line 50% với màu, kiểu nét riêng)
    - Bảng các mức Fibonacci (Coeff, màu sắc, bật/tắt từng mức)
    - Thông số vị thế Long/Short (Mức Target, Mức Stop Loss, màu sắc, quy mô tài khoản, tỉ lệ rủi ro %)
    - Các tùy chọn hiển thị thống kê (Price range, %, số thanh nến, thời gian)
  - **Tab Text**: Cho các công cụ chữ và chú thích (Nội dung, cỡ chữ 10-36px, In đậm, In nghiêng, màu chữ)
  - **Tab Coordinates**: Xem và sửa trực tiếp giá và mốc thời gian của từng điểm neo
  - **Tab Visibility**: Bật/tắt hiển thị theo khung thời gian (phút, giờ, ngày, tuần, tháng)
  - **Quản lý Template**: Nút Template góc trái dưới: Lưu template mới, Áp dụng template đã lưu, Xóa template, Lưu làm mặc định (Save as default), Khôi phục mặc định (Reset to default).

---

## 3. Bảo toàn dữ liệu & Chuyển đổi một chiều (Migration)

1. **Vùng lưu riêng**:
   - V5 lưu bản vẽ tại `terminal_v5_preview:drawings_v5_<chartId>_<symbol>`.
   - V4 gốc lưu tại `drawings_<chartId>_<symbol>`. Bản gốc **không bao giờ bị ghi đè**.
2. **Sao lưu tự động (Backup)**:
   - Khi mở v5 lần đầu, hệ thống đọc bản vẽ v4 cũ và tạo bản sao lưu tại `terminal_v5_preview:drawings_v4_backup_<chartId>_<symbol>`.
   - Bản sao lưu này được khóa, không bị ghi đè ở các lần mở tiếp theo.
3. **Chuyển đổi hình cũ sang mới (`v5_drawing_migrator.js`)**:
   - `box` → `rectangle` (giữ nguyên viền, nền, độ mờ, text, middle line).
   - `line` → `trend-line` (hoặc `vertical-line` nếu là đường dọc).
   - `hline` → `horizontal-line`.
   - `fib` → `fib-retracement`: Đảo ngược 2 điểm neo `[p2, p1]` do thư viện mới định nghĩa mức 0 tại điểm neo thứ hai, bảo toàn chính xác các mức giá Fib.
   - `position` → `long-position` / `short-position`: Tự động nhận diện Long hay Short dựa trên tương quan giá giữa entry và target, chuyển đổi stop/target thành các mức độ lệch giá `profitLevel` và `stopLevel`.
   - `measure` → `date-and-price-range`.
   - `text` → `text`.
4. **Indicator không bị ảnh hưởng**:
   - Các hình vẽ do indicator tạo ra (QT+, QS Stacks) tiếp tục được vẽ lên canvas overlay qua `DrawingModel.draw`, không bị lẫn vào dữ liệu bản vẽ người dùng.

---

## 4. Danh sách kiểm tra (Checklist)

- [x] Build thư viện `lightweight-charts-drawing` v0.9.0 thành bundle UMD đặt tại `frontend/vendor/`.
- [x] Tạo `v5_drawing_storage.js` quản lý lưu trữ độc lập dưới namespace `terminal_v5_preview:`.
- [x] Tạo `v5_drawing_migrator.js` chuyển đổi 6 loại hình cũ sang format mới 1 chiều, an toàn.
- [x] Tạo `v5_drawing_toolbar.js` hiển thị đầy đủ 86 công cụ chia theo nhóm chuẩn TradingView.
- [x] Tạo `v5_drawing_floatbar.js` thanh công cụ nổi nhanh khi chọn hình.
- [x] Tạo `v5_drawing_settings.js` bảng cài đặt chi tiết 4 tab (Style, Text, Coordinates, Visibility) kèm quản lý Template.
- [x] Tạo `v5_drawing_integration.js` điều phối 3 chart độc lập, undo/redo, phím tắt.
- [x] Thêm CSS `v5_drawing.css` giao diện chuẩn TradingView.
- [x] Viết bộ test `tests/v5_drawings_integration.test.cjs` kiểm tra toàn bộ logic migration, storage, template, toolbar.
- [x] Toàn bộ 38 bài test (cũ và mới) đều vượt qua 100%.
