import type { MockScenario } from '../contracts/api'
import { defaultScenario, setScenario } from './state'

type ScenarioPreset = {
  label: string
  description: string
  scenario: Partial<MockScenario>
}

// Cenarios reproduziveis, aplicados sobre o cenario padrao por `?cenario=<nome>`.
const scenarioPresets: Record<string, ScenarioPreset> = {
  padrao: { label: 'Padrao', description: 'Latencia curta, pagamento confirmado.', scenario: {} },
  lento: { label: 'Rede lenta', description: 'Latencia de 1,5 s com variacao de ate 0,8 s.', scenario: { latencyMs: 1500, jitterMs: 800 } },
  instavel: { label: 'Rede instavel', description: 'As 3 proximas requisicoes falham com 503.', scenario: { failNextCount: 3 } },
  offline: { label: 'Sem conexao', description: 'REST com erro de rede e Socket.IO desconectado.', scenario: { offline: true } },
  'fora-de-ordem': { label: 'Fora de ordem', description: 'A proxima listagem responde 2 s depois da seguinte.', scenario: { slowNextListMs: 2000 } },
  'sessao-expirada': { label: 'Sessao expirada', description: 'Toda sessao passa a ser recusada (401).', scenario: { forceSessionExpired: true } },
  'carteira-recusada': { label: 'Carteira recusa', description: 'A conexao da carteira e recusada.', scenario: { walletConnection: 'recusar' } },
  'pagamento-recusado': { label: 'Pagamento recusado', description: 'O pedido termina recusado.', scenario: { paymentResult: 'recusado' } },
  'pagamento-pendente': { label: 'Pagamento pendente', description: 'O pedido fica pendente indefinidamente.', scenario: { paymentResult: 'pendente' } },
  'timeout-pedido': { label: 'Timeout no pedido', description: 'O proximo pedido e criado, mas a resposta falha com 504.', scenario: { timeoutNextOrder: true } },
}

function presetScenario(name: string): MockScenario {
  return { ...defaultScenario, ...scenarioPresets[name]?.scenario }
}

const appliedPresetKey = 'kurio-mock-preset'

// `?cenario=<nome>` aplica o preset uma vez por aba; recarregar a pagina nao reinicia o cenario em andamento.
export function applyScenarioFromUrl() {
  const name = new URLSearchParams(window.location.search).get('cenario')
  if (!name || !scenarioPresets[name]) return
  try {
    if (sessionStorage.getItem(appliedPresetKey) === name) return
    sessionStorage.setItem(appliedPresetKey, name)
  } catch {
    // Sem sessionStorage o preset e aplicado a cada carregamento.
  }
  setScenario(presetScenario(name))
}
