<template>
  <aside class="navigation-menu">
    <h3>导航</h3>
    <div v-if="loading">正在加载目录...</div>
    <div v-else-if="error">加载目录失败: {{ error }}</div>
    <ul v-else>
      <NavItem v-for="item in menuItems" :key="item.path" :item="item" />
    </ul>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import NavItem from './NavItem.vue' // Ensure NavItem component exists and handles nested items

const menuItems = ref([])
const loading = ref(true)
const error = ref(null)

// Function to extract the first H1 title from Markdown content
const getTitleFromMd = (content) => {
  const match = content.match(/^#\s+(.*)/m);
  return match ? match[1] : null;
};

// Function to generate menu structure from Vite's glob import
const generateMenuStructure = () => {
  loading.value = true
  error.value = null
  try {
    const modules = import.meta.glob('/public/docs/**/*.md', { eager: true, as: 'raw' });
    const structure = [];
    const pathMap = {}; // Helper to build hierarchy

    // Sort paths to process parent directories first
    const sortedPaths = Object.keys(modules).sort();

    sortedPaths.forEach(path => {
      const content = modules[path];
      const title = getTitleFromMd(content) || path.split('/').pop().replace('.md', '');
      // Adjust path replacement to remove /public/docs prefix
      const routePath = path.replace('/public/docs', '').replace('.md', '');
      const parts = routePath.split('/').filter(p => p);

      let currentLevel = structure;
      let currentPath = '';
      let parentMap = pathMap;

      parts.forEach((part, index) => {
        currentPath += '/' + part;
        const isLastPart = index === parts.length - 1;

        let existingItem = parentMap[part];

        if (!existingItem) {
          existingItem = {
            name: isLastPart ? title : part, // Use title for file, part name for directory
            path: currentPath,
            type: isLastPart ? 'file' : 'directory',
            filePath: path, // Store original file path
            children: isLastPart ? undefined : []
          };
          currentLevel.push(existingItem);
          parentMap[part] = existingItem;
        }

        if (!isLastPart) {
          currentLevel = existingItem.children;
          // Ensure children map exists for the next level
          if (!existingItem._childrenMap) {
             existingItem._childrenMap = {};
          }
          parentMap = existingItem._childrenMap;
        }
      });
    });

    // Clean up temporary _childrenMap
    const cleanupMap = (items) => {
        items.forEach(item => {
            delete item._childrenMap;
            if (item.children) {
                cleanupMap(item.children);
            }
        });
    };
    cleanupMap(structure);

    menuItems.value = structure;

  } catch (err) {
    console.error('Error generating directory structure:', err)
    error.value = err.message || '未知错误'
    menuItems.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  generateMenuStructure()
})
</script>

<style scoped>
.navigation-menu {
  width: 250px;
  background-color: #f8f9fa;
  padding: 20px;
  border-right: 1px solid #e9ecef;
  height: 100vh; /* Full height */
  overflow-y: auto; /* Scroll if content overflows */
  flex-shrink: 0; /* Prevent shrinking */
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
  }
  .navigation-menu h3 {
    margin-bottom: 10px;
  }
}
</style>