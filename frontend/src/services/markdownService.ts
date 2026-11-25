import { api } from '../lib/api';

export const markdownService = {
  /**
   * Descarga el archivo Especificacion_Producto.md como Blob y lo dispara directamente en el navegador.
   */
  async downloadProductSpec(projectId: string): Promise<Blob> {
    const response = await api.get(`/v1/projects/${projectId}/markdown/product`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'text/markdown;charset=utf-8' });
    this.triggerDownload(blob, 'Especificacion_Producto.md');
    return blob;
  },

  /**
   * Descarga el archivo Arquitectura_Definitiva.md como Blob y lo dispara directamente en el navegador.
   */
  async downloadArchitectureSpec(projectId: string): Promise<Blob> {
    const response = await api.get(`/v1/projects/${projectId}/markdown/architecture`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'text/markdown;charset=utf-8' });
    this.triggerDownload(blob, 'Arquitectura_Definitiva.md');
    return blob;
  },

  /**
   * Obtiene el contenido textual del markdown de especificación de producto para previsualización.
   */
  async getProductSpecPreview(projectId: string): Promise<string> {
    const response = await api.get<string>(`/v1/projects/${projectId}/markdown/product`, {
      responseType: 'text',
    });
    return response.data;
  },

  /**
   * Obtiene el contenido textual del markdown de arquitectura definitiva para previsualización.
   */
  async getArchitectureSpecPreview(projectId: string): Promise<string> {
    const response = await api.get<string>(`/v1/projects/${projectId}/markdown/architecture`, {
      responseType: 'text',
    });
    return response.data;
  },

  /**
   * Crea un enlace de descarga en el DOM para guardar el Blob en el navegador.
   */
  triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
