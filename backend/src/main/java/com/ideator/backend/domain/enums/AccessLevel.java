package com.ideator.backend.domain.enums;

public enum AccessLevel {
    OWNER,
    EDITOR,
    VIEWER;

    public boolean canEdit() {
        return this == OWNER || this == EDITOR;
    }
}
