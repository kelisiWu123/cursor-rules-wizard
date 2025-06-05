import * as vscode from 'vscode';
import { Template, TemplateLoader } from '../utils/templateLoader';

/**
 * 模板分类配置接口
 */
interface TemplateCategories {
  [key: string]: string[];
}

/**
 * 模板项类型
 */
export enum TemplateItemType {
  Category = 'category',
  BuiltinTemplate = 'builtinTemplate',
  UserTemplate = 'userTemplate',
  FavoriteTemplate = 'favoriteTemplate',
}

/**
 * 模板树项
 */
export class TemplateTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly type: TemplateItemType,
    public readonly template?: Template,
    public readonly isFavorite: boolean = false
  ) {
    super(label, collapsibleState);

    // 设置上下文
    this.contextValue = type;

    // 设置图标和描述
    this.setIconAndDescription();

    // 设置描述和工具提示
    if (template) {
      this.description = this.getTemplateDescription(template);
      this.tooltip = this.getTemplateTooltip(template);
    }

    // 设置收藏图标
    if (template && isFavorite) {
      this.iconPath = new vscode.ThemeIcon('star-full');
    }
  }

  private setIconAndDescription(): void {
    switch (this.type) {
      case TemplateItemType.Category:
        this.iconPath = new vscode.ThemeIcon('folder');
        break;
      case TemplateItemType.BuiltinTemplate:
        this.iconPath = new vscode.ThemeIcon('file');
        break;
      case TemplateItemType.UserTemplate:
        this.iconPath = new vscode.ThemeIcon('file-code');
        break;
      case TemplateItemType.FavoriteTemplate:
        this.iconPath = new vscode.ThemeIcon('star-full');
        break;
    }
  }

  private getTemplateDescription(template: Template): string {
    const typeLabel = template.type === 'mdc' ? 'MDC' : 'Rules';
    const sourceLabel = template.source === 'user' ? '用户' : '内置';
    return `${typeLabel} | ${sourceLabel}`;
  }

  private getTemplateTooltip(template: Template): string {
    const lines = [
      `名称: ${template.name}`,
      `描述: ${template.description}`,
      `类型: ${template.type === 'mdc' ? 'MDC 文件' : 'Cursor Rules 文件'}`,
      `来源: ${template.source === 'user' ? '用户自定义' : '内置模板'}`,
    ];
    return lines.join('\n');
  }
}

/**
 * 模板视图提供者
 */
