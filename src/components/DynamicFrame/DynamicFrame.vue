<!-- src/components/DynamicFrame/DynamicFrame.vue -->
<template>
  <iframe
    ref="frame"
    sandbox="allow-scripts"
    class="w-100"
    style="height: 600px; border: 1px solid #ddd;"
  ></iframe>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{ html: string }>()
const frame = ref<HTMLIFrameElement | null>(null)

const makeSrcDoc = (body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script src="https://d3js.org/d3.v7.min.js"><\/script>
</head>
<body>
  ${body}

  <script>
    window.addEventListener('load', () => {
      const svg = document.querySelector('svg');
      if (!svg) return;

      // Collect axis groups by D3's .domain path
      const axisGroups = Array.from(svg.querySelectorAll('g'))
        .filter(g => g.querySelector('path.domain'));

      let dragTarget = null;
      let isMouseDown = false;
      let isDragging = false;

      function classifyTarget(evt, overrideEl = null) {
        const el = overrideEl || evt.target;

        // legend (requires .legend on container)
        if (el.closest('.legend')) {
          return 'legend';
        }

        // data mark shapes
        if (['rect','circle','path'].includes(el.tagName)) {
            // 6. mark shapes: differentiate by tag
            if (el.tagName === 'rect') {
              return 'bar'
            }
            if (el.tagName === 'circle' || tag === 'ellipse') {
              return 'point'
            }
            if (el.tagName === 'path' || tag === 'polyline' || tag === 'polygon') {
              return 'line'
            }
          return 'mark';
        }

        // tick mark
        if (el.tagName === 'line' && el.parentNode?.classList.contains('tick')) {
          return 'tick mark';
        }

        // x tick label
        if (
          el.tagName === 'text' &&
          el.parentNode?.classList.contains('tick') &&
          el.closest('g.x-axis')
        ) {
          return 'x tick label';
        }
        // y tick label
        if (
          el.tagName === 'text' &&
          el.parentNode?.classList.contains('tick') &&
          el.closest('g.y-axis')
        ) {
          return 'y tick label';
        }
        // generic tick label fallback
        if (el.tagName === 'text' && el.parentNode?.classList.contains('tick')) {
          return 'tick label';
        }

        // x axis label
        if (
          el.tagName === 'text' &&
          el.classList.contains('axis-label') &&
          el.classList.contains('x-axis')
        ) {
          return 'x axis label';
        }
        // y axis label
        if (
          el.tagName === 'text' &&
          el.classList.contains('axis-label') &&
          el.classList.contains('y-axis')
        ) {
          return 'y axis label';
        }
        // generic axis label fallback
        if (
          el.tagName === 'text' &&
          el.classList.contains('axis-label')
        ) {
          console.log(el.classList);
          return 'axis label';
        }

        // background
        if (el === svg) {
          return 'background';
        }

        return 'other';
      }

      function sendEvent(type, evt, overrideEl = null) {
        window.parent.postMessage({
          chartEvent: {
            type,
            kind: classifyTarget(evt, overrideEl),
            x: evt.clientX,
            y: evt.clientY
          }
        }, '*');
      }

      document.addEventListener('mousedown', ev => {
        isMouseDown = true;
        isDragging = false;
        dragTarget = ev.target;
        // sendEvent('mousedown', ev);
      });

      document.addEventListener('mousemove', ev => {
        if (isMouseDown) {
          if (!isDragging) {
            isDragging = true;
          }
          sendEvent('drag', ev, dragTarget);
        }
      });

      document.addEventListener('mouseup', ev => {
        if (isMouseDown) {
          if (isDragging) {
            sendEvent('drag', ev, dragTarget);
          } else {
            sendEvent('click', ev);
          }
        }
        isMouseDown = false;
        isDragging = false;
        dragTarget = null;
      });

      document.addEventListener('dblclick', ev => sendEvent('dblclick', ev));
      document.addEventListener('contextmenu', ev => {
        ev.preventDefault();
        sendEvent('rightclick', ev);
      });
      document.addEventListener('wheel', ev => sendEvent('wheel', ev));
    });
  <\/script>
</body>
</html>`

onMounted(() => {
  if (frame.value) frame.value.srcdoc = makeSrcDoc(props.html)
})

watch(
  () => props.html,
  html => {
    if (frame.value) frame.value.srcdoc = makeSrcDoc(html)
  }
)
</script>
