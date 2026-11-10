import assert from 'node:assert/strict'
import test from 'node:test'

test('idempotency guard prevents duplicate sale execution', () => {
  const processedTxs = new Map()

  function processSaleWithIdempotency(txId, saleData) {
    if (processedTxs.has(txId)) {
      return { duplicate: true, data: processedTxs.get(txId) }
    }
    const created = { id_venta: processedTxs.size + 1, numero_boleta: `B001-${String(processedTxs.size + 1).padStart(6, '0')}`, total: saleData.total, client_tx_id: txId }
    processedTxs.set(txId, created)
    return { duplicate: false, data: created }
  }

  const tx1 = 'uuid-tx-001'
  const first = processSaleWithIdempotency(tx1, { total: 45.50 })
  assert.equal(first.duplicate, false)
  assert.equal(first.data.id_venta, 1)

  // Reintento idéntico (por caída de red durante ACK)
  const retry = processSaleWithIdempotency(tx1, { total: 45.50 })
  assert.equal(retry.duplicate, true)
  assert.equal(retry.data.id_venta, 1)
  assert.equal(processedTxs.size, 1)
})

test('sync queue transitions states correctly from pending to synced', () => {
  const queue = [
    { id: 1, client_tx_id: 'tx-1', status: 'pending', attempts: 0 },
    { id: 2, client_tx_id: 'tx-2', status: 'pending', attempts: 0 }
  ]

  function markSynced(txId) {
    const item = queue.find(q => q.client_tx_id === txId)
    if (item) item.status = 'synced'
  }

  function markFailed(txId, err) {
    const item = queue.find(q => q.client_tx_id === txId)
    if (item) {
      item.attempts += 1
      item.last_error = err
    }
  }

  markSynced('tx-1')
  markFailed('tx-2', 'Network timeout')

  assert.equal(queue[0].status, 'synced')
  assert.equal(queue[1].status, 'pending')
  assert.equal(queue[1].attempts, 1)
  assert.equal(queue[1].last_error, 'Network timeout')
})

test('contingency receipt numbering formats correctly', () => {
  function formatBoleta(correlativo) {
    return `B001-${String(correlativo).padStart(6, '0')}`
  }

  assert.equal(formatBoleta(1), 'B001-000001')
  assert.equal(formatBoleta(42), 'B001-000042')
  assert.equal(formatBoleta(999999), 'B001-999999')
})

