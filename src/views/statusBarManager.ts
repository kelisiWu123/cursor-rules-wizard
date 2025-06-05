import * as vscode from 'vscode';

/**
 * 状态栏管理器
 */
export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;
  private context: vscode.ExtensionContext;

  /**
   * 构造函数
   * @param context 扩展上下文
   */
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'cursor-rules.applyTemplate';
    this.statusBarItem.text = '$(wand) Cursor Rules';
    this.statusBarItem.tooltip = '应用 Cursor Rules 模板';

    // 注册配置变更事件
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(
        this.onConfigurationChanged,
        this
      )
    );

    // 初始化状态栏
    this.updateVisibility();

    // 添加到订阅中
    context.subscriptions.push(this.statusBarItem);
  }

  /**
   * 配置变更事件处理
   * @param event 配置变更事件
   */
  private onConfigurationChanged(event: vscode.ConfigurationChangeEvent): void {
    if (event.affectsConfiguration('cursor-rules.showInStatusBar')) {
      this.updateVisibility();
    }
  }

  /**
   * 更新状态栏可见性
   */
  private updateVisibility(): void {
    const showInStatusBar = vscode.workspace
      .getConfiguration('cursor-rules')
      .get('showInStatusBar', true);

    if (showInStatusBar) {
      this.statusBarItem.show();
    } else {
      this.statusBarItem.hide();
    }
  }

  /**
   * 显示状态栏项
   */
  public show(): void {
    this.statusBarItem.show();
  }

  /**
   * 隐藏状态栏项
   */
  public hide(): void {
    this.statusBarItem.hide();
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    this.statusBarItem.dispose();
  }
}
