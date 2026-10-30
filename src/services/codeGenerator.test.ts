import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import { TEMPLATES } from './templates';
import { generateMiniProgramFiles } from './codeGenerator';
import { exportMiniProgramAsZip } from './zipExport';

/**
 * Helper: Writes the generated ZIP Blob to disk and extracts all entries into a real temporary directory
 * to simulate a user extracting the downloaded ZIP archive on their computer.
 */
async function extractZipToTempDir(blob: Blob): Promise<{ extractDir: string; zipEntryPaths: string[] }> {
  const extractDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wx-miniprogram-unzip-'));
  const arrayBuffer = await blob.arrayBuffer();
  const loadedZip = await JSZip.loadAsync(arrayBuffer);
  const zipEntryPaths = Object.keys(loadedZip.files);

  for (const [relPath, entry] of Object.entries(loadedZip.files)) {
    const destPath = path.join(extractDir, relPath);
    if (entry.dir) {
      fs.mkdirSync(destPath, { recursive: true });
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      const content = await entry.async('nodebuffer');
      fs.writeFileSync(destPath, content);
    }
  }

  return { extractDir, zipEntryPaths };
}

/**
 * Helper: Recursively find all files matching a filename inside a directory
 */
function findFilesByName(dir: string, targetName: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFilesByName(full, targetName));
    } else if (entry.name === targetName) {
      results.push(full);
    }
  }
  return results;
}

test('1. TEMPLATES has all predefined templates including depth_video with valid pages', () => {
  assert.equal(TEMPLATES.length, 5);
  const ids = TEMPLATES.map((t) => t.id);
  assert.deepEqual(ids, ['depth_video', 'dining', 'booking', 'business', 'habits']);

  for (const t of TEMPLATES) {
    assert.ok(t.name.length > 0, `Template ${t.id} must have a name`);
    assert.ok(t.pages.length >= 3, `Template ${t.id} must have at least 3 pages`);
    assert.ok(t.tabBar.length >= 3, `Template ${t.id} must have at least 3 tabs`);
  }
});

test('2. generateMiniProgramFiles produces valid app.json without missing tabBar icon paths across all templates', () => {
  for (const template of TEMPLATES) {
    const meta = {
      appName: template.name,
      appId: 'wx1234567890abcdef',
      version: '1.0.0',
      themeColor: template.themeColor,
      themeBg: '#F7F8FA',
      author: 'AI Studio',
      description: template.description
    };

    const files = generateMiniProgramFiles(template, meta);
    const filePaths = files.map((f) => f.path);

    // Check required root files
    assert.ok(filePaths.includes('project.config.json'), 'Must generate project.config.json');
    assert.ok(filePaths.includes('project.private.config.json'), 'Must generate project.private.config.json');
    assert.ok(filePaths.includes('app.json'), 'Must generate app.json');
    assert.ok(filePaths.includes('app.wxss'), 'Must generate app.wxss');
    assert.ok(filePaths.includes('app.js'), 'Must generate app.js');
    assert.ok(filePaths.includes('sitemap.json'), 'Must generate sitemap.json');

    // Parse and validate app.json
    const appJsonFile = files.find((f) => f.path === 'app.json')!;
    const parsedAppJson = JSON.parse(appJsonFile.content);

    for (const tab of parsedAppJson.tabBar.list) {
      assert.ok(parsedAppJson.pages.includes(tab.pagePath), `tabBar pagePath ${tab.pagePath} must be in app.json pages`);
      assert.ok(typeof tab.text === 'string' && tab.text.length > 0, 'tabBar item must have text');
      assert.equal('iconPath' in tab, false, 'tabBar must not reference missing iconPath');
      assert.equal('selectedIconPath' in tab, false, 'tabBar must not reference missing selectedIconPath');
    }
    assert.equal(appJsonFile.content.includes('images/tabbar/'), false, 'app.json must not reference missing images/tabbar/ files');
  }
});

