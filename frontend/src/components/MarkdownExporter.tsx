// SCRUM-73: Frontend component to preview and download generated Markdown specifications.
import React, { useState } from "react";
import { markdownService } from "../services/markdownService";
import { getApiErrorMessage } from "../lib/api";
import { Download, FileText, Loader2, Eye } from "lucide-react";

export const MarkdownExporter: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [productSpec, setProductSpec] = useState<string>("");
  const [archSpec, setArchSpec] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [downloadingProd, setDownloadingProd] = useState(false);
  const [downloadingArch, setDownloadingArch] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<"product" | "arch" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetchPreview = async (type: "product" | "arch") => {
    setLoading(true);
    setError(null);
    try {
      if (type === "product") {
        const text = await markdownService.getProductSpecPreview(projectId);
        setProductSpec(text);
        setPreviewDoc("product");
      } else {
        const text = await markdownService.getArchitectureSpecPreview(projectId);
        setArchSpec(text);
        setPreviewDoc("arch");
      }
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadProduct = async () => {
    setDownloadingProd(true);
    setError(null);
    try {
      await markdownService.downloadProductSpec(projectId);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setDownloadingProd(false);
    }
  };

  const handleDownloadArchitecture = async () => {
    setDownloadingArch(true);
    setError(null);
    try {
      await markdownService.downloadArchitectureSpec(projectId);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setDownloadingArch(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Entregables de Documentación Final</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Compila toda la información de las 5 fases en los entregables Markdown oficiales listos para descarga directa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadProduct}
            disabled={downloadingProd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            {downloadingProd ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Especificación de Producto (.md)
          </button>
          <button
            onClick={handleDownloadArchitecture}
            disabled={downloadingArch}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            {downloadingArch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Arquitectura Definitiva (.md)
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs">
        <span className="font-semibold text-slate-500">Vista previa rápida:</span>
        <button
          onClick={() => void handleFetchPreview("product")}
          disabled={loading}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline inline-flex items-center gap-1"
        >
          <Eye className="w-3 h-3" />
          Previsualizar Producto
        </button>
        <button
          onClick={() => void handleFetchPreview("arch")}
          disabled={loading}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline inline-flex items-center gap-1"
        >
          <Eye className="w-3 h-3" />
          Previsualizar Arquitectura
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 py-3">
          <Loader2 className="w-4 h-4 animate-spin" />
          Generando vista previa Markdown...
        </div>
      )}

      {previewDoc && (
        <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-slate-900 text-slate-100 p-4 font-mono text-[11px] max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-xs font-sans">
            <span className="font-semibold text-white">
              {previewDoc === "product" ? "Especificacion_Producto.md" : "Arquitectura_Definitiva.md"}
            </span>
            <button
              onClick={() => setPreviewDoc(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Cerrar vista previa
            </button>
          </div>
          <pre className="whitespace-pre-wrap">
            {previewDoc === "product" ? productSpec : archSpec}
          </pre>
        </div>
      )}
    </div>
  );
};
