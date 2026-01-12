# Detector de Emails de Seguidores de Instagram (Node.js)

> ⚠️ **¡ADVERTENCIA!**: Este proyecto es solo para fines educativos y de investigación. El uso de este software para la extracción masiva de datos podría violar los Términos de Servicio de Instagram. Úsalo bajo tu propia responsabilidad.

---

## 📝 Descripción

Esta herramienta automatizada permite extraer correos electrónicos públicos de los perfiles que siguen a una cuenta específica de Instagram.
Ha sido **completamente reescrita en Node.js y Puppeteer** para ofrecer mayor estabilidad y un comportamiento más "humano" que las versiones anteriores basadas en Python/Selenium.

El script realiza los siguientes pasos:
1.  Inicia sesión en Instagram automáticamente (o gestiona sesiones existentes).
2.  Navega al perfil objetivo.
3.  Abre la lista de seguidores y realiza un **scroll inteligente** para cargar todos los usuarios.
4.  Visita cada perfil extraído individualmente.
5.  Busca direcciones de correo electrónico en la biografía.
6.  Guarda los resultados en formatos CSV y TXT.

---

## ✨ Características Principales

-   **🚀 Detección Automática de Chrome**: No necesitas descargar `chromedriver` manualmente. El script detecta tu instalación local de Chrome.
-   **🖱️ Scroll Infinito Robusto**: Nuevo algoritmo de scroll que detecta cargas dinámicas y evita atascos comunes en listas largas de seguidores.
-   **🤖 Comportamiento Humano**: Simulación de tipeo, movimientos de ratón y tiempos de espera aleatorios para evitar bloqueos por parte de Instagram.
-   **📧 Extracción Inteligente de Emails**: Detecta múltiples formatos de correo en las biografías.
-   **⚙️ Configuración Flexible**: Admite credenciales vía archivo `.env`, argumentos de línea de comandos o entrada interactiva.

---

## 📋 Requisitos Previos

-   **Node.js** (Versión 14 o superior).
-   **Google Chrome** instalado en tu sistema.

---

## 🛠️ Instalación

1.  **Clonar el repositorio** (si aún no lo has hecho):
    ```bash
    git clone <url-del-repositorio>
    cd PRIVADO-ig-follower-email-extractor
    ```

2.  **Instalar dependencias**:
    Ejecuta el siguiente comando en la terminal para instalar Puppeteer y otras librerías necesarias:
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno (Opcional pero recomendado)**:
    Crea un archivo `.env` en la raíz del proyecto y añade tus credenciales para evitar escribirlas cada vez:
    ```env
    IG_USERNAME=tu_usuario_de_instagram
    IG_PASSWORD=tu_contraseña
    TARGET_URL=https://www.instagram.com/cuenta_a_analizar/
    MAX_PROFILES=500 # Opcional: Limite de perfiles a analizar (borrar para sin limite)
    ```

---

## 🚀 Uso

Tienes tres formas de ejecutar el script:

### Opción 1: Usando archivo `.env` (Recomendado)
Si ya configuraste el archivo `.env`, implemente ejecuta:
```bash
node scraper.js
```

### Opción 2: Modo Interactivo
Si no configuras nada, el script te preguntará los datos al iniciarse:
```bash
node scraper.js
```
*Seguir las instrucciones en pantalla.*

### Opción 3: Argumentos de Línea de Comandos
Puedes pasar los datos directamente al comando (útil para scripts):
```bash
node scraper.js <usuario> <contraseña> <url_target>
```

---

## 📂 Archivos de Salida

El script generará los siguientes archivos en la carpeta del proyecto:

-   **`instagram_emails.csv`**: Archivo principal con los resultados estructurados. Columnas: `Username`, `Email`, `Profile URL`.
-   **`seguidores.txt`**: Lista simple con todos los nombres de usuario extraídos.
-   **`emails_encontrados.txt`**: Archivo de texto rápido con formato `usuario: email`.

---

## ⚠️ Notas y Limitaciones

-   **Límite de Seguridad**: Por defecto, el script analiza los primeros **100 seguidores** para evitar bloqueos agresivos. Puedes modificar este límite en el código (`scraper.js`) bajo tu propio riesgo.
-   **Emails Públicos**: La herramienta solo puede extraer emails que estén escritos textualmente en la biografía pública del usuario. No extrae emails del botón "Contacto" si este está oculto o requiere interacción móvil específica.
-   **Bloqueos Temporales**: Si abusas de la herramienta, Instagram puede bloquear temporalmente tu cuenta o pedir verificaciones. Se recomienda usar una cuenta secundaria para realizar el scraping.

---

## ⚖️ Aviso Legal

Este software se proporciona "tal cual", sin garantía de ningún tipo. El autor no se hace responsable del mal uso de esta herramienta ni de las consecuencias que pueda tener sobre tu cuenta de Instagram.

**¡Sé responsable y ético!**
