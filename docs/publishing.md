# Publicar y consumir los paquetes de Cadenza

`@kdenza/tokens` y `@kdenza/components` se publican al **registry público
de npm** (npmjs.com), bajo el scope `@kdenza`. `@kdenza/site` y
`@kdenza/gallery` son privados — nunca se publican, solo existen dentro de
este monorepo.

La razón de que sea el registry público y no GitHub Packages está al final
de este archivo, y en la enmienda de
[ADR-0006](decisions/0006-npm-github-packages.md).

## Antes de la primera publicación (una sola vez)

1. Tener cuenta en [npmjs.com](https://www.npmjs.com/signup).
2. **Ser dueña del scope `@kdenza`.** En npm un scope pertenece a un
   usuario o a una organización, y solo se puede publicar bajo el propio.
   Dos caminos:
   - que el usuario de npm se llame `kdenza`, o
   - crear una organización gratuita llamada `kdenza` (npmjs.com → *Add
     an Organization*; el plan gratuito permite paquetes públicos
     ilimitados).

   Si `kdenza` ya está tomado en npm, hay que elegir otro scope y
   renombrar los paquetes — es el mismo problema que ya pasó una vez con
   `cadenza` en GitHub (ver ADR-0006).
3. Autenticarse en la terminal:
   ```bash
   npm login
   ```

## Publicar una versión

```bash
npm version patch -w @kdenza/tokens
```

`patch` para arreglos, `minor` para API nueva compatible, `major` para
cambios rompientes — semver normal.

```bash
npm publish -w @kdenza/tokens
```

`prepublishOnly` corre el build (y el `analyze` en components) solo,
así que nunca se puede publicar un `dist/` viejo o ausente.

Los paquetes con scope se publican como **privados por defecto**, lo que
falla sin plan de pago. Por eso ambos llevan `publishConfig.access:
"public"` en su `package.json`: sin eso haría falta `npm publish
--access public` en cada publicación, y basta olvidarlo una vez.

**Orden entre los dos paquetes:** `@kdenza/components` depende de
`@kdenza/tokens`. Si se publican versiones nuevas de ambos, primero
tokens; y si components necesita la versión nueva, actualizar esa
referencia en `packages/components/package.json` antes de publicarlo.

```bash
npm publish -w @kdenza/components
```

Para ver exactamente qué se va a subir, sin subir nada:

```bash
npm pack --dry-run -w @kdenza/components
```

## Consumir desde otro proyecto

Sin `.npmrc`, sin token, sin configuración:

```bash
npm install @kdenza/components
```

Eso trae `@kdenza/tokens` como dependencia transitiva. Después:

```js
import '@kdenza/components';
import '@kdenza/components/dist/styles/tokens.css';
```

```html
<cdz-button>Enviar</cdz-button>
```

En Angular hay que agregar `CUSTOM_ELEMENTS_SCHEMA` al módulo o componente
donde se use cualquier `cdz-*`, porque Angular no reconoce elementos custom
por defecto.

## Por qué el registry público y no GitHub Packages

Se empezó en GitHub Packages (ADR-0006), con el argumento de que mantenía
los paquetes bajo el mismo control de acceso que el repo. El motivo por el
que se cambió es concreto:

**GitHub Packages exige autenticarse para instalar, incluso paquetes
públicos.** Quien quisiera consumir Cadenza tendría que generar un
Personal Access Token y escribir un `.npmrc` antes de poder correr `npm
install`. Para distribución interna de una empresa eso es aceptable; para
un sistema de diseño que además es el caso de estudio de un portafolio, es
justo la fricción que anula el objetivo — nadie genera un token para
mirar una demo.

El registry público no tiene ese paso. El costo es que los paquetes son
irreversiblemente públicos y necesitan una licencia real (MIT, ver
`LICENSE` en la raíz), que era la dirección correcta para este proyecto de
todos modos.

## Nunca pegar un token en el chat

Vale para `npm login`, para cualquier PAT de GitHub y para cualquier otra
credencial: van en tu propia terminal, nunca en una conversación con
Claude ni comiteadas al repo. Un token pegado en un chat hay que
considerarlo comprometido y rotarlo.
