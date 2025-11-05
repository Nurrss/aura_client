<script setup></script>

<template>
  <nav
    id="sidebarMenu"
    class="col-12 col-md-3 col-lg-2 d-md-block bg-body-tertiary sidebar collapse"
  >
    <div class="position-sticky pt-3 sidebar-sticky">
      <ul class="nav flex-column">
        <li class="nav-item">
          <RouterLink class="nav-link" to="/">Dashboard</RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink class="nav-link" to="/tasks">Tasks</RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink class="nav-link" to="/habits">Habits</RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink class="nav-link" to="/calendar">Calendar</RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink class="nav-link" to="/pomodoro">Pomodoro</RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink class="nav-link" to="/reports">Reports</RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink class="nav-link" to="/settings">Settings</RouterLink>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
.sidebar {
  min-height: calc(100vh - 56px);
}
</style>
