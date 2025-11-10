"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import "./InvertirProyecto.css"
import { useUser } from "../hooks/useUser"
import jsPDF from "jspdf"
import AlertModal from "./AlertModal"

const InvertirProyecto = () => {
  const { userId, setUserId } = useUser()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [comprobante, setComprobante] = useState(null)
  const [mostrarTerminos, setMostrarTerminos] = useState(false)
  const [userData, setUserData] = useState(null)
  const [proyectoURL, setProyectoUrl] = useState(null)
  const [userRole, setUserRole] = useState(null)

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    details: null,
  })

  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false)

  const [formData, setFormData] = useState({
    tipoInversion: "",
    monto: "",
    aceptaTerminos: false,
  })

  const [montoFormateado, setMontoFormateado] = useState("")

  const generarPDF = async (comprobante) => {
    const doc = new jsPDF("p", "mm", "a4")
    const pageWidth = 210
    const pageHeight = 297

    // === COLORES MINIMALISTAS 2026 ===
    const colors = {
      primary: "#14c900",
      dark: "#1E293B",
      gray: "#64748B",
      lightGray: "#E2E8F0",
      background: "#FAFAFA",
      white: "#FFFFFF",
    }

    // === FONDO LIMPIO ===
    doc.setFillColor(colors.white)
    doc.rect(0, 0, pageWidth, pageHeight, "F")

    // === HEADER MINIMALISTA ===
    doc.setFillColor(colors.primary)
    doc.rect(0, 0, pageWidth, 2, "F")

    // Logo
    const logoURL = "https://eavbcqqsayutikbzhejp.supabase.co/storage/v1/object/public/avatars/logo/Logo.png"
    doc.addImage(logoURL, "PNG", 20, 15, 25, 25)
    
    // Empresa
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.setTextColor(colors.dark)
    doc.text("AGROCOLOMBIA", pageWidth - 20, 25, { align: "right" })

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(colors.gray)
    doc.text("www.agrocolombia.com", pageWidth - 20, 32, { align: "right" })

    // === TÍTULO ===
    doc.setFont("helvetica", "bold")
    doc.setFontSize(24)
    doc.setTextColor(colors.dark)
    doc.text("Comprobante de Inversión", 20, 60)

    // Línea decorativa
    doc.setDrawColor(colors.primary)
    doc.setLineWidth(1)
    doc.line(20, 65, 80, 65)

    // Número de comprobante
    const numeroComprobante = `INV-${Date.now().toString().slice(-8)}`
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(colors.gray)
    doc.text(`N° ${numeroComprobante}`, 20, 73)

    // Fecha
    doc.text(
      new Date().toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      pageWidth - 20,
      73,
      { align: "right" },
    )

    // === TARJETA DE INFORMACIÓN ===
    const cardY = 90

    // Sombra sutil
    doc.setFillColor(0, 0, 0, 0.03)
    doc.roundedRect(21, cardY + 1, 168, 100, 3, 3, "F")

    // Tarjeta
    doc.setFillColor(colors.background)
    doc.roundedRect(20, cardY, 170, 100, 3, 3, "F")

    // Borde
    doc.setDrawColor(colors.lightGray)
    doc.setLineWidth(0.5)
    doc.roundedRect(20, cardY, 170, 100, 3, 3, "S")

    // === INFORMACIÓN EN GRID ===
    let y = cardY + 20

    const addField = (label, value, x, yPos, isHighlight = false) => {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.setTextColor(colors.gray)
      doc.text(label.toUpperCase(), x, yPos)

      doc.setFont("helvetica", isHighlight ? "bold" : "normal")
      doc.setFontSize(isHighlight ? 14 : 11)
      doc.setTextColor(isHighlight ? colors.primary : colors.dark)

      const maxWidth = 75
      const lines = doc.splitTextToSize(value, maxWidth)
      doc.text(lines[0], x, yPos + 6)
    }

    // Columna 1
    addField("Proyecto", comprobante.nombreProyecto, 30, y)
    addField("Inversionista", comprobante.nombreUsuario, 30, y + 25)
    addField("Tipo de Inversión", comprobante.tipoInversion, 30, y + 50)

    // Columna 2
    addField("Fecha", comprobante.fecha, 115, y)
    addField("Estado", "Confirmada", 115, y + 25)

    // === MONTO DESTACADO ===
    y = cardY + 85

    doc.setDrawColor(colors.lightGray)
    doc.setLineWidth(0.3)
    doc.line(30, y - 5, 180, y - 5)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(colors.gray)
    doc.text("MONTO INVERTIDO", 105, y, { align: "center" })

    doc.setFont("helvetica", "bold")
    doc.setFontSize(20)
    doc.setTextColor(colors.primary)
    const montoFormateado = Number(comprobante?.monto || 0).toLocaleString("es-CO")
    doc.text(`$${montoFormateado} COP`, 105, y + 10, { align: "center" })

    // === TÉRMINOS ===
    y = 210

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(colors.dark)
    doc.text("Términos y Condiciones", 20, y)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(colors.gray)

    const terminos = [
      "Esta inversión está sujeta a los términos establecidos en el contrato.",
      "El inversionista acepta los riesgos asociados al proyecto.",
      "Los rendimientos dependen del desempeño del proyecto.",
      "Para soporte: contacto@agrocolombia.com",
    ]

    let termY = y + 8
    terminos.forEach((termino) => {
      doc.text(`• ${termino}`, 20, termY)
      termY += 6
    })

    // === FIRMA ===
    y = 255

    doc.setDrawColor(colors.gray)
    doc.setLineWidth(0.3)
    doc.line(20, y, 80, y)

    doc.setFont("helvetica", "italic")
    doc.setFontSize(9)
    doc.setTextColor(colors.gray)
    doc.text("Firma del Inversionista", 50, y + 3, { align: "center" })

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    doc.text(comprobante.nombreUsuario, 50, y - 1, { align: "center" })

    // Código de verificación
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.text(`Código: ${numeroComprobante}`, pageWidth - 20, y + 6, { align: "right" })

    // === FOOTER ===
    const footerY = 280

    doc.setDrawColor(colors.lightGray)
    doc.setLineWidth(0.3)
    doc.line(20, footerY, pageWidth - 20, footerY)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(colors.gray)
    doc.text(
      `Documento generado automáticamente • AgroColombia © ${new Date().getFullYear()}`,
      pageWidth / 2,
      footerY + 6,
      { align: "center" },
    )

    // === DESCARGA ===
    const nombreArchivo = `Comprobante_${comprobante.nombreProyecto.replace(/\s+/g, "_")}_${numeroComprobante}.pdf`
    doc.save(nombreArchivo)
  }

  useEffect(() => {
    setLoading(true)

    const storedUserId = localStorage.getItem("userId")
    if (storedUserId) {
      setUserId(storedUserId)
      setIsUserLoggedIn(true)
    } else {
      setLoading(false)
      setIsUserLoggedIn(false)
    }
  }, [setUserId])

  useEffect(() => {
    if (!loading && !isUserLoggedIn && project) {
      setModalConfig({
        isOpen: true,
        type: "info",
        title: "Inicia Sesión para Invertir",
        message: "Debes iniciar sesión para poder realizar inversiones en este proyecto.",
        details: (
          <>
            <p>Por favor, inicia sesión o regístrate para continuar.</p>
          </>
        ),
      })
    }
  }, [loading, isUserLoggedIn, project])

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const { data, error } = await supabase.from("proyectos").select("*").eq("id", id).single()

        if (error) throw error
        setProyectoUrl(data.imagen_url)
        setProject(data)
      } catch (err) {
        console.error(err)
        setError("Error al cargar el proyecto.")
      } finally {
        setLoading(false)
      }
    }

    fetchProjectDetails()
  }, [id])

  const formatearMonto = (valor) => {
    const numeroLimpio = valor.replace(/\D/g, "")

    if (!numeroLimpio) return ""

    return Number(numeroLimpio).toLocaleString("es-CO")
  }

  const handleMontoChange = (e) => {
    const valor = e.target.value
    const numeroLimpio = valor.replace(/\D/g, "")

    setFormData({
      ...formData,
      monto: numeroLimpio,
    })

    setMontoFormateado(formatearMonto(valor))
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  useEffect(() => {
    if (!userId) return
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.from("usuarios").select("*").eq("id", userId).maybeSingle()
        if (error) throw error
        if (data) {
          setUserData(data.nombre + " " + data.apellido)
          setUserRole(data.rol)
        }
      } catch (err) {
        console.error("Error al obtener el usuario:", err.message)
      }
    }
    fetchUser()
  }, [userId])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (userRole !== "inversionista") {
      setModalConfig({
        isOpen: true,
        type: "info",
        title: "Acceso Restringido",
        message: "Solo los usuarios con rol de inversionista pueden realizar inversiones.",
        details: (
          <>
            <p className="detail-role">
              Tu rol actual es: <strong>{userRole}</strong>
            </p>
            <p>Contacta al administrador para actualizar tu rol.</p>
          </>
        ),
      })
      return
    }

    if (!formData.tipoInversion) {
      setModalConfig({
        isOpen: true,
        type: "info",
        title: "Selecciona un tipo de inversión",
        message: "Por favor, selecciona un tipo de inversión.",
      })
      return
    }

    const montoNum = Number.parseFloat(formData.monto)
    if (isNaN(montoNum) || montoNum <= 0) {
      setModalConfig({
        isOpen: true,
        type: "info",
        title: "Monto Inválido",
        message: "El monto debe ser un número positivo.",
      })
      return
    }

    const minimo = formData.tipoInversion === "dueno_unico" ? project.costos * 0.3 : project.costos * 0.1

    if (montoNum < minimo) {
      setModalConfig({
        isOpen: true,
        type: "info",
        title: "Monto Mínimo Insuficiente",
        message: `El monto mínimo para ser ${
          formData.tipoInversion === "dueno_unico" ? "Dueño Único" : "Accionista"
        } es $${minimo.toLocaleString("es-CO")}`,
      })
      return
    }

    const montoDisponible = project.costos - project.monto_recaudado

    if (montoNum > montoDisponible) {
      setModalConfig({
        isOpen: true,
        type: "warning",
        title: "El monto excede el capital disponible del proyecto",
        message: "Por favor, ingresa un monto menor o igual al disponible.",
        details: (
          <>
            <p className="detail-available">
              💰 <strong>Disponible:</strong> ${montoDisponible.toLocaleString("es-CO")}
            </p>
            <p className="detail-attempted">
              ❌ <strong>Intentaste invertir:</strong> ${montoNum.toLocaleString("es-CO")}
            </p>
          </>
        ),
      })
      return
    }

    if (!formData.aceptaTerminos) {
      setModalConfig({
        isOpen: true,
        type: "info",
        title: "Términos y Condiciones",
        message: "Debes aceptar los términos y condiciones.",
      })
      return
    }

    try {
      const { error } = await supabase.from("inversiones").insert({
        id_proyecto: id,
        id_inversor: userId,
        tipo_inversion: formData.tipoInversion === "dueno_unico" ? "Capital" : "Accionista",
        monto_invertido: montoNum,
      })

      if (error) {
        console.error("❌ Error Supabase:", error.message)
        setModalConfig({
          isOpen: true,
          type: "error",
          title: "Error al Registrar Inversión",
          message: "Error al registrar la inversión: " + error.message,
        })
        throw error
      }

      const nuevoMontoRecaudado = project.monto_recaudado + montoNum

      const { error: updateError } = await supabase
        .from("proyectos")
        .update({ monto_recaudado: nuevoMontoRecaudado })
        .eq("id", id)

      if (updateError) {
        console.error("❌ Error al actualizar monto_recaudado:", updateError.message)
        setModalConfig({
          isOpen: true,
          type: "error",
          title: "Error al Actualizar Proyecto",
          message: "La inversión se registró pero hubo un error al actualizar el proyecto.",
        })
        throw updateError
      }

      console.log("[v0] ✅ Inversión registrada y monto_recaudado actualizado correctamente")

      setProject({ ...project, monto_recaudado: nuevoMontoRecaudado })

      setComprobante({
        nombreUsuario: userData,
        nombreProyecto: project.nombre,
        tipoInversion: formData.tipoInversion === "dueno_unico" ? "Capital" : "Accionista",
        monto: montoNum,
        fecha: new Date().toLocaleString(),
      })
    } catch (err) {
      console.error("Error general:", err)
      setModalConfig({
        isOpen: true,
        type: "error",
        title: "Error General",
        message: "Error al registrar la inversión.",
      })
    }
  }

  if (loading)
    return (
      <div className="invertir-loading">
        <div className="spinner"></div>
        <p>Cargando proyecto...</p>
      </div>
    )

  if (error)
    return (
      <div className="invertir-error">
        <div className="error-icon">⚠️</div>
        <h2>Error al cargar</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/projects")} className="btn-volver">
          Volver a Proyectos
        </button>
      </div>
    )

  if (!project) {
    return (
      <div className="invertir-loading">
        <div className="spinner"></div>
        <p>Cargando proyecto...</p>
      </div>
    )
  }

  const montoMinimo =
    formData.tipoInversion === "dueno_unico"
      ? project.costos * 0.3
      : formData.tipoInversion === "accionista"
        ? project.costos * 0.1
        : null

  const montoDisponible = project.costos - project.monto_recaudado

  return (
    <div className="invertir-container">
      <div className="invertir-header">
        <div className="header-overlay"></div>
        <img
          src={proyectoURL || "/placeholder.svg?height=500&width=1920&query=agricultural project landscape"}
          alt={project.nombre}
          className="header-image"
        />
        <div className="header-content">
          <button onClick={() => navigate(-1)} className="btn-back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <div className="header-text">
            <h1 className="project-title">{project.nombre}</h1>
            <p className="project-subtitle">Inversión en proyecto agrícola sostenible</p>
          </div>
        </div>
      </div>

      {!comprobante ? (
        <div className="invertir-content">
          <div className="content-grid">
            <div className="left-column">
              <div className="project-info-card">
                <div className="info-header">
                  <div className="info-icon-wrapper">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </div>
                  <div>
                    <h2>Detalles del Proyecto</h2>
                    <p>Información financiera y estado actual</p>
                  </div>
                </div>

                <div className="info-stats">
                  <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                      <span className="stat-label">Costo Total</span>
                      <span className="stat-value">${project.costos.toLocaleString("es-CO")}</span>
                    </div>
                  </div>

                  <div className="stat-card success">
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                      <span className="stat-label">Recaudado</span>
                      <span className="stat-value">${project.monto_recaudado.toLocaleString("es-CO")}</span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                      <span className="stat-label">Progreso</span>
                      <span className="stat-value">
                        {((project.monto_recaudado / project.costos) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-content">
                      <span className="stat-label">Estado</span>
                      <span className={`badge badge-${project.estado.toLowerCase().replace(/ /g, "-")}`}>
                        {project.estado}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="progress-bar-container">
                  <div className="progress-bar-header">
                    <span>Progreso de financiación</span>
                    <span className="progress-percentage">
                      {((project.monto_recaudado / project.costos) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(project.monto_recaudado / project.costos) * 100}%` }}
                    ></div>
                  </div>
                  <div className="progress-info">
                    <span>${project.monto_recaudado.toLocaleString("es-CO")} recaudado</span>
                    <span>${project.costos.toLocaleString("es-CO")} objetivo</span>
                  </div>
                </div>
              </div>

              <div className="benefits-card">
                <h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Beneficios de Invertir
                </h3>
                <ul className="benefits-list">
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Retorno de inversión proyectado
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Participación en ganancias
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Transparencia total del proyecto
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Impacto social y ambiental
                  </li>
                </ul>
              </div>
            </div>

            <div className="right-column">
              {userRole && userRole !== "inversionista" && (
                <div className="role-warning">
                  <div className="warning-icon">⚠️</div>
                  <div className="warning-content">
                    <h3>Acceso Restringido</h3>
                    <p>
                      Solo los usuarios con rol de <strong>inversionista</strong> pueden realizar inversiones.
                    </p>
                    <p>
                      Tu rol actual es: <strong>{userRole}</strong>
                    </p>
                    <p>Contacta al administrador para actualizar tu rol.</p>
                  </div>
                </div>
              )}

              <form className="investment-form-modern" onSubmit={handleSubmit}>
                <div className="form-header">
                  <div className="form-icon">💎</div>
                  <h2>Realizar Inversión</h2>
                  <p>Selecciona tu tipo de inversión y monto</p>
                </div>

                <div className="form-group">
                  <label htmlFor="tipoInversion">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    Tipo de Inversión
                  </label>
                  <div className="investment-types">
                    <label
                      className={`investment-type-card ${formData.tipoInversion === "dueno_unico" ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="tipoInversion"
                        value="dueno_unico"
                        checked={formData.tipoInversion === "dueno_unico"}
                        onChange={handleChange}
                      />
                      <div className="type-badge">Premium</div>
                      <div className="type-content">
                        <div className="type-icon">👑</div>
                        <h3>Dueño Único</h3>
                        <p>Control total del proyecto</p>
                        <div className="type-details">
                          <span className="type-percentage">30%</span>
                          <span className="type-amount">${(project.costos * 0.3).toLocaleString("es-CO")}</span>
                        </div>
                      </div>
                    </label>

                    <label
                      className={`investment-type-card ${formData.tipoInversion === "accionista" ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="tipoInversion"
                        value="accionista"
                        checked={formData.tipoInversion === "accionista"}
                        onChange={handleChange}
                      />
                      <div className="type-badge standard">Estándar</div>
                      <div className="type-content">
                        <div className="type-icon">🤝</div>
                        <h3>Accionista</h3>
                        <p>Participación compartida</p>
                        <div className="type-details">
                          <span className="type-percentage">10%</span>
                          <span className="type-amount">${(project.costos * 0.1).toLocaleString("es-CO")}</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="monto">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    Monto a Invertir
                  </label>
                  <div className="input-wrapper">
                    <span className="input-prefix">$</span>
                    <input
                      type="text"
                      id="monto"
                      name="monto"
                      value={montoFormateado}
                      onChange={handleMontoChange}
                      placeholder="0"
                      required
                    />
                    <span className="input-suffix">COP</span>
                  </div>
                  {montoMinimo && (
                    <div className="input-hint">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4M12 8h.01" />
                      </svg>
                      Monto mínimo: ${montoMinimo.toLocaleString("es-CO")} • Disponible: $
                      {montoDisponible.toLocaleString("es-CO")}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <div className="terms-section">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="aceptaTerminos"
                        checked={formData.aceptaTerminos}
                        onChange={handleChange}
                      />
                      <span className="checkbox-custom"></span>
                      <span>
                        Acepto los{" "}
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => setMostrarTerminos(!mostrarTerminos)}
                        >
                          términos y condiciones
                        </button>
                      </span>
                    </label>

                    {mostrarTerminos && (
                      <div className="terms-content">
                        <div className="terms-header">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                          </svg>
                          <h4>Términos y Condiciones de Inversión</h4>
                        </div>
                        <ol className="terms-list">
                          <li>La inversión no garantiza rendimientos inmediatos.</li>
                          <li>El capital será administrado por el gestor del proyecto.</li>
                          <li>No se permiten retiros antes de la fecha pactada.</li>
                          <li>El inversionista asume riesgos de mercado.</li>
                          <li>La información financiera será confidencial.</li>
                          <li>Supabase almacena los datos bajo estándares seguros.</li>
                          <li>Las ganancias se distribuirán proporcionalmente.</li>
                          <li>Los impuestos corren por cuenta del inversionista.</li>
                          <li>El contrato se rige por leyes locales.</li>
                          <li>La aceptación implica conformidad con todos los puntos.</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-submit"
                  disabled={!formData.aceptaTerminos || (userRole && userRole !== "inversionista")}
                >
                  <span>Confirmar Inversión</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>

                <div className="security-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Transacción segura y encriptada</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="comprobante-overlay">
          <div className="comprobante-modal">
            <div className="comprobante-header">
              <div className="success-animation">
                <div className="success-icon">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div className="success-particles">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <h2>¡Inversión Exitosa!</h2>
              <p>Tu inversión ha sido registrada correctamente en el sistema</p>
            </div>

            <div className="comprobante-card">
              <div className="comprobante-number">
                <span>Comprobante N°</span>
                <strong>{Math.random().toString(36).substr(2, 9).toUpperCase()}</strong>
              </div>

              <div className="comprobante-details">
                <div className="detail-row">
                  <span className="detail-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Proyecto
                  </span>
                  <span className="detail-value">{comprobante.nombreProyecto}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Inversionista
                  </span>
                  <span className="detail-value">{comprobante.nombreUsuario}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    Tipo de Inversión
                  </span>
                  <span className="detail-value">{comprobante.tipoInversion}</span>
                </div>
                <div className="detail-row highlight">
                  <span className="detail-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    Monto Invertido
                  </span>
                  <span className="detail-value">${comprobante.monto.toLocaleString("es-CO")}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Fecha y Hora
                  </span>
                  <span className="detail-value">{comprobante.fecha}</span>
                </div>
              </div>

              <div className="firma-section">
                <p>Firma digital del inversionista</p>
                <div className="firma-line"></div>
                <span className="firma-text">{comprobante.nombreUsuario}</span>
              </div>
            </div>

            <div className="comprobante-actions">
              <button onClick={() => generarPDF(comprobante)} className="btn-download">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Descargar PDF
              </button>
              <button onClick={() => setComprobante(null)} className="btn-new-investment">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Nueva Inversión
              </button>
              <button onClick={() => navigate("/projects")} className="btn-projects">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
                Ver Proyectos
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        details={modalConfig.details}
        onConfirm={() => {
          setModalConfig({ ...modalConfig, isOpen: false })
          if (!isUserLoggedIn) {
            navigate("/login")
          }
        }}
        confirmText="Aceptar"
      />
    </div>
  )
}

export default InvertirProyecto
