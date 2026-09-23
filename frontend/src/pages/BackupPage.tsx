import { useState } from 'react'
import { Button, FileInput, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { exportBackup, useImportBackup } from '../api/backup'
import { ApiRequestError } from '../api/client'

export function BackupPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const importBackup = useImportBackup()

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportBackup()
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Something went wrong'
      notifications.show({ message, color: 'red' })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async () => {
    if (!file) return
    if (!window.confirm('This will overwrite ALL current data with the contents of this backup. Continue?')) {
      return
    }
    try {
      await importBackup.mutateAsync(file)
      notifications.show({ message: 'Backup restored. Reloading…', color: 'green' })
      window.location.reload()
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Something went wrong'
      notifications.show({ message, color: 'red' })
    }
  }

  return (
    <Stack maw={600} mx="auto" py="lg" px="md">
      <Title order={2}>Backup</Title>

      <Paper withBorder p="md">
        <Stack gap="xs">
          <Title order={4}>Export</Title>
          <Text c="dimmed" size="sm">
            Downloads a full backup of every ingredient, recipe, menu, and meal plan.
          </Text>
          <Group>
            <Button onClick={handleExport} loading={isExporting}>
              Export backup
            </Button>
          </Group>
        </Stack>
      </Paper>

      <Paper withBorder p="md">
        <Stack gap="xs">
          <Title order={4}>Restore</Title>
          <Text c="dimmed" size="sm">
            Restores from a previously exported backup file. This replaces all current data.
          </Text>
          <FileInput
            placeholder="Choose a backup file…"
            accept=".sql"
            value={file}
            onChange={setFile}
          />
          <Group>
            <Button
              color="red"
              onClick={handleImport}
              loading={importBackup.isPending}
              disabled={!file}
            >
              Restore backup
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  )
}
