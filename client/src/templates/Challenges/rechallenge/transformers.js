import {
  cond,
  flow,
  identity,
  matchesProperty,
  overSome,
  partial,
  stubTrue
} from 'lodash';

import * as vinyl from '../utils/polyvinyl.js';
import createWorker from '../utils/worker-executor';

// const sourceReg =
//  /(<!-- fcc-start-source -->)([\s\S]*?)(?=<!-- fcc-end-source -->)/g;
const NBSPReg = new RegExp(String.fromCharCode(160), 'g');

const testJS = matchesProperty('ext', 'js');
const testJSX = matchesProperty('ext', 'jsx');
const testHTML = matchesProperty('ext', 'html');
const testHTML$JS$JSX = overSome(testHTML, testJS, testJSX);
export const testJS$JSX = overSome(testJS, testJSX);

export const replaceNBSP = cond([
  [
    testHTML$JS$JSX,
    partial(vinyl.transformContents, contents => contents.replace(NBSPReg, ' '))
  ],
  [stubTrue, identity]
]);

const babelTransform = createWorker('babel-transform');
const babelTransformCode = options =>
  async function(file) {
    const code = [file.head, file.contents, file.tail];
    const result = await Promise.all(
      code.map(
        async code =>
          await babelTransform.execute(
            {
              code,
              options
            },
            5000
          ).done
      )
    );
    let newFile = vinyl.transformContents(() => result[1], file);
    newFile.head = result[0];
    newFile.tail = result[2];
    return vinyl.setExt('js', newFile);
  };

export const babelTransformer = cond([
  [testJS, flow(babelTransformCode('JS'))],
  [testJSX, flow(babelTransformCode('JSX'))],
  [stubTrue, identity]
]);

const sassWorker = createWorker('sass-compile');
async function transformSASS(element) {
  const styleTags = element.querySelectorAll('style[type="text/sass"]');
  await Promise.all(
    [].map.call(styleTags, async style => {
      style.type = 'text/css';
      style.innerHTML = await sassWorker.execute(style.innerHTML, 5000).done;
    })
  );
}

async function transformScript(element) {
  const scriptTags = element.querySelectorAll('script');
  await Promise.all(
    [].map.call(scriptTags, async script => {
      script.innerHTML = await babelTransform.execute(
        {
          code: script.innerHTML,
          options: 'JSX'
        },
        5000
      ).done;
    })
  );
}

async function transformHtml(file) {
  const div = document.createElement('div');
  div.innerHTML = file.contents;
  await Promise.all([transformSASS(div), transformScript(div)]);
  return vinyl.transformContents(() => div.innerHTML, file);
}

export const composeHTML = cond([
  [
    testHTML,
    flow(
      partial(vinyl.transformHeadTailAndContents, source => {
        const div = document.createElement('div');
        div.innerHTML = source;
        return div.innerHTML;
      }),
      partial(vinyl.compileHeadTail, '')
    )
  ],
  [stubTrue, identity]
]);

export const htmlTransformer = cond([
  [testHTML, transformHtml],
  [stubTrue, identity]
]);

export const transformers = [
  replaceNBSP,
  babelTransformer,
  composeHTML,
  htmlTransformer
];
