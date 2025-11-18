import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import "./InvertirProyecto.css"
import { useUser } from "../hooks/useUser"
import jsPDF from "jspdf"
import AlertModal from "./AlertModal"

const generateClientUUID = () => {
  if (typeof crypto !== "undefined") {
    if (crypto.randomUUID) return crypto.randomUUID()
    if (crypto.getRandomValues) {
      const bytes = crypto.getRandomValues(new Uint8Array(16))
      bytes[6] = (bytes[6] & 0x0f) | 0x40
      bytes[8] = (bytes[8] & 0x3f) | 0x80
      const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0"))
      return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex
        .slice(8, 10)
        .join("")}-${hex.slice(10, 16).join("")}`
    }
  }
  return `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

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
  const [hasExclusiveOwner, setHasExclusiveOwner] = useState(false)
  const [exclusiveOwnerId, setExclusiveOwnerId] = useState(null)

  const [formData, setFormData] = useState({
    tipoInversion: "",
    monto: "",
    aceptaTerminos: false,
  })

  const [montoFormateado, setMontoFormateado] = useState("")
  const selectedInvestmentType = formData.tipoInversion
  const isExclusiveOwner = hasExclusiveOwner && exclusiveOwnerId === userId
  const ownerLockActive = hasExclusiveOwner && !isExclusiveOwner
  const formDisabled = ownerLockActive || (userRole && userRole !== "inversionista")

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
    const numeroComprobante = comprobante?.codigo || `INV-${Date.now().toString().slice(-8)}`
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

  useEffect(() => {
    const fetchExclusiveOwner = async () => {
      if (!id) return
      try {
        const { data, error } = await supabase
          .from("inversiones")
          .select("id_inversor, fecha_inversion")
          .eq("id_proyecto", id)
          .eq("tipo_inversion", "Capital")
          .order("fecha_inversion", { ascending: true })
          .limit(1)

        if (error) throw error
        const ownerRecord = Array.isArray(data) ? data[0] : data
        setHasExclusiveOwner(Boolean(ownerRecord))
        setExclusiveOwnerId(ownerRecord?.id_inversor ?? null)
      } catch (err) {
        console.error("Error al verificar dueño único:", err.message)
      }
    }

    fetchExclusiveOwner()
  }, [id])

  useEffect(() => {
    if (!userId) return
    if (hasExclusiveOwner && exclusiveOwnerId === userId && selectedInvestmentType !== "dueno_unico") {
      setFormData((prev) => ({ ...prev, tipoInversion: "dueno_unico" }))
    }
  }, [hasExclusiveOwner, exclusiveOwnerId, userId, selectedInvestmentType])


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

    if (ownerLockActive) {
      setModalConfig({
        isOpen: true,
        type: "warning",
        title: "Proyecto con Dueño Único",
        message: "Este proyecto ya cuenta con un dueño único que controla la inversión.",
        details: (
          <>
            <p>De momento no es posible realizar nuevas inversiones sobre este proyecto.</p>
          </>
        ),
      })
      return
    }

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

    const minimo =
      formData.tipoInversion === "dueno_unico"
        ? isExclusiveOwner
          ? 0
          : project.costos * 0.3
        : project.costos * 0.1

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
      const newInvestmentId = generateClientUUID()
      const { error } = await supabase.from("inversiones").insert({
        id: newInvestmentId,
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

      setProject({ ...project, monto_recaudado: nuevoMontoRecaudado })

      const comprobanteCodigo = Math.random().toString(36).substr(2, 9).toUpperCase()

      if (formData.tipoInversion === "dueno_unico") {
        setHasExclusiveOwner(true)
        setExclusiveOwnerId(userId)
      }

      setComprobante({
        codigo: comprobanteCodigo,
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

  const montoDisponible = Math.max(0, project.costos - project.monto_recaudado)
  const costoTotal = Number(project.costos) || 0
  const montoRecaudado = Number(project.monto_recaudado) || 0
  const montoMinimo =
    formData.tipoInversion === "dueno_unico"
      ? isExclusiveOwner
        ? 0
        : costoTotal * 0.3
      : formData.tipoInversion === "accionista"
        ? costoTotal * 0.1
        : null
  const minimoDisplay = ownerLockActive
    ? "Reservado"
    : montoMinimo === null
      ? "Selecciona un tipo"
      : montoMinimo === 0 && isExclusiveOwner
        ? "Sin mínimo (Dueño Único)"
        : `$${montoMinimo.toLocaleString("es-CO")}`
  const minimoHintIsZero = montoMinimo === 0 && isExclusiveOwner
  const showOwnerSuccessBanner = isExclusiveOwner && hasExclusiveOwner
  const rawProgress = costoTotal ? (montoRecaudado / costoTotal) * 100 : 0
  const progressPercent = Number(Math.min(100, Math.max(0, rawProgress)).toFixed(1))
  const remainingCapital = Math.max(0, costoTotal - montoRecaudado)
  const fechaCreacion = project.fecha_creacion
    ? new Date(project.fecha_creacion).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "En curso"
  const produccionEstimada = project.produccion_estimada
    ? `${Number(project.produccion_estimada).toLocaleString("es-CO")} unidades`
    : "Por definir"
  const ticketAccionista = costoTotal * 0.1
  const ticketDuenoUnico = costoTotal * 0.3
  const progressTier = progressPercent >= 75 ? "alto" : progressPercent >= 40 ? "medio" : "bajo"
  const descripcionCorta = project.descripcion?.trim()
    ? project.descripcion
    : "Este proyecto impulsa la productividad agrícola con prácticas sostenibles y alianzas con comunidades locales."

  const fundingSummary = [
    { label: "Meta total", value: `$${costoTotal.toLocaleString("es-CO")}` },
    { label: "Recaudado", value: `$${montoRecaudado.toLocaleString("es-CO")}` },
    { label: "Disponible", value: `$${remainingCapital.toLocaleString("es-CO")}` },
  ]

  const projectHighlights = [
    { label: "Producción estimada", value: produccionEstimada },
    { label: "Estado", value: project.estado || "Por definir" },
    { label: "Creado", value: fechaCreacion },
  ]

  const timelineMilestones = [
    {
      title: "Proyecto publicado",
      description: fechaCreacion,
    },
    {
      title: "Capital recaudado",
      description: `${progressPercent}% del objetivo alcanzado`,
    },
    {
      title: "Próximo hito",
      description: "Entrega de resultados trimestrales",
    },
  ]

  const insightBadges = [
    {
      title: "Impacto regional",
      description: "Apoya a productores locales",
    },
    {
      title: "Seguimiento en vivo",
      description: "Reportes trimestrales",
    },
  ]

  const liquidityHighlights = [
    {
      label: "Capital disponible",
      value: `$${remainingCapital.toLocaleString("es-CO")}`,
      note: "Aún por financiar",
    },
    {
      label: "Ticket Accionista",
      value: `$${ticketAccionista.toLocaleString("es-CO")}`,
      note: "Desde 10% del objetivo",
    },
    {
      label: "Ticket Dueño Único",
      value: `$${ticketDuenoUnico.toLocaleString("es-CO")}`,
      note: "30% para control total",
    },
  ]

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
          <div className="header-meta">
            <span className="status-pill">{project.estado}</span>
            <div className="header-tags">
              <span>Rentabilidad verde</span>
              <span>Impacto social</span>
              <span>Supervisión directa</span>
            </div>
          </div>
          <div className="header-text">
            <h1 className="project-title">{project.nombre}</h1>
            <p className="project-subtitle">Inversión en proyecto agrícola sostenible</p>
          </div>
          <div className="header-stats">
            {fundingSummary.map((stat) => (
              <div className="header-stat" key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!comprobante ? (
        <div className="invertir-content">
          <div className="content-grid">
            <div className="left-column">
              <section className="funding-overview">
                <div className="radial-panel">
                  <div
                    className="radial-chart"
                    style={{ '--progress-value': `${progressPercent}%` }}
                    data-tier={progressTier}
                  >
                    <div className="radial-inner">
                      <strong>{progressPercent}%</strong>
                      <span>Financiado</span>
                      <small>${montoRecaudado.toLocaleString("es-CO")}</small>
                    </div>
                  </div>
                  <div className="radial-details">
                    <p className="radial-caption">Objetivo total</p>
                    <h3>${costoTotal.toLocaleString("es-CO")} COP</h3>
                    <div className="radial-badges">
                      <span>
                        <strong>${montoRecaudado.toLocaleString("es-CO")}</strong> recaudado
                      </span>
                      <span>
                        <strong>${remainingCapital.toLocaleString("es-CO")}</strong> disponible
                      </span>
                    </div>
                    <p className="radial-note">Actualizamos el progreso al instante conforme ingresan nuevas inversiones.</p>
                  </div>
                </div>
                <div className="overview-grid-cards">
                  {liquidityHighlights.map((item) => (
                    <div className="overview-card" key={item.label}>
                      <p>{item.label}</p>
                      <h4>{item.value}</h4>
                      <span>{item.note}</span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="project-summary-card">
                <div className="summary-header">
                  <div>
                    <p>Visión general</p>
                    <h3>¿Por qué invertir?</h3>
                  </div>
                  <span className="summary-chip">Agricultura sostenible</span>
                </div>
                <p className="summary-body">{descripcionCorta}</p>
                <div className="summary-meta">
                  {projectHighlights.map((item) => (
                    <div className="summary-item" key={item.label}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
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

              <div className="timeline-card">
                <div className="timeline-header">
                  <div>
                    <p>Ruta del proyecto</p>
                    <h3>Línea de avance</h3>
                  </div>
                  <span className="timeline-progress">{progressPercent}%</span>
                </div>
                <ul className="timeline-list">
                  {timelineMilestones.map((milestone) => (
                    <li className="timeline-item" key={milestone.title}>
                      <div className="timeline-dot"></div>
                      <div>
                        <h4>{milestone.title}</h4>
                        <p>{milestone.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="right-column">
              <div className="insight-banner">
                <div>
                  <p>Snapshot del impacto</p>
                  <h3>Tu inversión acelera el progreso</h3>
                </div>
                <div className="insight-badges">
                  {insightBadges.map((item) => (
                    <div className="insight-pill" key={item.title}>
                      <strong>{item.title}</strong>
                      <span>{item.description}</span>
                    </div>
                  ))}
                </div>
              </div>

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

              <form className="investment-form-modern" onSubmit={handleSubmit} aria-live="polite">
                  <div className="form-header">
                    <div className="form-icon">💎</div>
                    <h2>Realizar Inversión</h2>
                    <p>Selecciona tu tipo de inversión y monto</p>
                  </div>
                  {ownerLockActive && (
                    <div className="owner-lock-banner warning" role="status">
                      <div className="lock-icon">🔒</div>
                      <div>
                        <h4>Proyecto reservado</h4>
                        <p>Este proyecto ya cuenta con un dueño único. No se permiten nuevas inversiones.</p>
                      </div>
                    </div>
                  )}
                  {showOwnerSuccessBanner && (
                    <div className="owner-lock-banner success" role="status">
                      <div className="lock-icon">🌱</div>
                      <div>
                        <h4>Sigues siendo el dueño único</h4>
                        <p>Puedes reinvertir sin monto mínimo cuando puedas.</p>
                      </div>
                    </div>
                  )}
                  <div className="form-pills">
                    <div className="form-pill">
                      <span>Capital disponible</span>
                      <strong>${montoDisponible.toLocaleString("es-CO")}</strong>
                    </div>
                    <div className={`form-pill muted ${ownerLockActive ? "locked" : ""}`}>
                      <span>Mínimo actual</span>
                      <strong>{minimoDisplay}</strong>
                    </div>
                  </div>
                  <ul className="form-steps">
                    <li className="active">1. Tipo de inversión</li>
                    <li>2. Monto</li>
                    <li>3. Confirmación</li>
                  </ul>

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
                        className={`investment-type-card ${
                          formData.tipoInversion === "dueno_unico" ? "selected" : ""
                        } ${ownerLockActive ? "disabled" : ""}`}
                        aria-disabled={ownerLockActive}
                      >
                        <input
                          type="radio"
                          name="tipoInversion"
                          value="dueno_unico"
                          checked={formData.tipoInversion === "dueno_unico"}
                          onChange={handleChange}
                          disabled={formDisabled}
                        />
                        <div className="type-badge">Premium</div>
                        <div className="type-content">
                          <div className="type-icon">👑</div>
                          <div>
                            <h3>Dueño Único</h3>
                            <p>Control total del proyecto</p>
                          </div>
                        </div>
                        <div className="type-details">
                          <span className="type-percentage">30%</span>
                          <span className="type-amount">${(project.costos * 0.3).toLocaleString("es-CO")}</span>
                        </div>
                      </label>

                      <label
                        className={`investment-type-card ${
                          formData.tipoInversion === "accionista" ? "selected" : ""
                        } ${ownerLockActive ? "disabled" : ""}`}
                        aria-disabled={ownerLockActive}
                      >
                        <input
                          type="radio"
                          name="tipoInversion"
                          value="accionista"
                          checked={formData.tipoInversion === "accionista"}
                          onChange={handleChange}
                          disabled={formDisabled}
                        />
                        <div className="type-badge standard">Estándar</div>
                        <div className="type-content">
                          <div className="type-icon">🤝</div>
                          <div>
                            <h3>Accionista</h3>
                            <p>Participación compartida</p>
                          </div>
                        </div>
                        <div className="type-details">
                          <span className="type-percentage">10%</span>
                          <span className="type-amount">${(project.costos * 0.1).toLocaleString("es-CO")}</span>
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
                        disabled={formDisabled}
                      />
                      <span className="input-suffix">COP</span>
                    </div>
                    {montoMinimo !== null && (
                      <div className={`input-hint ${minimoHintIsZero ? "success" : ""}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 16v-4M12 8h.01" />
                        </svg>
                        {minimoHintIsZero ? (
                          <span>
                            Sin monto mínimo activo. Capital pendiente por invertir:{ " "}
                            {montoDisponible.toLocaleString("es-CO")}.
                          </span>
                        ) : (
                          <span>
                            Monto mínimo:{" "}
                            {montoMinimo.toLocaleString("es-CO")} • Disponible:{" "}
                            {montoDisponible.toLocaleString("es-CO")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <div className="terms-section">
                      <div className="terms-checkline">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            name="aceptaTerminos"
                            checked={formData.aceptaTerminos}
                            onChange={handleChange}
                            disabled={formDisabled}
                          />
                          <span className="checkbox-custom"></span>
                          <div className="terms-copy">
                            <strong>Acepto los términos y condiciones</strong>
                            <p>Confirmo que leí el acuerdo del proyecto y asumo los riesgos.</p>
                          </div>
                        </label>
                        <button
                          type="button"
                          className="terms-toggle"
                          onClick={() => setMostrarTerminos(!mostrarTerminos)}
                        >
                          {mostrarTerminos ? "Ocultar términos" : "Ver términos"}
                        </button>
                      </div>

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
            <div className="comprobante-columns">
              <div className="comprobante-main">
                <div className="comprobante-header pop">
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
                  <p className="comprobante-eyebrow">Inversión exitosa</p>
                  <h2>Tu comprobante está listo</h2>
                  <p>Tu inversión ha sido registrada correctamente en el sistema.</p>
                </div>

                <div className="comprobante-highlight">
                  <div className="highlight-block">
                    <span>Comprobante N°</span>
                    <strong>{comprobante.codigo}</strong>
                  </div>
                  <div className="highlight-block accent">
                    <span>Monto invertido</span>
                    <strong>${comprobante.monto.toLocaleString("es-CO")}</strong>
                  </div>
                </div>

                <div className="firma-pill">
                  <p>Firma digital del inversionista</p>
                  <strong>{comprobante.nombreUsuario}</strong>
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

              <div className="comprobante-side">
                <div className="side-header">
                  <p>Resumen instantáneo</p>
                  <h3>Detalles de la transacción</h3>
                </div>
                <div className="comprobante-grid">
                  <div className="grid-item">
                    <span>Proyecto</span>
                    <strong>{comprobante.nombreProyecto}</strong>
                  </div>
                  <div className="grid-item">
                    <span>Inversionista</span>
                    <strong>{comprobante.nombreUsuario}</strong>
                  </div>
                  <div className="grid-item">
                    <span>Tipo de inversión</span>
                    <strong>{comprobante.tipoInversion}</strong>
                  </div>
                  <div className="grid-item">
                    <span>Fecha y hora</span>
                    <strong>{comprobante.fecha}</strong>
                  </div>
                </div>
                <div className="side-note">
                  <p>Enviamos una copia digital al correo asociado a tu cuenta para que la consultes cuando quieras.</p>
                  <span>También puedes revisar tus movimientos en la sección Inversiones.</span>
                </div>
              </div>
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
