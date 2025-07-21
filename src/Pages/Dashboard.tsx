'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, FileText, CreditCard, DollarSign } from 'lucide-react';
import { getCustomers, getInvoices, getPayments } from '@/Config/firestore';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalInvoices: 0,
    totalPayments: 0,
    totalRevenue: 0,
    pendingAmount: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [customers, invoices, payments] = await Promise.all([
          getCustomers(),
          getInvoices(),
          getPayments(),
        ]);

        const totalRevenue = payments.reduce(
          (sum, payment) => sum + payment.amount,
          0
        );
        const pendingAmount = invoices
          .filter((invoice) => invoice.status !== 'paid')
          .reduce((sum, invoice) => sum + invoice.balance, 0);

        setStats({
          totalCustomers: customers.length,
          totalInvoices: invoices.length,
          totalPayments: payments.length,
          totalRevenue,
          pendingAmount,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

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
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalRevenue.toFixed(2)}
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
            <div className="text-3xl font-bold text-orange-600">
              ${stats.pendingAmount.toFixed(2)}
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
