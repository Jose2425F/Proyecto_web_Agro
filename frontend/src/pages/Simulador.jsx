import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import "./Simulador.css"

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const variantesEscenario = [
  { id: "defensivo", label: "Escenario defensivo", adjustment: -3, tone: "soft" },
  { id: "base", label: "Escenario base", adjustment: 0, tone: "neutral" },
  { id: "ambicioso", label: "Escenario ambicioso", adjustment: 3, tone: "bold" },
]

const simularProyeccion = ({ amount, months, expectedReturn, reinvest }) => {
  const montoDepurado = Math.max(0, Number(amount) || 0)
  const mesesDepurados = Math.max(1, Number(months) || 1)
  const tasaMensual = Math.pow(1 + (expectedReturn || 0) / 100, 1 / 12) - 1

  let capital = montoDepurado
  let gananciaAcumulada = 0
  const instantaneas = []

  for (let mes = 1; mes <= mesesDepurados; mes++) {
    const capitalBase = reinvest ? capital : montoDepurado
    const rendimientoBruto = capitalBase * tasaMensual
    const rendimientoNeto = rendimientoBruto
    gananciaAcumulada += rendimientoNeto

    if (reinvest) {
      capital += rendimientoNeto
    }

    const valorActual = reinvest ? capital : montoDepurado + gananciaAcumulada

    instantaneas.push({
      month: mes,
      value: valorActual,
      netGain: gananciaAcumulada,
    })
  }

  const valorFinal = reinvest ? capital : montoDepurado + gananciaAcumulada
  const gananciaNeta = valorFinal - montoDepurado
  const tasaEfectivaAnual =
    montoDepurado > 0 ? Math.pow(valorFinal / montoDepurado, 12 / mesesDepurados) - 1 : 0

  return {
    finalValue: valorFinal,
    netYield: gananciaNeta,
    snapshots: instantaneas,
    effectiveAnnual: Number.isFinite(tasaEfectivaAnual) ? tasaEfectivaAnual : 0,
  }
}

