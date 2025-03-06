import * as fs from 'fs/promises';
import * as path from 'path';

async function syncVersion() {
  try {
    // Read package.json
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    const version = packageJson.version;

    // Update CLI version
    const cliPath = path.resolve(__dirname, '../src/cli/index.ts');
    let cliContent = await fs.readFile(cliPath, 'utf-8');

    // Replace hardcoded version with import
    if (!cliContent.includes("import { version } from '../../package.json'")) {
      cliContent = `import { program } from 'commander';\nimport { version } from '../../package.json';\n\n${cliContent}`;
      cliContent = cliContent.replace(
        /\.version\(['"].*['"]\)/,
        '.version(version)',
      );

      await fs.writeFile(cliPath, cliContent, 'utf-8');
      console.log('✅ Successfully updated CLI version import');
    }

    console.log(`🔄 Version synchronized to: ${version}`);
  } catch (error) {
    console.error('❌ Error syncing version:', error);
    process.exit(1);
  }
}

syncVersion();
