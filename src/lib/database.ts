import initSqlJs, { Database } from 'sql.js';
import localforage from 'localforage';

let db: Database | null = null;
let SQL: any = null;

const DB_NAME = 'smartcoop.db';

export async function initDatabase(): Promise<Database> {
  if (db) return db;

  SQL = await initSqlJs({
    locateFile: (file) => `https://sql.js.org/dist/${file}`
  });

  const savedDb = await localforage.getItem<Uint8Array>(DB_NAME);

  if (savedDb) {
    db = new SQL.Database(savedDb);
    await ensureDefaultUser();
  } else {
    db = new SQL.Database();
    await createTables();
    await createDefaultUser();
    await saveDatabase();
  }

  return db;
}

async function ensureDefaultUser() {
  if (!db) return;

  const stmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE email = ?');
  stmt.bind(['admin@smartcoop.local']);

  if (stmt.step()) {
    const result = stmt.getAsObject();
    stmt.free();

    if (result.count === 0) {
      await createDefaultUser();
      await saveDatabase();
    }
  }
}

async function createDefaultUser() {
  if (!db) return;

  // Create default admin user: admin@smartcoop.local / admin123
  const passwordHash = btoa('admin123');
  const now = new Date().toISOString();
  const userId = '00000000-0000-0000-0000-000000000001';

  db.run(`
    INSERT OR IGNORE INTO users (id, email, password_hash, display_name, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [userId, 'admin@smartcoop.local', passwordHash, 'Administrateur', 'admin', now, now]);
}

async function createTables() {
  if (!db) throw new Error('Database not initialized');

  db.run(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT DEFAULT '',
      role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'collector', 'driver')),
      organization_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      last_login_at TEXT,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS producers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      region TEXT,
      latitude REAL,
      longitude REAL,
      total_production REAL DEFAULT 0,
      quality_score REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed')),
      organization_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      capacity REAL DEFAULT 0,
      current_stock REAL DEFAULT 0,
      latitude REAL,
      longitude REAL,
      organization_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'collector', 'driver', 'staff')),
      user_id TEXT,
      organization_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      producer_id TEXT,
      collection_date TEXT DEFAULT (datetime('now')),
      quantity REAL NOT NULL,
      quality_grade TEXT CHECK (quality_grade IN ('A', 'B', 'C', 'Rejected')),
      moisture_content REAL,
      defects_count INTEGER DEFAULT 0,
      notes TEXT,
      collector_id TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      organization_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (producer_id) REFERENCES producers(id) ON DELETE CASCADE,
      FOREIGN KEY (collector_id) REFERENCES employees(id) ON DELETE SET NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS stock (
      id TEXT PRIMARY KEY,
      stock_number TEXT UNIQUE NOT NULL,
      producer_id TEXT,
      collection_id TEXT,
      warehouse_id TEXT,
      quantity REAL NOT NULL,
      quality_grade TEXT CHECK (quality_grade IN ('A', 'B', 'C', 'Rejected')),
      moisture_content REAL,
      defects_count INTEGER DEFAULT 0,
      price_per_kg REAL,
      total_price REAL,
      payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed')),
      delivery_status TEXT DEFAULT 'in_warehouse' CHECK (delivery_status IN ('in_warehouse', 'reserved', 'partially_delivered', 'delivered', 'archived')),
      entry_date TEXT DEFAULT (datetime('now')),
      is_group INTEGER DEFAULT 0,
      parent_stock_id TEXT,
      organization_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (producer_id) REFERENCES producers(id) ON DELETE SET NULL,
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
      FOREIGN KEY (parent_stock_id) REFERENCES stock(id) ON DELETE SET NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      route_name TEXT NOT NULL,
      route_date TEXT NOT NULL,
      driver_id TEXT,
      producer_ids TEXT,
      status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
      total_distance REAL,
      estimated_duration REAL,
      actual_duration REAL,
      notes TEXT,
      weather_conditions TEXT,
      organization_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (driver_id) REFERENCES employees(id) ON DELETE SET NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS deliveries (
      id TEXT PRIMARY KEY,
      delivery_number TEXT UNIQUE NOT NULL,
      client_name TEXT NOT NULL,
      client_address TEXT,
      client_phone TEXT,
      client_email TEXT,
      delivery_date TEXT NOT NULL,
      driver_id TEXT,
      vehicle_info TEXT,
      total_quantity REAL DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered', 'cancelled')),
      notes TEXT,
      organization_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (driver_id) REFERENCES employees(id) ON DELETE SET NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS delivery_stocks (
      id TEXT PRIMARY KEY,
      delivery_id TEXT,
      stock_id TEXT,
      quantity REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE,
      FOREIGN KEY (stock_id) REFERENCES stock(id) ON DELETE CASCADE,
      UNIQUE(delivery_id, stock_id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      producer_id TEXT,
      stock_id TEXT,
      amount REAL NOT NULL,
      payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
      issue_date TEXT DEFAULT (date('now')),
      due_date TEXT,
      paid_date TEXT,
      notes TEXT,
      organization_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (producer_id) REFERENCES producers(id) ON DELETE CASCADE,
      FOREIGN KEY (stock_id) REFERENCES stock(id) ON DELETE SET NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS finance (
      id TEXT PRIMARY KEY,
      transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'payment')),
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      transaction_date TEXT DEFAULT (date('now')),
      reference_id TEXT,
      reference_type TEXT,
      organization_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      budget_name TEXT NOT NULL,
      category TEXT NOT NULL,
      allocated_amount REAL NOT NULL,
      spent_amount REAL DEFAULT 0,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'exceeded')),
      notes TEXT,
      organization_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      organization_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
      read INTEGER DEFAULT 0,
      link TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS targets (
      id TEXT PRIMARY KEY,
      target_name TEXT NOT NULL,
      target_type TEXT NOT NULL CHECK (target_type IN ('production', 'quality', 'sales', 'revenue')),
      target_value REAL NOT NULL,
      current_value REAL DEFAULT 0,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'missed')),
      organization_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_producers_code ON producers(code);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_producers_organization ON producers(organization_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_stock_number ON stock(stock_number);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_stock_warehouse ON stock(warehouse_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_stock_organization ON stock(organization_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_deliveries_number ON deliveries(delivery_number);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);`);
}

export async function saveDatabase() {
  if (!db) return;
  const data = db.export();
  await localforage.setItem(DB_NAME, data);
}

export function getDatabase(): Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase first.');
  return db;
}

export async function clearDatabase() {
  await localforage.removeItem(DB_NAME);
  if (db) {
    db.close();
    db = null;
  }
}
