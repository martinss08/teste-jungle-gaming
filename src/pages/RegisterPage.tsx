import { Link } from '@tanstack/react-router'
import { Button } from '../components/ui/Button'
import { Input, Label } from '../components/ui/Field'
import { AuthLayout, MobileAuthShell, useAuthForm } from './LoginPage'

export function RegisterPage() {
  const registerForm = useAuthForm(true)

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
          <form className="grid gap-4" onSubmit={registerForm.handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" placeholder="Seu nome" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="voce@email.com" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" name="password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar</Label>
                <Input id="confirm" name="confirm" type="password" />
              </div>
            </div>
            {registerForm.error && <p className="text-sm font-semibold text-red-200">{registerForm.error}</p>}
            <Button type="submit" size="lg" disabled={registerForm.isSubmitting}>
              {registerForm.isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-foreground/60">
            Ja tem conta?{' '}
            <Link to="/login" search={{ redirect: '/' }} className="font-semibold text-primarySoft hover:underline">
              Entrar
            </Link>
          </p>
        </AuthLayout>
      </div>
    </>
  )
}
