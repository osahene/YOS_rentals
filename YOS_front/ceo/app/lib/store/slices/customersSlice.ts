import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'suspended';
  totalBookings: number;
  totalSpent: number;
  averageRating: number;
  preferredVehicleType: string;
  notes: string;
  tags: string[];
  communicationPreferences: {
    email: boolean;
    sms: boolean;
    phone: boolean;
  };
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

interface CustomersState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filters: {
    status: string;
    loyaltyTier: string;
    minBookings: number;
  };
}

const initialState: CustomersState = {
  customers: [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 234 567 8900',
      address: '123 Main St, City',
      joinDate: '2022-03-15',
      status: 'active',
      totalBookings: 12,
      totalSpent: 4500,
      averageRating: 4.5,
      preferredVehicleType: 'SUV',
      notes: 'Premium customer, prefers luxury vehicles',
      tags: ['VIP', 'Long-term'],
      communicationPreferences: {
        email: true,
        sms: true,
        phone: false,
      },
      loyaltyTier: 'gold',
    },
    {
      id: '2',
      name: 'Sarah Lee',
      email: 'sarah@example.com',
      phone: '+1 234 567 8901',
      address: '456 Oak Ave, Town',
      joinDate: '2023-01-20',
      status: 'active',
      totalBookings: 8,
      totalSpent: 3200,
      averageRating: 4.2,
      preferredVehicleType: 'Luxury',
      notes: 'Business traveler',
      tags: ['Business', 'Frequent'],
      communicationPreferences: {
        email: true,
        sms: false,
        phone: true,
      },
      loyaltyTier: 'silver',
    },
    {
      id: '3',
      name: 'Mark Smith',
      email: 'mark@example.com',
      phone: '+1 234 567 8902',
      address: '789 Pine Rd, Village',
      joinDate: '2021-11-05',
      status: 'active',
      totalBookings: 15,
      totalSpent: 5800,
      averageRating: 4.8,
      preferredVehicleType: 'Sports',
      notes: 'Car enthusiast, prefers sports cars',
      tags: ['VIP', 'Enthusiast'],
      communicationPreferences: {
        email: true,
        sms: true,
        phone: true,
      },
      loyaltyTier: 'platinum',
    },
    {
      id: '4',
      name: 'Emma Wilson',
      email: 'emma@example.com',
      phone: '+1 234 567 8903',
      address: '101 Maple Blvd, City',
      joinDate: '2023-05-10',
      status: 'active',
      totalBookings: 20,
      totalSpent: 8200,
      averageRating: 4.9,
      preferredVehicleType: 'Luxury',
      notes: 'Corporate account executive',
      tags: ['Corporate', 'Top Spender'],
      communicationPreferences: {
        email: true,
        sms: false,
        phone: false,
      },
      loyaltyTier: 'diamond',
    },
  ],
  selectedCustomer: null,
  loading: false,
  error: null,
  searchTerm: '',
  filters: {
    status: 'all',
    loyaltyTier: 'all',
    minBookings: 0,
  },
};

export const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setCustomers: (state, action: PayloadAction<Customer[]>) => {
      state.customers = action.payload;
    },
    setSelectedCustomer: (state, action: PayloadAction<Customer | null>) => {
      state.selectedCustomer = action.payload;
    },
    addCustomer: (state, action: PayloadAction<Customer>) => {
      state.customers.push(action.payload);
    },
    updateCustomer: (state, action: PayloadAction<Customer>) => {
      const index = state.customers.findIndex(customer => customer.id === action.payload.id);
      if (index !== -1) {
        state.customers[index] = action.payload;
      }
    },
    deleteCustomer: (state, action: PayloadAction<string>) => {
      state.customers = state.customers.filter(customer => customer.id !== action.payload);
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setFilter: (state, action: PayloadAction<Partial<CustomersState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.searchTerm = '';
    },
    sendBulkMessage: (state, action: PayloadAction<{
      customerIds: string[];
      message: string;
      type: 'email' | 'sms';
    }>) => {
      // This would typically call an API
      console.log(`Sending ${action.payload.type} to customers:`, action.payload.customerIds);
      console.log('Message:', action.payload.message);
    },
  },
});

export const {
  setCustomers,
  setSelectedCustomer,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  setSearchTerm,
  setFilter,
  resetFilters,
  sendBulkMessage,
} = customersSlice.actions;

export default customersSlice.reducer;