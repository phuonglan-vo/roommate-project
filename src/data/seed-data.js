import {
  CONTRACT_STATUS,
  INVOICE_DOCUMENT_STATUS,
  PAYMENT_STATUS,
  ROOM_STATUS,
  TENANT_STATUS
} from '../constants/statuses.js';

import {
  PAYMENT_METHOD
} from '../constants/payment-methods.js';

const CREATED_AT = '2026-01-01T00:00:00.000Z';
const UPDATED_AT = '2026-08-01T00:00:00.000Z';

/**
 * Đóng băng sâu object để dữ liệu seed không bị thay đổi ngoài ý muốn.
 *
 * @template T
 * @param {T} value Giá trị cần đóng băng.
 * @returns {Readonly<T>}
 */
function deepFreeze(value) {
  if (
    value === null ||
    typeof value !== 'object' ||
    Object.isFrozen(value)
  ) {
    return value;
  }

  Object.values(value).forEach(deepFreeze);

  return Object.freeze(value);
}

const rooms = [
  {
    id: 'room_101',
    code: 'P101',
    name: 'Phòng 101',
    area: 'Dãy A',
    floor: 1,
    roomType: 'standard',
    areaM2: 22,
    monthlyRent: 1800000,
    maxOccupants: 3,
    status: ROOM_STATUS.OCCUPIED,
    description: 'Phòng có cửa sổ hướng Đông.',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'room_102',
    code: 'P102',
    name: 'Phòng 102',
    area: 'Dãy A',
    floor: 1,
    roomType: 'standard',
    areaM2: 24,
    monthlyRent: 2000000,
    maxOccupants: 3,
    status: ROOM_STATUS.OCCUPIED,
    description: 'Phòng gần cổng chính.',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'room_103',
    code: 'P103',
    name: 'Phòng 103',
    area: 'Dãy A',
    floor: 1,
    roomType: 'standard',
    areaM2: 21,
    monthlyRent: 1750000,
    maxOccupants: 2,
    status: ROOM_STATUS.VACANT,
    description: 'Phòng đang trống.',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'room_104',
    code: 'P104',
    name: 'Phòng 104',
    area: 'Dãy A',
    floor: 1,
    roomType: 'large',
    areaM2: 30,
    monthlyRent: 2200000,
    maxOccupants: 4,
    status: ROOM_STATUS.OCCUPIED,
    description: 'Phòng lớn, phù hợp nhóm ba đến bốn người.',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'room_201',
    code: 'P201',
    name: 'Phòng 201',
    area: 'Dãy B',
    floor: 2,
    roomType: 'standard',
    areaM2: 23,
    monthlyRent: 1900000,
    maxOccupants: 3,
    status: ROOM_STATUS.OCCUPIED,
    description: '',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'room_202',
    code: 'P202',
    name: 'Phòng 202',
    area: 'Dãy B',
    floor: 2,
    roomType: 'standard',
    areaM2: 23,
    monthlyRent: 1950000,
    maxOccupants: 3,
    status: ROOM_STATUS.MAINTENANCE,
    description: 'Đang sửa chữa hệ thống nước.',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'room_203',
    code: 'P203',
    name: 'Phòng 203',
    area: 'Dãy B',
    floor: 2,
    roomType: 'large',
    areaM2: 28,
    monthlyRent: 2100000,
    maxOccupants: 4,
    status: ROOM_STATUS.OCCUPIED,
    description: '',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'room_204',
    code: 'P204',
    name: 'Phòng 204',
    area: 'Dãy B',
    floor: 2,
    roomType: 'standard',
    areaM2: 22,
    monthlyRent: 1850000,
    maxOccupants: 2,
    status: ROOM_STATUS.VACANT,
    description: 'Phòng đã vệ sinh và sẵn sàng cho thuê.',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'room_301',
    code: 'P301',
    name: 'Phòng 301',
    area: 'Dãy C',
    floor: 3,
    roomType: 'premium',
    areaM2: 32,
    monthlyRent: 2400000,
    maxOccupants: 3,
    status: ROOM_STATUS.OCCUPIED,
    description: 'Phòng có ban công.',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'room_302',
    code: 'P302',
    name: 'Phòng 302',
    area: 'Dãy C',
    floor: 3,
    roomType: 'premium',
    areaM2: 35,
    monthlyRent: 2600000,
    maxOccupants: 3,
    status: ROOM_STATUS.OCCUPIED,
    description: 'Phòng mới đưa vào sử dụng.',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  }
];

