"use client"

import { useEffect } from "react"
import "./RoleSelectionModal.css"

const RoleSelectionModal = ({ isOpen, googleData, onSelectRole, onCancel }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open")
    } else {
      document.body.classList.remove("modal-open")
    }
    return () => document.body.classList.remove("modal-open")
  }, [isOpen])

  if (!isOpen || !googleData) return null

  return (
    <div className="role-modal-overlay" onClick={onCancel}>
      <div
        className="role-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "zoomIn 0.25s ease-out" }}
      >
        <div className="role-modal-header">
          <h2>¿Cuál es tu rol?</h2>
          <p>Selecciona si eres campesino o inversionista para continuar</p>
        </div>

        {googleData.picture && (
          <div className="role-modal-user-info">
            <img src={googleData.picture || "/placeholder.svg"} alt={googleData.name} className="role-modal-avatar" />
            <p className="role-modal-name">{googleData.name}</p>
            <p className="role-modal-email">{googleData.email}</p>
          </div>
        )}

        <div className="role-modal-actions">
          <button className="role-btn role-btn-campesino" onClick={() => onSelectRole("campesino")}>
            <span className="role-icon">🌾</span>
            <span className="role-label">Soy Campesino</span>
          </button>
          <button className="role-btn role-btn-inversionista" onClick={() => onSelectRole("inversionista")}>
            <span className="role-icon">💼</span>
            <span className="role-label">Soy Inversionista</span>
          </button>
        </div>

        <button className="role-modal-cancel" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default RoleSelectionModal
