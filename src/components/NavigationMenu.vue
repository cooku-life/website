<template>
  <aside class="navigation-menu">
    <h3>导航</h3>
    <div v-if="loading">正在加载目录...</div>
    <div v-else-if="error">加载目录失败: {{ error }}</div>
    <ul v-else-if="menuItems.length > 0">
      <NavItem v-for="item in menuItems" :key="item.path || item.name" :item="item" />
    </ul>
    <div v-else>无导航项</div>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import NavItem from './NavItem.vue'
import { menu } from '@/generated/menu.js' // 从生成的文件导入

const menuItems = ref([])
const loading = ref(true) // 初始状态为 true
const error = ref(null)

// 不再需要动态生成，直接使用导入的数据
const loadMenuStructure = () => {
  try {
    // menu 是从 generated/menu.js 导入的数组
    menuItems.value = menu
    loading.value = false // 加载完成
  } catch (err) {
    console.error('Error loading menu structure:', err)
    error.value = err.message || '加载菜单时发生未知错误'
    menuItems.value = []
    loading.value = false // 加载出错也要结束 loading
  }
}

onMounted(() => {
  loadMenuStructure()
})
</script>

<style scoped>
.navigation-menu {
  width: 250px;
  background-color: #f8f9fa;
  padding: 20px;
  border-right: 1px solid #e9ecef;
  /* height: 100vh; Remove fixed height if content varies */
  overflow-y: auto; /* Scroll if content overflows */
  flex-shrink: 0; /* Prevent shrinking */
  box-sizing: border-box; /* Include padding in width */
}

.navigation-menu h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #495057;
  font-size: 1.1em;
}

.navigation-menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .navigation-menu {
    width: 100%;
    height: auto; /* Auto height on mobile */
    border-right: none;
    border-bottom: 1px solid #e9ecef;
    padding: 10px 15px;
    /* Adjust dark mode styles if needed */
    #app.dark-mode & {
       border-bottom: 1px solid #3a3a3a;
    }
  }
  .navigation-menu h3 {
    margin-bottom: 10px;
  }
}
</style>