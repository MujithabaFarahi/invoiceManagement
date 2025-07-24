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
  QueryDocumentSnapshot,
  type DocumentData,
  limit,
  startAfter,
} from 'firebase/firestore';
import type {
  Currency,
  Customer,
  Invoice,
  Payment,
  PaymentAllocation,
} from './types';
import { db } from './firebase';
import { getCountFromServer } from 'firebase/firestore';

// Customer operations
export const addCustomer = async (customer: Omit<Customer, 'id'>) => {
  const docRef = await addDoc(collection(db, 'customers'), customer);
  return docRef.id;
};

export const getCustomerCount = async (): Promise<number> => {
  const coll = collection(db, 'customers');
  const snapshot = await getCountFromServer(coll);
  return snapshot.data().count;
};

export const getCustomers = async (): Promise<Customer[]> => {
  const querySnapshot = await getDocs(
    query(collection(db, 'customers'), orderBy('createdAt', 'desc'))
  );
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
    } as Customer;
  });
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

export const getInvoiceCount = async (): Promise<number> => {
  const coll = collection(db, 'invoices');
  const snapshot = await getCountFromServer(coll);
  return snapshot.data().count;
};

export const getInvoices = async (): Promise<Invoice[]> => {
  const querySnapshot = await getDocs(
    query(collection(db, 'invoices'), orderBy('createdAt', 'desc'))
  );
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date.toDate(),
      createdAt: data.createdAt.toDate(),
    } as Invoice;
  });
};

export const getCustomerInvoices = async (
  customerId: string,
  currency: string
): Promise<Invoice[]> => {
  const invoicesRef = collection(db, 'invoices');

  const q = query(
    invoicesRef,
    where('customerId', '==', customerId),
    where('currency', '==', currency),
    where('balance', '>', 0),
    orderBy('createdAt', 'asc')
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
    } as Invoice;
  });
};

export const getInvoicesData = async (
  sortBy: string,
  ascending: boolean,
  pageSize: number,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{
  invoices: Invoice[];
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
}> => {
  const invoicesRef = collection(db, 'invoices');
  let q = query(
    invoicesRef,
    orderBy(sortBy, ascending ? 'asc' : 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(
      invoicesRef,
      orderBy(sortBy, ascending ? 'asc' : 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );
  }

  const snapshot = await getDocs(q);

  const invoices = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
    } as Invoice;
  });

  const lastVisible = snapshot.docs[snapshot.docs.length - 1] ?? null;

  return { invoices, lastVisible };
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

export const getPaymentCount = async (): Promise<number> => {
  const coll = collection(db, 'payments');
  const snapshot = await getCountFromServer(coll);
  return snapshot.data().count;
};

export const getPayments = async (): Promise<Payment[]> => {
  const querySnapshot = await getDocs(
    query(collection(db, 'payments'), orderBy('createdAt', 'desc'))
  );
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date.toDate(),
      createdAt: data.createdAt.toDate(),
    } as Payment;
  });
};

export const getPaymentById = async (paymentId: string): Promise<Payment> => {
  const paymentRef = doc(db, 'payments', paymentId);
  const paymentSnap = await getDoc(paymentRef);

  if (!paymentSnap.exists()) {
    throw new Error('Payment not found');
  }

  const data = paymentSnap.data();
  return {
    id: paymentSnap.id,
    ...data,
    date: data.date.toDate(),
    createdAt: data.createdAt.toDate(),
  } as Payment;
};

export const allocatePaymentToInvoices = async (
  paymentId: string,
  customerId: string,
  amount: number,
  currency: string
) => {
  const batch = writeBatch(db);

  // Get pending invoices for the customer
  const invoicesQuery = query(
    collection(db, 'invoices'),
    where('customerId', '==', customerId),
    where('currency', '==', currency),
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

export const getPaymentAllocations = async (
  paymentId: string
): Promise<PaymentAllocation[]> => {
  const allocationsRef = collection(db, 'paymentAllocations');

  const q = query(allocationsRef, where('paymentId', '==', paymentId));

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
    } as PaymentAllocation;
  });
};

export const getCurrencies = async (): Promise<Currency[]> => {
  const querySnapshot = await getDocs(query(collection(db, 'currencies')));
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
    } as Currency;
  });
};
