import { Link } from '@tanstack/react-router'
import { ArrowLeft, ChevronDown, MoreVertical, WalletCards } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { nfts } from '../data/nfts'
import { formatEth } from '../lib/utils'
import type { CartLine } from '../types'
import { useCart } from '../modules/cart/useCart'

const homeSearch = { q: '', rarity: 'todos', sort: 'recentes', page: 1 }
const displayPrices = [1.19, 1.39, 1.79]

function buildDisplayLines(items: CartLine[]): CartLine[] {
  const fallbacks: CartLine[] = [
    { nftId: 'emerald-ape-042', quantity: 2 },
    { nftId: 'sage-hood-804', quantity: 6 },
    { nftId: 'onyx-visual-232', quantity: 9 },
  ]
  return items.length >= 3 ? items.slice(0, 3) : fallbacks
}

function Field({
  label,
  required = true,
  placeholder,
  select = false,
}: {
  label: string
  required?: boolean
  placeholder?: string
  select?: boolean
}) {
  return (
    <label className="block font-display text-base">
      <span>
        {label}
        {required && <span className="text-primary"> *</span>}
      </span>
      <span className="relative mt-2 block">
        <input
          className="h-10 w-full rounded-sm border border-border bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-[#a98461] focus:border-primary"
          placeholder={placeholder}
          readOnly={select}
        />
        {select && <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a98461]" size={16} />}
      </span>
    </label>
  )
}

function BenefitsSignup() {
  return (
    <section className="mt-24 bg-card">
      <div className="grid gap-0 md:grid-cols-4">
        {[
          ['W', 'Seguranca da carteira', 'Proteja sua carteira e colecione arte digital verificada com confianca.'],
          ['C', 'Criadores em destaque', 'Conheca artistas, estudios e comunidades que moldam a cultura digital na rede.'],
          ['D', 'Alertas de lancamentos', 'Receba calendarios de cunhagem, novidades de listas de acesso e analises do mercado.'],
        ].map(([letter, title, text]) => (
          <div key={title} className="border-b border-border p-8 md:border-b-0 md:border-r">
            <span className="grid size-16 place-items-center rounded-full bg-primary font-display text-xl font-bold text-[#160b08]">{letter}</span>
            <h3 className="mt-5 font-display text-base font-bold">{title}</h3>
            <p className="mt-3 text-sm font-bold leading-6 text-[#9b826d]">{text}</p>
          </div>
        ))}
        <div className="p-8">
          <h3 className="font-display text-base font-bold">Antecipe-se ao proximo lancamento</h3>
          <div className="mt-5 flex overflow-hidden rounded-sm border border-border bg-[#160b08]">
            <input className="min-w-0 flex-1 bg-transparent px-4 text-sm text-foreground outline-none" placeholder="Digite seu e-mail..." />
            <Button className="rounded-none">Enviar</Button>
          </div>
          <p className="mt-4 text-xs font-bold leading-5 text-[#9b826d]">Receba lancamentos selecionados, historias de criadores e novidades do mercado.</p>
        </div>
      </div>
    </section>
  )
}

