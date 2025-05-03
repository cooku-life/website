<template>
  <div class="wiki-page-container">
    <div v-if="loading" class="loading-placeholder">正在加载内容...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <template v-else>
      <div class="wiki-content" ref="contentRef" v-html="renderedMarkdown"></div>
      <aside class="toc-container" v-if="tocItems.length > 0">
        <h4>目录</h4>
        <ul>
          <li v-for="item in tocItems" :key="item.id" :class="`toc-level-${item.level}`">
            <a :href="`#${item.id}`">{{ item.text }}</a>
          </li>
        </ul>
      </aside>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
// Removed Marked imports as parsing is done at build time
import { pages } from '@/generated/content.js' // Import pre-generated content

const route = useRoute()
const renderedMarkdown = ref('')
const tocItems = ref([])
const contentRef = ref(null)
const loading = ref(true)
const error = ref(null)

const loadContent = async (path) => {
  loading.value = true
  error.value = null
  await nextTick() // Ensure DOM updates before trying to load

  try {
    // Normalize path: remove trailing slash for lookup, handle root path '/'
    const lookupPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : (path === '' ? '/' : path);

    // Use a default path if the lookup path is empty or just '/' which corresponds to index.md
    let finalLookupPath = lookupPath || '/';

    // --- DECODE THE PATH ---
    // Decode the URL-encoded path obtained from route.path to match the keys in `pages` object
    finalLookupPath = decodeURIComponent(finalLookupPath);
    // --- END DECODE ---


    // --- DEBUGGING LOGS ---
    console.log("Attempting to load content for route path:", path);
    console.log("Using (decoded) lookup key:", finalLookupPath); // Log the decoded key
    // Log the keys available in the generated pages object for comparison
    // console.log("Available keys in pages:", Object.keys(pages)); 
    // You might want to log the whole pages object too, if keys are complex
    // console.log("Complete pages object:", pages); 
    // --- END DEBUGGING LOGS ---

    if (pages[finalLookupPath]) {
      const { html, toc } = pages[finalLookupPath];
      renderedMarkdown.value = html;
      // Ensure TOC update happens after HTML is potentially rendered
      await nextTick();
      tocItems.value = toc || [];
    } else {
      // Handle page not found in generated content
      renderedMarkdown.value = '<h1>页面未找到</h1><p>抱歉，无法在预生成的内容中找到您请求的页面。</p>';
      tocItems.value = [];
      console.error(`Content not found for path: ${finalLookupPath}`) // Log the decoded path in case of error now
      error.value = '页面未找到'; // Set error message
    }
  } catch (err) {
    renderedMarkdown.value = '<h1>加载错误</h1><p>加载预生成内容时发生错误。</p>';
    tocItems.value = [];
    console.error(`Error loading content for path ${path}:`, err)
    error.value = '加载内容时出错'; // Set error message
  } finally {
    loading.value = false;
  }
}

// Fetch content when the component mounts
onMounted(() => {
  loadContent(route.path)
})

// Watch for route changes and fetch new content
watch(() => route.path, (newPath) => {
  loadContent(newPath)
})
</script>

<style scoped>
/* Add styles for loading and error states */
.loading-placeholder, .error-message {
  padding: 40px;
  text-align: center;
  font-size: 1.2em;
  color: #666;
}

.error-message {
  color: #dc3545; /* Bootstrap danger color */
}

/* Keep existing styles */
.wiki-page-container {
  display: flex;
  gap: 20px;
  position: relative;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.wiki-content {
  flex: 1;
  min-width: 0;
  padding: 20px;
  line-height: 1.6;
  text-align: left;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
}

.wiki-content > * {
  text-align: left;
}

.toc-container {
  width: 200px;
  flex-shrink: 0;
  padding-top: 20px;
  position: sticky;
  top: 80px; /* Increased top value to account for fixed TopNavBar */
  max-height: calc(100vh - 100px); /* Adjust max-height */
  overflow-y: auto;
  border-left: 1px solid #e9ecef;
  padding-left: 15px;
}

/* Dark mode adjustments for TOC if needed */
#app.dark-mode .toc-container {
  border-left: 1px solid #3a3a3a;
}

