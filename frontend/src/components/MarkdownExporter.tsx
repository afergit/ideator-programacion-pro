// SCRUM-73: Frontend component to preview and download generated Markdown specifications.
import React, { useState } from "react";
import axios from "axios";

export const MarkdownExporter: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [productSpec, setProductSpec] = useState<string>("");
  const [archSpec, setArchSpec] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpecs = async () => {
    setLoading(true);
    try {
      const [prodRes, archRes] = await Promise.all([
        axios.get(`/api/v1/projects/${projectId}/markdown/product`),
        axios.get(`/api/v1/projects/${projectId}/markdown/architecture`),
      ]);
      setProductSpec(prodRes.data);
      setArchSpec(archRes.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const download = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">Exportar Documentación</h2>
      {error && <div className="text-red-600 mb-2">Error: {error}</div>}
      <button
        onClick={fetchSpecs}
        disabled={loading}
        className="bg-indigo-600 text-white px-4 py-2 rounded mr-2"
      >
        {loading ? "Generando…" : "Generar Markdown"}
      </button>
      {productSpec && (
        <button
          onClick={() => download(productSpec, "Especificacion_Producto.md")}
          className="bg-green-600 text-white px-4 py-2 rounded mr-2"
        >
          Descargar Especificación
        </button>
      )}
      {archSpec && (
        <button
          onClick={() => download(archSpec, "Arquitectura_Definitiva.md")}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Descargar Arquitectura
        </button>
      )}
    </div>
  );
};