const tenants = [
  {
    id: 'tenant_01',
    fullName: 'Nguyễn Văn An',
    dateOfBirth: '2001-03-12',
    gender: 'male',
    identityNumber: '092201000001',
    phone: '0901000001',
    email: 'an.nguyen@example.com',
    permanentAddress: 'Ninh Kiều, Cần Thơ',
    occupation: 'Nhân viên văn phòng',
    vehiclePlate: '65B1-101.01',
    emergencyContact: {
      name: 'Nguyễn Văn Bình',
      phone: '0909000001',
      relationship: 'Anh trai'
    },
    status: TENANT_STATUS.ACTIVE,
    note: '',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'tenant_02',
    fullName: 'Trần Thị Bích',
    dateOfBirth: '2002-05-18',
    gender: 'female',
    identityNumber: '092202000002',
    phone: '0901000002',
    email: 'bich.tran@example.com',
    permanentAddress: 'Bình Thủy, Cần Thơ',
    occupation: 'Sinh viên',
    vehiclePlate: '',
    emergencyContact: {
      name: 'Trần Văn Minh',
      phone: '0909000002',
      relationship: 'Cha'
    },
    status: TENANT_STATUS.ACTIVE,
    note: '',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'tenant_03',
    fullName: 'Lê Quốc Cường',
    dateOfBirth: '1999-11-02',
    gender: 'male',
    identityNumber: '092199000003',
    phone: '0901000003',
    email: 'cuong.le@example.com',
    permanentAddress: 'Ô Môn, Cần Thơ',
    occupation: 'Kỹ thuật viên',
    vehiclePlate: '65F1-102.02',
    emergencyContact: {
      name: 'Lê Thị Hoa',
      phone: '0909000003',
      relationship: 'Mẹ'
    },
    status: TENANT_STATUS.ACTIVE,
    note: '',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'tenant_04',
    fullName: 'Phạm Ngọc Dung',
    dateOfBirth: '2000-08-09',
    gender: 'female',
    identityNumber: '092200000004',
    phone: '0901000004',
    email: 'dung.pham@example.com',
    permanentAddress: 'Cái Răng, Cần Thơ',
    occupation: 'Kế toán',
    vehiclePlate: '',
    emergencyContact: {
      name: 'Phạm Quốc Dũng',
      phone: '0909000004',
      relationship: 'Anh trai'
    },
    status: TENANT_STATUS.ACTIVE,
    note: '',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'tenant_05',
    fullName: 'Võ Minh Đức',
    dateOfBirth: '1998-02-20',
    gender: 'male',
    identityNumber: '092198000005',
    phone: '0901000005',
    email: 'duc.vo@example.com',
    permanentAddress: 'Thốt Nốt, Cần Thơ',
    occupation: 'Lập trình viên',
    vehiclePlate: '65H1-104.01',
    emergencyContact: {
      name: 'Võ Văn Nam',
      phone: '0909000005',
      relationship: 'Cha'
    },
    status: TENANT_STATUS.ACTIVE,
    note: '',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'tenant_06',
    fullName: 'Đặng Thị Hạnh',
    dateOfBirth: '2001-07-16',
    gender: 'female',
    identityNumber: '092201000006',
    phone: '0901000006',
    email: 'hanh.dang@example.com',
    permanentAddress: 'Phong Điền, Cần Thơ',
    occupation: 'Giáo viên',
    vehiclePlate: '65G1-104.02',
    emergencyContact: {
      name: 'Đặng Văn Phúc',
      phone: '0909000006',
      relationship: 'Cha'
    },
    status: TENANT_STATUS.ACTIVE,
    note: '',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'tenant_07',
    fullName: 'Bùi Thanh Hà',
    dateOfBirth: '2002-09-25',
    gender: 'female',
    identityNumber: '092202000007',
    phone: '0901000007',
    email: 'ha.bui@example.com',
    permanentAddress: 'Vĩnh Thạnh, Cần Thơ',
    occupation: 'Sinh viên',
    vehiclePlate: '',
    emergencyContact: {
      name: 'Bùi Văn Thành',
      phone: '0909000007',
      relationship: 'Cha'
    },
    status: TENANT_STATUS.ACTIVE,
    note: '',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'tenant_08',
    fullName: 'Ngô Gia Huy',
    dateOfBirth: '1997-12-14',
    gender: 'male',
    identityNumber: '092197000008',
    phone: '0901000008',
    email: 'huy.ngo@example.com',
    permanentAddress: 'Long Hồ, Vĩnh Long',
    occupation: 'Nhân viên kinh doanh',
    vehiclePlate: '64B1-201.01',
    emergencyContact: {
      name: 'Ngô Thị Lan',
      phone: '0909000008',
      relationship: 'Mẹ'
    },
    status: TENANT_STATUS.ACTIVE,
    note: '',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'tenant_09',
    fullName: 'Huỳnh Khánh Linh',
    dateOfBirth: '2000-04-30',
    gender: 'female',
    identityNumber: '092200000009',
    phone: '0901000009',
    email: 'linh.huynh@example.com',
    permanentAddress: 'Tam Bình, Vĩnh Long',
    occupation: 'Dược sĩ',
    vehiclePlate: '',
    emergencyContact: {
      name: 'Huỳnh Văn Khánh',
      phone: '0909000009',
      relationship: 'Cha'
    },
    status: TENANT_STATUS.ACTIVE,
    note: '',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'tenant_10',
    fullName: 'Đỗ Hoàng Nam',
    dateOfBirth: '1999-01-05',
    gender: 'male',
    identityNumber: '092199000010',
    phone: '0901000010',
    email: 'nam.do@example.com',
    permanentAddress: 'Châu Thành, Hậu Giang',
    occupation: 'Nhân viên ngân hàng',
    vehiclePlate: '95B1-203.01',
    emergencyContact: {
      name: 'Đỗ Thị Hồng',
      phone: '0909000010',
      relationship: 'Mẹ'
    },
    status: TENANT_STATUS.ACTIVE,
    note: '',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'tenant_11',
    fullName: 'Dương Thảo Nguyên',
    dateOfBirth: '2001-06-23',
    gender: 'female',
    identityNumber: '092201000011',
    phone: '0901000011',
    email: 'nguyen.duong@example.com',
    permanentAddress: 'Ngã Bảy, Hậu Giang',
    occupation: 'Thiết kế đồ họa',
    vehiclePlate: '',
    emergencyContact: {
      name: 'Dương Văn Hải',
      phone: '0909000011',
      relationship: 'Cha'
    },
    status: TENANT_STATUS.ACTIVE,
    note: '',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'tenant_12',
    fullName: 'Mai Thành Phúc',
    dateOfBirth: '1996-10-11',
    gender: 'male',
    identityNumber: '092196000012',
    phone: '0901000012',
    email: 'phuc.mai@example.com',
    permanentAddress: 'Sóc Trăng',
    occupation: 'Kỹ sư xây dựng',
    vehiclePlate: '83P1-301.01',
    emergencyContact: {
      name: 'Mai Thị Ngọc',
      phone: '0909000012',
      relationship: 'Chị gái'
    },
    status: TENANT_STATUS.ACTIVE,
    note: '',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'tenant_13',
    fullName: 'Tạ Minh Quân',
    dateOfBirth: '2000-03-08',
    gender: 'male',
    identityNumber: '092200000013',
    phone: '0901000013',
    email: 'quan.ta@example.com',
    permanentAddress: 'Bạc Liêu',
    occupation: 'Chuyên viên marketing',
    vehiclePlate: '94K1-302.01',
    emergencyContact: {
      name: 'Tạ Văn Minh',
      phone: '0909000013',
      relationship: 'Cha'
    },
    status: TENANT_STATUS.ACTIVE,
    note: '',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'tenant_14',
    fullName: 'Lâm Yến Trang',
    dateOfBirth: '2002-12-19',
    gender: 'female',
    identityNumber: '092202000014',
    phone: '0901000014',
    email: 'trang.lam@example.com',
    permanentAddress: 'Kiên Giang',
    occupation: 'Sinh viên',
    vehiclePlate: '',
    emergencyContact: {
      name: 'Lâm Thị Yến',
      phone: '0909000014',
      relationship: 'Mẹ'
    },
    status: TENANT_STATUS.ACTIVE,
    note: '',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  },
  {
    id: 'tenant_15',
    fullName: 'Phan Quốc Việt',
    dateOfBirth: '1998-09-01',
    gender: 'male',
    identityNumber: '092198000015',
    phone: '0901000015',
    email: 'viet.phan@example.com',
    permanentAddress: 'An Giang',
    occupation: 'Nhân viên kỹ thuật',
    vehiclePlate: '',
    emergencyContact: {
      name: 'Phan Văn Quốc',
      phone: '0909000015',
      relationship: 'Cha'
    },
    status: TENANT_STATUS.INACTIVE,
    note: 'Đã kết thúc hợp đồng và rời phòng.',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
  }
];

