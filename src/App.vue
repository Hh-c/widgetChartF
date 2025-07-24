<template>
  <HtmlEditor />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import HtmlEditor from './components/HtmlEditor/HtmlEditor.vue'

export default defineComponent({
  name: 'App',
  components: { HtmlEditor }
})
</script>
