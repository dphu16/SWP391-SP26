# BRD — CORE HR MODULE (v15 Final)

---

## 🟢 GIAI ĐOẠN 1: ONBOARDING

### 1.1 Tiếp nhận dữ liệu từ module Tuyển dụng

Hệ thống kéo bán tự động các trường sau từ module Tuyển dụng sang: họ tên, email, số điện thoại, vị trí ứng tuyển/chức danh dự kiến. HR xem lại và bổ sung toàn bộ thông tin còn lại trước khi tạo hồ sơ chính thức.

### 1.2 Luồng phê duyệt tạo hồ sơ

```
HR tạo hồ sơ
    → Quản lý trực tiếp duyệt
        ├── [Từ chối] Ghi chú lý do → Trả về HR chỉnh sửa → Trình lại
        └── [Duyệt] Hệ thống tự động tạo mã nhân viên
            → Kích hoạt hồ sơ
            → Hệ thống gửi email kích hoạt tài khoản → email cá nhân nhân viên
```

**Lưu ý:**

- Mã nhân viên được tạo tự động theo format phòng ban (VD: IT001, HR001...) ngay sau khi Quản lý duyệt.
- HR có thể hủy hồ sơ bất kỳ lúc nào khi hồ sơ **chưa được Quản lý duyệt**.

### 1.3 Kích hoạt tài khoản nhân viên

Ngay khi HR xác nhận kích hoạt hồ sơ (trước ngày nhân viên đi làm), hệ thống tự động gửi email kích hoạt đến **email cá nhân** nhân viên đã cung cấp khi onboarding. Email bao gồm link kích hoạt để nhân viên thiết lập mật khẩu.

**Luồng kích hoạt:**

```
Nhân viên nhận email kích hoạt
    → Click link kích hoạt (link dùng được 1 lần, không hết hạn theo thời gian)
    → Đặt mật khẩu lần đầu
    → Hệ thống chuyển sang bước bổ sung thông tin bắt buộc:
        ├── Thông tin người thân / liên hệ khẩn cấp
        └── Thông tin ngân hàng
    → Nhân viên điền & xác nhận (có hiệu lực ngay, không cần HR duyệt)
    → HR nhận notification để kiểm tra thông tin ngân hàng vừa điền
    → Tài khoản mở hoàn toàn → Nhân viên vào được hệ thống
       (dù chưa đến ngày bắt đầu thử việc)
```

**Lưu ý bổ sung thông tin:**

- Nhân viên **bắt buộc** phải điền đủ thông tin người thân và ngân hàng trước khi vào được hệ thống — không thể bỏ qua bước này.
- Cả 2 trường này **chỉ điền được 1 lần duy nhất** tại bước kích hoạt. Sau đó muốn thay đổi phải gửi yêu cầu cho HR xử lý — không tự sửa được.
- HR nhận notification sau khi nhân viên hoàn tất để kiểm tra thông tin ngân hàng vừa điền.

HR có thể gửi lại email kích hoạt bất kỳ lúc nào nếu nhân viên chưa nhận được hoặc cần link mới.

**Phương thức đăng nhập:** Hệ thống hỗ trợ 2 phương thức: email cá nhân + mật khẩu, hoặc SSO (Google / Microsoft).

**Chính sách mật khẩu:**

- Bắt buộc có ít nhất 1 chữ hoa, 1 chữ số, 1 ký tự đặc biệt.
- Nhân viên tự đổi mật khẩu khi muốn, không bắt buộc đổi định kỳ.
- Khi quên mật khẩu, hệ thống gửi link reset về email đăng nhập hiện tại — link chỉ có hiệu lực 1 lần.

**Email đăng nhập & cập nhật email:**
Khi nhân viên tự sửa email cá nhân trong hồ sơ, email đăng nhập được cập nhật theo. Mọi thông báo hệ thống (bao gồm link reset mật khẩu) sẽ gửi về email mới.

**Quản lý phiên đăng nhập (Session):**

- Mỗi tài khoản chỉ được đăng nhập trên **1 thiết bị tại 1 thời điểm**. Đăng nhập thiết bị mới sẽ tự động đăng xuất phiên cũ.
- Hệ thống tự động đăng xuất sau một khoảng thời gian không hoạt động.

**Khóa tài khoản:** Tài khoản chỉ bị khóa tự động khi nhân viên nghỉ việc, đúng vào ngày nghỉ chính thức (xem mục 3.4). Không có cơ chế khóa thủ công hay khóa do nhập sai mật khẩu.

