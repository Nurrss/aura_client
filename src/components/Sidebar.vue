<script setup></script>

<template>
  <nav
    id="sidebarMenu"
    class="col-12 col-md-3 col-lg-2 d-md-block bg-body-tertiary sidebar collapse"
    aria-label="Main navigation"
  >
    <div class="position-sticky pt-3 sidebar-sticky">
      <ul class="nav flex-column" role="list">
        <li class="nav-item" role="listitem">
          <RouterLink class="nav-link" to="/" aria-label="Go to Dashboard">
            <i class="bi bi-speedometer2 me-2" aria-hidden="true"></i>
            Dashboard
          </RouterLink>
        </li>
        <li class="nav-item" role="listitem">
          <RouterLink class="nav-link" to="/tasks" aria-label="Go to Tasks">
            <i class="bi bi-check2-square me-2" aria-hidden="true"></i>
            Tasks
          </RouterLink>
        </li>
        <li class="nav-item" role="listitem">
          <RouterLink class="nav-link" to="/habits" aria-label="Go to Habits">
            <i class="bi bi-arrow-repeat me-2" aria-hidden="true"></i>
            Habits
          </RouterLink>
        </li>
        <li class="nav-item" role="listitem">
          <RouterLink class="nav-link" to="/calendar" aria-label="Go to Calendar">
            <i class="bi bi-calendar3 me-2" aria-hidden="true"></i>
            Calendar
          </RouterLink>
        </li>
        <li class="nav-item" role="listitem">
          <RouterLink class="nav-link" to="/pomodoro" aria-label="Go to Pomodoro Timer">
            <i class="bi bi-alarm me-2" aria-hidden="true"></i>
            Pomodoro
          </RouterLink>
        </li>
        <li class="nav-item" role="listitem">
          <RouterLink class="nav-link" to="/roadmap" aria-label="Go to Roadmaps">
            <i class="bi bi-map me-2" aria-hidden="true"></i>
            Roadmaps
          </RouterLink>
        </li>
        <li class="nav-item" role="listitem">
          <RouterLink class="nav-link" to="/analytics" aria-label="Go to Analytics">
            <i class="bi bi-graph-up me-2" aria-hidden="true"></i>
            Analytics
          </RouterLink>
        </li>
        <li class="nav-item" role="listitem">
          <RouterLink class="nav-link" to="/reports" aria-label="Go to Reports">
            <i class="bi bi-bar-chart me-2" aria-hidden="true"></i>
            Reports
          </RouterLink>
        </li>
        <li class="nav-item" role="listitem">
          <RouterLink class="nav-link" to="/finance" aria-label="Go to Finance">
            <i class="bi bi-wallet2 me-2" aria-hidden="true"></i>
            Finance
          </RouterLink>
        </li>
        <li class="nav-item" role="listitem">
          <RouterLink class="nav-link" to="/profile" aria-label="Go to Profile">
            <i class="bi bi-person me-2" aria-hidden="true"></i>
            Profile
          </RouterLink>
        </li>
        <li class="nav-item" role="listitem">
          <RouterLink class="nav-link" to="/settings" aria-label="Go to Settings">
            <i class="bi bi-gear me-2" aria-hidden="true"></i>
            Settings
          </RouterLink>
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