const contracts = [
  {
    id: 'contract_01',
    code: 'HD-P101-2026-01',
    roomId: 'room_101',
    tenantIds: ['tenant_01', 'tenant_02'],
    representativeTenantId: 'tenant_01',
    signedDate: '2025-12-28',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    rentAmount: 1800000,
    depositAmount: 1800000,
    billingCycle: 'monthly',
    dueDay: 10,
    status: CONTRACT_STATUS.ACTIVE,
    terms: 'Thanh toán trước ngày 10 hằng tháng.',
    note: '',
    createdAt: '2025-12-28T03:00:00.000Z',
    updatedAt: UPDATED_AT
  },
  {
    id: 'contract_02',
    code: 'HD-P102-2026-01',
    roomId: 'room_102',
    tenantIds: ['tenant_03', 'tenant_04'],
    representativeTenantId: 'tenant_03',
    signedDate: '2026-01-25',
    startDate: '2026-02-01',
    endDate: '2027-01-31',
    rentAmount: 2000000,
    depositAmount: 2000000,
    billingCycle: 'monthly',
    dueDay: 10,
    status: CONTRACT_STATUS.ACTIVE,
    terms: 'Thanh toán trước ngày 10 hằng tháng.',
    note: '',
    createdAt: '2026-01-25T03:00:00.000Z',
    updatedAt: UPDATED_AT
  },
  {
    id: 'contract_03',
    code: 'HD-P104-2026-01',
    roomId: 'room_104',
    tenantIds: ['tenant_05', 'tenant_06', 'tenant_07'],
    representativeTenantId: 'tenant_05',
    signedDate: '2026-02-25',
    startDate: '2026-03-01',
    endDate: '2027-02-28',
    rentAmount: 2200000,
    depositAmount: 2200000,
    billingCycle: 'monthly',
    dueDay: 10,
    status: CONTRACT_STATUS.ACTIVE,
    terms: 'Thanh toán trước ngày 10 hằng tháng.',
    note: '',
    createdAt: '2026-02-25T03:00:00.000Z',
    updatedAt: UPDATED_AT
  },
  {
    id: 'contract_04',
    code: 'HD-P201-2026-01',
    roomId: 'room_201',
    tenantIds: ['tenant_08', 'tenant_09'],
    representativeTenantId: 'tenant_08',
    signedDate: '2026-03-28',
    startDate: '2026-04-01',
    endDate: '2026-10-31',
    rentAmount: 1900000,
    depositAmount: 1900000,
    billingCycle: 'monthly',
    dueDay: 10,
    status: CONTRACT_STATUS.ACTIVE,
    terms: 'Thanh toán trước ngày 10 hằng tháng.',
    note: '',
    createdAt: '2026-03-28T03:00:00.000Z',
    updatedAt: UPDATED_AT
  },
  {
    id: 'contract_05',
    code: 'HD-P203-2026-01',
    roomId: 'room_203',
    tenantIds: ['tenant_10', 'tenant_11'],
    representativeTenantId: 'tenant_10',
    signedDate: '2026-04-25',
    startDate: '2026-05-01',
    endDate: '2026-08-20',
    rentAmount: 2100000,
    depositAmount: 2100000,
    billingCycle: 'monthly',
    dueDay: 10,
    status: CONTRACT_STATUS.ACTIVE,
    terms: 'Thanh toán trước ngày 10 hằng tháng.',
    note: 'Hợp đồng sắp hết hạn.',
    createdAt: '2026-04-25T03:00:00.000Z',
    updatedAt: UPDATED_AT
  },
  {
    id: 'contract_06',
    code: 'HD-P301-2026-01',
    roomId: 'room_301',
    tenantIds: ['tenant_12'],
    representativeTenantId: 'tenant_12',
    signedDate: '2026-05-28',
    startDate: '2026-06-01',
    endDate: '2026-12-31',
    rentAmount: 2400000,
    depositAmount: 2400000,
    billingCycle: 'monthly',
    dueDay: 10,
    status: CONTRACT_STATUS.ACTIVE,
    terms: 'Thanh toán trước ngày 10 hằng tháng.',
    note: '',
    createdAt: '2026-05-28T03:00:00.000Z',
    updatedAt: UPDATED_AT
  },
  {
    id: 'contract_07',
    code: 'HD-P302-2026-01',
    roomId: 'room_302',
    tenantIds: ['tenant_13', 'tenant_14'],
    representativeTenantId: 'tenant_13',
    signedDate: '2026-06-28',
    startDate: '2026-07-01',
    endDate: '2027-06-30',
    rentAmount: 2600000,
    depositAmount: 2600000,
    billingCycle: 'monthly',
    dueDay: 10,
    status: CONTRACT_STATUS.ACTIVE,
    terms: 'Thanh toán trước ngày 10 hằng tháng.',
    note: '',
    createdAt: '2026-06-28T03:00:00.000Z',
    updatedAt: UPDATED_AT
  },
  {
    id: 'contract_08',
    code: 'HD-P103-2026-01',
    roomId: 'room_103',
    tenantIds: ['tenant_15'],
    representativeTenantId: 'tenant_15',
    signedDate: '2025-12-20',
    startDate: '2026-01-01',
    endDate: '2026-04-30',
    rentAmount: 1750000,
    depositAmount: 1750000,
    billingCycle: 'monthly',
    dueDay: 10,
    status: CONTRACT_STATUS.ENDED,
    terms: 'Thanh toán trước ngày 10 hằng tháng.',
    note: 'Hợp đồng đã kết thúc.',
    createdAt: '2025-12-20T03:00:00.000Z',
    updatedAt: '2026-04-30T10:00:00.000Z'
  }
];

