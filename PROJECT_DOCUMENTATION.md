# InthraCyberTec Project Documentation

## **1. Project Overview**
InthraCyberTec is a modern, high-performance Admin Dashboard built using **Next.js 16** and **React 19**. It is designed to provide a secure and scalable interface for cyber threat intelligence, monitoring, and administrative tasks. The project emphasizes modularity, accessibility, and a seamless user experience.

### **Core Technologies**
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) with [Keycloak](https://www.keycloak.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Charts**: [ApexCharts](https://apexcharts.com/)
- **Icons**: Custom SVG-based icon system
- **Internationalization**: [i18next](https://www.i18next.com/)
- **Data Visualization**: `react-force-graph-2d` for complex threat relationship mapping

---

## **2. Architecture**
The project follows a modular architecture using the Next.js **App Router** pattern. This approach leverages Server Components for performance and Client Components for interactivity.

### **Directory Structure**
- `src/app`: Contains routes, layouts, and page-specific logic.
  - `(admin)`: Protected routes for the dashboard.
  - `(full-width-pages)`: Authentication and other full-width views.
- `src/components`: Highly reusable UI components (Buttons, Inputs, Modals, etc.).
- `src/context`: Global state management using React Context API.
- `src/services`: Business logic and backend API communication layers.
- `src/hooks`: Custom hooks for shared logic (e.g., API clients, UI helpers).
- `src/layout`: Main structural components like Sidebar and Header.
- `src/i18n`: Configuration and translation files for multi-language support.

---

## **3. Authentication & Security**
The project implements a robust authentication system using **NextAuth.js** integrated with **Keycloak** (OIDC).

### **Key Features**
- **Single Sign-On (SSO)**: Powered by Keycloak.
- **Refresh Token Rotation**: Automatically handles token expiration in the background to ensure a continuous session without re-login.
- **Role-Based Access Control (RBAC)**: 
  - Roles are fetched from the Keycloak realm access.
  - Components like `RoleGate.tsx` are used to restrict UI elements based on user roles.
- **Session Protection**: Middleware and Layout-level guards ensure only authenticated users can access dashboard routes.
- **Automatic Logout**: Handles centralized logout by redirecting users to the Keycloak logout endpoint.

---

## **4. Global State Management**
State is managed efficiently using multiple React Contexts to avoid unnecessary re-renders:
- [AuthContext.tsx](file:///c:/Users/sheik/Freelancing Project/InthraCyberTec/src/context/AuthContext.tsx): Manages user profile, tokens, and authentication actions (login, logout, register).
- [SidebarContext.tsx](file:///c:/Users/sheik/Freelancing Project/InthraCyberTec/src/context/SidebarContext.tsx): Controls the expanded/collapsed and mobile state of the navigation menu.
- [ThemeContext.tsx](file:///c:/Users/sheik/Freelancing Project/InthraCyberTec/src/context/ThemeContext.tsx): Manages Light/Dark mode preferences.
- [LanguageContext.tsx](file:///c:/Users/sheik/Freelancing Project/InthraCyberTec/src/context/LanguageContext.tsx): Handles internationalization state.

---

## **5. Data Fetching & API Communication**
All backend interactions are centralized through the [useApiClient.ts](file:///c:/Users/sheik/Freelancing Project/InthraCyberTec/src/hooks/useApiClient.ts) hook.

### **Features of the API Client**
- **Authorization Header**: Automatically injects the Bearer token into all requests.
- **Token Freshness Check**: Verifies if the token is about to expire before making a call; if so, it attempts to refresh the session.
- **Error Handling**: Standardized error management using SweetAlert2 to display backend or network errors gracefully.
- **Session Expiration Handling**: Detects 401 Unauthorized errors and prompts the user to renew their session.

---

## **6. Internationalization (i18n)**
The application supports multiple languages (English, Spanish, French) using `i18next`.
- Translations are stored in `src/i18n/*.json`.
- The `T.tsx` component provides a convenient way to translate strings throughout the UI.

---

## **7. Build and Deployment**
The project is configured for efficient production deployment.

### **Next.js Standalone Build**
- Configured in `next.config.ts` with `output: "standalone"`.
- This creates a minimal production folder containing only the necessary files to run the server, significantly reducing the deployment package size.

### **Packaging Script**
The custom [package-build.js](file:///c:/Users/sheik/Freelancing Project/InthraCyberTec/package-build.js) script automates the final packaging:
1. Runs `npm run package`.
2. Copies the standalone build to a `dist` folder.
3. Consolidates static assets and public files into the distribution package.
4. Prepares the project for easy zipping or Docker containerization.

---

## **8. Configuration**
Configuration is handled via environment variables. Key variables include:
- `NEXT_PUBLIC_QUERY_API_URL`: The backend API endpoint.
- `KEYCLOAK_ISSUER`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`: Keycloak connection details.
- `NEXTAUTH_SECRET`: Secret for signing session cookies.
- `NEXTAUTH_URL`: The canonical URL of the application.

---

## **9. UI & Layout**
The dashboard features a responsive, mobile-first design:
- **Responsive Sidebar**: Automatically adapts to screen size, supporting both persistent and overlay modes.
- **Dynamic Headers**: Includes notification systems and user profile management.
- **Rich Component Library**: Pre-built tables, forms, modals, and charts for rapid development.
