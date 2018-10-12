const crypto = require('crypto');
const path = require('path');

const commonREs = require('../../utils/regEx');
const readDir = require('../../utils/readDir');

const { isAStubRE } = commonREs;
const pagesDir = path.resolve(__dirname, '../../src/pages/guide/english/');
const indexMdRe = new RegExp(`\\${path.sep}index.md$`);

function withGuidePrefix(str) {
  return `/guide${str}`;
}

exports.createNavigationNode = node => {
  const {
    fileAbsolutePath,
    frontmatter: { title },
    internal: { content },
    parent
  } = node;

  const nodeDir = path.resolve(fileAbsolutePath).replace(indexMdRe, '');
  const dashedName = nodeDir.split(path.sep).slice(-1)[0];
  const currentPath = nodeDir.split(pagesDir)[1].split(path.sep).join('/');
  const parentPath = currentPath
    .split('/')
    .slice(0, -1)
    .join('/');

  const categoryChildren = readDir(nodeDir);
  const navNode = {
    categoryChildren,
    hasChildren: !!categoryChildren.length,
    dashedName,
    isStubbed: isAStubRE.test(content),
    path: withGuidePrefix(currentPath),
    parentPath: withGuidePrefix(parentPath),
    title
  };

  const gatsbyRequired = {
    id: fileAbsolutePath + ' >>> NavigationNode',
    parent,
    children: [],
    internal: {
      type: 'NavigationNode',
      contentDigest: crypto
        .createHash('md5')
        .update(JSON.stringify(navNode))
        .digest('hex')
    }
  };

  return { ...navNode, ...gatsbyRequired };
};
