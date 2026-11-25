// SCRUM-69: UI interactiva en React para revisar, editar y aprobar el modelo físico de BD y visualizar el diagrama ERD en SVG interactivo (Mermaid.js).
import React, { useState, useEffect, useMemo } from "react";
import { phaseService } from "../services/phaseService";
import { getApiErrorMessage } from "../lib/api";
import type { DbSpec, TableSpec, ColumnSpec } from "../types/phase";
import { MermaidDiagramViewer } from "./MermaidDiagramViewer";
import {
  Database,
  Plus,
  Sparkles,
  Loader2,
  Trash2,
  Download,
  Copy,
  Check,
  FileCode,
} from "lucide-react";

export const DEFAULT_CANONICAL_TABLES: TableSpec[] = [
  {
    name: "users",
    columns: [
      { name: "id", type: "BIGINT GENERATED ALWAYS AS IDENTITY", nullable: false, primaryKey: true },
      { name: "email", type: "VARCHAR(255)", nullable: false },
      { name: "password_hash", type: "VARCHAR(255)", nullable: false },
      { name: "role", type: "VARCHAR(32)", nullable: false },
      { name: "created_at", type: "TIMESTAMPTZ", nullable: false },
    ],
  },
  {
    name: "projects",
    columns: [
      { name: "id", type: "BIGINT GENERATED ALWAYS AS IDENTITY", nullable: false, primaryKey: true },
      { name: "name", type: "VARCHAR(255)", nullable: false },
      { name: "owner_id", type: "BIGINT", nullable: false, foreignKey: "users(id)" },
      { name: "status", type: "VARCHAR(32)", nullable: false },
      { name: "updated_at", type: "TIMESTAMPTZ", nullable: false },
    ],
  },
  {
    name: "phase_specifications",
    columns: [
      { name: "id", type: "UUID", nullable: false, primaryKey: true },
      { name: "project_id", type: "BIGINT", nullable: false, foreignKey: "projects(id)" },
      { name: "phase_type", type: "VARCHAR(32)", nullable: false },
      { name: "content", type: "TEXT", nullable: false },
      { name: "updated_at", type: "TIMESTAMPTZ", nullable: false },
    ],
  },
  {
    name: "chat_messages",
    columns: [
      { name: "id", type: "BIGINT GENERATED ALWAYS AS IDENTITY", nullable: false, primaryKey: true },
      { name: "project_id", type: "BIGINT", nullable: false, foreignKey: "projects(id)" },
      { name: "sender", type: "VARCHAR(16)", nullable: false },
      { name: "content", type: "TEXT", nullable: false },
      { name: "created_at", type: "TIMESTAMPTZ", nullable: false },
    ],
  },
  {
    name: "endpoint_specs",
    columns: [
      { name: "id", type: "BIGINT GENERATED ALWAYS AS IDENTITY", nullable: false, primaryKey: true },
      { name: "project_id", type: "BIGINT", nullable: false, foreignKey: "projects(id)" },
      { name: "http_method", type: "VARCHAR(16)", nullable: false },
      { name: "path", type: "VARCHAR(255)", nullable: false },
      { name: "status_codes", type: "VARCHAR(64)", nullable: false },
    ],
  },
];

/**
 * Convierte un listado de especificaciones de tabla en sintaxis estándar Mermaid ERD (notación Crow's Foot).
 */
