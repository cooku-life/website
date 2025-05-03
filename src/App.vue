<template>
  <div id="app" :class="{ 'dark-mode': isDarkMode }">
    <TopNavBar 
      :logo-src="config.logoSrc" 
      :site-title="config.siteTitle" 
      :nav-links="config.navLinks"
      :is-dark-mode="isDarkMode" 
      @toggle-dark-mode="toggleDarkMode"
      class="top-nav-container" 
    />
    <div class="page-body"> 
      <NavigationMenu class="nav-container" />
      <div class="content-and-footer"> 
        <main class="main-content">
          <router-view />
        </main>
        <Footer class="footer-container"/>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import NavigationMenu from './components/NavigationMenu.vue'
import Footer from './components/Footer.vue'
import TopNavBar from './components/TopNavBar.vue'
import { useRoute } from 'vue-router'

const config = ref({ 
  siteTitle: '我的维基', 
  footerText: '© 2024 我的知识库. 保留所有权利.',
  logoSrc: '',
  navLinks: []
})
const route = useRoute()
const isDarkMode = ref(false)

const loadConfig = async () => {
  try {
    const response = await fetch('/config.json')
    if (response.ok) {
      config.value = await response.json()
      updateTitle()
    } else {
      console.error('Failed to load config.json:', response.statusText)
    }
  } catch (error) {
    console.error('Error loading config.json:', error)
  }
}

const updateTitle = () => {
  const pageTitle = route.meta.title || config.value.siteTitle || 'Wiki'
  document.title = pageTitle
}

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('darkMode', isDarkMode.value)
}

const loadDarkModePreference = () => {
  const preference = localStorage.getItem('darkMode')
  isDarkMode.value = preference === 'true'
}

onMounted(() => {
  loadConfig()
  updateTitle()
  loadDarkModePreference()
})

watch(() => route.path, () => {
  if (config.value.siteTitle) {
    updateTitle()
  }
})

watch(config, updateTitle, { deep: true })

watch(isDarkMode, (newValue) => {
  if (newValue) {
    document.body.classList.add('dark-mode-body')
  } else {
    document.body.classList.remove('dark-mode-body')
  }
}, { immediate: true })
</script>

<style>
/* Global styles */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #fff;
}

body.dark-mode-body {
  color: #e0e0e0;
  background-color: #121212;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  box-sizing: border-box;
}

.page-body {
  flex: 1;
  padding-top: 60px;
  display: flex;
  position: relative;
}

.top-nav-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.nav-container {
  position: fixed;
  top: 60px;
  left: 0;
  height: calc(100vh - 60px);
  width: 250px;
  overflow-y: auto;
  background-color: #f8f9fa;
  border-right: 1px solid #e9ecef;
  box-sizing: border-box;
  z-index: 1000;
}

.content-and-footer {
  margin-left: 250px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 60px);
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  box-sizing: border-box;
  text-align: left;
}

.footer-container {
  flex-shrink: 0;
  background-color: #f1f1f1;
  text-align: center;
  padding: 10px 0;
  border-top: 1px solid #e9ecef;
  height: auto;
}

/* Dark Mode Styles */
#app.dark-mode {
  color: #e0e0e0;
  background-color: #1e1e1e;
}

#app.dark-mode body {
  color: #e0e0e0;
  background-color: #121212;
}

#app.dark-mode .top-nav-container {
  background-color: #2a2a2a;
  border-bottom: 1px solid #3a3a3a;
}

/* Explicitly set title color in dark mode */
#app.dark-mode .top-nav-container .site-title {
  color: #e0e0e0; /* Light color for dark mode */
}

#app.dark-mode .nav-container {
  background-color: #2a2a2a;
  border-right: 1px solid #3a3a3a;
}

#app.dark-mode .content-and-footer {
}

#app.dark-mode .main-content {
  background-color: #1e1e1e;
}

#app.dark-mode .footer-container {
  background-color: #2a2a2a;
  border-top: 1px solid #3a3a3a;
  color: #b0b0b0;
}

/* Adjust link colors for dark mode */
#app.dark-mode a {
  color: #f9f9f9;
}

#app.dark-mode a:hover {
  color: #9e6cdc;
}

/* Adjust heading colors */
#app.dark-mode h1, 
#app.dark-mode h2, 
#app.dark-mode h3, 
#app.dark-mode h4, 
#app.dark-mode h5, 
#app.dark-mode h6 {
  color: #ffffff;
}

/* Dark mode button style */
#app.dark-mode .toggle-button {
  background-color: #4f4f4f;
  border-color: #6f6f6f;
  color: #e0e0e0;
}

#app.dark-mode .toggle-button:hover {
  background-color: #5a5a5a;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  #app {
  }

  .page-body {
    padding-top: 0;
    display: block;
  }

  .top-nav-container {
    position: static;
    height: auto;
  }

  .nav-container {
    position: static;
    top: auto;
    left: auto;
    height: auto;
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e9ecef;
    overflow-y: visible;
    z-index: auto;
    #app.dark-mode & {
      border-bottom: 1px solid #3a3a3a;
    }
  }

  .content-and-footer {
    margin-left: 0;
    min-height: auto;
  }

  .main-content {
    padding: 15px;
  }

  .footer-container {
  }

  #app.dark-mode .nav-container {
    border-bottom: 1px solid #3a3a3a;
  }
}
</style>
