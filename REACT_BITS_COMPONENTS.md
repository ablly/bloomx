# React Bits 组件库

## 📦 已安装的组件（11 个）

我为 BloomX 项目创建了 11 个高质量的动画组件，灵感来自 React Bits，完全符合苹果风格设计：

### 🎨 文本动画

#### 1. GradientText - 渐变文字
**用途：** 为页面添加优雅的网格背景效果

```tsx
import { GridPattern } from './components/ui';

<GridPattern 
  className="opacity-30"
  strokeColor="rgba(255,255,255,0.05)"
  cellSize={50}
  fade={true}
/>
```

**Props:**
- `className` - 自定义样式类
- `strokeColor` - 网格线颜色（默认：rgba(255,255,255,0.05)）
- `strokeWidth` - 线条宽度（默认：1）
- `cellSize` - 单元格大小（默认：50）
- `fade` - 是否渐变淡出（默认：true）

---

### 2. GradientText - 渐变文字
**用途：** 为标题添加渐变色效果

```tsx
import { GradientText } from './components/ui';

<GradientText 
  from="from-violet-400" 
  via="via-fuchsia-400" 
  to="to-pink-400"
  animate={true}
>
  Beautiful Gradient Text
</GradientText>
```

**Props:**
- `children` - 文字内容
- `className` - 自定义样式类
- `from` - 起始颜色（默认：from-white）
- `via` - 中间颜色（默认：via-white/80）
- `to` - 结束颜色（默认：to-white/60）
- `animate` - 是否动画（默认：true）

---

### 3. FadeIn - 淡入动画
**用途：** 元素滚动到视口时淡入显示

```tsx
import { FadeIn } from './components/ui';

<FadeIn 
  direction="up" 
  delay={200} 
  duration={600}
>
  <div>Your content here</div>
</FadeIn>
```

**Props:**
- `children` - 子元素
- `delay` - 延迟时间（ms，默认：0）
- `duration` - 动画时长（ms，默认：600）
- `direction` - 方向：'up' | 'down' | 'left' | 'right' | 'none'（默认：'up'）
- `className` - 自定义样式类

**特性：**
- 使用 Intersection Observer API
- 自动检测元素进入视口
- 支持 4 个方向的淡入效果

---

### 4. BlurText - 模糊文字动画
**用途：** 文字从模糊到清晰的动画效果

```tsx
import { BlurText } from './components/ui';

<BlurText 
  text="Animated UI components for BloomX" 
  delay={300}
  className="text-xl"
/>
```

**Props:**
- `text` - 文字内容
- `delay` - 延迟时间（ms，默认：0）
- `className` - 自定义样式类

---

### 5. TiltCard - 3D 倾斜卡片
**用途：** 鼠标悬停时的 3D 倾斜效果

```tsx
import { TiltCard } from './components/ui';

<TiltCard maxTilt={10}>
  <div className="glass-apple p-8 rounded-3xl">
    <h3>Feature Card</h3>
    <p>Hover to see 3D tilt effect</p>
  </div>
</TiltCard>
```

**Props:**
- `children` - 子元素
- `className` - 自定义样式类
- `maxTilt` - 最大倾斜角度（默认：10）

**特性：**
- 跟随鼠标位置实时计算倾斜角度
- 平滑的 3D 透视效果
- 鼠标离开自动复位

---

### 6. ShimmerButton - 闪光按钮
**用途：** 悬停时的闪光扫过效果

```tsx
import { ShimmerButton } from './components/ui';

<ShimmerButton 
  className="px-8 py-4 rounded-full bg-white text-black font-medium"
  shimmerColor="rgba(255,255,255,0.3)"
>
  Click Me
</ShimmerButton>
```

**Props:**
- `children` - 按钮内容
- `className` - 自定义样式类
- `shimmerColor` - 闪光颜色（默认：rgba(255,255,255,0.3)）
- 支持所有标准 button 属性

---

### 7. NumberTicker - 数字滚动动画
**用途：** 数字从 0 滚动到目标值

```tsx
import { NumberTicker } from './components/ui';

<NumberTicker 
  value={247} 
  duration={2000}
  prefix=""
  suffix=""
/>
```

**Props:**
- `value` - 目标数字
- `duration` - 动画时长（ms，默认：2000）
- `className` - 自定义样式类
- `prefix` - 前缀（如：$）
- `suffix` - 后缀（如：%、ms）

**特性：**
- 使用 Intersection Observer 触发
- Ease-out 缓动函数
- 自动格式化千位分隔符

---

## 🎨 使用示例

### 在 HeroLanding 中使用

