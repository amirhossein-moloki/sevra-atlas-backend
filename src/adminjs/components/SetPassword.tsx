import React, { useState } from 'react'
import { Box, Button, FormGroup, Input, Label, Text } from '@adminjs/design-system'
import { ActionProps, useNotice } from 'adminjs'

const SetPassword: React.FC<ActionProps> = (props) => {
  const { record, resource, action } = props
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const sendNotice = useNotice()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = `/backoffice/resources/${resource.id}/actions/${action.name}/${record?.id}`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const result = await response.json()

      if (result.notice) {
        sendNotice(result.notice)
      }

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl
      }
    } catch (error) {
      sendNotice({
        message: 'Something went wrong',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box variant="white">
      <Box as="form" onSubmit={handleSubmit} padding="xl">
        <Text variant="h3" marginBottom="xl">Set Password for {record?.params.email || record?.params.username}</Text>
        <FormGroup>
          <Label>New Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            width={1}
            required
          />
        </FormGroup>
        <Box marginTop="xl">
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default SetPassword
