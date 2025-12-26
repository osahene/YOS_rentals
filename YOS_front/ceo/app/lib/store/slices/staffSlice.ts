// lib/store/slices/staffSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Staff {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  department: string;
  role: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  salary: number;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'intern';
  shift: 'morning' | 'evening' | 'night' | 'flexible';
  permissions: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  documents: {
    idProof: string;
    addressProof: string;
    contract: string;
  };
  performance: {
    rating: number;
    lastReview: string;
    notes: string;
  };
}

interface StaffState {
  staff: Staff[];
  selectedStaff: Staff | null;
  loading: boolean;
  error: string | null;
  filters: {
    department: string;
    status: string;
    employmentType: string;
  };
}

const initialState: StaffState = {
  staff: [
    {
      id: '1',
      employeeId: 'EMP001',
      name: 'John Manager',
      email: 'john.manager@driveon.com',
      phone: '+1 234 567 8901',
      address: '123 Admin St, City',
      department: 'Operations',
      role: 'Transport Manager',
      joinDate: '2022-03-15',
      status: 'active',
      salary: 55000,
      employmentType: 'full_time',
      shift: 'morning',
      permissions: ['manage_bookings', 'manage_cars', 'view_reports', 'manage_staff'],
      emergencyContact: {
        name: 'Jane Manager',
        phone: '+1 234 567 8999',
        relationship: 'Spouse',
      },
      documents: {
        idProof: 'uploaded',
        addressProof: 'uploaded',
        contract: 'uploaded',
      },
      performance: {
        rating: 4.7,
        lastReview: '2023-09-15',
        notes: 'Excellent leadership skills',
      },
    },
    {
      id: '2',
      employeeId: 'EMP002',
      name: 'Sarah Driver',
      email: 'sarah.driver@driveon.com',
      phone: '+1 234 567 8902',
      address: '456 Driver Ave, Town',
      department: 'Operations',
      role: 'Driver',
      joinDate: '2023-01-20',
      status: 'active',
      salary: 35000,
      employmentType: 'full_time',
      shift: 'flexible',
      permissions: ['drive_cars', 'view_schedule', 'report_issues'],
      emergencyContact: {
        name: 'Mike Driver',
        phone: '+1 234 567 8998',
        relationship: 'Spouse',
      },
      documents: {
        idProof: 'uploaded',
        addressProof: 'uploaded',
        contract: 'uploaded',
      },
      performance: {
        rating: 4.5,
        lastReview: '2023-10-01',
        notes: 'Safe driver, excellent customer service',
      },
    },
    {
      id: '3',
      employeeId: 'EMP003',
      name: 'Mark Finance',
      email: 'mark.finance@driveon.com',
      phone: '+1 234 567 8903',
      address: '789 Finance Rd, Village',
      department: 'Finance',
      role: 'Finance Officer',
      joinDate: '2022-08-10',
      status: 'active',
      salary: 48000,
      employmentType: 'full_time',
      shift: 'morning',
      permissions: ['manage_payments', 'view_reports', 'generate_invoices'],
      emergencyContact: {
        name: 'Lisa Finance',
        phone: '+1 234 567 8997',
        relationship: 'Sibling',
      },
      documents: {
        idProof: 'uploaded',
        addressProof: 'uploaded',
        contract: 'uploaded',
      },
      performance: {
        rating: 4.6,
        lastReview: '2023-08-20',
        notes: 'Accurate financial reporting',
      },
    },
    {
      id: '4',
      employeeId: 'EMP004',
      name: 'David Mechanic',
      email: 'david.mechanic@driveon.com',
      phone: '+1 234 567 8904',
      address: '101 Mechanic Blvd, City',
      department: 'Maintenance',
      role: 'Maintenance Technician',
      joinDate: '2023-05-15',
      status: 'active',
      salary: 42000,
      employmentType: 'full_time',
      shift: 'flexible',
      permissions: ['manage_maintenance', 'view_cars', 'order_parts'],
      emergencyContact: {
        name: 'Anna Mechanic',
        phone: '+1 234 567 8996',
        relationship: 'Spouse',
      },
      documents: {
        idProof: 'uploaded',
        addressProof: 'uploaded',
        contract: 'uploaded',
      },
      performance: {
        rating: 4.8,
        lastReview: '2023-10-10',
        notes: 'Highly skilled in vehicle maintenance',
      },
    },
  ],
  selectedStaff: null,
  loading: false,
  error: null,
  filters: {
    department: 'all',
    status: 'active',
    employmentType: 'all',
  },
};

export const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    setStaff: (state, action: PayloadAction<Staff[]>) => {
      state.staff = action.payload;
    },
    setSelectedStaff: (state, action: PayloadAction<Staff | null>) => {
      state.selectedStaff = action.payload;
    },
    addStaff: (state, action: PayloadAction<Staff>) => {
      state.staff.push(action.payload);
    },
    updateStaff: (state, action: PayloadAction<Staff>) => {
      const index = state.staff.findIndex(staff => staff.id === action.payload.id);
      if (index !== -1) {
        state.staff[index] = action.payload;
      }
    },
    deleteStaff: (state, action: PayloadAction<string>) => {
      state.staff = state.staff.filter(staff => staff.id !== action.payload);
    },
    setStaffFilter: (state, action: PayloadAction<{ key: keyof StaffState['filters']; value: string }>) => {
      state.filters[action.payload.key] = action.payload.value;
    },
    resetStaffFilters: (state) => {
      state.filters = initialState.filters;
    },
    updateStaffStatus: (state, action: PayloadAction<{ id: string; status: Staff['status'] }>) => {
      const staff = state.staff.find(s => s.id === action.payload.id);
      if (staff) {
        staff.status = action.payload.status;
      }
    },
    updateStaffPermissions: (state, action: PayloadAction<{ id: string; permissions: string[] }>) => {
      const staff = state.staff.find(s => s.id === action.payload.id);
      if (staff) {
        staff.permissions = action.payload.permissions;
      }
    },
    updateStaffPerformance: (state, action: PayloadAction<{ id: string; rating: number; notes: string }>) => {
      const staff = state.staff.find(s => s.id === action.payload.id);
      if (staff) {
        staff.performance.rating = action.payload.rating;
        staff.performance.notes = action.payload.notes;
        staff.performance.lastReview = new Date().toISOString().split('T')[0];
      }
    },
    assignStaffToDepartment: (state, action: PayloadAction<{ id: string; department: string; role: string }>) => {
      const staff = state.staff.find(s => s.id === action.payload.id);
      if (staff) {
        staff.department = action.payload.department;
        staff.role = action.payload.role;
      }
    },
  },
});

export const {
  setStaff,
  setSelectedStaff,
  addStaff,
  updateStaff,
  deleteStaff,
  setStaffFilter,
  resetStaffFilters,
  updateStaffStatus,
  updateStaffPermissions,
  updateStaffPerformance,
  assignStaffToDepartment,
} = staffSlice.actions;

export default staffSlice.reducer;