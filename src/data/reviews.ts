import type { NftReview } from '../contracts/api'

const reviewTemplates: Array<Omit<NftReview, 'id'>> = [
  {
    name: 'Lia Marques',
    handle: '@liamint',
    rating: 5,
    date: '12 set 2026',
    text: 'A arte tem presenca forte na colecao. O arquivo em alta resolucao veio impecavel e a procedencia ficou clara desde a compra.',
  },
  {
    name: 'Caio Venn',
    handle: '@caiovenn',
    rating: 5,
    date: '10 set 2026',
    text: 'Gostei da combinacao de atributos e do historico do criador. E uma peca que funciona bem tanto no perfil quanto como item de longo prazo.',
  },
  {
    name: 'Nina Costa',
    handle: '@ninacoleta',
    rating: 4,
    date: '08 set 2026',
    text: 'Visual muito limpo, metadados organizados e boa liquidez na colecao. Fiquei de olho em outras edicoes depois dessa compra.',
  },
  {
    name: 'Rafa Orion',
    handle: '@rafaorion',
    rating: 5,
    date: '05 set 2026',
    text: 'A paleta e os detalhes de textura chamam atencao. A experiencia de compra foi simples e a transferencia apareceu rapido.',
  },
]

// Avaliacoes simuladas, deterministicas por NFT (quantidade e notas derivadas do id).
export function buildNftReviews(nftId: string): NftReview[] {
  const seed = [...nftId].reduce((total, char) => (total * 31 + char.charCodeAt(0)) % 9973, 17)
  const count = 7 + (seed % 19)
  return Array.from({ length: count }, (_, index) => {
    const template = reviewTemplates[index % reviewTemplates.length]
    return {
      ...template,
      id: `${nftId}-review-${index + 1}`,
      name: index < reviewTemplates.length ? template.name : `${template.name} ${index + 1}`,
      rating: index % 6 === 0 ? 4 : template.rating,
      date: `${String((index % 24) + 1).padStart(2, '0')} set 2026`,
    }
  })
}
