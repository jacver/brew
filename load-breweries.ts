import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();

async function main() {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        console.log(`Fetching page ${page}...`);

        const res = await fetch(
            `https://api.openbrewerydb.org/v1/breweries?page=${page}&per_page=200`
        );

        if (!res.ok) {
            throw new Error(`Failed to fetch page ${page}: ${res.statusText}`);
        }

        const breweries: any = await res.json();

        if (breweries.length === 0) {
            hasMore = false;
            break;
        }

        // Upsert to avoid duplicates
        for (const b of breweries) {
            await prisma.brewery.upsert({
                where: { id: b.id },
                update: {
                    name: b.name,
                    city: b.city,
                    state: b.state,
                    country: b.country,
                },
                create: {
                    id: b.id,
                    name: b.name,
                    city: b.city,
                    state: b.state,
                    country: b.country,
                },
            });
        }

        page++;
    }

    console.log("✅ Import complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
