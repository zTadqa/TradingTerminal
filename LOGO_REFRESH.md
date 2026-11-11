# Bản làm mới logo và icon

Thiết kế: Terminal Outline. Logo chữ T kết hợp đường giá đi lên, nền xanh đậm và điểm nhấn xanh ngọc. Icon SVG nét bo tròn, dùng chung bộ kích thước và độ dày nét.

- Thêm logo chính và favicon tại `frontend/assets/terminal-mark.svg`.
- Đồng bộ biểu tượng thanh trên, thanh vẽ, Replay, Sync và thanh chỉnh sửa đối tượng v5.
- Thêm icon minh họa cho 85 mục công cụ trong 6 nhóm; giữ nguyên bộ emoji để chèn vào biểu đồ.
- Thêm trạng thái hover, active và focus bàn phím.
- Xem bộ thiết kế bằng cách mở `frontend/icon-preview.html`.

Chạy tool bằng cách cũ. Với bản v5, chạy `node start_v5_server.cjs`, hoặc mở địa chỉ server đang dùng với hậu tố `/?engine=v5`.

Trong lúc kiểm tra phát hiện và sửa ba lỗi nối giao diện v5 trong gói gốc: công bố DrawingIntegrationV5 cho app, dùng sự kiện `selection` theo thư viện, và chuyển tùy chọn null thành object khi chọn công cụ.

Kiểm tra: 41/41 bài kiểm tra Node hiện có đạt. Đã kiểm tra trên Edge ẩn: tải giao diện v4/v5, mở đủ 6 nhóm menu với 85 icon, vẽ hình chữ nhật và đổi trạng thái Sync; không có lỗi JavaScript trong các thao tác này. Chưa kiểm tra kết nối dữ liệu thị trường trực tiếp.

File ZIP gốc được giữ nguyên; bản này được chỉnh trên thư mục sao riêng.
