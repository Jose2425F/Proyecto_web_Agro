import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useUser } from "../hooks/useUser";
import { useNavigate } from "react-router-dom";
import DescriptionAlerts from "../components/DescriptionAlerts";

import {
  Box,
  Container,
  Card,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Stack,
  Avatar,
  Input,
  Divider,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#14C900",
    },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#14C900", // borde verde al escribir
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          "&.Mui-focused": {
            color: "#14C900", // label verde al escribir
          },
        },
      },
    },
  },
});

const Crear_Proyectos = () => {
  const { userId } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projectImageFile, setProjectImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const [alertInfo, setAlertInfo] = useState({
    severity: "",
    title: "",
    message: "",
  });

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    costos: "",
    produccionEstimada: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      setProjectImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    } else {
      setProjectImageFile(null);
      setImagePreviewUrl(null);
    }
  };

  useEffect(() => {
    let timer;
    if (alertInfo.message) {
      timer = setTimeout(() => {
        setAlertInfo({ severity: "", title: "", message: "" });
      }, 6000);
    }
    return () => {
      clearTimeout(timer);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [alertInfo, imagePreviewUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setLoading(true);
  
    // Verifica campos vacíos
    if (
      !userId ||
      !formData.nombre ||
      !formData.descripcion ||
      !formData.costos ||
      !formData.produccionEstimada ||
      !projectImageFile
    ) {
      setAlertInfo({
        severity: "warning",
        title: "Atención Requerida",
        message:
          "Por favor, completa todos los campos del formulario y selecciona una imagen para continuar.",
      });
      setLoading(false);
      return;
    }
  
    // Validar valores negativos o cero
    const costosValue = parseFloat(formData.costos);
    const produccionValue = parseFloat(formData.produccionEstimada);
  
    if (costosValue <= 0 || produccionValue <= 0) {
      setAlertInfo({
        severity: "warning",
        title: "Valores inválidos",
        message:
          "Los campos 'Costos Estimados' y 'Producción Estimada' deben ser mayores a 0.",
      });
      setLoading(false);
      return;
    }
  
    let projectId = null;
  
    try {
      const { data: projectData, error: insertError } = await supabase
        .from("proyectos")
        .insert([
          {
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            costos: costosValue,
            produccion_estimada: produccionValue,
            id_usuario: userId,
            imagen_url: null,
            estado: "Buscando Inversión",
          },
        ])
        .select();
  
      if (insertError) throw insertError;
  
      projectId = projectData[0].id;
  
      const fileExt = projectImageFile.name.split(".").pop();
      const fileName = `${projectId}_${Date.now()}.${fileExt}`;
      const filePath = fileName;
  
      const { error: uploadError } = await supabase.storage
        .from("proyectos")
        .upload(filePath, projectImageFile);
  
      if (uploadError) throw uploadError;
  
      const { data: publicData } = supabase.storage
        .from("proyectos")
        .getPublicUrl(filePath);
  
      const projectImageUrl = publicData.publicUrl;
  
      const { error: updateError } = await supabase
        .from("proyectos")
        .update({ imagen_url: projectImageUrl })
        .eq("id", projectId);
  
      if (updateError) throw updateError;
  
      setAlertInfo({
        severity: "success",
        title: "Publicación Exitosa",
        message:
          "¡Tu proyecto ha sido creado y publicado con éxito! Te estamos redirigiendo.",
      });
  
      setTimeout(() => navigate(`/mis-proyectos`), 1200);
    } catch (error) {
      console.error("Fallo de proceso:", error);
  
      if (projectId) {
        const { error: deleteError } = await supabase
          .from("proyectos")
          .delete()
          .eq("id", projectId);
  
        if (deleteError) {
          setAlertInfo({
            severity: "error",
            title: "Error Crítico del Sistema",
            message:
              "Falló la carga de la imagen, y el sistema no pudo eliminar el borrador. Por favor, contacta a soporte.",
          });
        } else {
          setAlertInfo({
            severity: "error",
            title: "Fallo al Subir Imagen",
            message: `No pudimos cargar tu imagen: ${error.message}. El borrador del proyecto se eliminó correctamente. Intenta de nuevo.`,
          });
        }
      } else {
        setAlertInfo({
          severity: "error",
          title: "Error de Creación",
          message: `No se pudo crear el proyecto en la base de datos: ${error.message}.`,
        });
      }
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          backgroundColor: "#1A1A1A",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          padding: 2,
        }}
      >
        <Container maxWidth="sm">
          <Card
            sx={{
              padding: 4,
              backgroundColor: "#222",
              borderRadius: 3,
              boxShadow: "0 0 20px #000000",
            }}
          >
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              sx={{ color: "#14C900", fontWeight: 700 }}
            >
              Registrar Proyecto Agrícola
            </Typography>

            <Divider sx={{ borderColor: "#333", mb: 3 }} />

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={3}>
                <TextField
                  label="Nombre del Proyecto"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={submitted && !formData.nombre}
                  helperText={
                    submitted && !formData.nombre
                      ? "El nombre del proyecto es requerido"
                      : ""
                  }
                  sx={{
                    "& .MuiInputBase-root": {
                      backgroundColor: "#2A2A2A",
                      borderRadius: 2,
                    },
                    "& .MuiInputBase-input": { color: "#EAEAEA" },
                    "& label": { color: "#B0B0B0" },
                  }}
                />

                <TextField
                  label="Descripción"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={4}
                  required
                  error={submitted && !formData.descripcion}
                  helperText={
                    submitted && !formData.descripcion
                      ? "La descripción es requerida"
                      : ""
                  }
                  sx={{
                    "& .MuiInputBase-root": {
                      backgroundColor: "#2A2A2A",
                      borderRadius: 2,
                    },
                    "& .MuiInputBase-input": { color: "#EAEAEA" },
                    "& label": { color: "#B0B0B0" },
                  }}
                />

                <TextField
                  label="Costos Estimados ($)"
                  name="costos"
                  value={formData.costos}
                  onChange={handleChange}
                  fullWidth
                  type="number"
                  required
                  error={submitted && !formData.costos}
                  helperText={
                    submitted && !formData.costos
                      ? "Los costos estimados son requeridos"
                      : ""
                  }
                  sx={{
                    "& .MuiInputBase-root": {
                      backgroundColor: "#2A2A2A",
                      borderRadius: 2,
                    },
                    "& .MuiInputBase-input": { color: "#EAEAEA" },
                    "& label": { color: "#B0B0B0" },
                  }}
                />

                <TextField
                  label="Producción Estimada (kg)"
                  name="produccionEstimada"
                  value={formData.produccionEstimada}
                  onChange={handleChange}
                  fullWidth
                  type="number"
                  required
                  error={submitted && !formData.produccionEstimada}
                  helperText={
                    submitted && !formData.produccionEstimada
                      ? "La producción estimada es requerida"
                      : ""
                  }
                  sx={{
                    "& .MuiInputBase-root": {
                      backgroundColor: "#2A2A2A",
                      borderRadius: 2,
                    },
                    "& .MuiInputBase-input": { color: "#EAEAEA" },
                    "& label": { color: "#B0B0B0" },
                  }}
                />

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    mt: 2,
                  }}
                >
                  <Button
                    variant="contained"
                    component="label"
                    sx={{
                      backgroundColor: "#14C900",
                      "&:hover": { backgroundColor: "#14C900" },
                      borderRadius: 2,
                      px: 3,
                      fontWeight: 600,
                    }}
                  >
                    Seleccionar Imagen
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      sx={{ display: "none" }}
                    />
                  </Button>

                  {imagePreviewUrl && (
                    <Avatar
                      src={imagePreviewUrl}
                      alt="Vista previa del proyecto"
                      variant="rounded"
                      sx={{
                        width: 160,
                        height: 160,
                        borderRadius: 3,
                        boxShadow: "0 0 10px #14C900",
                        border: "2px solid #14C900",
                        mt: 1,
                      }}
                    />
                  )}

                  {submitted && !projectImageFile && (
                    <Typography color="#FF6B6B" variant="caption">
                      Una imagen del proyecto es requerida
                    </Typography>
                  )}
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  sx={{
                    mt: 3,
                    backgroundColor: "#14C900",
                    "&:hover": { backgroundColor: "#14C900" },
                    fontWeight: 600,
                    py: 1.5,
                    borderRadius: 2,
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Registrar Proyecto"
                  )}
                </Button>
              </Stack>
            </Box>
          </Card>
        </Container>

        {alertInfo.message && (
          <Box sx={{ position: "fixed", top: 20, right: 20, zIndex: 1000 }}>
            <DescriptionAlerts
              severity={alertInfo.severity}
              title={alertInfo.title}
              message={alertInfo.message}
            />
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default Crear_Proyectos;
