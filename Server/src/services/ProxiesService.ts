import axios from "axios";
import cheerio from "cheerio";
import pool from "../config/database";
import {chromium} from "playwright";

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

async function checkProxyHealth(proxy: any) {
    try {
        const browser = await chromium.launch({
            proxy: {
                server: `${proxy.ip}:${proxy.port}`,
                username: proxy.username,
                password: proxy.password,
            },
        });
        await browser.close();
        await pool.query(`UPDATE proxies SET is_active = TRUE WHERE id = $1`, [proxy.id]);
    } catch (error) {
        await pool.query(`UPDATE proxies SET is_active = FALSE WHERE id = $1`, [proxy.id]);
    }
}

// run health checks periodically on the proxes and update them
setInterval(async () => {
    const proxies = await pool.query(`SELECT * FROM proxies`);
    for (const proxy of proxies.rows) {
        await checkProxyHealth(proxy);
    }
}, 3600000); // check every hour

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