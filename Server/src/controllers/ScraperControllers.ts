import { Request, Response } from "express";
import {PlaywrightService} from "../services/PlaywrightService";
import pool from "../config/database";

const playwrightService = new PlaywrightService();

export class ScraperControllers {
    async scrapeWebsite(req: Request, res: Response) {
        try {
            const { url, item, selectors, options } = req.body;

            if (!url || !item || !selectors) {
                return res.status(400).json({ error: "The request is missing something"})
            }

            const result = await playwrightService.launchScrapper(
                url,
                item,
                selectors,
                options
            );

            if (!result.success) {
                return res.status(500).json({ error: result.error });
            } else {
                // add to database
                const db = pool.query(`
                INSERT into scraped_data ( source_url, title, price, description, results ) VALUES ( $1, $2 , $3, $4 ) RETURNING id
                `, [url, item, selectors.title, selectors.price, selectors.description, result])
                console.log("Added to Database Succesfully")
            }

            return res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({error: error.message});
        }
    };
}