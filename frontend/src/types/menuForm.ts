export interface MenuFormValues {
  name: string
  recipeIds: string[]
}

export const emptyMenuFormValues: MenuFormValues = { name: '', recipeIds: [] }