export function generateMermaidErDiagram(tables: TableSpec[]): string {
  if (!tables || tables.length === 0) {
    return `erDiagram\n    EMPTY_SCHEMA {\n        string status\n    }`;
  }

  const lines: string[] = ["erDiagram"];
  const tableNames = new Set(tables.map((t) => t.name.trim().toLowerCase()));

  // 1. Relaciones de Claves Foráneas (1:N Crow's Foot: ||--o{)
  const relations = new Set<string>();

  tables.forEach((t) => {
    const child = t.name.trim().toLowerCase().replace(/[^a-zA-Z0-9_]/g, "_");
    t.columns.forEach((col) => {
      let target: string | null = null;
      if (col.foreignKey) {
        const cleanFk = col.foreignKey.split(/[(.]/)[0].trim().toLowerCase();
        if (tableNames.has(cleanFk)) {
          target = cleanFk;
        }
      } else if (col.name.endsWith("_id") && col.name !== "id") {
        const candidatePlural = col.name.replace(/_id$/, "s").toLowerCase();
        const candidateSingular = col.name.replace(/_id$/, "").toLowerCase();
        if (tableNames.has(candidatePlural)) {
          target = candidatePlural;
        } else if (tableNames.has(candidateSingular)) {
          target = candidateSingular;
        }
      }

      if (target && target !== child) {
        const parentSanitized = target.replace(/[^a-zA-Z0-9_]/g, "_");
        const colSanitized = col.name.trim().replace(/[^a-zA-Z0-9_]/g, "_");
        relations.add(`    ${parentSanitized} ||--o{ ${child} : ${colSanitized}`);
      }
    });
  });

  relations.forEach((rel) => lines.push(rel));
  if (relations.size > 0) {
    lines.push("");
  }

  // 2. Definición de Entidades con tipos y marcas PK / FK
  const sanitizeType = (rawType: string): string => {
    if (!rawType) return "string";
    const first = rawType.trim().split(/[\s(]/)[0].toLowerCase();
    const map: Record<string, string> = {
      bigint: "bigint",
      integer: "int",
      int: "int",
      smallint: "smallint",
      serial: "int",
      bigserial: "bigint",
      uuid: "uuid",
      varchar: "string",
      text: "text",
      boolean: "boolean",
      bool: "boolean",
      timestamp: "timestamptz",
      timestamptz: "timestamptz",
      date: "date",
      time: "time",
      numeric: "numeric",
      decimal: "decimal",
      json: "json",
      jsonb: "jsonb",
      bytea: "bytes",
    };
    return map[first] || first.replace(/[^a-zA-Z0-9_]/g, "") || "string";
  };

  tables.forEach((t) => {
    const tableName = t.name.trim().replace(/[^a-zA-Z0-9_]/g, "_");
    lines.push(`    ${tableName} {`);
    t.columns.forEach((c) => {
      const type = sanitizeType(c.type);
      const colName = c.name.trim().replace(/[^a-zA-Z0-9_]/g, "_");
      const isPk = !!c.primaryKey;
      const isFk = !!c.foreignKey || (c.name.endsWith("_id") && c.name !== "id");
      const tag = isPk ? "PK" : isFk ? "FK" : "";
      if (tag) {
        lines.push(`        ${type} ${colName} ${tag}`);
      } else {
        lines.push(`        ${type} ${colName}`);
      }
    });
    lines.push("    }");
  });

  return lines.join("\n");
}

function generateDdlScript(tables: TableSpec[]): string {
  if (!tables || tables.length === 0) return "-- No hay tablas definidas en el modelo.";
  return tables
    .map((t) => {
      const cols = t.columns
        .map((c) => {
          let line = `  ${c.name} ${c.type}`;
          if (c.primaryKey) line += " PRIMARY KEY";
          if (!c.nullable && !c.primaryKey) line += " NOT NULL";
          if (c.foreignKey) line += ` REFERENCES ${c.foreignKey}`;
          return line;
        })
        .join(",\n");
      return `CREATE TABLE IF NOT EXISTS ${t.name} (\n${cols}\n);`;
    })
    .join("\n\n");
}

export const DatabaseSpecEditor: React.FC<{ projectId: string; onCompleted?: () => void }> = ({
  projectId,
  onCompleted,
}) => {
  const [spec, setSpec] = useState<DbSpec>({ tables: [] });
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [copiedDdl, setCopiedDdl] = useState(false);

  const loadSpec = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await phaseService.getDbSpec(projectId);
      if (data && Array.isArray(data.tables) && data.tables.length > 0) {
        setSpec(data);
      } else {
        setSpec({ tables: DEFAULT_CANONICAL_TABLES });
      }
    } catch (e) {
      setError(getApiErrorMessage(e));
      setSpec({ tables: DEFAULT_CANONICAL_TABLES });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSpec();
  }, [projectId]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage("");
    try {
      const data = await phaseService.generateDbSpec(projectId, prompt.trim() || undefined);
      setSpec(data && Array.isArray(data.tables) ? data : { tables: [] });
      setSuccessMessage("¡Modelo físico de base de datos y diagrama ERD generados con éxito por ideator-db-agent!");
      if (onCompleted) onCompleted();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const addTable = () => {
    const newTable: TableSpec = {
      name: `nueva_tabla_${spec.tables.length + 1}`,
      columns: [
        { name: "id", type: "BIGINT GENERATED ALWAYS AS IDENTITY", nullable: false, primaryKey: true },
        { name: "created_at", type: "TIMESTAMPTZ", nullable: false },
      ],
    };
    setSpec((prev) => ({ ...prev, tables: [...prev.tables, newTable] }));
  };

  const removeTable = (tableIdx: number) => {
    setSpec((prev) => ({
      ...prev,
      tables: prev.tables.filter((_, idx) => idx !== tableIdx),
    }));
  };

  const addColumn = (tableIdx: number) => {
    const newCol: ColumnSpec = { name: "nueva_columna", type: "VARCHAR(255)", nullable: true };
    setSpec((prev) => {
      const tables = [...prev.tables];
      tables[tableIdx] = {
        ...tables[tableIdx],
        columns: [...tables[tableIdx].columns, newCol],
      };
      return { ...prev, tables };
    });
  };

  const removeColumn = (tableIdx: number, colIdx: number) => {
    setSpec((prev) => {
      const tables = [...prev.tables];
      tables[tableIdx] = {
        ...tables[tableIdx],
        columns: tables[tableIdx].columns.filter((_, idx) => idx !== colIdx),
      };
      return { ...prev, tables };
    });
  };

  const handleCopyDdl = async () => {
    const effectiveTables = spec.tables.length > 0 ? spec.tables : DEFAULT_CANONICAL_TABLES;
    const ddl = generateDdlScript(effectiveTables);
    try {
      await navigator.clipboard.writeText(ddl);
      setCopiedDdl(true);
      setTimeout(() => setCopiedDdl(false), 2000);
    } catch (err) {
      console.error("Error al copiar DDL:", err);
    }
  };

  const handleDownloadDdl = () => {
    const effectiveTables = spec.tables.length > 0 ? spec.tables : DEFAULT_CANONICAL_TABLES;
    const ddl = generateDdlScript(effectiveTables);
    const blob = new Blob([ddl], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `schema-db-${projectId}.sql`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const effectiveTables = spec.tables.length > 0 ? spec.tables : DEFAULT_CANONICAL_TABLES;
  const mermaidErChart = useMemo(() => generateMermaidErDiagram(effectiveTables), [effectiveTables]);
  const ddlScript = useMemo(() => generateDdlScript(effectiveTables), [effectiveTables]);

  return (
    <div className="space-y-6">
      {/* Controles de Fase B */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Fase B: Modelo Físico de Base de Datos</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Genera esquemas relacionales (tablas, columnas, tipos SQL, PKs/FKs) y diagrama ERD consumiendo ideator-db-agent.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={addTable}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir Tabla
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {loading ? "Generando modelo..." : "Disparar Agente DB"}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Instrucciones opcionales para el agente de Base de Datos
          </label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="ej. Asegúrate de incluir auditoría (created_at, updated_at) y relación uno-a-muchos con usuarios"
            className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          />
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
            {successMessage}
          </div>
        )}
      </div>

      {/* Editor visual de Tablas y Columnas */}
      {loading && spec.tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <p className="text-xs font-medium">El agente está estructurando el modelo de base de datos...</p>
        </div>
      ) : spec.tables.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
          <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600">Aún no se ha generado ningún modelo de datos.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Haz clic en &apos;Disparar Agente DB&apos; para sintetizar la Fase A en un esquema relacional.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {spec.tables.map((t, ti) => (
            <div key={ti} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tabla:</span>
                    <input
                      type="text"
                      value={t.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setSpec((prev) => {
                          const tables = [...prev.tables];
                          tables[ti] = { ...tables[ti], name: newName };
                          return { ...prev, tables };
                        });
                      }}
                      className="font-mono text-xs font-bold text-indigo-700 border-b border-dashed border-indigo-300 focus:outline-none focus:border-indigo-600 bg-transparent px-1"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => addColumn(ti)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Columna
                    </button>
                    <button
                      onClick={() => removeTable(ti)}
                      className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {t.columns.map((c, ci) => (
                    <div key={ci} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSpec((prev) => {
                              const tables = [...prev.tables];
                              const cols = [...tables[ti].columns];
                              cols[ci] = { ...cols[ci], name: val };
                              tables[ti] = { ...tables[ti], columns: cols };
                              return { ...prev, tables };
                            });
                          }}
                          className="font-mono text-slate-800 font-semibold bg-transparent w-28 focus:outline-none border-b border-transparent focus:border-indigo-400"
                        />
                        <input
                          type="text"
                          value={c.type}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSpec((prev) => {
                              const tables = [...prev.tables];
                              const cols = [...tables[ti].columns];
                              cols[ci] = { ...cols[ci], type: val };
                              tables[ti] = { ...tables[ti], columns: cols };
                              return { ...prev, tables };
                            });
                          }}
                          className="font-mono text-slate-500 text-[11px] bg-transparent w-24 focus:outline-none border-b border-transparent focus:border-indigo-400"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        {c.primaryKey && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                            PK
                          </span>
                        )}
                        {c.foreignKey && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold" title={c.foreignKey}>
                            FK
                          </span>
                        )}
                        <span className={`text-[10px] ${c.nullable ? "text-slate-400" : "text-slate-600 font-semibold"}`}>
                          {c.nullable ? "NULL" : "NOT NULL"}
                        </span>
                        <button
                          onClick={() => removeColumn(ti, ci)}
                          className="text-slate-300 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Diagrama Entidad-Relación Dinámico (Mermaid ERD Profesional) */}
      <MermaidDiagramViewer
        chart={mermaidErChart}
        title="Diagrama Entidad-Relación (ERD Profesional)"
        footerText="Modelo relacional generado por ideator-db-agent • Notación Crow's Foot"
        formatBadge="Mermaid ERD v10"
        filename={`modelo-erd-${projectId}`}
      />

      {/* Script DDL Generado (PostgreSQL) - Justo debajo del SVG */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Script DDL (PostgreSQL)</h3>
              <p className="text-[11px] text-slate-500">
                Sentencias SQL estructuradas para recrear el esquema relacional en PostgreSQL / Flyway.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDdl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors"
            >
              {copiedDdl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDdl ? "¡Copiado!" : "Copiar SQL"}</span>
            </button>
            <button
              onClick={handleDownloadDdl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Descargar .sql</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="w-full max-h-[360px] overflow-auto p-4 rounded-xl border border-slate-800 bg-[#04060d] text-emerald-400 text-xs font-mono leading-relaxed select-all">
            <code>{ddlScript}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
