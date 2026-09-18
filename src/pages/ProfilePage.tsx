import { Camera, KeyRound, Save } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Label, Textarea } from '../components/ui/Field'

export function ProfilePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primarySoft">Perfil do colecionador</span>
        <h1 className="mt-2 font-display text-4xl font-bold">Dados da conta</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card className="p-5 text-center">
          <div className="mx-auto grid size-32 place-items-center overflow-hidden rounded-lg bg-primary/20">
            <img src="https://api.dicebear.com/9.x/notionists/svg?seed=julia" alt="Avatar de Julia" className="h-full w-full object-cover" />
          </div>
          <h2 className="mt-4 text-xl font-bold">Julia Monteiro</h2>
          <p className="text-sm text-foreground/55">Colecionadora desde 2024</p>
          <Button variant="secondary" className="mt-5 w-full">
            <Camera size={16} />
            Alterar avatar
          </Button>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-display text-2xl font-bold">Informacoes pessoais</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Nome</Label>
                <Input id="profile-name" defaultValue="Julia Monteiro" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input id="profile-email" defaultValue="julia@greenmint.dev" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" defaultValue="Coleciono obras digitais ligadas a impacto ambiental e comunidades independentes." />
              </div>
            </div>
            <Button className="mt-5">
              <Save size={16} />
              Salvar alteracoes
            </Button>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-2xl font-bold">Alterar senha</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <Input type="password" placeholder="Senha atual" aria-label="Senha atual" />
              <Input type="password" placeholder="Nova senha" aria-label="Nova senha" />
              <Input type="password" placeholder="Confirmar senha" aria-label="Confirmar nova senha" />
            </div>
            <Button variant="secondary" className="mt-5">
              <KeyRound size={16} />
              Atualizar senha
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
