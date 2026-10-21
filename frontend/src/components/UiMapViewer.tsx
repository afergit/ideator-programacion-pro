// SCRUM-71: Frontend component to visualise the UI navigation map and mockup placeholders.
import React, { useEffect, useState } from "react";
import axios from "axios";

interface ScreenSpec {
  name: string;
  components: string[];
  mockupUrl?: string;
}

interface UiMap {
  screens: ScreenSpec[];
}

export const UiMapViewer: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [uiMap, setUiMap] = useState<UiMap>({ screens: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`/api/v1/projects/${projectId}/ui-map`)
      .then((res) => setUiMap(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div className="p-4">Cargando mapa UI…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Mapa de Navegación UI</h2>
      {uiMap.screens.map((screen, idx) => (
        <div key={idx} className="border rounded p-3 mb-4">
          <h3 className="font-semibold">Pantalla: {screen.name}</h3>
          <p>Componentes: {screen.components.join(", ")}</p>
          {screen.mockupUrl && (
            <div className="mt-2">
              <a href={screen.mockupUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                Ver mockup
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
