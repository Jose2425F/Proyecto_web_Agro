import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import jsPDF from "jspdf";
import "./InvertirProyecto.css";
import { useUser } from "../hooks/useUser";

const InvertirProyecto = () => {
  const { userId, setUserId } = useUser();
  const [project, setProject] = useState(null);
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comprobante, setComprobante] = useState(null);
  const [mostrarTerminos, setMostrarTerminos] = useState(false);
  const [userData, setUserData] = useState(null);
  const [proyectoURL, setProyectoUrl] = useState(null);

  const [formData, setFormData] = useState({
    tipoInversion: "",
    monto: "",
    aceptaTerminos: false,
  });

  // Obtener usuario actual
  useEffect(() => {
    setLoading(true);

    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      setLoading(false);
    }
  }, [setUserId]);

  // Cargar datos del proyecto
  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const { data, error } = await supabase
          .from("proyectos")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setProyectoUrl(data.imagen_url); // Asignar la URL de la imagen
        setProject(data);
      } catch (err) {
        console.error(err);
        setError("Error al cargar el proyecto.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Generar PDF del comprobante (versión moderna y centrada tipo Bancolombia)
  const generarPDF = async (comprobante) => {
    const doc = new jsPDF("p", "mm", "a4");

    // === COLORES ===
    const colorVerde = "#00A859";
    const colorGris = "#F6F7F9";
    const colorTexto = "#333333";
    const colorBorde = "#D1D5DB";

    // === FONDO BLANCO ===
    doc.setFillColor("#FFFFFF");
    doc.rect(0, 0, 210, 297, "F");

    // === LOGO Y TÍTULO AGROCOLOMBIA ===
    const logoURL =
      "https://lzgmqtmnstiykakpmxfa.supabase.co/storage/v1/object/public/avatars/logo/logo.png";
    if (logoURL) {
      doc.addImage(logoURL, "PNG", 90, 15, 30, 30); // centrado superior
    }

    doc.setFont("helvetica", "bold");
    doc.setTextColor(colorVerde);
    doc.setFontSize(18);
    doc.text("AgroColombia", 105, 52, { align: "center" });

    // === ENCABEZADO PRINCIPAL ===
    doc.setDrawColor(colorVerde);
    doc.setLineWidth(0.8);
    // aumentamos un poco el ancho del rectángulo (de 160 a 170)
    const anchoRect = 170;
    const xRect = (210 - anchoRect) / 2; // centrado exacto
    doc.roundedRect(xRect, 60, anchoRect, 25, 5, 5, "S");
    doc.setFontSize(13);
    doc.setTextColor(colorVerde);
    // centrado dentro del mismo rectángulo (usamos el mismo centro)
    const centroRect = xRect + anchoRect / 2;
    doc.text(
      "Comprobante de inversión registrado con éxito",
      centroRect,
      77,
      {
        align: "center",
      }
    );

    // === TARJETA DETALLES CON SOMBRA (simulada) ===
    doc.setFillColor("#EAEAEA");
    doc.roundedRect(23, 97, 164, 92, 5, 5, "F"); // sombra gris clara
    doc.setFillColor(colorGris);
    doc.roundedRect(20, 95, 170, 90, 5, 5, "F"); // tarjeta principal

    doc.setTextColor(colorTexto);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Detalles de la inversión", 30, 110);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    let y = 125;
    const esp = 10;
    doc.text(`Proyecto: ${comprobante.nombreProyecto}`, 30, y);
    y += esp;
    doc.text(`Inversionista: ${comprobante.nombreUsuario}`, 30, y);
    y += esp;
    doc.text(`Tipo de inversión: ${comprobante.tipoInversion}`, 30, y);
    y += esp;
    const montoFormateado = Number(comprobante?.monto || 0).toLocaleString(
      "es-CO"
    );
    doc.text(`Monto invertido: $${montoFormateado}`, 30, y);
    y += esp;
    doc.text(`Fecha: ${comprobante.fecha}`, 30, y);

    // === FIRMA ===
    y += 25;
    doc.setFont("helvetica", "italic");
    doc.text("Firma del inversionista:", 30, y);
    y += 15;
    doc.setDrawColor(colorVerde);
    doc.setLineWidth(0.8);
    doc.line(30, y, 100, y);
    doc.text("(Firma simulada)", 32, y + 7);

    // === BOTONES FICTICIOS CENTRADOS ===
    const yBotones = 250;
    const anchoBtn = 50;
    const altoBtn = 18;
    const espacio = 20;
    const totalAncho = 3 * anchoBtn + 2 * espacio;
    const xInicial = (210 - totalAncho) / 2;

    // Íconos de ejemplo (usa tus URLs o PNG locales)
    const iconos = {
      compartir: "https://cdn-icons-png.flaticon.com/512/929/929610.png",
      descargar: "https://cdn-icons-png.flaticon.com/512/724/724933.png",
      nueva: "https://cdn-icons-png.flaticon.com/512/992/992651.png",
    };

    const botones = [
      { texto: "Compartir", icono: iconos.compartir },
      { texto: "Descargar", icono: iconos.descargar },
      { texto: "Nueva inversión", icono: iconos.nueva },
    ];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(colorVerde);

    for (let i = 0; i < botones.length; i++) {
      const x = xInicial + i * (anchoBtn + espacio);
      doc.setFillColor(colorGris);
      doc.roundedRect(x, yBotones, anchoBtn, altoBtn, 4, 4, "F");

      // Ícono centrado horizontalmente
      if (botones[i].icono) {
        doc.addImage(botones[i].icono, "PNG", x + 18, yBotones + 2, 14, 14);
      }

      // Texto centrado debajo del ícono
      doc.text(botones[i].texto, x + anchoBtn / 2, yBotones + altoBtn + 6, {
        align: "center",
      });
    }

    // === FOOTER ===
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#888");
    doc.setFontSize(10);

    // movido un poco a la izquierda para que no se corte el final
    doc.text(
      "Gracias por confiar en AgroColombia, impulsando el futuro del agro colombiano ",
      50, // antes 105
      280,
      { align: "center" }
    );
    doc.text("Este comprobante se generó automáticamente.", 50, 285, {
      align: "center",
    });
    // === DESCARGA ===
    doc.save(`Comprobante_${comprobante.nombreProyecto}.pdf`);
  };

  useEffect(() => {
    if (!userId) return; // Asegurarse de que userId esté definido
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setUserData(data.nombre + " " + data.apellido);
        }
      } catch (err) {
        console.error("Error al obtener el usuario:", err.message);
      }
    };
    fetchUser();
  }, [userId]);

  // Enviar inversión y mostrar comprobante
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.tipoInversion) {
      alert("Selecciona un tipo de inversión.");
      return;
    }

    const montoNum = parseFloat(formData.monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      alert("El monto debe ser un número positivo.");
      return;
    }

    const minimo =
      formData.tipoInversion === "dueno_unico"
        ? project.costos * 0.3
        : project.costos * 0.1;

    if (montoNum < minimo) {
      alert(
        `El monto mínimo para ser ${
          formData.tipoInversion === "dueno_unico"
            ? "Dueño Único"
            : "Accionista"
        } es ${minimo.toLocaleString()}`
      );
      return;
    }

    if (!formData.aceptaTerminos) {
      alert("Debes aceptar los términos y condiciones.");
      return;
    }

    try {
      // Insertar la inversión
      const { error } = await supabase.from("inversiones").insert({
        id_proyecto: id, // 👈 Convertimos el id de string a número
        id_inversor: userId, // 👈 Usuario autenticado real
        tipo_inversion:
          formData.tipoInversion === "dueno_unico" ? "Capital" : "Accionista",
        monto_invertido: montoNum,
      });

      if (error) {
        console.error("❌ Error Supabase:", error.message);
        alert("Error al registrar la inversión: " + error.message);
        throw error;
      }

      // Si todo salió bien, generamos el comprobante
      setComprobante({
        nombreUsuario: userData, // 👈 Aquí podrías obtener el nombre real del usuario
        nombreProyecto: project.nombre,
        tipoInversion:
          formData.tipoInversion === "dueno_unico" ? "Capital" : "Accionista",
        monto: montoNum,
        fecha: new Date().toLocaleString(),
        /*  inversionista: user.email, // 👈 añadimos el correo al comprobante*/
      });
    } catch (err) {
      console.error("Error general:", error);
      alert("Error al registrar la inversión.");
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  const montoMinimo =
    formData.tipoInversion === "dueno_unico"
      ? project.costos * 0.3
      : formData.tipoInversion === "accionista"
      ? project.costos * 0.1
      : null;

  return (
    <div className="invertir-page">
      <h1 className="title">Invertir en: {project.nombre}</h1>

      {!comprobante ? (
        <form className="investment-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Tipo de Inversión</label>
            <select
              name="tipoInversion"
              value={formData.tipoInversion}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar...</option>
              <option value="dueno_unico">Dueño Único</option>
              <option value="accionista">Accionista</option>
            </select>
          </div>

          <div className="form-row">
            <label>Monto a Invertir</label>
            <input
              type="number"
              name="monto"
              value={formData.monto}
              onChange={handleChange}
              min="0"
              required
            />
          </div>

          {montoMinimo && (
            <p className="info-text">
              💡 Monto mínimo requerido: ${montoMinimo.toLocaleString()}
            </p>
          )}

          <div className="checkbox-row">
            <input
              type="checkbox"
              name="aceptaTerminos"
              checked={formData.aceptaTerminos}
              onChange={handleChange}
            />
            <label>
              Acepto los{" "}
              <span
                className="link"
                onClick={() => setMostrarTerminos(!mostrarTerminos)}
              >
                términos y condiciones
              </span>
            </label>
          </div>

          {mostrarTerminos && (
            <ul className="terminos-list">
              <li>1. La inversión no garantiza rendimientos inmediatos.</li>
              <li>
                2. El capital será administrado por el gestor del proyecto.
              </li>
              <li>3. No se permiten retiros antes de la fecha pactada.</li>
              <li>4. El inversionista asume riesgos de mercado.</li>
              <li>5. La información financiera será confidencial.</li>
              <li>6. Supabase almacena los datos bajo estándares seguros.</li>
              <li>7. Las ganancias se distribuirán proporcionalmente.</li>
              <li>8. Los impuestos corren por cuenta del inversionista.</li>
              <li>9. El contrato se rige por leyes locales.</li>
              <li>
                10. La aceptación implica conformidad con todos los puntos.
              </li>
            </ul>
          )}

          <button type="submit" className="btn-confirmar">
            Confirmar Inversión
          </button>
        </form>
      ) : (
        <div className="comprobante-popup">
          <div className="popup-content">
            <h2>✅ Comprobante de Inversión</h2>
            <p>
              <strong>Proyecto:</strong> {comprobante.nombreProyecto}
            </p>
            <p>
              <strong>Inversionista:</strong> {comprobante.nombreUsuario}
            </p>
            <p>
              <strong>Tipo:</strong> {comprobante.tipoInversion}
            </p>
            <p>
              <strong>Monto:</strong> ${comprobante.monto.toLocaleString()}
            </p>
            <p>
              <strong>Fecha:</strong> {comprobante.fecha}
            </p>

            <div className="firma">
              __________________________
              <br />
              (Firma Simulada)
            </div>

            <div className="popup-buttons">
              <button onClick={() => generarPDF(comprobante)}>
                Descargar PDF
              </button>
              <button onClick={() => setComprobante(null)}>
                Nueva Inversión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvertirProyecto;