#app.dark-mode .toc-container a {
  color: #ffffff; /* Example dark mode link color */
}
#app.dark-mode .toc-container a:hover {
    color: #9e6cdc;
}


.toc-container h4 {
  margin-top: 0;
  margin-bottom: 10px;
}

.toc-container ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-container li {
  margin-bottom: 5px;
}

.toc-container a {
  text-decoration: none;
  color: #337ab7;
  font-size: 0.9em; /* Slightly smaller TOC font */
}

.toc-container a:hover {
  text-decoration: underline;
}

.toc-level-2 { padding-left: 15px; }
.toc-level-3 { padding-left: 30px; }
.toc-level-4 { padding-left: 45px; }
.toc-level-5 { padding-left: 60px; } /* Add more levels if needed */
.toc-level-6 { padding-left: 75px; }


/* Markdown content styles (using :deep) */
.wiki-content :deep(h1),
.wiki-content :deep(h2),
.wiki-content :deep(h3),
.wiki-content :deep(h4),
.wiki-content :deep(h5),
.wiki-content :deep(h6) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  scroll-margin-top: 80px; /* Add top margin for scroll target */
}
.wiki-content :deep(h1) { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
.wiki-content :deep(h2) { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
.wiki-content :deep(h3) { font-size: 1.25em; }
.wiki-content :deep(p) { margin-bottom: 1em; }
.wiki-content :deep(ul), .wiki-content :deep(ol) { margin-bottom: 1em; padding-left: 2em; }
.wiki-content :deep(li) { margin-bottom: 0.5em; }
.wiki-content :deep(code) { background-color: #f8f8f8; padding: 0.2em 0.4em; border-radius: 3px; font-family: 'Courier New', Courier, monospace; font-size: 0.9em;}
.wiki-content :deep(pre) { background-color: #f8f8f8; padding: 1em; border-radius: 5px; overflow-x: auto; margin-bottom: 1em;}
.wiki-content :deep(pre code) { padding: 0; background-color: transparent; border-radius: 0; font-size: 1em; }
.wiki-content :deep(blockquote) { border-left: 4px solid #eee; padding-left: 1em; margin-left: 0; color: #666; margin-bottom: 1em;}
.wiki-content :deep(table) { border-collapse: collapse; width: 100%; margin-bottom: 1em; display: block; overflow-x: auto; /* Ensure table scrolls horizontally if needed */ }
.wiki-content :deep(th), .wiki-content :deep(td) { border: 1px solid #ddd; padding: 8px; text-align: left; }
.wiki-content :deep(th) { background-color: #f2f2f2; }
.wiki-content :deep(img) { max-width: 100%; height: auto; } /* Responsive images */
.wiki-content :deep(hr) { border: none; border-top: 1px solid #eee; margin: 1em 0; } /* Horizontal rule style */

/* Dark mode Markdown styles */
#app.dark-mode .wiki-content :deep(code) { background-color: #3a3a3a; color: #e0e0e0; }
#app.dark-mode .wiki-content :deep(pre) { background-color: #2a2a2a; }
#app.dark-mode .wiki-content :deep(blockquote) { border-left-color: #444; color: #aaa; }
#app.dark-mode .wiki-content :deep(th), #app.dark-mode .wiki-content :deep(td) { border-color: #444; }
#app.dark-mode .wiki-content :deep(th) { background-color: #3a3a3a; }
#app.dark-mode .wiki-content :deep(h1), #app.dark-mode .wiki-content :deep(h2) { border-bottom-color: #444; }
#app.dark-mode .wiki-content :deep(hr) { border-top-color: #444; }


/* Responsive adjustments */
@media (max-width: 992px) {
  .wiki-page-container {
    flex-direction: column;
  }
  .toc-container {
    width: 100%;
    position: static;
    height: auto;
    max-height: 300px;
    border-left: none;
    border-top: 1px solid #e9ecef;
    padding-left: 0;
    margin-top: 20px;
    padding-top: 15px;
     #app.dark-mode & {
       border-top: 1px solid #3a3a3a;
    }
  }
  .wiki-content {
     padding: 15px;
  }
}
</style>