const vscode = require('vscode');
const path = require('path');

// Matches View::forge("user/search/shop") or View::forge('user/search/shop')
const VIEW_FORGE_RE = /View::forge\((['"])([a-zA-Z0-9_\-\/]+)\1/g;

class FuelPhpViewLinkProvider {
  provideDocumentLinks(document) {
    const links = [];
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) return links;

    const config = vscode.workspace.getConfiguration('fuelpHPViewLinks');
    const viewsRelPath = config.get('viewsPath') || 'fuel/app/views';
    const viewsRoot = path.join(workspaceFolder.uri.fsPath, ...viewsRelPath.split('/'));
    const text = document.getText();
    let match;

    VIEW_FORGE_RE.lastIndex = 0;
    while ((match = VIEW_FORGE_RE.exec(text)) !== null) {
      const quoteStart = match.index + match[0].indexOf(match[1]) + 1;
      const viewPath = match[2];
      const start = document.positionAt(quoteStart);
      const end = document.positionAt(quoteStart + viewPath.length);
      const range = new vscode.Range(start, end);
      const target = vscode.Uri.file(path.join(viewsRoot, ...viewPath.split('/')) + '.php');
      links.push(new vscode.DocumentLink(range, target));
    }

    return links;
  }
}

function activate(context) {
  const selector = [{ language: 'php' }];
  const provider = new FuelPhpViewLinkProvider();
  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(selector, provider)
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