**Xử lý tài khoản khi tuyển lại cựu nhân viên:**
Khi một cựu nhân viên (`inactive`) được tuyển lại, HR tạo hồ sơ mới hoàn toàn. Khi Quản lý duyệt hồ sơ mới:

- Tài khoản cũ bị **vô hiệu hóa ngay lập tức** — không cần thông báo cho nhân viên.
- Hồ sơ mới sinh mã nhân viên mới, email đăng nhập mới (lấy từ email cá nhân trong hồ sơ mới).
- Luồng kích hoạt tài khoản chạy lại từ đầu: gửi email kích hoạt mới → nhân viên đặt mật khẩu → bổ sung thông tin bắt buộc.

### 1.4 Quản lý thử việc, thực tập & chính thức hóa

**Nhân viên thử việc (`probation`):**

- HR tự điền thời gian thử việc khi tạo hồ sơ.
- Dùng chung hồ sơ với nhân viên chính thức, chỉ khác trạng thái.
- Có đầy đủ quyền truy cập: xem hồ sơ của mình, tự sửa 3 trường được phép (SĐT, email, địa chỉ) với cooldown 6 tháng.
- Quản lý có thể xem hồ sơ trong phòng ban mình.
- Khi hết thời gian thử việc, HR xác nhận thủ công để chuyển sang `official`.
- Nếu nghỉ việc giữa chừng, áp dụng luồng Offboarding bình thường (xem Giai đoạn 3).

**Nhân viên thực tập (trạng thái `intern`):**

- Có trạng thái riêng biệt `intern`, **không dùng chung** với `probation`.
- Xuất hiện trong **cùng danh sách** với nhân viên thử việc (`probation`), có thể lọc riêng theo trạng thái.
- Luồng tạo hồ sơ **giống hệt** nhân viên thử việc — HR chỉ cần chọn loại hình `intern` khi tạo.
- Hồ sơ yêu cầu thông tin cơ bản: họ tên, email, SĐT, CCCD, địa chỉ. **Không yêu cầu** thông tin người thân.
- Bước kích hoạt tài khoản chỉ gồm: đặt mật khẩu + điền thông tin ngân hàng (bỏ qua bước điền người thân).
- Có đầy đủ quyền truy cập hệ thống như `probation`.
- Khi kết thúc thực tập:
  - Nếu **được tuyển chính thức**: HR chuyển trạng thái từ `intern` → `official` trực tiếp, **bỏ qua giai đoạn `probation`**. Hệ thống **chặn truy cập hoàn toàn** và yêu cầu nhân viên bổ sung thông tin người thân trước khi vào được hệ thống.
  - Nếu **không tiếp tục**: chạy luồng Offboarding bình thường (xem Giai đoạn 3).

---

## 🔵 GIAI ĐOẠN 2: QUẢN LÝ NHÂN VIÊN CHÍNH THỨC

### 2.1 Hồ sơ nhân viên

**Các nhóm thông tin lưu trữ:**

- Thông tin cá nhân cơ bản (họ tên, ngày sinh, giới tính, CCCD...)
- Thông tin liên lạc (số điện thoại, email, địa chỉ)
- Thông tin hộ khẩu / nơi ở hiện tại
- Thông tin người thân / liên hệ khẩn cấp
- Thông tin hợp đồng lao động
- Thông tin ngân hàng (dùng để trả lương)

**Đính kèm tài liệu:** Hỗ trợ lưu file scan (CCCD, bằng cấp, hợp đồng...).

**Lịch sử thay đổi:** Hệ thống lưu toàn bộ lịch sử thay đổi bao gồm ai sửa, sửa trường nào, và thời điểm thay đổi.

### 2.2 Quyền tự cập nhật của nhân viên

Áp dụng cho cả nhân viên `intern`, `probation` và `official`. Nhân viên được phép tự sửa 3 trường sau trong hồ sơ của mình:

- Số điện thoại
- Email cá nhân _(lưu ý: sửa email cá nhân đồng thời cập nhật email đăng nhập — HR nhận notification khi trường này thay đổi — xem mục 1.3)_
- Địa chỉ nơi ở hiện tại

**Thông tin người thân / liên hệ khẩn cấp** và **thông tin ngân hàng** không nằm trong danh sách nhân viên tự sửa được — 2 trường này chỉ điền 1 lần tại bước kích hoạt tài khoản (xem mục 1.3). Muốn thay đổi sau đó phải gửi yêu cầu cho HR — HR chủ động sửa trực tiếp, không cần qua luồng phê duyệt.

