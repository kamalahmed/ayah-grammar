// Concise teaching notes paraphrased from the Quranic Arabic Corpus verb-form guide.
// These describe common uses of patterns, not the meaning of every verb in a pattern.
export const triliteralGuide: Record<string, string> = {
  I: 'The basic pattern. Its meaning comes mainly from the root; it may take an object or stand alone.',
  II: 'Often adds intensity, repetition, or a causative sense: making someone do the action.',
  III: 'Often involves another participant, sometimes with a mutual or shared action.',
  IV: 'Often makes an action causative or moves someone or something into a new state.',
  V: 'Related to Form II; often describes undergoing or doing the action to oneself.',
  VI: 'Related to Form III; often expresses a shared or reciprocal action.',
  VII: 'Often expresses undergoing an action or being affected by it.',
  VIII: 'Often expresses a reflexive, deliberate, or reciprocal action.',
  IX: 'Usually describes becoming a color or acquiring a physical quality.',
  X: 'Often expresses seeking something, asking for it, or causing a change.',
}

export const quadriliteralGuide: Record<string, string> = {
  I: 'The basic four-root-letter pattern.',
  II: 'Often describes an action affecting the doer, related to the basic pattern.',
  III: 'Usually describes undergoing a change or action.',
  IV: 'Often describes entering or being in a state.',
}

export const verbFormsSource = 'https://corpus.quran.com/documentation/verbforms.jsp'
