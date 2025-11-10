import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../supabaseClient"
import "./EditarProyecto.css"

const EditarProyecto = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [proyecto, setProyecto] = useState(null)
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    costos: "",
    monto_recaudado: "",
    produccion_estimada: "",
    estado: "Buscando Inversión",
    imagen_url: "",
  })
  const [preview, setPreview] = useState("")
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (id) {
      fetchProyecto()
    }
  }, [id])

  const fetchProyecto = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase.from("proyectos").select("*").eq("id", id).single()

      if (fetchError) throw fetchError

      if (data) {
        setProyecto(data)
        setFormData({
          nombre: data.nombre || "",
          descripcion: data.descripcion || "",
          costos: data.costos || "",
          monto_recaudado: data.monto_recaudado || "",
          produccion_estimada: data.produccion_estimada || "",
          estado: data.estado || "Buscando Inversión",
          imagen_url: data.imagen_url || "",
        })
        setPreview(data.imagen_url || "")
      }
    } catch (error) {
      console.error("Error al cargar proyecto:", error)
      setError("No se pudo cargar el proyecto")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result
        setPreview(result)
        setFormData((prev) => ({
          ...prev,
          imagen_url: result,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!formData.nombre.trim()) {
      setError("El nombre del proyecto es obligatorio")
      return
    }
    if (!formData.descripcion.trim()) {
      setError("La descripción es obligatoria")
      return
    }
    if (!formData.costos || Number(formData.costos) <= 0) {
      setError("Los costos deben ser mayor a 0")
      return
    }

    try {
      setGuardando(true)

      const { error: updateError } = await supabase
        .from("proyectos")
        .update({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          costos: Number(formData.costos),
          monto_recaudado: Number(formData.monto_recaudado) || 0,
          produccion_estimada: formData.produccion_estimada || "",
          estado: formData.estado,
          imagen_url: formData.imagen_url,
          fecha_creacion: new Date().toISOString(),
        })
        .eq("id", id)

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => {
        navigate("/mis-proyectos")
      }, 1500)
    } catch (error) {
      console.error("Error al guardar:", error)
      setError("Error al guardar los cambios")
    } finally {
      setGuardando(false)
    }
  }

  const handleCancelar = () => {
    navigate("/mis-proyectos")
  }

  if (loading) {
    return (
      <div className="edit-page edit-loading-state">
        <div className="edit-spinner"></div>
        <p>Cargando proyecto...</p>
      </div>
    )
  }

  if (!proyecto) {
    return (
      <div className="edit-page">
        <div className="edit-error-container">
          <p>Proyecto no encontrado</p>
          <button onClick={() => navigate("/mis-proyectos")} className="edit-btn-primary">
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
  <div className="header">
    <button className="btn-back" onClick={handleCancelar}>← Volver</button>
    <h1 className="title">Editar: {formData.nombre}</h1>
  </div>

  <div className="content">
    {/* IZQUIERDA: IMAGEN */}
    <div className="image-section">
      <input type="file" id="file" className="file-input" onChange={handleImageChange} accept="image/*" />
      <label htmlFor="file" className="image-label">
        {preview ? <img src={preview} alt="Vista previa" className="image" /> :
          <div className="image-placeholder"><span style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📷</span> {/* <-- Nuevo ícono */}Clic para cambiar imagen</div>}
      </label>
    </div>

    {/* DERECHA: FORMULARIO */}
    <form onSubmit={handleGuardar} className="form-section">
      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">Guardado exitosamente</div>}

      <div className="form-group">
        <label htmlFor="nombre">Nombre del Proyecto</label>
        <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Nombre" />
      </div>

      <div className="form-group">
        <label htmlFor="descripcion">Descripción</label>
        <textarea
          id="descripcion"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleInputChange}
          maxLength={150}
          rows={3}
          placeholder="Descripción del proyecto"
        />
        <div className="char-count">{formData.descripcion.length}/150</div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="costos">Inversión COP</label>
          <input type="number" id="costos" name="costos" value={formData.costos} onChange={handleInputChange} min="0" />
        </div>
        <div className="form-group">
          <label htmlFor="monto">Recaudado</label>
          <input type="number" id="monto" name="monto_recaudado" value={formData.monto_recaudado} disabled />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="produccion">Producción Estimada (kg)</label>
        <input type="number" id="produccion" name="produccion_estimada" value={formData.produccion_estimada} onChange={handleInputChange} />
      </div>

      <div className="form-group">
        <label htmlFor="estado">Estado del Proyecto</label>
        <select id="estado" name="estado" value={formData.estado} onChange={handleInputChange}>
          <option value="Buscando Inversión">Buscando Inversión</option>
          <option value="En Produccion">En Producción</option>
          <option value="Completado">Completado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="button" onClick={handleCancelar} className="btn-cancel">Cancelar</button>
        <button type="submit" className="btn-save" disabled={guardando}>{guardando ? "Guardando..." : "Guardar Cambios"}</button>
      </div>
    </form>
  </div>
</div>
    )
}

export default EditarProyecto
