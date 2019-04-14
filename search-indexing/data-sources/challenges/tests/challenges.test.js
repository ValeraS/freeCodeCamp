/* global expect */
const faker = require('faker');
const getChallenges = require('../');

const curriculum = {
  superBlock1: {
    blocks: {
      block1: {
        meta: { dashedName: 'block1' },
        challenges: [
          {
            id: 1,
            title: 'challenge name 1',
            description: 'description',
            instructions: 'instructions',
            dashedName: 'challenge-name1',
            superBlock: 'super-block1',
            block: 'block 1'
          }
        ]
      },
      block2: {
        meta: { dashedName: 'block2' },
        challenges: [
          {
            id: 2,
            title: 'challenge name 2',
            description: 'description',
            instructions: 'instructions',
            dashedName: 'challenge-name2',
            superBlock: 'super-block1',
            block: 'block 2'
          },
          {
            id: 3,
            title: 'challenge name 3',
            description: 'description',
            instructions: 'instructions',
            dashedName: 'challenge-name3',
            superBlock: 'super-block1',
            block: 'block 2'
          }
        ]
      }
    }
  },
  superBlock2: {
    blocks: {
      block3: {
        meta: { dashedName: 'block3' },
        challenges: [
          {
            id: 4,
            title: 'challenge name 4',
            description: 'description',
            instructions: 'instructions',
            dashedName: 'challenge-name4',
            superBlock: 'super-block2',
            block: 'block 3'
          },
          {
            id: 5,
            title: 'challenge name 5',
            description: 'description',
            instructions: 'instructions',
            dashedName: 'challenge-name5',
            superBlock: 'super-block2',
            block: 'block 3'
          },
          {
            id: 6,
            title: 'challenge name 6',
            description: 'description',
            instructions: 'instructions',
            dashedName: 'challenge-name6',
            superBlock: 'super-block2',
            block: 'block 3'
          }
        ]
      }
    }
  }
};

describe('Data Source Challenges', () => {
  describe('getChallenges', () => {
    it('should return an Observable<Challenge[]>', done => {
      const allChallenges = [];
      let numberOfChallenges = 1;
      const value = getChallenges(Promise.resolve(curriculum));
      value.subscribe({
        next: challenges => {
          expect(Array.isArray(challenges)).toBe(true);
          expect(challenges.length).toBe(numberOfChallenges++);
          challenges.forEach(challenge => {
            expect(challenge).toHaveProperty('title');
            expect(challenge).toHaveProperty('id');
            expect(challenge).toHaveProperty('blockName');
            expect(challenge).toHaveProperty('url');
            expect(challenge).toHaveProperty('description');
          });
          allChallenges.push(...challenges);
        },
        complete: () => {
          expect(allChallenges.length).toBe(6);
          done();
        }
      });
    });

    it('should filter super block with certificates', done => {
      const allChallenges = [];
      const curriculum2 = {
        ...curriculum,
        certificates: {
          blocks: {
            block2: {
              meta: { dashedName: 'block2' },
              challenges: [
                {
                  id: 1,
                  title: 'challenge name 2',
                  description: 'description',
                  instructions: 'instructions',
                  dashedName: 'challenge-name2',
                  superBlock: 'certificates',
                  block: 'block 2'
                }
              ]
            }
          }
        }
      };
      const value = getChallenges(Promise.resolve(curriculum2));
      value.subscribe({
        next: challenges => {
          allChallenges.push(...challenges);
        },
        complete: () => {
          expect(allChallenges.length).toBe(6);
          done();
        }
      });
    });

    it('should filter private challenges', done => {
      const allChallenges = [];
      let numberOfChallenges = 1;
      const curriculum2 = { ...curriculum };
      curriculum2.superBlock1.blocks.block1.challenges.push({
        id: 2,
        title: 'challenge name 2',
        description: 'description',
        instructions: 'instructions',
        dashedName: 'challenge-name2',
        superBlock: 'super-block1',
        block: 'block 1',
        isPrivate: true
      });
      curriculum2.superBlock1.blocks.block2.challenges.push({
        id: 2,
        title: 'challenge name 2',
        description: 'description',
        instructions: 'instructions',
        dashedName: 'challenge-name2',
        superBlock: 'super-block1',
        block: 'block 2',
        isPrivate: true
      });
      const value = getChallenges(Promise.resolve(curriculum2));
      value.subscribe({
        next: challenges => {
          expect(challenges.length).toBe(numberOfChallenges++);
          allChallenges.push(...challenges);
        },
        complete: () => {
          expect(allChallenges.length).toBe(6);
          done();
        }
      });
    });

    it('should divide description into parts of 200 words', done => {
      const allChallenges = [];
      let numberOfChallenges = 1;
      const description = faker.lorem.words(670);
      const curriculum2 = {
        ...curriculum,
        superBlock3: {
          blocks: {
            block4: {
              meta: { dashedName: 'block4' },
              challenges: [
                {
                  id: 8,
                  title: 'challenge name 8',
                  description,
                  instructions: 'instructions',
                  dashedName: 'challenge-name8',
                  superBlock: 'super-block3',
                  block: 'block 4'
                }
              ]
            }
          }
        }
      };
      const value = getChallenges(Promise.resolve(curriculum2));
      value.subscribe({
        next: challenges => {
          expect(challenges.length).toBe(numberOfChallenges++);
          allChallenges.push(...challenges);
        },
        complete: () => {
          expect(allChallenges.length).toBe(10);
          expect(
            allChallenges
              .slice(-4)
              .reduce((description, _) => description + _.description, '')
          ).toBe(description.concat('instructions'));
          done();
        }
      });
    });
  });
});
