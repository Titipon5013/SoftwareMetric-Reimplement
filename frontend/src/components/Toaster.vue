<script setup lang="ts">
import { useToaster } from '@/composables/useToaster'

const { toasts, remove } = useToaster()
</script>

<template>
  <div class="fixed inset-0 pointer-events-none z-[1000]">
    <div class="absolute top-4 right-4 flex flex-col gap-2 w-[min(96vw,360px)]">
      <div v-for="t in toasts" :key="t.id"
           class="pointer-events-auto rounded-lg border px-4 py-3 shadow-sm bg-white"
           :class="{
             'border-emerald-200': t.type === 'success',
             'border-red-200': t.type === 'error',
             'border-amber-200': t.type === 'warning',
             'border-zinc-200': t.type === 'info',
           }">
        <div class="flex items-start gap-3">
          <div class="mt-0.5 text-lg" aria-hidden="true">
            <span v-if="t.type==='success'">✅</span>
            <span v-else-if="t.type==='error'">❌</span>
            <span v-else-if="t.type==='warning'">⚠️</span>
            <span v-else>ℹ️</span>
          </div>
          <div class="text-sm text-zinc-800">{{ t.message }}</div>
          <button class="ml-auto text-zinc-500 hover:text-zinc-900" @click="remove(t.id)">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
