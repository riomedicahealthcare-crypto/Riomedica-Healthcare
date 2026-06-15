import { rolldown } from 'rolldown';
import path from 'path';

const files = [
  'src/utils.js',
  'src/components/MobileApp.jsx',
  'src/components/AdminLayout.jsx',
  'src/components/AndroidFrame.jsx',
  'src/components/CanvasDraw.jsx',
  'src/App.jsx',
  'src/main.jsx',
  'src/index.css'
];

async function testFiles() {
  for (const file of files) {
    const absolutePath = path.resolve(file);
    console.log(`Testing Rolldown on: ${file}...`);
    try {
      const bundle = await rolldown({
        input: absolutePath,
        platform: 'browser',
        external: () => true
      });
      await bundle.generate({});
      console.log(`✅ ${file} compiled successfully!`);
    } catch (err) {
      console.error(`❌ ${file} FAILED compilation! Error:`);
      console.error(err.message || err);
    }
    console.log('-----------------------------------');
  }
}

testFiles();