const meterSeries = [
  {
    roomId: 'room_101',
    periods: [
      ['2026-05', '2026-05-31', 1000, 1078, 180, 185],
      ['2026-06', '2026-06-30', 1078, 1163, 185, 191],
      ['2026-07', '2026-07-31', 1163, 1255, 191, 198]
    ]
  },
  {
    roomId: 'room_102',
    periods: [
      ['2026-05', '2026-05-31', 2000, 2090, 300, 306],
      ['2026-06', '2026-06-30', 2090, 2188, 306, 313],
      ['2026-07', '2026-07-31', 2188, 2293, 313, 321]
    ]
  },
  {
    roomId: 'room_104',
    periods: [
      ['2026-05', '2026-05-31', 500, 620, 100, 109],
      ['2026-06', '2026-06-30', 620, 750, 109, 118],
      ['2026-07', '2026-07-31', 750, 890, 118, 128]
    ]
  },
  {
    roomId: 'room_201',
    periods: [
      ['2026-05', '2026-05-31', 800, 875, 140, 145],
      ['2026-06', '2026-06-30', 875, 957, 145, 150],
      ['2026-07', '2026-07-31', 957, 1045, 150, 156]
    ]
  },
  {
    roomId: 'room_203',
    periods: [
      ['2026-05', '2026-05-31', 1500, 1595, 250, 257],
      ['2026-06', '2026-06-30', 1595, 1698, 257, 264],
      ['2026-07', '2026-07-31', 1698, 1808, 264, 272]
    ]
  },
  {
    roomId: 'room_301',
    periods: [
      ['2026-05', '2026-05-31', 300, 365, 70, 74],
      ['2026-06', '2026-06-30', 365, 435, 74, 79],
      ['2026-07', '2026-07-31', 435, 510, 79, 84]
    ]
  },
  {
    roomId: 'room_302',
    periods: [
      ['2026-05', '2026-05-31', 0, 0, 0, 0],
      ['2026-06', '2026-06-30', 0, 0, 0, 0],
      ['2026-07', '2026-07-31', 0, 60, 0, 4]
    ]
  }
];

