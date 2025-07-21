'use client';

import type React from 'react';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getPayments,
  addPayment,
  getCustomers,
  allocatePaymentToInvoices,
  getCustomerInvoices,
} from '@/Config/firestore';
import type {
  Customer,
  Invoice,
  Payment,
  SelectedInvoice,
} from '@/Config/types';
import { toast } from 'sonner';
import { collection, doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/Config/firebase';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

export default function Payments() {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [selectedInvoices, setSelectedInvoices] = useState<SelectedInvoice[]>(
    []
  );
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [formData, setFormData] = useState({
    paymentNo: '',
    customerId: '',
    amount: '',
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchPayments();
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [formData.customerId, formData.currency]);

  const fetchPayments = async () => {
    try {
      const data = await getPayments();
      setPayments(data);
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to fetch payments',
      });
    }
  };

  const fetchInvoices = async () => {
    try {
      const data = await getCustomerInvoices(
        formData.customerId,
        formData.currency
      );
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Error', {
        description: 'Failed to fetch invoices',
      });
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to fetch customers',
      });
    }
  };

  const generatePaymentNo = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `PAY-${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.paymentNo ||
      !formData.customerId ||
      !formData.amount ||
      selectedInvoices.length === 0
    ) {
      toast.error('Error', {
        description:
          'Please fill in all required fields and select at least one invoice',
      });
      return;
    }

    const customer = customers.find((c) => c.id === formData.customerId);
    if (!customer) {
      toast.error('Error', {
        description: 'Selected customer not found',
      });
      return;
    }

    const amount = Number.parseFloat(formData.amount);
    const totalAllocated = selectedInvoices.reduce(
      (sum, i) => sum + i.allocatedAmount,
      0
    );

    if (totalAllocated > amount) {
      toast.error('Error', {
        description: 'Allocated amount exceeds payment amount',
      });
      return;
    }

    try {
      setLoading(true);

      // 1. Add Payment
      const paymentData = {
        paymentNo: formData.paymentNo,
        date: new Date(formData.date),
        customerId: formData.customerId,
        customerName: customer.name,
        currency: formData.currency,
        amount,
        allocatedAmount: totalAllocated,
        remainingAmount: amount - totalAllocated,
        createdAt: new Date(),
      };

      const paymentId = await addPayment(paymentData);

      // 2. Allocate to Invoices
      const batch = writeBatch(db);
      for (const alloc of selectedInvoices) {
        const invoiceRef = doc(db, 'invoices', alloc.invoiceId);
        const invoiceSnap = await getDoc(invoiceRef);
        if (!invoiceSnap.exists()) continue;

        const invoice = invoiceSnap.data() as Invoice;
        const newAmountPaid = invoice.amountPaid + alloc.allocatedAmount;
        const newBalance = invoice.totalAmount - newAmountPaid;
        const newStatus = newBalance === 0 ? 'paid' : 'partially_paid';

        batch.update(invoiceRef, {
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
        });

        // 3. Add to paymentAllocations
        const allocRef = doc(collection(db, 'paymentAllocations'));
        batch.set(allocRef, {
          paymentId,
          invoiceId: alloc.invoiceId,
          allocatedAmount: alloc.allocatedAmount,
          createdAt: new Date(),
        });
      }

      // 4. Update Customer Due
      const customerRef = doc(db, 'customers', formData.customerId);
      const customerSnap = await getDoc(customerRef);
      if (customerSnap.exists()) {
        const currentDue = customerSnap.data().amountDue || 0;
        batch.update(customerRef, {
          amountDue: Math.max(0, currentDue - totalAllocated),
        });
      }

      // 5. Update Payment allocation info
      batch.update(doc(db, 'payments', paymentId), {
        allocatedAmount: totalAllocated,
        remainingAmount: amount - totalAllocated,
      });

      await batch.commit();

      toast.success('Success', {
        description: 'Payment recorded and allocated successfully',
      });

      setIsDialogOpen(false);
      setFormData({
        paymentNo: '',
        customerId: '',
        amount: '',
        currency: 'USD',
        date: new Date().toISOString().split('T')[0],
      });
      setSelectedInvoices([]);
      fetchPayments();
      fetchCustomers();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Error', {
        description: 'Failed to record payment',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">
            Record and track customer payments
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="min-w-36"
              onClick={() => {
                setFormData({
                  paymentNo: generatePaymentNo(),
                  customerId: '',
                  amount: '',
                  currency: 'USD',
                  date: new Date().toISOString().split('T')[0],
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record New Payment</DialogTitle>
              <DialogDescription>
                Enter payment details. The payment will be automatically
                allocated to pending invoices.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="paymentNo">Payment Number *</Label>
                  <Input
                    id="paymentNo"
                    value={formData.paymentNo}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentNo: e.target.value })
                    }
                    placeholder="PAY-001"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Payment Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>{' '}
                <div className="flex gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="customer">Customer *</Label>
                    <Select
                      value={formData.customerId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, customerId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) =>
                        setFormData({ ...formData, currency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="JPY">JPY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        {selectedInvoices.length > 0
                          ? `${selectedInvoices.length} selected`
                          : 'Select invoices'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="grid gap-2 max-h-60 overflow-y-auto">
                        {invoices.map((invoice) => {
                          const isChecked = selectedInvoices.some(
                            (item) => item.invoiceId === invoice.id
                          );
                          return (
                            <label
                              key={invoice.id}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedInvoices((prev) => [
                                      ...prev,
                                      {
                                        invoiceId: invoice.id,
                                        allocatedAmount: 0,
                                      },
                                    ]);
                                  } else {
                                    setSelectedInvoices((prev) =>
                                      prev.filter(
                                        (item) => item.invoiceId !== invoice.id
                                      )
                                    );
                                  }
                                }}
                              />
                              <span className="text-sm">
                                {invoice.invoiceNo} ({invoice.balance}{' '}
                                {invoice.currency})
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label>Allocate Amounts</Label>
                  {selectedInvoices.map((item, index) => {
                    const invoice = invoices.find(
                      (inv) => inv.id === item.invoiceId
                    );
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <span className="flex-1">
                          {invoice?.invoiceNo} ({invoice?.currency}{' '}
                          {invoice?.balance})
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.allocatedAmount}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setSelectedInvoices((prev) =>
                              prev.map((i) =>
                                i.invoiceId === item.invoiceId
                                  ? { ...i, allocatedAmount: value }
                                  : i
                              )
                            );
                          }}
                          placeholder="0.00"
                          className="w-32"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" isLoading={loading}>
                  Record Payment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            All recorded payments and their allocation status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Allocated</TableHead>
                <TableHead>Remaining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {payment.paymentNo}
                  </TableCell>
                  <TableCell>
                    {payment.date.toLocaleDateString().split('T')[0]}
                  </TableCell>
                  {/* <TableCell>{'N/A'}</TableCell> */}
                  <TableCell>{payment.customerName}</TableCell>
                  <TableCell>
                    {payment.currency} {payment.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span className="text-green-600">
                      {payment.currency}{' '}
                      {payment.allocatedAmount?.toFixed(2) || '0.00'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        payment.remainingAmount && payment.remainingAmount > 0
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }
                    >
                      {payment.currency}{' '}
                      {payment.remainingAmount?.toFixed(2) || '0.00'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
