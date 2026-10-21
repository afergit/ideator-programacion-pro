// SCRUM-70: Frontend component to visualise and edit API specifications.
import React, { useEffect, useState } from "react";
import axios from "axios";

interface EndpointSpec {
  id: string;
  httpMethod: string;
  path: string;
  requestBody?: string;
  responseBody?: string;
  statusCodes: string; // JSON array string
}

export const ApiSpecViewer: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [specs, setSpecs] = useState<EndpointSpec[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpecs = () => {
    setLoading(true);
    axios
      .get(`/api/v1/projects/${projectId}/api-spec`)
      .then((res) => setSpecs(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSpecs();
  }, [projectId]);

  const saveSpecs = () => {
    setLoading(true);
    axios
      .post(`/api/v1/projects/${projectId}/api-spec`, specs)
      .then(() => alert("API specs saved"))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Especificación de API REST</h2>
      <button onClick={saveSpecs} className="bg-indigo-600 text-white px-3 py-1 rounded mb-4">
        Guardar Cambios
      </button>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">Método</th>
            <th className="p-2">Ruta</th>
            <th className="p-2">Request Body</th>
            <th className="p-2">Response Body</th>
            <th className="p-2">Status Codes</th>
          </tr>
        </thead>
        <tbody>
          {specs.map((s, idx) => (
            <tr key={s.id} className="border-t">
              <td className="p-2">
                <input
                  value={s.httpMethod}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSpecs((prev) => {
                      const copy = [...prev];
                      copy[idx].httpMethod = v;
                      return copy;
                    });
                  }}
                  className="border p-1 w-20"
                />
              </td>
              <td className="p-2">
                <input
                  value={s.path}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSpecs((prev) => {
                      const copy = [...prev];
                      copy[idx].path = v;
                      return copy;
                    });
                  }}
                  className="border p-1 w-48"
                />
              </td>
              <td className="p-2">
                <input
                  value={s.requestBody || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSpecs((prev) => {
                      const copy = [...prev];
                      copy[idx].requestBody = v;
                      return copy;
                    });
                  }}
                  className="border p-1 w-32"
                />
              </td>
              <td className="p-2">
                <input
                  value={s.responseBody || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSpecs((prev) => {
                      const copy = [...prev];
                      copy[idx].responseBody = v;
                      return copy;
                    });
                  }}
                  className="border p-1 w-32"
                />
              </td>
              <td className="p-2">
                <input
                  value={s.statusCodes}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSpecs((prev) => {
                      const copy = [...prev];
                      copy[idx].statusCodes = v;
                      return copy;
                    });
                  }}
                  className="border p-1 w-32"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
