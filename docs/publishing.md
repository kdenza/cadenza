# Publicar y consumir los paquetes de Cadenza

`@kdenza/tokens` y `@kdenza/components` se publican a **GitHub Packages**
(el registry de npm de GitHub), bajo el scope `@cadenza`, ligado a la
organización `cadenza` en GitHub. `@kdenza/site` y `@kdenza/gallery` son
privados — nunca se publican, solo existen dentro de este monorepo.

## Publicar una nueva versión (desde este repo)

Requiere un [Personal Access Token](https://github.com/settings/tokens) con
scope `write:packages` (y `read:packages`, ya que instalar también requiere
lectura). **El token nunca se pega en el chat con Claude ni se comitea** —
solo vive como variable de entorno en tu propia terminal.

```bash
export NODE_AUTH_TOKEN=<tu-token>

# 1. Subir versión (elige uno, sigue semver)
npm version patch -w @kdenza/tokens      # 0.1.0 -> 0.1.1
npm version minor -w @kdenza/tokens      # 0.1.0 -> 0.2.0
npm version major -w @kdenza/tokens      # 0.1.0 -> 1.0.0

# 2. Publicar (prepublishOnly ya corre el build/analyze automáticamente)
npm publish -w @kdenza/tokens
npm publish -w @kdenza/components
```

Si `@kdenza/components` depende de una versión nueva de `@kdenza/tokens`,
actualiza esa referencia en `packages/components/package.json` antes de
publicar components (ej. `"@kdenza/tokens": "^0.2.0"`).

## Consumir desde otro proyecto

En el **proyecto que lo va a usar** (no en este repo):

1. Crear un `.npmrc` en la raíz de ese proyecto:
   ```
   @cadenza:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
   ```
2. Generar un Personal Access Token con scope `read:packages` (basta con
   lectura, no hace falta `write:packages` para instalar) y exportarlo como
   `NODE_AUTH_TOKEN` en esa terminal.
3. Instalar normalmente:
   ```bash
   npm install @kdenza/components
   ```
   Esto trae `@kdenza/tokens` automáticamente como dependencia transitiva.
4. Importar y usar:
   ```js
   import '@kdenza/components';
   import '@kdenza/components/dist/styles/tokens.css';
   ```
   ```html
   <cdz-button>Enviar</cdz-button>
   ```

En Angular específicamente, agregar `CUSTOM_ELEMENTS_SCHEMA` al módulo/
componente donde se use cualquier `cdz-*`, ya que Angular no reconoce
elementos custom por defecto.

## Por qué GitHub Packages y no el registry público de npm

Mantiene todo bajo el mismo control de acceso que el repo — mientras el
repo/organización sea privado, los paquetes publicados también lo son, sin
pagar por un registry privado aparte. Ver
[docs/decisions/0006-npm-github-packages.md](decisions/0006-npm-github-packages.md)
para el resto del razonamiento (por qué se dejó pnpm, por qué este scope).
