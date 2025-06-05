import * as vscode from 'vscode';
import { Template } from '../utils/templateLoader';

interface WebviewMessage {
  command: 'apply' | 'export';
  template: Template;
}

/**
 * 模板预览面板
 */
export class TemplatePreviewPanel {
  public static currentPanel: TemplatePreviewPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  /**
   * 创建或显示预览面板
   * @param extensionUri 扩展URI
   * @param template 模板
   */
  public static createOrShow(extensionUri: vscode.Uri, template: Template) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // 如果已经存在面板，则显示它
    if (TemplatePreviewPanel.currentPanel) {
      TemplatePreviewPanel.currentPanel._panel.reveal(column);
      TemplatePreviewPanel.currentPanel._update(template);
      return;
    }

    // 否则，创建一个新面板
    const panel = vscode.window.createWebviewPanel(
      'templatePreview',
      `预览: ${template.name}`,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'resources'),
          vscode.Uri.joinPath(extensionUri, 'out'),
        ],
      }
    );

    TemplatePreviewPanel.currentPanel = new TemplatePreviewPanel(
      panel,
      extensionUri
    );
    TemplatePreviewPanel.currentPanel._update(template);
  }

  /**
   * 构造函数
   * @param panel WebView面板
   * @param extensionUri 扩展URI
   */
  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // 设置HTML内容
    this._update({ name: '', description: '', content: '' });

    // 监听面板关闭事件
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  /**
   * 更新面板内容
   * @param template 模板
   */
  private _update(template: Template) {
    const webview = this._panel.webview;
    this._panel.title = `预览: ${template.name}`;
    this._panel.webview.html = this._getHtmlForWebview(webview, template);
  }

  /**
   * 获取WebView的HTML内容
   * @param webview WebView
   * @param template 模板
   */
  private _getHtmlForWebview(
    webview: vscode.Webview,
    template: Template
  ): string {
    // 将模板内容转换为HTML
    const content = template.content
      .replace(/\n/g, '<br>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/<li>/g, '<ul><li>')
      .replace(/<\/li>/g, '</li></ul>')
      .replace(/<\/ul><ul>/g, '');

    return `<!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>模板预览: ${template.name}</title>
      <style>
        body {
          font-family: var(--vscode-font-family);
          font-size: var(--vscode-font-size);
          color: var(--vscode-foreground);
          padding: 0 20px;
          line-height: 1.6;
        }
        h1 {
          color: var(--vscode-textLink-foreground);
          border-bottom: 1px solid var(--vscode-textSeparator-foreground);
          padding-bottom: 5px;
        }
        h2 {
          color: var(--vscode-textLink-activeForeground);
          margin-top: 20px;
        }
        h3 {
          color: var(--vscode-textPreformat-foreground);
        }
        ul {
          padding-left: 20px;
        }
        li {
          margin-bottom: 5px;
        }
        .template-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .template-actions {
          margin-top: 20px;
          display: flex;
          gap: 10px;
        }
        button {
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          padding: 8px 12px;
          cursor: pointer;
          border-radius: 2px;
        }
        button:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
        .template-description {
          font-style: italic;
          margin-bottom: 20px;
          color: var(--vscode-descriptionForeground);
        }
      </style>
    </head>
    <body>
      <div class="template-header">
        <h1>${template.name}</h1>
      </div>
      <div class="template-description">${template.description}</div>
      <div class="template-content">
        ${content}
      </div>
      <div class="template-actions">
        <button id="applyBtn">应用此模板</button>
        <button id="exportBtn">导出模板</button>
      </div>

      <script>
        const vscode = acquireVsCodeApi();

        document.getElementById('applyBtn').addEventListener('click', () => {
          vscode.postMessage({
            command: 'apply',
            template: ${JSON.stringify(template)}
          });
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
          vscode.postMessage({
            command: 'export',
            template: ${JSON.stringify(template)}
          });
        });
      </script>
    </body>
    </html>`;
  }

  /**
   * 处理来自WebView的消息
   * @param message 消息
   */
  private _handleMessage(message: WebviewMessage) {
    switch (message.command) {
      case 'apply':
        vscode.commands.executeCommand(
          'cursor-rules.applyTemplate',
          message.template
        );
        break;
      case 'export':
        vscode.commands.executeCommand(
          'cursor-rules.exportTemplate',
          message.template
        );
        break;
    }
  }

  /**
   * 释放资源
   */
  public dispose() {
    TemplatePreviewPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
