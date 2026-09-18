import { Link } from '@tanstack/react-router'
import { Button } from '../components/ui/Button'
import { Input, Label } from '../components/ui/Field'
import { AuthLayout, MobileAuthShell } from './LoginPage'

export function RegisterPage() {
  return (
    <>
      <MobileAuthShell
        title="Criar perfil de colecionador"
        submitLabel="Criar perfil"
        footer="Ja tem uma conta? Entre"
        footerTo="/login"
        register
      />

      <div className="hidden md:block">
        <AuthLayout title="Criar conta" subtitle="Cadastre-se para favoritar NFTs e finalizar pedidos.">
          <form className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" placeholder="Seu nome" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="voce@email.com" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar</Label>
                <Input id="confirm" type="password" />
              </div>
            </div>
            <Button type="button" size="lg">Cadastrar</Button>
          </form>
          <p className="mt-5 text-center text-sm text-foreground/60">
            Ja tem conta?{' '}
            <Link to="/login" className="font-semibold text-primarySoft hover:underline">
              Entrar
            </Link>
          </p>
        </AuthLayout>
      </div>
    </>
  )
}