export function CheckoutPage() {
  const { items } = useCart()
  const displayLines = buildDisplayLines(items)
  const subtotal = displayLines.reduce((total, line, index) => total + displayPrices[index] * line.quantity, 0)
  const networkFee = displayLines.length ? 0.016 : 0
  const total = subtotal + networkFee

  return (
    <>
      <MobileCheckoutPage />

      <div className="mx-auto hidden max-w-[1440px] px-4 pb-14 pt-9 sm:px-6 md:block lg:px-[120px]">
      <div className="font-display text-base font-bold text-foreground">
        <Link to="/" search={homeSearch} className="hover:text-primarySoft">Inicio</Link>
        <span className="px-2 text-[#8f7560]">/</span>
        <Link to="/" search={homeSearch} hash="catalogo" className="hover:text-primarySoft">Mercado</Link>
        <span className="px-2 text-[#8f7560]">/</span>
        <span>Pagamento</span>
      </div>

      <section className="mt-8 grid gap-16 lg:grid-cols-[1fr_405px]">
        <div>
          <h1 className="font-display text-xl font-bold">Perfil do colecionador</h1>
          <form className="mt-4 grid gap-5 md:grid-cols-2">
            <Field label="Nome de exibicao" />
            <Field label="Nome de usuario" />
            <Field label="Rede" placeholder="Selecione uma rede" select />
            <Field label="Nome do perfil" />
            <Field label="Endereco da carteira" placeholder="Endereco 0x da carteira" />
            <Field label="" required={false} placeholder="ENS ou carteira secundaria (opcional)" />
            <Field label="Tipo de carteira" placeholder="Selecione uma carteira" select />
            <Field label="Codigo de indicacao" />
            <Field label="E-mail" />
            <div className="grid grid-cols-[1fr_80px] gap-3">
              <Field label="Nome ENS" placeholder=".eth" select />
            </div>
          </form>

          <label className="mt-5 flex items-center gap-2 font-display text-base">
            <input type="radio" className="size-4 appearance-none rounded-full border-2 border-primary bg-transparent checked:bg-primary" />
            Usar outra carteira?
          </label>

          <label className="mt-5 block max-w-[350px] font-display text-base">
            <span>Observacao do colecionador (opcional)</span>
            <textarea className="mt-2 h-[150px] w-full rounded-sm border border-border bg-transparent p-3 text-sm text-foreground outline-none focus:border-primary" />
          </label>
        </div>

        <aside>
          <h2 className="font-display text-xl font-bold">Seus NFTs</h2>
          <div className="mt-3 grid grid-cols-[1fr_130px] border-b border-border pb-2 font-display text-base font-bold">
            <span>NFTs</span>
            <span className="text-right">Subtotal</span>
          </div>
          <div className="mt-3 space-y-3">
            {displayLines.map((line, index) => {
              const nft = nfts.find((item) => item.id === line.nftId)!
              const title = index === 0 ? 'Emerald Ape #042' : index === 1 ? 'Violet Nomad #314' : 'Ivory Baron #088'
              const token = index === 0 ? '#0042' : index === 1 ? '#0314' : '#0088'
              const lineTotal = displayPrices[index] * line.quantity

              return (
                <div key={`${line.nftId}-${index}`} className="grid grid-cols-[70px_1fr_auto] items-center gap-3 bg-card p-2">
                  <div className="size-[70px] overflow-hidden rounded-md bg-[#efe7d2]">
                    <img src={nft.hero} alt={title} className="h-full w-full object-cover" />
                  </div>
                  <div className="font-display font-bold">
                    <h3 className="text-base">{title} <span className="font-normal text-[#b29274]">(x {line.quantity})</span></h3>
                    <p className="mt-1 text-sm text-[#b29274]">ID do token: {token}</p>
                  </div>
                  <p className="font-display text-lg font-bold text-primarySoft">{formatEth(lineTotal)}</p>
                </div>
              )
            })}
          </div>

          <p className="mt-3 text-center font-display text-sm">Tem um codigo promocional? Aplique aqui</p>

          <dl className="mt-4 grid gap-3 border-b border-border pb-4 font-display text-base">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{subtotal.toFixed(2)} ETH</dd>
            </div>
            <div className="flex justify-between">
              <dt>Desconto do lancamento</dt>
              <dd>(-) 00.00</dd>
            </div>
            <div className="flex justify-between">
              <dt>Taxa de rede</dt>
              <dd>{networkFee.toFixed(3)} ETH</dd>
            </div>
            <p className="-mt-1 text-right text-xs text-primarySoft">Taxa estimada</p>
          </dl>

          <div className="mt-3 flex justify-between px-10 font-display text-lg font-bold">
            <span>Total</span>
            <span className="text-primarySoft">{total.toFixed(3)} ETH</span>
          </div>

          <h2 className="mt-3 text-center font-display text-xl font-bold">Carteira e rede</h2>
          <div className="mt-4 grid gap-4">
            {([
              ['METAMASK • WALLETCONNECT • COINBASE', false],
              ['MetaMask', false],
              ['Coinbase Wallet', true],
            ] as Array<[string, boolean]>).map(([label, checked]) => (
              <label key={label} className={checked ? 'flex h-44px items-center gap-3 rounded-sm border border-primary px-3 py-3 font-display' : 'flex items-center gap-3 rounded-sm border border-border px-3 py-3 font-display'}>
                <input name="wallet" type="radio" defaultChecked={Boolean(checked)} className="size-4 appearance-none rounded-full border-2 border-primary checked:bg-primary" />
                <span className={label.includes('•') ? 'rounded-sm bg-[#3a1d09] px-2 py-1 text-[0.62rem] font-bold uppercase text-primary' : ''}>{label}</span>
              </label>
            ))}
          </div>

          <Link to="/confirmacao" className="mt-6 block">
            <Button className="w-full" size="lg">Confirmar compra</Button>
          </Link>
        </aside>
      </section>

      <BenefitsSignup />
      </div>
    </>
  )
}

function MobileCheckoutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#120906] px-7 pb-8 pt-8 font-mono text-foreground md:hidden">
      <header className="grid grid-cols-[44px_1fr] items-center gap-4">
        <Link to="/carrinho" className="grid size-9 place-items-center rounded-full border border-border bg-card text-primarySoft" aria-label="Voltar">
          <ArrowLeft size={19} />
        </Link>
        <h1 className="text-xl font-black tracking-[0.05em]">Pagamento com carteira</h1>
      </header>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-black tracking-[0.04em]">Carteira conectada</h2>
        <button type="button" className="text-sm font-black tracking-[0.07em] text-primarySoft">
          Trocar carteira
        </button>
      </div>

      <div className="mt-4 grid gap-5">
        <MobileWalletCard title="Reserva" subtitle="nova.kurio.eth" meta="Rede Polygon" active />
        <MobileWalletCard title="Principal" subtitle="0xA91F...E82C" meta="Rede principal Ethereum" />
      </div>

      <h2 className="mt-5 font-black tracking-[0.04em]">Carteira e rede</h2>
      <div className="mt-4 grid gap-4">
        {([
          ['W', 'WalletConnect', false],
          ['M', 'MetaMask', false],
          ['wallet', 'Coinbase Wallet', true],
        ] as Array<[string, string, boolean]>).map(([icon, label, checked]) => (
          <label key={label} className="flex h-[64px] items-center gap-4 rounded-xl bg-card px-4 py-4">
            <span className="grid size-10 place-items-center rounded-full border border-border bg-[#3a2118] text-sm text-primarySoft">
              {icon === 'wallet' ? <WalletCards size={19} /> : icon}
            </span>
            <span className="flex-1 text-sm">{label}</span>
            <input type="radio" name="mobile-wallet" defaultChecked={Boolean(checked)} className="size-4 appearance-none rounded-full border border-border checked:border-primary checked:ring-2 checked:ring-primarySoft/60" />
          </label>
        ))}
      </div>

      <div className="mt-9 flex justify-end gap-6 text-lg font-black">
        <span>Total:</span>
        <span className="text-primarySoft">8.936 ETH</span>
      </div>

      <div className="mt-auto pt-10">
        <Link to="/confirmacao" className="block">
          <button type="button" className="h-[58px] w-full rounded-[30px] bg-primary text-sm font-black text-[#120906]">
            Confirmar compra
          </button>
        </Link>
      </div>
    </div>
  )
}

function MobileWalletCard({
  title,
  subtitle,
  meta,
  active = false,
}: {
  title: string
  subtitle: string
  meta: string
  active?: boolean
}) {
  return (
    <article className="flex items-center gap-4 rounded-xl bg-card px-5 py-4">
      <span className={active ? 'grid size-4 place-items-center rounded-full border-2 border-primary text-primary' : 'size-4 rounded-full border border-border'} />
      <div className="min-w-0 flex-1">
        <h3 className="font-black">{title}</h3>
        <p className="mt-1 text-sm text-[#caa677]">{subtitle}</p>
        <p className="mt-1 text-sm text-[#caa677]">{meta}</p>
      </div>
      <MoreVertical size={18} className="text-[#caa677]" />
    </article>
  )
}
