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
  gap: 20px; /* Space between content and TOC */
}

.wiki-content {
  flex: 1; /* Content takes available space */
  min-width: 0; /* Prevent content from overflowing */
  padding: 20px;
  line-height: 1.6;
  text-align: left; /* Explicitly set text alignment */
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

/* Add basic styling for rendered markdown */
.wiki-page :deep(h1),
.wiki-page :deep(h2),
.wiki-page :deep(h3),
.wiki-page :deep(h4),
.wiki-page :deep(h5),
.wiki-page :deep(h6) {
  margin-top: 1.5em;
  margin-bottom: 0.8em;
  font-weight: 600;
  line-height: 1.3;
}

.wiki-page :deep(h1) {
  font-size: 2.2em;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.3em;
}

.wiki-page :deep(h2) {
  font-size: 1.8em;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.3em;
}

.wiki-page :deep(h3) {
  font-size: 1.5em;
}

.wiki-page :deep(p) {
  margin-bottom: 1em;
}

.wiki-page :deep(ul),
.wiki-page :deep(ol) {
  margin-bottom: 1em;
  padding-left: 2em;
}

.wiki-page :deep(li) {
  margin-bottom: 0.4em;
}

.wiki-page :deep(code) {
  background-color: #f0f0f0;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
}

.wiki-page :deep(pre) {
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
  margin-bottom: 1em;
}

.wiki-page :deep(pre code) {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  font-size: 0.9em;
}

.wiki-page :deep(blockquote) {
  border-left: 4px solid #ccc;
  padding-left: 1em;
  margin-left: 0;
  margin-right: 0;
  color: #666;
  margin-bottom: 1em;
}

.wiki-page :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 1em;
}

.wiki-page :deep(th),
.wiki-page :deep(td) {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.wiki-page :deep(th) {
  background-color: #f2f2f2;
}

.wiki-page :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em 0;
  font-weight: 600;
}

.wiki-page :deep(p) {
  margin-bottom: 1em;
}

.wiki-page :deep(code) {
  background-color: #f0f0f0;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
}

.wiki-page :deep(pre) {
  background-color: #f0f0f0;
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
}

.wiki-page :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.wiki-page :deep(a) {
  color: #42b983;
  text-decoration: none;
}

.wiki-page :deep(a:hover) {
  text-decoration: underline;
}
</style>