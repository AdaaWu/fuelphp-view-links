const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const PATH_PATTERNS = [
  { re: /View::forge\s*\(\s*(['"])([^'"]+)\1/g,   base: 'fuel/app/views',    ext: '.php' },
  { re: /Asset::css\s*\(\s*(['"])([^'"]+)\1/g,    base: 'public/assets/css', ext: '' },
  { re: /Asset::js\s*\(\s*(['"])([^'"]+)\1/g,     base: 'public/assets/js',  ext: '' },
  { re: /Asset::img\s*\(\s*(['"])([^'"]+)\1/g,    base: 'public/assets/img', ext: '' },
  { re: /Config::load\s*\(\s*(['"])([^'"]+)\1/g,  base: 'fuel/app/config',   ext: '.php' },
  { re: /Lang::load\s*\(\s*(['"])([^'"]+)\1/g,    base: 'fuel/app/lang',     ext: '.php' },
];

// ─── Path Links ───────────────────────────────────────────────────────────────

class FuelPhpPathLinkProvider {
  provideDocumentLinks(document) {
    const links = [];
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) return links;

    const root = workspaceFolder.uri.fsPath;
    const cfg = vscode.workspace.getConfiguration('fuelpHPTools');
    const viewsBase = cfg.get('viewsPath') || 'fuel/app/views';
    const assetsBase = cfg.get('assetsPath') || 'public/assets';
    const text = document.getText();

    const resolvedPatterns = PATH_PATTERNS.map(p => ({
      ...p,
      base: p.base.startsWith('fuel/app/views') ? viewsBase
          : p.base.startsWith('public/assets') ? assetsBase + p.base.slice('public/assets'.length)
          : p.base,
    }));

    for (const { re, base, ext } of resolvedPatterns) {
      re.lastIndex = 0;
      let match;
      while ((match = re.exec(text)) !== null) {
        const quote = match[1];
        const filePath = match[2];
        const quoteStart = match.index + match[0].indexOf(quote) + 1;
        const start = document.positionAt(quoteStart);
        const end = document.positionAt(quoteStart + filePath.length);
        const range = new vscode.Range(start, end);
        const targetFsPath = path.join(root, ...base.split('/'), ...filePath.split('/')) + ext;
        if (!fs.existsSync(targetFsPath)) continue;
        const target = vscode.Uri.file(targetFsPath);
        links.push(new vscode.DocumentLink(range, target));
      }
    }

    return links;
  }
}

// ─── Route Controller Link ────────────────────────────────────────────────────

// FuelPHP controller resolution:
// 'a/b/c/d' → try fuel/app/classes/controller/a/b/c/d.php first (full path as file)
//           → then try fuel/app/classes/controller/a/b/c.php + action_d()
function resolveController(root, controllerStr) {
  const controllerBase = path.join(root, 'fuel', 'app', 'classes', 'controller');
  const segments = controllerStr.split('/');

  // Rule 1: full path is a file (e.g. user/search/index/index → user/search/index.php)
  const fullPath = path.join(controllerBase, ...segments) + '.php';
  if (fs.existsSync(fullPath)) {
    const actionName = segments[segments.length - 1];
    const lineNumber = findActionLine(fullPath, actionName);
    return { filePath: fullPath, lineNumber };
  }

  // Rule 2: last segment is action name (e.g. user/shop/ajax/clickcount → user/shop/ajax.php + clickcount)
  if (segments.length >= 2) {
    const filePath = path.join(controllerBase, ...segments.slice(0, -1)) + '.php';
    if (fs.existsSync(filePath)) {
      const actionName = segments[segments.length - 1];
      const lineNumber = findActionLine(filePath, actionName);
      return { filePath, lineNumber };
    }
  }

  return null;
}

function findActionLine(filePath, actionName) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  // Match action_foo(), get_foo(), post_foo()
  const re = new RegExp(`function\\s+(action_${actionName}|get_${actionName}|post_${actionName})\\s*\\(`);
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) return i + 1; // 1-based
  }
  return 1;
}

class RouteControllerLinkProvider {
  provideDocumentLinks(document) {
    const links = [];
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) return links;

    const root = workspaceFolder.uri.fsPath;
    const text = document.getText();
    const lines = text.split('\n');

    // Match the value side:  => 'user/shop/ajax/clickcount'
    const CONTROLLER_VALUE_RE = /=>\s*'([a-zA-Z0-9_\/]+)'/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('//') || line.includes('function')) continue;

      CONTROLLER_VALUE_RE.lastIndex = 0;
      let match;
      while ((match = CONTROLLER_VALUE_RE.exec(line)) !== null) {
        const controllerStr = match[1];
        const resolved = resolveController(root, controllerStr);
        if (!resolved) continue;

        const lineOffset = lines.slice(0, i).reduce((acc, l) => acc + l.length + 1, 0);
        const matchStart = lineOffset + match.index + match[0].indexOf("'") + 1;
        const start = document.positionAt(matchStart);
        const end = document.positionAt(matchStart + controllerStr.length);
        const range = new vscode.Range(start, end);

        const targetUri = vscode.Uri.file(resolved.filePath).with({
          fragment: `L${resolved.lineNumber}`,
        });
        links.push(new vscode.DocumentLink(range, targetUri));
      }
    }

    return links;
  }
}

// ─── Route Runner ─────────────────────────────────────────────────────────────

// Matches:  'some/route'  =>  'controller/action',
const ROUTE_LINE_RE = /^\s*'([^']+)'\s*=>\s*'([^']+)'/;

function readDotEnv(workspaceRoot) {
  const envFile = path.join(workspaceRoot, '.env');
  const defaults = {};
  if (!fs.existsSync(envFile)) return defaults;
  const lines = fs.readFileSync(envFile, 'utf8').split('\n');
  for (const line of lines) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (m) defaults[m[1].trim()] = m[2].trim();
  }
  return defaults;
}

function extractParams(routePattern) {
  const params = [];
  const re = /\(:([a-zA-Z_][a-zA-Z0-9_]*)\)/g;
  let m;
  while ((m = re.exec(routePattern)) !== null) {
    params.push(m[1]);
  }
  return params;
}

function buildUrl(domain, routePattern, values) {
  let url = routePattern;
  for (const [key, val] of Object.entries(values)) {
    url = url.replace(`(:${key})`, encodeURIComponent(val));
  }
  // Remove any leftover unresolved params
  url = url.replace(/\(:[^)]+\)/g, '_');
  const base = domain.replace(/\/$/, '');
  return `${base}/${url}`;
}

class RouteRunnerCodeLensProvider {
  provideCodeLenses(document) {
    const lenses = [];
    const text = document.getText();
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(ROUTE_LINE_RE);
      if (!m) continue;
      const routePattern = m[1];
      // Skip special keys and closure routes
      if (routePattern.startsWith('_') || lines[i].includes('function')) continue;
      const range = new vscode.Range(i, 0, i, lines[i].length);
      lenses.push(new vscode.CodeLens(range, {
        title: '▶ Run',
        command: 'fuelpHPTools.runRoute',
        arguments: [routePattern, document.uri],
      }));
    }

    return lenses;
  }
}

async function runRoute(routePattern, fileUri) {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
  const root = workspaceFolder ? workspaceFolder.uri.fsPath : '';
  const env = readDotEnv(root);

  const config = vscode.workspace.getConfiguration('fuelpHPTools');
  const domain = config.get('domain') || env['FUELPHP_DOMAIN'] || 'http://localhost';

  const params = extractParams(routePattern);
  const values = {};

  for (const param of params) {
    const envKey = `FUELPHP_${param.toUpperCase()}`;
    const envDefault = env[envKey] || '';
    const input = await vscode.window.showInputBox({
      prompt: `Value for :${param}`,
      placeHolder: envDefault ? `Enter to use .env default: ${envDefault}` : `Enter value for :${param}`,
      value: '',
    });
    if (input === undefined) return; // cancelled
    values[param] = input.trim() !== '' ? input.trim() : envDefault;
  }

  const url = buildUrl(domain, routePattern, values);
  vscode.env.openExternal(vscode.Uri.parse(url));
}

// ─── Activate ─────────────────────────────────────────────────────────────────

function activate(context) {
  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(
      [{ language: 'php' }],
      new FuelPhpPathLinkProvider()
    )
  );

  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(
      { pattern: '**/routes.php' },
      new RouteControllerLinkProvider()
    )
  );

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { pattern: '**/routes.php' },
      new RouteRunnerCodeLensProvider()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('fuelpHPTools.runRoute', runRoute)
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
