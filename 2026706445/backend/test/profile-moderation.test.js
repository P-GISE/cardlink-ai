import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalSupabaseServiceClient } from '../src/db/localSupabase.js';
import { createProfilesService } from '../src/services/profilesService.js';
import { createAdminService } from '../src/services/adminService.js';
import { createContactService } from '../src/services/contactService.js';

test('owner publication cannot undo administrator hiding', async () => {
  const database = createLocalSupabaseServiceClient();
  const profiles = createProfilesService(database);
  const admin = createAdminService(database);
  await admin.updateMemberPublication({ id: 'admin' }, 'profile-demo', { isPublished: false });
  await profiles.upsertOwnProfile({ id: 'demo-owner' }, {
    slug: 'minjun', displayName: 'Owner', isPublished: true
  });
  assert.equal(await profiles.getPublishedProfileBySlug('minjun'), null);
  assert.equal((await profiles.listPublishedProfiles()).some(item => item.slug === 'minjun'), false);
  await assert.rejects(
    createContactService(database).createContactRequest({ id: 'recommendation-user-1' }, 'minjun'),
    /Profile not found/
  );
  const { data: hidden } = await database.from('profiles').select().eq('user_id', 'demo-owner').single();
  await admin.updateMemberPublication({ id: 'admin' }, hidden.id, { isPublished: true });
  assert.equal((await profiles.getPublishedProfileBySlug('minjun')).slug, 'minjun');
});
