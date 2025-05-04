import { glob } from 'glob';
import fs from 'fs-extra';
import path from 'path';
import { Marked } from 'marked';
import { gfmHeadingId, getHeadingList, resetHeadings } from 'marked-gfm-heading-id';
import yaml from 'js-yaml';
import { execSync } from 'child_process';

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

// Function to parse frontmatter
const parseFrontmatter = (content) => {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
  const match = content.match(frontmatterRegex);
  if (match && match[1]) {
    try {
      return yaml.load(match[1]);
    } catch (e) {
      console.warn(`Could not parse frontmatter for a file: ${e.message}`);
      return {};
    }
  }
  return {};
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

// --- Function to get Git info (Now gets all unique contributors and last commit info) ---
const getGitInfo = (filePath) => {
  let lastCommitInfo = {
    lastAuthorName: null,
    lastCommitHash: null,
    lastCommitTimestamp: null,
  };
  let contributors = [];

  try {
    // 1. Get last commit info (author, hash, timestamp)
    const lastCommitCommand = `git log -1 --pretty=format:"%an||%H||%ct" -- "${path.relative(docsDir, filePath).replace(/\\/g, '/')}"`;
    const lastCommitOutput = execSync(lastCommitCommand, { cwd: docsDir }).toString().trim();
    if (lastCommitOutput) {
      const [author, hash, timestamp] = lastCommitOutput.split('|||');
      lastCommitInfo = {
        lastAuthorName: author || null,
        lastCommitHash: hash || null,
        lastCommitTimestamp: timestamp ? parseInt(timestamp, 10) : null,
      };
    }

    // 2. Get all unique author names
    const allAuthorsCommand = `git log --follow --pretty=format:"%an" -- "${path.relative(docsDir, filePath).replace(/\\/g, '/')}"`;
    const allAuthorsOutput = execSync(allAuthorsCommand, { cwd: docsDir }).toString().trim();
    if (allAuthorsOutput) {
      const authorList = allAuthorsOutput.split('\n').filter(name => name); // Split by newline and remove empty lines
      contributors = [...new Set(authorList)]; // Get unique names
    }

  } catch (error) {
    // console.warn(`Could not get Git info for ${path.basename(filePath)}.`);
  }

  // Return both last commit info and the list of unique contributors
  return {
    ...lastCommitInfo,
    contributors,
  };
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


      // --- START HIDE CHECK ---
      const frontmatter = parseFrontmatter(content);
      const isHidden = frontmatter && frontmatter.hide === true;
      // --- END HIDE CHECK ---


      // Generate HTML and TOC (always do this for content.js)
      const { html, toc } = generateToc(content.replace(/^---\s*\n([\s\S]*?)\n---\s*\n?/, '')); // Remove frontmatter before generating HTML

      // Get Git Info (includes all contributors now)
      const { lastAuthorName, lastCommitHash, lastCommitTimestamp, contributors } = getGitInfo(filePath);

      // Store page data (always store, even if hidden from menu)
      pagesData[finalRoutePath] = {
          html,
          toc,
          lastAuthorName, // Keep last commit info as well
          lastCommitHash,
          lastCommitTimestamp,
          contributors // Add the list of unique contributors
      };

      // --- START SKIP IF HIDDEN ---
      // Skip adding to menu if hide: true
      if (isHidden) {
          console.log(`Skipping menu entry for hidden file: ${file}`);
          continue; // Skip the rest of the loop for this file
      }
      // --- END SKIP IF HIDDEN ---


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