/**
 * Tạo danh sách chỉ số điện nước từ cấu hình ba tháng.
 *
 * @returns {object[]}
 */
function createMeterReadings() {
  return meterSeries.flatMap(({ roomId, periods }) =>
    periods.map(
      ([
        period,
        readingDate,
        electricityPrevious,
        electricityCurrent,
        waterPrevious,
        waterCurrent
      ]) => ({
        id: `reading_${roomId}_${period}`,
        roomId,
        period,
        readingDate,
        electricityPrevious,
        electricityCurrent,
        waterPrevious,
        waterCurrent,
        recordedBy: 'Quản lý nhà trọ',
        lockedByInvoiceId: null,
        note: '',
        createdAt: `${readingDate}T02:00:00.000Z`,
        updatedAt: `${readingDate}T02:00:00.000Z`
      })
    )
  );
}

const meterReadings = createMeterReadings();

const serviceConfigs = [
  {
    id: 'service_electricity',
    code: 'DIEN',
    name: 'Tiền điện',
    unit: 'kwh',
    calculationType: 'metered_electricity',
    prices: [
      {
        id: 'price_electricity_2026',
        unitPrice: 3500,
        effectiveFrom: '2026-01-01',
        effectiveTo: null
      }
    ],
    isActive: true,
    description: 'Tính theo điện năng tiêu thụ.',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT
  },
  {
    id: 'service_water',
    code: 'NUOC',
    name: 'Tiền nước',
    unit: 'm3',
    calculationType: 'metered_water',
    prices: [
      {
        id: 'price_water_2026',
        unitPrice: 18000,
        effectiveFrom: '2026-01-01',
        effectiveTo: null
      }
    ],
    isActive: true,
    description: 'Tính theo lượng nước tiêu thụ.',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT
  },
  {
    id: 'service_internet',
    code: 'INTERNET',
    name: 'Internet',
    unit: 'room',
    calculationType: 'per_room',
    prices: [
      {
        id: 'price_internet_2026',
        unitPrice: 100000,
        effectiveFrom: '2026-01-01',
        effectiveTo: null
      }
    ],
    isActive: true,
    description: 'Phí Internet cố định theo phòng.',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT
  },
  {
    id: 'service_garbage',
    code: 'RAC',
    name: 'Phí rác',
    unit: 'room',
    calculationType: 'per_room',
    prices: [
      {
        id: 'price_garbage_2026',
        unitPrice: 30000,
        effectiveFrom: '2026-01-01',
        effectiveTo: null
      }
    ],
    isActive: true,
    description: 'Phí thu gom rác theo phòng.',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT
  },
  {
    id: 'service_parking',
    code: 'GIUXE',
    name: 'Phí giữ xe',
    unit: 'vehicle',
    calculationType: 'manual_quantity',
    prices: [
      {
        id: 'price_parking_2026',
        unitPrice: 100000,
        effectiveFrom: '2026-01-01',
        effectiveTo: null
      }
    ],
    isActive: true,
    description: 'Tính theo số lượng xe.',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT
  },
  {
    id: 'service_management',
    code: 'QUANLY',
    name: 'Phí quản lý',
    unit: 'room',
    calculationType: 'per_room',
    prices: [
      {
        id: 'price_management_2026',
        unitPrice: 50000,
        effectiveFrom: '2026-01-01',
        effectiveTo: null
      }
    ],
    isActive: true,
    description: 'Phí quản lý khu trọ.',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT
  }
];

const roomById = new Map(
  rooms.map((room) => [room.id, room])
);

const tenantById = new Map(
  tenants.map((tenant) => [tenant.id, tenant])
);

const contractById = new Map(
  contracts.map((contract) => [contract.id, contract])
);

