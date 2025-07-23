import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getPaymentAllocations, getPaymentById } from '@/Config/firestore';
import type { Payment, PaymentAllocation } from '@/Config/types';
import { ArrowLeft, Loader2 } from 'lucide-react';

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

  const handleChange = (id: string, value: number) => {
    setAllocations((prev) =>
      prev.map((alloc) =>
        alloc.id === id ? { ...alloc, allocatedAmount: value } : alloc
      )
    );
  };

  if (loading)
    return (
      <div>
        <Button onClick={() => navigate(-1)} variant="outline" className="mb-4">
          <ArrowLeft /> Back
        </Button>
        <div className="flex justify-center items-center min-h-[85vh]">
          <Loader2 className="animate-spin h-12 w-12" />
        </div>
      </div>
    );

  return (
    <div>
      <Button onClick={() => navigate(-1)} variant="outline" className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <h1 className="text-xl font-bold mb-2">Payment Details</h1>

      {/* Display payment metadata */}
      {payment && (
        <div className="border p-4 rounded-lg mb-6 bg-muted">
          <div className="mb-1">
            <span className="font-semibold">Customer:</span>{' '}
            {payment.customerName}
          </div>
          <div className="mb-1">
            <span className="font-semibold">Amount:</span> {payment.amount}{' '}
            {payment.currency}
          </div>
          <div className="mb-1">
            <span className="font-semibold">Date:</span>{' '}
            {new Date(payment.date).toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Allocations section */}
      {allocations.length === 0 ? (
        <p className="text-muted-foreground">No allocations found.</p>
      ) : (
        allocations.map((allocation) => (
          <div key={allocation.id} className="mb-4">
            <Label className="block text-sm font-medium">
              Invoice No: {allocation.invoiceNo ?? 'N/A'}
            </Label>
            <Input
              type="number"
              step="0.01"
              value={allocation.allocatedAmount}
              onChange={(e) =>
                handleChange(allocation.id, parseFloat(e.target.value))
              }
              className="mt-1"
            />
          </div>
        ))
      )}

      <Button
        onClick={() => {
          toast.success('Saved (not implemented)');
          // Save logic placeholder
        }}
        className="mt-4"
      >
        Save Allocations
      </Button>
    </div>
  );
}
