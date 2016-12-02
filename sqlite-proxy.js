/* globals WebSocket */

const assert = require('assert');

class PreparedStatement {
  constructor (db, query) {
    this.db = db;
    this.query = query;
    this.commands = [];
  }

  push (command) {
    this.commands.push(command);
  }

  run (a) {
    this.push({
      query: this.query,
      arguments: [a]
    });
  }

  finalize (callback) {
    this.db.concat(this.commands, callback);
  }
}

export default class SqliteProxy {
  constructor (app) {
    this.id = 0;
    this.packets = [];
    this.app = app;

    this.ws = new WebSocket('ws://localhost:4100/api/storage/sqlite', 'appbox');
    this.ws.onopen = this.onOpen.bind(this);
    this.ws.onmessage = this.onMessage.bind(this);
  }

  get connected () {
    return this.ws.readyState === 1;
  }

  onOpen () {
    const helloPacket = {
      command: 'hello',
      app: this.app
    };

    this.ws.send(JSON.stringify(helloPacket));

    this.flush();
  }

  flush () {
    this.packets.forEach((c) => {
      this.send(c);
    });
  }

  send (packet) {
    var message = Object.assign({}, packet);

    if (packet.callback) {
      message.callback = true;
    } else {
      delete message.callback;
    }

    this.ws.send(JSON.stringify(message));
  }

  getPacketById (id) {
    return this.packets.filter((p) => p.id === id)[0];
  }

  onMessage (event) {
    const packet = JSON.parse(event.data);

    if (packet.id) {
      const ourPacket = this.getPacketById(packet.id);

      if (ourPacket) {
        ourPacket.callback(packet.err, packet.row);
      }
    }
  }

  serialize (callback) {
    // fixme
    callback();
  }

  push (command, query, callback) {
    assert(typeof command === 'string');
    assert(typeof query === 'object');

    this.id++;

    const packet = {
      id: this.id,
      command: command,
      query: query,
      callback: callback
    };

    if (this.connected) {
      this.send(packet);
    }

    this.packets.push(packet);
  }

  concat (commands, callback) {
    commands.forEach((c) => {
      this.push('run', c);
    });

    // Gross
    this.push('run', { query: 'select true' }, callback);
  }

  run (query, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    this.push('run', { query: query, arguments: params }, callback);
  }

  each (query, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    this.push('each', { query: query, arguments: params }, callback);
  }

  prepare (query) {
    return new PreparedStatement(this, query);
  }

  close () {
    console.log(JSON.stringify(this.commands));
  }
};
