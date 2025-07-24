'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, FileText, CreditCard, DollarSign, Loader2 } from 'lucide-react';
import {
  getCustomerCount,
  getInvoiceCount,
  getPaymentCount,
} from '@/Config/firestore';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/redux/store/store';
import { fetchPayments } from '@/redux/features/paymentSlice';
import { fetchInvoices } from '@/redux/features/invoiceSlice';

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();

  const { payments } = useSelector((state: RootState) => state.payment);
  const { invoices } = useSelector((state: RootState) => state.invoice);

  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalInvoices: 0,
    totalPayments: 0,
    USDPending: 0,
    EURPending: 0,
    JPYPending: 0,
  });

  // Initial fetch
  useEffect(() => {
    if (invoices.length === 0) {
      dispatch(fetchInvoices());
    }
    if (payments.length === 0) {
      dispatch(fetchPayments());
    }

    const fetchStats = async () => {
      try {
        const [totalCustomers, totalInvoices, totalPayments] =
          await Promise.all([
            getCustomerCount(),
            getInvoiceCount(),
            getPaymentCount(),
          ]);

        setStats((prev) => ({
          ...prev,
          totalCustomers,
          totalInvoices,
          totalPayments,
        }));
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [dispatch, invoices.length, payments.length]);

  // Example exchange rates (update as needed)
  const exchangeRates = {
    USD_TO_JPY: 155.25,
    EUR_TO_JPY: 169.5,
  };

  const totalPendingInJPY =
    stats.JPYPending +
    stats.USDPending * exchangeRates.USD_TO_JPY +
    stats.EURPending * exchangeRates.EUR_TO_JPY;

  // Calculate pending by currency after invoices are fetched
  useEffect(() => {
    const pending = {
      USDPending: 0,
      EURPending: 0,
      JPYPending: 0,
    };

    invoices
      .filter((invoice) => invoice.status !== 'paid')
      .forEach((invoice) => {
        if (invoice.currency === 'USD') {
          pending.USDPending += invoice.balance;
        } else if (invoice.currency === 'EUR') {
          pending.EURPending += invoice.balance;
        } else if (invoice.currency === 'JPY') {
          pending.JPYPending += invoice.balance;
        }
      });

    setStats((prev) => ({
      ...prev,
      ...pending,
    }));
  }, [invoices]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your invoice management system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invoices
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payments
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPendingInJPY !== null ? (
                new Intl.NumberFormat('ja-JP', {
                  style: 'currency',
                  currency: 'JPY',
                }).format(totalPendingInJPY)
              ) : (
                <Loader2 className="animate-spin h-6 w-6" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Payments</CardTitle>
            <CardDescription>Amount pending from customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <p>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'JPY',
                }).format(stats.JPYPending)}
              </p>
              <p>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(stats.USDPending)}
              </p>
              <p>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(stats.EURPending)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">• Add new customers</p>
            <p className="text-sm text-muted-foreground">• Create invoices</p>
            <p className="text-sm text-muted-foreground">• Record payments</p>
            <p className="text-sm text-muted-foreground">
              • Allocate payments to invoices
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
