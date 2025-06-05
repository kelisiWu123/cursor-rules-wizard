# Cursor Rules Template

A VSCode extension for managing and applying .cursorrules templates and .cursor/rules MDC files.

Cursor Rules Template Manager

## Features | 功能

- Apply predefined .cursorrules templates | 应用预定义的 .cursorrules 模板
- **NEW**: Support for .cursor/rules directory with MDC files | **新功能**：支持 .cursor/rules 目录中的 MDC 文件
- Save custom .cursorrules templates | 保存自定义的 .cursorrules 模板
- **NEW**: Save and manage MDC templates | **新功能**：保存和删除 MDC 模板
- Multiple role templates available | 提供多个角色模板
- Easy to use command palette integration | 易于使用的命令面板集成
- Template preview | 模板预览功能
- Template categories | 模板分类管理
- Template favorites | 收藏喜爱的模板
- Template import/export | 导入导出模板
- Status bar integration | 状态栏快速访问
- Keyboard shortcuts | 键盘快捷键支持
- Template management UI | 模板管理界面
- **NEW**: Workspace-level MDC templates | **新功能**：工作区级别的 MDC 模板

## Supported File Formats | 支持的文件格式

### Traditional .cursorrules Files | 传统 .cursorrules 文件

- Single file approach | 单文件方式
- JSON-based templates | 基于 JSON 的模板
- Workspace root location | 位于工作区根目录

### NEW: .cursor/rules MDC Files | 新功能：.cursor/rules MDC 文件

- **Multiple files support** | **支持多文件**
- **Markdown format (.mdc)** | **Markdown 格式 (.mdc)**
- **Organized in .cursor/rules directory** | **在 .cursor/rules 目录中组织**
- **Workspace-specific templates** | **工作区特定模板**

## Usage | 使用方法

### Apply Template | 应用模板

**Method 1: Command Palette | 方法 1：命令面板**

1. Open Command Palette (Ctrl+Shift+P or Cmd+Shift+P) | 打开命令面板
2. Type "Apply Cursor Rules Template" | 输入"应用 Cursor Rules 模板"
3. Select a template from the list | 从列表中选择一个模板
   - **Templates now show type (MDC/Rules) and source (Workspace/User/Built-in)** | **模板现在显示类型（MDC/Rules）和来源（工作区/用户/内置）**
4. The template will be applied to your workspace | 模板将被应用到你的工作区
   - **.cursorrules templates create a .cursorrules file** | **.cursorrules 模板创建 .cursorrules 文件**
   - **MDC templates create files in .cursor/rules directory** | **MDC 模板在 .cursor/rules 目录中创建文件**

**Method 2: Status Bar | 方法 2：状态栏**

1. Click on the Cursor Rules icon in the status bar | 点击状态栏中的 Cursor Rules 图标
2. Select a template from the list | 从列表中选择一个模板

**Method 3: Template Explorer | 方法 3：模板浏览器**

1. Open the Cursor Rules view in the activity bar | 在活动栏中打开 Cursor Rules 视图
2. Browse templates with different icons: | 浏览带有不同图标的模板：
   - 📄 Built-in .cursorrules templates | 📄 内置 .cursorrules 模板
   - 💾 User .cursorrules templates | 💾 用户 .cursorrules 模板
   - 📝 Workspace MDC templates | 📝 工作区 MDC 模板
3. Right-click on a template | 右键点击一个模板
4. Select "Apply Template" | 选择"应用模板"

**Keyboard Shortcut | 键盘快捷键**

- Windows/Linux: `Ctrl+Shift+C`
- Mac: `Cmd+Shift+C`

### Save Custom Template | 保存自定义模板

#### For .cursorrules Files | 对于 .cursorrules 文件

1. Right-click on any .cursorrules file in the explorer | 在资源管理器中右键点击任意 .cursorrules 文件
2. Select "Save as Cursor Rules Template" | 选择"保存为 Cursor Rules 模板"
3. Enter a name and description for your template | 输入模板名称和描述
4. The template will be saved and available in the template list | 模板将被保存并在模板列表中可用

#### NEW: For .mdc Files | 新功能：对于 .mdc 文件

1. Right-click on any .mdc file in the .cursor/rules directory | 在 .cursor/rules 目录中右键点击任意 .mdc 文件
2. Select "Save as MDC Template" | 选择"保存为 MDC 模板"
3. Enter a template name | 输入模板名称
4. The template will be saved to user template library for cross-workspace use | 模板将保存到用户模板库，可跨工作区使用

### Create Template File | 创建模板文件

