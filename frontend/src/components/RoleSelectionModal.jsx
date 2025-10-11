import React from 'react';
import './RoleSelectionModal.css'; // We will create this CSS file next

const RoleSelectionModal = ({ onConfirm, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Seguro que quieres eliminar este proyecto?</h2>
        <p>Esta acción no se puede deshacer.</p>
        <div className="modal-actions">
          <button onClick={onConfirm}>Confirmar</button>
        </div>
        <button className="close-button" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

export default RoleSelectionModal;
