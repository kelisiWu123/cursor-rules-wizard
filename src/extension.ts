import * as vscode from 'vscode';
import { registerEnhancedTemplateCommands } from './commands/enhancedTemplateCommands';
import { registerTemplateCommands } from './commands/templateCommands';
import { TemplateLoader } from './utils/templateLoader';
import { StatusBarManager } from './views/statusBarManager';
import { TemplateViewProvider } from './views/templateViewProvider';

export function activate(context: vscode.ExtensionContext) {
  try {
    console.log('Activating Cursor Rules Template extension');

    // 确保扩展存储目录存在
    const storageUri = context.globalStorageUri;
    const fs = require('fs');
    if (!fs.existsSync(storageUri.fsPath)) {
      fs.mkdirSync(storageUri.fsPath, { recursive: true });
    }

    // 设置模板加载器上下文
    TemplateLoader.setContext(context);

    // 注册模板视图提供者
    const templateViewProvider = new TemplateViewProvider(context);
    const templateTreeView = vscode.window.createTreeView(
      'cursorRulesTemplates',
      {
        treeDataProvider: templateViewProvider,
        showCollapseAll: true,
      }
    );

    // 注册状态栏
    const statusBarManager = new StatusBarManager(context);
    context.subscriptions.push(statusBarManager);

    // 注册命令
    registerTemplateCommands(context, templateViewProvider);
    registerEnhancedTemplateCommands(context, templateViewProvider);

    // 添加到订阅中
    context.subscriptions.push(templateTreeView);

    console.log('Cursor Rules Template extension activated successfully');
  } catch (error) {
    console.error('Failed to activate Cursor Rules Template extension:', error);
    vscode.window.showErrorMessage('Cursor Rules Template 插件激活失败');
    throw error;
  }
}

export function deactivate() {
  console.log('Deactivating Cursor Rules Template extension');
}
