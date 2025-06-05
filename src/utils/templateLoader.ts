import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export interface Template {
  name: string;
  description: string;
  content: string;
  type?: 'cursorrules' | 'mdc';
  source?: 'builtin' | 'user';
}

interface TemplateContent {
  role?: string;
  goals?: string[];
  rules?: string[];
  best_practices?: string[];
  development_steps?: Record<string, string[]>;
  technical_specs?: Record<string, string[]>;
  development_tools?: Record<string, string[] | Record<string, string[]>>;
  project_structure?: Record<string, string[]>;
  communication_style?: Record<string, string>;
}

export class TemplateLoader {
  private static context: vscode.ExtensionContext;

  static setContext(context: vscode.ExtensionContext) {
    this.context = context;
  }

  static async loadTemplates(): Promise<Template[]> {
    try {
      // 加载内置模板
      const builtinTemplates = await this.loadBuiltinTemplates();

      // 加载用户自定义模板
      const userTemplates = await this.loadUserTemplates();

      // 合并模板，用户模板优先
      return [...userTemplates, ...builtinTemplates];
    } catch (error) {
      console.error('Failed to load templates:', error);
      throw error;
    }
  }

  // 从文件名生成模板名称
  private static generateTemplateNameFromFile(filename: string): string {
    // 直接返回文件名（去掉扩展名），不进行转换
    return path.basename(filename, '.mdc');
  }

