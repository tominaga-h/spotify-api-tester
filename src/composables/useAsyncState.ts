import { ref, computed, type Ref } from 'vue'

export interface AsyncState<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<Error | null>
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
}

export function useAsyncState<T, TArgs extends any[] = []>(
  asyncFunction: (...args: TArgs) => Promise<T>,
  initialValue: T | null = null
): AsyncState<T> {
  const data = ref<T | null>(initialValue)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  let requestCounter = 0

  const execute = async (...args: TArgs): Promise<T | null> => {
    const currentRequest = ++requestCounter
    loading.value = true
    error.value = null

    try {
      const result = await asyncFunction(...args)

      // Check if this is still the latest request
      if (currentRequest === requestCounter) {
        data.value = result
        return result
      }
      return null
    } catch (err) {
      // Only update error if this is still the latest request
      if (currentRequest === requestCounter) {
        error.value = err instanceof Error ? err : new Error(String(err))
        data.value = null
      }
      return null
    } finally {
      // Only update loading if this is still the latest request
      if (currentRequest === requestCounter) {
        loading.value = false
      }
    }
  }

  const reset = () => {
    ++requestCounter // Invalidate any pending requests
    data.value = initialValue
    loading.value = false
    error.value = null
  }

  return {
    data: data as Ref<T | null>,
    loading,
    error,
    execute,
    reset
  }
}

export function useCachedAsyncState<T, TArgs extends any[] = []>(
  asyncFunction: (...args: TArgs) => Promise<T>,
  initialValue: T | null = null,
  cacheKeyFn?: (...args: TArgs) => string
): AsyncState<T> & { refresh: (...args: TArgs) => Promise<T | null> } {
  const cache = new Map<string, { data: T; timestamp: number }>()
  const CACHE_TTL = 30000 // 30 seconds

  const asyncState = useAsyncState(
    async (...args: TArgs) => {
      const cacheKey = cacheKeyFn ? cacheKeyFn(...args) : JSON.stringify(args)
      const cached = cache.get(cacheKey)

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data
      }

      const result = await asyncFunction(...args)
      cache.set(cacheKey, { data: result, timestamp: Date.now() })
      return result
    },
    initialValue
  )

  const refresh = async (...args: TArgs): Promise<T | null> => {
    const cacheKey = cacheKeyFn ? cacheKeyFn(...args) : JSON.stringify(args)
    cache.delete(cacheKey)
    return asyncState.execute(...args)
  }

  return {
    ...asyncState,
    refresh
  }
}
