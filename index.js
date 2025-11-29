const makeWASocket = require("@whiskeysockets/baileys").default;
const {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");

// ---- CONFIGURACIONES ----
const lastActive = {}; // Para inactivos
const INACTIVO_DIAS = 7; // Días para considerar inactivo
const PREFIX = "."; // Prefijo de comandos

// ---- ACERTIJOS (50 en total) ----
const riddles = [
  {
    q: "👀 Soy algo que todos pueden abrir, pero nadie puede cerrar. ¿Qué soy?",
    a: "🥚 Un huevo.",
  },
  {
    q: "🕳️ ¿Qué tiene agujeros por todos lados y aún así puede contener agua?",
    a: "🧽 Una esponja.",
  },
  {
    q: "🌑 Cuanto más grande soy, menos se ve. ¿Qué soy?",
    a: "🌌 La oscuridad.",
  },
  { q: "🌧️ Vuelo sin alas, lloro sin ojos. ¿Qué soy?", a: "☁️ La nube." },
  { q: "🤫 Si me nombras, desaparezco. ¿Qué soy?", a: "🔇 El silencio." },
  {
    q: "⏰ Tengo agujas pero no pincho, marco horas sin descanso. ¿Qué soy?",
    a: "🕒 Un reloj.",
  },
  { q: "💨 Entro al agua y no me mojo. ¿Qué soy?", a: "🪞 El reflejo." },
  {
    q: "👣 Siempre va delante de ti, pero nunca lo puedes ver. ¿Qué es?",
    a: "⏳ El futuro.",
  },
  { q: "📶 Sube y baja sin moverse del lugar. ¿Qué es?", a: "📊 La señal." },
  { q: "🔊 Me rompo si dices mi nombre. ¿Qué soy?", a: "🤐 El silencio." },
  {
    q: "🗺️ Tengo ciudades pero no casas, montañas pero no árboles y agua pero no peces. ¿Qué soy?",
    a: "🗺️ Un mapa.",
  },
  {
    q: "🤝 Si me tienes, quieres compartirlo. Si me compartes, ya no me tienes. ¿Qué soy?",
    a: "🤫 Un secreto.",
  },
  {
    q: "🔤 Es tuyo, pero la gente lo usa más que tú. ¿Qué es?",
    a: "🪪 Tu nombre.",
  },
  {
    q: "🌬️ Peso menos que una pluma, pero ni el más fuerte me puede sostener mucho tiempo. ¿Qué soy?",
    a: "💨 La respiración.",
  },
  { q: "🕯️ Nace grande y muere pequeño. ¿Qué es?", a: "🕯️ Una vela." },
  {
    q: "🌊 Camina sin pies, corre sin piernas y ruge sin boca. ¿Qué es?",
    a: "🌊 El mar.",
  },
  { q: "🧻 ¿Qué se moja mientras seca?", a: "🧻 La toalla." },
  {
    q: "🕳️ Cuanto más le quitas, más grande se hace. ¿Qué es?",
    a: "🕳️ Un hueco.",
  },
  { q: "🦷 Tiene dientes pero no come. ¿Qué es?", a: "🧵 Un peine." },
  { q: "🚶 Todos lo pisan, pero nadie se queja. ¿Qué es?", a: "🛣️ El suelo." },
  {
    q: "🍝 Entra duro y seco y sale blando y mojado. ¿Qué es?",
    a: "🍝 La pasta.",
  },
  {
    q: "🚣 Va por el agua y no se moja. ¿Qué es?",
    a: "⛵ La sombra del barco.",
  },
  {
    q: "🗣️ Habla todos los idiomas sin haber ido a la escuela. ¿Qué es?",
    a: "📢 El eco.",
  },
  {
    q: "🎈 Es redondo como el mundo, ligero como el viento; si quieres que te lo diga, espera un momento. ¿Qué es?",
    a: "🎈 Un globo.",
  },
  {
    q: "🌞 Te sigue a todas partes, pero solo sale con sol. ¿Qué es?",
    a: "👤 Tu sombra.",
  },
  { q: "🎢 ¿Qué sube pero nunca baja?", a: "🎂 La edad." },
  { q: "🕰️ ¿Qué siempre viene pero nunca llega?", a: "🌅 El mañana." },
  { q: "👁️‍🗨️ ¿Qué cosa tiene un solo ojo pero no puede ver?", a: "🪡 La aguja." },
  {
    q: "🏃 ¿Qué corre por la ciudad pero nunca se mueve?",
    a: "🛣️ Las calles.",
  },
  { q: "💔 ¿Qué se rompe sin tocarlo?", a: "🤝 Una promesa." },
  { q: "🌤️ ¿Qué pasa por delante del sol y no hace sombra?", a: "☁️ La luz." },
  { q: "🛒 ¿Qué se compra para comer pero nunca se come?", a: "🍽️ El plato." },
  {
    q: "🧼 ¿Qué es algo que cuanto más lavas más pequeño se vuelve?",
    a: "🧼 El jabón.",
  },
  {
    q: "👔 ¿Qué tiene cuello pero no cabeza?",
    a: "👕 Una camisa / una botella.",
  },
  { q: "🎧 ¿Qué se puede oír pero no se puede ver?", a: "🎵 El sonido." },
  {
    q: "🧩 ¿Qué es lo que cuanto más lleno está, menos pesa?",
    a: "🎈 Un globo lleno de aire.",
  },
  { q: "🖐️ ¿Qué cosa tiene manos pero no puede aplaudir?", a: "🕒 El reloj." },
  { q: "☔ ¿Qué sube cuando la lluvia baja?", a: "☂️ El paraguas." },
  {
    q: "🔤 ¿Qué pasa una vez en el minuto, dos veces en el momento y ninguna en cien años?",
    a: "🔤 La letra ‘m’.",
  },
  {
    q: "🪑 ¿Qué tiene patas pero no camina, espalda pero no se dobla?",
    a: "🪑 La silla.",
  },
  {
    q: "🤧 ¿Qué se puede atrapar pero no se puede lanzar?",
    a: "🤧 Un resfriado.",
  },
  {
    q: "🎹 ¿Qué tiene muchas llaves pero no puede abrir puertas?",
    a: "🎹 Un piano.",
  },
  {
    q: "🛏️ ¿Qué tipo de habitación no tiene puertas ni ventanas?",
    a: "🍄 Una seta (‘mushroom’).",
  },
  {
    q: "👀 ¿Qué siempre está delante de ti pero no puedes verlo?",
    a: "⏳ El futuro.",
  },
  {
    q: "🪙 ¿Qué se hace pedazos sin caerse al suelo?",
    a: "💔 El corazón / un sueño.",
  },
  {
    q: "💡 ¿Qué se enciende de noche y se apaga de día, pero no es una luz artificial?",
    a: "🌙 Las estrellas.",
  },
  { q: "📚 ¿Qué aumenta cuanto más se reparte?", a: "📚 El conocimiento." },
  {
    q: "🧊 Me derrito si me miras de cerca al sol, pero en el frío duro estoy mejor. ¿Qué soy?",
    a: "🧊 El hielo.",
  },
  {
    q: "🎭 ¿Qué tiene cara pero no sentimientos, y siempre dice la verdad?",
    a: "🕒 El reloj.",
  },
  {
    q: "🚪 ¿Qué se abre y se cierra sin manos ni llaves, y deja pasar el aire?",
    a: "🪟 La ventana.",
  },
];

// Estado de acertijos por grupo
const lastRiddle = {}; // { groupJid: { idx, msgId } }
const riddleTimers = {}; // { groupJid: Timeout }

async function startBot() {
  try {
    console.log("▶️ WhatsApp Bot iniciando...");
    console.log("🚀 Iniciando bot de WhatsApp...");

    // Obtener la última versión de WhatsApp
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(
      `📱 Usando versión de WhatsApp: ${version.join(".")} (última: ${isLatest})`,
    );

    // Carpeta de sesión nueva
    const { state, saveCreds } = await useMultiFileAuthState("./auth");
    console.log("📁 Credenciales de sesión listas (./auth)");

    const sock = makeWASocket({
      logger: pino({ level: "silent" }),
      auth: state,
      version,
      printQRInTerminal: false,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
    });

    console.log("⏳ Esperando autenticación (debería aparecer un QR)...");

    sock.ev.on("creds.update", saveCreds);

    // ---- QR y conexión ----
    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.clear();
        console.log("📱 ESCANEA ESTE QR PARA CONECTAR WHATSAPP:\n");
        qrcode.generate(qr, { small: true });
        console.log(
          "\n👉 En tu teléfono: WhatsApp → Menú (⋮) → Dispositivos vinculados → Vincular dispositivo\n",
        );
      }

      if (connection === "open") {
        console.log("✅ Bot conectado a WhatsApp");
      } else if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.log("⚠️ Conexión cerrada. Código:", statusCode);

        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          console.log("🔄 Intentando reconectar...");
          startBot().catch((err) =>
            console.error("❌ Error al reconectar:", err),
          );
        } else {
          console.log(
            "🔒 Sesión cerrada definitivamente. Borra la carpeta ./auth para un nuevo QR.",
          );
        }
      }
    });

    // ---- Funciones auxiliares ----
    function getMessageText(msg) {
      const m = msg.message;
      if (!m) return "";
      if (m.conversation) return m.conversation;
      if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
      if (m.imageMessage?.caption) return m.imageMessage.caption;
      if (m.videoMessage?.caption) return m.videoMessage.caption;
      return "";
    }

    function markActive(jid) {
      lastActive[jid] = Date.now();
    }

    async function isAdmin(groupJid, senderJid) {
      const metadata = await sock.groupMetadata(groupJid);
      const p = metadata.participants.find((x) => x.id === senderJid);
      return p?.admin === "admin" || p?.admin === "superadmin";
    }

    async function getAdmins(groupJid) {
      const metadata = await sock.groupMetadata(groupJid);
      return metadata.participants.filter(
        (p) => p.admin === "admin" || p.admin === "superadmin",
      );
    }

    function normalize(str) {
      return (str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9ñ ]/gi, "")
        .trim();
    }

    // Aviso cuando quitan admin
    sock.ev.on("group-participants.update", async (update) => {
      try {
        const { id: groupJid, participants, action } = update;
        if (!groupJid || !participants || !action) return;

        if (action === "demote") {
          const nombres = participants
            .map((p) => `@${p.split("@")[0]}`)
            .join(", ");

          await sock.sendMessage(groupJid, {
            text: `🔻 *Cambio de administración*\n\nSe le ha quitado el admin a: ${nombres}`,
            mentions: participants,
          });
        }
      } catch (e) {
        console.log("Error en group-participants.update:", e);
      }
    });

    // ---- Manejo de mensajes ----
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;
      const msg = messages[0];
      if (!msg?.message) return;
      if (!msg.key.remoteJid.endsWith("@g.us")) return; // solo grupos

      const from = msg.key.remoteJid;
      const sender = msg.key.participant || msg.key.remoteJid;
      const textRaw = getMessageText(msg) || "";
      const text = textRaw.trim();

      markActive(sender);

      // 1) ¿Respuesta a acertijo?
      const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
      const quotedId = ctxInfo?.stanzaId;

      if (quotedId && lastRiddle[from] && lastRiddle[from].msgId === quotedId) {
        const { idx } = lastRiddle[from];
        const r = riddles[idx];

        const userAnsNorm = normalize(textRaw);
        const correctNorm = normalize(r.a);

        let isCorrect = false;
        if (userAnsNorm && correctNorm) {
          isCorrect =
            userAnsNorm === correctNorm ||
            userAnsNorm.includes(correctNorm) ||
            correctNorm.includes(userAnsNorm);
        }

        if (isCorrect) {
          if (riddleTimers[from]) {
            clearTimeout(riddleTimers[from]);
            delete riddleTimers[from];
          }
          delete lastRiddle[from];

          await sock.sendMessage(from, {
            text: `🎉 *¡Respuesta correcta!* @${sender.split("@")[0]} lo adivinó 👏\n\n✅ ${r.a}`,
            mentions: [sender],
            quoted: msg,
          });
        } else {
          await sock.sendMessage(from, {
            text: `❌ *Respuesta incorrecta*, @${sender.split("@")[0]}.\n🤔 ¡Intenta de nuevo!`,
            mentions: [sender],
            quoted: msg,
          });
        }
        return;
      }

      // 2) ¿Comando?
      if (!text.startsWith(PREFIX)) return;

      const args = text.slice(PREFIX.length).trim().split(" ");
      const command = args.shift()?.toLowerCase();

      const adminOnlyCommands = [
        "admins",
        "notify",
        "aviso",
        "inactivos",
        "mute",
        "unmute",
        "promote",
        "demote",
        "grupo",
        "todos",
        "todos2",
      ];

      if (adminOnlyCommands.includes(command)) {
        const esAdmin = await isAdmin(from, sender);
        if (!esAdmin) {
          await sock.sendMessage(from, {
            text: "🚫 *Solo administradores pueden usar este comando.*",
            mentions: [sender],
          });
          return;
        }
      }

      // ---- COMANDOS ----

      if (command === "menu" || command === "ayuda") {
        const menuText = `
📜 *Menú de comandos del bot* 🤖

👑 *Administración*
• .admins - Lista de admins del grupo
• .promote (responder o número) - Dar admin ✨
• .demote (responder o número) - Quitar admin 🔻
• .grupo abrir - Todos pueden hablar 🗣️
• .grupo cerrar - Solo admins 🔒
• .mute - Cierra el grupo (solo admins) 🚫
• .unmute - Abre el grupo (todos) ✅
• .inactivos list - Lista inactivos (+${INACTIVO_DIAS} días) 💤
• .inactivos kick - Expulsa inactivos 🧹

🔔 *Avisos y menciones*
• .notify texto - Aviso para todos 📢
• .aviso texto - Aviso para todos 📢
• .todos - Mención global en una línea 🙋
• .todos2 - Mención global en lista 📋

🎮 *Juegos*
• .juegos - Ver juegos disponibles 🎲
• .acertijo - Enviar un acertijo al azar 🧠
   (Para jugar, responde al mensaje del acertijo)
`;
        await sock.sendMessage(from, { text: menuText });
      } else if (command === "admins") {
        const admins = await getAdmins(from);
        const mentions = admins.map((a) => a.id);
        const lista = admins
          .map((a, i) => `${i + 1}. @${a.id.split("@")[0]}`)
          .join("\n");

        await sock.sendMessage(from, {
          text: `👑 *Administradores del grupo:*\n\n${lista}`,
          mentions,
        });
      } else if (command === "encuesta") {
        const full = args.join(" ");
        if (!full.includes("|")) {
          await sock.sendMessage(from, {
            text: "📊 *Uso correcto:*\n.encuesta Pregunta | Opción 1 | Opción 2 | Opción 3 ...",
          });
          return;
        }

        const partes = full
          .split("|")
          .map((p) => p.trim())
          .filter(Boolean);
        const pregunta = partes.shift();
        const opciones = partes;

        const opsTxt = opciones.map((op, i) => `${i + 1}. ${op}`).join("\n");

        await sock.sendMessage(from, {
          text: `📊 *Encuesta creada:*\n\n❓ ${pregunta}\n\n${opsTxt}\n\n👉 Responde con el *número* de tu opción.`,
        });
      } else if (command === "notify" || command === "aviso") {
        const mensaje = args.join(" ").trim();
        if (!mensaje) {
          await sock.sendMessage(from, {
            text: "📢 *Uso correcto:*\n.notify texto del aviso",
          });
          return;
        }
        const metadata = await sock.groupMetadata(from);
        const mentions = metadata.participants.map((p) => p.id);

        await sock.sendMessage(from, {
          text: `📢 *Aviso importante para todos:*\n\n${mensaje}\n\n${mentions
            .map((m) => `@${m.split("@")[0]}`)
            .join(" ")}`,
          mentions,
        });
      } else if (command === "inactivos") {
        const sub = (args[0] || "").toLowerCase();
        const metadata = await sock.groupMetadata(from);
        const ahora = Date.now();
        const limiteMs = INACTIVO_DIAS * 24 * 60 * 60 * 1000;

        const inactivos = metadata.participants.filter((p) => {
          const last = lastActive[p.id] || 0;
          return ahora - last > limiteMs;
        });

        if (sub === "list") {
          if (!inactivos.length) {
            await sock.sendMessage(from, {
              text: `✅ *No hay inactivos* (más de ${INACTIVO_DIAS} días). Buen grupo 🔥`,
            });
            return;
          }

          const msgList = inactivos
            .map((p, i) => `${i + 1}. @${p.id.split("@")[0]}`)
            .join("\n");
          const mentions = inactivos.map((p) => p.id);

          await sock.sendMessage(from, {
            text: `📃 *Lista de inactivos* (+${INACTIVO_DIAS} días):\n\n${msgList}`,
            mentions,
          });
        } else if (sub === "kick") {
          if (!inactivos.length) {
            await sock.sendMessage(from, {
              text: `✅ No hay usuarios para expulsar.`,
            });
            return;
          }

          const toKick = inactivos.map((p) => p.id);
          await sock.groupParticipantsUpdate(from, toKick, "remove");
          await sock.sendMessage(from, {
            text: `🧹 *Limpieza completa:*\nSe expulsaron ${toKick.length} inactivos del grupo.`,
          });
        } else {
          await sock.sendMessage(from, {
            text: "ℹ️ *Uso correcto:*\n.inactivos list\n.inactivos kick",
          });
        }
      } else if (command === "mute") {
        await sock.groupSettingUpdate(from, "announcement");
        await sock.sendMessage(from, {
          text: "🔒 *El grupo ha sido cerrado*\nSolo administradores pueden enviar mensajes.",
        });
      } else if (command === "unmute") {
        await sock.groupSettingUpdate(from, "not_announcement");
        await sock.sendMessage(from, {
          text: "🔓 *El grupo ha sido abierto*\nTodos pueden enviar mensajes de nuevo. 🎉",
        });
      } else if (command === "promote") {
        let target;

        if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
          target = msg.message.extendedTextMessage.contextInfo.participant;
        } else if (args[0]) {
          const num = args[0].replace(/[^0-9]/g, "");
          target = num + "@s.whatsapp.net";
        }

        if (!target) {
          await sock.sendMessage(from, {
            text: "✨ *Uso correcto:*\nResponde a un mensaje con .promote\nO usa: .promote 503XXXXXXXX",
          });
          return;
        }

        await sock.groupParticipantsUpdate(from, [target], "promote");
        await sock.sendMessage(from, {
          text: `✨ *Nuevo admin en la casa:*\n@${target.split("@")[0]} ahora es admin 👑`,
          mentions: [target],
        });
      } else if (command === "demote") {
        let target;

        if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
          target = msg.message.extendedTextMessage.contextInfo.participant;
        } else if (args[0]) {
          const num = args[0].replace(/[^0-9]/g, "");
          target = num + "@s.whatsapp.net";
        }

        if (!target) {
          await sock.sendMessage(from, {
            text: "🔻 *Uso correcto:*\nResponde a un mensaje con .demote\nO usa: .demote 503XXXXXXXX",
          });
          return;
        }

        await sock.groupParticipantsUpdate(from, [target], "demote");
        await sock.sendMessage(from, {
          text: `🔻 *Admin removido:*\n@${target.split("@")[0]} ya no es administrador.`,
          mentions: [target],
        });
      } else if (command === "grupo") {
        const accion = (args[0] || "").toLowerCase();
        if (accion === "abrir") {
          await sock.groupSettingUpdate(from, "not_announcement");
          await sock.sendMessage(from, {
            text: "✅ *Grupo abierto:*\nTodos pueden escribir. 🗣️",
          });
        } else if (accion === "cerrar") {
          await sock.groupSettingUpdate(from, "announcement");
          await sock.sendMessage(from, {
            text: "⛔ *Grupo cerrado:*\nSolo administradores pueden escribir.",
          });
        } else {
          await sock.sendMessage(from, {
            text: "ℹ️ *Uso correcto:*\n.grupo abrir\n.grupo cerrar",
          });
        }
      } else if (command === "todos") {
        const metadata = await sock.groupMetadata(from);
        const mentions = metadata.participants.map((p) => p.id);
        const texto =
          "📢 *Atención todos:*\n\n" +
          mentions.map((m) => `@${m.split("@")[0]}`).join(" ");

        await sock.sendMessage(from, {
          text: texto,
          mentions,
        });
      } else if (command === "todos2") {
        const metadata = await sock.groupMetadata(from);
        const mentions = metadata.participants.map((p) => p.id);
        const texto =
          "📢 *Mención global:*\n\n" +
          mentions.map((m, i) => `${i + 1}. @${m.split("@")[0]}`).join("\n");

        await sock.sendMessage(from, {
          text: texto,
          mentions,
        });
      } else if (command === "juegos") {
        await sock.sendMessage(from, {
          text: `🎮 *Juegos disponibles:*\n\n• .acertijo - Enviar un acertijo al azar 🧠\n   (Responde al mensaje del acertijo para intentar la respuesta)\n`,
        });
    } else if (command === "acertijo") {
        if (riddleTimers[from]) {
          clearTimeout(riddleTimers[from]);
          delete riddleTimers[from];
        }

        const idx = Math.floor(Math.random() * riddles.length);
        const r = riddles[idx];

        const sent = await sock.sendMessage(from, {
          text: `${r.q}\n\n⏱️ *Tienen 1 minuto para adivinar.*\n💬 Responde a *este mensaje* con tu respuesta.`,
        });

        lastRiddle[from] = {
          idx,
          msgId: sent.key.id,
        };

        riddleTimers[from] = setTimeout(async () => {
          try {
            const data = lastRiddle[from];
            if (!data) return;
            const rr = riddles[data.idx];
            await sock.sendMessage(from, {
              text: `⏰ *Tiempo terminado (1 minuto).* \n\nLa respuesta era:\n${rr.a}`,
            });
            delete lastRiddle[from];
            delete riddleTimers[from];
          } catch (e) {
            console.log("Error en temporizador de acertijo:", e);
          }
        }, 60000);
      }
    });
  } catch (err) {
    console.error("❌ Error en el bot:", err);
    process.exit(1);
  }
}

// Lanzar el bot
startBot().catch((err) => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});
            
