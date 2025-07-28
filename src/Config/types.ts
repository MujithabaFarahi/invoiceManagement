export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  amountInJPY?: number;
  currency: string;
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
  invoiceLink?: string;
  balance: number;
  status: 'pending' | 'partially_paid' | 'paid';
  date: string;
  foreignBankCharge: number;
  localBankCharge: number;
  createdAt: Date;
}

export interface SelectedInvoice {
  invoiceId: string;
  allocatedAmount: number;
  balance: number;
  foreignBankCharge: number;
  localBankCharge: number;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  amountDue: number;
  amountPaid: number;
  amountInJPY?: number;
  foreignBankCharge: number;
  localBankCharge: number;
}

export interface Payment {
  id: string;
  paymentNo: string;
  date: string;
  customerId: string;
  customerName: string;
  currency: string;
  amount: number;
  allocatedAmount: number;
  remainingAmount: number;
  amountInJPY: number;
  foreignBankCharge: number;
  localBankCharge: number;
  createdAt: Date;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  invoiceNo: string;
  allocatedAmount: number;
  foreignBankCharge: number;
  localBankCharge: number;
  createdAt: Date;
}

export function getPaginationRange(
  current: number,
  total: number
): (number | string)[] {
  const delta = 1;
  const range: (number | string)[] = [];

  for (let i = 1; i <= total; i++) {
    if (
      i <= 2 || // first 2
      i > total - 2 || // last 2
      (i >= current - delta && i <= current + delta) // around current
    ) {
      range.push(i);
    } else if (range[range.length - 1] !== '...') {
      range.push('...');
    }
  }

  return range;
}
