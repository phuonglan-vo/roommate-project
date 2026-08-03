\# Nhật ký sử dụng AI – Đồ án RoomMate



> Tài liệu này ghi lại quá trình sử dụng công cụ AI trong đồ án RoomMate.  

> Mỗi lần sử dụng AI cần tạo một mục mới, mô tả rõ nội dung được AI đề xuất, phần đã sử dụng, phần bị loại bỏ, cách kiểm tra và commit liên quan.



\---



\## Thông tin tài liệu



| Nội dung | Giá trị |

|---|---|

| Tên đồ án | RoomMate |

| Lớp | CP26SCM02 |

| Thành viên | Vo Phuong Lan |

| Repository | `roommate-project` |

| Vị trí tài liệu | `docs/ai-usage-log.md` |

| Ngày cập nhật gần nhất | `\[YYYY-MM-DD]` |



\---



\## Quy ước ghi nhật ký



\- Mỗi lần sử dụng AI tạo một mục riêng.

\- Không chỉ ghi prompt, cần ghi rõ kết quả nào đã được dùng.

\- Không xem kết quả AI là đúng mặc định.

\- Mọi mã nguồn do AI đề xuất cần được đọc lại, chạy thử và kiểm tra bằng test phù hợp.

\- Nếu AI tạo lỗi, cần ghi rõ lỗi và cách khắc phục.

\- Không đưa mật khẩu, token, khóa API hoặc dữ liệu nhạy cảm vào prompt.

\- Commit liên quan nên ghi mã commit hoặc nội dung commit.

\- Trường không có dữ liệu ghi `Không có` hoặc `Chưa xác định`, không để trống.



\---



\## Mẫu ghi cho mỗi lần sử dụng AI



\### AI-LOG-\[SỐ THỨ TỰ] – \[TIÊU ĐỀ NGẮN]



| Trường | Nội dung |

|---|---|

| Ngày thực hiện | `\[YYYY-MM-DD HH:mm]` |

| Người thực hiện | `\[Họ và tên]` |

| Công cụ AI | `\[Ví dụ: ChatGPT, GitHub Copilot, Gemini...]` |

| Mục tiêu | `\[Mô tả vấn đề cần AI hỗ trợ]` |

| File liên quan | `\[Liệt kê đường dẫn file]` |

| Commit liên quan | `\[Mã commit hoặc nội dung commit; ghi "Chưa commit" nếu chưa có]` |



\#### Prompt



```text

\[Dán nguyên prompt đã gửi cho AI]

```



\#### Kết quả AI trả về



```text

\[Tóm tắt hoặc dán phần kết quả AI trả về có liên quan]

```



\#### Phần được sử dụng



\- `\[Nêu rõ đoạn mã, ý tưởng, cấu trúc hoặc hướng xử lý đã được dùng]`

\- `\[Có thể ghi kèm tên hàm, tên file hoặc phạm vi dòng]`



\#### Phần bị loại bỏ



\- `\[Nêu rõ phần không sử dụng]`

\- `\[Giải thích lý do: sai yêu cầu, không phù hợp kiến trúc, thừa, không an toàn...]`



\#### Phần được chỉnh sửa



| Nội dung AI đề xuất | Nội dung sau khi chỉnh sửa | Lý do chỉnh sửa |

|---|---|---|

| `\[Nội dung ban đầu]` | `\[Nội dung cuối cùng]` | `\[Lý do]` |



\#### Lỗi AI tạo ra



\- `\[Mô tả lỗi]`

\- `\[Ảnh hưởng của lỗi]`

\- `\[Thông báo lỗi nếu có]`



Trường hợp không phát hiện lỗi:



```text

Không phát hiện lỗi sau khi kiểm tra.

```



\#### Cách kiểm tra



\- `\[Đọc và review mã nguồn]`

\- `\[Chạy lệnh kiểm tra]`

\- `\[Chạy unit test, business test hoặc E2E test]`

\- `\[Kiểm tra thủ công trên giao diện]`

\- `\[So sánh với quy tắc nghiệp vụ]`



Các lệnh đã chạy:



```bash

\[Dán các lệnh kiểm tra]

```



Kết quả kiểm tra:



```text

\[Ghi kết quả passed/failed và lỗi còn lại]

```



\#### Bài học rút ra



\- `\[Điều học được về nghiệp vụ, mã nguồn, kiểm thử hoặc cách đặt prompt]`

\- `\[Điều cần chú ý khi sử dụng AI cho trường hợp tương tự]`



\---



\# Các ví dụ minh họa



\## AI-LOG-001 – AI sinh hàm tính hóa đơn



| Trường | Nội dung |

|---|---|

| Ngày thực hiện | `2026-08-03 20:00` |

| Người thực hiện | `Vo Phuong Lan` |

