# Project Overview: 3D Model Collaboration Website

## Purpose
A web platform for 3D modeling professionals to collaborate with clients, showcase models, and manage model files securely. Utilizes Google's Model Viewer for interactive 3D display.

---

## Site Features

### 1. User Roles
- **Admin**
  - Add/delete 3D model files (GLB format or OBJ)
  - Manage user accounts(password protected with different passwords for different clients, no user auth or account creation)
  - Access all models and client activity
- **Client**
  - View most recent model by default
  - Select and view other available models
  - Limited to viewing and commenting(I'll add commenting down the road, but just want to get the viewer up and running first)
  - Considerations: Simple onboarding, password management via environment variables for security.yes

### 2. 3D Model Viewer
- Uses [Three.js](https://threejs.org/) for advanced 3D rendering and control
- Default view: Most recent model
- Model selection: Dropdown
- Advanced display options: True wireframe, material editing, texture overlays
- Professional lighting controls (directional, ambient, point lights)
- Screenshot/export functionality with custom resolutions
- Measurement tools and annotation placement
- Cross-section views and clipping planes
- No zoom limits (to accommodate small models)
- Suggestions: Add real-time collaboration features for client feedback. Later

### 3. File Management
- Models stored locally during development
- Production: Use blob storage (e.g., AWS S3, Azure Blob, Google Cloud Storage)
- Only admin can upload/delete models
- Considerations: Versioning for models, audit logs for file changes. I'll include versioning in file name

### 4. Authentication & Security
- Passwords stored in environment variables (for development)
- Production: Use secure authentication (OAuth, JWT, etc.)
- Suggestions: Two-factor authentication for admin, password reset flows for clients.

### 5. Hosting & Deployment
- Development: Localhost
- Production: Vercel (static hosting, serverless functions)
- Considerations: CDN for fast model delivery, HTTPS for security.

### 6. UI/UX
- Sleek, modern design (dark/light mode toggle)
- Responsive layout for desktop only
- Suggestions: Use a UI library (e.g., Material UI, Tailwind CSS) for rapid development. sure

### 7. Collaboration Tools
- Commenting/annotation on models
- Activity feed for model updates
- Suggestions: Real-time notifications, chat integration for future versions. maybe future

---

## Considerations & Suggestions
- **Scalability:** Plan for multiple clients and large model files. my files are small
- **Performance:** Optimize model loading and rendering.
- **Accessibility:** Ensure keyboard navigation and screen reader support.
- **Legal:** Terms of service, privacy policy, and data protection compliance.

---

## Next Steps
- Review and edit this document as needed.
- Begin scaffolding the project structure and UI components.
- Integrate Google Model Viewer and basic authentication.
