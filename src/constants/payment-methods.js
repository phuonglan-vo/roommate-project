/**
 * Các phương thức thanh toán được RoomMate hỗ trợ.
 */
export const PAYMENT_METHOD = Object.freeze({
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CARD: 'card',
  E_WALLET: 'e_wallet',
  OTHER: 'other'
});

/**
 * Nhãn tiếng Việt tương ứng với từng phương thức thanh toán.
 */
export const PAYMENT_METHOD_LABELS = Object.freeze({
  [PAYMENT_METHOD.CASH]: 'Tiền mặt',
  [PAYMENT_METHOD.BANK_TRANSFER]: 'Chuyển khoản ngân hàng',
  [PAYMENT_METHOD.CARD]: 'Thẻ',
  [PAYMENT_METHOD.E_WALLET]: 'Ví điện tử',
  [PAYMENT_METHOD.OTHER]: 'Khác'
});

/**
 * Danh sách phương thức thanh toán dùng cho select hoặc validation.
 */
export const PAYMENT_METHOD_VALUES = Object.freeze(
  Object.values(PAYMENT_METHOD)
);