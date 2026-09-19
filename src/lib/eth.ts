// Valores ETH trafegam como strings decimais. Toda aritmetica usa BigInt em
// unidades de 1e-18 (wei) para evitar erros de ponto flutuante.
const DECIMALS = 18
const SCALE = 10n ** BigInt(DECIMALS)

export function parseEth(value: string | undefined | null): bigint {
  const raw = (value ?? '0').trim()
  if (!/^-?\d*(\.\d*)?$/.test(raw) || raw === '' || raw === '-') return 0n
  const negative = raw.startsWith('-')
  const [whole = '0', fraction = ''] = (negative ? raw.slice(1) : raw).split('.')
  const wei = BigInt(whole || '0') * SCALE + BigInt(fraction.padEnd(DECIMALS, '0').slice(0, DECIMALS) || '0')
  return negative ? -wei : wei
}

export function toEthString(wei: bigint, fractionDigits = 3): string {
  const negative = wei < 0n
  const absolute = negative ? -wei : wei
  const unit = 10n ** BigInt(DECIMALS - fractionDigits)
  // arredondamento half-up na casa pedida
  const rounded = (absolute + unit / 2n) / unit
  const divisor = 10n ** BigInt(fractionDigits)
  const whole = rounded / divisor
  const fraction = fractionDigits ? `.${String(rounded % divisor).padStart(fractionDigits, '0')}` : ''
  return `${negative && rounded !== 0n ? '-' : ''}${whole}${fraction}`
}

export function addEth(...values: string[]) {
  return toEthString(values.reduce((total, value) => total + parseEth(value), 0n))
}

export function subtractEth(a: string, b: string) {
  return toEthString(parseEth(a) - parseEth(b))
}

export function multiplyEth(value: string, quantity: number) {
  return toEthString(parseEth(value) * BigInt(quantity))
}

export function percentOfEth(value: string, percent: number) {
  return toEthString((parseEth(value) * BigInt(percent)) / 100n)
}

export function compareEth(a: string, b: string) {
  const diff = parseEth(a) - parseEth(b)
  return diff === 0n ? 0 : diff > 0n ? 1 : -1
}

export function maxEth(a: string, b: string) {
  return compareEth(a, b) >= 0 ? a : b
}

export function formatEth(value: string | undefined | null, fractionDigits = 3) {
  return `${toEthString(parseEth(value), fractionDigits)} ETH`
}
