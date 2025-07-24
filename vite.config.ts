// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 发布到 https://jh.github.io/widgetChartF/ 时的公共路径
  base: '/widgetChartF/',

  plugins: [vue()],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})



// 先尝试通过下面两个case跑通pipeline：
// 1. 基于chart axis 文本label的交互：用户点击文本label，static txt转化为text editor文本编辑框。
// 1a. 用户可以修改文本内容，实现换x/y axis的数据，读取不同csv文件中的column/row 并替换更新当前可视化 (data-level edit)
// 1b. 用户可以修改文本内容（确认后保存），但是仅仅是改text label的名称叫法，不影响底层数据 和可视化的表达 (vis appearence level edit)

// The input contain a piece of d3 code, a nl instrument and a 
// ai应该是有几个输入要take：
// 1. 用户直接输入（click + 图表对象）+ 用户文本指令（“修改文本“）
// 2. 图表绘制code输入（用于替换相关内容）
// 然后是像Dynavis一样：
// 3. 生成widgets 嵌入在chart里


// Optional widget：
// Sliders
// Dropdown Menus
// Checkboxes/Radio Buttons
// Text Entry and Numeric Inputs
// Inline Toolbars or Icon Buttons
// Context Menus