import assert from 'node:assert/strict';
import {test} from 'node:test';
import 'dotenv/config';
import type {
  AdminDataset,
  AdminSectionKey,
} from '../src/services/adminOperationsService';

const {buildAdminSnapshotFromDatasets} = await import('../src/services/adminOperationsService');

function dataset(key: AdminSectionKey, rows: AdminDataset['rows'], error?: string): AdminDataset {
  return {
    key,
    collectionName: key,
    label: key,
    description: key,
    rows,
    statusCounts: rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    }, {}),
    error,
  };
}

test('buildAdminSnapshotFromDatasets preserves partial data and dataset errors', () => {
  const loadedAt = new Date('2026-05-07T00:00:00.000Z');
  const snapshot = buildAdminSnapshotFromDatasets([
    dataset('users', [
      {
        id: 'user_1',
        collection: 'users',
        title: 'buyer@example.com',
        subtitle: 'buyer',
        status: 'active',
        owner: 'user_1',
        raw: {email: 'buyer@example.com', role: 'buyer'},
      },
    ]),
    dataset('payments', [], 'Missing or insufficient permissions.'),
  ], loadedAt);

  assert.equal(snapshot.datasets.users.rows.length, 1);
  assert.equal(snapshot.datasets.payments.error, 'Missing or insufficient permissions.');
  assert.equal(snapshot.datasets.overview.rows.length, 0);
  assert.equal(snapshot.loadedAt, loadedAt);
  assert.equal(snapshot.metrics.some((metric) => metric.label.length > 0), true);
});
