import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import {
  getInvoiceById,
  getPaymentAllocationsByInvoiceId,
} from '@/Config/firestore';
import type { Invoice, PaymentAllocation } from '@/Config/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function InvoiceDetails() {
  const navigate = useNavigate();
  const { id: invoiceId } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [allocations, setAllocations] = useState<PaymentAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!invoiceId) return;

    const fetchInvoice = async () => {
      try {
        const data = await getPaymentAllocationsByInvoiceId(invoiceId);
        const invoice = await getInvoiceById(invoiceId);
        console.log(invoice);
        setInvoice(invoice);
        setAllocations(data);
      } catch (err) {
        console.error('Error fetching invoice:', err);
        toast.error('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-800 text-green-100">Paid</Badge>;
      case 'partially_paid':
        return (
          <Badge className="bg-yellow-700 text-yellow-100">
            Partially Paid
          </Badge>
        );
      case 'pending':
        return <Badge className="bg-red-800 text-red-100">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading)
    return (
      <div>
        <Button onClick={() => navigate(-1)} variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex justify-center items-center min-h-[85vh]">
          <Spinner size="large" />
        </div>
      </div>
    );

  if (!invoice) return null;

  return (
    <div>
      <Button onClick={() => navigate(-1)} variant="ghost" className="mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <h1 className="text-2xl font-bold mb-2">Invoice Details</h1>

      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-muted-foreground">Invoice No</p>
              <p className="font-medium">{invoice.invoiceNo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{invoice.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{invoice.date}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">
                {getStatusBadge(invoice.status)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-medium">
                {invoice.totalAmount.toLocaleString()} {invoice.currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recieved in JPY</p>
              <p className="font-medium">
                {invoice.recievedJPY.toLocaleString()} JPY
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount Paid</p>
              <p className="font-medium">
                {invoice.amountPaid.toLocaleString()} {invoice.currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="font-medium">
                {invoice.balance.toLocaleString()} {invoice.currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Foreign Bank Charge
              </p>
              <p className="font-medium">
                {invoice.foreignBankCharge
                  ? invoice.foreignBankCharge.toLocaleString()
                  : 0}{' '}
                {invoice.currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Local Bank Charge</p>
              <p className="font-medium">
                {invoice.localBankCharge
                  ? invoice.localBankCharge.toLocaleString()
                  : 0}{' '}
                JPY
              </p>
            </div>
            {invoice.invoiceLink && (
              <div>
                <p className="text-sm text-muted-foreground">Invoice File</p>
                <a
                  href={invoice.invoiceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline font-medium"
                >
                  View Invoice
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardContent>
          <CardTitle className="text-lg font-semibold mb-4">
            Allocations
          </CardTitle>
          <div>
            {allocations.length === 0 ? (
              <p className="text-muted-foreground">No allocations found.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {allocations.map((allocation) => (
                  <div
                    key={allocation.id}
                    className="border p-4 rounded-md shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">
                        Payment ID: {allocation.paymentId}
                      </span>
                    </div>
                    <div>
                      <Label
                        htmlFor={`alloc-${allocation.id}`}
                        className="text-sm"
                      >
                        Allocated Amount
                      </Label>
                      <Input
                        id={`alloc-${allocation.id}`}
                        value={`${allocation.allocatedAmount} ${invoice.currency}`}
                        readOnly
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
