'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Smartphone, QrCode } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useOrderSocket } from '@/hooks/use-socket';

interface PaymentProps {
  orderId: string;
  totalAmount: number;
  customerEmail: string;
  onPaymentSuccess?: (paymentData: any) => void;
  onPaymentError?: (error: string) => void;
}

interface PaymentResponse {
  success: boolean;
  payment?: {
    preferenceId: string;
    initPoint: string;
    sandboxInitPoint: string;
    orderId: string;
    totalAmount: number;
    paymentMethod: string;
  };
  error?: string;
}

export function MercadoPagoPayment({ 
  orderId, 
  totalAmount, 
  customerEmail,
  onPaymentSuccess,
  onPaymentError 
}: PaymentProps) {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentResponse['payment'] | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'preference' | 'pix'>('preference');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const { socket, connected } = useOrderSocket(orderId);

  // Criar pagamento
  const createPayment = async (method: 'preference' | 'pix') => {
    try {
      setLoading(true);
      console.log('🏦 Criando pagamento...', { orderId, method, totalAmount });

      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          paymentMethod: method,
          customerEmail
        })
      });

      const data: PaymentResponse = await response.json();
      
      if (!data.success || !data.payment) {
        throw new Error(data.error || 'Erro ao criar pagamento');
      }

      setPaymentData(data.payment);
      
      if (method === 'pix') {
        // Para PIX, o initPoint contém o QR Code base64
        setQrCodeData(data.payment.initPoint);
      }

      toast({
        title: "Pagamento criado",
        description: method === 'pix' 
          ? "Use o QR Code PIX para pagar" 
          : "Redirecionando para o Mercado Pago...",
      });

      return data.payment;

    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error);
      const errorMessage = error.message || 'Erro ao processar pagamento';
      
      toast({
        title: "Erro no pagamento",
        description: errorMessage,
        variant: "destructive"
      });

      if (onPaymentError) {
        onPaymentError(errorMessage);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Abrir checkout do Mercado Pago
  const openCheckout = async () => {
    const payment = paymentData || await createPayment('preference');
    
    if (payment) {
      // Abrir em nova janela/aba
      const checkoutUrl = process.env.NODE_ENV === 'development' 
        ? payment.sandboxInitPoint 
        : payment.initPoint;
        
      window.open(checkoutUrl, '_blank');
      
      // Monitorar pagamento via Socket.io
      if (socket) {
        console.log('🔍 Monitorando pagamento via Socket.io...');
      }
    }
  };

  // Criar pagamento PIX
  const createPixPayment = async () => {
    const payment = await createPayment('pix');
    
    if (payment) {
      setPaymentMethod('pix');
    }
  };

  // Configurar listeners do Socket.io para monitorar pagamento
  useEffect(() => {
    if (!socket) return;

    const handlePaymentApproved = (data: any) => {
      console.log('💰 Pagamento aprovado via Socket.io:', data);
      
      toast({
        title: "Pagamento Aprovado!",
        description: "Seu pedido foi confirmado e está sendo preparado.",
        duration: 10000
      });

      if (onPaymentSuccess) {
        onPaymentSuccess(data);
      }
    };

    const handleOrderStatusUpdated = (data: any) => {
      console.log('📋 Status do pedido atualizado:', data);
      
      if (data.status === 'RECEIVED') {
        toast({
          title: "Pedido Confirmado!",
          description: "Seu pedido foi recebido e está sendo preparado.",
          duration: 10000
        });
      }
    };

    socket.on('payment-approved', handlePaymentApproved);
    socket.on('order-status-updated', handleOrderStatusUpdated);

    return () => {
      socket.off('payment-approved', handlePaymentApproved);
      socket.off('order-status-updated', handleOrderStatusUpdated);
    };
  }, [socket, onPaymentSuccess]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Finalizar Pagamento
          <Badge variant="outline">
            R$ {totalAmount.toFixed(2)}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status da conexão */}
        <div className="flex items-center justify-between text-sm">
          <span>Status da conexão:</span>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={connected ? 'text-green-600' : 'text-red-600'}>
              {connected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        {/* Informações do pedido */}
        <div className="text-sm text-muted-foreground">
          <p>Pedido: #{orderId.slice(-6)}</p>
          <p>Email: {customerEmail}</p>
        </div>

        {/* Métodos de pagamento */}
        <div className="space-y-3">
          {/* Checkout padrão (cartão, boleto, etc.) */}
          <Button
            onClick={openCheckout}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading && paymentMethod === 'preference' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4 mr-2" />
            )}
            Pagar com Cartão/Boleto
          </Button>

          {/* PIX */}
          <Button
            onClick={createPixPayment}
            disabled={loading}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {loading && paymentMethod === 'pix' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Smartphone className="w-4 h-4 mr-2" />
            )}
            Pagar com PIX
          </Button>
        </div>

        {/* QR Code PIX */}
        {paymentMethod === 'pix' && qrCodeData && (
          <div className="mt-6 p-4 border rounded-lg text-center">
            <div className="flex items-center justify-center mb-3">
              <QrCode className="w-5 h-5 mr-2" />
              <span className="font-medium">Pagamento PIX</span>
            </div>
            
            {/* QR Code Image */}
            <div className="mb-4">
              <img 
                src={`data:image/png;base64,${qrCodeData}`}
                alt="QR Code PIX"
                className="mx-auto max-w-[200px] border rounded"
              />
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">
              Escaneie o QR Code com seu app do banco ou PIX
            </p>
            
            <div className="text-xs text-muted-foreground">
              <p>• O pagamento será confirmado automaticamente</p>
              <p>• Você receberá uma notificação quando aprovado</p>
            </div>
          </div>
        )}

        {/* Informações adicionais */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Pagamento processado pelo Mercado Pago</p>
          <p>• Ambiente: {process.env.NODE_ENV === 'development' ? 'Teste' : 'Produção'}</p>
          <p>• Seu pedido será confirmado automaticamente após o pagamento</p>
        </div>

        {/* Debug info (apenas em desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && paymentData && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <p className="font-medium">Debug Info:</p>
            <p>Preference ID: {paymentData.preferenceId}</p>
            <p>Payment Method: {paymentData.paymentMethod}</p>
            <p>Socket Connected: {connected ? 'Yes' : 'No'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}