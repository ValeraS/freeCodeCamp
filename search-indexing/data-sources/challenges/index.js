const { from } = require('rxjs');
const { mergeMap, map, tap, filter, toArray } = require('rxjs/operators');
const debug = require('debug');

const { getChallengesForLang } = require('../../../curriculum/getChallenges');
const { chunkDocument, stripHTML, stripURLs } = require('../../utils');

const log = debug('fcc:search:data-source:challenges');

const { LOCALE: lang = 'english' } = process.env;

module.exports = function getChallenges(
  curriculum = getChallengesForLang(lang),
  options = {}
) {
  log('sourcing challenges');
  const { urlPrefix = '/learn' } = options;
  return from(curriculum).pipe(
    tap(() => log('parsing curriculum')),
    mergeMap(curriculum => {
      const superBlocks = Object.keys(curriculum).filter(
        x => x !== 'certificates'
      );
      return from(superBlocks.map(superBlock => curriculum[superBlock]));
    }),
    mergeMap(superBlock => {
      const { blocks } = superBlock;
      return from(Object.keys(blocks).map(block => blocks[block]));
    }),
    map(block => {
      const { meta, challenges } = block;
      const { dashedName: blockDashedName } = meta;
      return challenges.map(challenge => ({ ...challenge, blockDashedName }));
    }),
    mergeMap(challenges =>
      from(challenges).pipe(
        filter(({ isPrivate }) => !isPrivate),
        mergeMap(challenge => {
          const {
            id,
            title,
            description,
            instructions,
            dashedName,
            superBlock,
            blockDashedName,
            block
          } = challenge;
          const formattedChallenge = {
            blockName: block,
            id,
            title,
            description: stripURLs(stripHTML(description.concat(instructions))),
            url: `${urlPrefix}/${superBlock}/${blockDashedName}/${dashedName}`
          };
          return from(
            chunkDocument(
              formattedChallenge,
              ['title', 'id', 'blockName', 'url'],
              'description'
            )
          );
        }),
        toArray()
      )
    )
  );
};
