/* globals WebSocket */

import { h, render, Component } from 'preact';

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

class SqliteProxy {
  constructor () {
    this.id = 0;
    this.packets = [];

    this.ws = new WebSocket('ws://localhost:4100/api/storage/sqlite', 'appbox');
    this.ws.onopen = this.onOpen.bind(this);
    this.ws.onmessage = this.onMessage.bind(this);
  }

  get connected () {
    return this.ws.readyState === 1;
  }

  onOpen () {
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
    this.push('run', 'select true', callback);
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
}

const db = new SqliteProxy();

// Tell Babel to transform JSX into h() calls:
/** @jsx h */

class CreateTodo extends Component {
  constructor () {
    super();

    this.state.text = '';
  }

  save () {
    this.props.onCreate({
      text: this.state.text
    });
  }

  render () {
    return (
      <div>
        <textarea
          value={this.state.text}
          onChange={(e) => this.setState({text: e.target.value})}
        />
        <button
          onClick={(e) => this.save()}
        />
      </div>
    );
  }
}

class Todo extends Component {
  constructor () {
    super();
  }

  delete () {
    this.props.onDelete();
  }

  render () {
    return (
      <div>
        <p>{this.props.todo.info}</p>
        <button onClick={(e) => this.delete()}>Delete</button>
      </div>
    );
  }
}
class Clock extends Component {
  constructor () {
    super();

    // Create database
    this.initialize();

    this.state.todos = [];
  }

  initialize () {
    if (false) {
      db.serialize(() => {
        db.run('CREATE TABLE lorem (info TEXT)');
        db.run('DELETE FROM lorem');

        var stmt = db.prepare('INSERT INTO lorem VALUES (?)');
        for (var i = 0; i < 10; i++) {
          stmt.run('Ipsum ' + i);
        }

        stmt.finalize(() => this.reload());
      });
    }

    this.reload();
  }

  reload () {
    this.setState({
      todos: []
    });

    db.each('SELECT rowid AS id, info FROM lorem', (err, row) => {
      if (err) {
        throw err;
      }

      this.setState({
        todos: this.state.todos.concat(row)
      });
    });

    db.close();
  }

  onCreate (todo) {
    db.run('INSERT INTO lorem VALUES (?)', todo.text, () => {
      this.reload();
    });
  }

  onDelete (todo) {
    db.run('DELETE FROM lorem where rowid=?', todo.id, () => {
      this.reload();
    });
  }

  render (props, state) {
    let todos = this.state.todos.map((t) => {
      return <Todo onDelete={() => this.onDelete(t)} todo={t} />;
    });

    return (<div>
      <CreateTodo onCreate={(todo) => this.onCreate(todo)} />

      <ul>{todos}</ul>
    </div>);
  }
}

// render an instance of Clock into <body>:
render(<Clock />, document.body);
