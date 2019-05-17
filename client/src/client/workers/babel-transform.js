import * as Babel from '@babel/standalone';
import presetEnv from '@babel/preset-env';
import presetReact from '@babel/preset-react';
import protect from 'loop-protect';

const protectTimeout = 100;
Babel.registerPlugin('loopProtection', protect(protectTimeout));

const babelOptions = {
  JSX: {
    plugins: ['loopProtection'],
    presets: [presetEnv, presetReact]
  },

  JS: {
    presets: [presetEnv]
  }
};

const babelTransformCode = (code, options) =>
  Babel.transform(code, babelOptions[options]).code;

self.onmessage = e => {
  try {
    const { code, options } = e.data;
    const newCode = babelTransformCode(code, options);
    self.postMessage(newCode);
  } catch (err) {
    self.postMessage({ type: 'error', data: { message: err.message } });
  }
};

self.postMessage({ type: 'contentLoaded' });
