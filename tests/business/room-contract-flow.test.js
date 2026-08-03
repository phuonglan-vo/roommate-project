import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

import {
  CONTRACT_STATUS,
  ROOM_STATUS
} from '../../src/constants/statuses.js';

import {
  STORAGE_KEYS
} from '../../src/constants/storage-keys.js';

import {
  StorageService
} from '../../src/services/storage-service.js';

import {
  RoomService
} from '../../src/services/room-service.js';

import {
  TenantService
} from '../../src/services/tenant-service.js';

import {
  ContractService
} from '../../src/services/contract-service.js';

function createRoomData(
  overrides = {}
) {
  return {
    id: 'room-business-01',
    code: 'P-BUS-01',
    name: 'Phòng Business 01',
    area: 'Khu A',
    roomType: 'Phòng đơn',
    monthlyRent: 3_000_000,
    maxOccupants: 2,
    status: ROOM_STATUS.VACANT,
    description:
      'Phòng dùng cho business test',
    ...overrides
  };
}

function createTenantData(
  overrides = {}
) {
  return {
    id: 'tenant-business-01',
    fullName: 'Nguyễn Văn An',
    phone: '0901234567',
    identityNumber: '079203001234',
    email: 'an@example.com',
    address: 'Quận Ninh Kiều, Cần Thơ',
    ...overrides
  };
}

function createContractData({
  roomId,
  tenantId,
  ...overrides
}) {
  return {
    id: 'contract-business-01',
    code: 'HD-BUS-01',
    roomId,
    tenantIds: [tenantId],
    representativeTenantId: tenantId,
    startDate: '2026-08-01',
    endDate: '2027-07-31',
    rentAmount: 3_000_000,
    depositAmount: 3_000_000,
    status: CONTRACT_STATUS.DRAFT,
    ...overrides
  };
}

