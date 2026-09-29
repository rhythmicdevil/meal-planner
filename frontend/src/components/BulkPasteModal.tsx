import { useEffect, useState } from 'react'
import { Button, Group, Modal, Stack, Text, Textarea } from '@mantine/core'

interface BulkPasteModalProps {
  opened: boolean
  onClose: () => void
  title: string
  description?: string
  placeholder?: string
  onSubmit: (text: string) => void | Promise<void>
  // Pre-fills the textarea when the modal opens -- used to show an existing recipe's
  // ingredients as editable text instead of starting from a blank box. Re-seeded every time
  // the modal transitions to open (not on every parent re-render), so editing in progress
  // isn't stomped if the parent happens to re-render while the modal is still up.
  initialText?: string
  submitLabel?: string
}

export function BulkPasteModal({
  opened,
  onClose,
  title,
  description,
  placeholder,
  onSubmit,
  initialText = '',
  submitLabel = 'Add',
}: BulkPasteModalProps) {
  const [text, setText] = useState(initialText)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (opened) setText(initialText)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened])

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await onSubmit(text)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal opened={opened} onClose={handleClose} title={title} size="lg" closeOnClickOutside={!submitting}>
      <Stack>
        {description && (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        )}
        <Textarea
          autosize
          minRows={8}
          maxRows={20}
          placeholder={placeholder}
          value={text}
          onChange={(event) => setText(event.currentTarget.value)}
          disabled={submitting}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          {/* Not gated on non-empty text: this modal doubles as a full-list editor
              (submitLabel="Save") where submitting an emptied box is the only way to clear
              every row -- blocking that here would make it impossible to remove the last
              ingredient/step through the UI. */}
          <Button onClick={handleSubmit} disabled={submitting} loading={submitting}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
