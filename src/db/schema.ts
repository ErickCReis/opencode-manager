import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  repo: text('repo').notNull(),
  branch: text('branch').notNull(),
  port: integer('port').notNull(),
  pid: integer('pid'),
  githubToken: text('github_token'),
  status: text('status', { enum: ['running', 'stopped'] }).notNull().default('stopped'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})
