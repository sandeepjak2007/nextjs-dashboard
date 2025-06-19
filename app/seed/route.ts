import bcrypt from "bcrypt";
import postgres from "postgres";
import { invoices, customers, revenue, users } from "../lib/placeholder-data";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function seedUsers(sql: postgres.TransactionSql<{}>) {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await sql`
      INSERT INTO users (id, name, email, password)
      VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
}

async function seedCustomers(sql: postgres.TransactionSql<{}>) {
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;
  for (const customer of customers) {
    await sql`
      INSERT INTO customers (id, name, email, image_url)
      VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
}

async function seedInvoices(sql: postgres.TransactionSql<{}>) {
  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;
  for (const invoice of invoices) {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
}

async function seedRevenue(sql: postgres.TransactionSql<{}>) {
  await sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;
  for (const rev of revenue) {
    await sql`
      INSERT INTO revenue (month, revenue)
      VALUES (${rev.month}, ${rev.revenue})
      ON CONFLICT (month) DO NOTHING;
    `;
  }
}

export async function GET() {
  try {
    // Create extension only once, outside the transaction
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // Run seeding in a transaction, sequentially
    await sql.begin(async (sql) => {
      await seedUsers(sql);
      await seedCustomers(sql);
      await seedInvoices(sql);
      await seedRevenue(sql);
    });

    return Response.json({ message: "Database seeded successfully" });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
