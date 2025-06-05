import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export async function createCursorRuleFile(content: string): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders) {
    throw new Error('没有打开的工作区');
  }

  const rootPath = workspaceFolders[0].uri.fsPath;
  const filePath = path.join(rootPath, '.cursorrules');

  try {
    // 检查文件是否已存在
    if (fs.existsSync(filePath)) {
      const answer = await vscode.window.showWarningMessage(
        '.cursorrules 文件已存在，是否覆盖？',
        '是',
        '否'
      );

      if (answer !== '是') {
        return;
      }
    }

    fs.writeFileSync(filePath, content, 'utf8');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw new Error(`无法创建文件: ${errorMessage}`);
  }
}
