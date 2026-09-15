import { useState } from 'react'
import { Button, Group, Modal, Stack, Text, Textarea } from '@mantine/core'

interface BulkPasteModalProps {
  opened: boolean
  onClose: () => void
  title: string
  description?: string
  placeholder?: string
  onSubmit: (text: string) => void | Promise<void>
}

export function BulkPasteModal({
  opened,
  onClose,
  title,
  description,
  placeholder,
  onSubmit,
}: BulkPasteModalProps) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleClose = () => {
    if (submitting) return
    setText('')
    onClose()
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await onSubmit(text)
      setText('')
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
          <Button onClick={handleSubmit} disabled={!text.trim()} loading={submitting}>
            Add
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
