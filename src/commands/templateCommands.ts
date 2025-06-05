import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { createCursorRuleFile } from '../utils/fileUtils';
import { TemplateLoader } from '../utils/templateLoader';
import { TemplateViewProvider } from '../views/templateViewProvider';

export function registerTemplateCommands(
  context: vscode.ExtensionContext,
  templateViewProvider?: TemplateViewProvider
) {
  // 设置上下文
  TemplateLoader.setContext(context);

  // 注册应用模板命令
  const applyTemplateDisposable = vscode.commands.registerCommand(
    'cursor-rules.applyTemplate',
    async () => {
      try {
        const templates = await TemplateLoader.loadTemplates(); // 使用新的 TemplateLoader

        if (templates.length === 0) {
          vscode.window.showErrorMessage('没有可用的模板');
          return;
        }

        const selected = await vscode.window.showQuickPick(
          templates.map(template => ({
            label: template.name,
            description: template.description,
            detail: `类型: ${template.type || 'cursorrules'} | 来源: ${
              template.source || 'unknown'
            }`,
            template: template,
          })),
          {
            placeHolder: '选择一个模板',
          }
        );

        if (selected) {
          try {
            // 根据模板类型决定创建方式
            if (selected.template.type === 'mdc') {
              await createMdcRuleFile(
                selected.template.content,
                selected.template.name
              );
              vscode.window.showInformationMessage(
                `成功创建 ${selected.label} MDC 模板`
              );
            } else {
              await createCursorRuleFile(selected.template.content);
              vscode.window.showInformationMessage(
                `成功创建 ${selected.label} 模板`
              );
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : '未知错误';
            vscode.window.showErrorMessage(`创建模板失败: ${errorMessage}`);
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';
        vscode.window.showErrorMessage(`加载模板失败: ${errorMessage}`);
      }
    }
  );

  // 注册保存 .cursorrules 模板命令
  const saveTemplateDisposable = vscode.commands.registerCommand(
    'cursor-rules.saveAsTemplate',
    async (uri: vscode.Uri) => {
      try {
        if (!uri) {
          vscode.window.showErrorMessage(
            '请在 .cursorrules 文件上右键选择此命令'
          );
          return;
        }

        // 读取文件内容
        const content = await fs.promises.readFile(uri.fsPath, 'utf-8');

        // 获取模板名称
        const templateName = await vscode.window.showInputBox({
          prompt: '请输入模板名称',
          placeHolder: '例如：My Custom Template',
          validateInput: value => {
            if (!value) {
              return '模板名称不能为空';
            }
            if (value.length > 50) {
              return '模板名称不能超过50个字符';
            }
            return null;
          },
        });

        if (!templateName) {
          return;
        }

        // 获取模板描述
        const templateDescription = await vscode.window.showInputBox({
          prompt: '请输入模板描述',
          placeHolder: '例如：这是一个自定义的模板',
        });

        if (!templateDescription) {
          return;
        }

        // 构建模板对象
        const template = {
          name: templateName,
          description: templateDescription,
          content: content,
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
          `${templateName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
        );
        await fs.promises.writeFile(
          templatePath,
          JSON.stringify(template, null, 2),
          'utf-8'
        );

        vscode.window.showInformationMessage(`模板 "${templateName}" 保存成功`);

        // 刷新模板视图
        if (templateViewProvider) {
          templateViewProvider.refresh();
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';
        vscode.window.showErrorMessage(`保存模板失败: ${errorMessage}`);
      }
    }
  );

  // 修改：保存 .mdc 模板命令 - 保存到用户目录
  const saveMdcTemplateDisposable = vscode.commands.registerCommand(
    'cursor-rules.saveAsMdcTemplate',
    async (uri: vscode.Uri) => {
      try {
        if (!uri) {
          vscode.window.showErrorMessage('请在 .mdc 文件上右键选择此命令');
          return;
        }

        // 读取文件内容
        const content = await fs.promises.readFile(uri.fsPath, 'utf-8');

        // 获取模板名称
        const templateName = await vscode.window.showInputBox({
          prompt: '请输入模板名称',
          placeHolder: '例如：My Custom MDC Template',
          validateInput: value => {
            if (!value) {
              return '模板名称不能为空';
            }
            if (value.length > 50) {
              return '模板名称不能超过50个字符';
            }
            return null;
          },
        });

        if (!templateName) {
          return;
        }

        try {
          await TemplateLoader.saveUserMdcTemplate(templateName, content);
          vscode.window.showInformationMessage(
            `MDC 模板 "${templateName}" 已保存到用户模板库`
          );

          // 刷新模板视图
          if (templateViewProvider) {
            templateViewProvider.refresh();
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : '未知错误';
          vscode.window.showErrorMessage(`保存 MDC 模板失败: ${errorMessage}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';
        vscode.window.showErrorMessage(`保存 MDC 模板失败: ${errorMessage}`);
      }
    }
  );

  // 注册在文件夹中创建模板文件的命令
  const createFromTemplateDisposable = vscode.commands.registerCommand(
    'cursor-rules.createFromTemplate',
    async (uri: vscode.Uri) => {
      try {
        if (!uri) {
          vscode.window.showErrorMessage('请在文件夹上右键选择此命令');
          return;
        }

        const templates = await TemplateLoader.loadTemplates();

        if (templates.length === 0) {
          vscode.window.showErrorMessage('没有可用的模板');
          return;
        }

        // 选择模板
        const selected = await vscode.window.showQuickPick(
          templates.map(template => ({
            label: template.name,
            description: template.description,
            detail: `类型: ${template.type || 'cursorrules'} | 来源: ${
              template.source || 'unknown'
            }`,
            template: template,
          })),
          {
            placeHolder: '选择要创建的模板',
          }
        );

        if (selected) {
          try {
            let targetPath: string;
            let fileName: string;

            // 根据模板类型决定文件路径和名称
            if (selected.template.type === 'mdc') {
              // 创建 .cursor/rules 目录
              const cursorRulesDir = path.join(uri.fsPath, '.cursor', 'rules');
              if (!fs.existsSync(cursorRulesDir)) {
                fs.mkdirSync(cursorRulesDir, { recursive: true });
              }

              // 生成 MDC 文件名
              fileName =
                selected.template.name
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z0-9-]/g, '') + '.mdc';
              targetPath = path.join(cursorRulesDir, fileName);
            } else {
              // 传统的 .cursorrules 文件
              fileName = '.cursorrules';
              targetPath = path.join(uri.fsPath, fileName);
            }

            // 检查文件是否已存在
            if (fs.existsSync(targetPath)) {
              const overwrite = await vscode.window.showWarningMessage(
                `该位置已存在 ${fileName} 文件，是否覆盖？`,
                '覆盖',
                '取消'
              );
              if (overwrite !== '覆盖') {
                return;
              }
            }

            // 写入文件
            await fs.promises.writeFile(
              targetPath,
              selected.template.content,
              'utf-8'
            );

            // 打开新创建的文件
            const document =
              await vscode.workspace.openTextDocument(targetPath);
            await vscode.window.showTextDocument(document);

            vscode.window.showInformationMessage(
              `成功创建 ${selected.label} 模板文件`
            );
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : '未知错误';
            vscode.window.showErrorMessage(`创建模板文件失败: ${errorMessage}`);
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';
        vscode.window.showErrorMessage(`加载模板失败: ${errorMessage}`);
      }
    }
  );

  // 修改：创建新的 MDC 模板文件命令 - 从模板列表选择
  const createNewMdcTemplateDisposable = vscode.commands.registerCommand(
    'cursor-rules.createNewMdcTemplate',
    async (uri?: vscode.Uri) => {
      try {
        // 获取工作区文件夹
        if (
          !vscode.workspace.workspaceFolders ||
          vscode.workspace.workspaceFolders.length === 0
        ) {
          vscode.window.showErrorMessage('请打开一个工作区');
          return;
        }

        const workspaceFolder = uri
          ? vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath
          : vscode.workspace.workspaceFolders[0].uri.fsPath;

        if (!workspaceFolder) {
          vscode.window.showErrorMessage('无法确定工作区位置');
          return;
        }

        // 加载所有可用模板
        const templates = await TemplateLoader.loadTemplates();

        if (templates.length === 0) {
          vscode.window.showErrorMessage('没有可用的模板');
          return;
        }

        // 选择模板
        const selected = await vscode.window.showQuickPick(
          templates.map(template => ({
            label: template.name,
            description: template.description,
            detail: `类型: ${template.type || 'cursorrules'} | 来源: ${
              template.source || 'unknown'
            }`,
            template: template,
          })),
          {
            placeHolder: '选择要创建的 MDC 模板',
          }
        );

        if (!selected) {
          return;
        }

        // 获取自定义模板名称
        const customName = await vscode.window.showInputBox({
          prompt: '请输入 MDC 模板的文件名称',
          placeHolder: '例如：custom-rule（不需要输入 .mdc 扩展名）',
          value: selected.template.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, ''),
          validateInput: value => {
            if (!value) {
              return '文件名不能为空';
            }
            if (!/^[a-z0-9-]+$/.test(value)) {
              return '文件名只能包含小写字母、数字和连字符';
            }
            return null;
          },
        });

        if (!customName) {
          return;
        }

        // 创建 .cursor/rules 目录
        const cursorRulesDir = path.join(workspaceFolder, '.cursor', 'rules');
        if (!fs.existsSync(cursorRulesDir)) {
          fs.mkdirSync(cursorRulesDir, { recursive: true });
        }

        // 生成文件名
        const fileName = `${customName}.mdc`;
        const filePath = path.join(cursorRulesDir, fileName);

        // 检查文件是否已存在
        if (fs.existsSync(filePath)) {
          const overwrite = await vscode.window.showWarningMessage(
            `文件 ${fileName} 已存在，是否覆盖？`,
            '覆盖',
            '取消'
          );
          if (overwrite !== '覆盖') {
            return;
          }
        }

        // 写入模板内容
        await fs.promises.writeFile(
          filePath,
          selected.template.content,
          'utf-8'
        );

        // 打开新创建的文件
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);

        vscode.window.showInformationMessage(
          `成功基于 "${selected.template.name}" 创建 MDC 模板: ${fileName}`
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';
        vscode.window.showErrorMessage(`创建 MDC 模板失败: ${errorMessage}`);
      }
    }
  );

  context.subscriptions.push(
    applyTemplateDisposable,
    saveTemplateDisposable,
    saveMdcTemplateDisposable,
    createFromTemplateDisposable,
    createNewMdcTemplateDisposable
  );
}

// 新增：创建 MDC 规则文件的辅助函数
async function createMdcRuleFile(
  content: string,
  templateName: string
): Promise<void> {
  if (
    !vscode.workspace.workspaceFolders ||
    vscode.workspace.workspaceFolders.length === 0
  ) {
    throw new Error('没有打开的工作区，无法创建 MDC 规则文件');
  }

  const workspaceFolder = vscode.workspace.workspaceFolders[0];
  const cursorRulesDir = path.join(
    workspaceFolder.uri.fsPath,
    '.cursor',
    'rules'
  );

  // 确保目录存在
  if (!fs.existsSync(cursorRulesDir)) {
    fs.mkdirSync(cursorRulesDir, { recursive: true });
  }

  // 使用模板名称作为默认文件名
  const fileName =
    templateName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') || 'rule';

  // 让用户确认或修改文件名
  const userFileName = await vscode.window.showInputBox({
    prompt: '请输入 MDC 文件名称',
    placeHolder: '例如：custom-rule（不需要输入 .mdc 扩展名）',
    value: fileName,
    validateInput: value => {
      if (!value) {
        return '文件名不能为空';
      }
      if (!/^[a-z0-9-_]+$/.test(value)) {
        return '文件名只能包含小写字母、数字、连字符和下划线';
      }
      return null;
    },
  });

  if (!userFileName) {
    throw new Error('用户取消了文件名输入');
  }

  const filePath = path.join(cursorRulesDir, `${userFileName}.mdc`);

  // 检查文件是否已存在，如果存在则询问是否覆盖
  if (fs.existsSync(filePath)) {
    const overwrite = await vscode.window.showWarningMessage(
      `文件 ${userFileName}.mdc 已存在，是否覆盖？`,
      '覆盖',
      '取消'
    );

    if (overwrite !== '覆盖') {
      throw new Error('用户取消了覆盖操作');
    }
  }

  await fs.promises.writeFile(filePath, content, 'utf-8');

  // 打开新创建的文件
  const document = await vscode.workspace.openTextDocument(filePath);
  await vscode.window.showTextDocument(document);
}
