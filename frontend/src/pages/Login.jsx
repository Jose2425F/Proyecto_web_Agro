import React, { useState, useEffect } from 'react';
import DescriptionAlerts from '../components/DescriptionAlerts';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

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

  // Redirect if already logged in
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.id) { 
        navigate('/home');
      }
    } catch (e) {
      console.error("Error al parsear el usuario de localStorage", e);
      localStorage.removeItem('user');
    }
  }, [navigate]);

  useEffect(() => {
    if (alertInfo.message) {
      const timer = setTimeout(() => {
        setAlertInfo({ severity: '', title: '', message: '' });
      }, 3000);
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
      const response = await fetch('/Proyecto_web_Agro/php/Iniciar_sesion.php', {
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
          title: 'Exitoso',
          message: result.message,
        });
        localStorage.setItem('user', JSON.stringify(result.user));
        setTimeout(() => {
          navigate('/home');
        }, 2000);
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

  const handleGoogleSuccess = async (credentialResponse) => {
    const id_token = credentialResponse.credential;

    try {
      const response = await fetch('/Proyecto_web_Agro/php/google_auth.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_token, source: 'login' }),
      });

      const result = await response.json();

      if (result.success) {
        setAlertInfo({
          severity: 'success',
          title: 'Exitoso',
          message: result.message,
        });
        localStorage.setItem('user', JSON.stringify(result.user));
        setTimeout(() => {
          navigate('/home');
        }, 2000);
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
        message: `Error de conexión con Google: ${error.message}`,
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
          
          <div className="form-divider">O</div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setAlertInfo({
                  severity: 'error',
                  title: 'Error',
                  message: 'El inicio de sesión con Google falló. Por favor, inténtalo de nuevo.',
                });
              }}
              theme="outline"
              size="large"
              width="436"
            />
          </div>
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