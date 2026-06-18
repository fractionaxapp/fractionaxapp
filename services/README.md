# services/

Backend services and APIs, each added as a **git submodule**. Polyglot by design —
a service may be a Node/TS API, a Python FastAPI server, a Go gateway, etc.

```bash
pnpm submodule:add https://github.com/fractionaxapp/api.git services/api
```

Each service submodule declares its toolchain via its own `moon.yml`
(`language: typescript` or `language: python`, …). moon picks the right inherited
task set automatically.
