const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const DEFAULT_DATA = {
  users: [],
  posts: [],
  messages: []
};

class DataStore extends EventEmitter {
  constructor(filePath) {
    super();
    this.filePath = filePath;
    this.data = deepClone(DEFAULT_DATA);
    this.queue = Promise.resolve();
    this.isWriting = false;
    this._loadInitial();
  }

  async _loadInitial() {
    await this.loadFromDisk();
    this._watchFile();
  }

  async loadFromDisk(emitSync = false) {
    try {
      const raw = await fs.promises.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      this.data = {
        users: parsed.users || [],
        posts: parsed.posts || [],
        messages: parsed.messages || []
      };
      if (emitSync) {
        this.emit('externalSync', this.snapshot());
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.promises.mkdir(path.dirname(this.filePath), { recursive: true });
        await this.persist();
      } else {
        console.error('Failed to load JSON storage', error);
      }
    }
  }

  _watchFile() {
    fs.watchFile(this.filePath, { interval: 500 }, (curr, prev) => {
      if (this.isWriting) {
        return;
      }
      if (curr.mtimeMs !== prev.mtimeMs) {
        this.loadFromDisk(true).catch((error) =>
          console.error('Failed to hot reload JSON', error)
        );
      }
    });
  }

  snapshot() {
    return deepClone(this.data);
  }

  async persist() {
    this.isWriting = true;
    await fs.promises.writeFile(
      this.filePath,
      JSON.stringify(this.data, null, 2),
      'utf-8'
    );
    this.isWriting = false;
  }

  async read(selector) {
    const data = this.snapshot();
    return selector ? selector(data) : data;
  }

  update(mutator, meta = {}) {
    const execution = this.queue.then(async () => {
      const draft = this.snapshot();
      const result = await mutator(draft);
      this.data = draft;
      await this.persist();
      const payload = { ...meta, result };
      this.emit('dataChanged', payload);
      if (meta.event) {
        this.emit(meta.event, payload);
      }
      return result;
    });

    this.queue = execution.catch((error) => {
      console.error('DataStore update failed', error);
    });

    return execution;
  }
}

module.exports = DataStore;
