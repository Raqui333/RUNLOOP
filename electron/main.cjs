const { app, BrowserWindow, protocol, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

const APP_NAME = "RUNLOOP";
const DEV_URL = process.env.RUNLOOP_DEV_URL;

protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
    },
  },
]);

let mainWindow = null;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.setName(APP_NAME);

  app.whenReady().then(() => {
    registerAppProtocol();

if (DEV_URL) {
    mainWindow = createWindow();
    registerSmokeCheck();
    mainWindow.loadURL(DEV_URL);
  } else {
    const outDir = path.join(app.getAppPath(), "out");
    const indexPath = path.join(outDir, "index.html");
    if (!fs.existsSync(indexPath)) {
      dialog.showErrorBox(
        APP_NAME,
        "Static web build not found.\n\nRun `npm run build` (or `npm run dist`) before launching the desktop app.",
      );
      app.quit();
      return;
    }
    mainWindow = createWindow();
    registerSmokeCheck();
    mainWindow.loadURL("app://bundle/index.html");
  }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}

function registerAppProtocol() {
  const outDir = path.join(app.getAppPath(), "out");
  protocol.handle("app", (request) => {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") pathname = "/index.html";

    const target = path.join(outDir, "." + pathname);
    const relative = path.relative(outDir, target);
    const isSafe =
      relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
    if (!isSafe) {
      return new Response("403 Forbidden", { status: 403 });
    }
    try {
      if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
        return new Response("404 Not Found", { status: 404 });
      }
      const data = fs.readFileSync(target);
      return new Response(data, {
        headers: { "content-type": mimeFor(pathname) },
      });
    } catch {
      return new Response("404 Not Found", { status: 404 });
    }
  });
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function mimeFor(pathname) {
  const ext = path.extname(pathname).toLowerCase();
  return MIME[ext] ?? "application/octet-stream";
}

function createWindow() {
  const iconPath = path.join(app.getAppPath(), "build", "icon.png");
  const win = new BrowserWindow({
    title: APP_NAME,
    backgroundColor: "#05080b",
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: DEV_URL ? false : true,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => win.show());

  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  if (DEV_URL) win.webContents.openDevTools({ mode: "detach" });

  return win;
}

function registerSmokeCheck() {
  if (process.env.RUNLOOP_SMOKE !== "1") return;
  mainWindow.webContents.once("did-finish-load", async () => {
    try {
      const title = await mainWindow.webContents.executeJavaScript("document.title");
      const booted = await mainWindow.webContents.executeJavaScript(
        'document.body.innerText.includes("RUNLOOP")',
      );
      console.log(`SMOKE OK title="${title}" booted=${booted}`);
    } catch (err) {
      console.error("SMOKE FAIL", err);
      process.exitCode = 1;
    } finally {
      app.quit();
    }
  });
}