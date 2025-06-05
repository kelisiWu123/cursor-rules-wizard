import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Template, TemplateLoader } from '../utils/templateLoader';
import { TemplatePreviewPanel } from '../views/templatePreview';
import {
  TemplateTreeItem,
  TemplateViewProvider,
} from '../views/templateViewProvider';

/**
 * 注册增强的模板命令
 * @param context 扩展上下文
 * @param treeProvider 模板树提供者
 */
export function registerEnhancedTemplateCommands(
  context: vscode.ExtensionContext,
  treeProvider: TemplateViewProvider
): void {
  // 预览模板命令
  const previewTemplateDisposable = vscode.commands.registerCommand(
    'cursor-rules.previewTemplate',
    async (item: TemplateTreeItem) => {
      if (!item || !item.template) {
        const templates = await TemplateLoader.loadTemplates();
        if (templates.length === 0) {
          vscode.window.showErrorMessage('没有可用的模板');
          return;
        }

        const selected = await vscode.window.showQuickPick(
          templates.map(template => ({
            label: template.name,
            description: template.description,
            template: template,
          })),
          {
            placeHolder: '选择要预览的模板',
          }
        );

        if (selected) {
          TemplatePreviewPanel.createOrShow(
            context.extensionUri,
            selected.template
          );
        }
      } else {
        TemplatePreviewPanel.createOrShow(context.extensionUri, item.template);
      }
    }
  );

  // 编辑模板命令
  const editTemplateDisposable = vscode.commands.registerCommand(
    'cursor-rules.editTemplate',
    async (item?: TemplateTreeItem | vscode.Uri) => {
      try {
        // 只处理从模板树视图调用的情况
        if (!item || !('template' in item) || !item.template) {
          vscode.window.showErrorMessage(
            '请在模板树视图中选择用户模板进行编辑'
          );
          return;
        }

        // 只允许编辑用户模板
        if (item.type !== 'userTemplate') {
          vscode.window.showErrorMessage('只能编辑用户自定义模板');
          return;
        }

        // 获取模板文件路径
        const templateDir = path.join(
          context.globalStorageUri.fsPath,
          'templates'
        );

        let templatePath: string;

        // 根据模板类型决定文件路径
        if (item.template.type === 'mdc') {
          // MDC 模板文件 - 直接使用模板名称作为文件名
          const fileName = `${item.template.name}.mdc`;
          templatePath = path.join(templateDir, fileName);
        } else {
          // JSON 模板文件
          templatePath = path.join(
            templateDir,
            `${item.template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
          );
        }

        // 检查文件是否存在
        if (!fs.existsSync(templatePath)) {
          vscode.window.showErrorMessage('模板文件不存在');
          return;
        }

        // 打开文件进行编辑
        const document = await vscode.workspace.openTextDocument(templatePath);
        await vscode.window.showTextDocument(document);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';
        vscode.window.showErrorMessage(`编辑模板失败: ${errorMessage}`);
      }
    }
  );

  // 导出模板命令
  const exportTemplateDisposable = vscode.commands.registerCommand(
    'cursor-rules.exportTemplate',
    async (item: TemplateTreeItem | Template) => {
      try {
        let template: Template | undefined;

        if (!item) {
          // 如果没有提供模板，则从列表中选择
          const templates = await TemplateLoader.loadTemplates();
          if (templates.length === 0) {
            vscode.window.showErrorMessage('没有可用的模板');
            return;
          }

          const selected = await vscode.window.showQuickPick(
            templates.map(t => ({
              label: t.name,
              description: t.description,
              template: t,
            })),
            {
              placeHolder: '选择要导出的模板',
            }
          );

          if (selected) {
            template = selected.template;
          } else {
            return;
          }
        } else if ('template' in item && item.template) {
          // 如果是树项，则使用其模板
          template = item.template;
        } else if ('name' in item && 'content' in item) {
          // 如果直接是模板对象
          template = item as Template;
        }

        if (!template) {
          vscode.window.showErrorMessage('无法获取模板信息');
          return;
        }

        // 选择保存位置
        const uri = await vscode.window.showSaveDialog({
          defaultUri: vscode.Uri.file(
            `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
          ),
          filters: {
            'JSON 文件': ['json'],
            所有文件: ['*'],
          },
          title: '导出模板',
          saveLabel: '导出',
        });

        if (uri) {
          // 写入文件
          await fs.promises.writeFile(
            uri.fsPath,
            JSON.stringify(
              {
                name: template.name,
                description: template.description,
                content: template.content,
                version: '1.0.0',
              },
              null,
              2
            ),
            'utf-8'
          );

          vscode.window.showInformationMessage(
            `模板 "${template.name}" 已成功导出`
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';
        vscode.window.showErrorMessage(`导出模板失败: ${errorMessage}`);
      }
    }
  );

  // 导入模板命令
  const importTemplateDisposable = vscode.commands.registerCommand(
    'cursor-rules.importTemplate',
    async () => {
      try {
        // 选择要导入的文件
        const uris = await vscode.window.showOpenDialog({
          canSelectMany: false,
          filters: {
            'JSON 文件': ['json'],
            所有文件: ['*'],
          },
          title: '导入模板',
          openLabel: '导入',
        });

        if (!uris || uris.length === 0) {
          return;
        }

        // 读取文件内容
        const content = await fs.promises.readFile(uris[0].fsPath, 'utf-8');
        const templateData = JSON.parse(content);

        // 验证模板格式
        if (
          !templateData.name ||
          !templateData.description ||
          !templateData.content
        ) {
          vscode.window.showErrorMessage('无效的模板文件格式');
          return;
        }

        // 构建模板对象
        const template: Template = {
          name: templateData.name,
          description: templateData.description,
          content:
            typeof templateData.content === 'string'
              ? templateData.content
              : JSON.stringify(templateData.content),
        };

        // 保存模板到用户目录
        const templateDir = path.join(
          context.globalStorageUri.fsPath,
          'templates'
        );
        if (!fs.existsSync(templateDir)) {
          fs.mkdirSync(templateDir, { recursive: true });
        }

        const templatePath = path.join(
          templateDir,
          `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
        );

        // 检查是否已存在同名模板
        if (fs.existsSync(templatePath)) {
          const overwrite = await vscode.window.showWarningMessage(
            `已存在名为 "${template.name}" 的模板，是否覆盖？`,
            '覆盖',
            '取消'
          );

          if (overwrite !== '覆盖') {
            return;
          }
        }

        // 写入模板文件
        await fs.promises.writeFile(
          templatePath,
          JSON.stringify(template, null, 2),
          'utf-8'
        );

        // 刷新模板视图
        treeProvider.refresh();

        vscode.window.showInformationMessage(
          `模板 "${template.name}" 已成功导入`
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';
        vscode.window.showErrorMessage(`导入模板失败: ${errorMessage}`);
      }
    }
  );

  // 切换收藏状态命令
  const toggleFavoriteDisposable = vscode.commands.registerCommand(
    'cursor-rules.toggleFavorite',
    async (item: TemplateTreeItem) => {
      if (!item || !item.template) {
        vscode.window.showErrorMessage('请在模板上右键选择此命令');
        return;
      }

      await treeProvider.toggleFavorite(item);
    }
  );

  // 删除模板命令
  const deleteTemplateDisposable = vscode.commands.registerCommand(
    'cursor-rules.deleteTemplate',
    async (item: TemplateTreeItem) => {
      if (!item || !item.template) {
        vscode.window.showErrorMessage('请在模板上右键选择此命令');
        return;
      }

      await treeProvider.deleteTemplate(item);
    }
  );

  // 管理模板命令
  const manageTemplatesDisposable = vscode.commands.registerCommand(
    'cursor-rules.manageTemplates',
    async () => {
      // 打开模板视图
      await vscode.commands.executeCommand(
        'workbench.view.extension.cursor-rules-explorer'
      );
    }
  );

  // 注册命令
  context.subscriptions.push(
    previewTemplateDisposable,
    editTemplateDisposable,
    exportTemplateDisposable,
    importTemplateDisposable,
    toggleFavoriteDisposable,
    deleteTemplateDisposable,
    manageTemplatesDisposable
  );
}