export class TemplateViewProvider
  implements vscode.TreeDataProvider<TemplateTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    TemplateTreeItem | undefined | null | void
  > = new vscode.EventEmitter<TemplateTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    TemplateTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private context: vscode.ExtensionContext;
  private templates: Template[] = [];
  private favoriteTemplates: string[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.loadFavorites();
  }

  /**
   * 刷新视图
   */
  refresh(): void {
    this.loadFavorites();
    // 清空模板缓存，强制重新加载
    this.templates = [];
    this._onDidChangeTreeData.fire();
  }

  /**
   * 加载收藏模板
   */
  private loadFavorites(): void {
    this.favoriteTemplates = vscode.workspace
      .getConfiguration('cursor-rules')
      .get('favoriteTemplates', []);
  }

  /**
   * 切换模板收藏状态
   * @param item 模板项
   */
  async toggleFavorite(item: TemplateTreeItem): Promise<void> {
    if (!item.template) {
      return;
    }

    const templateName = item.template.name;
    const favorites = [...this.favoriteTemplates];

    const index = favorites.indexOf(templateName);
    if (index >= 0) {
      favorites.splice(index, 1);
    } else {
      favorites.push(templateName);
    }

    await vscode.workspace
      .getConfiguration('cursor-rules')
      .update(
        'favoriteTemplates',
        favorites,
        vscode.ConfigurationTarget.Global
      );
    this.refresh();
  }

  /**
   * 删除模板
   * @param item 模板项
   */
  async deleteTemplate(item: TemplateTreeItem): Promise<void> {
    if (!item.template) {
      return;
    }

    // 内置模板不允许删除
    if (item.template.source === 'builtin') {
      vscode.window.showErrorMessage('内置模板不能删除');
      return;
    }

    // 确认删除
    const result = await vscode.window.showWarningMessage(
      `确定要删除模板 "${item.template.name}" 吗？此操作不可撤销。`,
      { modal: true },
      '删除',
      '取消'
    );

    if (result !== '删除') {
      return;
    }

    try {
      // 调用 TemplateLoader 的删除方法
      await TemplateLoader.deleteTemplate(item.template);

      // 如果模板在收藏列表中，也要移除
      const favorites = [...this.favoriteTemplates];
      const index = favorites.indexOf(item.template.name);
      if (index >= 0) {
        favorites.splice(index, 1);
        await vscode.workspace
          .getConfiguration('cursor-rules')
          .update(
            'favoriteTemplates',
            favorites,
            vscode.ConfigurationTarget.Global
          );
      }

      // 刷新视图
      this.templates = []; // 清空缓存，强制重新加载
      this.refresh();

      vscode.window.showInformationMessage(
        `模板 "${item.template.name}" 已删除`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      vscode.window.showErrorMessage(`删除模板失败: ${errorMessage}`);
    }
  }

  /**
   * 获取树项
   * @param element 元素
   */
  getTreeItem(element: TemplateTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * 获取子项
   * @param element 元素
   */
  async getChildren(element?: TemplateTreeItem): Promise<TemplateTreeItem[]> {
    // 加载模板
    if (this.templates.length === 0) {
      this.templates = await TemplateLoader.loadTemplates();
    }

    // 根节点
    if (!element) {
      // 获取分类配置
      const categories = vscode.workspace
        .getConfiguration('cursor-rules')
        .get<TemplateCategories>('templateCategories', {
          常用: [],
          开发: [],
          游戏: [],
          其他: [],
        });

      // 创建收藏分类
      const items: TemplateTreeItem[] = [];

      // 添加收藏分类
      if (this.favoriteTemplates.length > 0) {
        items.push(
          new TemplateTreeItem(
            '收藏',
            vscode.TreeItemCollapsibleState.Expanded,
            TemplateItemType.Category
          )
        );
      }

      // 添加其他分类
      for (const category of Object.keys(categories)) {
        items.push(
          new TemplateTreeItem(
            category,
            vscode.TreeItemCollapsibleState.Collapsed,
            TemplateItemType.Category
          )
        );
      }

      return items;
    }

    // 分类节点
    if (element.type === TemplateItemType.Category) {
      const categoryName = element.label;

      // 收藏分类
      if (categoryName === '收藏') {
        return this.templates
          .filter(template => this.favoriteTemplates.includes(template.name))
          .map(template => {
            return new TemplateTreeItem(
              template.name,
              vscode.TreeItemCollapsibleState.None,
              this.getTemplateItemType(template),
              template,
              true
            );
          });
      }

      // 其他分类
      const categories = vscode.workspace
        .getConfiguration('cursor-rules')
        .get<TemplateCategories>('templateCategories', {});
      const categoryTemplates = categories[categoryName] || [];

      // 获取分类中的模板
      return this.templates
        .filter(template => {
          // 如果分类是"其他"，则显示未分类的模板
          if (categoryName === '其他') {
            for (const cat of Object.keys(categories)) {
              if (cat !== '其他' && categories[cat].includes(template.name)) {
                return false;
              }
            }
            return true;
          }

          return categoryTemplates.includes(template.name);
        })
        .map(template => {
          const isFavorite = this.favoriteTemplates.includes(template.name);

          return new TemplateTreeItem(
            template.name,
            vscode.TreeItemCollapsibleState.None,
            this.getTemplateItemType(template),
            template,
            isFavorite
          );
        });
    }

    return [];
  }

  /**
   * 根据模板信息确定模板项类型
   * @param template 模板
   * @returns 模板项类型
   */
  private getTemplateItemType(template: Template): TemplateItemType {
    if (template.source === 'user') {
      return TemplateItemType.UserTemplate;
    }

    return TemplateItemType.BuiltinTemplate;
  }
}
