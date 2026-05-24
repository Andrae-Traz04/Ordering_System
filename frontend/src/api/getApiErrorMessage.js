export function getApiErrorMessage(error, fallbackMessage = 'Request failed.') {
  const data = error?.response?.data

  if (typeof data === 'string' && data.trim()) {
    return data.trim()
  }

  if (data && typeof data === 'object') {
    const values = Object.values(data)
      .flat()
      .filter(Boolean)
      .map((value) => String(value).trim())
      .filter(Boolean)

    if (values.length > 0) {
      return values.join(' ')
    }

    if (typeof data.detail === 'string' && data.detail.trim()) {
      return data.detail.trim()
    }

    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error.trim()
    }
  }

  if (error?.message) {
    return error.message
  }

  return fallbackMessage
}