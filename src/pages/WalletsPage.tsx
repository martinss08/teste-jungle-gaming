import { Plus, Save, WalletCards } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Label, Select } from '../components/ui/Field'
import { wallets } from '../data/nfts'

export function WalletsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primarySoft">Carteiras</span>
          <h1 className="mt-2 font-display text-4xl font-bold">Gerencie enderecos</h1>
        </div>
        <Button>
          <Plus size={18} />
          Nova carteira
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {wallets.map((wallet) => (
          <Card key={wallet.id} className="p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-md bg-primary/15 text-primarySoft">
                <WalletCards size={21} />
              </span>
              <div>
                <h2 className="text-xl font-bold">{wallet.label}</h2>
                <p className="mt-1 text-sm text-foreground/55">{wallet.address}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4">
              <div className="space-y-2">
                <Label htmlFor={`${wallet.id}-label`}>Nome</Label>
                <Input id={`${wallet.id}-label`} defaultValue={wallet.label} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${wallet.id}-address`}>Endereco</Label>
                <Input id={`${wallet.id}-address`} defaultValue={wallet.address} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${wallet.id}-network`}>Rede</Label>
                <Select id={`${wallet.id}-network`} defaultValue={wallet.network}>
                  <option>Ethereum</option>
                  <option>Polygon</option>
                  <option>Solana</option>
                </Select>
              </div>
            </div>
            <Button variant="secondary" className="mt-5">
              <Save size={16} />
              Salvar carteira
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
