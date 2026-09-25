import selectedParadigms from './selectedParadigms.json'

type ParadigmCell = { perfect: string; imperfect: string; imperative: string | null }
export type Paradigm = Record<string, ParadigmCell>

const selectedData: Record<string, Record<string, Record<string, Paradigm>>> = selectedParadigms

export { referenceParadigm } from './referenceParadigm'

export function selectedVerbParadigm(root: string | null, form: string, voice: string): Paradigm | null {
  return root ? selectedData[root]?.[form]?.[voice] ?? null : null
}
