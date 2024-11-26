console.log('Script is starting from within index.ts...')
import fs from "fs";
import matter from "gray-matter";
import { format } from "date-fns";
import path from 'path';

interface FrontMatter {
  title: string;
  description?: string;
  date?: string;
  modified?: string;
  status?: string;
  [key: string]: any;
}

const EMBED_LINK_REGEX = /!\[\[([a-zA-ZÀ-ÿ0-9-'?%.():&,+/€_! ]+)\]\]/g;

const imagesDir = `${process.env.OBSIDIAN_VAULT_PATH_FROM_HOME}/Screenshots`;

 const folderPath = `${process.cwd()}/src/app/articles`;

async function getDirContents(directory: string, copied: { notes: number; images: number }) {
    // C:\Users\etexd\OneDrive\Documents\gannsystems
  const contents = fs.readdirSync(directory);
  console.log(`Contents: ${contents}`);

  for (const filename of contents) {
    console.log(`Processing ${filename}`);
    const filepath = `${directory}/${filename}`;
    const filestat = fs.statSync(filepath);

    if (filestat.isDirectory()) {
      await getDirContents(filepath, copied);
    } else if (filepath.match(/\.mdx?/)) {
      const content = fs.readFileSync(filepath, "utf-8");
      const result = matter(content);

      if (
        result.data.status &&
        result.data.status.toLowerCase() === "published"
      ) {
        if (result.data.date) {
          const dateFromFrontmatter = new Date(result.data.date);
          result.data.date = format(dateFromFrontmatter, "yyyy-MM-dd");
        } else {
          result.data.date = format(filestat.birthtime, "yyyy-MM-dd");
        }

        if (result.data.modified) {
          const modifiedDateFromFrontmatter = new Date(result.data.modified);
          result.data.modified = format(modifiedDateFromFrontmatter, "yyyy-MM-dd");
        } else {
          result.data.modified = format(filestat.mtime, "yyyy-MM-dd");
        }

        const splitPath = filepath.split("/");
        const filename = splitPath.pop();
        if (!filename) {
          throw new Error(`unable to get filename from ${filepath}`);
        }
        const baseFilename = filename.replace(/\.mdx?$/, '');
        const newDirectory = `${folderPath}/${baseFilename.replace(/\s+/g, "-").toLowerCase()}`;
        fs.mkdirSync(newDirectory, { recursive: true });

        const foundEmbed = content.match(EMBED_LINK_REGEX);
        console.log(`Found embed: ${foundEmbed}`);

        if (foundEmbed?.length) {
          for (const image of foundEmbed) {
            const sanitizedImageName = image
              .replace(/^\!\[\[/, "")
              .replace(/\]\]$/, "");
            const path = `${imagesDir}/${sanitizedImageName}`;
            const file = fs.readFileSync(path);
            console.log(`File successfully read from: ${path}`);
            fs.writeFileSync(
              `${process.cwd()}/src/app/articles/${baseFilename.replace(/\s+/g, "-").toLowerCase()}/${sanitizedImageName}`,
              new Uint8Array(file)
            );
            console.log(`File successfully written to: ${process.cwd()}/public/img/notes/${sanitizedImageName}`);
            copied.images++;
          }
        }

        // Transform the content before writing
        const transformedContent = transformToMdxContent(
          result.content,
          {
            title: result.data.title || filename.replace(/\.mdx?$/, ''),
            description: result.data.description || '',
            date: result.data.date,
            modified: result.data.modified,
          },
          foundEmbed || [],
          filename
        );

        fs.writeFileSync(
          `${newDirectory}/page.mdx`,
          transformedContent
        );
        console.log(`New article successfully written to: ${newDirectory}/page.mdx`);
        copied.notes++;
      }
      console.log('File not set to published status');
    }
    console.log('File is not a markdown file');
  }
}

function transformToMdxContent(
  content: string, 
  frontMatter: FrontMatter, 
  images: string[],
  filename: string
): string {
  console.log(`Transforming content for ${filename}`);
  // Extract existing front matter and content
  const { data, content: markdownContent } = matter(content);
  
  // Combine provided front matter with existing data
  const finalFrontMatter = {
    ...data,
    ...frontMatter,
    author: 'Randall Gann',
  };

  // Generate import statements
  let imports = `import { ArticleLayout } from '@/components/ArticleLayout'\n`;
  
  // Add image imports if there are any
  if (images.length > 0) {
    images.forEach((image, index) => {
      const imageName = path.basename(image).replace(/!?\[\[|\]\]/g, '');
      const importName = `image${index + 1}`;
      imports += `import ${importName} from './${imageName}'\n`;
    });
  }

  // Create the article export
  const articleExport = `
export const article = {
  author: '${finalFrontMatter.author}',
  date: '${finalFrontMatter.date}',
  title: '${finalFrontMatter.title}',
  description: ${finalFrontMatter.description ? `"${finalFrontMatter.description}"` : "''"},
}`;

  // Create the metadata export
  const metadataExport = `
export const metadata = {
  title: article.title,
  description: article.description,
}`;

  // Create the default export for ArticleLayout
  const defaultExport = `
export default (props) => <ArticleLayout article={article} {...props} />
`;

  // Transform the markdown content
  let transformedContent = markdownContent;
  
  // Replace Obsidian image syntax with MDX image syntax
  // Example: ![[image.png]] becomes <img src={image1} alt="image" />
  if (images.length > 0) {
    images.forEach((image, index) => {
      const imageName = path.basename(image).replace(/!?\[\[|\]\]/g, '');
      console.log(`Image name: ${imageName}`);
      const importName = `image${index + 1}`;
      const obsidianSyntax = `![[${imageName}]]`;
      console.log(`Obsidian syntax: ${obsidianSyntax}`);
      const mdxSyntax = `<Image src={${importName}} alt="" />`;
      console.log(`MDX syntax: ${mdxSyntax}`);
      transformedContent = transformedContent.replace(obsidianSyntax, mdxSyntax);
    });
  }

  // Combine all parts
  const finalContent = `${imports}
${articleExport}
${metadataExport}
${defaultExport}

${transformedContent}`;

  return finalContent;
}

async function main() {
  console.log("Extracting notes from Obsidian vault");
  const vaultPath = process.env.OBSIDIAN_VAULT_PATH_FROM_HOME;
  if (!vaultPath) {
    throw new Error("Environment variable OBSIDIAN_VAULT_PATH_FROM_HOME is not defined");
  }
  console.log(`Vault path: ${vaultPath}`);
  const copied = { notes: 0, images: 0 };
  await getDirContents(vaultPath, copied);
  console.log(`Notes copied: ${copied.notes}`);
  console.log(`Images copied: ${copied.images}`);
}

main();