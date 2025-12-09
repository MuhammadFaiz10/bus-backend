export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  message: string
  type: ToastType
}

type ToastListener = (message: ToastMessage) => void

class ToastService {
  private listeners: ToastListener[] = []
  private messageId = 0

  subscribe(listener: ToastListener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  show(message: string, type: ToastType = 'info') {
    const toastMessage: ToastMessage = {
      id: `toast-${++this.messageId}`,
      message,
      type
    }
    this.listeners.forEach(listener => listener(toastMessage))
  }
}

const toastService = new ToastService()

export const showToast = (message: string, type: ToastType = 'info') => {
  toastService.show(message, type)
}

export default toastService
