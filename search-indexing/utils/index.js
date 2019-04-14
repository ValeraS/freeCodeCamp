const _ = require('lodash');
const { isURL } = require('validator');
const stripTags = require('striptags');
const Entities = require('html-entities').AllHtmlEntities;

const entities = new Entities();

const isAFileRE = /(\.md|\.jsx?|\.html?)$/;
const isJSRE = /\.jsx?$/;
const shouldBeIgnoredRE = /^(\_|\.)/;
const excludedDirs = ['search'];

exports.isAFileRE = isAFileRE;
exports.isJSRE = isJSRE;
exports.shouldBeIgnoredRE = shouldBeIgnoredRE;
exports.excludedDirs = excludedDirs;

/*
 *                  *
 * Document Helpers *
 *                  *
 */

exports.chunkDocument = function chunkDocument(doc, pickFields, chunkField) {
  const baseDoc = _.pick(doc, pickFields);
  const chunks = doc[chunkField].match(/([\s]*[\S]+){1,200}/g);
  if (!chunks) {
    return [doc];
  }
  return chunks.map(chunk => ({ ...baseDoc, [chunkField]: chunk }));
};

function stripURLs(str) {
  return str
    .split(/\s/)
    .filter(subStr => !_.isEmpty(subStr))
    .filter(subStr => !isURL(subStr))
    .join(' ');
}

function fixEntities(str) {
  let newStr = str.slice(0);
  function entitiesFixer(match) {
    const tmpArr = match.split('');
    const fixed =
      tmpArr.slice(0, -1).join('') + ';'.concat(tmpArr[tmpArr.length - 1]);
    newStr = newStr.split(match).join(fixed);
  }
  str.replace(/&#\d\d[^(!?;)]/g, entitiesFixer);
  return newStr;
}

exports.stripURLs = stripURLs;

exports.stripHTML = function stripHTML(text) {
  const unescapedStr = entities.decode(fixEntities(text));
  return stripTags(unescapedStr);
};
