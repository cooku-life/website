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
      <!-- Search Input -->
      <div class="search-container">
        <input 
          type="search" 
          v-model.trim="searchQuery" 
          placeholder="搜索文章..." 
          class="search-input"
          @focus="showResults = true" 
          @blur="handleBlur"
        />
        <ul v-if="showResults && searchQuery && searchResults.length > 0" class="search-results">
          <li v-for="result in searchResults" :key="result.path">
            <router-link :to="result.path" @click="clearSearch" class="search-result-link">
              {{ result.title }}
            </router-link>
          </li>
        </ul>
         <div v-else-if="showResults && searchQuery && searchResults.length === 0" class="search-no-results">
            无匹配结果
          </div>
      </div>
      <!-- Dark Mode Toggle Icon -->
      <div @click="emitToggleDarkMode" class="dark-mode-toggle" :aria-label="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'" role="button">
        <transition name="fade" mode="out-in">
          <svg v-if="isDarkMode" key="moon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-moon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          <svg v-else key="sun" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-sun"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        </transition>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref, watch } from 'vue';
import { defineProps, defineEmits } from 'vue';
import { pages } from '@/generated/content.js'; // 引入预生成内容
import { useRouter } from 'vue-router'; // 引入 useRouter

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

// --- Search Functionality ---
const router = useRouter();
const searchQuery = ref('');
const searchResults = ref([]);
const showResults = ref(false); // Control visibility of results dropdown

// Function to extract title from path or H1 tag
const extractTitle = (path, html) => {
  // Attempt to find H1
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    // Strip potential HTML tags inside H1 (though unlikely)
     const tempDiv = document.createElement('div');
     tempDiv.innerHTML = h1Match[1];
     return tempDiv.textContent || tempDiv.innerText || path.split('/').pop() || path;
  }
  // Fallback to last part of the path
  return path.split('/').pop() || path; 
};

const performSearch = (query) => {
  if (!query) {
    searchResults.value = [];
    return;
  }

  const lowerCaseQuery = query.toLowerCase();
  const results = [];

  for (const [path, pageData] of Object.entries(pages)) {
     // Simple check if html content includes the query (case-insensitive)
     // More sophisticated search (e.g., word boundaries, relevance) could be added
     if (pageData.html && pageData.html.toLowerCase().includes(lowerCaseQuery)) {
       const title = extractTitle(path, pageData.html);
       results.push({ path, title });
     }
     // Limit results for performance/display reasons if needed
     // if (results.length >= 10) break; 
  }
  searchResults.value = results;
};

// Watch for changes in searchQuery and perform search
// Debounce could be added here for performance:
// let debounceTimer;
// watch(searchQuery, (newQuery) => {
//   clearTimeout(debounceTimer);
//   debounceTimer = setTimeout(() => {
//     performSearch(newQuery);
//     showResults.value = !!newQuery; // Show results if there's a query
//   }, 300); // 300ms debounce
// });
watch(searchQuery, (newQuery) => {
  performSearch(newQuery);
  showResults.value = !!newQuery; // Show results immediately if there's a query
});


const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
  showResults.value = false; 
};

// Handle blur event to hide results, but delay it slightly 
// to allow clicking on a result link
const handleBlur = () => {
  setTimeout(() => {
     showResults.value = false;
  }, 150); // Delay to allow click event on link to register
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
  transition: background-color 0.3s ease, border-bottom-color 0.3s ease; /* Smooth transition for dark mode */
}

/* Dark mode styles for the nav bar itself */
#app.dark-mode .top-nav-bar {
  background-color: #2a2a2a;
  border-bottom-color: #3a3a3a;
}

#app.dark-mode .site-title {
  color: #e0e0e0;
}

#app.dark-mode .nav-link {
  color: #adb5bd; /* Adjust link color for dark mode */
}

#app.dark-mode .nav-link:hover,
#app.dark-mode .nav-link.router-link-exact-active {
  color: #ffffff; /* Adjust hover/active color */
  border-bottom-color: #ffffff;
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
  transition: color 0.3s ease; /* Smooth color transition */
}

.nav-links {
  display: flex;
  gap: 15px; /* Adjusted gap */
  align-items: center; /* Align button vertically */
}

.nav-link {
  text-decoration: none;
  color: #007bff; /* Link color */
  font-size: 1em;
  padding: 5px 0;
  border-bottom: 2px solid transparent; /* Add transparent border for spacing consistency */
  transition: color 0.3s ease, border-bottom-color 0.3s ease; /* Smooth transitions */
}

.nav-link:hover,
.nav-link.router-link-exact-active { /* Style for active link */
  color: #0056b3;
  border-bottom: 2px solid #0056b3;
}

/* Search container styles */
.search-container {
  position: relative; /* Needed for absolute positioning of results */
  margin-left: auto; /* Push search to the right, adjust if needed */
   margin-right: 15px; /* Space before dark mode toggle */
}

.search-input {
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #ced4da;
  font-size: 0.9em;
  min-width: 150px; /* Minimum width */
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.search-input:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

/* Search results dropdown */
.search-results, .search-no-results {
  position: absolute;
  top: 100%; /* Position below the input */
  left: 0;
  right: 0;
  background-color: #ffffff;
  border: 1px solid #ced4da;
  border-top: none; /* Remove top border as it connects to input */
  border-radius: 0 0 4px 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 300px; /* Limit height and enable scroll */
  overflow-y: auto;
  z-index: 1200; /* Ensure results are above other content */
}

.search-no-results {
  padding: 10px;
  color: #6c757d;
  text-align: center;
  font-size: 0.9em;
}

.search-results li {
  /* border-bottom: 1px solid #eee;  Optional separator */
}

.search-results li:last-child {
  border-bottom: none;
}

.search-result-link {
  display: block;
  padding: 8px 12px;
  color: #212529;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background-color 0.2s ease;
}

.search-result-link:hover {
  background-color: #f8f9fa;
}

/* Dark mode search styles */
#app.dark-mode .search-input {
  background-color: #4f4f4f;
  border-color: #6f6f6f;
  color: #e0e0e0;
}
#app.dark-mode .search-input::placeholder {
  color: #adb5bd;
}
#app.dark-mode .search-input:focus {
  border-color: #8a939b;
   box-shadow: 0 0 0 0.2rem rgba(138, 147, 155, 0.25);
}
#app.dark-mode .search-results, #app.dark-mode .search-no-results {
  background-color: #2a2a2a;
  border-color: #3a3a3a;
}
#app.dark-mode .search-no-results {
   color: #adb5bd;
}
#app.dark-mode .search-result-link {
  color: #e0e0e0;
}
#app.dark-mode .search-result-link:hover {
  background-color: #3a3a3a;
}

/* Dark mode toggle icon styles */
.dark-mode-toggle {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px; /* Fixed width for the container */
  height: 30px; /* Fixed height for the container */
}

.dark-mode-toggle svg {
  width: 20px;
  height: 20px;
  color: #6c757d; /* Default icon color */
  transition: color 0.3s ease, transform 0.3s ease; /* Smooth transitions */
}

.dark-mode-toggle:hover svg {
  color: #343a40; /* Icon color on hover */
  transform: scale(1.1); /* Slight zoom effect on hover */
}

/* Dark mode icon colors */
#app.dark-mode .dark-mode-toggle svg {
  color: #adb5bd; /* Icon color in dark mode */
}

#app.dark-mode .dark-mode-toggle:hover svg {
  color: #f8f9fa; /* Icon hover color in dark mode */
}

/* Transition for icons */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style> 