**Cơ chế Cooldown:**

- Sau mỗi lần thay đổi 1 trong 3 trường trên, trường đó bị khóa trong **6 tháng**.
- Thay đổi có hiệu lực ngay, không cần phê duyệt.
- Trong thời gian cooldown, nếu cần sửa gấp, nhân viên gửi yêu cầu cho HR sửa hộ.

### 2.3 Quản lý hợp đồng

Áp dụng cho cả `intern`, `probation` và `official`. Chỉ quản lý loại **hợp đồng có thời hạn** (bao gồm hợp đồng thực tập).

- Hệ thống tự động cảnh báo trước **30 ngày** khi hợp đồng sắp hết hạn.
- Thông báo gửi đến cả **HR** và **Quản lý trực tiếp**.

### 2.4 Biến động nhân sự

**Các biến động cần luồng phê duyệt (Quản lý duyệt → HR xác nhận):**

- Thay đổi phòng ban / địa điểm làm việc _(2 sự kiện này luôn đi kèm nhau, xử lý trong 1 luồng duy nhất)_
- Thay đổi chức danh / cấp bậc
- Thay đổi mức lương
- Kỷ luật / khen thưởng

**Phạm vi áp dụng theo trạng thái:**

| Loại biến động           | intern | probation | official |
| ------------------------ | ------ | --------- | -------- |
| Đổi phòng ban / địa điểm | ✅     | ✅        | ✅       |
| Đổi chức danh / cấp bậc  | ✅     | ✅        | ✅       |
| Thay đổi lương           | ❌     | ✅        | ✅       |
| Kỷ luật / khen thưởng    | ✅     | ✅        | ✅       |

Toàn bộ lịch sử biến động được lưu lại trong hệ thống.

### 2.5 Phân quyền truy cập

| Vai trò   | Quyền hạn                                                                                                              |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| HR        | Toàn quyền — xem và chỉnh sửa tất cả hồ sơ (intern + probation + official)                                             |
| Quản lý   | Chỉ xem hồ sơ nhân viên trong phòng ban mình (intern + probation + official), không có quyền chỉnh sửa                 |
| Nhân viên | Chỉ xem hồ sơ của chính mình và tự sửa 3 trường được phép: SĐT, email cá nhân, địa chỉ (intern + probation + official) |

---

## 🔴 GIAI ĐOẠN 3: OFFBOARDING

Áp dụng cho cả nhân viên `intern`, `probation` và `official`.

### 3.1 Khởi tạo yêu cầu nghỉ việc

Có 2 luồng tách biệt tùy theo hình thức nghỉ:

**Nghỉ tự nguyện** (áp dụng cho cả intern, probation và official):

```
Nhân viên tự tạo yêu cầu
    → Quản lý duyệt
        → HR điền ngày nghỉ chính thức & xác nhận
```

**Sa thải / Hết hạn HĐ không gia hạn / Không vào làm sau onboarding:**

```
Quản lý đề xuất
    → HR điền ngày nghỉ chính thức & xác nhận
```

### 3.2 Hủy yêu cầu nghỉ việc

- Có thể hủy yêu cầu sau khi đã duyệt.
- Người hủy phải ghi rõ lý do.
- Hồ sơ nhân viên trở về trạng thái trước đó (`intern`, `probation` hoặc `official`).

### 3.3 Trạng thái trong thời gian chờ duyệt

Nhân viên vẫn hiển thị trạng thái hiện tại (`intern`, `probation` hoặc `official`) cho đến khi HR xác nhận xong.

### 3.4 Sau khi HR xác nhận

- Hồ sơ chuyển sang trạng thái `pending_offboard` — ẩn khỏi danh sách chính, hiển thị trong danh sách nghỉ việc.
- Hệ thống tự động thông báo sang **module Lương** và **module Chấm công**.
- Quyền truy cập hệ thống bị thu hồi **đúng vào ngày nghỉ việc chính thức**.
- Hồ sơ chuyển sang trạng thái `inactive` — lưu trữ đầy đủ, HR có thể tìm kiếm và xem lại khi cần.
- Sau **1 năm** kể từ ngày chuyển sang `inactive`, hệ thống **tự động xóa toàn bộ dữ liệu** của hồ sơ đó mà không cần xác nhận thêm.
