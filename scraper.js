const puppeteer = require('puppeteer-core');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const prompt = require('prompt-sync')();
require('dotenv').config();

// Configuración
const OUTPUT_CSV = 'instagram_emails.csv';
const OUTPUT_TXT = 'seguidores.txt';
const EMAILS_TXT = 'emails_encontrados.txt';

// Regex para emails
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

async function extractEmails(text) {
    const matches = text.match(EMAIL_REGEX);
    return matches ? matches[0] : null; // Retorna el primer email encontrado
}

async function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

(async () => {
    console.log("=== Instagram Follower Email Extractor (Node.js) ===");
    console.log("🔹 Detección automática de Chrome");

    // Entradas del usuario (Prioridad: Argumentos CLI > Prompt Inteactivo)
    const args = process.argv.slice(2);
    let username, password, targetUrl;

    if (args.length >= 3) {
        username = args[0];
        password = args[1];
        targetUrl = args[2];
        console.log("🔹 Usando credenciales proporcionadas por CLI");
    } else if (process.env.IG_USERNAME && process.env.IG_PASSWORD && process.env.TARGET_URL) {
        username = process.env.IG_USERNAME;
        password = process.env.IG_PASSWORD;
        targetUrl = process.env.TARGET_URL;
        console.log("🔹 Usando credenciales del archivo .env");
    } else {
        username = prompt('🔸 Tu usuario de Instagram: ');
        password = prompt('🔸 Tu contraseña: ', { echo: '*' });
        targetUrl = prompt('🔸 URL del perfil a analizar: ');
    }

    let browser;
    try {
        // Encontrar Chrome
        const chromePath = chromeLauncher.Launcher.getFirstInstallation();
        if (!chromePath) {
            console.error("❌ No se encontró instalación de Chrome.");
            return;
        }
        console.log(`🚀 Chrome detectado en: ${chromePath}`);

        // Iniciar Puppeteer
        browser = await puppeteer.launch({
            executablePath: chromePath,
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized', '--disable-notifications']
        });

        const page = (await browser.pages())[0];
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Login
        console.log("🔑 Iniciando sesión...");
        await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });

        // Aceptar cookies si aparecen
        try {
            const cookieBtn = await page.waitForSelector('button._a9--._a9_1', { timeout: 5000 });
            if (cookieBtn) await cookieBtn.click();
        } catch (e) { }

        // Función para simular escritura humana
        const humanType = async (selector, text) => {
            const element = await page.$(selector);
            if (!element) return;
            await element.click();
            await delay(500 + Math.random() * 500); // Pausa antes de escribir
            for (const char of text) {
                await element.type(char, { delay: 100 + Math.random() * 100 }); // Retraso variable entre letras
                if (Math.random() < 0.1) await delay(400 + Math.random() * 300); // Pausa ocasional
            }
        };

        await page.waitForSelector('input[name="username"]');
        await humanType('input[name="username"]', username);
        await delay(500 + Math.random() * 1000); // Pausa entre campos
        await humanType('input[name="password"]', password);
        await delay(500 + Math.random() * 1000); // Pausa antes de enviar

        // Esperar a que el botón esté habilitado
        await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 5000 }).catch(() => { });

        console.log("🖱️ Intentando click en Login...");
        await page.click('button[type="submit"]');

        // Esperar navegación o aparición de errores
        try {
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
        } catch (e) {
            console.log("⚠️ No se detectó navegación estándar (posible AJAX o error en login), verificando estado...");
        }

        // Manejo de "Guardar información de inicio de sesión" (One Tap)
        try {
            // Esperar un momento a ver si aparece el diálogo o redirige
            await delay(3000);
            const currentUrl = page.url();

            if (currentUrl.includes('accounts/onetap')) {
                console.log("ℹ️ Detectada pantalla 'Guardar información' (One Tap)");
                // Buscar botón "Ahora no" (Not now)
                const notNowSelectors = [
                    'div[role="button"]:has-text("Ahora no")', // Pseudocódigo, puppeteer usa xpath o evaluar
                    '//button[contains(text(), "Ahora no")]',
                    '//div[contains(text(), "Ahora no")]',
                    'button._acan._acao._acas._aj1-' // Clase común a veces
                ];

                let clicked = false;
                for (const sel of notNowSelectors) {
                    try {
                        if (sel.startsWith('//')) {
                            const [btn] = await page.$x(sel);
                            if (btn) {
                                await btn.click();
                                clicked = true;
                                break;
                            }
                        } else {
                            // Intento simple con selector CSS si existiera uno estable, 
                            // pero como texto es mejor usar xpath
                        }
                    } catch (e) { }
                }

                if (!clicked) {
                    // Intento genérico por texto usando evaluate
                    await page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
                        const notNow = buttons.find(b => b.textContent.includes('Ahora no') || b.textContent.includes('Not now'));
                        if (notNow) notNow.click();
                    });
                }
                await delay(2000); // Esperar navegación post-click
            }
        } catch (e) {
            console.log("⚠️ Excepción leve manejando 'Guardar info':", e.message);
        }

        // --- VERIFICACIÓN DE LOGIN ---
        console.log("🔒 Verificando estado de sesión...");
        try {
            // Buscamos elementos que SOLO aparecen si estás logueado:
            // 1. Icono de Home (Inicio)
            // 2. Icono de búsqueda/explorar
            // 3. Tu propio perfil en el menú
            const loginIndicators = [
                'svg[aria-label="Inicio"]',
                'svg[aria-label="Home"]',
                'a[href="/explore/"]',
                `a[href="/${username}/"]`
            ];

            // Promise.any no siempre está en versiones viejas de Node, usamos race o un loop
            let loggedIn = false;
            const checkStart = Date.now();
            while (Date.now() - checkStart < 15000) { // 15 segundos para verificar
                for (const selector of loginIndicators) {
                    if (await page.$(selector)) {
                        loggedIn = true;
                        break;
                    }
                }
                if (loggedIn) break;
                await delay(1000);
            }

            if (!loggedIn) {
                console.error("❌ ERROR CRÍTICO: No se detectó inicio de sesión exitoso.");
                console.log("   Posiblemente atrapado en pantalla de 2FA, 'Suspicious Login', o credenciales inválidas.");
                // Opcional: Tomar screenshot
                await page.screenshot({ path: 'debug_login_failed.png' });
                console.log("📸 Screenshot guardado en 'debug_login_failed.png'");
                throw new Error("Login fallido - No se detectó dashboard.");
            }
            console.log("✅ Sesión verificada correctamente.");

        } catch (e) {
            throw e;
        }

        console.log("🎉 Login completado y verificado");

        // Ir al perfil
        console.log(`🔍 Accediendo a ${targetUrl}`);
        await page.goto(targetUrl, { waitUntil: 'networkidle2' });

        // Abrir seguidores
        // Abrir seguidores
        console.log("👥 Abriendo lista de seguidores...");

        // Verificar que estamos en la página correcta
        if (!page.url().includes(username) && !page.url().includes(targetUrl.split('/').filter(Boolean).pop())) {
            console.log(`⚠️ URL actual (${page.url()}) no coincide con el target. Redirigiendo manual...`);
            await page.goto(targetUrl, { waitUntil: 'networkidle2' });
        }

        const followersLinkSelectors = [
            `a[href*="/${targetUrl.split('/').filter(p => p && p !== 'https:' && p !== 'www.instagram.com').pop()}/followers/"]`, // Intento preciso
            'a[href$="/followers/"]', // Genérico final
            'a[href*="followers"]', // Muy genérico
            '//a[contains(text(), "followers")]',
            '//a[contains(text(), "seguidores")]'
        ];

        let followersClicked = false;
        for (const selector of followersLinkSelectors) {
            try {
                if (selector.startsWith('//')) {
                    const [link] = await page.$x(selector);
                    if (link) {
                        console.log(`   Click usando XPath: ${selector}`);
                        await link.click();
                        followersClicked = true;
                        break;
                    }
                } else {
                    if (await page.$(selector)) {
                        console.log(`   Click usando CSS: ${selector}`);
                        await page.click(selector);
                        followersClicked = true;
                        break;
                    }
                }
            } catch (e) { }
        }

        if (!followersClicked) {
            console.error("❌ No se encontró el enlace de 'Seguidores'.");
            await page.screenshot({ path: 'images/debug_no_followers_link.png' });
            throw new Error("No se pudo clickear en seguidores.");
        }

        // Esperar modal (selector más genérico primero)
        console.log("⏳ Esperando modal...");
        const dialogSelector = 'div[role="dialog"]';
        try {
            await page.waitForSelector(dialogSelector, { timeout: 30000 });
            console.log("✅ Modal base detectado");

            // Buscar el contenedor scrollable dentro del diálogo (Legacy approach removed in favor of dynamic)
            console.log("✅ Modal de seguidores abierto y listo");

        } catch (e) {
            console.error("❌ No se detectó el modal de seguidores (Timeout).");
            await page.screenshot({ path: 'images/debug_modal_failed_final.png' });
            throw e;
        }

        // --- LÓGICA DE SCROLL ROBUSTA (DINÁMICA) ---
        console.log("📜 Iniciando extracción de usuarios...");
        const collectedUsernames = new Set();
        let consecutiveStagnation = 0;
        const MAX_STAGNATION = 15;

        // Función para obtener scrollable element handle (VERIFICADO POR AGENTE)
        const findBestScrollable = async () => {
            // Selector específico identificado por debug manual
            const specificSelector = '.x6nl9eh.x1a5l9x9.x7vuprf.x1mg3h75.x1lliihq.x1iyjqo2.xs83m0k.xz65tgg.x1rife3k.x1n2onr6';
            const el = await page.$(specificSelector);
            if (el) return el;

            console.log("⚠️ Selector específico no encontrado, re-escaneando DOM...");
            // Fallback dinámico si Instagram cambia las clases
            const handle = await page.evaluateHandle(() => {
                const dialog = document.querySelector('div[role="dialog"]');
                if (!dialog) return null;
                const divs = Array.from(dialog.querySelectorAll('div'));
                let candidate = divs.find(d => {
                    const style = window.getComputedStyle(d);
                    return style.overflowY === 'auto' || style.overflowY === 'scroll';
                });
                return candidate || dialog;
            });
            return handle.asElement();
        }

        // Loop de scroll infinito
        while (true) {
            // 1. Extraer usuarios actuales en el DOM
            const userElements = await page.$$eval('div[role="dialog"] a[href*="/"]', links =>
                links.map(link => link.getAttribute('href').split('/')[1])
                    .filter(u => u && u !== 'explore' && u !== 'followers')
            );

            const initialSize = collectedUsernames.size;
            userElements.forEach(u => collectedUsernames.add(u));
            const newSize = collectedUsernames.size;

            console.log(`📊 Total: ${newSize} (+${newSize - initialSize} nuevos)`);

            if (newSize === initialSize) {
                consecutiveStagnation++;
            } else {
                consecutiveStagnation = 0;
            }

            if (consecutiveStagnation >= MAX_STAGNATION) {
                console.log("🔚 Fin del scroll o límite alcanzado.");
                break;
            }

            // 2. Scroll Action - Usando el elemento detectado
            try {
                const scrollable = await findBestScrollable();

                if (scrollable) {
                    // Stats para debug (opcional, pero util si falla)
                    /*
                    const stats = await page.evaluate(el => ({ h: el.scrollHeight, t: el.scrollTop }), scrollable);
                    console.log(`   Debug: H=${stats.h}, T=${stats.t}`);
                    */

                    await page.evaluate(el => {
                        el.scrollTop = el.scrollHeight;
                    }, scrollable);

                    await delay(1000);

                } else {
                    // Fallback extremo
                    await page.keyboard.press('PageDown');
                }

                await delay(1000 + Math.random() * 1000);

            } catch (e) {
                console.log("⚠️ Error en scroll loop:", e.message);
            }
        }

        // Guardar lista de seguidores
        const followersList = Array.from(collectedUsernames);
        fs.writeFileSync(OUTPUT_TXT, followersList.join('\n'));
        console.log(`💾 Guardados ${followersList.length} seguidores en ${OUTPUT_TXT}`);

        // --- EXTRACCIÓN DE EMAILS ---
        console.log("📧 Iniciando búsqueda de emails...");
        const csvWriter = createCsvWriter({
            path: OUTPUT_CSV,
            header: [
                { id: 'username', title: 'Username' },
                { id: 'email', title: 'Email' },
                { id: 'url', title: 'Profile URL' }
            ]
        });

        const maxProfiles = process.env.MAX_PROFILES ? parseInt(process.env.MAX_PROFILES) : followersList.length;
        const profilesToProcess = followersList.slice(0, maxProfiles);

        console.log(`\n📋 Se procesarán ${profilesToProcess.length} perfiles.`);

        let processed = 0;
        for (const user of profilesToProcess) { // Limite configurable
            processed++;
            console.log(`\n👤 Analizando (${processed}): ${user}`);
            const profileUrl = `https://www.instagram.com/${user}/`;

            try {
                await page.goto(profileUrl, { waitUntil: 'domcontentloaded' });
                await delay(2000 + Math.random() * 2000);

                // Obtener todo el texto de la página
                const content = await page.$eval('body', el => el.innerText);

                /* // Opcional: buscar en HTML crudo si es necesario
                const html = await page.content(); */

                const email = await extractEmails(content);

                let record = {
                    username: user,
                    email: email || 'No encontrado',
                    url: profileUrl
                };

                await csvWriter.writeRecords([record]);

                if (email) {
                    console.log(`✅ Email encontrado: ${email}`);
                    fs.appendFileSync(EMAILS_TXT, `${user}: ${email}\n`);
                } else {
                    console.log(`❌ Email no encontrado`);
                }

            } catch (e) {
                console.log(`⚠️ Error analizando perfil ${user}: ${e.message}`);
            }

            // Pausa entre perfiles
            await delay(3000 + Math.random() * 2000);
        }

        console.log("\n🎉 Proceso finalizado exitosamente.");

    } catch (error) {
        console.error("❌ Error fatal:", error);
    } finally {
        if (browser) {
            await browser.close();
            console.log("🛑 Navegador cerrado.");
        }
    }
})();
