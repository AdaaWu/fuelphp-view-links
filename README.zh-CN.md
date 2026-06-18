# FuelPHP Tools

FuelPHP 开发者工具套件，提供路径跳转、路由执行、Model 表名查询、SQL 复制等功能，大幅提升日常开发效率。

## 功能一览

| # | 功能 | 适用位置 |
|---|------|---------|
| 1.  | **路径跳转链接** — `View::forge` / `Asset::css/js/img` / `Config::load` / `Lang::load` 一键跳转到对应文件 | 所有 PHP 文件 |
| 2.  | **Controller 跳转** — `routes.php` 里的 `=> 'controller/action'` 直接跳到 Controller 对应方法行 | `routes.php` |
| 3.  | **Route Runner** — 路由上方显示 ▶ Run 按钮，填入参数后自动打开浏览器 | `routes.php` |
| 4.  | **Model 表名 Hover** — hover `Model_X` 显示真实数据库表名 | 所有 PHP 文件 |
| 5.  | **复制 Function SQL** — 一键复制整个方法的 SQL，自动展开表名、常量值并格式化 | `model/` 目录 |

---

## 详细介绍

## ⭐功能①：路径跳转链接

在 PHP 文件里，对以下方法的字符串路径按 `Cmd+Click`（Mac）或 `Ctrl+Click`（Windows/Linux）可直接跳转到对应文件。**只有文件实际存在才会显示下划线链接。**

| 方法 | 跳转目标 |
|------|---------|
| `View::forge('admin/dashboard')` | `fuel/app/views/admin/dashboard.php` |
| `Asset::css('common/layout.css')` | `public/assets/css/common/layout.css` |
| `Asset::js('common/app.js')` | `public/assets/js/common/app.js` |
| `Asset::img('logo.png')` | `public/assets/img/logo.png` |
| `Config::load('pagination')` | `fuel/app/config/pagination.php` |
| `Lang::load('messages')` | `fuel/app/lang/messages.php` |

```php
// Cmd+Click "admin/dashboard" → 打开 fuel/app/views/admin/dashboard.php
$this->template->content = View::forge('admin/dashboard', $data);

// Cmd+Click "common/layout.css" → 打开对应 CSS 文件
Asset::css('common/layout.css');
```

---

## ⭐功能②：routes.php Controller 跳转

在 `routes.php` 里，对 `=> 'controller/action'` 的值按 `Cmd+Click`，直接跳转到对应的 Controller 文件并定位到 action 方法行。

```php
// Cmd+Click "api/product/ajax/update"
// → 打开 fuel/app/classes/controller/api/product/ajax.php
// → 定位到 post_update() 方法
'product/update' => 'api/product/ajax/update',
```

**解析规则：**
1. 先尝试整段作为文件路径（`admin/item/index/index` → `admin/item/index.php` + `action_index()`）
2. 不存在则取最后一段作为 action 名称（`api/product/ajax/update` → `api/product/ajax.php` + `post_update()`）
3. 找不到对应文件时不显示链接

---

## ⭐功能③：Route Runner

在 `routes.php` 里，每行路由上方显示 **▶ Run** 按钮，点击后自动组合 URL 并打开外部浏览器。

```php
// ▶ Run ← 点击这个按钮
'(:category_id)/item/(:item_id)' => 'front/item/index',
```

**操作流程：**
1. 自动检测路由里的参数（`:category_id`、`:item_id`、`(?P<name>...)` 格式）
2. 逐一弹出输入框询问参数值
3. 直接按 Enter 则使用 `.env` 的默认值（或参数名称本身作为 fallback）
4. 组合成完整 URL → 打开外部浏览器

**`.env` 设置（放在项目根目录）：**

```env
FUELPHP_DOMAIN=https://your-dev-domain.local
FUELPHP_CATEGORY_ID=1
FUELPHP_ITEM_ID=100
FUELPHP_PAGE=1
```

也支持 PHP 变量串接路由（`$category.$type.$page => 'front/list/...'`），会自动解析前面的变量定义找出参数名称。

---

## ⭐功能④：Model 表名 Hover

在任何 PHP 文件里，hover（鼠标移到上方）`Model_X` 类名，显示该 Model 对应的实际数据库表名。

```php
// hover 在 Model_Product_Category 上 → 显示 "表名: product_categories"
$sql .= 'FROM ' . Model_Product_Category::table() . ' pc';
```

**表名解析优先顺序：**
1. `CONST TABLE_NAME = 'xxx'`
2. `protected static $_table_name = 'xxx'`
3. FuelPHP `Inflector::tableize()` 自动推算（`Model_Item` → `items`、`Model_Product_Category` → `product_categories`）

---

## ⭐功能⑤：复制 Function SQL

在 `model/` 目录下的 PHP 文件，含有 `DB::query` 的 `public static function` 上方显示 **📋 Copy SQL** 按钮。

```php
// 📋 Copy SQL ← 点击这个按钮
public static function get_item_detail($item_id, $type)
{
    $query  = 'SELECT i.id, i.name, c.name AS category_name';
    $query .= 'FROM ' . self::table() . ' AS i ';
    $query .= 'LEFT JOIN ' . Model_Category::table() . ' c ON i.category_id = c.id ';
    $query .= 'WHERE i.id = :item_id ';
    $query .= 'AND i.display_flg = ' . FLG_ON;
}
```

**复制结果示例：**

```sql
-- Model_Item
-- get_item_detail

SELECT i.id, i.name, c.name AS category_name
FROM items AS i
	LEFT JOIN categories c ON i.category_id = c.id
WHERE i.id = :item_id
	AND i.display_flg = 1
```

**自动处理内容：**
- `self::table()` / `Model_X::table()` → 替换成真实表名
- `FLG_ON` / `FLG_OFF` 等常量 → 从 `fuel/app/config/const.php` 读取真实值
- SQL 关键字自动换行缩进（`SELECT`、`FROM`、`LEFT JOIN`、`WHERE`、`AND` 等）
- 条件式 SQL（`if` 块内的拼接）标记 `-- [conditional]`
- 开头加上 Model 类名和 function 名称作为来源注释

直接粘贴到 DBeaver 即可执行，`:param` 占位符自行替换即可。

---

## 设置

在 `.vscode/settings.json` 或 VSCode 设置里可自定义路径：

| 设置 | 默认值 | 说明 |
|------|--------|------|
| `fuelpHPTools.domain` | `""` | Route Runner 的域名（留空则从 `.env` 的 `FUELPHP_DOMAIN` 读取） |
| `fuelpHPTools.viewsPath` | `fuel/app/views` | Views 目录路径（相对于 workspace 根目录） |
| `fuelpHPTools.assetsPath` | `public/assets` | Assets 目录路径（相对于 workspace 根目录） |

**域名优先顺序：** VSCode 设置 → `.env` 的 `FUELPHP_DOMAIN` → `http://localhost`

---

## 安装

### VSCode Marketplace

在 VSCode 扩展搜索 `FuelPHP Tools` 安装。

### 从 .vsix 安装（Antigravity IDE / Open VSX）

1. 下载 `fuelphp-tools-x.x.x.vsix`
2. `Cmd+Shift+P` → **Install from VSIX**
3. 选择下载的 `.vsix` 文件
4. Reload Window

---

## 许可证

MIT

---

如果这个套件对你有帮助，欢迎到 GitHub 给个 ⭐ 支持一下！

👉 [https://github.com/AdaaWu/fuelphp-tools](https://github.com/AdaaWu/fuelphp-tools)
