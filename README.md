
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
.
├── README.md
├── angular.json
├── package.json
├── pnpm-lock.yaml
├── public
│   └── favicon.ico
├── src
│   ├── app
│   │   ├── app.config.ts
│   │   ├── app.html
│   │   ├── app.routes.ts
│   │   ├── app.scss
│   │   ├── app.ts
│   │   ├── core
│   │   │   ├── auth-ui.service.ts
│   │   │   ├── auth.interceptor.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── guards
│   │   │   │   ├── admin.guard.ts
│   │   │   │   └── auth.guard.ts
│   │   │   ├── services
│   │   │   │   ├── contents.service.ts
│   │   │   │   ├── episodes.service.ts
│   │   │   │   ├── payments.service.ts
│   │   │   │   ├── plans.service.ts
│   │   │   │   ├── playbacks.service.ts
│   │   │   │   ├── profiles.service.ts
│   │   │   │   ├── subscriptions.service.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   └── watchlist.service.ts
│   │   │   └── ui-state.service.ts
│   │   ├── enviroments
│   │   │   └── enviroment.ts
│   │   ├── features
│   │   │   ├── dashboard
│   │   │   │   ├── admin
│   │   │   │   │   ├── admin-shell.html
│   │   │   │   │   ├── admin-shell.ts
│   │   │   │   │   ├── contents-tab
│   │   │   │   │   │   ├── content-tab.html
│   │   │   │   │   │   └── content-tab.ts
│   │   │   │   │   ├── episodes-tab
│   │   │   │   │   │   ├── episodes-tab.html
│   │   │   │   │   │   └── episodes-tab.ts
│   │   │   │   │   ├── payments-tab
│   │   │   │   │   │   ├── payments-tab.html
│   │   │   │   │   │   └── payments-tab.ts
│   │   │   │   │   ├── plans-tab
│   │   │   │   │   │   ├── plans-tab.html
│   │   │   │   │   │   └── plans-tab.ts
│   │   │   │   │   ├── playbacks-tab
│   │   │   │   │   │   ├── playbacks-tab.html
│   │   │   │   │   │   └── playbacks-tab.ts
│   │   │   │   │   ├── profiles-tab
│   │   │   │   │   │   ├── profiles-tab.html
│   │   │   │   │   │   └── profiles-tab.ts
│   │   │   │   │   ├── subscriptions-tab
│   │   │   │   │   │   ├── subscriptions-tab.html
│   │   │   │   │   │   └── subscriptions-tab.ts
│   │   │   │   │   ├── users-tab
│   │   │   │   │   │   ├── users-tab.html
│   │   │   │   │   │   └── users-tab.ts
│   │   │   │   │   └── watchlists-tab
│   │   │   │   │       ├── watchlists-tab.html
│   │   │   │   │       └── watchlists-tab.ts
│   │   │   │   └── user
│   │   │   │       ├── payments-tab
│   │   │   │       │   ├── payments-tab.html
│   │   │   │       │   └── payments-tab.ts
│   │   │   │       ├── playbacks-tab
│   │   │   │       │   ├── playbacks-tab.html
│   │   │   │       │   └── playbacks-tab.ts
│   │   │   │       ├── profiles-tab
│   │   │   │       │   ├── profile-tab.ts
│   │   │   │       │   └── profiles-tab.html
│   │   │   │       ├── user-shell.html
│   │   │   │       └── user-shell.ts
│   │   │   ├── home
│   │   │   │   ├── home.html
│   │   │   │   └── home.ts
│   │   │   ├── login
│   │   │   │   ├── login.html
│   │   │   │   └── login.ts
│   │   │   ├── register
│   │   │   │   ├── register.html
│   │   │   │   └── register.ts
│   │   │   ├── search
│   │   │   │   ├── search-page.html
│   │   │   │   └── search-page.ts
│   │   │   ├── subscription
│   │   │   │   ├── subscriptions-tab.html
│   │   │   │   └── subscriptions-tab.ts
│   │   │   ├── watch
│   │   │   │   ├── watch.html
│   │   │   │   └── watch.ts
│   │   │   └── watchlist
│   │   │       ├── watchlist.html
│   │   │       └── watchlist.ts
│   │   ├── models
│   │   │   ├── content.model.ts
│   │   │   ├── episode.model.ts
│   │   │   ├── payment.model.ts
│   │   │   ├── plan.model.ts
│   │   │   ├── playback.model.ts
│   │   │   ├── profile.model.ts
│   │   │   ├── subscription.model.ts
│   │   │   ├── user.model.ts
│   │   │   └── watchlist.model.ts
│   │   └── shared
│   │       └── components
│   │           ├── header
│   │           │   ├── header.html
│   │           │   ├── header.scss
│   │           │   └── header.ts
│   │           ├── sidebar
│   │           │   ├── sidebar.html
│   │           │   └── sidebar.ts
│   │           ├── video-card
│   │           │   ├── video-card.html
│   │           │   └── video-card.ts
│   │           ├── video-grid
│   │           │   ├── video-grid.html
│   │           │   └── video-grid.ts
│   │           └── video-player
│   │               └── video-player.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── tsconfig.app.json
├── tsconfig.json
└── tsconfig.spec.json
```

---

## 📚 Additional Resources

For detailed Angular CLI documentation, visit:  
👉 [Angular CLI Overview & Command Reference](https://angular.dev/tools/cli)

---

## 📝 Commit Name Suggestion

**Commit name:** `docs: improve README with detailed structure and setup instructions`