test('3. ZIP extraction verification: app.json, app.js, app.wxss, and project.config.json are directly in the 1st-level root directory', async () => {
  const depthTemplate = TEMPLATES.find((t) => t.id === 'depth_video')!;
  const meta = {
    appName: '幻深 · 抖音/视频转灰度深度视频',
    appId: 'wxd000000000000001',
    version: '1.0.0',
    themeColor: '#2563EB',
    themeBg: '#F7F8FA',
    author: 'AI Studio',
    description: '视频转灰度相对深度视频 MP4'
  };

  const files = generateMiniProgramFiles(depthTemplate, meta);
  const zipBlob = await exportMiniProgramAsZip(files, meta);
  const { extractDir, zipEntryPaths } = await extractZipToTempDir(zipBlob);

  try {
    // Check 1: First level of extracted ZIP contains app.json
    assert.equal(fs.existsSync(path.join(extractDir, 'app.json')), true, 'app.json must exist at 1st level of extracted ZIP');
    assert.equal(zipEntryPaths.includes('app.json'), true, 'ZIP entry app.json must be at root');

    // Check 2: First level of extracted ZIP contains app.js and app.wxss
    assert.equal(fs.existsSync(path.join(extractDir, 'app.js')), true, 'app.js must exist at 1st level of extracted ZIP');
    assert.equal(fs.existsSync(path.join(extractDir, 'app.wxss')), true, 'app.wxss must exist at 1st level of extracted ZIP');

    // Check 3: First level of extracted ZIP contains project.config.json and project.private.config.json
    assert.equal(
      fs.existsSync(path.join(extractDir, 'project.config.json')),
      true,
      'project.config.json must exist at 1st level of extracted ZIP'
    );
    assert.equal(
      fs.existsSync(path.join(extractDir, 'project.private.config.json')),
      true,
      'project.private.config.json must exist at 1st level of extracted ZIP'
    );
  } finally {
    fs.rmSync(extractDir, { recursive: true, force: true });
  }
});

test('4. ZIP extraction verification: all pages declared in app.json exist on disk after unzipping', async () => {
  const depthTemplate = TEMPLATES.find((t) => t.id === 'depth_video')!;
  const meta = {
    appName: '幻深 · 抖音/视频转灰度深度视频',
    appId: 'touristappid',
    version: '1.0.0',
    themeColor: '#2563EB',
    themeBg: '#F7F8FA',
    author: 'AI Studio',
    description: '视频转灰度相对深度视频 MP4'
  };

  const files = generateMiniProgramFiles(depthTemplate, meta);
  const zipBlob = await exportMiniProgramAsZip(files, meta);
  const { extractDir } = await extractZipToTempDir(zipBlob);

  try {
    const appJsonRaw = fs.readFileSync(path.join(extractDir, 'app.json'), 'utf-8');
    const appJson = JSON.parse(appJsonRaw);

    assert.deepEqual(appJson.pages, [
      'pages/index/index',
      'pages/process/process',
      'pages/player/player',
      'pages/history/history'
    ]);

    for (const pagePath of appJson.pages) {
      for (const ext of ['.js', '.json', '.wxml', '.wxss']) {
        const fullPageFile = path.join(extractDir, `${pagePath}${ext}`);
        assert.equal(
          fs.existsSync(fullPageFile),
          true,
          `Declared page file ${pagePath}${ext} must exist in extracted directory`
        );
      }
    }
  } finally {
    fs.rmSync(extractDir, { recursive: true, force: true });
  }
});

