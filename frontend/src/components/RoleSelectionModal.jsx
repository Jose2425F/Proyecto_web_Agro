import React from 'react';
import './RoleSelectionModal.css'; // We will create this CSS file next

const RoleSelectionModal = ({ onRoleSelect, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Selecciona tu Rol</h2>
        <p>Para completar tu registro, por favor elige cómo quieres participar en la plataforma.</p>
        <div className="modal-actions">
          <button onClick={() => onRoleSelect('campesino')}>Soy Campesino</button>
          <button onClick={() => onRoleSelect('inversionista')}>Soy Inversionista</button>
        </div>
        <button className="close-button" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
};

export default RoleSelectionModal;
