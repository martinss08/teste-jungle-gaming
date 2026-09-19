import { Link } from '@tanstack/react-router'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

const homeSearch = { q: '', rarity: 'todos', category: 'todos', minPrice: '', maxPrice: '', sort: 'recentes', page: 1 }

export function NotFoundPage() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center px-4 py-12">
      <Card className="p-8 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primarySoft">404</span>
        <h1 className="mt-3 font-display text-4xl font-bold">Pagina nao encontrada</h1>
        <p className="mt-3 text-foreground/60">O recurso solicitado nao existe ou ainda nao faz parte do escopo.</p>
        <Link to="/" search={homeSearch} className="mt-6 inline-block">
          <Button>Voltar ao inicio</Button>
        </Link>
      </Card>
    </div>
  )
}
