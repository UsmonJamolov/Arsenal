const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const SESSION_FILE = path.join(process.env.ProgramData || "C:\\ProgramData", "ArsenalUnion", "session.json");

function runPowerShell(script) {
  return new Promise((resolve, reject) => {
    const command = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${script.replace(/"/g, '\\"')}"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

function ensureSessionDir() {
  const dir = path.dirname(SESSION_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function notify(title, message) {
  const safeTitle = title.replace(/'/g, "''");
  const safeMessage = message.replace(/'/g, "''");
  await runPowerShell(
    `[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null; ` +
      `$template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02); ` +
      `$text = $template.GetElementsByTagName('text'); $text[0].AppendChild($template.CreateTextNode('${safeTitle}')) | Out-Null; ` +
      `$text[1].AppendChild($template.CreateTextNode('${safeMessage}')) | Out-Null; ` +
      `$toast = [Windows.UI.Notifications.ToastNotification]::new($template); ` +
      `[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Arsenal Union').Show($toast)`,
  ).catch(() => {
    return runPowerShell(`msg * /time:10 "${safeTitle}: ${safeMessage}"`);
  });
}

async function lockWorkstation() {
  await runPowerShell("rundll32.exe user32.dll,LockWorkStation");
}

async function handleStartSession(payload) {
  ensureSessionDir();
  fs.writeFileSync(SESSION_FILE, JSON.stringify(payload, null, 2), "utf8");

  const pin = payload.unlockPin || "------";
  const name = payload.deviceName || "Stansiya";
  const minutes = payload.durationMinutes || "?";

  await notify(
    "Arsenal Union",
    `${name}: PIN ${pin} (${minutes} daqiqa). Ilovada PIN kiriting.`,
  );

  console.log(`[start_session] ${name} PIN=${pin} ${minutes}min`);
}

async function handleUnlock(payload) {
  ensureSessionDir();
  const data = { ...payload, unlockedAt: new Date().toISOString() };
  fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2), "utf8");

  await notify("Arsenal Union", "Sessiya ochildi. O'yin vaqtingiz boshlandi!");
  console.log("[unlock] sessiya faol");
}

async function handleStopSession(payload) {
  if (fs.existsSync(SESSION_FILE)) {
    fs.unlinkSync(SESSION_FILE);
  }

  await notify("Arsenal Union", "Vaqt tugadi. Ekran qulflanmoqda.");
  console.log("[stop_session]", payload?.reason || "done");
  await lockWorkstation();
}

async function executeCommand(command) {
  switch (command.command) {
    case "start_session":
      await handleStartSession(command.payload || {});
      break;
    case "unlock":
      await handleUnlock(command.payload || {});
      break;
    case "stop_session":
    case "lock":
      await handleStopSession(command.payload || {});
      break;
    default:
      console.warn("Noma'lum buyruq:", command.command);
  }
}

module.exports = { executeCommand, SESSION_FILE };
