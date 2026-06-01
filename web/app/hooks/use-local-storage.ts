import { useState, useEffect, useCallback } from 'react'

/**
 * Hook to use localStorage with TypeScript support
 * Migrated from direct localStorage usage as part of issue #36898
 */

type UseLocalStorageOptions<T> = {
  raw?: boolean
}

type UseLocalStorageReturn<T> = [
  T | undefined,
  (value: T | ((prev: T | undefined) => T)) => void,
  () => void
]

/**
 * Hook to read and write localStorage values with TypeScript support
 * @param key - localStorage key
 * @param initialValue - initial value if key doesn't exist
 * @param options - options object
 * @param options.raw - if true, treat value as raw string (no JSON parse/stringify)
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): UseLocalStorageReturn<T> {
  const { raw = false } = options

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item === null) {
        return initialValue
      }
      return raw ? (item as T) : JSON.parse(item) as T
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T | undefined) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore as T)
        if (valueToStore === undefined) {
          window.localStorage.removeItem(key)
        } else {
          window.localStorage.setItem(
            key,
            raw ? String(valueToStore) : JSON.stringify(valueToStore)
          )
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, raw, storedValue]
  )

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  // Sync with other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          const newValue = e.newValue
            ? raw
              ? (e.newValue as T)
              : JSON.parse(e.newValue) as T
            : initialValue
          setStoredValue(newValue)
        } catch (error) {
          console.warn(`Error syncing localStorage key "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, raw, initialValue])

  return [storedValue, setValue, removeValue]
}

/**
 * Hook to only set localStorage value (no reading)
 * Useful when you only need to write to localStorage
 * @param key - localStorage key
 * @param options - options object
 * @param options.raw - if true, treat value as raw string (no JSON parse/stringify)
 */
export function useSetLocalStorage<T>(
  key: string,
  options: UseLocalStorageOptions<T> = {}
): (value: T | ((prev: T | undefined) => T)) => void {
  const { raw = false } = options

  const setValue = useCallback(
    (value: T | ((prev: T | undefined) => T)) => {
      try {
        const valueToStore =
          value instanceof Function
            ? value(
                raw
                  ? (window.localStorage.getItem(key) as T)
                  : JSON.parse(window.localStorage.getItem(key) || 'null') as T
              )
            : value
        if (valueToStore === undefined) {
          window.localStorage.removeItem(key)
        } else {
          window.localStorage.setItem(
            key,
            raw ? String(valueToStore) : JSON.stringify(valueToStore)
          )
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, raw]
  )

  return setValue
}

export type { UseLocalStorageOptions, UseLocalStorageReturn }
