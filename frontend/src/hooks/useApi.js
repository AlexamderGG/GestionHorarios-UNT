import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Hook genérico para consumir endpoints de la API.
 * Facilita el trabajo en paralelo de los módulos frontend.
 * 
 * Uso:
 * const { data, loading, error, refetch } = useApi('/docentes');
 */
export function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(endpoint, options);
      setData(response.data?.data ?? response.data);
    } catch (err) {
      setError(err.message || 'Error desconocido');
      console.error(`Error en useApi (${endpoint}):`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (options.manual !== true) {
      fetchData();
    }
  }, [endpoint]);

  return { data, loading, error, refetch: fetchData };
}

export default useApi;