const SERVICE_PRICES = Object.freeze({
  electricity: 3500,
  water: 18000,
  internet: 100000,
  garbage: 30000,
  parking: 100000
});

/**
 * Tạo một dòng hóa đơn.
 *
 * @param {object} params Thông tin dòng hóa đơn.
 * @returns {object}
 */
function createInvoiceItem({
  invoiceId,
  suffix,
  type,
  serviceConfigId,
  sourceType,
  sourceId,
  description,
  quantity,
  unit,
  unitPrice
}) {
  return {
    id: `${invoiceId}_item_${suffix}`,
    type,
    serviceConfigId,
    sourceType,
    sourceId,
    description,
    quantity,
    unit,
    unitPrice,
    amount: quantity * unitPrice
  };
}

/**
 * Tạo hóa đơn mẫu và tự tính tổng tiền.
 *
 * @param {object} params Thông tin hóa đơn.
 * @returns {object}
 */
function createInvoice({
  id,
  code,
  contractId,
  period,
  meterPeriod,
  issueDate,
  dueDate,
  electricityUsage,
  waterUsage,
  parkingQuantity = 1
}) {
  const contract = contractById.get(contractId);
  const room = roomById.get(contract.roomId);
  const payer = tenantById.get(
    contract.representativeTenantId
  );

  const meterReadingId =
    `reading_${room.id}_${meterPeriod}`;

  const monthLabel = `${period.slice(5, 7)}/${period.slice(0, 4)}`;

  const items = [
    createInvoiceItem({
      invoiceId: id,
      suffix: 'rent',
      type: 'rent',
      serviceConfigId: null,
      sourceType: 'contract',
      sourceId: contract.id,
      description: `Tiền phòng tháng ${monthLabel}`,
      quantity: 1,
      unit: 'month',
      unitPrice: contract.rentAmount
    }),
    createInvoiceItem({
      invoiceId: id,
      suffix: 'electricity',
      type: 'electricity',
      serviceConfigId: 'service_electricity',
      sourceType: 'meterReading',
      sourceId: meterReadingId,
      description: `Tiền điện tháng ${monthLabel}`,
      quantity: electricityUsage,
      unit: 'kwh',
      unitPrice: SERVICE_PRICES.electricity
    }),
    createInvoiceItem({
      invoiceId: id,
      suffix: 'water',
      type: 'water',
      serviceConfigId: 'service_water',
      sourceType: 'meterReading',
      sourceId: meterReadingId,
      description: `Tiền nước tháng ${monthLabel}`,
      quantity: waterUsage,
      unit: 'm3',
      unitPrice: SERVICE_PRICES.water
    }),
    createInvoiceItem({
      invoiceId: id,
      suffix: 'internet',
      type: 'service',
      serviceConfigId: 'service_internet',
      sourceType: 'serviceConfig',
      sourceId: 'service_internet',
      description: `Internet tháng ${monthLabel}`,
      quantity: 1,
      unit: 'room',
      unitPrice: SERVICE_PRICES.internet
    }),
    createInvoiceItem({
      invoiceId: id,
      suffix: 'garbage',
      type: 'service',
      serviceConfigId: 'service_garbage',
      sourceType: 'serviceConfig',
      sourceId: 'service_garbage',
      description: `Phí rác tháng ${monthLabel}`,
      quantity: 1,
      unit: 'room',
      unitPrice: SERVICE_PRICES.garbage
    }),
    createInvoiceItem({
      invoiceId: id,
      suffix: 'parking',
      type: 'service',
      serviceConfigId: 'service_parking',
      sourceType: 'serviceConfig',
      sourceId: 'service_parking',
      description: `Phí giữ xe tháng ${monthLabel}`,
      quantity: parkingQuantity,
      unit: 'vehicle',
      unitPrice: SERVICE_PRICES.parking
    })
  ];

  const subtotal = items.reduce(
    (total, item) => total + item.amount,
    0
  );

  return {
    id,
    code,
    contractId: contract.id,
    roomId: room.id,
    meterReadingId,
    period,
    issueDate,
    dueDate,
    documentStatus: INVOICE_DOCUMENT_STATUS.ISSUED,
    roomSnapshot: {
      code: room.code,
      name: room.name,
      area: room.area
    },
    payerSnapshot: {
      tenantId: payer.id,
      fullName: payer.fullName,
      phone: payer.phone
    },
    items,
    subtotal,
    discountAmount: 0,
    surchargeAmount: 0,
    totalAmount: subtotal,
    note: '',
    cancelledAt: null,
    cancelReason: '',
    createdAt: `${issueDate}T02:00:00.000Z`,
    updatedAt: `${issueDate}T02:00:00.000Z`
  };
}

