"use client"

import { useState, useEffect, useCallback } from "react"
import { ApiError } from "../client"

export interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
}

export interface UseApiOptions {
  immediate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: ApiError) => void
}

export function useApi<T>(apiCall: () => Promise<T>, options: UseApiOptions = {}) {
  const { immediate = true, onSuccess, onError } = options

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const data = await apiCall()
      setState({ data, loading: false, error: null })
      onSuccess?.(data)
      return data
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError("An unexpected error occurred", "UNKNOWN_ERROR")
      setState((prev) => ({ ...prev, loading: false, error: apiError }))
      onError?.(apiError)
      throw apiError
    }
  }, [apiCall, onSuccess, onError])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return {
    ...state,
    execute,
    reset,
    refetch: execute,
  }
}

export function useMutation<T, P = any>(apiCall: (params: P) => Promise<T>, options: UseApiOptions = {}) {
  const { onSuccess, onError } = options

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const mutate = useCallback(
    async (params: P) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const data = await apiCall(params)
        setState({ data, loading: false, error: null })
        onSuccess?.(data)
        return data
      } catch (error) {
        const apiError =
          error instanceof ApiError ? error : new ApiError("An unexpected error occurred", "UNKNOWN_ERROR")
        setState((prev) => ({ ...prev, loading: false, error: apiError }))
        onError?.(apiError)
        throw apiError
      }
    },
    [apiCall, onSuccess, onError],
  )

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return {
    ...state,
    mutate,
    reset,
  }
}

// Pagination hook
export function usePagination<T>(
  apiCall: (params: any) => Promise<{ data: T[]; pagination: any }>,
  initialParams: any = {},
) {
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    ...initialParams,
  })

  const { data, loading, error, execute } = useApi(() => apiCall(params), { immediate: true })

  const nextPage = useCallback(() => {
    if (data?.pagination?.hasNext) {
      setParams((prev) => ({ ...prev, page: prev.page + 1 }))
    }
  }, [data?.pagination?.hasNext])

  const prevPage = useCallback(() => {
    if (data?.pagination?.hasPrev) {
      setParams((prev) => ({ ...prev, page: prev.page - 1 }))
    }
  }, [data?.pagination?.hasPrev])

  const goToPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }))
  }, [])

  const updateParams = useCallback((newParams: any) => {
    setParams((prev) => ({ ...prev, ...newParams, page: 1 }))
  }, [])

  return {
    data: data?.data || [],
    pagination: data?.pagination,
    loading,
    error,
    params,
    nextPage,
    prevPage,
    goToPage,
    updateParams,
    refetch: execute,
  }
}
