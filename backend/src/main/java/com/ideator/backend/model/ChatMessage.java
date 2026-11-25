package com.ideator.backend.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * SCRUM-31: Representa un mensaje intercambiado entre el usuario y la IA dentro de un proyecto.
 */
@Entity
@Table(name = "chat_message")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private Long projectId;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Sender sender;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public ChatMessage() {
    }

    public ChatMessage(Long projectId, Sender sender, String content, String status) {
        this.projectId = projectId;
        this.sender = sender;
        this.content = content;
        this.status = status;
        this.createdAt = Instant.now();
    }

    // Getters y Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public Sender getSender() { return sender; }
    public void setSender(Sender sender) { this.sender = sender; }
    public void setSender(String sender) {
        if (sender != null) {
            try {
                this.sender = Sender.valueOf(sender.trim().toUpperCase());
            } catch (Exception e) {
                this.sender = Sender.USER;
            }
        }
    }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public enum Sender {
        USER,
        AI
    }
}
