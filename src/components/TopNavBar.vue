<template>
  <header class="top-nav-bar">
    <div class="logo-container">
      <img v-if="logoSrc" :src="logoSrc" alt="Logo" class="logo-img" />
      <span class="site-title">{{ siteTitle }}</span>
    </div>
    <nav class="nav-links">
      <router-link v-for="link in navLinks" :key="link.url" :to="link.url" class="nav-link">
        {{ link.text }}
      </router-link>
      <!-- Add more static links or components here if needed -->
      <button @click="emitToggleDarkMode" class="toggle-button">
        {{ isDarkMode ? '切换日间模式' : '切换夜间模式' }}
      </button>
    </nav>
  </header>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  logoSrc: {
    type: String,
    default: ''
  },
  siteTitle: {
    type: String,
    required: true
  },
  navLinks: {
    type: Array,
    default: () => []
  },
  isDarkMode: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['toggleDarkMode']);

const emitToggleDarkMode = () => {
  emit('toggleDarkMode');
};
</script>

<style scoped>
.top-nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #f8f9fa; /* Or your preferred background */
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: fixed; /* Make it fixed */
  top: 0;
  left: 0;
  right: 0; 
  height: 60px; /* Example fixed height */
  z-index: 1100; /* Ensure it's above side nav */
  box-sizing: border-box;
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo-img {
  height: 40px; /* Adjust as needed */
  margin-right: 15px;
}

.site-title {
  font-size: 1.4em;
  font-weight: bold;
  color: #333;
}

.nav-links {
  display: flex;
  gap: 20px; /* Space between links */
  align-items: center; /* Align button vertically */
}

.nav-link {
  text-decoration: none;
  color: #007bff; /* Link color */
  font-size: 1em;
  padding: 5px 0;
}

.nav-link:hover,
.nav-link.router-link-exact-active { /* Style for active link */
  color: #0056b3;
  border-bottom: 2px solid #0056b3;
}

.toggle-button {
  padding: 8px 12px;
  background-color: #e9ecef;
  border: 1px solid #ced4da;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s ease;
}

.toggle-button:hover {
  background-color: #d6dce1;
}
</style> 