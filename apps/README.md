# apps/

User-facing applications, each added as a **git submodule** (own repo, own release
cadence). Examples: Next.js web app, Expo mobile app, admin dashboard.

```bash
# Add a new app submodule:
pnpm submodule:add https://github.com/fractionaxapp/web.git apps/web
```

Every app submodule should include a `moon.yml` declaring its `language`, `stack`,
`tags`, and `dependsOn` (e.g. `ui`, `core`) so moon wires it into the task graph.
