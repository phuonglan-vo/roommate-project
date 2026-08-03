import {
  describe,
  expect,
  it
} from 'vitest';

import {
  CONTRACT_STATUS
} from '../../../src/constants/statuses.js';

import {
  determineContractStatus,
  isContractActive,
  isContractExpiringSoon,
  isDateRangeOverlap
} from '../../../src/business/contract-utils.js';

function createContract(overrides = {}) {
  return {
    id: 'contract-01',
    roomId: 'room-01',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    status: CONTRACT_STATUS.ACTIVE,
    ...overrides
  };
}

describe('contract-utils', () => {
  describe('isDateRangeOverlap', () => {
    it('trả về false khi hai khoảng thời gian không trùng nhau', () => {
      const result = isDateRangeOverlap(
        '2026-01-01',
        '2026-01-31',
        '2026-02-01',
        '2026-02-28'
      );

      expect(result).toBe(false);
    });

    it('trả về true khi hai khoảng thời gian trùng một phần', () => {
      const result = isDateRangeOverlap(
        '2026-01-01',
        '2026-01-31',
        '2026-01-20',
        '2026-02-15'
      );

      expect(result).toBe(true);
    });

    it('trả về true khi khoảng thứ hai nằm hoàn toàn trong khoảng thứ nhất', () => {
      const result = isDateRangeOverlap(
        '2026-01-01',
        '2026-03-31',
        '2026-02-01',
        '2026-02-28'
      );

      expect(result).toBe(true);
    });

    it('trả về true khi hai khoảng thời gian trùng hoàn toàn', () => {
      const result = isDateRangeOverlap(
        '2026-01-01',
        '2026-01-31',
        '2026-01-01',
        '2026-01-31'
      );

      expect(result).toBe(true);
    });

    it('xem ngày bắt đầu bằng ngày kết thúc hợp đồng cũ là trùng', () => {
      const result = isDateRangeOverlap(
        '2026-01-01',
        '2026-01-31',
        '2026-01-31',
        '2026-02-28'
      );

      expect(result).toBe(true);
    });

    it('báo lỗi khi ngày kết thúc nhỏ hơn ngày bắt đầu', () => {
      expect(() =>
        isDateRangeOverlap(
          '2026-02-10',
          '2026-02-01',
          '2026-03-01',
          '2026-03-31'
        )
      ).toThrow(
        '[CONTRACT-05] Ngày kết thúc phải sau ngày bắt đầu.'
      );
    });

    it('báo lỗi khi ngày bắt đầu bằng ngày kết thúc trong cùng một khoảng', () => {
      expect(() =>
        isDateRangeOverlap(
          '2026-02-10',
          '2026-02-10',
          '2026-03-01',
          '2026-03-31'
        )
      ).toThrow(
        '[CONTRACT-05] Ngày kết thúc phải sau ngày bắt đầu.'
      );
    });

    it('báo lỗi với ngày không tồn tại', () => {
      expect(() =>
        isDateRangeOverlap(
          '2026-02-30',
          '2026-03-10',
          '2026-04-01',
          '2026-04-30'
        )
      ).toThrow(Error);
    });
  });

  describe('determineContractStatus', () => {
    it('xác định hợp đồng đang hiệu lực', () => {
      const contract = createContract();

      const status = determineContractStatus(
        contract,
        '2026-08-15'
      );

      expect(status).toBe(
        CONTRACT_STATUS.ACTIVE
      );
    });

    it('xem hợp đồng có hiệu lực ngay trong ngày bắt đầu', () => {
      const contract = createContract();

      expect(
        determineContractStatus(
          contract,
          '2026-08-01'
        )
      ).toBe(CONTRACT_STATUS.ACTIVE);
    });

    it('xem hợp đồng còn hiệu lực trong ngày kết thúc', () => {
      const contract = createContract();

      expect(
        determineContractStatus(
          contract,
          '2026-08-31'
        )
      ).toBe(CONTRACT_STATUS.ACTIVE);
    });

    it('xác định hợp đồng đã hết hạn khi ngày hiện tại sau ngày kết thúc', () => {
      const contract = createContract();

      const status = determineContractStatus(
        contract,
        '2026-09-01'
      );

      expect(status).toBe(
        CONTRACT_STATUS.ENDED
      );
    });

    it('xác định hợp đồng chưa bắt đầu là bản nháp', () => {
      const contract = createContract();

      const status = determineContractStatus(
        contract,
        '2026-07-31'
      );

      expect(status).toBe(
        CONTRACT_STATUS.DRAFT
      );
    });

    it('giữ nguyên trạng thái đã hủy', () => {
      const contract = createContract({
        status: CONTRACT_STATUS.CANCELLED
      });

      expect(
        determineContractStatus(
          contract,
          '2026-08-15'
        )
      ).toBe(CONTRACT_STATUS.CANCELLED);
    });

    it('giữ nguyên trạng thái đã kết thúc thủ công', () => {
      const contract = createContract({
        status: CONTRACT_STATUS.ENDED
      });

      expect(
        determineContractStatus(
          contract,
          '2026-08-15'
        )
      ).toBe(CONTRACT_STATUS.ENDED);
    });
  });

  describe('isContractActive', () => {
    it('trả về true khi hợp đồng đang hiệu lực', () => {
      const contract = createContract();

      expect(
        isContractActive(
          contract,
          '2026-08-15'
        )
      ).toBe(true);
    });

    it('trả về false khi hợp đồng đã hết hạn', () => {
      const contract = createContract();

      expect(
        isContractActive(
          contract,
          '2026-09-01'
        )
      ).toBe(false);
    });

    it('trả về false khi hợp đồng đã bị hủy', () => {
      const contract = createContract({
        status: CONTRACT_STATUS.CANCELLED
      });

      expect(
        isContractActive(
          contract,
          '2026-08-15'
        )
      ).toBe(false);
    });
  });

  describe('isContractExpiringSoon', () => {
    it('trả về true khi hợp đồng sắp hết hạn trong số ngày cảnh báo', () => {
      const contract = createContract({
        endDate: '2026-08-31'
      });

      const result = isContractExpiringSoon(
        contract,
        '2026-08-25',
        7
      );

      expect(result).toBe(true);
    });

    it('trả về true khi còn đúng số ngày cảnh báo', () => {
      const contract = createContract({
        endDate: '2026-08-31'
      });

      expect(
        isContractExpiringSoon(
          contract,
          '2026-08-24',
          7
        )
      ).toBe(true);
    });

    it('trả về true trong chính ngày hết hạn', () => {
      const contract = createContract({
        endDate: '2026-08-31'
      });

      expect(
        isContractExpiringSoon(
          contract,
          '2026-08-31',
          7
        )
      ).toBe(true);
    });

    it('trả về false khi thời gian còn lại lớn hơn số ngày cảnh báo', () => {
      const contract = createContract({
        endDate: '2026-08-31'
      });

      expect(
        isContractExpiringSoon(
          contract,
          '2026-08-20',
          7
        )
      ).toBe(false);
    });

    it('trả về false khi hợp đồng đã hết hạn', () => {
      const contract = createContract({
        endDate: '2026-08-31'
      });

      expect(
        isContractExpiringSoon(
          contract,
          '2026-09-01',
          7
        )
      ).toBe(false);
    });

    it('trả về false khi hợp đồng đã bị hủy', () => {
      const contract = createContract({
        status: CONTRACT_STATUS.CANCELLED
      });

      expect(
        isContractExpiringSoon(
          contract,
          '2026-08-25',
          7
        )
      ).toBe(false);
    });

    it.each([
      -1,
      1.5,
      Number.NaN,
      '7',
      null
    ])(
      'báo TypeError khi số ngày cảnh báo không hợp lệ: %p',
      (warningDays) => {
        expect(() =>
          isContractExpiringSoon(
            createContract(),
            '2026-08-25',
            warningDays
          )
        ).toThrow(TypeError);
      }
    );
  });
});