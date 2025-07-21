'use client';

import type React from 'react';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
  getInvoices,
  addInvoice,
  updateInvoice,
  deleteInvoice,
  getCustomers,
} from '@/Config/firestore';
import type { Customer, Invoice } from '@/Config/types';
import { toast } from 'sonner';

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    invoiceNo: '',
    customerId: '',
    totalAmount: '',
    currency: 'USD',
    dueDate: '',
  });

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, []);

  const fetchInvoices = async () => {
    try {
      const data = await getInvoices();
      setInvoices(data);
    } catch (error) {
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

  const generateInvoiceNo = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `INV-${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.invoiceNo || !formData.customerId || !formData.totalAmount) {
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

    const totalAmount = Number.parseFloat(formData.totalAmount);

    try {
      const invoiceData = {
        invoiceNo: formData.invoiceNo,
        customerId: formData.customerId,
        customerName: customer.name,
        totalAmount,
        amountPaid: 0,
        currency: formData.currency,
        balance: totalAmount,
        status: 'pending' as const,
        dueDate: new Date(formData.dueDate),
        createdAt: new Date(),
      };

      if (editingInvoice) {
        await updateInvoice(editingInvoice.id, invoiceData);
        toast.success('Success', {
          description: 'Invoice updated successfully',
        });
      } else {
        await addInvoice(invoiceData);
        toast.success('Success', {
          description: 'Invoice created successfully',
        });
      }

      setIsDialogOpen(false);
      setEditingInvoice(null);
      setFormData({
        invoiceNo: '',
        customerId: '',
        totalAmount: '',
        currency: 'USD',
        dueDate: '',
      });
      fetchInvoices();
      fetchCustomers(); // Refresh to update customer amount due
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to save invoice',
      });
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoiceNo: invoice.invoiceNo,
      customerId: invoice.customerId,
      totalAmount: invoice.totalAmount.toString(),
      currency: invoice.currency,
      dueDate: invoice.dueDate.toISOString().split('T')[0],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoice(id);
        toast.success('Success', {
          description: 'Invoice deleted successfully',
        });
        fetchInvoices();
      } catch (error) {
        toast.error('Error', {
          description: 'Failed to delete invoice',
        });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'partially_paid':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            Partially Paid
          </Badge>
        );
      case 'pending':
        return <Badge className="bg-red-100 text-red-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">
            Manage customer invoices and track payments
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingInvoice(null);
                setFormData({
                  invoiceNo: generateInvoiceNo(),
                  customerId: '',
                  totalAmount: '',
                  currency: 'USD',
                  dueDate: '',
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
              </DialogTitle>
              <DialogDescription>
                {editingInvoice
                  ? 'Update invoice information'
                  : 'Enter invoice details to create a new invoice'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="invoiceNo">Invoice Number *</Label>
                  <Input
                    id="invoiceNo"
                    value={formData.invoiceNo}
                    onChange={(e) =>
                      setFormData({ ...formData, invoiceNo: e.target.value })
                    }
                    placeholder="INV-001"
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
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="totalAmount">Total Amount *</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    value={formData.totalAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, totalAmount: e.target.value })
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
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
          <CardDescription>
            All invoices and their payment status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoiceNo}
                  </TableCell>
                  <TableCell>{invoice.customerName}</TableCell>
                  <TableCell>
                    {invoice.currency} {invoice.totalAmount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {invoice.currency} {invoice.amountPaid.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        invoice.balance > 0
                          ? 'text-orange-600 font-medium'
                          : 'text-green-600'
                      }
                    >
                      {invoice.currency} {invoice.balance.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(invoice)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(invoice.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
