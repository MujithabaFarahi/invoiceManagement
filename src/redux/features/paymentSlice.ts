import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { getCurrencies, getCustomers, getPayments } from '@/Config/firestore';
import type {
  Currency,
  Customer,
  Payment,
  PaymentAllocation,
} from '@/Config/types';

export interface paymentState {
  loading: boolean;
  isLoading: boolean;
  message: string | null;
  error: boolean;
  success: boolean;
  payments: Payment[];
  payment: Payment | null;
  paymentAllocations: PaymentAllocation[];
  customer: Customer;
  customers: Customer[];
  currencies: Currency[];
  exchangeRates: Record<string, number> | null;
}

const initialState: paymentState = {
  loading: false,
  isLoading: false,
  message: null,
  error: false,
  success: false,
  payments: [],
  payment: null,
  paymentAllocations: [],
  customer: {} as Customer,
  customers: [],
  currencies: [],
  exchangeRates: null,
};

export const fetchPayments = createAsyncThunk<Payment[]>(
  'payments/fetchPayments',
  async (_, { rejectWithValue }) => {
    try {
      const data = await getPayments();
      return data;
    } catch (error) {
      console.error('Error fetching payments:', error);
      return rejectWithValue('Failed to fetch payments');
    }
  }
);

export const fetchCustomers = createAsyncThunk<Customer[]>(
  'customers/fetchCustomers',
  async (_, { rejectWithValue }) => {
    try {
      const data = await getCustomers();
      return data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      return rejectWithValue('Failed to fetch Customers');
    }
  }
);

export const fetchCurrencies = createAsyncThunk<Currency[]>(
  'currencies/fetchCurrencies',
  async (_, { rejectWithValue }) => {
    try {
      const data = await getCurrencies();
      return data;
    } catch (error) {
      console.error('Error fetching currencies:', error);
      return rejectWithValue('Failed to fetch Currencies');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    addCustomerToList: (state, action: PayloadAction<Customer>) => {
      state.customers.unshift(action.payload);
    },
    updateCustomerInList: (state, action: PayloadAction<Customer>) => {
      const index = state.customers.findIndex(
        (c) => c.id === action.payload.id
      );
      if (index !== -1) {
        state.customers[index] = action.payload;
      }
    },
    deleteCustomerFromList: (state, action: PayloadAction<string>) => {
      state.customers = state.customers.filter(
        (customer) => customer.id !== action.payload
      );
    },
    addPaymentToList: (state, action: PayloadAction<Payment>) => {
      state.payments.unshift(action.payload);
    },
    updatePaymentInList: (state, action: PayloadAction<Payment>) => {
      const index = state.payments.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.payments[index] = action.payload;
      }
    },
    deletePaymentFromList: (state, action: PayloadAction<string>) => {
      state.payments = state.payments.filter(
        (payment) => payment.id !== action.payload
      );
    },
    selectCustomer: (state, action: PayloadAction<string>) => {
      const customer = state.customers.find(
        (customer) => customer.id === action.payload
      );
      state.customer = customer || ({} as Customer);
    },
    setExchangeRates: (
      state,
      action: PayloadAction<Record<string, number>>
    ) => {
      state.exchangeRates = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.message = '';
        state.loading = true;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.error = false;
        state.success = true;
        state.payments = action.payload;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.message = action.payload as string;
      })
      .addCase(fetchCustomers.pending, (state) => {
        state.message = '';
        state.loading = true;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.error = false;
        state.success = true;
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.message = action.payload as string;
      })
      .addCase(fetchCurrencies.pending, (state) => {
        state.message = '';
        state.loading = true;
      })
      .addCase(fetchCurrencies.fulfilled, (state, action) => {
        state.loading = false;
        state.error = false;
        state.success = true;
        state.currencies = action.payload;
      })
      .addCase(fetchCurrencies.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.message = action.payload as string;
      });
  },
});

export const {
  setIsLoading,
  addCustomerToList,
  updateCustomerInList,
  deleteCustomerFromList,
  addPaymentToList,
  updatePaymentInList,
  deletePaymentFromList,
  selectCustomer,
  setExchangeRates,
} = paymentSlice.actions;
export default paymentSlice.reducer;
