# Watt Graph Quest

CORRECCIÓN COMPLETA DEL JUEGO: QUE NO SE APAGUE LA CIUDAD

Necesito que revises y corrijas mi proyecto actual. El juego se llama “Que no se apague la ciudad” y trata sobre teoría de grafos aplicada a una red eléctrica ficticia.

IMPORTANTE: el juego actual no funciona correctamente. No pude completar ni siquiera la primera misión. No quiero que solamente cambies los colores, el diseño o las imágenes. Quiero que revises el código, encuentres los errores y hagas que el juego funcione de verdad.

Antes de modificar nada, inspeccioná los archivos y componentes existentes. Conservá las partes que ya funcionan y corregí las que estén incompletas o tengan errores.

1. Tecnologías y funcionamiento

Usá React y TypeScript si el proyecto ya está creado con esas tecnologías.

Conservá la estructura actual del proyecto siempre que sea posible.

Usá una biblioteca de grafos como Cytoscape.js únicamente si es compatible con el proyecto y realmente facilita las interacciones.

No dejes botones decorativos sin funcionalidad.

No simules acciones mostrando mensajes de éxito sin comprobar que los objetivos se cumplieron.

No reemplaces todo por una imagen estática.

No dejes errores de TypeScript, importaciones faltantes ni componentes sin terminar.

No cambies innecesariamente las dependencias ni elimines funcionalidades existentes.

2. Diseño del juego

Quiero un juego educativo moderno, visualmente atractivo y con una red eléctrica grande que pueda recorrerse e inspeccionarse.

Usá esta paleta:

Fondo: #101828.

Paneles: #17324D.

Líneas eléctricas activas: #38D9F5.

Central de energía: #FFD166.

Subestaciones: #4387FF.

Escuelas con electricidad: #43D9A3.

Rutas alternativas: #FF9F43.

Conexiones averiadas: #FF5364.

Texto: #EAF4FF.

La interfaz debe tener:

Barra superior con el título, la misión actual, el progreso y los botones de reinicio y pausa.

Un mapa de la red con nodos circulares, conexiones visibles y nombres legibles.

Un panel lateral que explique la misión y muestre las herramientas disponibles.

Un panel inferior con los objetivos, las escuelas con electricidad y los indicadores de la red.

Una leyenda que explique los colores y los conceptos de teoría de grafos.

La red debe poder desplazarse y ampliarse o reducirse con controles de zoom. Los nodos no deben quedar todos amontonados ni superponerse con los paneles.

3. La red eléctrica ficticia

Creá un grafo con:

1 Central de Energía.

6 subestaciones: Centro, Norte, Sur, Este, Oeste y Parque.

Entre 15 y 22 nodos secundarios de distribución.

7 escuelas: Escuela de Minas, Pucarita, Comercial 1, Nacional 1, Normal 1, Nacional 2 y El Huerto.

Cada nodo debe tener un identificador único y cada conexión debe representar una arista del grafo.

La red debe incluir varias rutas alternativas, ciclos y conexiones suficientes para que el jugador pueda resolver averías.

Reglas obligatorias:

La Central de Energía alimenta la red.

Las subestaciones se conectan con los nodos de distribución.

Los nodos secundarios se conectan entre sí cuando corresponda.

Las escuelas son nodos consumidores y se conectan a la red de distribución.

Nunca conectes una escuela directamente con otra escuela.

Ninguna escuela debe recibir electricidad directamente de otra escuela.

Todas las escuelas deben tener una ruta válida desde la central al comenzar la primera misión.

Los nodos y las aristas deben existir en los datos del juego, no solamente en el dibujo.

La red representa una simulación educativa ficticia, no la infraestructura eléctrica real de Jujuy.

Separá los datos de los nodos y las conexiones de los componentes visuales, para que la lógica pueda comprobar qué conexiones están activas y cuáles están averiadas.

4. Primera misión: PRIMER ENCENDIDO

Esta es la misión más importante. Tiene que funcionar completamente antes de implementar las demás.

Objetivo

Conectar correctamente la red y conseguir que las siete escuelas reciban electricidad.

Instrucciones que verá el jugador

“¡La ciudad está a oscuras! La central está preparada, pero necesitás comprobar que la energía pueda llegar a todas las escuelas. Seleccioná las conexiones disponibles y verificá que cada escuela tenga un camino hasta la central.”

Cómo se juega

Al comenzar, se muestra la red completa.

La central aparece en amarillo.

Las subestaciones aparecen en azul.

Los nodos secundarios aparecen en violeta o azul oscuro.

Las escuelas aparecen en gris mientras no tengan electricidad.

El jugador puede seleccionar un nodo o una conexión para ver su nombre y su función.

El jugador puede activar o desactivar las conexiones que la misión permita modificar.

Cuando se activa una conexión, la línea cambia visualmente de estado.

Después de cada modificación, el juego vuelve a calcular qué escuelas reciben electricidad.

Las escuelas alimentadas cambian a verde y las que siguen sin conexión permanecen grises.

El panel de objetivos muestra el progreso actualizado.

La primera misión debe comenzar con una red válida y con todas las conexiones necesarias para resolverla. No hagas que el jugador tenga que adivinar conexiones inexistentes ni buscar un botón escondido.

Condición para ganar

La misión se completa únicamente cuando las siete escuelas tienen un camino válido desde la central utilizando conexiones activas.

Cuando se cumpla esa condición:

Mostrá un mensaje de victoria.

Indicá que se completó la misión.

Explicá brevemente que todas las escuelas están conectadas con la central.

