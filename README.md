
# 🌙 Moontube

Moontube is an Angular-based front-end application designed for scalability, modularity, and maintainability.  
It was generated using [Angular CLI](https://github.com/angular/angular-cli) version **20.1.5**.

---

## 🚀 Development Server

Start the local development server with:

```bash
ng serve
```

Then open your browser and go to **[http://localhost:4200/](http://localhost:4200/)**.  
The app will automatically reload whenever you modify any source file.

---

## 🧩 Code Scaffolding

Angular CLI provides a powerful set of tools for generating new files.  
To create a new component, use:

```bash
ng generate component component-name
```

To explore all available schematics (components, directives, pipes, etc.), run:

```bash
ng generate --help
```

---

## 🏗️ Building the Project

To build the app for production:

```bash
ng build
```

The compiled artifacts will be placed in the **dist/** directory.  
Production builds are automatically optimized for speed and performance.

---

## 🧪 Running Unit Tests

Run your unit tests using [Karma](https://karma-runner.github.io):

```bash
ng test
```

---

## 🌐 Running End-to-End Tests

To execute end-to-end (E2E) tests, use:

```bash
ng e2e
```

> Note: Angular CLI does not include an E2E testing framework by default.  
> You can integrate tools like **Cypress** or **Playwright**.

---

## 📁 Project Structure

```plaintext
moontube-front/
├─ .angular/                 # Angular builder cache (ignored by Git)
├─ node_modules/             # Dependencies (do not commit)
├─ public/                   # Static assets (favicon, robots.txt, images)
│   └─ favicon.ico
│
├─ src/
│   ├─ app/
│   │   ├─ core/             # Global services (auth, http-interceptors, guards)
│   │   │   └─ auth.service.ts
│   │   ├─ shared/           # Reusable components, pipes, directives
│   │   │   ├─ components/
│   │   │   │   └─ button/
│   │   │   │       ├─ button.component.ts
│   │   │   │       ├─ button.component.html
│   │   │   │       └─ button.component.scss
│   │   │   └─ pipes/
│   │   ├─ features/         # Large modules/pages (home, dashboard, etc.)
│   │   │   └─ home/
│   │   │       ├─ home.component.ts
│   │   │       ├─ home.component.html
│   │   │       └─ home.component.scss
│   │   ├─ app.config.ts     # Global providers (router, http, etc.)
│   │   ├─ app.routes.ts     # Route definitions
│   │   ├─ app.ts            # Root AppComponent
│   │   ├─ app.html          # AppComponent template
│   │   └─ app.scss          # AppComponent styles
│   │
│   ├─ assets/               # Static assets (images, fonts, data)
│   │   └─ logo.svg
│   │
│   ├─ index.html            # Main HTML entry point
│   ├─ main.ts               # Application bootstrap (AppComponent)
│   └─ styles.scss           # Global styles (resets, variables, Tailwind)
│
├─ .editorconfig             # Optional code style configuration
├─ .gitignore
├─ angular.json
├─ package.json
├─ tsconfig.json
├─ tsconfig.app.json
├─ tsconfig.spec.json        # Test TypeScript configuration
├─ pnpm-lock.yaml            # or package-lock.json (depending on your package manager)
└─ README.md
```

---

## 📚 Additional Resources

For detailed Angular CLI documentation, visit:  
👉 [Angular CLI Overview & Command Reference](https://angular.dev/tools/cli)

---

## 📝 Commit Name Suggestion

**Commit name:** `docs: improve README with detailed structure and setup instructions`