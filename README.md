# 沈家俊工具箱

一个专业的物流与文字服务工具集合，让您的工作更加高效便捷。

## 功能特性

- **计算工具**：提供空海派尺寸计算、重货方价计算、分泡计算等功能
- **文字报价**：支持多种国家和服务类型的报价文本生成
- **进仓单生成**：快速生成物流单号和进仓单
- **整柜报价**：专业的整柜物流报价工具
- **核价工具**：辅助进行价格核算

## 技术栈

- React 18+
- TypeScript
- Tailwind CSS
- Vite
- React Router
- Framer Motion

## 安装与本地开发

1. 克隆仓库
```bash
git clone https://github.com/jiajuns999-cmd/SJJ-GONGJU.git
cd SJJ-GONGJU
```

2. 安装依赖
```bash
npm install
# 或使用pnpm
pnpm install
```

3. 启动开发服务器
```bash
npm run dev
# 或使用pnpm
pnpm dev
```

4. 构建项目
```bash
npm run build
# 或使用pnpm
pnpm build
```

## 部署到GitHub Pages

项目已经配置了GitHub Pages自动部署功能，只需按照以下步骤操作：

### 首次部署步骤

1. 确保项目已经推送到GitHub仓库

2. 安装依赖（如果尚未安装）
```bash
npm install
# 或使用pnpm
pnpm install
```

3. 执行部署命令
```bash
npm run deploy
# 或使用pnpm
pnpm deploy
```

4. 等待部署完成，访问 `https://jiajuns999-cmd.github.io/SJJ-GONGJU/` 查看效果

### 自动部署说明

项目的`package.json`中已经配置了以下脚本：
- `predeploy`: 在部署前自动运行构建命令
- `deploy`: 使用`gh-pages`工具将`dist`目录部署到GitHub Pages

每次更新项目后，只需重新运行`npm run deploy`或`pnpm deploy`命令，即可自动更新GitHub Pages上的内容。

## 项目结构

```
├── src/                  # 源代码目录
│   ├── components/       # 可复用组件
│   ├── contexts/         # React Context
│   ├── hooks/            # 自定义Hooks
│   ├── lib/              # 工具函数和服务
│   ├── pages/            # 页面组件
│   ├── App.tsx           # 应用主组件
│   └── main.tsx          # 入口文件
├── public/               # 静态资源
├── .gitignore            # Git忽略配置
├── package.json          # 项目依赖和脚本
├── tailwind.config.js    # Tailwind配置
├── tsconfig.json         # TypeScript配置
└── vite.config.ts        # Vite配置
```

## 注意事项

- 确保在部署前运行构建命令，以验证项目能正常构建
- 如需自定义部署路径，请修改vite.config.ts中的base配置（注意：此文件已锁定）
- 本地存储用于保存历史记录和用户设置
- 深色模式支持自动切换和手动切换

## 许可证

MIT License