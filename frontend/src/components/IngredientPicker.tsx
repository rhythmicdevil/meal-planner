import { useState } from 'react'
import { Button, Group, Select } from '@mantine/core'
import { useIngredients } from '../api/ingredients'
import { AddIngredientModal } from './AddIngredientModal'

interface IngredientPickerProps {
  value: number | null
  onChange: (id: number | null) => void
  error?: React.ReactNode
}

export function IngredientPicker({ value, onChange, error }: IngredientPickerProps) {
  const { data: ingredients = [], isLoading } = useIngredients()
  const [modalOpen, setModalOpen] = useState(false)
  // Tracks what the user has typed into the search box so "+ New" can carry it over as a
  // starting point for the quick-add name, instead of making them retype it.
  const [searchValue, setSearchValue] = useState('')

  const options = ingredients
    .map((ingredient) => ({ value: String(ingredient.id), label: ingredient.name }))
    .sort((a, b) => a.label.localeCompare(b.label))

  return (
    <>
      <Group align="flex-end" gap="xs" wrap="nowrap">
        <Select
          style={{ flex: 1 }}
          label="Ingredient"
          placeholder={isLoading ? 'Loading…' : 'Search ingredients…'}
          searchable
          clearable
          data={options}
          value={value !== null ? String(value) : null}
          onChange={(v) => onChange(v ? Number(v) : null)}
          onSearchChange={setSearchValue}
          error={error}
          nothingFoundMessage="No ingredients found"
        />
        {/* Once a row has an ingredient selected -- whether from a catalog match, a paste's
            auto-create, or a previously-saved recipe -- there's nothing left for quick-add
            to resolve; it only reappears if the selection is cleared back to empty. */}
        {value === null && (
          <Button
            variant="light"
            type="button"
            onClick={() => setModalOpen(true)}
          >
            + New
          </Button>
        )}
      </Group>

      <AddIngredientModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        initialName={searchValue.trim()}
        onCreated={(created) => {
          onChange(created.id)
          setModalOpen(false)
          setSearchValue('')
        }}
      />
    </>
  )
}