| Công cụ AI | `ChatGPT` |

| Mục tiêu | Tạo hàm tính tạm tính, giảm giá và tổng tiền của hóa đơn RoomMate. |

| File liên quan | `src/business/invoice-calculator.js`, `tests/unit/business/invoice-calculator.test.js` |

| Commit liên quan | `Chưa commit` |



\#### Prompt



```text

Hãy viết hàm JavaScript thuần để tính hóa đơn RoomMate.



Yêu cầu:

\- Nhận mảng items, mỗi item có amount.

\- Tính subtotal bằng tổng amount.

\- Discount không được âm và không được lớn hơn subtotal.

\- Total = subtotal - discount.

\- Không sử dụng DOM hoặc LocalStorage.

\- Hàm phải dễ viết unit test bằng Vitest.

```



\#### Kết quả AI trả về



AI đề xuất các hàm:



```js

export function calculateSubtotal(items = \[]) {

&#x20; return items.reduce(

&#x20;   (total, item) =>

&#x20;     total + Number(item.amount || 0),

&#x20;   0

&#x20; );

}



export function calculateInvoiceTotal(

&#x20; items = \[],

&#x20; discount = 0

) {

&#x20; const subtotal =

&#x20;   calculateSubtotal(items);



&#x20; if (

&#x20;   discount < 0 ||

&#x20;   discount > subtotal

&#x20; ) {

&#x20;   throw new Error(

&#x20;     'Giảm giá không hợp lệ.'

&#x20;   );

&#x20; }



&#x20; return {

&#x20;   subtotal,

&#x20;   discount,

&#x20;   total: subtotal - discount

&#x20; };

}

```



\#### Phần được sử dụng



\- Ý tưởng tách `calculateSubtotal()` khỏi `calculateInvoiceTotal()`.

\- Công thức `total = subtotal - discount`.

\- Kiểm tra giảm giá không lớn hơn tạm tính.

\- Thiết kế hàm thuần, không phụ thuộc giao diện hoặc LocalStorage.



\#### Phần bị loại bỏ



\- Biểu thức `Number(item.amount || 0)` không được dùng nguyên trạng.

\- Không chấp nhận việc tự động biến dữ liệu không hợp lệ thành `0`.

\- Không dùng thông báo lỗi chung chung `Giảm giá không hợp lệ.`.



\#### Phần được chỉnh sửa



| Nội dung AI đề xuất | Nội dung sau khi chỉnh sửa | Lý do chỉnh sửa |

|---|---|---|

| Dùng `Number(item.amount || 0)` | Kiểm tra `amount` phải là số hữu hạn và không âm | Tránh che giấu dữ liệu sai |

| Không kiểm tra `items` có phải mảng | Thêm `Array.isArray(items)` | Bảo vệ đầu vào |

| Thông báo lỗi chung | Tách lỗi giảm giá âm và giảm giá vượt tạm tính | Dễ hiểu và dễ test |

| Không xử lý dữ liệu sai | Ném exception khi khoản tiền không hợp lệ | Bảo đảm tính đúng của hóa đơn |



Phiên bản sau khi chỉnh sửa:



```js

export function calculateSubtotal(

&#x20; items

) {

&#x20; if (!Array.isArray(items)) {

&#x20;   throw new TypeError(

&#x20;     'Danh sách khoản thu phải là mảng.'

&#x20;   );

&#x20; }



&#x20; return items.reduce(

&#x20;   (subtotal, item) => {

&#x20;     const amount =

&#x20;       Number(item?.amount);



&#x20;     if (

&#x20;       !Number.isFinite(amount) ||

&#x20;       amount < 0

&#x20;     ) {

&#x20;       throw new Error(

&#x20;         'Số tiền của khoản thu phải là số không âm.'

&#x20;       );

&#x20;     }



&#x20;     return subtotal + amount;

&#x20;   },

&#x20;   0

&#x20; );

}



export function calculateInvoiceTotal(

&#x20; items,

&#x20; discount = 0

) {

&#x20; const subtotal =

&#x20;   calculateSubtotal(items);



&#x20; const normalizedDiscount =

&#x20;   Number(discount);



&#x20; if (

&#x20;   !Number.isFinite(

&#x20;     normalizedDiscount

&#x20;   ) ||

&#x20;   normalizedDiscount < 0

&#x20; ) {

&#x20;   throw new Error(

&#x20;     'Giảm giá phải là số không âm.'

&#x20;   );

&#x20; }



&#x20; if (

&#x20;   normalizedDiscount > subtotal

&#x20; ) {

&#x20;   throw new Error(

&#x20;     'Giảm giá không được lớn hơn tạm tính.'

&#x20;   );

&#x20; }



&#x20; return {

&#x20;   subtotal,

&#x20;   discount: normalizedDiscount,

&#x20;   total:

&#x20;     subtotal - normalizedDiscount

&#x20; };

}

```



