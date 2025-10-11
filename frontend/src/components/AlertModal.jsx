import { useEffect } from "react"
import "./AlertModal.css"

const AlertModal = ({
  isOpen,
  type = "info", // 'info', 'warning', 'error', 'success', 'confirm'
  title,
  message,
  details,
  onConfirm,
  onCancel,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  showCancel = false,
}) => {
  // 🔒 Evitar que el fondo se mueva al abrir la modal
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open")
    } else {
      document.body.classList.remove("modal-open")
    }
    return () => document.body.classList.remove("modal-open")
  }, [isOpen])

  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case "warning":
        return (
          <svg className="modal-icon warning" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        )
      case "error":
        return (
          <svg className="modal-icon error" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      case "success":
        return (
          <svg className="modal-icon success" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      case "confirm":
        return (
          <svg className="modal-icon confirm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      default:
        return (
          <svg className="modal-icon info" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
    }
  }

  return (
    <div className="alert-modal-overlay" onClick={showCancel ? onCancel : null}>
      <div
        className="alert-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "zoomIn 0.25s ease-out" }}
      >
        <div className="alert-modal-header">
          {getIcon()}
          <h2 className="alert-modal-title">{title}</h2>
        </div>

        <div className="alert-modal-body">
          <p className="alert-modal-message">{message}</p>
          {details && <div className="alert-modal-details">{details}</div>}
        </div>

        <div className="alert-modal-actions">
          {showCancel && (
            <button className="alert-modal-btn alert-modal-btn-cancel" onClick={onCancel}>
              {cancelText}
            </button>
          )}
          <button className="alert-modal-btn alert-modal-btn-confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AlertModal
