export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  currency: string;
  amountDue: number;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  amountPaid: number;
  currency: string;
  balance: number;
  status: 'pending' | 'partially_paid' | 'paid';
  createdAt: Date;
  items?: InvoiceItem[];
}

export interface SelectedInvoice {
  invoiceId: string;
  allocatedAmount: number;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Payment {
  id: string;
  paymentNo: string;
  date: Date;
  customerId: string;
  customerName: string;
  currency: string;
  amount: number;
  allocatedAmount: number;
  remainingAmount: number;
  createdAt: Date;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  allocatedAmount: number;
  createdAt: Date;
}
