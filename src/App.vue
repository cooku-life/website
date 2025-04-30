<template>
  <div id="app">
    <TopNavBar 
      :logo-src="config.logoSrc" 
      :site-title="config.siteTitle" 
      :nav-links="config.navLinks"
      class="top-nav-container" 
    />
    <div class="main-layout">
      <NavigationMenu class="nav-container" />
      <main class="main-content">
        <router-view />
      </main>
    </div>
    <Footer class="footer-container"/>
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

onMounted(() => {
  loadConfig()
  updateTitle()
})

watch(() => route.path, () => {
  if (config.value.siteTitle) {
    updateTitle()
  }
})

watch(config, updateTitle, { deep: true })
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

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-top: 60px;
  box-sizing: border-box;
}

.main-layout {
  flex: 1;
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

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  box-sizing: border-box;
  margin-left: 250px;
  text-align: left;
}

.footer-container {
  flex-shrink: 0;
  background-color: #f1f1f1;
  text-align: center;
  padding: 10px 0;
  border-top: 1px solid #e9ecef;
  height: auto;
  margin-left: 250px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  #app {
    padding-top: 0;
  }

  .top-nav-container {
    position: static;
    height: auto;
  }

  .nav-container {
    position: static;
    top: auto;
    height: auto;
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e9ecef;
    overflow-y: visible;
    z-index: auto;
  }

  .main-content {
    padding: 15px;
    margin-left: 0;
  }

  .footer-container {
    margin-left: 0;
  }
}
</style>
