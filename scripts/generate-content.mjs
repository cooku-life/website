import { glob } from 'glob';
import fs from 'fs-extra';
import path from 'path';
import { Marked } from 'marked';
import { gfmHeadingId, getHeadingList, resetHeadings } from 'marked-gfm-heading-id';

const docsDir = path.resolve('docs');
const outputDir = path.resolve('src/generated');
const pagesFile = path.join(outputDir, 'content.js');
const menuFile = path.join(outputDir, 'menu.js');

// --- Marked Configuration ---
const marked = new Marked();
marked.use(gfmHeadingId());

// Function to extract title from Markdown (H1)
const getTitleFromMd = (content, defaultName) => {
  const match = content.match(/^#\s+(.*)/m);
  return match ? match[1] : defaultName;
};

// Function to generate TOC using marked-gfm-heading-id
const generateToc = (markdown) => {
  resetHeadings(); // Reset headings before each parse for TOC
  const localMarked = new Marked();
  let toc = [];
  localMarked.use(gfmHeadingId(), {
      hooks: {
          postprocess(html) {
              toc = getHeadingList();
              return html;
          }
      }
  });
  const html = localMarked.parse(markdown);
  return { html, toc };
};


// --- Main Generation Logic ---
async function generateContent() {
  console.log('Generating content from Markdown files...');
  await fs.ensureDir(outputDir); // Ensure the output directory exists

  const mdFiles = await glob('**/*.md', { cwd: docsDir });
  const pagesData = {};
  const menuStructure = [];
  const pathMap = {}; // Helper for menu structure

  // Sort files to process directories correctly
  mdFiles.sort();

  for (const file of mdFiles) {
      const filePath = path.join(docsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const routePath = '/' + file.replace(/\\/g, '/').replace(/\.md$/, '').replace(/index$/, ''); // Normalize path for URL
      const finalRoutePath = routePath.endsWith('/') && routePath.length > 1 ? routePath.slice(0, -1) : (routePath === '/index' ? '/' : routePath); // Handle index and trailing slash


      // Generate HTML and TOC
      const { html, toc } = generateToc(content);

      // Store page data
      pagesData[finalRoutePath] = { html, toc };

      // Build Menu Structure
      const parts = file.replace(/\\/g, '/').split('/').filter(p => p);
      let currentLevel = menuStructure;
      let currentMap = pathMap;
      let currentUrlPath = '';

      parts.forEach((part, index) => {
          const isLastPart = index === parts.length - 1;
          const cleanPart = part.replace(/\.md$/, '');
          currentUrlPath += '/' + cleanPart;
          const itemPath = currentUrlPath.replace(/\/index$/, '') || '/';

          let existingItem = currentMap[cleanPart];

          if (!existingItem) {
              const defaultName = cleanPart.replace(/_/g, ' '); 
              const title = isLastPart ? getTitleFromMd(content, defaultName) : defaultName;

              existingItem = {
                  name: title.charAt(0).toUpperCase() + title.slice(1), // Capitalize
                  path: isLastPart ? itemPath : null, // Only files have direct paths for links
                  type: isLastPart ? 'file' : 'directory',
                  children: isLastPart ? undefined : []
              };
              currentLevel.push(existingItem);
              currentMap[cleanPart] = existingItem;

              // Ensure children array exists for directories before trying to access its map
              if (!isLastPart) {
                  if (!existingItem.children) {
                      existingItem.children = [];
                  }
                  // Use a temporary map within the item to track its direct children during build
                  if (!existingItem._childrenMap) {
                    existingItem._childrenMap = {};
                  }
                  currentLevel = existingItem.children;
                  currentMap = existingItem._childrenMap; // Reference the map for the next level
              }

          } else if (!isLastPart) {
              // If directory exists, navigate into its children and map
              currentLevel = existingItem.children;
               // Ensure the map exists if we revisit a directory
               if (!existingItem._childrenMap) {
                 existingItem._childrenMap = {};
               }
               currentMap = existingItem._childrenMap;
          }
      });
  }

   // Clean up temporary _childrenMap properties
   const cleanupMap = (items) => {
     if (!items) return;
       items.forEach(item => {
           delete item._childrenMap;
           if (item.children) {
               cleanupMap(item.children);
           }
       });
   };
   cleanupMap(menuStructure);


  // Write the generated data to files
  const pagesOutput = `export const pages = ${JSON.stringify(pagesData, null, 2)};`;
  const menuOutput = `export const menu = ${JSON.stringify(menuStructure, null, 2)};`;

  await fs.writeFile(pagesFile, pagesOutput);
  console.log(`Generated content saved to ${pagesFile}`);
  await fs.writeFile(menuFile, menuOutput);
  console.log(`Generated menu structure saved to ${menuFile}`);

  console.log('Content generation complete.');
}

generateContent().catch(error => {
  console.error('Error generating content:', error);
  process.exit(1);
}); 