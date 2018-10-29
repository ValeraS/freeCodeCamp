const axios = require('axios');
const util = require('util');

require('dotenv').config();

const { spawn } = require('child_process');
const exec = util.promisify(require('child_process').exec);

const spawnOpts = {
  stdio: 'inherit',
  shell: true
};

const languages = [
  'english',
  'arabic',
  'chinese',
  'portuguese',
  'russian',
  'spanish'
];

async function getModifiedFiles() {
  let files = '';
  if (process.env.TRAVIS_PULL_REQUEST !== 'false') {
    const url = `https://api.github.com/repos/${process.env.TRAVIS_REPO_SLUG}/pulls/${process.env.TRAVIS_PULL_REQUEST}/files`;
    const response = await axios.get(url);
    files = response.data;
  } else {
    const url = `https://api.github.com/repos/${process.env.TRAVIS_REPO_SLUG}/compare/${process.env.TRAVIS_COMMIT_RANGE}`;
    const response = await axios.get(url);
    files = response.data.files;
  }
  return files.map(({ filename }) => filename ).join('\n');
}

(async function() {
  try {
    const changes = await getModifiedFiles();
    const curriculumChanged = (/^curriculum\//gm).test(changes);
    const clientChanged = (/^client\//gm).test(changes);
    const serverChanged = (/^server\//gm).test(changes);
    const guideChanged = (/^guide\//gm).test(changes);
    const toolsChanged = (/^tools\//gm).test(changes);

    spawn('npm', ['run lint'], spawnOpts);

    if (guideChanged) {
      spawn('npm', ['run test:guide-directories'], spawnOpts);
    }

    if (clientChanged || serverChanged || toolsChanged || curriculumChanged) {
      const { stdout } = await exec('npm run prebootstrap && $(npm bin)/lerna bootstrap');
      console.warn(stdout);
    }

    if (clientChanged) {
      spawn('npm', ['run test:client'], spawnOpts);
    }

    if (serverChanged) {
      spawn('npm', ['run test:server'], spawnOpts);
    }

    if (toolsChanged) {
      spawn('npm', ['run test:tools'], spawnOpts);
    }

    if (curriculumChanged) {
      languages.forEach(lang => {
        if (new RegExp(`^curriculum/challenges/${lang}`, 'gm').test(changes)) {
          spawn('npm', ['run test:curriculum'], {
            ...spawnOpts,
            env: {
              ...process.env,
              LOCALE: lang
            }
          });
        }
      });
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
