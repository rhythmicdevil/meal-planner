export interface StapleItemRow {
  name: string
  ingredientId: number | null
}

export interface StapleGroupFormValues {
  name: string
  items: StapleItemRow[]
}

export const emptyStapleItemRow = (): StapleItemRow => ({
  name: '',
  ingredientId: null,
})

export const emptyStapleGroupFormValues: StapleGroupFormValues = {
  name: '',
  items: [],
}
