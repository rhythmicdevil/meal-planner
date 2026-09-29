// A step line starting with "#" (one or more, markdown-heading-style) is a section heading
// within the instructions ("# For the sauce") rather than an actual imperative step -- shown
// bold instead of as plain step text, in both the editor and the recipe detail view.
export function parseStepLine(text: string): { isHeading: boolean; text: string } {
  const match = text.match(/^#+\s*(.*)$/)
  if (match) {
    return { isHeading: true, text: match[1] }
  }
  return { isHeading: false, text }
}

export interface NumberedStepLine {
  text: string
  isHeading: boolean
  // The step's position among actual steps only -- a heading is never counted, so the
  // numbering stays sequential across it instead of a heading consuming a number of its own.
  number: number | null
}

export function numberStepLines(steps: string[]): NumberedStepLine[] {
  let count = 0
  return steps.map((step) => {
    const { isHeading, text } = parseStepLine(step)
    if (isHeading) return { text, isHeading, number: null }
    count += 1
    return { text, isHeading, number: count }
  })
}
