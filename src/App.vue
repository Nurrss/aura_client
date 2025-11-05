<script setup>
import Navbar from './components/Navbar.vue'
import Sidebar from './components/Sidebar.vue'
import Toast from './components/Toast.vue'
</script>

<template>
  <Navbar />

  <div class="container-fluid">
    <div class="row" style="padding-top: 56px">
      <Sidebar />

      <main class="col-12 ms-sm-auto col-md-9 col-lg-10 px-4 py-4">
        <transition name="fade" mode="out-in">
          <router-view />
        </transition>
      </main>
    </div>
  </div>
  <Toast />
</template>

<style scoped>
.sidebar {
  min-height: calc(100vh - 56px);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@media (max-width: 767.98px) {
  #sidebarMenu {
    display: none;
  }
}
</style>