const Simulador = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [proyectos, setProyectos] = useState([])
  const [proyectosCargando, setProyectosCargando] = useState(true)
  const [errorProyectos, setErrorProyectos] = useState(null)
  const [idProyectoSeleccionado, setIdProyectoSeleccionado] = useState("cartera")
  const [tasaPersonalizadaModificada, setTasaPersonalizadaModificada] = useState(false)
  const [datosFormulario, setDatosFormulario] = useState({
    amount: 10000000,
    months: 12,
    expectedReturn: 14,
    reinvest: true,
  })
  const [montoPersonalizadoModificado, setMontoPersonalizadoModificado] = useState(false)
  const [tipoInversion, setTipoInversion] = useState("accionista")
  const [montoInput, setMontoInput] = useState(() => numberFormatter.format(10000000))
  const [montoEnEdicion, setMontoEnEdicion] = useState(false)
  const [errorMonto, setErrorMonto] = useState(null)

  const redondearMontoSugerido = ({ valor, paso = 500000, minimo = 500000, maximo }) => {
    const minimoSeguro = Number.isFinite(minimo) ? minimo : 500000
    if (!Number.isFinite(valor)) return minimoSeguro
    const pasoSeguro = paso > 0 ? paso : 500000
    if (Number.isFinite(maximo) && minimoSeguro > maximo) {
      return maximo
    }
    let resultado = Math.round(valor / pasoSeguro) * pasoSeguro
    resultado = Math.max(minimoSeguro, resultado)
    if (Number.isFinite(maximo)) {
      resultado = Math.min(maximo, resultado)
    }
    return resultado
  }

  const calcularPasoMonto = (minimoReferencia) => {
    if (!Number.isFinite(minimoReferencia) || minimoReferencia <= 0) return 500000
    const paso = minimoReferencia * 0.1
    const pasoRedondeado = Math.max(100000, Math.round(paso / 100000) * 100000)
    return pasoRedondeado
  }

  const formatearNumeroCampo = (valor) => {
    if (!Number.isFinite(valor) || valor <= 0) return ""
    return numberFormatter.format(valor)
  }

  const numeroDesdeTexto = (texto) => {
    if (!texto) return null
    const digitos = texto.replace(/[^0-9]/g, "")
    if (!digitos) return null
    const numero = Number(digitos)
    return Number.isFinite(numero) ? numero : null
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const projectId = params.get("projectId")
    if (projectId) {
      setIdProyectoSeleccionado(projectId)
    }
  }, [location.search])

  useEffect(() => {
    const obtenerProyectos = async () => {
      setProyectosCargando(true)
      setErrorProyectos(null)
      try {
        const { data, error } = await supabase
          .from("proyectos")
          .select("id, nombre, costos, monto_recaudado, produccion_estimada, estado, fecha_creacion")
          .order("fecha_creacion", { ascending: false })
        if (error) throw error
        setProyectos(data || [])
      } catch (err) {
        setErrorProyectos(err.message)
      } finally {
        setProyectosCargando(false)
      }
    }

    obtenerProyectos()
  }, [])

  useEffect(() => {
    setTasaPersonalizadaModificada(false)
    setMontoPersonalizadoModificado(false)
    if (idProyectoSeleccionado === "cartera") {
      setTipoInversion("accionista")
    }
  }, [idProyectoSeleccionado])

  useEffect(() => {
    setMontoPersonalizadoModificado(false)
  }, [tipoInversion])

  useEffect(() => {
    if (!montoEnEdicion) {
      setMontoInput(formatearNumeroCampo(datosFormulario.amount))
    }
  }, [datosFormulario.amount, montoEnEdicion])

  const proyectoSeleccionado = useMemo(() => {
    if (idProyectoSeleccionado === "cartera") return null
    return proyectos.find((p) => String(p.id) === String(idProyectoSeleccionado)) || null
  }, [proyectos, idProyectoSeleccionado])

  const sugerenciasProyecto = useMemo(() => {
    if (!proyectoSeleccionado) return null
    const costosProyecto = Number(proyectoSeleccionado.costos || 0)
    if (!costosProyecto) return null
    const recaudadoProyecto = Number(proyectoSeleccionado.monto_recaudado || 0)
    const produccionProyecto = Number(proyectoSeleccionado.produccion_estimada || 0)
    const coverageRatio = costosProyecto ? recaudadoProyecto / costosProyecto : 0
    const margenProduccion = costosProyecto
      ? ((produccionProyecto || costosProyecto) - costosProyecto) / costosProyecto
      : 0

    let tasaSugerida = 14
    if (Number.isFinite(margenProduccion)) {
      tasaSugerida = 10 + margenProduccion * 40
    }
    if (coverageRatio >= 0.8) tasaSugerida -= 2
    else if (coverageRatio < 0.5) tasaSugerida += 1.5
    tasaSugerida = Math.min(26, Math.max(10, tasaSugerida))

    const faltante = Math.max(0, costosProyecto - recaudadoProyecto)
    const porcentajeTicket = tipoInversion === "dueno_unico" ? 0.3 : 0.1
    const minimoRequerido = costosProyecto * porcentajeTicket
    const pasoMonto = calcularPasoMonto(minimoRequerido)

    const multiplicadorProduccion = tipoInversion === "dueno_unico" ? 0.25 : 0.12
    const multiplicadorFallback = tipoInversion === "dueno_unico" ? 0.28 : 0.15
    const baseDesdeProduccion = produccionProyecto
      ? produccionProyecto * multiplicadorProduccion
      : costosProyecto * multiplicadorFallback

    let montoBase = Math.max(minimoRequerido, baseDesdeProduccion)
    if (faltante > 0) {
      if (faltante < minimoRequerido) {
        montoBase = faltante
      } else {
        montoBase = Math.min(faltante, montoBase)
      }
    }

    const montoSugerido = redondearMontoSugerido({
      valor: montoBase,
      paso: pasoMonto,
      minimo: faltante > 0 ? Math.min(minimoRequerido, faltante) : minimoRequerido,
      maximo: faltante > 0 ? faltante : undefined,
    })

    return {
      tasa: Number(tasaSugerida.toFixed(1)),
      monto: montoSugerido,
      faltante,
      coverageRatio,
      baseDesdeProduccion,
      minimo: minimoRequerido,
      paso: pasoMonto,
      porcentajeTicket,
    }
  }, [proyectoSeleccionado, tipoInversion])

  const capitalPendienteProyecto = proyectoSeleccionado
    ? Math.max(0, Number(proyectoSeleccionado.costos || 0) - Number(proyectoSeleccionado.monto_recaudado || 0))
    : null
  const minimoInversionInput = proyectoSeleccionado && sugerenciasProyecto
    ? capitalPendienteProyecto > 0
      ? Math.min(sugerenciasProyecto.minimo, capitalPendienteProyecto)
      : sugerenciasProyecto.minimo
    : 1000000
  const montoMaximoPermitido = proyectoSeleccionado && capitalPendienteProyecto > 0 ? capitalPendienteProyecto : undefined
  const etiquetaTipoInversion = tipoInversion === "dueno_unico" ? "dueño único" : "accionista"
  const porcentajeTicketTexto = tipoInversion === "dueno_unico" ? "30%" : "10%"
  const ticketAccionistaProyecto = proyectoSeleccionado ? Number(proyectoSeleccionado.costos || 0) * 0.1 : null
  const ticketDuenoUnicoProyecto = proyectoSeleccionado ? Number(proyectoSeleccionado.costos || 0) * 0.3 : null

  useEffect(() => {
    if (!sugerenciasProyecto || tasaPersonalizadaModificada) return

    setDatosFormulario((prev) =>
      Math.abs(prev.expectedReturn - sugerenciasProyecto.tasa) < 0.05
        ? prev
        : {
            ...prev,
            expectedReturn: sugerenciasProyecto.tasa,
          },
    )
  }, [sugerenciasProyecto, tasaPersonalizadaModificada])

  useEffect(() => {
    if (!sugerenciasProyecto || montoPersonalizadoModificado) return

    setDatosFormulario((prev) =>
      prev.amount === sugerenciasProyecto.monto
        ? prev
        : {
            ...prev,
            amount: sugerenciasProyecto.monto,
          },
    )
  }, [sugerenciasProyecto, montoPersonalizadoModificado])

  const manejarCambioCampo = (field, value) => {
    setDatosFormulario((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const manejarInputMonto = (valor) => {
    setMontoEnEdicion(true)
    setErrorMonto(null)
    const digitos = valor.replace(/[^0-9]/g, "")
    if (!digitos) {
      setMontoInput("")
      return
    }
    const numero = Number(digitos)
    setMontoInput(formatearNumeroCampo(numero))
  }

  const manejarBlurMonto = () => {
    const numero = numeroDesdeTexto(montoInput)
    setMontoEnEdicion(false)
    if (!numero) {
      setErrorMonto("Ingresa un monto válido en COP.")
      return
    }
    if (Number.isFinite(minimoInversionInput) && numero < minimoInversionInput) {
      setErrorMonto(`El monto mínimo es ${currencyFormatter.format(minimoInversionInput)}.`)
      return
    }
    if (Number.isFinite(montoMaximoPermitido) && numero > montoMaximoPermitido) {
      setErrorMonto(`El máximo disponible es ${currencyFormatter.format(montoMaximoPermitido)}.`)
      return
    }

    setErrorMonto(null)
    setMontoPersonalizadoModificado(true)
    setDatosFormulario((prev) => ({
      ...prev,
      amount: numero,
    }))
    setMontoInput(formatearNumeroCampo(numero))
  }

  const manejarCambioRetorno = (value) => {
    setTasaPersonalizadaModificada(true)
    setDatosFormulario((prev) => ({
      ...prev,
      expectedReturn: value,
    }))
  }

  const simulacion = useMemo(
    () =>
      simularProyeccion({
        amount: datosFormulario.amount,
        months: datosFormulario.months,
        expectedReturn: datosFormulario.expectedReturn,
        reinvest: datosFormulario.reinvest,
      }),
    [datosFormulario],
  )

  const resultadosEscenario = useMemo(() => {
    return variantesEscenario.map((escenario) => {
      const tasaAjustada = Math.max(6, datosFormulario.expectedReturn + escenario.adjustment)
      const resultado = simularProyeccion({
        amount: datosFormulario.amount,
        months: datosFormulario.months,
        expectedReturn: tasaAjustada,
        reinvest: datosFormulario.reinvest,
      })
      return {
        ...escenario,
        adjustedRate: tasaAjustada,
        finalValue: resultado.finalValue,
        netYield: resultado.netYield,
      }
    })
  }, [datosFormulario])

  const ultimasInstantaneas = simulacion.snapshots.slice(-3)
  const porcentajeCrecimientoTotal =
    datosFormulario.amount > 0 ? ((simulacion.finalValue / datosFormulario.amount - 1) * 100) : 0

  const porcentajeCobertura = proyectoSeleccionado && proyectoSeleccionado.costos
    ? Math.min(100, ((proyectoSeleccionado.monto_recaudado || 0) / proyectoSeleccionado.costos) * 100)
    : null

  const capitalFaltante = proyectoSeleccionado && proyectoSeleccionado.costos
    ? Math.max(0, proyectoSeleccionado.costos - (proyectoSeleccionado.monto_recaudado || 0))
    : null

  return (
    <div className="sim-invest-shell">
      <section className="sim-invest-hero">
        <div>
          <p className="sim-invest-eyebrow">Simulador financiero</p>
          <h1>Simula tu inversión en segundos</h1>
          <p className="sim-invest-hero-subtext">
            Ajusta monto, plazo y supuestos clave en un flujo guiado para visualizar un resultado claro antes de
            invertir. Si eliges un proyecto, el panel trae señales del estado y capital pendiente automáticamente.
          </p>
        </div>
        <div className="sim-invest-hero-panel">
          <div className="sim-invest-hero-metrics">
            <article>
              <span>Capital estimado</span>
              <strong>{currencyFormatter.format(simulacion.finalValue)}</strong>
            </article>
            <article>
              <span>Utilidad neta</span>
              <strong>{currencyFormatter.format(simulacion.netYield)}</strong>
            </article>
            <article>
              <span>TEA</span>
              <strong>{(simulacion.effectiveAnnual * 100).toFixed(1)}%</strong>
            </article>
            <article>
              <span>Plazo simulado</span>
              <strong>{datosFormulario.months} meses</strong>
            </article>
          </div>
        </div>
      </section>

      <section className="sim-invest-panels">
        <form className="sim-invest-control-card" onSubmit={(e) => e.preventDefault()}>
          <div className="sim-invest-control-header">
            <div>
              <p>Simulación guiada</p>
              <h2>Completa los pasos</h2>
              <small>Sigue el orden y ajusta sólo lo necesario para entender tu inversión rápidamente.</small>
            </div>
            {proyectoSeleccionado && <span className="sim-invest-chip">{proyectoSeleccionado.estado}</span>}
          </div>

          <section className="sim-invest-step">
            <div className="sim-invest-step-chip">Paso 1</div>
            <div className="sim-invest-step-body">
              <h3>Selecciona el contexto</h3>
              <p className="sim-invest-step-hint">
                Decide si deseas simular con un proyecto puntual o probar tu portafolio completo para entender el potencial.
              </p>
              <div className="sim-invest-step-columns">
                <label className="sim-invest-field">
                  <span>Proyecto</span>
                  <select
                    value={idProyectoSeleccionado}
                    onChange={(e) => setIdProyectoSeleccionado(e.target.value)}
                    disabled={proyectosCargando}
                  >
                    <option value="cartera">Portafolio diversificado</option>
                    {proyectos.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.nombre}
                      </option>
                    ))}
                  </select>
                  {errorProyectos && <small className="sim-invest-field-error">{errorProyectos}</small>}
                </label>
                <div className="sim-invest-context-card">
                  <strong>Pista rápida</strong>
                  <p>
                    Si eliges un proyecto, el simulador ajusta la tasa sugerida según su recaudo y estado. Además puedes alternar
                    entre ser accionista o dueño único para ver el ticket correspondiente. Con el portafolio diversificado obtienes
                    una referencia general sin sesgos.
                  </p>
                </div>
              </div>
              {proyectoSeleccionado && (
                <div className="sim-invest-context-card sim-invest-context-card--inline">
                  <strong>{proyectoSeleccionado.nombre}</strong>
                  <p>
                    Recaudo: {currencyFormatter.format(proyectoSeleccionado.monto_recaudado || 0)} · Meta: {currencyFormatter.format(proyectoSeleccionado.costos || 0)} · Producción estimada: {currencyFormatter.format(proyectoSeleccionado.produccion_estimada || 0)}
                  </p>
                  {sugerenciasProyecto && sugerenciasProyecto.faltante > 0 && (
                    <small>Faltan {currencyFormatter.format(sugerenciasProyecto.faltante)} para cerrar este proyecto.</small>
                  )}
                  <div className="sim-invest-inline-tags">
                    {ticketAccionistaProyecto && (
                      <span>Ticket accionista (10%): {currencyFormatter.format(ticketAccionistaProyecto)}</span>
                    )}
                    {ticketDuenoUnicoProyecto && (
                      <span>Ticket dueño único (30%): {currencyFormatter.format(ticketDuenoUnicoProyecto)}</span>
                    )}
                  </div>
                </div>
              )}
              {!proyectoSeleccionado && (
                <p className="sim-invest-step-hint">Sin proyecto seleccionado verás un escenario general listo para comparar.</p>
              )}
            </div>
          </section>

          <section className="sim-invest-step">
            <div className="sim-invest-step-chip">Paso 2</div>
            <div className="sim-invest-step-body">
              <h3>Define tu aporte y plazo</h3>
              <p className="sim-invest-step-hint">
                Organiza los montos para que el formulario no sea interminable. Ajusta el plazo moviendo el control y verás el impacto inmediato.
              </p>
              {proyectoSeleccionado && (
                <div className="sim-invest-type-toggle">
                  <div>
                    <span>Modo de participación</span>
                    <p>Simula como {etiquetaTipoInversion} para que el monto mínimo refleje el ticket del {porcentajeTicketTexto}.</p>
                  </div>
                  <div className="sim-invest-type-options">
                    <button
                      type="button"
                      className={tipoInversion === "accionista" ? "is-active" : ""}
                      onClick={() => setTipoInversion("accionista")}
                    >
                      <strong>Accionista</strong>
                      <small>Ticket 10% · {ticketAccionistaProyecto ? currencyFormatter.format(ticketAccionistaProyecto) : "N/A"}</small>
                    </button>
                    <button
                      type="button"
                      className={tipoInversion === "dueno_unico" ? "is-active" : ""}
                      onClick={() => setTipoInversion("dueno_unico")}
                    >
                      <strong>Dueño único</strong>
                      <small>Ticket 30% · {ticketDuenoUnicoProyecto ? currencyFormatter.format(ticketDuenoUnicoProyecto) : "N/A"}</small>
                    </button>
                  </div>
                </div>
              )}
              <div className="sim-invest-double-field">
                <label className="sim-invest-field">
                  <span>Monto a invertir (COP)</span>
                  <div className="sim-invest-input-group">
                    <span>$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={montoInput}
                      onChange={(e) => manejarInputMonto(e.target.value)}
                      onFocus={() => setMontoEnEdicion(true)}
                      onBlur={manejarBlurMonto}
                      placeholder="0"
                      aria-invalid={Boolean(errorMonto)}
                    />
                  </div>
                  {errorMonto ? (
                    <small className="sim-invest-field-error">{errorMonto}</small>
                  ) : proyectoSeleccionado && sugerenciasProyecto ? (
                    <small>
                      {montoPersonalizadoModificado
                        ? `Respetamos tu monto personalizado como ${etiquetaTipoInversion}.`
                        : `Ticket ${etiquetaTipoInversion} (${porcentajeTicketTexto}) ≈ ${currencyFormatter.format(
                            Math.min(sugerenciasProyecto.minimo, capitalPendienteProyecto || sugerenciasProyecto.minimo),
                          )}. Te sugerimos ${currencyFormatter.format(sugerenciasProyecto.monto)} ${
                            sugerenciasProyecto.faltante > 0
                              ? `porque faltan ${currencyFormatter.format(sugerenciasProyecto.faltante)} para completar la meta`
                              : "para mantener consistencia con ese ticket"
                          }.`}
                    </small>
                  ) : (
                    <small>Usa múltiplos cómodos para ajustar el capital rápidamente.</small>
                  )}
                </label>
                <label className="sim-invest-field sim-invest-field-slider">
                  <span>Plazo (meses)</span>
                  <input
                    type="range"
                    min={6}
                    max={48}
                    step={1}
                    value={datosFormulario.months}
                    onChange={(e) => manejarCambioCampo("months", Number(e.target.value))}
                  />
                  <strong>{datosFormulario.months} meses</strong>
                </label>
              </div>
            </div>
          </section>

          <section className="sim-invest-step">
            <div className="sim-invest-step-chip">Paso 3</div>
            <div className="sim-invest-step-body">
              <h3>Ajusta los supuestos clave</h3>
              <p className="sim-invest-step-hint">
                Mantén el simulador sencillo: define la rentabilidad anual estimada y decide si las utilidades se vuelven a
                sumar automáticamente.
              </p>
              <div className="sim-invest-double-field sim-invest-step-grid">
                <label className="sim-invest-field sim-invest-field-slider">
                  <span>Retorno esperado anual</span>
                  <input
                    type="range"
                    min={8}
                    max={25}
                    step={0.5}
                    value={datosFormulario.expectedReturn}
                    onChange={(e) => manejarCambioRetorno(Number(e.target.value))}
                  />
                  <strong>{datosFormulario.expectedReturn}%</strong>
                  {proyectoSeleccionado && sugerenciasProyecto && (
                    <small>
                      {tasaPersonalizadaModificada
                        ? "Estás usando un retorno manual."
                        : `Sugerencia automática basada en producción estimada, cobertura y el perfil ${etiquetaTipoInversion} de ${proyectoSeleccionado.nombre}.`}
                    </small>
                  )}
                </label>
                <label className="sim-invest-field sim-invest-switch-field sim-invest-context-card sim-invest-toggle-card">
                  <span>Reinvertir utilidades</span>
                  <button
                    type="button"
                    className={`sim-invest-switch ${datosFormulario.reinvest ? "is-on" : "is-off"}`}
                    onClick={() => manejarCambioCampo("reinvest", !datosFormulario.reinvest)}
                  >
                    <span></span>
                  </button>
                  <small>
                    {datosFormulario.reinvest
                      ? "Las utilidades se suman al capital y aceleran el crecimiento."
                      : "Recibes tus utilidades al final de cada periodo sin componer."}
                  </small>
                </label>
              </div>
            </div>
          </section>
        </form>

        <div className="sim-invest-right-column">
          <section className="sim-invest-result-card">
            <header>
              <p>Resultado</p>
              <h2>Resumen de tu simulación</h2>
            </header>
            <div className="sim-invest-result-grid">
              <article>
                <span>Capital final</span>
                <strong>{currencyFormatter.format(simulacion.finalValue)}</strong>
              </article>
              <article>
                <span>Utilidad neta</span>
                <strong>{currencyFormatter.format(simulacion.netYield)}</strong>
              </article>
              <article>
                <span>Tasa efectiva anual</span>
                <strong>{(simulacion.effectiveAnnual * 100).toFixed(1)}%</strong>
              </article>
              <article>
                <span>Crecimiento total</span>
                <strong>{porcentajeCrecimientoTotal.toFixed(1)}%</strong>
              </article>
            </div>

            <div className="sim-invest-timeline">
              <p>Trayectoria final del capital</p>
              <ul>
                {ultimasInstantaneas.map((snapshot) => (
                  <li key={snapshot.month}>
                    <div>
                      <span>Mes {snapshot.month}</span>
                      <strong>{currencyFormatter.format(snapshot.value)}</strong>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <div className="sim-invest-scenarios-card">
            <header>
              <p>Escenarios</p>
              <h2>Cómo podría variar</h2>
            </header>
            <div className="sim-invest-scenario-grid">
              {resultadosEscenario.map((escenario) => (
                <article key={escenario.id} className={`sim-invest-scenario ${escenario.tone}`}>
                  <p>{escenario.label}</p>
                  <h3>{currencyFormatter.format(escenario.finalValue)}</h3>
                  <span>{escenario.adjustedRate}% TEA estimada</span>
                </article>
              ))}
            </div>
          </div>

          <div className="sim-invest-project-card">
            <header>
              <p>Señales del proyecto</p>
              <h2>{proyectoSeleccionado ? proyectoSeleccionado.nombre : "Simula sin proyecto"}</h2>
            </header>
            {proyectoSeleccionado ? (
              <>
                <div className="sim-invest-project-meta">
                  <div>
                    <span>Avance de recaudo</span>
                    <strong>{porcentajeCobertura?.toFixed(1)}%</strong>
                  </div>
                  <div>
                    <span>Capital pendiente</span>
                    <strong>{currencyFormatter.format(capitalFaltante)}</strong>
                  </div>
                  <div>
                    <span>Creado</span>
                    <strong>
                      {proyectoSeleccionado.fecha_creacion
                        ? new Date(proyectoSeleccionado.fecha_creacion).toLocaleDateString("es-CO")
                        : "Sin fecha"}
                    </strong>
                  </div>
                </div>
                <p className="sim-invest-project-hint">
                  Ajustamos el retorno sugerido según el porcentaje recaudado y el estado del proyecto. Proyectos
                  jóvenes mantienen primas más altas; los consolidados tienden a estabilizar su retorno.
                </p>
                <button
                  type="button"
                  className="sim-invest-project-btn"
                  onClick={() => navigate(`/invertir/${proyectoSeleccionado.id}`)}
                >
                  Continuar con la inversión
                </button>
              </>
            ) : (
              <p className="sim-invest-project-hint">
                Puedes ejecutar simulaciones generales para tu portafolio o elegir un proyecto específico para obtener
                referencias de recaudo, estado y fecha de creación.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Simulador