test('5. ZIP extraction verification: miniprogramRoot points to a valid existing directory containing app.json and no nested wrapper folders exist', async () => {
  const depthTemplate = TEMPLATES.find((t) => t.id === 'depth_video')!;
  const meta = {
    appName: '幻深 · 抖音/视频转灰度深度视频',
    appId: 'touristappid',
    version: '1.0.0',
    themeColor: '#2563EB',
    themeBg: '#F7F8FA',
    author: 'AI Studio',
    description: '视频转灰度相对深度视频 MP4'
  };

  const files = generateMiniProgramFiles(depthTemplate, meta);
  const zipBlob = await exportMiniProgramAsZip(files, meta);
  const { extractDir } = await extractZipToTempDir(zipBlob);

  try {
    const projectConfig = JSON.parse(fs.readFileSync(path.join(extractDir, 'project.config.json'), 'utf-8'));
    const privateConfig = JSON.parse(fs.readFileSync(path.join(extractDir, 'project.private.config.json'), 'utf-8'));

    // Check 5: miniprogramRoot points to a real existing directory that contains app.json
    const mpRoot = projectConfig.miniprogramRoot || '.';
    const resolvedMpRoot = path.resolve(extractDir, mpRoot);
    assert.equal(fs.existsSync(resolvedMpRoot), true, 'miniprogramRoot target directory must exist');
    assert.equal(
      fs.existsSync(path.join(resolvedMpRoot, 'app.json')),
      true,
      'miniprogramRoot directory must contain app.json'
    );

    // Ensure project.private.config.json does not override miniprogramRoot with a broken path
    assert.equal(
      'miniprogramRoot' in privateConfig,
      false,
      'project.private.config.json must not override miniprogramRoot'
    );

    // Check 6: No duplicate nested project.config.json or app.json (no russian-doll wrapper directory)
    const allProjectConfigs = findFilesByName(extractDir, 'project.config.json');
    const allAppJsons = findFilesByName(extractDir, 'app.json');
    assert.equal(allProjectConfigs.length, 1, 'Must have exactly 1 project.config.json in extracted archive');
    assert.equal(allAppJsons.length, 1, 'Must have exactly 1 app.json in extracted archive');
    assert.equal(allProjectConfigs[0], path.join(extractDir, 'project.config.json'));
    assert.equal(allAppJsons[0], path.join(extractDir, 'app.json'));

    // Verify top-level entries of extractDir are only the expected files + pages/ + utils/ folders
    const topLevelEntries = fs.readdirSync(extractDir).sort();
    assert.deepEqual(
      topLevelEntries,
      [
        'README.md',
        'app.js',
        'app.json',
        'app.wxss',
        'pages',
        'project.config.json',
        'project.private.config.json',
        'sitemap.json',
        'utils'
      ].sort()
    );
    assert.equal(
      fs.existsSync(path.join(extractDir, 'utils', 'config.js')),
      true,
      'utils/config.js must exist in extracted ZIP'
    );
  } finally {
    fs.rmSync(extractDir, { recursive: true, force: true });
  }
});

test('6. Core business workflow verification: Douyin watermark removal & grayscale depth video features are preserved', () => {
  const depthTemplate = TEMPLATES.find((t) => t.id === 'depth_video')!;
  const meta = {
    appName: '幻深 · 抖音/视频转灰度深度视频',
    appId: 'touristappid',
    version: '1.0.0',
    themeColor: '#2563EB',
    themeBg: '#F7F8FA',
    author: 'AI Studio',
    description: '视频转灰度相对深度视频 MP4'
  };

  const files = generateMiniProgramFiles(depthTemplate, meta);
  const wxmls = files.filter((f) => f.path.endsWith('.wxml')).map((f) => f.content).join('\n');
  const jsFiles = files.filter((f) => f.path.endsWith('.js')).map((f) => f.content).join('\n');

  // Verify no SBS 3D or stereoscopic illusions
  assert.equal(wxmls.includes('SBS 3D'), false);
  assert.equal(wxmls.includes('双目立体'), false);
  assert.equal(wxmls.includes('红蓝 3D'), false);

  // Verify real grayscale depth and watermark removal APIs are intact
  assert.ok(wxmls.includes('灰度深度') || wxmls.includes('相对深度'));
  assert.ok(jsFiles.includes('/api/parse'));
  assert.ok(jsFiles.includes('/api/jobs/douyin'));
  assert.ok(jsFiles.includes('/api/jobs/upload'));
});

