# NAYGAR · Simulador de lonas

Simulador 3D para probar el logo y los colores de **NAYGAR Logística** sobre las lonas laterales y la puerta trasera de un camión de caja.

## Uso

1. **Paleta**: aplica de un clic una de las combinaciones del sistema de marca (rojo, verde, granate, naranja, azul…).
2. **Colores**: ajusta por separado el fondo de la lona, el símbolo y el texto.
3. **Lona lateral**: elige entre los diseños Caja 1–9 (SVG originales en `assets/cajas/`, siempre centrados y con margen). Arrastra el logo sobre el camión para moverlo y ajusta su tamaño.
4. **Puerta trasera**: elige entre Trasera 1–4.
5. **Constrúyelo tú mismo**: abre un panel a la derecha y deja el camión limpio. Guía paso a paso: NAYGAR, LOGISTICA y símbolo, cada uno con su color y tamaño, y se arrastran sobre el camión. NAYGAR queda siempre por encima.
6. **Logo**: opcionalmente, sube otro logo (SVG/PNG) que sustituye al símbolo.
7. **Guardar versión**: guarda la combinación en este navegador para compararla después.
8. **Descargar PDF**: genera una ficha A4 con las vistas 3D, los artes planos y los códigos de color. Con dos o más versiones guardadas aparece el **PDF comparativo**, con una página por versión.

Las vistas (3/4 frontal, 3/4 trasera, laterales y trasera) están arriba. El camión también se puede girar con el ratón o con el dedo.

## Publicar en GitHub Pages

En el repositorio: **Settings → Pages → Build and deployment → Deploy from a branch** y elige la rama donde esté este código, carpeta `/ (root)`.
La web quedará en `https://<usuario>.github.io/naygar/`.

No hace falta compilar nada: es HTML estático. three.js y jsPDF van incluidos en `lib/`.

## Estructura

- `index.html`, `css/style.css`: interfaz.
- `js/app.js`: escena 3D, vistas, versiones y exportación a PDF.
- `js/truck.js`: camión modelado con three.js (todo blanco; solo las lonas y la puerta trasera llevan diseño).
- `js/brand.js`: dibujo del isotipo, del logotipo y de los diseños Caja 1–9 / Trasera 1–4.
- `assets/`: recursos de marca (Recurso 2, 3 y 4).

## Notas

- **Tipografía**: el manual usa *TT Travels Next* (licencia comercial). Mientras no esté disponible para web, se usa *Archivo Expanded Bold* como sustituta. La URL usa *Overpass Mono*, la misma del manual.
- **Isotipo y logotipo**: se dibujan con los trazados originales de los SVG. Solo «LOGISTICA.» usa la tipografía sustituta, ajustada al ancho del diseño original.
- Para cambiar un diseño de caja, sustituye `assets/cajas/caja-N.svg` y regenera `js/designs.js`.
