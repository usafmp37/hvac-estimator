import test from 'node:test';
import assert from 'node:assert/strict';
import { authorized, buildDraft, projectIdFor } from '../api/automation/_core.js';

test('bearer authorization uses an exact token match', () => {
  assert.equal(authorized('Bearer correct', 'correct'), true);
  assert.equal(authorized('Bearer wrong', 'correct'), false);
  assert.equal(authorized(undefined, 'correct'), false);
});

test('builds a safe draft from a Notion request', () => {
  const draft = buildDraft({ request: {
    pageId: 'abc-123',
    shortDescription: 'Smith estimate',
    neededBy: '2026-09-20',
    estimate: { systems: [{ name: 'Main', sqft: 2500, thermostats: 1 }] }
  } }, new Date('2026-09-15T12:00:00Z'));
  assert.equal(draft.projectName, 'Smith estimate');
  assert.equal(draft.systems.length, 1);
  assert.equal(draft.totalACSqft, 2500);
  assert.equal(draft.status, 'draft');
  assert.equal(draft.bidDueDate, '2026-09-20');
});

test('project IDs are deterministic', () => {
  assert.equal(projectIdFor('abc-123'), projectIdFor('abc-123'));
  assert.notEqual(projectIdFor('abc-123'), projectIdFor('different'));
});
