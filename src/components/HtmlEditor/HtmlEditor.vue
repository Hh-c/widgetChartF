<!-- src/components/HtmlEditor/HtmlEditor.vue -->
<template>
  <div class="container my-4">

    <!-- 用户指令 与 模板选择 -->
    <div class="row mb-3">
      <div class="col-md-6">
        <input v-model="commandText" type="text" class="form-control" placeholder="user command (e.g., modify text)" />
      </div>
      <div class="col-md-6">
        <select v-model="selectedFile" class="form-select">
          <option value="">— choose a file —</option>
          <option v-for="f in fileList" :key="f" :value="f">{{ f }}</option>
        </select>
      </div>
    </div>

    <!-- 模板对应的 Prompt -->
    <div v-if="templatePrompt" class="row mb-3">
      <div class="col-12">
        <label class="form-label">
          Prompt used to generate the chosen file
        </label>
        <textarea class="form-control" rows="3" style="height: 110px;" readonly>{{ templatePrompt }}</textarea>
      </div>
    </div>

    <!-- 实时交互 & 可修改的 Target 下拉 -->
    <div class="row mb-2" style="padding-left: 50%;">
      <div class="col-md-6">
        interaction:
        <span class="text-primary">{{ currentAction }}</span>
      </div>
      <div class="col-md-6">
        <div class="input-group">
          <span class="input-group-text">Target</span>
          <select v-model="currentTarget" class="form-select">
            <option v-for="t in targetOptions" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- HTML 编辑器 与 预览 -->
    <div class="row">
      <div class="col-md-6 mb-3">
        <label class="form-label">HTML editor</label>
        <textarea v-model="htmlCode" class="form-control" rows="20" style="height: 600px;"></textarea>
      </div>
      <div class="col-md-6 mb-3">
        <label class="form-label">Chart preview</label>
        <DynamicFrame :html="htmlCode" />
      </div>
    </div>

    <!-- 发送 AI 按钮、复制 & 填充 按钮 与 AI 返回 -->
    <div class="mb-4">
      <button class="btn btn-warning w-100 mb-3" :disabled="loadingAI" @click="sendToAI">
        {{ loadingAI
          ? 'Waiting for the AI’s response.'
          : 'send (1) html (2) interaction (3) user command to AI' }}
      </button>

      <div class="d-flex gap-2 mb-3">
        <button class="btn btn-outline-secondary flex-fill" :disabled="!aiResponse" @click="copyAIResponse">
          📋 Copy AI response
        </button>
        <button class="btn btn-outline-success flex-fill" :disabled="!aiResponse" @click="pasteToEditor">
          🔄 Paste to HTML editor
        </button>
      </div>

      <div v-if="aiResponse">
        <h6>AI return：</h6>
        <pre class="p-2 bg-light">{{ aiResponse }}</pre>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import DynamicFrame from '../DynamicFrame/DynamicFrame.vue'

// 用户指令
const commandText = ref('')

// 模板文件 列表 & 选中项
const fileList = ref<string[]>([])
const selectedFile = ref('')

// 模板对应的 Prompt
const promptsMap = ref<Record<string, string>>({})
const templatePrompt = ref('')

// HTML 编辑内容
const htmlCode = ref('<div id="chart"></div>')

// AI 返回与请求状态
const aiResponse = ref('')
const loadingAI = ref(false)

// 交互状态 & target
const currentAction = ref('—')
const currentTarget = ref('—')
const targetOptions = [
  'bar',
  'line',
  'point',
  'x tick label',
  'y tick label',
  'x axis label',
  'y axis label',
  'x axis',
  'y axis',
  'axis label',
  'legend',
  'background',
  'other'
]

// 加载 templates.json 与 prompts.json
onMounted(async () => {
  try {
    const base = import.meta.env.BASE_URL
    const [tplRes, prmRes] = await Promise.all([
      fetch(`${base}templates.json`),
      fetch(`${base}prompts.json`)
    ])
    fileList.value = await tplRes.json()
    promptsMap.value = await prmRes.json()
  } catch (e) {
    console.error('加载 templates.json 或 prompts.json 失败', e)
  }

  // 监听 iframe 消息
  window.addEventListener('message', handleMessage)
})

// 清理事件监听
onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
})

// 选中模板时载入 HTML & Prompt
watch(selectedFile, async file => {
  if (!file) {
    templatePrompt.value = ''
    return
  }
  try {
    const base = import.meta.env.BASE_URL
    htmlCode.value = await fetch(`${base}${file}`).then(r => r.text())
    templatePrompt.value = promptsMap.value[file] || ''
  } catch (e) {
    console.error(`加载模板 ${file} 失败`, e)
  }
})

// 处理来自 iframe 的交互消息
function handleMessage(ev: MessageEvent) {
  const d = ev.data?.chartEvent
  if (d) {
    currentAction.value = d.type
    if (targetOptions.includes(d.kind)) {
      currentTarget.value = d.kind
    }
  }
}

// 发送数据到后端 AI 并接收回复
async function sendToAI() {
  loadingAI.value = true
  aiResponse.value = ''
  try {
    const payload = {
      html: htmlCode.value,
      interaction: currentAction.value,
      target: currentTarget.value,
      command: commandText.value
    }
    
    // 修改为读取环境变量
    const baseUrl = import.meta.env.VITE_API_BASE_URL
    const res = await fetch(`${baseUrl}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()
    aiResponse.value = json.reply || ''
  } catch (err) {
    aiResponse.value = `请求失败：${err}`
  } finally {
    loadingAI.value = false
  }
}

// 复制 AI 返回到剪贴板
function copyAIResponse() {
  if (aiResponse.value) {
    navigator.clipboard
      .writeText(aiResponse.value)
      .catch(err => console.error('Clipboard error:', err))
  }
}

// 将 AI 返回粘贴到 HTML 编辑区
function pasteToEditor() {
  if (aiResponse.value) {
    htmlCode.value = aiResponse.value
  }
}
</script>