const invoices = [
  createInvoice({
    id: 'invoice_01',
    code: 'INV-P101-2026-07',
    contractId: 'contract_01',
    period: '2026-07',
    meterPeriod: '2026-07',
    issueDate: '2026-07-02',
    dueDate: '2026-07-10',
    electricityUsage: 92,
    waterUsage: 7,
    parkingQuantity: 1
  }),
  createInvoice({
    id: 'invoice_02',
    code: 'INV-P102-2026-07',
    contractId: 'contract_02',
    period: '2026-07',
    meterPeriod: '2026-07',
    issueDate: '2026-07-02',
    dueDate: '2026-07-10',
    electricityUsage: 105,
    waterUsage: 8,
    parkingQuantity: 1
  }),
  createInvoice({
    id: 'invoice_03',
    code: 'INV-P104-2026-07',
    contractId: 'contract_03',
    period: '2026-07',
    meterPeriod: '2026-07',
    issueDate: '2026-07-02',
    dueDate: '2026-07-10',
    electricityUsage: 140,
    waterUsage: 10,
    parkingQuantity: 2
  }),
  createInvoice({
    id: 'invoice_04',
    code: 'INV-P201-2026-07',
    contractId: 'contract_04',
    period: '2026-07',
    meterPeriod: '2026-07',
    issueDate: '2026-07-02',
    dueDate: '2026-07-10',
    electricityUsage: 88,
    waterUsage: 6,
    parkingQuantity: 1
  }),
  createInvoice({
    id: 'invoice_05',
    code: 'INV-P203-2026-07',
    contractId: 'contract_05',
    period: '2026-07',
    meterPeriod: '2026-07',
    issueDate: '2026-08-01',
    dueDate: '2026-08-10',
    electricityUsage: 110,
    waterUsage: 8,
    parkingQuantity: 1
  }),
  createInvoice({
    id: 'invoice_06',
    code: 'INV-P301-2026-07',
    contractId: 'contract_06',
    period: '2026-07',
    meterPeriod: '2026-07',
    issueDate: '2026-07-02',
    dueDate: '2026-07-10',
    electricityUsage: 75,
    waterUsage: 5,
    parkingQuantity: 1
  }),
  createInvoice({
    id: 'invoice_07',
    code: 'INV-P302-2026-07',
    contractId: 'contract_07',
    period: '2026-07',
    meterPeriod: '2026-07',
    issueDate: '2026-08-01',
    dueDate: '2026-08-10',
    electricityUsage: 60,
    waterUsage: 4,
    parkingQuantity: 1
  }),
  createInvoice({
    id: 'invoice_08',
    code: 'INV-P101-2026-06',
    contractId: 'contract_01',
    period: '2026-06',
    meterPeriod: '2026-06',
    issueDate: '2026-06-30',
    dueDate: '2026-07-10',
    electricityUsage: 85,
    waterUsage: 6,
    parkingQuantity: 1
  }),
  createInvoice({
    id: 'invoice_09',
    code: 'INV-P102-2026-06',
    contractId: 'contract_02',
    period: '2026-06',
    meterPeriod: '2026-06',
    issueDate: '2026-06-30',
    dueDate: '2026-07-10',
    electricityUsage: 98,
    waterUsage: 7,
    parkingQuantity: 1
  }),
  createInvoice({
    id: 'invoice_10',
    code: 'INV-P201-2026-06',
    contractId: 'contract_04',
    period: '2026-06',
    meterPeriod: '2026-06',
    issueDate: '2026-06-30',
    dueDate: '2026-07-10',
    electricityUsage: 82,
    waterUsage: 5,
    parkingQuantity: 1
  })
];

