import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import type { Customer, Invoice, Payment } from './types';
import { db } from './firebase';

// Customer operations
export const addCustomer = async (customer: Omit<Customer, 'id'>) => {
  const docRef = await addDoc(collection(db, 'customers'), customer);
  return docRef.id;
};

export const getCustomers = async (): Promise<Customer[]> => {
  const querySnapshot = await getDocs(collection(db, 'customers'));
  return querySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as Customer)
  );
};

export const updateCustomer = async (id: string, data: Partial<Customer>) => {
  await updateDoc(doc(db, 'customers', id), data);
};

export const deleteCustomer = async (id: string) => {
  await deleteDoc(doc(db, 'customers', id));
};

// Invoice operations
export const addInvoice = async (invoice: Omit<Invoice, 'id'>) => {
  const docRef = await addDoc(collection(db, 'invoices'), invoice);

  // Update customer's amount due
  const customerRef = doc(db, 'customers', invoice.customerId);
  const customerDoc = await getDoc(customerRef);
  if (customerDoc.exists()) {
    const currentAmountDue = customerDoc.data().amountDue || 0;
    await updateDoc(customerRef, {
      amountDue: currentAmountDue + invoice.totalAmount,
    });
  }

  return docRef.id;
};

export const getInvoices = async (): Promise<Invoice[]> => {
  const querySnapshot = await getDocs(
    query(collection(db, 'invoices'), orderBy('createdAt', 'desc'))
  );
  return querySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as Invoice)
  );
};

export const updateInvoice = async (id: string, data: Partial<Invoice>) => {
  await updateDoc(doc(db, 'invoices', id), data);
};

export const deleteInvoice = async (id: string) => {
  await deleteDoc(doc(db, 'invoices', id));
};

// Payment operations
export const addPayment = async (payment: Omit<Payment, 'id'>) => {
  const docRef = await addDoc(collection(db, 'payments'), payment);
  return docRef.id;
};

export const getPayments = async (): Promise<Payment[]> => {
  const querySnapshot = await getDocs(
    query(collection(db, 'payments'), orderBy('createdAt', 'desc'))
  );
  return querySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as Payment)
  );
};

export const allocatePaymentToInvoices = async (
  paymentId: string,
  customerId: string,
  amount: number
) => {
  const batch = writeBatch(db);

  // Get pending invoices for the customer
  const invoicesQuery = query(
    collection(db, 'invoices'),
    where('customerId', '==', customerId),
    where('status', 'in', ['pending', 'partially_paid']),
    orderBy('createdAt', 'asc')
  );

  const invoicesSnapshot = await getDocs(invoicesQuery);
  let remainingAmount = amount;

  for (const invoiceDoc of invoicesSnapshot.docs) {
    if (remainingAmount <= 0) break;

    const invoice = invoiceDoc.data() as Invoice;
    const invoiceBalance = invoice.balance;

    if (invoiceBalance > 0) {
      const allocationAmount = Math.min(remainingAmount, invoiceBalance);
      const newAmountPaid = invoice.amountPaid + allocationAmount;
      const newBalance = invoice.totalAmount - newAmountPaid;
      const newStatus = newBalance === 0 ? 'paid' : 'partially_paid';

      batch.update(doc(db, 'invoices', invoiceDoc.id), {
        amountPaid: newAmountPaid,
        balance: newBalance,
        status: newStatus,
      });

      remainingAmount -= allocationAmount;
    }
  }

  // Update customer's amount due
  const customerRef = doc(db, 'customers', customerId);
  const customerDoc = await getDoc(customerRef);
  if (customerDoc.exists()) {
    const currentAmountDue = customerDoc.data().amountDue || 0;
    const allocatedAmount = amount - remainingAmount;
    batch.update(customerRef, {
      amountDue: Math.max(0, currentAmountDue - allocatedAmount),
    });
  }

  // Update payment with allocation info
  batch.update(doc(db, 'payments', paymentId), {
    allocatedAmount: amount - remainingAmount,
    remainingAmount: remainingAmount,
  });

  await batch.commit();
};
