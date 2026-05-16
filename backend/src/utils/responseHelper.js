/**
 * Utilidad para estandarizar respuestas JSON de la API
 */

const success = (res, data, message = 'Operación exitosa', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const error = (res, message = 'Error en la operación', statusCode = 500, errors = null) => {
  const payload = {
    success: false,
    message,
  };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

module.exports = { success, error };
