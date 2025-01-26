import axios from "axios";
import cheerio from "cheerio";
import pool from "../config/database";

// Function used to fetch free proxies from https://free-proxy-list.net
async function fetchProxies() {
    try {
        const response = await axios.get("https://free-proxy-list.net");
        const $ = cheerio.load(response.data);

        const proxies: { ip: string; port: string }[] = [];

        // parsing the table to extract the proxies
        $("table tbody tr").each((index, element) => {
            const ip = $(element).find("td").eq(0).text();
            const port = $(element).find("td").eq(1).text();
            if (ip && port) {
                proxies.push({ ip, port });
            }
        });

        return proxies;
    } catch (error: any) {
        console.error(error);
        return []
    }
}

// Add fetched proxies to the database
async function addProxiesToDatabase() {
    const proxies = await fetchProxies();
    for (const proxy of proxies) {
        await pool.query(
            `INSERT INTO proxies (ip, port, is_active) VALUES ($1, $2, $3) ON CONFLICT (ip, port) DO NOTHING`,
            [proxy.ip, proxy.port, true]
        );
    }
    console.log(`${proxies.length} proxies added to the database`);
}

// Run the function
addProxiesToDatabase();