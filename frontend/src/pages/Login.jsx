import React, { useState, useEffect } from 'react';
import DescriptionAlerts from '../components/DescriptionAlerts';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    CorreoElectronico: '',
    ContrasenaUser: '',
  });
  const [alertInfo, setAlertInfo] = useState({
    severity: '',
    title: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (alertInfo.message) {
      const timer = setTimeout(() => {
        setAlertInfo({ severity: '', title: '', message: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [alertInfo.message]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.CorreoElectronico) {
      newErrors.CorreoElectronico = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.CorreoElectronico)) {
      newErrors.CorreoElectronico = 'El formato del correo no es válido';
    }
    if (!formData.ContrasenaUser) newErrors.ContrasenaUser = 'La contraseña es requerida';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setAlertInfo({
        severity: 'error',
        title: 'Error',
        message: 'Por favor, corrige los errores en el formulario.',
      });
      return;
    }

    try {
      const response = await fetch('http://localhost/Web_proyecto_Agro/php/Iniciar_sesion.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setAlertInfo({
          severity: 'success',
          title: 'Success',
          message: result.message,
        });
        localStorage.setItem('user', JSON.stringify(result.user));
        navigate('/');
      } else {
        setAlertInfo({
          severity: 'warning',
          title: 'Advertencia',
          message: `${result.message}`,
        });
      }
    } catch (error) {
      setAlertInfo({
        severity: 'error',
        title: 'Error',
        message: `Error de conexión: ${error.message}`,
      });
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <h1>Iniciar Sesión</h1>
          <label>Correo Electrónico</label>
          <input
            type="email"
            name="CorreoElectronico"
            value={formData.CorreoElectronico}
            onChange={handleChange}
          />
          {errors.CorreoElectronico && <p className="form-error">{errors.CorreoElectronico}</p>}
        </div>
        <div>
          <label>Contraseña</label>
          <input
            type="password"
            name="ContrasenaUser"
            value={formData.ContrasenaUser}
            onChange={handleChange}
          />
          {errors.ContrasenaUser && <p className="form-error">{errors.ContrasenaUser}</p>}
        </div>
        <div className='color_p'>
          <button type="submit">Iniciar Sesión</button>
          <p>¿No tienes una cuenta? <Link to="/register" className='custom-link'>Regístrate</Link></p>
        </div>
      </form>
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}>
        <DescriptionAlerts 
          severity={alertInfo.severity} 
          title={alertInfo.title} 
          message={alertInfo.message} 
        />
      </div>
    </div>
  );
};

export default Login;
