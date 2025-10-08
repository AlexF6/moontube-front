# Moontube

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

```plaintext
moontube-front/
├─ .angular/                 # caché del builder, se ignora en git
├─ node_modules/             # dependencias (no subir a git)
├─ public/                   # recursos estáticos (favicon, robots.txt, imágenes)
│   └─ favicon.ico
│
├─ src/
│   ├─ app/
│   │   ├─ core/             # servicios globales (auth, http-interceptors, guards)
│   │   │   └─ auth.service.ts
│   │   ├─ shared/           # componentes, pipes y directivas reutilizables
│   │   │   ├─ components/
│   │   │   │   └─ button/
│   │   │   │       ├─ button.component.ts
│   │   │   │       ├─ button.component.html
│   │   │   │       └─ button.component.scss
│   │   │   └─ pipes/
│   │   ├─ features/         # módulos/páginas grandes (home, dashboard, etc.)
│   │   │   └─ home/
│   │   │       ├─ home.component.ts
│   │   │       ├─ home.component.html
│   │   │       └─ home.component.scss
│   │   ├─ app.config.ts     # providers globales (router, http, etc.)
│   │   ├─ app.routes.ts     # definición de rutas
│   │   ├─ app.ts            # AppComponent principal
│   │   ├─ app.html          # plantilla de AppComponent
│   │   └─ app.scss          # estilos del AppComponent
│   │
│   ├─ assets/               # imágenes, fuentes, data json
│   │   └─ logo.svg
│   │
│   ├─ index.html            # documento raíz
│   ├─ main.ts               # bootstrapApplication(AppComponent)
│   └─ styles.scss           # estilos globales (reset, variables, tailwind si aplica)
│
├─ .editorconfig             # opcional para estilo de código
├─ .gitignore
├─ angular.json
├─ package.json
├─ tsconfig.json
├─ tsconfig.app.json
├─ tsconfig.spec.json        # si usas tests
├─ pnpm-lock.yaml            # o package-lock.json, según tu gestor
└─ README.md
```