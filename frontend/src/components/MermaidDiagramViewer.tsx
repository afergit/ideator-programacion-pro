import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Code,
  Copy,
  Download,
  Eye,
  Maximize2,
  Minimize2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  AlertCircle,
} from 'lucide-react';

interface MermaidDiagramViewerProps {
  chart: string;
  title?: string;
  footerText?: string;
  formatBadge?: string;
  filename?: string;
}

export const MermaidDiagramViewer: React.FC<MermaidDiagramViewerProps> = ({
  chart,
  title = 'Diagrama de Arquitectura de Sistemas',
  footerText = 'Diagrama interactivo generado por el agente',
  formatBadge = 'Mermaid v10',
  filename = 'diagrama',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Renderizador dinámico con Mermaid.js
  useEffect(() => {
    let isMounted = true;

    async function renderMermaid() {
      if (!chart || !chart.trim()) {
        setSvgContent('');
        setLoading(false);
        return;
      }

      setLoading(true);
      setRenderError(null);

      try {
        // Carga dinámica de Mermaid ESM desde CDN confiable
        const cdnUrl = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
        // @ts-ignore
        const mermaidModule = await import(/* @vite-ignore */ cdnUrl);
        const mermaid = mermaidModule.default || mermaidModule;

        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'loose',
          suppressErrorRendering: true,
          fontFamily: 'Inter, system-ui, sans-serif',
          themeVariables: {
            primaryColor: '#f1f5f9',
            primaryTextColor: '#0f172a',
            primaryBorderColor: '#94a3b8',
            lineColor: '#475569',
            secondaryColor: '#f8fafc',
            tertiaryColor: '#ffffff',
            clusterBkg: '#f8fafc',
            clusterBorder: '#cbd5e1',
          },
        });

        // Limpieza proactiva de nodos temporales inyectados por Mermaid en document.body
        document.querySelectorAll('[id^="dmermaid"]').forEach((el) => el.remove());

        // Sanitización rápida de sintaxis para compatibilidad con Mermaid v10
        const cleanChart = chart.trim();

        // Validar primero con mermaid.parse para evitar inyecciones de error en DOM
        try {
          await mermaid.parse(cleanChart);
        } catch (parseErr) {
          // Si el texto aún está cargando o es sintaxis preliminar, suprimimos el error visual
          document.querySelectorAll('[id^="dmermaid"]').forEach((el) => el.remove());
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        const id = 'mermaid-render-' + Math.random().toString(36).substring(2, 9);
        const { svg } = await mermaid.render(id, cleanChart);

        // Limpiar residuos en body tras el renderizado exitoso
        document.querySelectorAll('[id^="dmermaid"]').forEach((el) => el.remove());

        if (isMounted) {
          setSvgContent(svg);
          setLoading(false);
        }
      } catch (err: any) {
        console.warn('Fallo al renderizar Mermaid dinámicamente:', err);
        document.querySelectorAll('[id^="dmermaid"]').forEach((el) => el.remove());
        if (isMounted) {
          setRenderError(
            err?.message || 'No se pudo compilar el diagrama Mermaid. Puedes revisar el código fuente.'
          );
          setLoading(false);
        }
      }
    }

    void renderMermaid();

    return () => {
      isMounted = false;
      document.querySelectorAll('[id^="dmermaid"]').forEach((el) => el.remove());
    };
  }, [chart]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(chart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(2.5, Math.max(0.6, Number((prev + delta).toFixed(2)))));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const handleDownloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.svg`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-200 ${
        isFullScreen ? 'fixed inset-4 z-50 flex flex-col shadow-2xl' : 'mt-4'
      }`}
    >
      {/* Barra de herramientas superior */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <h4 className="text-xs font-bold text-slate-800 tracking-tight">{title}</h4>
          <span className="text-[10px] font-mono bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded">
            Mermaid Live
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Alternar Vista Gráfica vs Código */}
          <div className="flex items-center bg-slate-200/60 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setViewMode('visual')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all ${
                viewMode === 'visual'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Gráfico</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('code')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all ${
                viewMode === 'code'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>Código</span>
            </button>
          </div>

          {/* Controles de Zoom para vista visual */}
          {viewMode === 'visual' && !renderError && (
            <div className="flex items-center border border-slate-200 bg-white rounded-lg text-xs p-0.5">
              <button
                type="button"
                onClick={() => handleZoom(-0.15)}
                title="Alejar (Zoom Out)"
                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="Restablecer escala al 100%"
                className="px-1.5 text-[10px] font-mono font-semibold text-slate-600 hover:text-slate-900"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                onClick={() => handleZoom(0.15)}
                title="Acercar (Zoom In)"
                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Descargar SVG Vectorial */}
          {svgContent && viewMode === 'visual' && (
            <button
              type="button"
              onClick={handleDownloadSvg}
              title="Descargar diagrama en formato SVG vectorial"
              className="p-1.5 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold border border-slate-200 bg-white"
            >
              <Download className="w-3 h-3 text-slate-600" />
              <span className="hidden sm:inline">.svg</span>
            </button>
          )}

          {/* Copiar código fuente */}
          <button
            type="button"
            onClick={handleCopyCode}
            title="Copiar código fuente Mermaid"
            className="p-1.5 px-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold border border-slate-200 bg-white"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          {/* Pantalla Completa */}
          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? 'Salir de pantalla completa' : 'Ver a pantalla completa'}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white"
          >
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Área del Lienzo Interactivo */}
      <div
        ref={containerRef}
        className={`relative overflow-auto p-4 sm:p-6 bg-slate-50/50 flex items-center justify-center min-h-[300px] ${
          isFullScreen ? 'flex-1' : 'max-h-[520px]'
        }`}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 text-slate-400 py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-700" />
            <span className="text-xs font-medium">Renderizando arquitectura en vivo...</span>
          </div>
        ) : viewMode === 'code' ? (
          <div className="w-full h-full max-h-[460px] overflow-auto">
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono leading-relaxed overflow-x-auto">
              {chart}
            </pre>
          </div>
        ) : renderError ? (
          <div className="w-full max-w-lg bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-800 text-xs">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Aviso de compilación del diagrama</span>
            </div>
            <p className="text-[11px] text-rose-700 mb-3">{renderError}</p>
            <pre className="bg-white/80 p-2.5 rounded border border-rose-200 font-mono text-[10px] overflow-x-auto text-slate-800">
              {chart}
            </pre>
          </div>
        ) : (
          <div
            className="transition-transform duration-150 origin-center select-none flex items-center justify-center w-full"
            style={{ transform: `scale(${zoomLevel})` }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>

      {/* Pie con detalles del diagrama */}
      <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>{footerText}</span>
        <span className="font-mono text-[10px]">{formatBadge}</span>
      </div>
    </div>
  );
};
