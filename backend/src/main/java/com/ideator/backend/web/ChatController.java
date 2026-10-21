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

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/projects/{projectId}/chat")
public class ChatController {

    private final AzureAiChatService chatService;
    private final ProjectService projectService;
    private final ChatMessageRepository chatMessageRepository;

    @PostMapping
    public ResponseEntity<AiAnalysisResponse> chat(
            @PathVariable Long projectId,
            @RequestBody ChatRequestDto request) {

        // Guardar mensaje del usuario
        ChatMessage userMsg = new ChatMessage();
        userMsg.setProjectId(projectId);
        userMsg.setSender(Sender.USER);
        userMsg.setContent(request.getContent());
        userMsg.setStatus("ENVIADO");
        chatMessageRepository.save(userMsg);

        AiAnalysisResponse response = chatService.chat(request.getContent());

        // Guardar respuesta de IA
        ChatMessage aiMsg = new ChatMessage();
        aiMsg.setProjectId(projectId);
        aiMsg.setSender(Sender.AI);
        aiMsg.setContent(response.getRespuestaAlUsuario());
        aiMsg.setStatus(response.getEstado());
        chatMessageRepository.save(aiMsg);

        // Si el modelo indica bloqueo, actualizar estado del proyecto
        if ("BLOQUEO".equalsIgnoreCase(response.getEstado())) {
            projectService.updateProjectStatus(projectId, "PAUSED_PENDING_INFO");
        }

        return ResponseEntity.ok(response);
    }
}