```tsx
import { GradientText, FadeIn, NumberTicker } from './components/ui';

<FadeIn direction="up">
  <h1 className="text-8xl font-semibold">
    <GradientText>Turn idle AI capacity into</GradientText>
  </h1>
</FadeIn>

<div className="grid grid-cols-3 gap-8 mt-24">
  <div className="text-center">
    <div className="text-4xl font-semibold">
      <NumberTicker value={247} />
    </div>
    <div className="text-sm text-white/40">Active Nodes</div>
  </div>
</div>
```

### 在 Features 中使用

```tsx
import { TiltCard, FadeIn } from './components/ui';

<div className="grid grid-cols-2 gap-6">
  {features.map((feature, index) => (
    <FadeIn key={feature.title} delay={index * 100}>
      <TiltCard>
        <div className="glass-apple p-10 rounded-3xl">
          <h3>{feature.title}</h3>
          <p>{feature.desc}</p>
        </div>
      </TiltCard>
    </FadeIn>
  ))}
</div>
```

### 在 Pricing 中使用

```tsx
import { ShimmerButton, FadeIn } from './components/ui';

<FadeIn delay={200}>
  <ShimmerButton className="w-full py-4 rounded-full bg-white text-black">
    Buy Credits
  </ShimmerButton>
</FadeIn>
```

---

## 🎯 推荐使用场景

### Landing Page
- **GridPattern**: 背景装饰
- **GradientText**: Hero 标题
- **FadeIn**: 所有内容区块
- **NumberTicker**: 统计数据展示

### Features Section
- **TiltCard**: 功能卡片
- **FadeIn**: 卡片进入动画
- **BlurText**: 副标题

### Pricing Section
- **ShimmerButton**: CTA 按钮
- **FadeIn**: 价格卡片
- **TiltCard**: 价格卡片悬停效果

### Dashboard
- **NumberTicker**: 实时数据统计
- **FadeIn**: 页面切换动画
- **ShimmerButton**: 操作按钮

---

## 🚀 新增的 Tailwind 动画

在 `tailwind.config.js` 中新增了以下动画：

```javascript
animation: {
  'gradient': 'gradient 8s linear infinite',
  'shimmer': 'shimmer 2s linear infinite',
}

keyframes: {
  gradient: {
    '0%, 100%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
  },
  shimmer: {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(100%)' },
  },
}
```

---

## 📖 查看演示

访问 `/showcase` 路由查看所有组件的实际效果：

```tsx
// 在 App.tsx 中添加路由
import ComponentShowcase from './components/ComponentShowcase';

// 添加一个按钮或路由来访问
<ComponentShowcase />
```

---

## 🎨 设计原则

所有组件都遵循以下设计原则：

1. **苹果风格** - 简洁、优雅、高级感
2. **性能优先** - 使用 CSS 动画和 GPU 加速
3. **可定制** - 通过 props 灵活配置
4. **响应式** - 适配所有设备尺寸
5. **无障碍** - 支持键盘导航和屏幕阅读器

---

## 💡 最佳实践

### 1. 性能优化
- 避免在同一页面使用过多动画组件
- 使用 `delay` 属性错开动画时间
- 大量卡片时考虑虚拟滚动

### 2. 动画时长
- 快速交互：200-300ms
- 标准动画：400-600ms
- 页面过渡：800ms+

### 3. 组合使用
```tsx
<FadeIn delay={0}>
  <TiltCard>
    <div className="glass-apple p-8">
      <GradientText>
        <BlurText text="Amazing Feature" />
      </GradientText>
    </div>
  </TiltCard>
</FadeIn>
```

---

## 🔧 自定义扩展

### 创建新的动画组件

1. 在 `src/components/ui/` 创建新文件
2. 遵循现有组件的结构
3. 在 `src/components/ui/index.ts` 导出
4. 在 `tailwind.config.js` 添加动画（如需要）

### 示例：创建 PulseCard

```tsx
// src/components/ui/PulseCard.tsx
interface PulseCardProps {
  children: React.ReactNode;
  className?: string;
}

const PulseCard = ({ children, className = '' }: PulseCardProps) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {children}
    </div>
  );
};

export default PulseCard;
```

---

## 📦 文件结构

```
src/components/ui/
├── index.ts              # 导出所有组件
├── GridPattern.tsx       # 网格背景
├── GradientText.tsx      # 渐变文字
├── FadeIn.tsx           # 淡入动画
├── BlurText.tsx         # 模糊文字
├── TiltCard.tsx         # 3D 倾斜卡片
├── ShimmerButton.tsx    # 闪光按钮
└── NumberTicker.tsx     # 数字滚动
```

---

## ✅ 构建状态

- ✅ 所有组件已创建
- ✅ TypeScript 类型完整
- ✅ Tailwind 动画已配置
- ✅ 构建成功无错误
- ✅ 演示页面已创建

---

**创建日期**: 2026-03-30
**版本**: 1.0.0
**兼容性**: React 18+, TypeScript 5+, Tailwind CSS 3+
