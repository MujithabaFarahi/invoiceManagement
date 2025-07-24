import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { getCustomerInvoices, getInvoices } from '@/Config/firestore';
import type {
  Invoice,
  PaymentAllocation,
  SelectedInvoice,
} from '@/Config/types';

export interface invoiceState {
  loading: boolean;
  isLoading: boolean;
  message: string | null;
  error: boolean;
  success: boolean;
  paymentAllocations: PaymentAllocation[];
  invoices: Invoice[];
  customerInvoices: Invoice[];
  selectedInvoices: SelectedInvoice[];
}

const initialState: invoiceState = {
  loading: false,
  isLoading: false,
  message: null,
  error: false,
  success: false,
  paymentAllocations: [],
  invoices: [],
  customerInvoices: [],
  selectedInvoices: [],
};

export const fetchInvoices = createAsyncThunk<Invoice[]>(
  'invoices/fetchInvoices',
  async (_, { rejectWithValue }) => {
    try {
      const data = await getInvoices();
      return data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return rejectWithValue('Failed to fetch Invoices');
    }
  }
);

export const fetchCustomerInvoices = createAsyncThunk<
  Invoice[],
  { customerId: string; currency: string }
>(
  'invoices/fetchCustomerInvoices',
  async ({ customerId, currency }, { rejectWithValue }) => {
    try {
      const data = await getCustomerInvoices(customerId, currency);
      return data;
    } catch (error) {
      console.error('Error fetching customer invoices:', error);
      return rejectWithValue('Failed to fetch invoices');
    }
  }
);

const invoiceSlice = createSlice({
  name: 'invoice',
  initialState,
  reducers: {
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setInvoices: (state, action: PayloadAction<Invoice[]>) => {
      state.invoices = action.payload;
    },
    setSelectedInvoices: (state, action: PayloadAction<SelectedInvoice[]>) => {
      state.selectedInvoices = action.payload;
    },
    resetCustomerInvoices: (state) => {
      state.customerInvoices = [];
      state.selectedInvoices = [];
    },
    setAllocatedAmount: (
      state,
      action: PayloadAction<{ invoiceId: string; amount: number }>
    ) => {
      const item = state.selectedInvoices.find(
        (i) => i.invoiceId === action.payload.invoiceId
      );
      if (item) {
        item.allocatedAmount = action.payload.amount;
        item.foreignBankPayment = 0;
        item.localBankPayment = 0;
      }
    },
    addInvoiceToList: (state, action: PayloadAction<Invoice>) => {
      state.invoices.unshift(action.payload);
    },
    updateInvoiceInList: (state, action: PayloadAction<Invoice>) => {
      const index = state.invoices.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.invoices[index] = action.payload;
      }
    },
    deleteInvoiceFromList: (state, action: PayloadAction<string>) => {
      state.invoices = state.invoices.filter(
        (invoice) => invoice.id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.message = '';
        state.loading = true;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.error = false;
        state.success = true;
        state.invoices = action.payload;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.message = action.payload as string;
      })
      .addCase(fetchCustomerInvoices.pending, (state) => {
        state.message = '';
        state.loading = true;
      })
      .addCase(fetchCustomerInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.error = false;
        state.success = true;
        state.customerInvoices = action.payload;
        state.selectedInvoices = action.payload.map((inv) => ({
          invoiceId: inv.id,
          allocatedAmount: 0,
          balance: inv.balance,
          foreignBankPayment: 0,
          localBankPayment: 0,
        }));
      })
      .addCase(fetchCustomerInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.message = action.payload as string;
      });
  },
});

export const {
  setIsLoading,
  setInvoices,
  resetCustomerInvoices,
  setSelectedInvoices,
  setAllocatedAmount,
  addInvoiceToList,
  updateInvoiceInList,
  deleteInvoiceFromList,
} = invoiceSlice.actions;
export default invoiceSlice.reducer;