test('7. Zero hardcoded localhost:3000 in generated Mini Program files and unified API_BASE_URL via utils/config.js', async () => {
  const depthTemplate = TEMPLATES.find((t) => t.id === 'depth_video')!;
  const defaultMeta = {
    appName: '幻深 · 抖音/视频转灰度深度视频',
    appId: 'touristappid',
    version: '1.0.0',
    themeColor: '#2563EB',
    themeBg: '#F7F8FA',
    author: 'AI Studio',
    description: '视频转灰度相对深度视频 MP4'
  };

  const files = generateMiniProgramFiles(depthTemplate, defaultMeta);

  // 1. Check no file in generated Mini Program contains localhost:3000 or 127.0.0.1:3000
  for (const file of files) {
    assert.equal(
      file.content.includes('localhost:3000'),
      false,
      `Generated file ${file.path} must NOT contain hardcoded localhost:3000`
    );
    assert.equal(
      file.content.includes('127.0.0.1:3000'),
      false,
      `Generated file ${file.path} must NOT contain hardcoded 127.0.0.1:3000`
    );
  }

  // 2. Verify utils/config.js exists and exports API_BASE_URL, isApiConfigured, buildApiUrl
  const configFile = files.find((f) => f.path === 'utils/config.js');
  assert.ok(configFile, 'utils/config.js must be generated');
  assert.ok(configFile.content.includes("const API_BASE_URL = 'https://YOUR_API_DOMAIN';"));
  assert.ok(configFile.content.includes('isApiConfigured'));
  assert.ok(configFile.content.includes('buildApiUrl'));

  // 3. Verify all business pages import from ../../utils/config.js and use buildApiUrl(...)
  const indexJs = files.find((f) => f.path === 'pages/index/index.js')!;
  const processJs = files.find((f) => f.path === 'pages/process/process.js')!;
  const playerJs = files.find((f) => f.path === 'pages/player/player.js')!;

  assert.ok(indexJs.content.includes("require('../../utils/config.js')"));
  assert.ok(processJs.content.includes("require('../../utils/config.js')"));
  assert.ok(playerJs.content.includes("require('../../utils/config.js')"));

  assert.ok(indexJs.content.includes("buildApiUrl('/api/health')"));
  assert.ok(indexJs.content.includes("buildApiUrl('/api/parse')"));
  assert.ok(indexJs.content.includes("buildApiUrl('/api/jobs/douyin')"));
  assert.ok(indexJs.content.includes("buildApiUrl('/api/jobs/upload')"));
  assert.ok(processJs.content.includes("buildApiUrl('/api/jobs/' + this.data.jobId)"));
  assert.ok(playerJs.content.includes("buildApiUrl('/api/jobs/' + jobId + '/depth-video')"));
  assert.ok(playerJs.content.includes("buildApiUrl('/api/jobs/' + this.data.jobId + '/download')"));
});

test('8. Custom apiBaseUrl configured in generator is written into utils/config.js and works at runtime', async () => {
  const depthTemplate = TEMPLATES.find((t) => t.id === 'depth_video')!;
  const customMeta = {
    appName: '幻深 · 抖音/视频转灰度深度视频',
    appId: 'touristappid',
    version: '1.0.0',
    themeColor: '#2563EB',
    themeBg: '#F7F8FA',
    author: 'AI Studio',
    description: '视频转灰度相对深度视频 MP4',
    apiBaseUrl: 'https://depth-api.mycloud.example.com/'
  };

  const files = generateMiniProgramFiles(depthTemplate, customMeta);
  const zipBlob = await exportMiniProgramAsZip(files, customMeta);
  const { extractDir } = await extractZipToTempDir(zipBlob);

  try {
    const configPath = path.join(extractDir, 'utils', 'config.js');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    // Trailing slash should be normalized
    assert.ok(
      configContent.includes("const API_BASE_URL = 'https://depth-api.mycloud.example.com';"),
      'Custom apiBaseUrl must be written into utils/config.js without trailing slash'
    );
  } finally {
    fs.rmSync(extractDir, { recursive: true, force: true });
  }
});

