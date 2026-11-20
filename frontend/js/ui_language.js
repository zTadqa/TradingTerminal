/* Translate app labels while keeping setting values, market data, and scripts intact. */
const TerminalLanguage=(()=>{
  const key='terminal_ui_language_v1';
  const language=Workspace.read(key,'en')==='vi'?'vi':'en';
  const pairs=`Dismiss notification|\u0110\u00f3ng th\u00f4ng b\u00e1o
Test sound|Nghe th\u1eed
Theme|Ch\u1ee7 \u0111\u1ec1
Themes|Ch\u1ee7 \u0111\u1ec1
Choose an application theme. Chart and candle colors stay in Canvas settings.|Ch\u1ecdn giao di\u1ec7n \u1ee9ng d\u1ee5ng. M\u00e0u bi\u1ec3u \u0111\u1ed3 v\u00e0 m\u00e0u n\u1ebfn \u0111\u01b0\u1ee3c ch\u1ec9nh ri\u00eang trong m\u1ee5c Canvas.
Settings|Cài đặt
Language|Ngôn ngữ
Interface language|Ngôn ngữ giao diện
Click OK to save and reload in the selected language.|Bấm OK để lưu và tải lại bằng ngôn ngữ đã chọn.
Could not save the language preference.|Không lưu được ngôn ngữ giao diện.
Changes preview live on the chart|Xem trước thay đổi ngay trên biểu đồ
Close settings|Đóng cài đặt
Settings categories|Các mục cài đặt
Chart template|Mẫu biểu đồ
Template|Mẫu
Reset|Đặt lại
Cancel|Hủy
Ok|OK
Save as…|Lưu thành…
Apply defaults|Dùng mặc định
Symbol|Mã giao dịch
Status line|Dòng trạng thái
Scales and lines|Thang giá và đường kẻ
Canvas|Giao diện biểu đồ
Trading|Giao dịch
Alerts|Cảnh báo
Events|Sự kiện
Toolbars|Thanh công cụ
Toolbar scale|Kích thước thanh công cụ
Reduce motion|Giảm chuyển động
On|Bật
Off|Tắt
Chart toolbars|Thanh công cụ biểu đồ
Top left|Góc trên trái
Top right|Góc trên phải
Bottom left|Góc dưới trái
Bottom right|Góc dưới phải
Left drawing tools|Công cụ vẽ bên trái
Top left toolbar|Thanh công cụ trên trái
Top right toolbar|Thanh công cụ trên phải
Drawing toolbar|Thanh công cụ vẽ
Bottom left toolbar|Thanh công cụ dưới trái
Bottom right toolbar|Thanh công cụ dưới phải
Toolbar background (fixed)|Nền thanh công cụ (cố định)
Calendar transparency|Độ trong suốt lịch
Show song-change notification (2 seconds)|Thông báo đổi bài nhạc (2 giây)
Toolbars are pinned to the screen. Ctrl + , opens Settings. Chart and panel preferences save automatically.|Chỉnh kích thước thanh công cụ trực tiếp bên dưới (lưu tự động). Nhấn Ctrl + , để mở nhanh Cài đặt.
Toolbar background transparency|Độ trong suốt nền thanh công cụ
Ctrl + , opens Settings when the toolbars are hidden. Changes here save immediately.|Dùng Ctrl + , để mở Cài đặt khi thanh công cụ bị ẩn.
Candles|Nến
Color bars based on previous close|Tô màu nến theo giá đóng cửa trước
Body|Thân nến
Borders|Viền nến
Wick|Râu nến
Data modification|Điều chỉnh dữ liệu
Session|Phiên giao dịch
Electronic trading hours|Phiên giao dịch điện tử
Regular trading hours|Phiên chính
Electronic trading hours background|Nền ngoài phiên chính
Adjust for contract changes|Điều chỉnh khi đổi hợp đồng
Precision|Số chữ số thập phân
Default|Mặc định
Timezone|Múi giờ
Instrument|Sản phẩm
Title|Tiêu đề
Title display|Nội dung tiêu đề
Description|Mô tả
Symbol and description|Mã và mô tả
Open market status|Trạng thái mở cửa thị trường
Chart values|Giá trị trên biểu đồ
Bar change values|Thay đổi so với nến trước
Volume|Khối lượng
Last day change values|Thay đổi so với ngày trước
Buy/sell buttons|Nút mua và bán
Background|Nền
Opacity|Độ mờ
Custom color|Màu tùy chỉnh
Preset colors|Bảng màu
Hex color code|Mã màu HEX
Save swatch|Lưu màu
Hue|Sắc độ
Color area. Use left and right for saturation and up and down for brightness.|Vùng chọn màu. Dùng mũi tên trái phải để chỉnh độ bão hòa, lên xuống để chỉnh độ sáng.
Indicators|Chỉ báo
Titles|Tiêu đề chỉ báo
Inputs|Tham số đầu vào
Values|Giá trị
Price scale|Thang giá
Currency and Unit|Tiền tệ và đơn vị
Scale modes (A and L)|Chế độ thang giá (A và L)
Visible on mouse over|Hiện khi rê chuột
Always visible|Luôn hiện
Hidden|Ẩn
Lock price to bar ratio|Khóa tỷ lệ giá trên mỗi nến
Price units per bar|Đơn vị giá mỗi nến
Scales placement|Vị trí thang giá
Auto|Tự động
Right|Phải
Left|Trái
Price labels & lines|Nhãn và đường giá
No overlapping labels|Tránh chồng nhãn
Plus button|Nút dấu cộng
Countdown to bar close|Đếm ngược đóng nến
Name, value, line|Tên, giá trị và đường
Value and line|Giá trị và đường
Value|Giá trị
Line|Đường
Symbol value|Giá trị mã
Value according to scale|Giá trị theo thang giá
Raw price|Giá gốc
Previous day close|Giá đóng cửa ngày trước
Indicators and financials|Chỉ báo và dữ liệu tài chính
High and low|Cao nhất và thấp nhất
Bid and ask|Giá chào mua và chào bán
Time scale|Trục thời gian
Day of week on labels|Hiện thứ trong tuần
Date format|Định dạng ngày
Time hours format|Định dạng giờ
Save chart left edge position when changing interval|Giữ mép trái khi đổi khung
Allow extended zoom out|Cho phép thu nhỏ thêm
Chart basic styles|Kiểu biểu đồ
Solid|Màu đơn
Gradient|Chuyển màu
Bottom background|Màu nền phía dưới
Vertical grid lines|Đường lưới dọc
Horizontal grid lines|Đường lưới ngang
Pane separators|Đường phân cách các vùng
Crosshair|Con trỏ chữ thập
Watermark|Hình mờ
Drawing layer|Lớp công cụ vẽ
Under candles|Dưới nến (sắc nét)
Above candles|Trên nến (cũ)
Ticker|Mã
Name|Tên
Scales|Thang giá
Scale text size|Cỡ chữ trên trục
Scale text color|Màu chữ trên trục
Text|Chữ
Lines|Đường kẻ
Buttons|Nút
Navigation|Điều hướng
Pane|Vùng biểu đồ
Margins|Lề
Top|Trên
Bottom|Dưới
General|Chung
One-click trading|Giao dịch một lần bấm
Multiple exit levels|Nhiều mức thoát lệnh
Execution sound|Âm báo khớp lệnh
Execution volume|Âm lượng khớp lệnh
Execution tone|Kiểu âm báo khớp lệnh
Show only rejection notifications|Chỉ báo khi lệnh bị từ chối
Appearance|Hiển thị
Positions and orders|Vị thế và lệnh
Reverse position button|Nút đảo vị thế
Project order for market orders|Xem trước lệnh thị trường
Profit and loss value|Giá trị lãi lỗ
Positions|Vị thế
Position units|Đơn vị vị thế
Brackets|Lệnh SL/TP
Bracket units|Đơn vị SL/TP
Money|Tiền
Ticks|Bước giá
Percentage|Phần trăm
Execution marks|Dấu khớp lệnh
Execution labels|Nhãn khớp lệnh
Extended price lines across the entire chart width|Kéo đường giá hết chiều rộng biểu đồ
Order and position alignment|Căn lệnh và vị thế
Orders, executions, and positions in chart snapshots|Hiện lệnh, khớp lệnh và vị thế trong ảnh chụp
Chart line visibility|Hiển thị đường cảnh báo
Alert lines|Đường cảnh báo
Only active alerts|Chỉ cảnh báo đang hoạt động
Notifications|Thông báo
Automatically hide toasts|Tự ẩn thông báo
Ideas|Ý tưởng
Ideas filter|Lọc ý tưởng
All ideas|Tất cả ý tưởng
People I follow|Người tôi theo dõi
Session breaks|Ngắt phiên
Continuous contract switch|Chuyển hợp đồng liên tục
Contract switch breaks|Vạch chuyển hợp đồng
Latest news|Tin mới nhất
News notification|Thông báo tin tức
Symbol search|Tìm mã giao dịch
Search by symbol, name or exchange|Tìm theo mã, tên hoặc sàn
Enter symbol, name or exchange…|Nhập mã, tên hoặc sàn…
Futures|Hợp đồng tương lai
Currently viewed|Đang xem
No matching symbols.|Không tìm thấy mã phù hợp.
Navigate|Di chuyển
Select symbol|Chọn mã
Create price alert|Tạo cảnh báo giá
Edit price alert|Chỉnh cảnh báo giá
Create alert|Đặt Cảnh Báo
Save alert|Lưu cảnh báo
Delete alert|Xóa cảnh báo
Trading symbol:|Mã giao dịch:
Condition:|Điều kiện:
Target price:|Mức giá mục tiêu:
Crossing|Cắt qua mức giá
Above or equal|Lớn hơn hoặc bằng
Below or equal|Nhỏ hơn hoặc bằng
Reactivate triggered alert|Bật lại cảnh báo đã kích hoạt
Close|Đóng
Watchlist|Danh sách theo dõi
Watchlist panel|Theo dõi
Chart|Biểu đồ
Chart panels|Panel biểu đồ
Object tree|Cây đối tượng
Data window|Cửa sổ dữ liệu
Objects & data|Lớp & dữ liệu
Last price|Giá cuối
Waiting for price data|Đang chờ dữ liệu giá
Price source · TradingView|Nguồn giá · TradingView
No price alerts yet.|Chưa có cảnh báo giá.
+ Create alert|+ Tạo cảnh báo
Searching…|Đang tìm…
Loading…|Đang tải…
Connecting…|Đang kết nối…
Waiting for source…|Chờ nguồn…
Disconnected|Mất kết nối
Source error|Lỗi nguồn
Reload chart data|Tải lại dữ liệu biểu đồ
Reconnect chart data|Kết nối lại dữ liệu biểu đồ
Chart layout|Bố cục biểu đồ
Sync in layout|Đồng bộ trong bố cục
Interval|Khung thời gian
Date range|Khoảng ngày
Updates paused|Gián đoạn
Market closed|Nghỉ phiên
No data for this symbol and timeframe|Không có dữ liệu cho mã/khung này
Change symbol|Đổi mã
Command palette|Bảng lệnh
Layout|Bố cục
Replay|Phát lại
Alert|Cảnh báo giá
Paper Trading|Giao dịch mô phỏng
Trading|Giao dịch
Buy|Mua
Sell|Bán
Music|Nhạc
Calendar|Lịch
Economic Calendar|Lịch kinh tế
Load|Tải
File|Tệp
Open original link|Mở link gốc
Expand|Mở rộng
Hide video|Ẩn video
Show video|Hiện video
Drag popup|Kéo popup
Resize popup|Đổi kích thước popup
Close popup|Đóng popup
Nothing is playing|Chưa phát nhạc
Paste a link to load the official player.|Dán link để mở trình phát chính thức.
Paste a music link or choose an audio file.|Dán link nhạc hoặc chọn tệp âm thanh.
Paste YouTube, Spotify, SoundCloud or TikTok link|Dán link YouTube, Spotify, SoundCloud hoặc TikTok
Paste a TikTok post link. Sound pages need a post that uses the sound.|Dán link bài TikTok có dùng âm thanh này. Trang âm thanh riêng không phát được.
Search scripts…|Tìm script…
Search scripts|Tìm script
☆ Favorites|☆ Yêu thích
‹/› My scripts|‹/› Script của tôi
▤ On chart|▤ Trên biểu đồ
＋ New script|＋ Script mới
Archived scripts|Script đã lưu trữ
My scripts|Script của tôi
Untitled script|Script chưa đặt tên
Paste your Pine Script v6 here…|Dán Pine Script v6 vào đây…
Output|Kết quả
Save|Lưu
Run|Chạy
Save script|Lưu script
Add to chart|Thêm vào biểu đồ
Update on chart|Cập nhật trên biểu đồ
Draft…|Bản nháp…
Draft saved|Đã lưu bản nháp
Saved|Đã lưu
Stop|Dừng
Remove|Gỡ
No matching scripts|Không tìm thấy script
No indicators on this chart|Biểu đồ chưa có chỉ báo
Star a script in My scripts to keep it here.|Đánh dấu sao trong Script của tôi để ghim ở đây.
Your saved scripts appear here.|Script đã lưu sẽ hiện ở đây.
Ready. Paste a Pine v6 indicator to get started.|Dán chỉ báo Pine v6 để bắt đầu.
Your scripts. Your workspace.|Thư viện script của bạn.
Demo account|Tài khoản demo
Create demo account|Tạo tài khoản demo
Account name|Tên tài khoản
Create account|Tạo tài khoản
Target language|Ngôn ngữ áp dụng
Favourite drawing tools|Công cụ yêu thích
Drawing tools|Công cụ vẽ
Crosshair cursor (+)|Con trỏ Crosshair (+)
Trendline (Alt + T)|Kẻ Trendline (Alt + T)
Horizontal line|Đường ngang
Text annotation (Alt + N)|Ghi chú Text (Alt + N)
Today|Hôm nay
Tomorrow|Ngày mai
Close side panel|Đóng panel bên
Indicator settings|Cài đặt chỉ báo
Active indicator settings|Cài đặt chỉ báo đang dùng
Chart Properties & Colors|Thuộc tính và màu biểu đồ
Close symbol search|Đóng tìm mã
Back to My scripts|Quay lại Script của tôi
Expand editor|Mở rộng trình soạn thảo
Restore editor|Thu gọn trình soạn thảo
Language preference|Tùy chọn ngôn ngữ
Chart settings|Cài đặt biểu đồ
Switch theme|Đổi giao diện sáng tối
Settings shortcut|Cài đặt · Chart Settings
Bar replay mode|Bar Replay Mode
Order type|Loại lệnh
Contracts|Hợp đồng
Order price|Giá lệnh
Pending orders|Lệnh chờ
History|Lịch sử
Account|Tài khoản
Available|Khả dụng
Unrealized P&L|PnL mở
Realized P&L|PnL đã chốt
Open demo account|Tạo tài khoản demo
Waiting for live price|Chờ giá live
Favourite tools|Công cụ yêu thích
Keep drawing tools open|Ghim thanh công cụ vẽ
Keep chart panels open|Ghim thanh bên phải
Cursor|Con trỏ
Trend line|Đường xu hướng
Order Block / Range box|Hộp Order Block / Range
Note|Ghi chú
Long / Short position|Vị thế Long / Short
Long Position|Vị thế Long
Short Position|Vị thế Short
Measure price and bars|Đo giá và số nến
Brush|Cọ vẽ
Vertical Line|Đường dọc
Vertical line|Đường dọc
Text wrap|Xuống dòng tự động
Anchor|Ghim vị trí
Levels line|Đường mức
Use one color|Dùng một màu
Reverse|Đảo ngược
Prices|Giá
Values|Giá trị
Percents|Phần trăm
Labels|Nhãn
Font size|Cỡ chữ
Text orientation|Hướng chữ
Horizontal|Ngang
Vertical|Dọc
Show time|Hiện thời gian
Top|Trên
Middle|Giữa
Bottom|Dưới
Close drawing settings|Đóng cài đặt hình vẽ
Bar index follows loaded candles; point timestamp is saved.|Bar index theo nến đang tải; thời gian của điểm được lưu cố định.
Value out of range.|Thông số vượt giới hạn.
Invalid Fib levels.|Fib levels không hợp lệ.
Invalid coordinates.|Tọa độ không hợp lệ.
Invalid bar index.|Bar không hợp lệ.
minimum must be ≤ maximum.|minimum phải ≤ maximum.
Short Position|Vị thế Short
Long Position|Vị thế Long
Unlock drawing before deleting.|Mở khóa bản vẽ trước khi xóa.
Copied drawing|Đã sao chép đối tượng
No data for this symbol/timeframe|Không có dữ liệu cho mã/khung này
No commands found|Không tìm thấy lệnh
Toggle light / dark theme|Đổi giao diện sáng tối
Watchlist|Theo dõi
Calendar|Lịch
Music|Nhạc
QT Mode · Toggle|QT Mode · Bật / Tắt
QT Mode · Settings (Quantaibay)|QT Mode · Cài đặt (Quantaibay)
source error|lỗi nguồn
cached data|dữ liệu đã lưu
waiting for source|chờ nguồn
Session closed|Nghỉ phiên
Favourite tools|Công cụ yêu thích
Music link|Link nhạc
Playback position|Vị trí phát
Play|Phát
Pause|Tạm dừng
Previous track|Bài trước
Next track|Bài tiếp
Archive|Lưu trữ
Restore|Khôi phục
Added|Đã thêm
Enter a valid price|Nhập giá hợp lệ
Price alert saved|Đã lưu cảnh báo giá
Create price alert button|Tạo cảnh báo
Enable sound in the TikTok player if it is muted.|Bật tiếng trong trình phát TikTok nếu đang bị tắt tiếng.
Tap Play in the TikTok player to start playback.|Bấm Phát trong trình phát TikTok để bắt đầu.
Press Play in Music to start TikTok audio.|Bấm Phát trong Music để nghe TikTok.
If the original post plays, you can share its tab audio here.|Nếu bài gốc phát được, bạn có thể chia sẻ âm thanh tab tại đây.
Mute|Tắt tiếng
Unmute|Bật tiếng
TikTok could not find this post. Check its link and visibility.|TikTok không tìm thấy bài này. Kiểm tra link và quyền xem.
Requesting a fresh TikTok player…|Đang yêu cầu trình phát TikTok mới…
TikTok could not play this post in the embedded player.|TikTok không phát được bài này trong khung nhúng.
Open the original post, or pick an audio file or an MP4 saved with TikTok’s Save video option.|Mở bài gốc, hoặc chọn tệp âm thanh hay MP4 đã lưu bằng nút Lưu video của TikTok.
Play saved video or audio|Nghe từ video hoặc tệp nhạc đã lưu
Try Play in the video. You can also play a saved MP4 or audio file here.|Thử bấm Phát trên video. Bạn cũng có thể nghe MP4 hoặc tệp âm thanh đã lưu ngay tại đây.
Press Play to start the local file.|Bấm Phát để nghe tệp đã chọn.
Open TikTok source tab|Mở tab nguồn TikTok
Listen to TikTok tab audio|Nghe âm thanh từ tab TikTok
Open Terminal in Chrome or Edge to share tab audio.|Mở Terminal bằng Chrome hoặc Edge để chia sẻ âm thanh từ tab.
Select the TikTok tab that is playing and enable Share tab audio.|Chọn tab TikTok đang phát và bật chia sẻ âm thanh của tab.
Tab audio was not shared. Open and play TikTok, then try again.|Chưa chia sẻ được tiếng. Mở và phát bài trên TikTok rồi thử lại.
Choose a browser tab and enable Share tab audio. Window or screen sharing cannot be used here.|Chọn một tab trình duyệt và bật chia sẻ âm thanh của tab.
Stop tab audio|Dừng chia sẻ âm thanh
TikTok tab audio|Âm thanh từ tab TikTok
Live audio|Âm thanh trực tiếp
Listening to the selected tab. Play or pause the video there, or use Play in Music to mute or resume it here.|Đang nghe tab đã chọn. Dùng nút Phát trong Music để tạm dừng hoặc nghe tiếp tại đây.
Press Play in Music to listen to the shared tab.|Bấm Phát trong Music để nghe tab đã chia sẻ.
Tab audio stopped.|Đã dừng chia sẻ âm thanh.
High|Cao
Medium|Vừa
Low|Thấp
Vietnamese|Tiếng Việt
Account|Tài khoản
New account|Tạo tài khoản mới
No simulation account yet|Chưa có tài khoản mô phỏng
Create demo account|Tạo tài khoản demo
Order type|Loại lệnh
Decrease quantity|Giảm hợp đồng
Increase quantity|Tăng hợp đồng
Contracts|Hợp đồng
contracts|hợp đồng
Enter order price|Nhập mức giá
Optional|Tùy chọn
Save replay|Lưu Replay
Demo account|Tài khoản mô phỏng
Select account|Chọn tài khoản
Skip confirmation|Bỏ qua xác nhận
Save changes|Lưu thay đổi
Cancel|Hủy
Confirm order|Xác nhận lệnh
Close order confirmation|Đóng xác nhận lệnh
Reference price|Giá tham chiếu
Order price|Giá đặt lệnh
Quantity|Khối lượng
Confirm buy|Xác nhận mua
Confirm sell|Xác nhận bán
Buy|Mua
Sell|Bán
buy|mua
sell|bán
Confirm|Xác nhận
Drag to move|Kéo để di chuyển
Move order confirmation|Di chuyển hộp xác nhận lệnh
Replay is not ready for trading.|Replay chưa sẵn sàng để giao dịch.
The selected chart is Live and outside Replay.|Biểu đồ đang chọn ở chế độ Live, ngoài phạm vi Replay.
This chart is outside Replay.|Chart này không nằm trong phạm vi Replay.
Waiting for a fresh live 1m quote; cached prices cannot fill orders.|Đang chờ giá live 1m; không dùng giá cache để khớp lệnh.
The account has changed.|Tài khoản đã đổi.
Pending order no longer exists.|Lệnh chờ không còn tồn tại.
Create or select a demo account first.|Tạo/chọn tài khoản demo trước.
The account or chart has changed.|Tài khoản hoặc chart đã đổi.
The account or chart changed; price change discarded.|Tài khoản hoặc chart đã đổi; bỏ thay đổi giá.
Position no longer exists.|Vị thế không còn tồn tại.
Edit order|Sửa lệnh
Outside Replay|Ngoài Replay
Waiting for Replay bars|Chờ nến Replay
Waiting for live price|Chờ giá live
Notional|Giá trị
Enter a new Stop Loss or Take Profit level.|Nhập mức Stop Loss hoặc Take Profit mới.
Choose quantity and price to calculate risk.|Chọn khối lượng & mức giá để tính rủi ro.
Fills at Replay 1m closes · Separate account|Khớp theo giá đóng nến 1m Replay · Tài khoản độc lập
Fills at observed Last · No fees or slippage|Khớp theo giá Last trực tiếp · Không tính phí & trượt giá
Close at Replay price|Đóng theo giá Replay
Close at live price|Đóng theo giá live
No accounts yet|Chưa có tài khoản
Unrealized P&L|PnL mở
Realized|Đã chốt
No open positions|Không có vị thế đang mở
No pending orders|Không có lệnh chờ khớp
No trading history yet|Chưa có lịch sử giao dịch
Time|Thời gian
Symbol|Mã
Status|Trạng thái
Side|Chiều
Qty|HĐ
Price|Giá
P&L / Reason|PnL / Lý do
Entry price|Giá vào
Type|Loại
Place order|Đặt lệnh
Filled|Đã khớp
Closed|Đã đóng
Canceled|Đã hủy
Edit SL/TP|Sửa SL/TP
Rejected|Từ chối
Reverse|Đảo chiều
Manual close|Đóng tay
Edit|Sửa
Close|Đóng
Showing the latest 200 trades · Use CSV to download all.|Hiển thị 200 giao dịch gần nhất · Nhấn CSV để tải toàn bộ.
Close simulated position|Đóng vị thế mô phỏng
Quantity|Số lượng
Drag to amend|Kéo để sửa
Delete|Xóa
Drag up/down to set TP/SL · Click to edit position|Kéo lên/xuống để đặt TP/SL · Bấm để sửa vị thế
Close position now (1-tap)|Đóng vị thế ngay (1-click)
Close position|Đóng vị thế
Reverse position|Đảo chiều vị thế
Drag to amend pending order price|Kéo để sửa giá lệnh chờ
Cancel pending order|Hủy lệnh chờ
Account could not be saved. No changes were applied.|Không lưu được tài khoản. Thao tác chưa được áp dụng.
Invalid name or balance.|Tên hoặc balance không hợp lệ.
Account does not exist.|Tài khoản không tồn tại.
No fresh live price is available for simulated fills.|Không có giá live mới để mô phỏng khớp lệnh.
 is invalid.| không hợp lệ.
 must follow tick size | phải theo bước giá 
SL/TP is on the wrong side of the reference price.|SL/TP nằm sai phía giá tham chiếu.
Invalid order.|Lệnh không hợp lệ.
Contract specifications are not available from TradingView.|Chưa có thông số hợp đồng từ TradingView.
Order price|Giá lệnh
Buy Stop must be above the current price; Sell Stop must be below.|Buy Stop phải cao hơn giá hiện tại; Sell Stop phải thấp hơn.
Saved account data is invalid; check it before trading.|Thông số tài khoản đã lưu không hợp lệ; giữ dữ liệu và kiểm tra trước khi giao dịch.
Invalid close quantity.|Số lượng đóng không hợp lệ.
No events today match the selected filters.|Hôm nay không có tin phù hợp với bộ lọc.
Today's calendar could not be loaded.|Chưa tải được lịch tin hôm nay.
Next-session note:|Lưu ý phiên kế tiếp:
Before news|Trước tin
After news|Sau tin
NFP week|Tuần NFP
NY session|Phiên NY
08:30 ET event|Tin 08:30 ET
New York morning PMI|Tin PMI phiên sáng NY
NFP release week|Tuần công bố NFP
CPI release day|Ngày công bố CPI
Business day before CPI|Ngày làm việc trước CPI
PPI release day|Ngày công bố PPI
Business day before FOMC|Ngày làm việc trước FOMC
Business day after FOMC|Ngày làm việc sau FOMC
FOMC day|Ngày FOMC
Fed Chair speech day|Ngày Fed Chair phát biểu
Business day before the speech|Ngày làm việc trước phát biểu
Previous track|Bài trước
Rewind 10 seconds|Lùi 10 giây
Play / Pause|Phát / Tạm dừng
Forward 10 seconds|Tua nhanh 10 giây
Next track|Bài tiếp
Expand player|Mở rộng trình phát
Minimize player to floating window|Thu nhỏ trình phát thành cửa sổ nổi
Shortened link|Link rút gọn
Open the preview through localhost to resolve shortened links, or paste the full original URL.|Mở bản preview qua localhost để tải link rút gọn, hoặc mở link gốc rồi dán URL đầy đủ.
Use Play in the player or open the original link.|Dùng nút Play trong trình phát hoặc mở link gốc.
Open Trading Terminal through localhost to play YouTube in the app.|Mở Trading Terminal qua localhost để phát YouTube trong ứng dụng.
YouTube Mix (RD...) cannot be embedded as a playlist; playing this video.|YouTube Mix (RD...) không hỗ trợ nhúng playlist; đang phát video này.
YouTube could not identify the embedding page. Open the original link or use localhost.|YouTube không nhận được trang nhúng. Hãy mở link gốc hoặc dùng bản localhost.
This video cannot play in the embedded player. Open the original link.|Video này không phát được trong trình phát nhúng. Hãy mở link gốc.
Metadata expired; playback status is controlled by the player.|Metadata quá hạn; trạng thái phát do player quyết định.
Watchlist|Theo dõi
Price alerts|Cảnh báo giá
Watchlist|Danh sách theo dõi
WTI crude oil|Dầu WTI
Last price|Giá cuối
Price source · TradingView|Nguồn giá · TradingView
Waiting for price data|Đang chờ dữ liệu giá
Click to use the current market price|Bấm để điền giá thị trường hiện tại
Open detailed alert dialog (Alt + A)|Mở hộp thoại chi tiết (Alt + A)
Crossing|Cắt qua
Above|Vượt lên
Below|Giảm xuống
Enter alert price…|Nhập mức giá cảnh báo…
+ Add alert|+ Đặt báo
Current|Hiện tại
Clear all triggered alerts|Xóa toàn bộ cảnh báo đã khớp
Clear triggered|Dọn đã khớp
Click to edit alert|Bấm để chỉnh sửa cảnh báo
Triggered|Đã khớp
Watching|Đang canh
Rearm this alert|Bật canh lại cảnh báo này
Delete alert|Xóa cảnh báo
No alerts in this view|Không có cảnh báo ở mục này
No price alerts yet|Chưa có cảnh báo giá
Current price|Giá hiện tại
Save alert|Lưu cảnh báo
Set alert|Đặt Cảnh Báo
Edit price alert|Chỉnh cảnh báo giá
Create price alert|Tạo cảnh báo giá
Alert changed; drag discarded.|Alert đã đổi; bỏ thao tác kéo.
Enter a valid price|Nhập giá hợp lệ
The alert was deleted.|Alert đã bị xóa.
Price alert saved|Đã lưu cảnh báo giá
Price alert rearmed|Đã bật lại cảnh báo giá
Switch to dark|Chuyển sang tối
Switch to light|Chuyển sang sáng
No copied object yet.|Chưa có đối tượng đã sao chép.
Paper Trading is not ready.|Paper Trading chưa sẵn sàng.
Drawings are locked!|Bản vẽ đang bị khóa!
Load an indicator before opening settings.|Nạp indicator trước khi mở setting.
This script has no inputs. Open the editor to change the code.|Script này không khai báo inputs. Mở editor để sửa mã.
Not supported yet|Chưa hỗ trợ
No indicator yet|Chưa có indicator
Loading script…|Đang nạp script…
Waiting for data|Đang chờ dữ liệu
Indicator worker failed|Indicator worker bị lỗi
Loaded · Waiting for/calculating data…|Đã nạp · Đang chờ/tính dữ liệu…
Enter a template name.|Nhập tên template.
Template name must be 64 characters or fewer.|Tên template tối đa 64 ký tự.
Invalid template name.|Tên template không hợp lệ.
Chart template could not be saved.|Không lưu được chart template.
Drawing template could not be saved.|Không lưu được drawing template.
No saved templates yet|Chưa có template đã lưu
Invalid price or tick.|Giá hoặc tick không hợp lệ.
Drag to change price · Click to edit alert|Kéo để đổi giá · Bấm để chỉnh alert
Replay account could not be saved.|Không lưu được tài khoản Replay.
Invalid Replay clock.|Đồng hồ Replay không hợp lệ.
QT settings groups|Nhóm cài đặt QT
Search results|Kết quả tìm kiếm
No matching settings found.|Không tìm thấy cài đặt phù hợp.
Double-click to edit Cycle Table settings|Double-click để chỉnh cài đặt Cycle Table
QT Mode (Quantaibay Auto) — Click to toggle|QT Mode (Quantaibay Auto) — Bấm để Bật / Tắt
Connecting to TradingView|Đang kết nối TradingView
Backend is unavailable|Không kết nối được backend
Old backend on this port; run start_terminal.bat again.|Backend cũ ở cổng này; chạy lại start_terminal.bat.
Old backend; restart the server with start_terminal.bat.|Backend cũ; khởi động lại server từ start_terminal.bat.
Restart TradingView Desktop and reload all source data?|Tắt và bật lại TradingView Desktop để tải lại dữ liệu từ đầu?
Confirm data reload|Xác nhận tải lại dữ liệu
Reload|Tải lại
Restarting TradingView Desktop…|Đang tắt và mở lại TradingView Desktop…
Cursor|Con trỏ
Trend line|Đường xu hướng
Horizontal line|Đường ngang
Vertical line|Đường dọc
Order Block / Range box|Hộp Order Block / Range
Note|Ghi chú
Long position|Vị thế Long
Short position|Vị thế Short
Measure price and bars|Đo giá và số nến
Brush|Cọ vẽ
pinned|đã ghim
Error:|Lỗi:
Resize freely from the top-left corner|Kéo góc trên-trái để phóng to / thu nhỏ tự do
Resize freely from the top-right corner|Kéo góc trên-phải để phóng to / thu nhỏ tự do
Resize freely from the bottom-left corner|Kéo góc dưới-trái để phóng to / thu nhỏ tự do
Resize freely from the bottom-right corner|Kéo góc dưới-phải để phóng to / thu nhỏ tự do
Drag the top edge to resize height|Kéo cạnh trên để chỉnh chiều cao
Drag the bottom edge to resize height|Kéo cạnh dưới để chỉnh chiều cao
Drag the left edge to resize width|Kéo cạnh trái để chỉnh chiều rộng
Drag the right edge to resize width|Kéo cạnh phải để chỉnh chiều rộng
Observed Last from source, not bid/ask|Giá last từ nguồn, không phải bid/ask
Click to search / Change symbol (NQ1!, ES1!, YM1!, CL1!)|Click để tìm kiếm / Đổi mã (NQ1!, ES1!, YM1!, CL1!)
Reload chart data from the beginning|Bấm để tải lại dữ liệu biểu đồ từ đầu
Change timezone|Đổi múi giờ
Draw Order Block / Range Box (Alt + B)|Vẽ Box Order Block / Range (Alt + B)
Measure price range and bars (Shift + Click)|Thước đo khoảng giá & số nến (Shift + Click)
Lock drawings|Khóa bản vẽ
Show/hide drawings|Ẩn/hiện bản vẽ
Delete all drawings (Delete key)|Xóa toàn bộ hình vẽ (Phím Delete)
Simulated fills use observed Last prices; this is not a live broker.|Giá khớp mô phỏng dùng giá last quan sát được; không phải broker thật.
AUTO uses each chart's symbol (NQ/ES/YM) and the other two as SSMT peers. Select a specific symbol to match the original Pine setup.|AUTO tự lấy mã của từng chart (NQ/ES/YM) và gán 2 mã còn lại làm peer SSMT. Chọn mã cụ thể nếu muốn cố định như Pine gốc.
Asset 2 (SSMT with AUTO off)|Asset 2 (SSMT khi tắt AUTO)
Asset 3 (SSMT with AUTO off)|Asset 3 (SSMT khi tắt AUTO)
Micro 22m30s quarters cross bars :22/:52/:07/:37. Mid/Close uses the bar midpoint/close (time + 30s) to align M1 Q2/Q4 boundaries and avoid a one-bar shift.|Chu kỳ Micro 22m30s cắt giữa nến :22/:52/:07/:37. Mid/Close dùng tâm/đóng nến (time + 30s) khớp vạch Q2/Q4 trên M1, sửa lỗi lệch 1 nến do chỉ lấy time mở nến.
v5 · preview|v5 · vùng thử
Open Rectangle/Fib/Position preview|Mở trang thử Rectangle/Fib/Position
TradingView currently blocks custom 12h intervals; other charts continue updating.|Nguồn TradingView hiện chặn custom interval 12h; các chart khác vẫn cập nhật.
symbols|mã
Native data timeframe is unavailable|Khung dữ liệu không hỗ trợ native
Run start_terminal.bat to open http://localhost:3000|Hãy chạy start_terminal.bat để mở qua http://localhost:3000
index.html is opened directly (file://). Run start_terminal.bat to open http://localhost:3000.|Đang mở trực tiếp file index.html (file://). Hãy chạy start_terminal.bat để mở http://localhost:3000.
↗ Above ≥|↗ Vượt ≥
Pine Editor requires Pine Script v6 (or a JS QT module): add //@version=6 at the beginning.|Pine Editor chỉ nhận Pine Script v6 (hoặc JS QT module): thêm //@version=6 ở đầu file.
The script requires indicator(). Strategies and libraries cannot be added to this chart.|Script cần declaration indicator(). Strategy và library không thể thêm vào chart này.
Paste indicator code before saving.|Dán code indicator trước khi lưu.
The browser blocks Web Workers on this protocol (|Trình duyệt chặn Web Worker trên giao thức hiện tại (
). Open http://localhost:3000.|). Hãy mở qua http://localhost:3000.
Loaded · Waiting for/calculating data…|Đã nạp · đang chờ/tính dữ liệu…
Indicator exceeds 30 series / 2000 drawings.|Indicator vượt giới hạn 30 series / 2000 hình.
Indicator exceeds 300,000 plot points.|Indicator vượt giới hạn 300.000 plot points.
Unsupported series or invalid data.|Series chưa hỗ trợ hoặc dữ liệu không hợp lệ.
Series times must increase and values must be finite.|Series phải có time tăng dần và value hữu hạn.
Invalid indicator candle color.|Màu nến indicator không hợp lệ.
Invalid indicator drawing.|Hình indicator không hợp lệ.
Drawing has no endpoint.|Hình thiếu điểm kết thúc.
Invalid indicator table.|Bảng indicator không hợp lệ.
Too many Pine paint layers.|Quá nhiều Pine paint layers.
Pine paint exceeds 200,000 points.|Pine paint vượt 200.000 points.
Unsupported Pine paint type.|Pine paint type chưa hỗ trợ.
Script requires function calculate(bars, context) or const indicator = { calculate }.|Script cần function calculate(bars, context) hoặc const indicator = { calculate }.
Indicator must return {series, drawings, tables}.|Indicator phải trả về {series, drawings, tables}.
Triggered|Khớp
Charts no longer share a data range. Select Current chart for independent Replay.|Các chart không còn khoảng dữ liệu chung. Chọn Current chart để Replay riêng.
to start|tới đầu
no more loaded bars|hết nến đã tải
charts|các chart
Charts do not share a data range. Select Current chart in the Replay menu.|Các chart chưa có khoảng dữ liệu chung. Bạn có thể chọn Current chart trong menu Replay.
No shared closed-bar data for Replay|Chưa có dữ liệu đóng nến chung để phát Replay
This point is outside the selected chart's closed-bar range|Mốc này nằm ngoài khoảng nến đã đóng của chart được chọn
Shared loaded data:|Dữ liệu chung đã tải:
touched|chạm
Alert created|Đã đặt cảnh báo
Invalid data:|Dữ liệu không hợp lệ:
Invalid value:|Giá trị không hợp lệ:
Invalid value at|Giá trị không hợp lệ ở
watching|đang canh
triggered|đã khớp
All|Tất cả
Script initialization exceeded|Script khởi tạo quá
seconds; stopped, code is still saved.|giây; đã dừng, code vẫn được lưu.
Indicator calculation exceeded|Tính indicator quá
seconds; stopped. The script is still saved.|giây; đã dừng. Script vẫn được lưu.
calculate|tính
render dispatch|gửi vẽ
bars|nến
Partial closing is available.|Có thể đóng một phần.
Could not save|Không lưu được
Change timeframe|Đổi khung thời gian
Change interval|Đổi khung
Close quantity|Số hợp đồng đóng
Cancel closing position|Hủy đóng vị thế
Symbol search results|Kết quả tìm mã
Waiting for live price|Đang chờ giá live`.split('\n').map(line=>line.split('|'));
  const labels=new Map();
  for(const pair of pairs)for(const label of pair)labels.set(label,pair[language==='vi'?1:0]);
  const vietnamese=/[ĂăÂâĐđÊêÔôƠơƯưÀÁÃÈÉÌÍÒÓÕÙÚÝàáãèéìíòóõùúý\u1ea0-\u1ef9]/;
  const fragments=pairs.filter(pair=>pair.length===2&&vietnamese.test(pair[1])).sort((a,b)=>b[1].length-a[1].length);
  const text=value=>{
    if(typeof value!=='string')return value;
    if(labels.has(value))return labels.get(value);
    if(language!=='en'||!vietnamese.test(value))return value;
    let result=value;
    for(const [en,vi] of fragments)if(result.includes(vi))result=result.split(vi).join(en);
    return result;
  };
  const replace=value=>value.trim()?value.replace(value.trim(),text(value.trim())):value;
  const excluded='script,style,pre,textarea,code,[contenteditable],.indicator-tables,[data-no-translate]';
  function translateNode(node){
    if(node.parentElement?.closest(excluded))return;
    const value=replace(node.data);if(value!==node.data)node.data=value;
  }
  function markup(root){
    if(root.nodeType===3){translateNode(root);return;}
    if(root.nodeType!==1||root.closest(excluded))return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
      acceptNode:node=>node.parentElement?.closest(excluded)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT
    });
    for(let node=walker.nextNode();node;node=walker.nextNode()){
      const option=node.parentElement?.closest('option');
      if(option&&!option.hasAttribute('value'))option.value=option.value;
      translateNode(node);
    }
    for(const node of [root,...root.querySelectorAll('[title],[aria-label],[placeholder]')]){
      if(node.closest(excluded))continue;
      for(const attr of ['title','aria-label','placeholder'])if(node.hasAttribute(attr)){
        const current=node.getAttribute(attr),value=replace(current);
        if(value!==current)node.setAttribute(attr,value);
      }
    }
  }
  if(typeof MutationObserver!=='undefined')new MutationObserver(records=>{
    for(const record of records){
      if(record.type==='characterData')translateNode(record.target);
      else if(record.type==='attributes')markup(record.target);
      else for(const node of record.addedNodes)markup(node);
    }
  }).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder']});
  document.documentElement.lang=language;
  markup(document.body);
  return {language,text,markup,save:next=>['en','vi'].includes(next)&&Workspace.write(key,next)};
})();
const ui=TerminalLanguage.text;
