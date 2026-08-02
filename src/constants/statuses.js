/**
 * Trạng thái phòng.
 */
export const ROOM_STATUS = Object.freeze({
  VACANT: 'vacant',
  OCCUPIED: 'occupied',
  MAINTENANCE: 'maintenance',
  INACTIVE: 'inactive'
});

export const ROOM_STATUS_LABELS = Object.freeze({
  [ROOM_STATUS.VACANT]: 'Trống',
  [ROOM_STATUS.OCCUPIED]: 'Đang thuê',
  [ROOM_STATUS.MAINTENANCE]: 'Đang sửa chữa',
  [ROOM_STATUS.INACTIVE]: 'Ngừng sử dụng'
});

/**
 * Trạng thái hồ sơ người thuê.
 */
export const TENANT_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive'
});

export const TENANT_STATUS_LABELS = Object.freeze({
  [TENANT_STATUS.ACTIVE]: 'Đang hoạt động',
  [TENANT_STATUS.INACTIVE]: 'Không hoạt động'
});

/**
 * Trạng thái hợp đồng được lưu trong collection contracts.
 *
 * "Sắp hết hạn" là trạng thái tính toán từ endDate,
 * không lưu trực tiếp vào hợp đồng.
 */
export const CONTRACT_STATUS = Object.freeze({
  DRAFT: 'draft',
  ACTIVE: 'active',
  ENDED: 'ended',
  CANCELLED: 'cancelled'
});

export const CONTRACT_STATUS_LABELS = Object.freeze({
  [CONTRACT_STATUS.DRAFT]: 'Nháp',
  [CONTRACT_STATUS.ACTIVE]: 'Đang hiệu lực',
  [CONTRACT_STATUS.ENDED]: 'Đã kết thúc',
  [CONTRACT_STATUS.CANCELLED]: 'Đã hủy'
});

/**
 * Trạng thái hợp đồng được tính toán để hiển thị.
 */
export const CONTRACT_DISPLAY_STATUS = Object.freeze({
  EXPIRING_SOON: 'expiring_soon'
});

export const CONTRACT_DISPLAY_STATUS_LABELS = Object.freeze({
  [CONTRACT_DISPLAY_STATUS.EXPIRING_SOON]: 'Sắp hết hạn'
});

/**
 * Trạng thái chứng từ hóa đơn được lưu trong invoice.documentStatus.
 */
export const INVOICE_DOCUMENT_STATUS = Object.freeze({
  DRAFT: 'draft',
  ISSUED: 'issued',
  CANCELLED: 'cancelled'
});

export const INVOICE_DOCUMENT_STATUS_LABELS = Object.freeze({
  [INVOICE_DOCUMENT_STATUS.DRAFT]: 'Nháp',
  [INVOICE_DOCUMENT_STATUS.ISSUED]: 'Đã phát hành',
  [INVOICE_DOCUMENT_STATUS.CANCELLED]: 'Đã hủy'
});

/**
 * Trạng thái thanh toán của hóa đơn.
 *
 * Các trạng thái này được tính từ tổng hóa đơn, danh sách thanh toán
 * và ngày đến hạn; không cần lưu trực tiếp vào collection invoices.
 */
export const INVOICE_PAYMENT_STATUS = Object.freeze({
  UNPAID: 'unpaid',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  OVERDUE: 'overdue'
});

export const INVOICE_PAYMENT_STATUS_LABELS = Object.freeze({
  [INVOICE_PAYMENT_STATUS.UNPAID]: 'Chưa thanh toán',
  [INVOICE_PAYMENT_STATUS.PARTIALLY_PAID]: 'Thanh toán một phần',
  [INVOICE_PAYMENT_STATUS.PAID]: 'Đã thanh toán',
  [INVOICE_PAYMENT_STATUS.OVERDUE]: 'Quá hạn'
});

/**
 * Nhãn tổng hợp dùng khi cần hiển thị mọi trạng thái hóa đơn.
 */
export const INVOICE_STATUS_LABELS = Object.freeze({
  ...INVOICE_DOCUMENT_STATUS_LABELS,
  ...INVOICE_PAYMENT_STATUS_LABELS
});

/**
 * Trạng thái của một lần thanh toán.
 */
export const PAYMENT_STATUS = Object.freeze({
  COMPLETED: 'completed',
  VOIDED: 'voided'
});

export const PAYMENT_STATUS_LABELS = Object.freeze({
  [PAYMENT_STATUS.COMPLETED]: 'Đã hoàn tất',
  [PAYMENT_STATUS.VOIDED]: 'Đã hoàn tác'
});