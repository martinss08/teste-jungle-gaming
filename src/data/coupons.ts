export type CouponStatus = 'disponivel' | 'usado' | 'expirado'

export type Coupon = {
  code: string
  title: string
  description: string
  percent: number
  status: CouponStatus
  expiresAt: string
}

export const coupons: Coupon[] = [
  {
    code: 'KURIO10',
    title: '10% em qualquer compra',
    description: 'Valido para NFTs disponiveis no marketplace.',
    percent: 10,
    status: 'disponivel',
    expiresAt: '2026-10-31',
  },
  {
    code: 'JUNGLE10',
    title: '10% no proximo drop',
    description: 'Valido para compras acima de 0.30 ETH em colecoes selecionadas.',
    percent: 10,
    status: 'disponivel',
    expiresAt: '2026-10-31',
  },
  {
    code: 'FREEMINT',
    title: '5% de bonus na compra',
    description: 'Desconto promocional para colecionadores ativos.',
    percent: 5,
    status: 'disponivel',
    expiresAt: '2026-11-15',
  },
  {
    code: 'APE5',
    title: '5% em GreenMint Apes',
    description: 'Cupom usado em uma compra anterior.',
    percent: 5,
    status: 'usado',
    expiresAt: '2026-08-20',
  },
]

export const availableCoupons = coupons.filter((coupon) => coupon.status === 'disponivel')

export function findCoupon(code: string) {
  const normalized = code.trim().toUpperCase()
  return coupons.find((coupon) => coupon.code === normalized)
}