  // 从 .mdc 内容中提取描述
  private static extractDescriptionFromMdc(content: string): string {
    const lines = content.split('\n');

    // 查找第一个 # 标题作为描述
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return trimmed.substring(2).trim();
      }
    }

    // 如果没找到标题，返回前50个字符作为描述
    const preview = content.replace(/\n/g, ' ').substring(0, 50);
    return preview.length === 50 ? preview + '...' : preview;
  }

  // 新增：删除 MDC 模板
  static async deleteMdcTemplate(templateName: string): Promise<void> {
    try {
      if (
        !vscode.workspace.workspaceFolders ||
        vscode.workspace.workspaceFolders.length === 0
      ) {
        throw new Error('没有打开的工作区');
      }

      const workspaceFolder = vscode.workspace.workspaceFolders[0];
      const cursorRulesPath = path.join(
        workspaceFolder.uri.fsPath,
        '.cursor',
        'rules'
      );

      // 查找对应的文件
      if (fs.existsSync(cursorRulesPath)) {
        const files = await fs.promises.readdir(cursorRulesPath);

        for (const file of files) {
          if (file.endsWith('.mdc')) {
            const generatedName = this.generateTemplateNameFromFile(file);
            if (generatedName === templateName) {
              const filePath = path.join(cursorRulesPath, file);
              await fs.promises.unlink(filePath);
              return;
            }
          }
        }
      }

      throw new Error(`未找到模板: ${templateName}`);
    } catch (error) {
      console.error('Failed to delete MDC template:', error);
      throw error;
    }
  }

  // 新增：通用删除模板方法
  static async deleteTemplate(template: Template): Promise<void> {
    try {
      // 内置模板不允许删除
      if (template.source === 'builtin') {
        throw new Error('内置模板不能删除');
      }

      // 用户自定义模板可以删除
      if (template.source === 'user') {
        const userTemplatesPath = path.join(
          this.context.globalStorageUri.fsPath,
          'templates'
        );

        if (template.type === 'mdc') {
          // 删除用户级别的 MDC 模板
          if (fs.existsSync(userTemplatesPath)) {
            const files = await fs.promises.readdir(userTemplatesPath);

            for (const file of files) {
              if (file.endsWith('.mdc')) {
                const generatedName = this.generateTemplateNameFromFile(file);
                if (generatedName === template.name) {
                  const filePath = path.join(userTemplatesPath, file);
                  await fs.promises.unlink(filePath);
                  return;
                }
              }
            }
          }
        } else {
          // 删除用户级别的 JSON 模板
          if (fs.existsSync(userTemplatesPath)) {
            const files = await fs.promises.readdir(userTemplatesPath);

            for (const file of files) {
              if (file.endsWith('.json')) {
                const content = await fs.promises.readFile(
                  path.join(userTemplatesPath, file),
                  'utf-8'
                );
                const templateData = JSON.parse(content);

                if (templateData.name === template.name) {
                  const filePath = path.join(userTemplatesPath, file);
                  await fs.promises.unlink(filePath);
                  return;
                }
              }
            }
          }
        }
      }

      throw new Error(`未找到模板: ${template.name}`);
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw error;
    }
  }

  private static async loadBuiltinTemplates(): Promise<Template[]> {
    try {
      const templatesPath = path.join(
        this.context.extensionPath,
        'src',
        'templates',
        'roles'
      );
      const files = await fs.promises.readdir(templatesPath);
      const templates: Template[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.promises.readFile(
            path.join(templatesPath, file),
            'utf-8'
          );
          const template = JSON.parse(content);
          const templateContent = this.extractContent(template.content);

          templates.push({
            name: template.name,
            description: template.description,
            content: templateContent,
            type: 'cursorrules',
            source: 'builtin',
          });
        }
      }

      return templates;
    } catch (error) {
      console.error('Failed to load builtin templates:', error);
      return [];
    }
  }

  private static async loadUserTemplates(): Promise<Template[]> {
    try {
      const userTemplatesPath = path.join(
        this.context.globalStorageUri.fsPath,
        'templates'
      );

      if (!fs.existsSync(userTemplatesPath)) {
        return [];
      }

      const files = await fs.promises.readdir(userTemplatesPath);
      const templates: Template[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.promises.readFile(
            path.join(userTemplatesPath, file),
            'utf-8'
          );
          const template = JSON.parse(content);
          const templateContent = this.extractContent(template.content);

          templates.push({
            name: template.name,
            description: template.description,
            content: templateContent,
            type: 'cursorrules',
            source: 'user',
          });
        } else if (file.endsWith('.mdc')) {
          // 新增：支持用户级别的 .mdc 模板
          const content = await fs.promises.readFile(
            path.join(userTemplatesPath, file),
            'utf-8'
          );

          const templateName = this.generateTemplateNameFromFile(file);
          const description = this.extractDescriptionFromMdc(content);

          templates.push({
            name: templateName,
            description: description,
            content: content,
            type: 'mdc',
            source: 'user',
          });
        }
      }

      return templates;
    } catch (error) {
      console.error('Failed to load user templates:', error);
      return [];
    }
  }

  private static extractContent(content: TemplateContent | string): string {
    if (typeof content === 'string') {
      return content;
    }

    if (content && typeof content === 'object') {
      const sections: string[] = [];

      // 添加角色定位
      if (content.role) {
        sections.push(`# 角色定位\n${content.role}`);
      }

      // 添加目标
      if (content.goals) {
        sections.push(
          `# 目标\n${content.goals
            .map((goal: string) => `- ${goal}`)
            .join('\n')}`
        );
      }

      // 添加规则
      if (content.rules) {
        sections.push(
          `## 规则\n${content.rules
            .map((rule: string) => `- ${rule}`)
            .join('\n')}`
        );
      }

      // 添加最佳实践
      if (content.best_practices) {
        sections.push(
          `## 最佳实践\n${content.best_practices
            .map((practice: string) => `- ${practice}`)
            .join('\n')}`
        );
      }

      // 添加开发步骤
      if (
        content.development_steps &&
        typeof content.development_steps === 'object'
      ) {
        sections.push('## 开发步骤');
        for (const [key, value] of Object.entries(content.development_steps)) {
          if (Array.isArray(value)) {
            sections.push(
              `### ${this.formatTitle(key)}\n${value
                .map((item: string) => `- ${item}`)
                .join('\n')}`
            );
          }
        }
      }

      // 添加技术规范
      if (
        content.technical_specs &&
        typeof content.technical_specs === 'object'
      ) {
        sections.push('## 技术规范');
        for (const [key, value] of Object.entries(content.technical_specs)) {
          if (Array.isArray(value)) {
            sections.push(
              `### ${this.formatTitle(key)}\n${value
                .map((item: string) => `- ${item}`)
                .join('\n')}`
            );
          }
        }
      }

      // 添加开发工具
      if (
        content.development_tools &&
        typeof content.development_tools === 'object'
      ) {
        sections.push('## 开发工具');
        for (const [key, value] of Object.entries(content.development_tools)) {
          if (Array.isArray(value)) {
            sections.push(
              `### ${this.formatTitle(key)}\n${value
                .map((item: string) => `- ${item}`)
                .join('\n')}`
            );
          } else if (value && typeof value === 'object') {
            sections.push(`### ${this.formatTitle(key)}`);
            for (const [subKey, subValue] of Object.entries(value)) {
              if (Array.isArray(subValue)) {
                sections.push(
                  `#### ${this.formatTitle(subKey)}\n${subValue
                    .map((item: string) => `- ${item}`)
                    .join('\n')}`
                );
              }
            }
          }
        }
      }

      // 添加项目结构
      if (
        content.project_structure &&
        typeof content.project_structure === 'object'
      ) {
        sections.push('## 项目结构');
        for (const [key, value] of Object.entries(content.project_structure)) {
          if (Array.isArray(value)) {
            sections.push(
              `### ${this.formatTitle(key)}\n${value
                .map((item: string) => `- ${item}`)
                .join('\n')}`
            );
          }
        }
      }

      // 添加沟通风格
      if (
        content.communication_style &&
        typeof content.communication_style === 'object'
      ) {
        sections.push('## 沟通风格');
        for (const [key, value] of Object.entries(
          content.communication_style
        )) {
          sections.push(`### ${this.formatTitle(key)}\n- ${value}`);
        }
      }
      return sections.join('\n\n');
    }

    return '';
  }

  private static formatTitle(key: string): string {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // 新增：保存用户级别的 MDC 模板
  static async saveUserMdcTemplate(
    templateName: string,
    content: string
  ): Promise<void> {
    try {
      const userTemplatesPath = path.join(
        this.context.globalStorageUri.fsPath,
        'templates'
      );

      // 确保目录存在
      if (!fs.existsSync(userTemplatesPath)) {
        fs.mkdirSync(userTemplatesPath, { recursive: true });
      }

      // 生成文件名（将空格替换为连字符，转为小写）
      const fileName =
        templateName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '') + '.mdc';
      const filePath = path.join(userTemplatesPath, fileName);

      await fs.promises.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      console.error('Failed to save user MDC template:', error);
      throw error;
    }
  }
}
