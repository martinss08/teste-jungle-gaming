import { Button } from './ui/Button'

const benefits = [
  ['W', 'Seguranca da carteira', 'Proteja sua carteira e colecione arte digital verificada com confianca.'],
  ['C', 'Criadores em destaque', 'Conheca artistas, estudios e comunidades que moldam a cultura digital na rede.'],
  ['D', 'Alertas de lancamentos', 'Receba calendarios de cunhagem, novidades de listas de acesso e analises do mercado.'],
]

export function BenefitsSignup() {
  return (
    <section className="mt-24 bg-card">
      <div className="grid gap-0 md:grid-cols-4">
        {benefits.map(([letter, title, text]) => (
          <div key={title} className="border-b border-border p-8 md:border-b-0 md:border-r">
            <span className="grid size-16 place-items-center rounded-full bg-primary font-display text-xl font-bold text-[#160b08]">{letter}</span>
            <h3 className="mt-5 font-display text-base font-bold">{title}</h3>
            <p className="mt-3 text-sm font-bold leading-6 text-[#9b826d]">{text}</p>
          </div>
        ))}
        <div className="p-8">
          <h3 className="font-display text-base font-bold">Antecipe-se ao proximo lancamento</h3>
          <div className="mt-5 flex overflow-hidden rounded-sm border border-border bg-[#160b08]">
            <label htmlFor="newsletter-email" className="sr-only">E-mail para novidades</label>
            <input id="newsletter-email" disabled aria-describedby="newsletter-note" className="min-w-0 flex-1 bg-transparent px-4 text-sm text-foreground outline-none" placeholder="Digite seu e-mail..." />
            <Button className="rounded-none" disabled>Enviar</Button>
          </div>
          <p id="newsletter-note" className="mt-4 text-xs font-bold leading-5 text-[#9b826d]">
            Newsletter indisponivel nesta demonstracao.
          </p>
        </div>
      </div>
    </section>
  )
}
