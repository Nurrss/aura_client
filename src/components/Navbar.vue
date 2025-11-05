<script setup>
import { onMounted, ref, watch } from 'vue'

const currentTheme = ref('light')

const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-bs-theme', theme)
}

onMounted(() => {
  const saved = localStorage.getItem('aura-theme')
  currentTheme.value = saved === 'dark' ? 'dark' : 'light'
  applyTheme(currentTheme.value)
})

watch(currentTheme, (newTheme) => {
  localStorage.setItem('aura-theme', newTheme)
  applyTheme(newTheme)
})

const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
}
</script>

<template>
  <nav class="navbar navbar-expand navbar-dark bg-primary fixed-top">
    <div class="container-fluid">
      <button
        class="btn btn-outline-light me-2 d-md-none"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#sidebarMenu"
        aria-controls="sidebarMenu"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <a class="navbar-brand fw-bold" href="#">AURA</a>
      <div class="ms-auto d-flex align-items-center gap-3">
        <div class="form-check form-switch text-white m-0">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            id="themeSwitch"
            :checked="currentTheme === 'dark'"
            @change="toggleTheme"
          />
          <label class="form-check-label" for="themeSwitch">{{
            currentTheme === 'dark' ? 'Night' : 'Day'
          }}</label>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped></style>
