# RoomMate

> Hệ thống quản lý nhà trọ, người thuê, hợp đồng, điện nước, hóa đơn, thanh toán và công nợ.

- **Lớp:** CP26SCM02
- **Thành viên:** Vo Phuong Lan
- **Repository:** [roommate-project](https://github.com/phuonglan-vo/roommate-project)
- **GitHub Pages:** [https://phuonglan-vo.github.io/roommate-project/](https://phuonglan-vo.github.io/roommate-project/)

---

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Bài toán](#2-bài-toán)
3. [Chức năng](#3-chức-năng)
4. [Công nghệ](#4-công-nghệ)
5. [Cấu trúc thư mục](#5-cấu-trúc-thư-mục)
6. [Cách cài đặt](#6-cách-cài-đặt)
7. [Cách chạy development](#7-cách-chạy-development)
8. [Cách chạy Vitest](#8-cách-chạy-vitest)
9. [Cách chạy Playwright](#9-cách-chạy-playwright)
10. [Cách build](#10-cách-build)
11. [Cách deploy](#11-cách-deploy)
12. [Dữ liệu mẫu](#12-dữ-liệu-mẫu)
13. [Hình ảnh giao diện](#13-hình-ảnh-giao-diện)
14. [Thành viên và phân công](#14-thành-viên-và-phân-công)
15. [Quy trình Git](#15-quy-trình-git)
16. [CI/CD](#16-cicd)
17. [Sử dụng AI](#17-sử-dụng-ai)
18. [Chức năng đã hoàn thành](#18-chức-năng-đã-hoàn-thành)
19. [Hạn chế](#19-hạn-chế)
20. [Hướng phát triển](#20-hướng-phát-triển)

---

## 1. Giới thiệu

**RoomMate** là một ứng dụng web hỗ trợ quản lý nhà trọ.

Ứng dụng giúp tập trung các dữ liệu quan trọng như:

- Phòng trọ.
- Người thuê.
- Hợp đồng thuê.
- Chỉ số điện nước.
- Dịch vụ.
- Hóa đơn.
- Thanh toán.
- Công nợ.
- Báo cáo và biểu đồ.

Dự án được xây dựng dưới dạng ứng dụng chạy trên trình duyệt, không sử dụng backend riêng và không sử dụng cơ sở dữ liệu máy chủ.

Dữ liệu của ứng dụng được lưu bằng `LocalStorage`.

Website của dự án:

```text
https://phuonglan-vo.github.io/roommate-project/
```

---

## 2. Bài toán

Trong quá trình quản lý nhà trọ, dữ liệu thường được ghi chép bằng sổ sách hoặc nhiều file riêng lẻ.

Cách quản lý này có thể dẫn đến các vấn đề như:

- Khó theo dõi phòng đang trống hoặc đã có người thuê.
- Khó tìm kiếm thông tin người thuê.
- Khó theo dõi thời gian hợp đồng.
- Có thể tạo hai hợp đồng bị trùng thời gian cho cùng một phòng.
- Khó kiểm soát số người đang ở so với sức chứa của phòng.
- Dễ nhập sai chỉ số điện và nước.
- Khó tính tiền phòng, điện, nước và dịch vụ.
- Khó theo dõi số tiền đã thanh toán.
- Khó xác định công nợ còn lại.
- Khó tổng hợp doanh thu và báo cáo.

RoomMate giải quyết bài toán bằng cách tổ chức dữ liệu thành các nhóm nghiệp vụ có liên kết với nhau:

```text
Phòng
  └── Hợp đồng
        ├── Người thuê
        ├── Chỉ số điện nước
        ├── Hóa đơn
        └── Thanh toán
```

Mục tiêu của dự án là giúp việc quản lý nhà trọ trở nên rõ ràng, thuận tiện và giảm sai sót khi xử lý dữ liệu.

---

## 3. Chức năng

### 3.1. Dashboard

- Hiển thị tổng số phòng.
- Hiển thị số phòng trống.
- Hiển thị số phòng đang được thuê.
- Hiển thị tỷ lệ lấp đầy.
- Hiển thị số người thuê hiện tại.
- Hiển thị doanh thu theo tháng.
- Hiển thị tổng công nợ.
- Hiển thị số hóa đơn quá hạn.
- Hiển thị mức sử dụng điện và nước.
- Hiển thị biểu đồ thống kê.
- Hiển thị cảnh báo hợp đồng sắp hết hạn.
- Hiển thị cảnh báo hóa đơn quá hạn.
- Hiển thị cảnh báo thiếu dữ liệu điện nước.

### 3.2. Quản lý phòng

- Xem danh sách phòng.
- Thêm phòng.
- Sửa thông tin phòng.
- Xem chi tiết phòng.
- Xóa phòng khi đủ điều kiện.
- Tìm kiếm theo mã phòng hoặc tên phòng.
- Lọc phòng theo trạng thái.
- Sắp xếp phòng theo giá thuê.
- Theo dõi sức chứa của phòng.
- Theo dõi trạng thái phòng.
- Ngăn xóa phòng đang có hợp đồng hiệu lực.
- Ngăn sử dụng phòng đang sửa chữa cho hợp đồng mới.

### 3.3. Quản lý người thuê

- Xem danh sách người thuê.
- Thêm người thuê.
- Sửa hồ sơ người thuê.
- Tìm kiếm theo họ tên.
- Tìm kiếm theo số điện thoại.
- Tìm kiếm theo CCCD hoặc CMND.
- Lưu trữ hồ sơ người thuê.
- Xem phòng hiện tại của người thuê.
- Xem lịch sử thuê phòng.
- Ngăn xóa người thuê đang có hợp đồng hiệu lực.

### 3.4. Quản lý hợp đồng

- Tạo hợp đồng thuê.
- Chọn phòng.
- Chọn người đại diện.
- Chọn người ở cùng.
- Kiểm tra sức chứa tối đa của phòng.
- Kiểm tra ngày bắt đầu và ngày kết thúc.
- Ngăn hợp đồng cùng phòng bị trùng thời gian.
- Kích hoạt hợp đồng.
- Gia hạn hợp đồng.
- Kết thúc hợp đồng.
- Hủy hợp đồng.
- Lưu giá thuê tại thời điểm ký hợp đồng.
- Theo dõi hợp đồng sắp hết hạn.

### 3.5. Quản lý chỉ số điện nước

- Chọn tháng ghi chỉ số.
- Nhập chỉ số điện cũ và mới.
- Nhập chỉ số nước cũ và mới.
- Tự động tính lượng điện sử dụng.
- Tự động tính lượng nước sử dụng.
- Lấy chỉ số kỳ trước làm chỉ số đầu kỳ tiếp theo.
- Ngăn chỉ số mới nhỏ hơn chỉ số cũ.
- Ngăn tạo nhiều bản ghi cho cùng phòng trong cùng một tháng.
- Cảnh báo mức sử dụng bất thường.
- Hiển thị danh sách phòng chưa ghi chỉ số.

### 3.6. Cấu hình dịch vụ

- Thêm dịch vụ.
- Sửa dịch vụ.
- Kích hoạt dịch vụ.
- Ngừng sử dụng dịch vụ.
- Tìm kiếm dịch vụ.
- Lọc theo trạng thái.
- Hỗ trợ nhiều cách tính:
  - Theo mức sử dụng.
  - Cố định.
  - Theo số người.
  - Theo số xe.
  - Nhập thủ công.
- Lưu đơn giá áp dụng tại từng thời điểm.
- Không làm thay đổi hóa đơn cũ khi cập nhật đơn giá mới.

### 3.7. Quản lý hóa đơn

- Xem danh sách hóa đơn.
- Tạo hóa đơn theo phòng và tháng.
- Tính tiền phòng.
- Tính tiền điện.
- Tính tiền nước.
- Tính tiền dịch vụ.
- Áp dụng giảm giá.
- Tính tổng tiền.
- Theo dõi số tiền đã thanh toán.
- Tính công nợ còn lại.
- Theo dõi trạng thái hóa đơn.
- Hủy hóa đơn theo điều kiện nghiệp vụ.
- Xem chi tiết hóa đơn.

### 3.8. Quản lý thanh toán

- Ghi nhận thanh toán hóa đơn.
- Theo dõi ngày thanh toán.
- Theo dõi số tiền thanh toán.
- Theo dõi phương thức thanh toán.
- Hỗ trợ các phương thức:
  - Tiền mặt.
  - Ngân hàng.
  - Chuyển khoản.
  - Phương thức khác.
- Ngăn thanh toán vượt quá số tiền còn nợ.
- Tự động cập nhật trạng thái hóa đơn.

### 3.9. Quản lý công nợ

- Hiển thị các hóa đơn còn nợ.
- Tính công nợ còn lại.
- Hiển thị hóa đơn quá hạn.
- Làm nổi bật các khoản nợ cần xử lý.
- Hỗ trợ theo dõi tình trạng thu tiền.

### 3.10. Báo cáo và biểu đồ

- Thống kê số lượng phòng.
- Thống kê trạng thái phòng.
- Thống kê doanh thu.
- Thống kê số tiền thực thu.
- Thống kê công nợ.
- Thống kê điện năng sử dụng.
- Thống kê lượng nước sử dụng.
- Hiển thị biểu đồ bằng Chart.js.

### 3.11. Import và Export dữ liệu

- Export toàn bộ dữ liệu thành file JSON.
- Import dữ liệu từ file JSON.
- Kiểm tra định dạng file trước khi import.
- Kiểm tra cấu trúc dữ liệu.
- Ngăn ghi đè khi dữ liệu không hợp lệ.
- Hỗ trợ ghi đè dữ liệu.
- Hỗ trợ gộp dữ liệu.
- Tạo bản sao lưu trước khi ghi đè.
- Khôi phục dữ liệu mẫu.
- Xóa dữ liệu RoomMate có xác nhận.

---

## 4. Công nghệ

| Nhóm | Công nghệ |
|---|---|
| Ngôn ngữ | JavaScript ES Modules |
| Giao diện | HTML5, CSS3 |
| Thư viện giao diện | Bootstrap 5 |
| Công cụ phát triển | Vite |
| Biểu đồ | Chart.js |
| Lưu trữ dữ liệu | LocalStorage |
| Định tuyến | Hash Router |
| Unit Test | Vitest |
| Môi trường DOM Test | jsdom |
| E2E Test | Playwright |
| Quản lý mã nguồn | Git và GitHub |
| CI/CD | GitHub Actions |
| Hosting | GitHub Pages |

Dự án không sử dụng framework JavaScript như React, Vue hoặc Angular.

Dự án không có backend riêng và không sử dụng cơ sở dữ liệu máy chủ.

---

## 5. Cấu trúc thư mục

Cấu trúc tổng quát của dự án:

```text
roommate-project/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
├── assets/
│   └── [tài nguyên tĩnh nếu có]
├── src/
│   ├── business/
│   │   ├── contract-utils.js
│   │   ├── contract-validator.js
│   │   ├── invoice-calculator.js
│   │   ├── invoice-validator.js
│   │   ├── meter-calculator.js
│   │   ├── meter-validator.js
│   │   ├── room-validator.js
│   │   └── tenant-validator.js
│   ├── components/
│   │   ├── alert-list.js
│   │   ├── confirm-dialog.js
│   │   ├── contract-detail.js
│   │   ├── contract-form.js
│   │   ├── invoice-detail.js
│   │   ├── invoice-form.js
│   │   ├── layout.js
│   │   ├── meter-reading-form.js
│   │   ├── room-form.js
│   │   ├── stat-card.js
│   │   ├── tenant-form.js
│   │   └── toast.js
│   ├── constants/
│   │   ├── payment-methods.js
│   │   ├── routes.js
│   │   ├── statuses.js
│   │   └── storage-keys.js
│   ├── data/
│   │   └── seed-data.js
│   ├── pages/
│   │   ├── dashboard-page.js
│   │   ├── rooms-page.js
│   │   ├── tenants-page.js
│   │   ├── contracts-page.js
│   │   ├── meter-readings-page.js
│   │   ├── services-page.js
│   │   ├── invoices-page.js
│   │   ├── payments-page.js
│   │   ├── debts-page.js
│   │   ├── reports-page.js
│   │   ├── settings-page.js
│   │   └── not-found-page.js
│   ├── services/
│   │   ├── backup-service.js
│   │   ├── contract-service.js
│   │   ├── invoice-service.js
│   │   ├── meter-reading-service.js
│   │   ├── payment-service.js
│   │   ├── report-service.js
│   │   ├── room-service.js
│   │   ├── seed-service.js
│   │   ├── service-config-service.js
│   │   ├── storage-service.js
│   │   └── tenant-service.js
│   ├── styles/
│   │   └── [các file CSS của giao diện]
│   ├── utils/
│   │   ├── currency-utils.js
│   │   ├── date-utils.js
│   │   ├── id-utils.js
│   │   ├── number-utils.js
│   │   └── validation-utils.js
│   ├── main.js
│   └── router.js
├── tests/
│   ├── unit/
│   │   ├── business/
│   │   ├── services/
│   │   └── utils/
│   ├── business/
│   │   └── [kiểm thử nghiệp vụ nếu có]
│   └── e2e/
│       ├── contract-activation-flow.spec.js
│       ├── import-export-flow.spec.js
│       ├── invoice-creation-flow.spec.js
│       ├── payment-dashboard-flow.spec.js
│       └── rooms.spec.js
├── index.html
├── package.json
├── package-lock.json
├── playwright.config.js
├── vite.config.js
└── vitest.config.js
```

> Cập nhật lại cây thư mục trên nếu cấu trúc thực tế của phiên bản cuối có thay đổi.

---

## 6. Cách cài đặt

### 6.1. Yêu cầu môi trường

Cần cài đặt:

- Git.
- Node.js.
- npm.
- Trình duyệt Chromium dành cho Playwright.

Phiên bản Node.js được cấu hình trong dự án:

```text
^20.19.0 hoặc >=22.12.0
```

### 6.2. Clone repository

```bash
git clone https://github.com/phuonglan-vo/roommate-project.git
```

Di chuyển vào thư mục dự án:

```bash
cd roommate-project
```

### 6.3. Cài đặt dependencies

```bash
npm install
```

Khi chạy trong môi trường CI hoặc cần cài đúng theo `package-lock.json`:

```bash
npm ci
```

### 6.4. Cài Chromium cho Playwright

```bash
npx playwright install chromium
```

Trên Linux hoặc GitHub Actions:

```bash
npx playwright install --with-deps chromium
```

---

## 7. Cách chạy development

Khởi động Vite development server:

```bash
npm run dev
```

Sau khi khởi động thành công, mở trình duyệt tại:

```text
http://127.0.0.1:5173/
```

Đường dẫn trực tiếp đến Dashboard:

```text
http://127.0.0.1:5173/#/dashboard
```

Các route chính:

```text
#/dashboard
#/rooms
#/tenants
#/contracts
#/meters
#/services
#/invoices
#/payments
#/debts
#/reports
#/settings
```

Dừng development server bằng tổ hợp phím:

```text
Ctrl + C
```

---

## 8. Cách chạy Vitest

### 8.1. Chạy Vitest ở chế độ theo dõi

```bash
npm test
```

### 8.2. Chạy toàn bộ test một lần

```bash
npm run test:run
```

### 8.3. Chạy unit test

```bash
npm run test:unit
```

### 8.4. Chạy business test

```bash
npm run test:business
```

### 8.5. Chạy test và tạo báo cáo coverage

```bash
npm run test:coverage
```

### 8.6. Chạy trực tiếp một file test

Ví dụ:

```bash
npx vitest run tests/unit/utils/currency-utils.test.js
```

> Kiểm tra lại mục `scripts` trong `package.json` nếu một lệnh chưa được khai báo trong phiên bản hiện tại.

---

## 9. Cách chạy Playwright

### 9.1. Cài Chromium lần đầu

```bash
npx playwright install chromium
```

### 9.2. Chạy toàn bộ E2E test

```bash
npm run test:e2e
```

### 9.3. Chạy Playwright bằng giao diện UI

```bash
npm run test:e2e:ui
```

### 9.4. Chạy một file test

```bash
npx playwright test tests/e2e/rooms.spec.js
```

### 9.5. Chạy với một worker

Lệnh này giúp dễ theo dõi lỗi hơn:

```bash
npx playwright test tests/e2e/rooms.spec.js --workers=1
```

### 9.6. Mở báo cáo HTML

```bash
npx playwright show-report
```

Playwright được cấu hình để tự khởi động Vite development server trước khi chạy E2E test.

Khi test thất bại, ảnh chụp và thông tin lỗi có thể được lưu trong:

```text
test-results/
playwright-report/
```

---

## 10. Cách build

Tạo bản production:

```bash
npm run build
```

Sau khi build thành công, kết quả được tạo trong thư mục:

```text
dist/
```

Chạy thử bản production trên máy:

```bash
npm run preview
```

Theo cấu hình Vite, địa chỉ preview thường là:

```text
http://127.0.0.1:4173/
```

Có thể chạy toàn bộ quá trình:

```bash
npm run build
npm run preview
```

Dừng preview server bằng:

```text
Ctrl + C
```

---

## 11. Cách deploy

Dự án được deploy lên GitHub Pages bằng GitHub Actions.

### 11.1. Cấu hình GitHub Pages

Trong repository, mở:

```text
Settings
→ Pages
→ Build and deployment
→ Source
→ GitHub Actions
```

### 11.2. Push mã nguồn lên nhánh main

```bash
git add .
git commit -m "update project"
git push origin main
```

### 11.3. Quy trình deploy

Workflow thực hiện các bước:

```text
Checkout repository
→ Cài đặt Node.js
→ Cài dependencies bằng npm ci
→ Cài Chromium cho Playwright
→ Chạy unit test
→ Chạy E2E test
→ Build ứng dụng
→ Upload thư mục dist
→ Deploy GitHub Pages
```

Website sau khi deploy:

```text
https://phuonglan-vo.github.io/roommate-project/
```

Đường dẫn trực tiếp đến Dashboard:

```text
https://phuonglan-vo.github.io/roommate-project/#/dashboard
```

Vite cần sử dụng base path:

```text
/roommate-project/
```

Khi một bước test hoặc build thất bại, phiên bản mới sẽ không được deploy.

### 11.4. Chạy workflow thủ công

Trong GitHub:

```text
Repository
→ Actions
→ Deploy RoomMate to GitHub Pages
→ Run workflow
```

### 11.5. Kiểm tra kết quả

Tất cả các bước trong GitHub Actions cần có dấu tích màu xanh.

Sau khi deploy thành công, nên kiểm tra website bằng cửa sổ ẩn danh để tránh dữ liệu cache cũ.

---

## 12. Dữ liệu mẫu

Dự án sử dụng dữ liệu mẫu để minh họa các chức năng.

Các nhóm dữ liệu dự kiến gồm:

| Collection | Nội dung |
|---|---|
| `rooms` | Danh sách phòng |
| `tenants` | Danh sách người thuê |
| `contracts` | Danh sách hợp đồng |
| `meterReadings` | Chỉ số điện nước |
| `serviceConfigs` | Cấu hình dịch vụ |
| `invoices` | Danh sách hóa đơn |
| `payments` | Danh sách thanh toán |
| `appSettings` | Cấu hình ứng dụng |

Dữ liệu mẫu được lưu trong:

```text
src/data/seed-data.js
```

Dịch vụ khởi tạo dữ liệu mẫu:

```text
src/services/seed-service.js
```

Dữ liệu mẫu nên bao gồm:

- Phòng trống.
- Phòng đang thuê.
- Phòng đang sửa chữa.
- Người thuê đang hoạt động.
- Hợp đồng đang hiệu lực.
- Hợp đồng sắp hết hạn.
- Chỉ số điện nước của nhiều tháng.
- Các dịch vụ đang hoạt động.
- Hóa đơn chưa thanh toán.
- Hóa đơn thanh toán một phần.
- Hóa đơn đã thanh toán.
- Hóa đơn quá hạn.
- Các giao dịch thanh toán.

Số lượng dữ liệu mẫu thực tế:

```text
[BỔ SUNG SỐ LƯỢNG THEO FILE seed-data.js PHIÊN BẢN CUỐI]
```

Người dùng có thể khôi phục dữ liệu mẫu trong phần cài đặt hoặc sao lưu dữ liệu, tùy theo giao diện phiên bản cuối.

---

## 13. Hình ảnh giao diện

Tạo thư mục ảnh trong repository:

```text
docs/images/
```

Sau đó chụp ảnh màn hình và thêm vào README.

### 13.1. Dashboard

```markdown
![Dashboard RoomMate](docs/images/dashboard.png)
```

![Dashboard RoomMate](docs/images/dashboard.png)

### 13.2. Quản lý phòng

```markdown
![Quản lý phòng](docs/images/rooms.png)
```

![Quản lý phòng](docs/images/rooms.png)

### 13.3. Quản lý người thuê

```markdown
![Quản lý người thuê](docs/images/tenants.png)
```

![Quản lý người thuê](docs/images/tenants.png)

### 13.4. Quản lý hợp đồng

```markdown
![Quản lý hợp đồng](docs/images/contracts.png)
```

![Quản lý hợp đồng](docs/images/contracts.png)

### 13.5. Quản lý hóa đơn

```markdown
![Quản lý hóa đơn](docs/images/invoices.png)
```

![Quản lý hóa đơn](docs/images/invoices.png)

### 13.6. Báo cáo và biểu đồ

```markdown
![Báo cáo và biểu đồ](docs/images/reports.png)
```

![Báo cáo và biểu đồ](docs/images/reports.png)

> Các file ảnh trên hiện là placeholder. Cần chụp giao diện thực tế và lưu đúng tên trước khi nộp bài.

---

## 14. Thành viên và phân công

### Thành viên

| STT | Họ và tên | Lớp |
|---:|---|---|
| 1 | Vo Phuong Lan | CP26SCM02 |

### Phân công

Dự án hiện có một thành viên.

| Thành viên | Nội dung thực hiện |
|---|---|
| Vo Phuong Lan | Phân tích yêu cầu, thiết kế cấu trúc dự án, xây dựng giao diện, xây dựng nghiệp vụ, lưu trữ LocalStorage, viết kiểm thử, cấu hình GitHub Actions và triển khai GitHub Pages |

Chi tiết bổ sung:

```text
[BỔ SUNG HOẶC ĐIỀU CHỈNH PHÂN CÔNG THEO NỘI DUNG THỰC TẾ]
```

---

## 15. Quy trình Git

Quy trình Git được sử dụng trong dự án:

### 15.1. Cập nhật mã nguồn trước khi làm việc

```bash
git pull origin main
```

### 15.2. Kiểm tra trạng thái file

```bash
git status
```

### 15.3. Thêm file vào staging

Thêm toàn bộ file:

```bash
git add .
```

Hoặc thêm từng file:

```bash
git add src/pages/rooms-page.js
```

### 15.4. Tạo commit

```bash
git commit -m "fix room page"
```

Quy ước commit đề xuất:

```text
feat: thêm chức năng mới
fix: sửa lỗi
test: thêm hoặc cập nhật test
docs: cập nhật tài liệu
refactor: tổ chức lại mã nguồn
style: sửa giao diện hoặc định dạng
chore: cập nhật cấu hình và dependencies
```

Ví dụ:

```bash
git commit -m "feat: add room management"
git commit -m "fix: render room table after creating room"
git commit -m "test: update Playwright room flow"
git commit -m "docs: complete README"
```

### 15.5. Push lên GitHub

```bash
git push origin main
```

### 15.6. Quy trình đề xuất khi làm theo branch

```bash
git checkout -b feature/rooms
git add .
git commit -m "feat: complete room management"
git push origin feature/rooms
```

Sau đó tạo Pull Request để kiểm tra trước khi merge vào `main`.

Do dự án hiện có một thành viên, quá trình phát triển có thể được thực hiện trực tiếp trên nhánh `main`, nhưng sử dụng branch vẫn giúp giảm rủi ro.

---

## 16. CI/CD

Dự án sử dụng GitHub Actions để tự động kiểm thử, build và deploy.

Workflow được đặt tại:

```text
.github/workflows/deploy-pages.yml
```

Workflow được kích hoạt khi:

- Có commit được push lên nhánh `main`.
- Người dùng chạy thủ công bằng `workflow_dispatch`.

Các bước chính của CI/CD:

1. Checkout mã nguồn.
2. Cài đặt Node.js.
3. Cài dependencies bằng `npm ci`.
4. Cài Chromium và các dependency hệ thống.
5. Chạy unit test.
6. Chạy Playwright E2E test.
7. Cấu hình GitHub Pages.
8. Build ứng dụng bằng Vite.
9. Upload thư mục `dist`.
10. Deploy lên GitHub Pages.

Luồng tổng quát:

```text
Push main
   ↓
GitHub Actions
   ↓
Install dependencies
   ↓
Unit Test
   ↓
E2E Test
   ↓
Build
   ↓
Deploy GitHub Pages
```

Chỉ khi các bước test và build thành công thì job deploy mới được thực hiện.

Trang deploy:

```text
https://phuonglan-vo.github.io/roommate-project/
```

---

## 17. Sử dụng AI

Trong quá trình thực hiện dự án, công cụ AI được sử dụng để hỗ trợ:

- Phân tích yêu cầu.
- Đề xuất cấu trúc thư mục.
- Gợi ý mô hình dữ liệu.
- Gợi ý quy tắc nghiệp vụ.
- Giải thích mã JavaScript.
- Hỗ trợ viết test Vitest.
- Hỗ trợ viết test Playwright.
- Hỗ trợ phân tích lỗi từ log.
- Hỗ trợ cấu hình GitHub Actions.
- Hỗ trợ viết tài liệu README.

Công cụ AI đã sử dụng:

```text
ChatGPT
```

Nguyên tắc sử dụng AI:

- Không sao chép kết quả mà không kiểm tra.
- Đọc và hiểu mã nguồn trước khi sử dụng.
- Kiểm tra lại bằng unit test và E2E test.
- Điều chỉnh mã nguồn phù hợp với cấu trúc dự án.
- Không đưa thông tin bí mật hoặc dữ liệu nhạy cảm vào công cụ AI.
- Thành viên chịu trách nhiệm cuối cùng về mã nguồn được đưa vào repository.

Mức độ và nội dung sử dụng cụ thể:

```text
[BỔ SUNG NẾU GIẢNG VIÊN YÊU CẦU MÔ TẢ CHI TIẾT HƠN]
```

---

## 18. Chức năng đã hoàn thành

Tình trạng hiện tại của dự án:

| Chức năng | Trạng thái |
|---|---|
| Khởi tạo dự án Vite | Đã xây dựng |
| Giao diện layout và sidebar | Đã xây dựng |
| Hash Router | Đã xây dựng |
| LocalStorage Service | Đã xây dựng |
| Dữ liệu mẫu | Đã xây dựng |
| Quản lý phòng | Đã xây dựng, đang hoàn thiện kiểm thử |
| Quản lý người thuê | Đã xây dựng, cần xác nhận kiểm thử cuối |
| Quản lý hợp đồng | Đã xây dựng, cần xác nhận kiểm thử cuối |
| Quản lý chỉ số điện nước | Đã xây dựng, cần xác nhận kiểm thử cuối |
| Quản lý dịch vụ | Đã xây dựng, cần xác nhận kiểm thử cuối |
| Quản lý hóa đơn | Đã xây dựng, cần xác nhận kiểm thử cuối |
| Quản lý thanh toán | Đã xây dựng, cần xác nhận kiểm thử cuối |
| Quản lý công nợ | Đã xây dựng, cần xác nhận kiểm thử cuối |
| Dashboard | Đã xây dựng, cần xác nhận dữ liệu và giao diện cuối |
| Báo cáo và biểu đồ | Đã xây dựng, cần xác nhận kiểm thử cuối |
| Import và Export JSON | Đã xây dựng, đang hoàn thiện kiểm thử |
| Unit Test bằng Vitest | Đã xây dựng |
| E2E Test bằng Playwright | Đã xây dựng, đang sửa các test chưa đạt |
| Build production | Đã cấu hình |
| GitHub Actions | Đã cấu hình |
| GitHub Pages | Đã cấu hình, cần xác nhận bản deploy cuối |

Kết quả kiểm thử cuối cùng:

```text
[BỔ SUNG SỐ TEST PASSED/FAILED SAU KHI HOÀN THIỆN]
```

Ví dụ sau khi test thành công:

```text
Unit Test: [BỔ SUNG]
Business Test: [BỔ SUNG]
E2E Test: [BỔ SUNG]
```

---

## 19. Hạn chế

Phiên bản hiện tại còn một số hạn chế:

- Dữ liệu chỉ được lưu bằng LocalStorage.
- Dữ liệu chỉ tồn tại trên trình duyệt và thiết bị đang sử dụng.
- Không có cơ sở dữ liệu máy chủ.
- Không có chức năng đăng nhập.
- Không có phân quyền người dùng.
- Không đồng bộ dữ liệu giữa nhiều thiết bị.
- Khi người dùng xóa dữ liệu trình duyệt, dữ liệu có thể bị mất.
- Việc import dữ liệu cần được kiểm tra kỹ để tránh ghi đè sai.
- GitHub Pages chỉ cung cấp hosting tĩnh.
- Không có API backend.
- Không gửi được thông báo qua email hoặc SMS.
- Khả năng in hóa đơn hoặc xuất PDF chưa được xác nhận.
- Giao diện trên tất cả kích thước màn hình cần được kiểm tra thêm.
- Một số E2E test đang trong quá trình hoàn thiện.
- Trạng thái deploy cuối cần được kiểm tra trực tiếp trên GitHub Pages.

Các hạn chế khác:

```text
[BỔ SUNG THEO KẾT QUẢ KIỂM THỬ THỰC TẾ]
```

---

## 20. Hướng phát triển

Trong tương lai, dự án có thể được phát triển thêm các chức năng sau:

- Xây dựng backend riêng.
- Sử dụng cơ sở dữ liệu như MySQL, PostgreSQL hoặc MongoDB.
- Thêm chức năng đăng nhập.
- Thêm phân quyền chủ trọ, nhân viên và người thuê.
- Đồng bộ dữ liệu trên nhiều thiết bị.
- Tạo tài khoản riêng cho người thuê.
- Cho phép người thuê xem hóa đơn.
- Gửi thông báo hóa đơn qua email.
- Gửi nhắc nợ qua SMS hoặc ứng dụng nhắn tin.
- Xuất hóa đơn thành PDF.
- In hóa đơn.
- Tạo mã QR thanh toán.
- Tích hợp thanh toán trực tuyến.
- Quản lý nhiều khu trọ.
- Quản lý nhiều chi nhánh.
- Quản lý tài sản trong từng phòng.
- Quản lý yêu cầu sửa chữa.
- Quản lý chi phí vận hành.
- Bổ sung báo cáo doanh thu theo năm.
- Bổ sung báo cáo tỷ lệ lấp đầy.
- Bổ sung biểu đồ so sánh điện nước giữa các tháng.
- Thêm chức năng tìm kiếm nâng cao.
- Tăng độ bao phủ của unit test.
- Hoàn thiện toàn bộ E2E test.
- Cải thiện khả năng truy cập cho người dùng khuyết tật.
- Cải thiện trải nghiệm trên thiết bị di động.
- Chuyển ứng dụng thành Progressive Web App.
- Tự động sao lưu dữ liệu định kỳ.

---

## Thông tin dự án

| Nội dung | Thông tin |
|---|---|
| Tên dự án | RoomMate |
| Lớp | CP26SCM02 |
| Thành viên | Vo Phuong Lan |
| Repository | roommate-project |
| GitHub | https://github.com/phuonglan-vo/roommate-project |
| GitHub Pages | https://phuonglan-vo.github.io/roommate-project/ |
| Phiên bản | 0.1.0 |
| Trạng thái | Đang hoàn thiện |

---

## License

```text
[CHƯA CUNG CẤP THÔNG TIN GIẤY PHÉP]
```

Nếu dự án chỉ phục vụ mục đích học tập, có thể ghi:

```text
Dự án được thực hiện cho mục đích học tập trong lớp CP26SCM02.
```