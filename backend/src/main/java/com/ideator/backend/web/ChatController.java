// SCRUM-30: Controlador que expone el endpoint de chat y gestiona la lógica de interrupción.
package com.ideator.backend.web;

import com.ideator.backend.dto.AiAnalysisResponse;
import com.ideator.backend.dto.ChatRequestDto;
import com.ideator.backend.service.AzureAiChatService;
import com.ideator.backend.service.ProjectService;
import com.ideator.backend.repository.ChatMessageRepository;
import com.ideator.backend.model.ChatMessage;
import com.ideator.backend.model.ChatMessage.Sender;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/projects/{projectId}/chat")
public class ChatController {

    private final AzureAiChatService chatService;
    private final ProjectService projectService;
    private final ChatMessageRepository chatMessageRepository;

    private Long parseProjectId(String projectId) {
        try {
            return Long.parseLong(projectId);
        } catch (NumberFormatException e) {
            return (long) Math.abs(projectId.hashCode());
        }
    }

    @GetMapping
    public ResponseEntity<java.util.List<ChatMessage>> getChatHistory(@PathVariable String projectId) {
        Long numericId = parseProjectId(projectId);
        java.util.List<ChatMessage> history = chatMessageRepository.findByProjectIdOrderByCreatedAtAsc(numericId);
        return ResponseEntity.ok(history);
    }

    @PostMapping
    public ResponseEntity<AiAnalysisResponse> chat(
            @PathVariable String projectId,
            @RequestBody ChatRequestDto request) {

        Long numericId = parseProjectId(projectId);

        // Guardar mensaje del usuario
        ChatMessage userMsg = new ChatMessage();
        userMsg.setProjectId(numericId);
        userMsg.setSender(Sender.USER);
        userMsg.setContent(request.getContent());
        userMsg.setStatus("ENVIADO");
        chatMessageRepository.save(userMsg);

        AiAnalysisResponse response = chatService.chat(request.getContent());

        // Guardar respuesta de IA
        ChatMessage aiMsg = new ChatMessage();
        aiMsg.setProjectId(numericId);
        aiMsg.setSender(Sender.AI);
        aiMsg.setContent(response.getRespuestaAlUsuario());
        aiMsg.setStatus(response.getEstado());
        chatMessageRepository.save(aiMsg);

        // Si el modelo indica bloqueo, actualizar estado del proyecto
        if ("BLOQUEO".equalsIgnoreCase(response.getEstado())) {
            try {
                UUID uuid = UUID.fromString(projectId);
                projectService.updateProjectStatus(uuid, "PAUSED_PENDING_INFO");
            } catch (Exception ignored) {
                projectService.updateProjectStatus(numericId, "PAUSED_PENDING_INFO");
            }
        }

        return ResponseEntity.ok(response);
    }

    public ResponseEntity<AiAnalysisResponse> chat(Long projectId, ChatRequestDto request) {
        return chat(String.valueOf(projectId), request);
    }
}
