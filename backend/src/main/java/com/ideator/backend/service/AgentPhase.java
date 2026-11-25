package com.ideator.backend.service;

/**
 * Representa las 8 fases del ciclo de especificación del proyecto
 * y sus correspondientes agentes especializados en Microsoft Azure AI Foundry:
 * A: CONTEXT (ideator-context-agent)
 * B: DB (ideator-db-agent)
 * C: API (ideator-api-agent)
 * D: UI (ideator-ui-agent)
 * E: SECURITY (ideator-sec-agent)
 * F: QA (ideator-qa-agent)
 * G: ARCHITECTURE (ideator-arch-agent)
 * H: FINOPS (ideator-finops-agent)
 */
public enum AgentPhase {
    CONTEXT,
    DB,
    API,
    UI,
    SECURITY,
    QA,
    ARCHITECTURE,
    FINOPS
}