\#### Lỗi AI tạo ra



\- AI dùng `item.amount || 0`, làm cho giá trị thiếu hoặc sai có thể bị chuyển thành `0`.

\- AI không xác nhận `items` có phải mảng hay không.

\- AI chưa kiểm tra trường hợp `amount` âm.

\- Nếu dùng nguyên bản, hàm có thể tạo hóa đơn sai mà không báo lỗi.



\#### Cách kiểm tra



Các trường hợp cần viết test:



\- Mảng rỗng.

\- Một khoản thu.

\- Nhiều khoản thu.

\- Giảm giá bằng `0`.

\- Giảm giá bằng subtotal.

\- Giảm giá âm.

\- Giảm giá lớn hơn subtotal.

\- `amount` âm.

\- `amount` không phải số.

\- `items` không phải mảng.



Lệnh kiểm tra:



```bash

npx vitest run tests/unit/business/invoice-calculator.test.js

```



Kết quả kiểm tra:



```text

\[BỔ SUNG KẾT QUẢ THỰC TẾ]

```



\#### Bài học rút ra



\- Không nên để AI tự động thay dữ liệu sai bằng `0`.

\- Hàm nghiệp vụ cần kiểm tra đầu vào rõ ràng.

\- Cần viết test cho cả trường hợp hợp lệ và không hợp lệ.

\- Nên yêu cầu AI nêu rõ giả định về kiểu dữ liệu ngay trong prompt.



\---



\## AI-LOG-002 – AI sinh Playwright test nhưng selector bị sai



| Trường | Nội dung |

|---|---|

| Ngày thực hiện | `2026-08-03 21:00` |

| Người thực hiện | `Vo Phuong Lan` |

| Công cụ AI | `ChatGPT` |

| Mục tiêu | Viết E2E test cho luồng thêm, sửa, tìm kiếm, lọc và xóa phòng. |

| File liên quan | `tests/e2e/rooms.spec.js`, `src/pages/rooms-page.js`, `src/components/room-form.js` |

| Commit liên quan | `Chưa commit` |



\#### Prompt



```text

Hãy viết Playwright test cho trang quản lý phòng.



Luồng:

1\. Mở #/rooms.

2\. Bấm nút thêm phòng.

3\. Nhập mã, tên, khu vực, loại phòng, giá và sức chứa.

4\. Lưu phòng.

5\. Kiểm tra phòng xuất hiện trong bảng.

6\. Sửa phòng.

7\. Tìm kiếm phòng.

8\. Lọc trạng thái.

9\. Xóa phòng.



Ưu tiên dùng getByTestId.

```



\#### Kết quả AI trả về



AI đề xuất selector:



```js

await page

&#x20; .getByTestId('room-add-button')

&#x20; .click();



await page

&#x20; .getByTestId('room-form-code')

&#x20; .fill('E2E-P101');



await page

&#x20; .getByTestId('room-form-name')

&#x20; .fill('Phòng E2E');



await page

&#x20; .getByTestId('save-room-button')

&#x20; .click();



const row = page

&#x20; .getByTestId('room-table')

&#x20; .getByRole('row')

&#x20; .filter({

&#x20;   hasText: 'E2E-P101'

&#x20; });

```



\#### Phần được sử dụng



\- Cấu trúc test theo từng bước nghiệp vụ.

\- Dùng `getByTestId()` thay cho selector CSS phức tạp.

\- Tìm dòng bảng bằng `getByRole('row').filter({ hasText })`.

\- Tách hàm hỗ trợ nhập form và lấy dòng phòng.



\#### Phần bị loại bỏ



Các selector không tồn tại bị loại bỏ:



\- `room-add-button`

\- `room-form-code`

\- `room-form-name`

\- `save-room-button`

\- `room-table`



Ngoài ra:



\- Không dùng giả định rằng mọi selector do AI đề xuất đều đúng.

\- Không dùng `.fill()` cho trường HTML `<select>`.



\#### Phần được chỉnh sửa



| Nội dung AI đề xuất | Nội dung sau khi chỉnh sửa | Lý do chỉnh sửa |

|---|---|---|

| `room-add-button` | `add-room-button` | Khớp `data-testid` trong giao diện |

| `room-form-code` | `room-code-input` | Khớp form thực tế |

| `room-form-name` | `room-name-input` | Khớp form thực tế |

| `save-room-button` | `room-submit-button` | Khớp nút submit thực tế |

| `room-table` | `rooms-table` | Khớp bảng thực tế |

| `.fill()` cho select | `.selectOption()` | Playwright không dùng `.fill()` cho `<select>` |



