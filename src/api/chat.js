import { apiUrl, handleResponse } from './base'

export const sendChatMessage = async (messages) => {
  const res = await fetch(apiUrl('/api/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  return handleResponse(res)
}
