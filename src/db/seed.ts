import { seed } from 'drizzle-seed'
import { drizzle } from 'drizzle-orm/libsql'
import { client } from '@/db/config'
import * as schema from '@/db/schema'

const db = drizzle(client)
await seed(db, { schema })
