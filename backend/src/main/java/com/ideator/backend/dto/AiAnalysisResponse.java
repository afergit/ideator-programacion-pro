// SCRUM-29: DTO para la respuesta estructurada del motor Azure AI (JSON estricto).
package com.ideator.backend.dto;

import java.util.List;

/**
 * Representa la respuesta del modelo de IA que sigue el formato JSON especificado.
 *
 * <p>Campos:
 * <ul>
 *   <li>{@code analisisInterno}: razonamiento interno del modelo.</li>
 *   <li>{@code estado}: PREGUNTANDO | BLOQUEO | LISTO_FASE_B</li>
 *   <li>{@code respuestaAlUsuario}: mensaje que se mostrará al usuario.</li>
 *   <li>{@code preguntasBloqueantes}: lista de preguntas que el modelo necesita para desbloquear.</li>
 * </ul>
 */
public class AiAnalysisResponse {
    private String analisisInterno;
    private String estado;
    private String respuestaAlUsuario;
    private List<String> preguntasBloqueantes;

    // Getters y Setters
    public String getAnalisisInterno() { return analisisInterno; }
    public void setAnalisisInterno(String analisisInterno) { this.analisisInterno = analisisInterno; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getRespuestaAlUsuario() { return respuestaAlUsuario; }
    public void setRespuestaAlUsuario(String respuestaAlUsuario) { this.respuestaAlUsuario = respuestaAlUsuario; }
    public List<String> getPreguntasBloqueantes() { return preguntasBloqueantes; }
    public void setPreguntasBloqueantes(List<String> preguntasBloqueantes) { this.preguntasBloqueantes = preguntasBloqueantes; }
}
