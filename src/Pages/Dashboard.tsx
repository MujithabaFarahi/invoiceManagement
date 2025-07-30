'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, FileText, CreditCard, DollarSign } from 'lucide-react';
import {
  getCustomerCount,
  getInvoiceCount,
  getPaymentCount,
} from '@/Config/firestore';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/redux/store/store';
import {
  fetchCurrencies,
  fetchPayments,
  setExchangeRates,
} from '@/redux/features/paymentSlice';
import { Spinner } from '@/components/ui/spinner';
import { useNavigate } from 'react-router-dom';
import { toFixed2 } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { payments, currencies, loading, exchangeRates } = useSelector(
    (state: RootState) => state.payment
  );

  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalInvoices: 0,
    totalPayments: 0,
  });

  // Initial fetch
  useEffect(() => {
    dispatch(fetchCurrencies());

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
  }, [dispatch, payments.length]);

  const fetchExchangeRates = useCallback(async () => {
    try {
      const res = await fetch(
        'https://www.shizuokabank.co.jp/interest/cmn/js/rate.php'
      );
      const data = await res.json();

      const rates: Record<string, number> = {
        USD: toFixed2(data.save_us_ttb),
        EUR: toFixed2(data.save_euro_ttb),
      };

      dispatch(setExchangeRates(rates));
    } catch (err) {
      console.error('Failed to fetch exchange rates', err);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchExchangeRates();
  }, [fetchExchangeRates]);

  const [totalPendingInJPY, setTotalPendingInJPY] = useState<number | null>(
    null
  );
  const [totalReceivedInJPY, setTotalReceivedInJPY] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (!exchangeRates || currencies.length === 0) return;

    let pending = 0;
    let received = 0;

    currencies.forEach((currency) => {
      if (currency.code === 'JPY') {
        pending += currency.amountDue || 0;
        received += currency.amountInJPY || 0;
      } else if (exchangeRates[currency.code]) {
        pending += (currency.amountDue || 0) * exchangeRates[currency.code];
        received += currency.amountInJPY || 0;
      } else {
        console.warn(`No exchange rate found for ${currency.code}`);
      }
    });

    setTotalPendingInJPY(pending);
    setTotalReceivedInJPY(received);
  }, [exchangeRates, currencies]);

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your invoice management system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card onClick={() => navigate('/customers')} className="cursor-pointer">
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

        <Card onClick={() => navigate('/invoices')} className="cursor-pointer">
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

        <Card onClick={() => navigate('/payments')} className="cursor-pointer">
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
                <Spinner size="small" className="w-12" />
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
            {loading ? (
              <Spinner size="small" className="w-12" />
            ) : (
              <div className="  space-x-2">
                <div>
                  <p className="text-lg text-muted-foreground">
                    Total :{' '}
                    <span className="text-primary font-bold">
                      {totalPendingInJPY !== null &&
                        new Intl.NumberFormat('ja-JP', {
                          style: 'currency',
                          currency: 'JPY',
                        }).format(totalPendingInJPY)}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap space-x-6">
                  {currencies.map((currency) => (
                    <p key={currency.code}>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: currency.code,
                      }).format(currency.amountDue || 0)}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>Amount received from customers</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Spinner size="small" className="w-12" />
            ) : (
              <div className="  space-x-2">
                <div>
                  <p className="text-lg text-muted-foreground">
                    Total :{' '}
                    <span className="text-primary font-bold">
                      {totalReceivedInJPY !== null &&
                        new Intl.NumberFormat('ja-JP', {
                          style: 'currency',
                          currency: 'JPY',
                        }).format(totalReceivedInJPY)}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap space-x-6">
                  {currencies.map((currency) => (
                    <p key={currency.code}>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: currency.code,
                      }).format(currency.amountPaid || 0)}
                    </p>
                  ))}
                </div>
              </div>
            )}
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
