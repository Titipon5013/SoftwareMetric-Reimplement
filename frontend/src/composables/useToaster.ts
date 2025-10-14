import { reactive, readonly } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export type Toast = {
  id: number
  type: ToastType
  message: string
  duration: number
}

const state = reactive({
  toasts: [] as Toast[],
  nextId: 1,
})

function push(message: string, type: ToastType = 'info', duration = 3000) {
  const id = state.nextId++
  state.toasts.push({ id, type, message, duration })
  // auto-remove
  setTimeout(() => remove(id), duration)
}

function remove(id: number) {
  const idx = state.toasts.findIndex(t => t.id === id)
  if (idx !== -1) state.toasts.splice(idx, 1)
}

export function useToaster() {
  return {
    toasts: readonly(state.toasts),
    showMessage: push,
    remove,
  }
}

// Convenience global function (importable)
export const showMessage = (message: string, type: ToastType = 'info', duration = 3000) => push(message, type, duration)
