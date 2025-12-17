
import { getDb } from './src/db';
import { users, media } from './src/db/schema';
import { like, eq, desc } from 'drizzle-orm';

async function test() {
    const db = getDb({ DB: process.env.DB } as any);
    
    console.log("Searching for 'Brahim'...");
    const searchPattern = `%Brahim%`;
    const foundUsers = await db.select({ id: users.id, full_name: users.full_name })
        .from(users)
        .where(like(users.full_name, searchPattern))
        .all();
        
    console.log("Found users:", foundUsers);

    if (foundUsers.length > 0) {
        for (const user of foundUsers) {
            console.log(`Checking media for ${user.full_name} (ID: ${user.id})...`);
            const mediaList = await db.select()
                .from(media)
                .where(eq(media.uploaded_by, user.id))
                .orderBy(desc(media.created_at))
                .all();
            console.log(`Found ${mediaList.length} media items.`);
            if (mediaList.length > 0) {
                console.log("Sample:", mediaList[0]);
            }
        }
    }
}

test().catch(console.error);
