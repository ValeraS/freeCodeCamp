const path = require('path');
const fs = require('fs');
const readdirp = require('readdirp-walk');
const matter = require('gray-matter');
const _ = require('lodash');

const challengeRoot = path.resolve(__dirname, '../../../curriculum/challenges');
const metaRoot = path.join(challengeRoot, '_meta');

const allowedLangDirNames = [
  'arabic',
  'chinese',
  'english',
  'portuguese',
  'russian',
  'spanish'
];

async function checkFile(file) {
  const { stat, depth, name, fullPath, path: filePath } = file;
  if ((depth < 4 && !stat.isDirectory()) || (depth === 4 && !stat.isFile())) {
    throw new Error(`${name} is not valid in the ${filePath} directory`);
  }
  if (depth === 1) {
    if (!allowedLangDirNames.includes(name)) {
      throw new Error(
        `${name} should not be in the ${challengeRoot} directory`
      );
    }
  }

  checkFileName(name, fullPath);

  if (depth === 3) {
    await new Promise((resolve, reject) => {
      fs.stat(path.join(metaRoot, name), (err, stats) => {
        if (err || !stats.isDirectory()) {
          return reject(
            new Error(`${metaRoot} should contain ${name} directory`)
          );
        }
        return resolve();
      });
    });
  }

  if (stat.isFile()) {
    await checkFrontmatter(fullPath);
  }
}

readdirp({ root: challengeRoot, directoryFilter: '!_meta' })
  .on('data', file =>
    checkFile(file).catch(err => {
      console.error(err);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    })
  )
  .on('end', () => {
    console.log(`

    challenge directory shallow checks complete

`);
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  });

function checkFileName(fileName, fullPath) {
  if (fileName.replace(/(\s|\_)/, '') !== fileName) {
    throw new Error(`
  Invalid character found in '${fileName}', please use '-' for spaces

  Found in:
        ${fullPath}
    `);
  }
  if (fileName.toLowerCase() !== fileName) {
    throw new Error(`
  Upper case characters found in ${fileName}, all file names must be lower case

  Found in :
    ${fullPath}
  `);
  }
}

function checkFrontmatter(fullPath) {
  return new Promise((resolve, reject) =>
    fs.readFile(fullPath, 'utf8', (err, content) => {
      if (err) {
        return reject(new Error(err));
      }
      try {
        const relativePath = fullPath.replace(challengeRoot, '');
        const lang = relativePath.split(path.sep)[1];
        const { data: frontmatter } = matter(content);
        if (
          !frontmatter ||
          _.isEmpty(frontmatter) ||
          !frontmatter.id ||
          !frontmatter.title ||
          (lang !== 'english' && typeof frontmatter.localeTitle === 'undefined')
        ) {
          return reject(
            new Error(`
  The challenge at: ${fullPath} is missing frontmatter.

  Example:

  ---
  id: uniq id
  title: The Article Title
  localeTitle: The Translated Title # Only required for translations
  ---

  < The Challenge Body >

  `)
          );
        }
        if (lang !== 'english' && !!frontmatter.videoUrl) {
          return reject(new Error(`${fullPath} should not contain videoUrl`));
        }
        const metaFile = path.join(
          metaRoot,
          relativePath.split(path.sep).reverse()[1],
          'meta.json'
        );
        return resolve(
          new Promise((resolve, reject) =>
            fs.readFile(metaFile, 'utf8', (err, content) => {
              if (err) {
                return reject(err);
              }
              const meta = JSON.parse(content);
              if (
                meta.superBlock !==
                relativePath
                  .split(path.sep)
                  .reverse()[2]
                  .slice(3)
              ) {
                return reject(
                  new Error(
                    `The challenge at: ${fullPath} incorrect superBlock.`
                  )
                );
              }
              if (
                !meta.challengeOrder.map(el => el[0]).includes(frontmatter.id)
              ) {
                return reject(
                  new Error(
                    `${metaFile} should includes ${
                      frontmatter.id
                    } from ${fullPath}`
                  )
                );
              }
              return resolve();
            })
          )
        );
      } catch (e) {
        console.log(`

  The below occurred in:

  ${fullPath}

  `);
        throw e;
      }
    })
  );
}
