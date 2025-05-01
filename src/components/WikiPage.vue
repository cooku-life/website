<template>
  <div class="wiki-page-container">
    <div class="wiki-content" ref="contentRef" v-html="renderedMarkdown"></div>
    <aside class="toc-container" v-if="tocItems.length > 0">
      <h4>目录</h4>
      <ul>
        <li v-for="item in tocItems" :key="item.id" :class="`toc-level-${item.level}`">
          <a :href="`#${item.id}`">{{ item.text }}</a>
        </li>
      </ul>
    </aside>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Marked } from 'marked'
import { gfmHeadingId, getHeadingList, resetHeadings } from 'marked-gfm-heading-id'

const route = useRoute()
const renderedMarkdown = ref('')
const tocItems = ref([])
const contentRef = ref(null) // Ref for the content container

const fetchAndRenderMarkdown = async (path) => {
  // Default to index.md if path is empty or root
  const filePath = path === '/' || !path ? '/docs/index.md' : `/docs${path}.md`
  try {
    const response = await fetch(filePath)
    if (response.ok) {
      const markdown = await response.text()
      
      // Create a new Marked instance for this parse operation
      const localMarked = new Marked();
      
      // Reset heading list before parsing with this instance
      resetHeadings(); 

      // Configure the instance with the extension and the hook
      localMarked.use(gfmHeadingId(), {
        hooks: {
          postprocess(html) {
            // Use getHeadingList AFTER marked.parse is complete within the hook
            const headings = getHeadingList();
            // Update TOC ref from within the hook or after the promise resolves
            nextTick(() => {
                 tocItems.value = headings;
            });
            return html; // Return the processed HTML
          }
        }
      });

      // Pass the markdown to the instance's parse method
      renderedMarkdown.value = localMarked.parse(markdown);
      
    } else {
      // Handle 404 or other errors
      renderedMarkdown.value = new Marked().parse('# 页面未找到\\n\\n抱歉，无法找到您请求的页面。'); 
      tocItems.value = []; // Clear TOC on error
      console.error(`Failed to fetch ${filePath}: ${response.statusText}`)
    }
  } catch (error) {
    renderedMarkdown.value = new Marked().parse('# 加载错误\\n\\n加载页面时发生错误。');
    tocItems.value = []; // Clear TOC on error
    console.error(`Error fetching ${filePath}:`, error)
  }
}

// Fetch content when the component mounts
onMounted(() => {
  fetchAndRenderMarkdown(route.path)
})

// Watch for route changes and fetch new content
watch(() => route.path, (newPath) => {
  fetchAndRenderMarkdown(newPath)
})
</script>

<style scoped>
.wiki-page-container {
  display: flex;
  gap: 20px;
  position: relative;
  width: 100%; /* 确保宽度铺满 */
  max-width: 100%; /* 限制最大宽度 */
  box-sizing: border-box; /* 包含padding和border在width内 */
  margin: 0; /* 移除可能的外边距 */
  padding: 0; /* 移除可能的内边距 */
}

.wiki-content {
  flex: 1;
  min-width: 0;
  padding: 20px;
  line-height: 1.6;
  text-align: left;
  word-wrap: break-word; /* 允许长单词或数字换行 */
  overflow-wrap: break-word;
  word-break: break-word;
}

/* Align direct children of wiki-content to the left */
.wiki-content > * {
  text-align: left;
}

.toc-container {
  width: 200px; /* Fixed width for TOC */
  flex-shrink: 0; /* Prevent TOC from shrinking */
  padding-top: 20px;
  position: sticky; /* Make TOC sticky */
  top: 20px; /* Adjust top position as needed */
  height: calc(100vh - 40px); /* Adjust height based on viewport and padding */
  overflow-y: auto; /* Allow scrolling for long TOC */
  border-left: 1px solid #e9ecef;
  padding-left: 15px;
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
}

.toc-container a:hover {
  text-decoration: underline;
}

/* Indentation for different heading levels */
.toc-level-2 {
  padding-left: 15px;
}

.toc-level-3 {
  padding-left: 30px;
}

.toc-level-4 {
  padding-left: 45px;
}

/* Add basic styling for rendered markdown within wiki-content */
.wiki-content :deep(h1),
.wiki-content :deep(h2),
.wiki-content :deep(h3),
.wiki-content :deep(h4),
.wiki-content :deep(h5),
.wiki-content :deep(h6) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.wiki-content :deep(h1) {
  font-size: 2em;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.3em;
}

.wiki-content :deep(h2) {
  font-size: 1.5em;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.3em;
}

.wiki-content :deep(h3) {
  font-size: 1.25em;
}

.wiki-content :deep(p) {
  margin-bottom: 1em;
  text-align: left; /* Align paragraphs left (inherits from .wiki-content) */
}

.wiki-content :deep(ul),
.wiki-content :deep(ol) {
  margin-bottom: 1em;
  padding-left: 2em;
}

.wiki-content :deep(li) {
  margin-bottom: 0.5em;
}

.wiki-content :deep(code) {
  background-color: #f8f8f8;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Courier New', Courier, monospace;
}

.wiki-content :deep(pre) {
  background-color: #f8f8f8;
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
}

.wiki-content :deep(pre code) {
  padding: 0;
  background-color: transparent;
  border-radius: 0;
}

.wiki-content :deep(blockquote) {
  border-left: 4px solid #eee;
  padding-left: 1em;
  margin-left: 0;
  color: #666;
}

.wiki-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 1em;
}

.wiki-content :deep(th),
.wiki-content :deep(td) {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.wiki-content :deep(th) {
  background-color: #f2f2f2;
}

/* Responsive adjustments */
@media (max-width: 992px) { /* Adjust breakpoint as needed */
  .wiki-page-container {
    flex-direction: column;
  }

  .toc-container {
    width: 100%;
    position: static;
    height: auto;
    max-height: 300px; /* Limit height on smaller screens */
    border-left: none;
    border-top: 1px solid #e9ecef;
    padding-left: 0;
    margin-top: 20px;
    padding-top: 15px;
  }

  .wiki-content {
     padding: 15px; /* Adjust padding for smaller screens */
  }

}


</style>