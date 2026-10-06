# 🚀 Ideator - Frontend (AI Specification Engine)

Frontend oficial para **Ideator**, la herramienta asistida por IA para convertir ideas de software en especificaciones técnicas rigurosas (Producto y Arquitectura en Markdown).

---

## 🛠️ Stack Tecnológico
* **Framework:** React 18 + TypeScript + Vite
* **Estilos:** Tailwind CSS
* **Enrutamiento:** React Router DOM (v6)
* **Iconos:** Lucide React
* **Autenticación:** Context API + JWT en localStorage + Soporte Google SSO

---

## 📋 Trazabilidad en Jira
* **Sprint 1 (S1: Seguridad y Multiusuario)**
* **Ticket:** `SCRUM-26` (*Crear interfaz de Login en el frontend y proteger rutas privadas*)

---

## 🚀 Instalación y Puesta en Marcha

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Ejecutar en entorno de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación se abrirá en `http://localhost:3000`.

3. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

## 🌿 Flujo Git hacia GitHub (`https://github.com/afergit/ideator-frontend.git`)

```bash
# Inicializar y conectar con el repositorio
git init
git remote add origin https://github.com/afergit/ideator-frontend.git

# Crear rama del ticket SCRUM-26
git checkout -b feature/SCRUM-26-login-y-rutas-privadas

# Guardar cambios trazables
git add .
git commit -m "SCRUM-26: Implementar interfaz de Login, AuthContext y proteccion de rutas privadas"

# Subir rama y crear Pull Request
git push -u origin feature/SCRUM-26-login-y-rutas-privadas
```
