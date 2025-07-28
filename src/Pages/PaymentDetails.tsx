import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getPaymentAllocations, getPaymentById } from '@/Config/firestore';
import type { Payment, PaymentAllocation } from '@/Config/types';
import { ArrowLeft } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent } from '@/components/ui/card';

export default function PaymentDetails() {
  const navigate = useNavigate();
  const { id: paymentId } = useParams();
  const [allocations, setAllocations] = useState<PaymentAllocation[]>([]);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!paymentId) return;

    const fetchData = async () => {
      try {
        const data = await getPaymentAllocations(paymentId);
        const payment = await getPaymentById(paymentId);
        setPayment(payment);
        setAllocations(data);
      } catch (error) {
        console.error('Error fetching allocations:', error);
        toast.error('Failed to load payment allocations');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [paymentId]);

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

  return (
    <div>
      <Button onClick={() => navigate(-1)} variant="ghost" className="mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <h1 className="text-2xl font-bold mb-2">Payment Details</h1>

      <Card>
        <CardContent>
          {payment && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{payment.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{payment.date}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="font-medium">{payment.currency}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-medium">
                  {payment.amount.toLocaleString()} {payment.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Local Bank Charge
                </p>
                <p className="font-medium">
                  {payment.localBankCharge.toLocaleString()} JPY
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Foreign Bank Charge
                </p>
                <p className="font-medium ">
                  {payment.foreignBankCharge.toLocaleString()}{' '}
                  {payment.currency}
                </p>
              </div>

              <div className="">
                <h2 className="text-lg font-semibold mb-2">Allocations</h2>
                {allocations.length === 0 ? (
                  <p className="text-muted-foreground">No allocations found.</p>
                ) : (
                  <div className="space-y-4">
                    {allocations.map((allocation) => (
                      <div
                        key={allocation.id}
                        className="border p-4 rounded-md shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">
                            Invoice No: {allocation.invoiceNo ?? 'N/A'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Invoice ID: {allocation.invoiceId}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <Label
                              htmlFor={`alloc-${allocation.id}`}
                              className="text-sm"
                            >
                              Allocated Amount
                            </Label>
                            <Input
                              id={`alloc-${allocation.id}`}
                              // type="number"
                              // step="0.01"
                              value={`${allocation.allocatedAmount} ${payment.currency}`}
                              readOnly
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
