import { Link } from '@tanstack/react-router'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { useCart } from '../modules/cart/useCart'

export function OrderSummary({ action = 'checkout' }: { action?: 'checkout' | 'confirm' }) {
  const { subtotalEth, discountEth, networkFeeEth, totalEth, itemCount } = useCart()

  return (
    <Card className="p-4">
      <h2 className="font-display text-xl font-bold">Resumo</h2>
      <dl className="mt-4 grid gap-3 text-sm">
        <div className="flex justify-between text-foreground/65">
          <dt>Itens</dt>
          <dd>{itemCount}</dd>
        </div>
        <div className="flex justify-between text-foreground/65">
          <dt>Subtotal</dt>
          <dd>{subtotalEth.toFixed(2)} ETH</dd>
        </div>
        <div className="flex justify-between text-foreground/65">
          <dt>Desconto</dt>
          <dd>-{discountEth.toFixed(2)} ETH</dd>
        </div>
        <div className="flex justify-between text-foreground/65">
          <dt>Taxa de rede</dt>
          <dd>{networkFeeEth.toFixed(2)} ETH</dd>
        </div>
        <div className="border-t border-border pt-3">
          <div className="flex justify-between text-lg font-bold">
            <dt>Total</dt>
            <dd className="text-primarySoft">{totalEth.toFixed(2)} ETH</dd>
          </div>
        </div>
      </dl>
      {action === 'checkout' ? (
        <Link to="/pagamento" className="mt-5 block">
          <Button className="w-full" size="lg" disabled={!itemCount}>
            Continuar para pagamento
          </Button>
        </Link>
      ) : (
        <Link to="/confirmacao" className="mt-5 block">
          <Button className="w-full" size="lg" disabled={!itemCount}>
            Enviar pedido
          </Button>
        </Link>
      )}
      <p className="mt-3 text-xs leading-5 text-foreground/45">
        Cotacao simulada. Na proxima fase, os totais virao da API REST mockada.
      </p>
    </Card>
  )
}