Mostrá un botón funcional “Siguiente misión”.

Permití reiniciar la misión.

Si una escuela pierde su camino hasta la central, debe dejar de contar como alimentada. No permitas ganar si alguna escuela sigue desconectada.

Cómo calcular la conectividad

Implementá un algoritmo real de recorrido del grafo, como BFS o DFS.

El algoritmo debe:

Comenzar desde el nodo de la central.

Recorrer solamente aristas activas.

Ignorar las aristas averiadas o desactivadas.

Determinar qué nodos son alcanzables desde la central.

Actualizar el estado de cada escuela en función de su alcanzabilidad.

No uses una variable fija que diga que todas las escuelas tienen electricidad. El resultado debe depender del grafo actual.

5. Botones que tienen que funcionar

Implementá y probá cada uno de estos controles:

Comprobar red: vuelve a calcular la conectividad y muestra qué escuelas tienen electricidad.

Reiniciar misión: restaura el estado inicial exacto de la misión actual.

Siguiente misión: avanza solamente si la misión actual está completada.

Anterior: permite regresar a una misión ya desbloqueada, si corresponde.

Zoom + y Zoom −: amplían y reducen el mapa.

Centrar red: vuelve a encuadrar el grafo.

Información del nodo: muestra el nombre, el tipo y las conexiones del nodo seleccionado.

Información de la arista: muestra qué nodos conecta y si está activa o averiada.

Todos los botones deben tener acciones reales. Si una acción no está disponible, indicá por qué y no finjas que se ejecutó.

6. Segunda misión: UNA FALLA INESPERADA

Implementala después de verificar que la primera misión funciona.

Objetivo: recuperar la electricidad de todas las escuelas después de una avería.

Comenzá con la red conectada.

Desactivá una conexión específica para representar la avería.

Mostrá esa conexión en rojo.

Calculá cuáles escuelas quedaron sin electricidad.

Permití activar conexiones alternativas disponibles.

Resaltá las rutas alternativas en naranja.

La misión se completa cuando todas las escuelas recuperan una ruta válida desde la central.

La avería no debe ser solo un cambio de color: tiene que modificar la conectividad real del grafo.

7. Tercera misión: EL NODO CRÍTICO

Objetivo: descubrir un nodo cuya desconexión puede aislar una parte de la red.

Mostrá una situación en la que exista un nodo crítico.

Permití seleccionar nodos para consultar sus conexiones.

Explicá qué ocurre si ese nodo deja de funcionar.

Actualizá las escuelas afectadas según la conectividad real.

Mostrá una explicación sencilla del concepto de punto de articulación.

8. Cuarta misión: EMERGENCIA EN LA CIUDAD

Objetivo: recuperar la electricidad en toda la red frente a varias averías.

Presentá más de una conexión averiada.

Mostrá qué escuelas están sin electricidad.

Permití reparar conexiones disponibles.

Calculá de nuevo la conectividad después de cada reparación.

Completá la misión solamente cuando todas las escuelas vuelvan a estar conectadas con la central.

9. Panel de información

Mostrá estos indicadores calculados a partir de los datos reales:

Cantidad total de nodos.

Cantidad total de aristas.

Conexiones activas.

Conexiones averiadas.

Escuelas con electricidad.

Escuelas sin electricidad.

Cantidad de componentes conexas.

Estado de la misión.

Los valores deben actualizarse cuando cambia la red. No escribas números fijos que no correspondan al estado actual.

10. Explicaciones educativas

Agregá un pequeño panel que explique con palabras sencillas:

Vértice: representa un elemento de la red, como una central, subestación, nodo o escuela.

Arista: representa una conexión entre dos vértices.

Camino: es una secuencia de conexiones que permite llegar de un vértice a otro.

Conectividad: indica si existe un camino entre dos vértices.

Ciclo: es un camino que permite regresar al vértice inicial sin repetir aristas.

Punto de articulación: es un vértice cuya eliminación aumenta la cantidad de componentes conexas del grafo.

Aclaración: esta es una simulación basada en teoría de grafos. La conectividad del grafo no representa todos los cálculos físicos necesarios para operar una red eléctrica real.

11. Requisitos técnicos y comprobaciones

Antes de terminar, comprobá lo siguiente:

La aplicación inicia sin errores.

La primera misión aparece al abrir el juego.

Las siete escuelas tienen una ruta válida al comenzar.

Al desactivar una conexión que sea necesaria, el juego detecta las escuelas que pierden conectividad.

Al activar una ruta alternativa válida, el juego detecta las escuelas recuperadas.

El contador de escuelas se actualiza correctamente.

La primera misión se puede completar siguiendo las instrucciones.

El botón de reinicio restaura la misión.

El botón de siguiente misión funciona después de ganar.

Ninguna escuela está conectada directamente a otra escuela.

No hay botones principales sin implementar.

No hay errores de consola que impidan jugar.

Si hace falta, agregá pruebas para comprobar el algoritmo de conectividad y las condiciones de victoria.

ORDEN DE TRABAJO OBLIGATORIO:

Primero revisá el proyecto existente y corregí los errores. Después implementá y probá completamente la primera misión. Recién cuando la primera misión sea jugable, avanzá con las otras tres.

No me entregues solamente un plan, una explicación o una lista de tareas: realizá los cambios en el código del proyecto. Si no podés completar alguna funcionalidad, indicá exactamente qué quedó pendiente y qué error lo impide. No afirmes que algo funciona si no lo comprobaste.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1eff11b0-5f69-5d26-a06e-620f5c08f679).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