1. Right-click on any folder in the explorer | 在资源管理器中右键点击任意文件夹
2. Choose from: | 选择：
   - "Create Cursor Rules Template File" (creates .cursorrules) | "创建 Cursor Rules 模板文件"（创建 .cursorrules）
   - **NEW**: "Create New MDC Template" (creates .mdc in .cursor/rules) | **新功能**："创建新的 MDC 模板"（在 .cursor/rules 中创建 .mdc）
3. Choose a template from the list or create a new one | 从列表中选择一个模板或创建新的
4. The template file will be created in the appropriate location | 模板文件将被创建在适当的位置

### NEW: Create MDC Templates | 新功能：创建 MDC 模板

1. Right-click on any folder in the explorer | 在资源管理器中右键点击任意文件夹
2. Select "Create New MDC Template" | 选择"创建新的 MDC 模板"
3. Enter a template name | 输入模板名称
4. A basic MDC template will be created in .cursor/rules directory | 基础的 MDC 模板将在 .cursor/rules 目录中创建
5. Edit the template with your custom rules | 编辑模板添加你的自定义规则

### Preview Template | 预览模板

1. Open the Cursor Rules view in the activity bar | 在活动栏中打开 Cursor Rules 视图
2. Click on the preview icon next to a template | 点击模板旁边的预览图标
3. The template will be displayed in a preview panel | 模板将在预览面板中显示

### Manage Templates | 管理模板

1. Open the Cursor Rules view in the activity bar | 在活动栏中打开 Cursor Rules 视图
2. Browse templates by category and type: | 按分类和类型浏览模板：
   - **User templates (💾)** | **用户模板 (💾)**
   - **Built-in templates (📄)** | **内置模板 (📄)**
3. Mark templates as favorites | 将模板标记为收藏
4. **Enhanced**: Edit user templates with improved MDC support | **增强**：编辑用户模板，改进了 MDC 支持
5. Import/export templates | 导入/导出模板
6. **New**Delete template

**Keyboard Shortcut | 键盘快捷键**

- Windows/Linux: `Ctrl+Shift+M`
- Mac: `Cmd+Shift+M`

### Import/Export Templates | 导入/导出模板

**Export | 导出**

1. Open the Cursor Rules view in the activity bar | 在活动栏中打开 Cursor Rules 视图
2. Right-click on a template | 右键点击一个模板
3. Select "Export Template" | 选择"导出模板"
4. Choose a location to save the template file | 选择保存模板文件的位置

**Import | 导入**

1. Open the Cursor Rules view in the activity bar | 在活动栏中打开 Cursor Rules 视图
2. Click on the import icon in the view title | 点击视图标题中的导入图标
3. Select a template file to import | 选择要导入的模板文件

## Configuration | 配置

This extension contributes the following settings:

- `cursor-rules.showInStatusBar`: Show Cursor Rules icon in status bar | 在状态栏中显示 Cursor Rules 图标
- `cursor-rules.favoriteTemplates`: List of favorite templates | 收藏的模板列表
- `cursor-rules.templateCategories`: Template category configuration | 模板分类配置

## Available Templates | 可用模板

### Built-in Templates | 内置模板

- VSCode Expert | VSCode 插件专家
- AI Assistant | AI 助手
- Product Manager | 产品经理
- Python Expert | Python 专家
- React Expert | React 专家
- Java Expert | Java 专家
- Unity Developer | Unity 猫娘
- Game Designer | 游戏设计师姐姐
- And more... | 更多模板...

### Custom Templates | 自定义模板

- Your saved .cursorrules templates | 你保存的 .cursorrules 模板
- **NEW**: Your workspace MDC templates in .cursor/rules | **新功能**：你在 .cursor/rules 中的工作区 MDC 模板

## Migration Guide | 迁移指南

### From .cursorrules to .cursor/rules | 从 .cursorrules 到 .cursor/rules

If you're already using .cursorrules files and want to migrate to the new .cursor/rules format:

1. Create a .cursor/rules directory in your workspace | 在工作区中创建 .cursor/rules 目录
2. Convert your .cursorrules content to .mdc format | 将你的 .cursorrules 内容转换为 .mdc 格式
3. Save as .mdc files with descriptive names | 保存为具有描述性名称的 .mdc 文件
4. Use the "Save as MDC Template" command for automatic conversion | 使用"保存为 MDC 模板"命令进行自动转换

## Requirements | 要求

- VSCode 1.60.0 or above | VSCode 1.60.0 或更高版本

## Issues | 问题反馈

If you find any issues, please report them on our [GitHub repository](https://github.com/kelisiWu123/cursor-rules-wizard/issues).

如果你发现任何问题，请在我们的 [GitHub 仓库](https://github.com/kelisiWu123/cursor-rules-wizard/issues)上报告。
