import { describe, expect, it } from 'vitest'
import { numberStepLines, parseStepLine } from './parseStepLine'

describe('parseStepLine', () => {
  it('treats a line starting with "#" as a heading and strips the marker', () => {
    expect(parseStepLine('# For the sauce')).toEqual({ isHeading: true, text: 'For the sauce' })
  })

  it('strips multiple leading "#" characters and any following whitespace', () => {
    expect(parseStepLine('##  For the tacos')).toEqual({ isHeading: true, text: 'For the tacos' })
  })

  it('allows a heading with no space after the "#"', () => {
    expect(parseStepLine('#Toppings')).toEqual({ isHeading: true, text: 'Toppings' })
  })

  it('leaves a plain step line untouched', () => {
    expect(parseStepLine('Preheat the oven to 425°F.')).toEqual({
      isHeading: false,
      text: 'Preheat the oven to 425°F.',
    })
  })

  it('does not treat a "#" in the middle of a line as a heading', () => {
    expect(parseStepLine('Set the oven to 425 #2 rack')).toEqual({
      isHeading: false,
      text: 'Set the oven to 425 #2 rack',
    })
  })
})

describe('numberStepLines', () => {
  it('numbers plain steps sequentially, giving headings no number at all', () => {
    expect(
      numberStepLines(['# For the sauce', 'Simmer the tomatoes.', 'Stir in the basil.', '# For the pasta', 'Boil the pasta.']),
    ).toEqual([
      { text: 'For the sauce', isHeading: true, number: null },
      { text: 'Simmer the tomatoes.', isHeading: false, number: 1 },
      { text: 'Stir in the basil.', isHeading: false, number: 2 },
      { text: 'For the pasta', isHeading: true, number: null },
      { text: 'Boil the pasta.', isHeading: false, number: 3 },
    ])
  })

  it('numbers every line when there are no headings at all', () => {
    expect(numberStepLines(['First.', 'Second.'])).toEqual([
      { text: 'First.', isHeading: false, number: 1 },
      { text: 'Second.', isHeading: false, number: 2 },
    ])
  })
})
