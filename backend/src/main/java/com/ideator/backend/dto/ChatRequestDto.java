package com.ideator.backend.dto;

public class ChatRequestDto {
    private String content;

    public ChatRequestDto() {}

    public ChatRequestDto(String content) {
        this.content = content;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
