import paradigms from './referenceParadigms.json'
import selectedParadigms from './selectedParadigms.json'

type ParadigmCell = { perfect: string; imperfect: string; imperative: string | null }
export type Paradigm = Record<string, ParadigmCell>

const data: Record<string, Record<string, Paradigm>> = paradigms
const selectedData: Record<string, Record<string, Record<string, Paradigm>>> = selectedParadigms

export function referenceParadigm(form: string, rootLength: number): Paradigm | null {
  const family = rootLength === 3 ? 'triliteral' : rootLength === 4 ? 'quadriliteral' : ''
  return data[family]?.[form] ?? null
}

export function selectedVerbParadigm(root: string | null, form: string, voice: string): Paradigm | null {
  return root ? selectedData[root]?.[form]?.[voice] ?? null : null
}
