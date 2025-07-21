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
} from '@/Config/firestore';
import type { Customer, Payment } from '@/Config/types';
import { toast } from 'sonner';

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

    if (!formData.paymentNo || !formData.customerId || !formData.amount) {
      toast.error('Error', {
        description: 'Please fill in all required fields',
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

    try {
      const paymentData = {
        paymentNo: formData.paymentNo,
        date: new Date(formData.date),
        customerId: formData.customerId,
        customerName: customer.name,
        currency: formData.currency,
        amount,
        allocatedAmount: 0,
        remainingAmount: amount,
        createdAt: new Date(),
      };

      const paymentId = await addPayment(paymentData);

      // Automatically allocate payment to pending invoices
      await allocatePaymentToInvoices(paymentId, formData.customerId, amount);

      toast.success('Success', {
        description: 'Payment recorded and allocated to invoices successfully',
      });

      setIsDialogOpen(false);
      setFormData({
        paymentNo: '',
        customerId: '',
        amount: '',
        currency: 'USD',
        date: new Date().toISOString().split('T')[0],
      });
      fetchPayments();
      fetchCustomers(); // Refresh to update customer amount due
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Error', {
        description: 'Failed to record payment',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">
            Record and track customer payments
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
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
                          {customer.name} (Due: ${customer.amountDue.toFixed(2)}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
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
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Record Payment</Button>
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
                  {/* <TableCell>{payment.date.toLocaleDateString().split('T')[0]}</TableCell> */}
                  <TableCell>{'N/A'}</TableCell>
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
