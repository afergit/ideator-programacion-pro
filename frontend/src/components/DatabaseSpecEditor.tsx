// SCRUM-69: UI interactiva en React para revisar, editar y aprobar el modelo físico de BD generado por la IA.
import React, { useState, useEffect } from "react";
import axios from "axios";

interface ColumnSpec {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey?: boolean;
  foreignKey?: string; // "table.column"
}

interface TableSpec {
  name: string;
  columns: ColumnSpec[];
}

interface DbSpec {
  tables: TableSpec[];
}

export const DatabaseSpecEditor: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [spec, setSpec] = useState<DbSpec>({ tables: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load spec from backend (assume endpoint exists)
  useEffect(() => {
    setLoading(true);
    axios
      .get(`/api/v1/projects/${projectId}/db-spec`)
      .then((res) => setSpec(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  const addTable = () => {
    const newTable: TableSpec = { name: "NewTable", columns: [] };
    setSpec((prev) => ({ ...prev, tables: [...prev.tables, newTable] }));
  };

  const addColumn = (tableIdx: number) => {
    const newCol: ColumnSpec = { name: "new_column", type: "VARCHAR", nullable: true };
    setSpec((prev) => {
      const tables = [...prev.tables];
      tables[tableIdx] = {
        ...tables[tableIdx],
        columns: [...tables[tableIdx].columns, newCol],
      };
      return { ...prev, tables };
    });
  };

  const saveSpec = () => {
    setLoading(true);
    axios
      .post(`/api/v1/projects/${projectId}/db-spec`, spec)
      .then(() => alert("Esquema guardado"))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  if (loading) return <div className="p-4">Cargando...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Editor del Modelo de Base de Datos</h2>
      <button onClick={addTable} className="bg-blue-500 text-white px-3 py-1 rounded mb-4">
        Añadir Tabla
      </button>
      {spec.tables.map((t, ti) => (
        <div key={ti} className="border rounded p-3 mb-3">
          <div className="flex items-center mb-2">
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
              className="border p-1 mr-2"
            />
            <button onClick={() => addColumn(ti)} className="bg-green-500 text-white px-2 py-1 rounded">
              Añadir Columna
            </button>
          </div>
          {t.columns.map((c, ci) => (
            <div key={ci} className="flex space-x-2 mb-1">
              <input
                type="text"
                placeholder="Nombre"
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
                className="border p-1 w-32"
              />
              <input
                type="text"
                placeholder="Tipo"
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
                className="border p-1 w-32"
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={c.nullable}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setSpec((prev) => {
                      const tables = [...prev.tables];
                      const cols = [...tables[ti].columns];
                      cols[ci] = { ...cols[ci], nullable: val };
                      tables[ti] = { ...tables[ti], columns: cols };
                      return { ...prev, tables };
                    });
                  }}
                />
                Nullable
              </label>
            </div>
          ))}
        </div>
      ))}
      <button onClick={saveSpec} className="bg-indigo-600 text-white px-4 py-2 rounded mt-4">
        Guardar Spec
      </button>
    </div>
  );
};
