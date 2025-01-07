#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import figlet from "figlet";
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

program.version("1.0.0").description("My Node CLI");

async function createProjectDirectory(projectPath) {
    try {
        await fs.mkdir(projectPath, { recursive: true });
        return true;
    } catch (error) {
        console.error('Error creating directory:', error);
        return false;
    }
}

async function createPackageJson(projectPath, projectName) {
    const packageJson = {
        name: projectName,
        version: "0.1.0",
        private: true,
        scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
            lint: "next lint"
        },
        dependencies: {
            "next": "14.1.0",
            "react": "^18.2.0",
            "react-dom": "^18.2.0"
        },
        devDependencies: {
            "@types/node": "^20.11.0",
            "@types/react": "^18.2.0",
            "@types/react-dom": "^18.2.0",
            "typescript": "^5.3.0",
            "eslint": "^8.56.0",
            "eslint-config-next": "14.1.0"
        }
    };

    await fs.writeFile(
        path.join(projectPath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    );
}

async function createProjectFiles(projectPath) {
    // Create basic Next.js file structure
    const directories = [
        'public',
        'src/app',
        'src/components',
        'src/styles',
    ];

    for (const dir of directories) {
        await fs.mkdir(path.join(projectPath, dir), { recursive: true });
    }

    // Create main page
    const layoutContent = `
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`;

    const pageContent = `
export default function Home() {
  return (
    <main>
      <h1>Welcome to Next.js!</h1>
    </main>
  )
}`;

    const globalCssContent = `
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
}`;

    await fs.writeFile(path.join(projectPath, 'src/app/layout.tsx'), layoutContent);
    await fs.writeFile(path.join(projectPath, 'src/app/page.tsx'), pageContent);
    await fs.writeFile(path.join(projectPath, 'src/styles/globals.css'), globalCssContent);
}

async function initializeGit(projectPath) {
    try {
        execSync('git init', { cwd: projectPath });
        const gitignoreContent = `
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts`;

        await fs.writeFile(path.join(projectPath, '.gitignore'), gitignoreContent);
    } catch (error) {
        console.error('Error initializing git:', error);
    }
}

program.action(async () => {
    console.log(
        chalk.cyan(figlet.textSync("Set My Stack", { horizontalLayout: "full" }))
    );

    const { projectName } = await inquirer.prompt([
        {
            type: "input",
            name: "projectName",
            message: "What is your project named?",
            default: "my-next-app"
        }
    ]);

    const { template } = await inquirer.prompt([
        {
            type: "list",
            name: "template",
            message: "Choose your template",
            choices: [
                "Default Next.js (TypeScript)",
                "Next.js with Tailwind CSS",
                "Basic Next.js (JavaScript)"
            ],
        }
    ]);

    const spinner = ora(`Creating your Next.js app...`).start();

    const projectPath = path.join(process.cwd(), projectName);

    try {
        // Create project directory
        await createProjectDirectory(projectPath);

        // Create package.json
        await createPackageJson(projectPath, projectName);

        // Create project files
        await createProjectFiles(projectPath);

        // Initialize git
        await initializeGit(projectPath);

        // Install dependencies
        spinner.text = 'Installing dependencies...';
        execSync('npm install', { cwd: projectPath, stdio: 'ignore' });

        spinner.succeed(chalk.green(`
Success! Created ${projectName} at ${projectPath}

To get started, run:
  ${chalk.cyan(`cd ${projectName}`)}
  ${chalk.cyan('npm run dev')}
        `));

    } catch (error) {
        spinner.fail(chalk.red('Failed to create project'));
        console.error(error);
        process.exit(1);
    }
});

program.parse(process.argv);