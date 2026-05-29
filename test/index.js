'use strict'
const assert = require('node:assert')
const { beforeEach, describe, it } = require('node:test')

const { callHook, makeConnection, makePlugin } = require('haraka-test-fixtures')

const _set_up = () => {
  this.plugin = makePlugin('early_talker', { register: false })
  this.plugin.cfg = { main: { reject: true } }

  this.connection = makeConnection()
}

describe('early_talker', () => {
  beforeEach(_set_up)

  it('no config', async () => {
    const { rc, msg } = await callHook(
      this.plugin,
      'early_talker',
      this.connection,
    )
    assert.equal(rc, undefined)
    assert.equal(msg, undefined)
  })

  it('relaying', async () => {
    this.plugin.pause = 1
    this.connection.relaying = true
    await new Promise((resolve) => {
      this.plugin.early_talker((rc, msg) => {
        assert.equal(rc, undefined)
        assert.equal(msg, undefined)
        resolve()
      }, this.connection)
    })
  })

  it('is an early talker', async () => {
    const before = Date.now()
    this.plugin.pause = 1001
    this.connection.early_talker = true
    const { rc, msg } = await callHook(
      this.plugin,
      'early_talker',
      this.connection,
    )
    assert.ok(Date.now() >= before + 1000)
    assert.equal(rc, DENYDISCONNECT)
    assert.equal(msg, 'You talk too soon')
  })

  it('is an early talker, reject=false', async () => {
    const before = Date.now()
    this.plugin.pause = 1001
    this.plugin.cfg.main.reject = false
    this.connection.early_talker = true
    const { rc, msg } = await callHook(
      this.plugin,
      'early_talker',
      this.connection,
    )
    assert.ok(Date.now() >= before + 1000)
    assert.equal(undefined, rc)
    assert.equal(undefined, msg)
    assert.ok(this.connection.results.has('early_talker', 'fail', 'early'))
  })

  it('relay whitelisted ip', async () => {
    this.plugin.pause = 1000
    this.plugin.whitelist = this.plugin.load_ip_list(['127.0.0.1'])
    this.connection.remote.ip = '127.0.0.1'
    this.connection.early_talker = true
    const { rc, msg } = await callHook(
      this.plugin,
      'early_talker',
      this.connection,
    )
    assert.equal(undefined, rc)
    assert.equal(undefined, msg)
    assert.ok(this.connection.results.has('early_talker', 'skip', 'whitelist'))
  })

  it('relay whitelisted subnet', async () => {
    this.plugin.pause = 1000
    this.plugin.whitelist = this.plugin.load_ip_list(['127.0.0.0/16'])
    this.connection.remote.ip = '127.0.0.88'
    this.connection.early_talker = true
    await new Promise((resolve) => {
      this.plugin.early_talker((rc, msg) => {
        assert.equal(undefined, rc)
        assert.equal(undefined, msg)
        assert.ok(
          this.connection.results.has('early_talker', 'skip', 'whitelist'),
        )
        resolve()
      }, this.connection)
    })
  })

  it('relay good senders', async () => {
    this.plugin.pause = 1000
    this.connection.results.add('karma', { good: 10 })
    this.connection.early_talker = true
    const { rc, msg } = await callHook(
      this.plugin,
      'early_talker',
      this.connection,
    )
    assert.equal(undefined, rc)
    assert.equal(undefined, msg)
    assert.ok(this.connection.results.has('early_talker', 'skip', '+karma'))
  })

  it('test loading ip list', () => {
    const whitelist = this.plugin.load_ip_list([
      '123.123.123.123',
      '127.0.0.0/16',
    ])
    assert.equal(whitelist[0][1], 32)
    assert.equal(whitelist[1][1], 16)
  })

  it('load_config handles a missing [ip_whitelist] section (C1)', () => {
    // simulate a minimal config that omits the [ip_whitelist] section
    this.plugin.config.get = () => ({ main: { pause: 5 } })
    assert.doesNotThrow(() => this.plugin.load_config())
    assert.deepEqual(this.plugin.whitelist, [])
  })

  it('load_config resets this.pause when main.pause is removed (C2)', () => {
    this.plugin.config.get = () => ({ main: { pause: 5 }, ip_whitelist: {} })
    this.plugin.load_config()
    assert.equal(this.plugin.pause, 5000)

    this.plugin.config.get = () => ({ main: {}, ip_whitelist: {} })
    this.plugin.load_config()
    assert.equal(this.plugin.pause, undefined)
  })
})
