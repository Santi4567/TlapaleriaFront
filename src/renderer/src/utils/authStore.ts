export const saveSecureToken = (token: string): Promise<void> =>
  window.secureStorage.save(token)

export const getSecureToken = (): Promise<string | null> =>
  window.secureStorage.get()

export const deleteSecureToken = (): Promise<void> =>
  window.secureStorage.remove()