describe(
  'Business flow: tạo phòng, người thuê và kích hoạt hợp đồng',
  () => {
    let storageService;
    let roomService;
    let tenantService;
    let contractService;

    beforeEach(() => {
      /*
       * Dùng thời gian cố định để ngày hiện tại tại
       * múi giờ Việt Nam là 2026-08-03.
       */
      vi.useFakeTimers();

      vi.setSystemTime(
        new Date(
          '2026-08-03T10:00:00.000Z'
        )
      );

      /*
       * Dọn LocalStorage thật của môi trường jsdom
       * trước mỗi test.
       */
      localStorage.clear();

      storageService =
        new StorageService(localStorage);

      roomService =
        new RoomService(storageService);

      tenantService =
        new TenantService(storageService);

      contractService =
        new ContractService(
          storageService,
          roomService
        );
    });

    afterEach(() => {
      localStorage.clear();
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it(
      'tạo phòng trống, tạo người thuê, lập và kích hoạt hợp đồng thành công',
      () => {
        // Arrange và Act: tạo phòng trống
        const createdRoom =
          roomService.createRoom(
            createRoomData()
          );

        expect(createdRoom.status).toBe(
          ROOM_STATUS.VACANT
        );

        // Tạo người thuê
        const createdTenant =
          tenantService.createTenant(
            createTenantData()
          );

        // Lập hợp đồng nháp
        const draftContract =
          contractService.createContract(
            createContractData({
              roomId: createdRoom.id,
              tenantId: createdTenant.id
            })
          );

        // Assert: hợp đồng nháp đã được lưu
        const contractsBeforeActivation =
          JSON.parse(
            localStorage.getItem(
              STORAGE_KEYS.CONTRACTS
            )
          );

        expect(
          contractsBeforeActivation
        ).toHaveLength(1);

        expect(
          contractsBeforeActivation[0]
        ).toMatchObject({
          id: draftContract.id,
          roomId: createdRoom.id,
          status: CONTRACT_STATUS.DRAFT
        });

        expect(
          draftContract.tenantIds
        ).toEqual([createdTenant.id]);

        expect(
          draftContract
            .representativeTenantId
        ).toBe(createdTenant.id);

        // Kích hoạt hợp đồng
        const activatedContract =
          contractService.activateContract(
            draftContract.id
          );

        // Hợp đồng được lưu với trạng thái hiệu lực
        const savedContract =
          contractService.getContractById(
            draftContract.id
          );

        expect(savedContract).not.toBeNull();

        expect(
          activatedContract.status
        ).toBe(CONTRACT_STATUS.ACTIVE);

        expect(savedContract.status).toBe(
          CONTRACT_STATUS.ACTIVE
        );

        expect(savedContract.roomId).toBe(
          createdRoom.id
        );

        expect(savedContract.tenantIds).toEqual(
          [createdTenant.id]
        );

        expect(
          savedContract
            .representativeTenantId
        ).toBe(createdTenant.id);

        // Phòng chuyển từ trống sang đang thuê
        const occupiedRoom =
          roomService.getRoomById(
            createdRoom.id
          );

        expect(occupiedRoom).not.toBeNull();

        expect(occupiedRoom.status).toBe(
          ROOM_STATUS.OCCUPIED
        );

        // Người thuê liên kết đúng với phòng hiện tại
        const tenantCurrentRoom =
          tenantService
            .getCurrentRoomOfTenant(
              createdTenant.id
            );

        expect(
          tenantCurrentRoom.id
        ).toBe(createdRoom.id);

        expect(
          tenantCurrentRoom.status
        ).toBe(ROOM_STATUS.OCCUPIED);

        // Lịch sử thuê có hợp đồng vừa kích hoạt
        const rentalHistory =
          tenantService
            .getTenantRentalHistory(
              createdTenant.id
            );

        expect(rentalHistory).toHaveLength(
          1
        );

        expect(
          rentalHistory[0].contract.id
        ).toBe(savedContract.id);

        expect(
          rentalHistory[0].contract
            .tenantIds
        ).toContain(createdTenant.id);

        expect(
          rentalHistory[0].room.id
        ).toBe(createdRoom.id);

        expect(
          rentalHistory[0].isCurrent
        ).toBe(true);

        // Kiểm tra tình trạng sử dụng phòng
        const occupancy =
          roomService.getRoomOccupancy(
            createdRoom.id
          );

        expect(occupancy).toMatchObject({
          roomId: createdRoom.id,
          status: ROOM_STATUS.OCCUPIED,
          currentOccupants: 1,
          availableSpots: 1,
          isOccupied: true,
          isOverCapacity: false
        });

        expect(
          occupancy.tenantIds
        ).toEqual([createdTenant.id]);

        expect(
          occupancy.activeContractIds
        ).toEqual([savedContract.id]);
      }
    );

    it(
      'không cho tạo hợp đồng trùng thời gian trên cùng một phòng',
      () => {
        // Arrange: dữ liệu độc lập với test trước
        const room =
          roomService.createRoom(
            createRoomData({
              id: 'room-overlap-01',
              code: 'P-OVERLAP-01',
              name: 'Phòng kiểm tra trùng'
            })
          );

        const tenant =
          tenantService.createTenant(
            createTenantData({
              id: 'tenant-overlap-01',
              phone: '0912345678',
              identityNumber:
                '079203001235',
              email:
                'overlap@example.com'
            })
          );

        const firstContract =
          contractService.createContract(
            createContractData({
              roomId: room.id,
              tenantId: tenant.id,

              id: 'contract-overlap-01',
              code: 'HD-OVERLAP-01',
              startDate: '2026-08-01',
              endDate: '2026-12-31'
            })
          );

        const overlappingContractData =
          createContractData({
            roomId: room.id,
            tenantId: tenant.id,

            id: 'contract-overlap-02',
            code: 'HD-OVERLAP-02',
            startDate: '2026-10-01',
            endDate: '2027-02-28'
          });

        // Act và Assert
        expect(() =>
          contractService.createContract(
            overlappingContractData
          )
        ).toThrow(
          '[CONTRACT-06] Phòng đã có hợp đồng trùng thời gian.'
        );

        // Chỉ hợp đồng đầu tiên được lưu
        const savedContracts =
          contractService.getContracts();

        expect(savedContracts).toHaveLength(
          1
        );

        expect(savedContracts[0].id).toBe(
          firstContract.id
        );

        expect(
          contractService.getContractById(
            'contract-overlap-02'
          )
        ).toBeNull();

        /*
         * Hai hợp đồng đều chỉ được lập ở trạng thái nháp,
         * nên phòng vẫn là phòng trống.
         */
        expect(
          roomService.getRoomById(
            room.id
          ).status
        ).toBe(ROOM_STATUS.VACANT);
      }
    );
  }
);