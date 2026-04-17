# 图标文件

请在此目录下放置以下图标文件：

- `icon16.png` - 16x16 像素图标
- `icon48.png` - 48x48 像素图标  
- `icon128.png` - 128x128 像素图标

## 临时解决方案

如果暂时没有图标文件，可以：

1. 使用在线图标生成器创建简单的书籍图标
2. 或者从以下网站下载免费图标：
   - https://www.flaticon.com/
   - https://icons8.com/
   - https://www.iconfinder.com/

搜索关键词：book, chapter, split, document

## 快速创建占位图标

可以使用以下方法快速创建占位图标（需要 ImageMagick）：

```bash
# 创建 16x16 图标
convert -size 16x16 xc:#4285f4 -pointsize 10 -fill white -gravity center -annotate +0+0 "📚" icon16.png

# 创建 48x48 图标
convert -size 48x48 xc:#4285f4 -pointsize 30 -fill white -gravity center -annotate +0+0 "📚" icon48.png

# 创建 128x128 图标
convert -size 128x128 xc:#4285f4 -pointsize 80 -fill white -gravity center -annotate +0+0 "📚" icon128.png
```

或者使用 Python 脚本创建：

```python
from PIL import Image, ImageDraw, ImageFont

sizes = [16, 48, 128]
for size in sizes:
    img = Image.new('RGB', (size, size), color='#4285f4')
    draw = ImageDraw.Draw(img)
    # 绘制简单的书籍图标
    draw.rectangle([size*0.2, size*0.1, size*0.8, size*0.9], fill='white', outline='#333', width=2)
    img.save(f'icon{size}.png')
```

