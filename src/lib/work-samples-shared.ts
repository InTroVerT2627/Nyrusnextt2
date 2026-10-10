export type SqlCohortResult = {
  passed: boolean;
  checks: { title: string; passed: boolean; message?: string }[];
  rows: Record<string, unknown>[];
  columns: string[];
  executionTimeMs: number;
};

export const SQL_SEED_SCRIPT = `
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, segment TEXT, signup_date TEXT);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, order_date TEXT, amount REAL, status TEXT);

INSERT INTO customers VALUES
  (1, 'Acme Corp', 'Enterprise', '2026-01-15'),
  (2, 'Globex Inc', 'Enterprise', '2026-02-10'),
  (3, 'Nexus Labs', 'Mid-Market', '2026-03-01'),
  (4, 'Vertex AI', 'Mid-Market', '2026-04-12'),
  (5, 'SaaSify', 'SMB', '2026-05-20'),
  (6, 'Cloudlet', 'SMB', '2026-06-15');

INSERT INTO orders VALUES
  (101, 1, '2026-07-05', 12500.00, 'completed'),
  (102, 1, '2026-08-14', 10000.00, 'completed'),
  (103, 2, '2026-09-02', 10000.00, 'completed'),
  (104, 2, '2026-09-20', 5000.00, 'refunded'),
  (105, 3, '2026-07-10', 4200.00, 'completed'),
  (106, 3, '2026-08-18', 3000.00, 'completed'),
  (107, 4, '2026-08-25', 3500.00, 'completed'),
  (108, 4, '2026-09-12', 3500.00, 'completed'),
  (109, 4, '2026-09-28', 2000.00, 'pending'),
  (110, 5, '2026-07-02', 800.00, 'completed'),
  (111, 5, '2026-07-29', 800.00, 'completed'),
  (112, 5, '2026-08-15', 800.00, 'completed'),
  (113, 6, '2026-08-01', 800.00, 'completed'),
  (114, 6, '2026-08-20', 800.00, 'completed'),
  (115, 6, '2026-09-10', 800.00, 'completed'),
  (116, 6, '2026-09-25', 500.00, 'refunded'),
  (117, 1, '2026-06-25', 15000.00, 'completed');
`;

export type UnitEconomicsModel = {
  cac: number;
  ltv: number;
  ltvCacRatio: number;
  paybackMonths: number;
};

export type CommunicationPackage = {
  executiveBriefing: string;
  customerAdvisory: string;
};
