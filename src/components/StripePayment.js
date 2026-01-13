import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { FaCreditCard, FaLock, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

const CheckoutForm = ({ bookingId, amount, onPaymentSuccess, onPaymentError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      // Create payment intent
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          bookingId: bookingId,
          amount: amount,
          currency: 'lkr'
        })
      });

      const { clientSecret, paymentIntentId } = await response.json();
      setPaymentIntentId(paymentIntentId);

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (error) {
        console.error('Payment failed:', error);
        toast.error(`Payment failed: ${error.message}`);
        onPaymentError && onPaymentError(error);
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm payment on our backend
        const confirmResponse = await fetch('/api/payments/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            bookingId: bookingId
          })
        });

        if (confirmResponse.ok) {
          toast.success('Payment successful!');
          onPaymentSuccess && onPaymentSuccess(paymentIntent);
        } else {
          throw new Error('Failed to confirm payment');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      onPaymentError && onPaymentError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center mb-4">
          <FaLock className="w-4 h-4 text-green-600 mr-2" />
          <span className="text-sm font-medium text-gray-700">Secure Payment</span>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="p-3 border border-gray-300 rounded-md bg-white">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          <p>Amount: LKR {amount.toFixed(2)}</p>
          <p>Your payment information is encrypted and secure.</p>
        </div>

        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <FaCreditCard className="w-4 h-4 mr-2" />
              Pay LKR {amount.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

const StripePayment = ({ bookingId, amount, onPaymentSuccess, onPaymentError }) => {
  if (!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          Stripe is not configured. Please add REACT_APP_STRIPE_PUBLISHABLE_KEY to your environment variables.
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        bookingId={bookingId}
        amount={amount}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
      />
    </Elements>
  );
};

export default StripePayment;