Ví dụ selector sau khi chỉnh sửa:



```js

await page

&#x20; .getByTestId('add-room-button')

&#x20; .click();



await page

&#x20; .getByTestId('room-code-input')

&#x20; .fill('E2E-P101');



await page

&#x20; .getByTestId('room-name-input')

&#x20; .fill('Phòng E2E');



await page

&#x20; .getByTestId('room-submit-button')

&#x20; .click();



const row = page

&#x20; .getByTestId('rooms-table')

&#x20; .getByRole('row')

&#x20; .filter({

&#x20;   hasText: 'E2E-P101'

&#x20; });



await expect(row).toBeVisible();

```



\#### Lỗi AI tạo ra



\- AI tự đặt tên `data-testid` mà không đọc mã nguồn giao diện.

\- Test chờ selector không tồn tại và bị timeout.

\- AI dùng `.fill()` cho control có thể là `<select>`.

\- Test không thể tiếp tục đến các bước nghiệp vụ phía sau.



Thông báo lỗi ví dụ:



```text

TimeoutError: locator.fill:

Timeout 10000ms exceeded.



Call log:

&#x20; - waiting for getByTestId(

&#x20;     'room-code-input'

&#x20;   )

```



Hoặc:



```text

Error:

expect(locator).toBeVisible() failed



Locator:

getByTestId('rooms-table')

```



\#### Cách kiểm tra



Tìm toàn bộ `data-testid` thật trong source:



```powershell

Get-ChildItem .\\src `

&#x20; -Recurse `

&#x20; -Filter \*.js |

&#x20; Select-String `

&#x20;   -Pattern "testid"

```



Kiểm tra constant selector trong test:



```powershell

Get-Content `

&#x20; .\\tests\\e2e\\rooms.spec.js |

&#x20; Select-Object -First 160

```



Chạy riêng test phòng:



```powershell

npx playwright test "tests/e2e/rooms.spec.js" --workers=1

```



Liệt kê các test Playwright nhận diện được:



```powershell

npx playwright test --list

```



Mở báo cáo HTML:



```powershell

npx playwright show-report

```



Kiểm tra thêm:



```text

test-results/

playwright-report/

error-context.md

test-failed-1.png

```



Kết quả kiểm tra:



```text

Test ban đầu thất bại vì selector không khớp.



Sau khi đồng bộ selector với source,

test tiếp tục được chạy để phát hiện

các lỗi logic còn lại.

```



\#### Bài học rút ra



\- AI không thể biết chính xác selector nếu chưa được cung cấp mã nguồn liên quan.

\- Trước khi viết E2E test, cần lấy selector từ giao diện thật.

\- Không nên sửa giao diện theo selector AI tự nghĩ ra khi chưa so sánh với yêu cầu test.

\- Nên cung cấp cho AI cả file test và component liên quan.

\- Chạy từng test riêng giúp xác định lỗi nhanh hơn chạy toàn bộ suite.

\- Sau mỗi lần sửa selector cần chạy lại test để tìm lỗi đầu tiên còn lại.



\---



\# Danh sách tổng hợp các lần sử dụng AI



| Mã nhật ký | Ngày | Mục tiêu | Công cụ | File chính | Kết quả kiểm tra | Commit |

|---|---|---|---|---|---|---|

| AI-LOG-001 | 2026-08-03 | Sinh hàm tính hóa đơn | ChatGPT | `invoice-calculator.js` | `\[BỔ SUNG]` | `Chưa commit` |

| AI-LOG-002 | 2026-08-03 | Sinh Playwright test quản lý phòng | ChatGPT | `rooms.spec.js` | Selector ban đầu bị sai | `Chưa commit` |

| AI-LOG-003 | `\[YYYY-MM-DD]` | `\[Mục tiêu]` | `\[Công cụ]` | `\[File]` | `\[Kết quả]` | `\[Commit]` |



\---



\# Checklist trước khi kết thúc một mục nhật ký



\- \[ ] Đã ghi ngày thực hiện.

\- \[ ] Đã ghi người thực hiện.

\- \[ ] Đã ghi đúng công cụ AI.

\- \[ ] Đã lưu nguyên prompt.

\- \[ ] Đã ghi các file liên quan.

\- \[ ] Đã mô tả kết quả AI.

\- \[ ] Đã chỉ rõ phần được sử dụng.

\- \[ ] Đã chỉ rõ phần bị loại bỏ.

\- \[ ] Đã ghi các chỉnh sửa thủ công.

\- \[ ] Đã ghi lỗi do AI tạo ra.

\- \[ ] Đã ghi cách kiểm tra.

\- \[ ] Đã ghi kết quả kiểm tra.

\- \[ ] Đã ghi bài học rút ra.

\- \[ ] Đã ghi commit liên quan.