const payments = [
  {
    id: 'payment_01',
    invoiceId: 'invoice_01',
    amount: 2478000,
    paidAt: '2026-07-05T03:00:00.000Z',
    method: PAYMENT_METHOD.BANK_TRANSFER,
    transactionCode: 'FT260705000001',
    collectedBy: 'Quản lý nhà trọ',
    status: PAYMENT_STATUS.COMPLETED,
    note: 'Thanh toán đủ hóa đơn tháng 07/2026.',
    voidedAt: null,
    voidReason: '',
    createdAt: '2026-07-05T03:01:00.000Z',
    updatedAt: '2026-07-05T03:01:00.000Z'
  },
  {
    id: 'payment_02',
    invoiceId: 'invoice_02',
    amount: 1000000,
    paidAt: '2026-07-08T03:00:00.000Z',
    method: PAYMENT_METHOD.CASH,
    transactionCode: '',
    collectedBy: 'Quản lý nhà trọ',
    status: PAYMENT_STATUS.COMPLETED,
    note: 'Thanh toán một phần.',
    voidedAt: null,
    voidReason: '',
    createdAt: '2026-07-08T03:01:00.000Z',
    updatedAt: '2026-07-08T03:01:00.000Z'
  },
  {
    id: 'payment_03',
    invoiceId: 'invoice_04',
    amount: 1500000,
    paidAt: '2026-07-06T03:00:00.000Z',
    method: PAYMENT_METHOD.BANK_TRANSFER,
    transactionCode: 'FT260706000003',
    collectedBy: 'Quản lý nhà trọ',
    status: PAYMENT_STATUS.COMPLETED,
    note: 'Thanh toán lần một.',
    voidedAt: null,
    voidReason: '',
    createdAt: '2026-07-06T03:01:00.000Z',
    updatedAt: '2026-07-06T03:01:00.000Z'
  },
  {
    id: 'payment_04',
    invoiceId: 'invoice_04',
    amount: 1046000,
    paidAt: '2026-07-09T03:00:00.000Z',
    method: PAYMENT_METHOD.CASH,
    transactionCode: '',
    collectedBy: 'Quản lý nhà trọ',
    status: PAYMENT_STATUS.COMPLETED,
    note: 'Thanh toán phần còn lại.',
    voidedAt: null,
    voidReason: '',
    createdAt: '2026-07-09T03:01:00.000Z',
    updatedAt: '2026-07-09T03:01:00.000Z'
  },
  {
    id: 'payment_05',
    invoiceId: 'invoice_06',
    amount: 2982500,
    paidAt: '2026-07-08T04:00:00.000Z',
    method: PAYMENT_METHOD.BANK_TRANSFER,
    transactionCode: 'FT260708000005',
    collectedBy: 'Quản lý nhà trọ',
    status: PAYMENT_STATUS.COMPLETED,
    note: 'Thanh toán đủ.',
    voidedAt: null,
    voidReason: '',
    createdAt: '2026-07-08T04:01:00.000Z',
    updatedAt: '2026-07-08T04:01:00.000Z'
  },
  {
    id: 'payment_06',
    invoiceId: 'invoice_07',
    amount: 1000000,
    paidAt: '2026-08-02T02:00:00.000Z',
    method: PAYMENT_METHOD.E_WALLET,
    transactionCode: 'EW260802000006',
    collectedBy: 'Quản lý nhà trọ',
    status: PAYMENT_STATUS.COMPLETED,
    note: 'Thanh toán một phần.',
    voidedAt: null,
    voidReason: '',
    createdAt: '2026-08-02T02:01:00.000Z',
    updatedAt: '2026-08-02T02:01:00.000Z'
  },
  {
    id: 'payment_07',
    invoiceId: 'invoice_09',
    amount: 1500000,
    paidAt: '2026-07-04T03:00:00.000Z',
    method: PAYMENT_METHOD.CASH,
    transactionCode: '',
    collectedBy: 'Quản lý nhà trọ',
    status: PAYMENT_STATUS.COMPLETED,
    note: 'Thanh toán lần một.',
    voidedAt: null,
    voidReason: '',
    createdAt: '2026-07-04T03:01:00.000Z',
    updatedAt: '2026-07-04T03:01:00.000Z'
  },
  {
    id: 'payment_08',
    invoiceId: 'invoice_09',
    amount: 1199000,
    paidAt: '2026-07-07T03:00:00.000Z',
    method: PAYMENT_METHOD.BANK_TRANSFER,
    transactionCode: 'FT260707000008',
    collectedBy: 'Quản lý nhà trọ',
    status: PAYMENT_STATUS.COMPLETED,
    note: 'Thanh toán phần còn lại.',
    voidedAt: null,
    voidReason: '',
    createdAt: '2026-07-07T03:01:00.000Z',
    updatedAt: '2026-07-07T03:01:00.000Z'
  }
];

/*
 * Khóa các bản ghi chỉ số đã được hóa đơn sử dụng.
 */
const invoiceIdByReadingId = new Map(
  invoices.map((invoice) => [
    invoice.meterReadingId,
    invoice.id
  ])
);

meterReadings.forEach((reading) => {
  const invoiceId = invoiceIdByReadingId.get(reading.id);

  if (invoiceId) {
    reading.lockedByInvoiceId = invoiceId;
    reading.updatedAt = UPDATED_AT;
  }
});

const appSettings = {
  schemaVersion: '1.0.0',
  appName: 'RoomMate',
  property: {
    name: 'Nhà trọ RoomMate',
    ownerName: 'Trần Văn Minh',
    phone: '0987654321',
    email: 'quanly@roommate.example',
    address: 'Ninh Kiều, Cần Thơ'
  },
  currency: 'VND',
  locale: 'vi-VN',
  timezone: 'Asia/Ho_Chi_Minh',
  defaultInvoiceDueDays: 8,
  contractExpiryWarningDays: 30,
  abnormalUsageThresholdPercent: 50,
  allowOverpayment: false,
  moneyRoundingMode: 'none',
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT
};

/**
 * Toàn bộ dữ liệu mẫu của RoomMate.
 *
 * Các trạng thái hóa đơn được xác định từ dữ liệu:
 *
 * - Đã thanh toán: invoice_01, invoice_04, invoice_06, invoice_09.
 * - Thanh toán một phần: invoice_02, invoice_07.
 * - Chưa thanh toán: invoice_03, invoice_05, invoice_08, invoice_10.
 * - Quá hạn: invoice_02, invoice_03, invoice_08, invoice_10.
 */
export const SEED_DATA = deepFreeze({
  rooms,
  tenants,
  contracts,
  meterReadings,
  serviceConfigs,
  invoices,
  payments,
  appSettings
});

export default SEED_DATA;