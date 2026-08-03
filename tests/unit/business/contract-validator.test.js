import {
  describe,
  expect,
  it
} from 'vitest';

import {
  CONTRACT_STATUS,
  ROOM_STATUS
} from '../../../src/constants/statuses.js';

import {
  hasOverlappingContract,
  validateContract,
  validateOccupancyLimit
} from '../../../src/business/contract-validator.js';

function createValidContract(
  overrides = {}
) {
  return {
    id: 'contract-new',
    roomId: 'room-01',
    tenantIds: [
      'tenant-01',
      'tenant-02'
    ],
    representativeTenantId:
      'tenant-01',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    rentAmount: 3000000,
    depositAmount: 3000000,
    status: CONTRACT_STATUS.DRAFT,
    ...overrides
  };
}

function createExistingContract(
  overrides = {}
) {
  return {
    id: 'contract-existing',
    roomId: 'room-01',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    status: CONTRACT_STATUS.ACTIVE,
    ...overrides
  };
}

describe('contract-validator', () => {
  describe('validateContract', () => {
    it('chuẩn hóa một hợp đồng hợp lệ', () => {
      const contract =
        createValidContract();

      const result =
        validateContract(contract);

      expect(result).toEqual(contract);
      expect(result).not.toBe(contract);
      expect(result.tenantIds).not.toBe(
        contract.tenantIds
      );
    });

    it('xử lý đúng giá thuê và tiền cọc dạng chuỗi số', () => {
      const result = validateContract(
        createValidContract({
          rentAmount: '3000000',
          depositAmount: '1500000'
        })
      );

      expect(result.rentAmount).toBe(
        3000000
      );

      expect(result.depositAmount).toBe(
        1500000
      );
    });

    it('báo lỗi khi ngày kết thúc nhỏ hơn ngày bắt đầu', () => {
      expect(() =>
        validateContract(
          createValidContract({
            startDate: '2026-08-31',
            endDate: '2026-08-01'
          })
        )
      ).toThrow(
        '[CONTRACT-05] Ngày kết thúc phải sau ngày bắt đầu.'
      );
    });

    it('báo lỗi khi ngày kết thúc bằng ngày bắt đầu', () => {
      expect(() =>
        validateContract(
          createValidContract({
            startDate: '2026-08-01',
            endDate: '2026-08-01'
          })
        )
      ).toThrow(
        '[CONTRACT-05] Ngày kết thúc phải sau ngày bắt đầu.'
      );
    });

    it('không cho phòng đang sửa chữa ký hợp đồng', () => {
      expect(() =>
        validateContract(
          createValidContract({
            roomStatus:
              ROOM_STATUS.MAINTENANCE
          })
        )
      ).toThrow(
        '[CONTRACT-02] Phòng đang sửa chữa nên không thể ký hợp đồng.'
      );
    });

    it('không cho phòng tạm ngưng ký hợp đồng', () => {
      expect(() =>
        validateContract(
          createValidContract({
            roomStatus:
              ROOM_STATUS.INACTIVE
          })
        )
      ).toThrow(
        '[CONTRACT-02] Phòng đang tạm ngưng nên không thể ký hợp đồng.'
      );
    });

    it('đọc trạng thái phòng từ contract.room.status', () => {
      expect(() =>
        validateContract(
          createValidContract({
            room: {
              status:
                ROOM_STATUS.MAINTENANCE
            }
          })
        )
      ).toThrow(
        '[CONTRACT-02] Phòng đang sửa chữa nên không thể ký hợp đồng.'
      );
    });

    it('báo lỗi khi người đại diện không thuộc danh sách người thuê', () => {
      expect(() =>
        validateContract(
          createValidContract({
            representativeTenantId:
              'tenant-99'
          })
        )
      ).toThrow(
        'Người đại diện phải thuộc danh sách người thuê của hợp đồng.'
      );
    });
  });

  describe(
    'hasOverlappingContract',
    () => {
      it('trả về false khi hai khoảng thời gian không trùng nhau', () => {
        const newContract =
          createValidContract({
            startDate: '2026-08-01',
            endDate: '2026-08-31'
          });

        const existingContracts = [
          createExistingContract({
            startDate: '2026-07-01',
            endDate: '2026-07-31'
          })
        ];

        expect(
          hasOverlappingContract(
            newContract,
            existingContracts
          )
        ).toBe(false);
      });

      it('trả về true khi hai hợp đồng trùng một phần', () => {
        const newContract =
          createValidContract({
            startDate: '2026-07-20',
            endDate: '2026-08-20'
          });

        const existingContracts = [
          createExistingContract({
            startDate: '2026-07-01',
            endDate: '2026-07-31'
          })
        ];

        expect(
          hasOverlappingContract(
            newContract,
            existingContracts
          )
        ).toBe(true);
      });

      it('trả về true khi hai hợp đồng trùng hoàn toàn', () => {
        const newContract =
          createValidContract({
            startDate: '2026-07-01',
            endDate: '2026-07-31'
          });

        const existingContracts = [
          createExistingContract({
            startDate: '2026-07-01',
            endDate: '2026-07-31'
          })
        ];

        expect(
          hasOverlappingContract(
            newContract,
            existingContracts
          )
        ).toBe(true);
      });

      it('xem ngày bắt đầu bằng ngày kết thúc hợp đồng cũ là trùng', () => {
        const newContract =
          createValidContract({
            startDate: '2026-07-31',
            endDate: '2026-08-31'
          });

        const existingContracts = [
          createExistingContract({
            startDate: '2026-07-01',
            endDate: '2026-07-31'
          })
        ];

        expect(
          hasOverlappingContract(
            newContract,
            existingContracts
          )
        ).toBe(true);
      });

      it('không xem hai hợp đồng khác phòng là trùng', () => {
        const newContract =
          createValidContract({
            roomId: 'room-01',
            startDate: '2026-07-01',
            endDate: '2026-07-31'
          });

        const existingContracts = [
          createExistingContract({
            roomId: 'room-02',
            startDate: '2026-07-01',
            endDate: '2026-07-31'
          })
        ];

        expect(
          hasOverlappingContract(
            newContract,
            existingContracts
          )
        ).toBe(false);
      });

      it('bỏ qua hợp đồng hiện tại khi cập nhật cùng ID', () => {
        const newContract =
          createValidContract({
            id: 'contract-01',
            startDate: '2026-07-01',
            endDate: '2026-07-31'
          });

        const existingContracts = [
          createExistingContract({
            id: 'contract-01',
            startDate: '2026-07-01',
            endDate: '2026-07-31'
          })
        ];

        expect(
          hasOverlappingContract(
            newContract,
            existingContracts
          )
        ).toBe(false);
      });

      it('bỏ qua hợp đồng hiện có đã bị hủy', () => {
        const newContract =
          createValidContract({
            startDate: '2026-07-01',
            endDate: '2026-07-31'
          });

        const existingContracts = [
          createExistingContract({
            status:
              CONTRACT_STATUS.CANCELLED
          })
        ];

        expect(
          hasOverlappingContract(
            newContract,
            existingContracts
          )
        ).toBe(false);
      });

      it('hợp đồng mới đã hủy không bị xem là trùng', () => {
        const newContract =
          createValidContract({
            startDate: '2026-07-01',
            endDate: '2026-07-31',
            status:
              CONTRACT_STATUS.CANCELLED
          });

        const existingContracts = [
          createExistingContract()
        ];

        expect(
          hasOverlappingContract(
            newContract,
            existingContracts
          )
        ).toBe(false);
      });

      it('báo lỗi khi ngày kết thúc nhỏ hơn ngày bắt đầu', () => {
        expect(() =>
          hasOverlappingContract(
            createValidContract({
              startDate: '2026-08-31',
              endDate: '2026-08-01'
            }),
            []
          )
        ).toThrow(
          '[CONTRACT-05] Ngày kết thúc phải sau ngày bắt đầu.'
        );
      });
    }
  );

  describe(
    'validateOccupancyLimit',
    () => {
      it('trả về true khi số người không vượt quá sức chứa', () => {
        const room = {
          id: 'room-01',
          status: ROOM_STATUS.EMPTY,
          maxOccupants: 3
        };

        expect(
          validateOccupancyLimit(
            room,
            [
              'tenant-01',
              'tenant-02',
              'tenant-03'
            ]
          )
        ).toBe(true);
      });

      it('báo lỗi khi số người vượt sức chứa phòng', () => {
        const room = {
          id: 'room-01',
          status: ROOM_STATUS.EMPTY,
          maxOccupants: 2
        };

        expect(() =>
          validateOccupancyLimit(
            room,
            [
              'tenant-01',
              'tenant-02',
              'tenant-03'
            ]
          )
        ).toThrow(
          '[CONTRACT-04] Số người thuê (3) vượt quá sức chứa phòng (2).'
        );
      });

      it('không cho phòng sửa chữa được sử dụng để ký hợp đồng', () => {
        const room = {
          id: 'room-01',
          status:
            ROOM_STATUS.MAINTENANCE,
          maxOccupants: 3
        };

        expect(() =>
          validateOccupancyLimit(
            room,
            ['tenant-01']
          )
        ).toThrow(
          '[CONTRACT-02] Phòng đang sửa chữa nên không thể ký hợp đồng.'
        );
      });

      it('báo lỗi khi sức chứa phòng không phải số nguyên dương', () => {
        expect(() =>
          validateOccupancyLimit(
            {
              status: ROOM_STATUS.EMPTY,
              maxOccupants: 0
            },
            ['tenant-01']
          )
        ).toThrow(
          'Số người tối đa của phòng phải là số nguyên lớn hơn 0.'
        );
      });

      it('báo lỗi khi danh sách người thuê rỗng', () => {
        expect(() =>
          validateOccupancyLimit(
            {
              status: ROOM_STATUS.EMPTY,
              maxOccupants: 3
            },
            []
          )
        ).toThrow(
          'Hợp đồng phải có ít nhất một người thuê.'
        );
      });
    }
  );
});