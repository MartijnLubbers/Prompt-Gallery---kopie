const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database verbinding
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT
});

// Prompts Ophalen
// API route om prompts op te halen met gekoppelde afdelingen, functies, applicaties en werkzaamheden
app.get('/api/prompts', async (req, res) => {
    const { functie, afdeling, soort, werkzaamheid } = req.query; // Queryparameters ophalen

    try {
        let query = `
            SELECT 
                p.id AS prompt_id,
                p.titel,
                p.body,
                p.rating,
                p.hoeveelheid_rating,
                p.soort,
                STRING_AGG(DISTINCT a.naam, ', ') AS afdelingen,
                STRING_AGG(DISTINCT f.naam, ', ') AS functies,
                STRING_AGG(DISTINCT w.naam, ', ') AS werkzaamheden,                
                STRING_AGG(DISTINCT app.naam, ', ') AS applicaties
            FROM 
                prompt p
            LEFT JOIN prompt_afdelingen pa ON p.id = pa.prompt_id
            LEFT JOIN afdeling a ON pa.afdeling_id = a.id
            LEFT JOIN prompt_functies pf ON p.id = pf.prompt_id
            LEFT JOIN functies f ON pf.functie_id = f.id
            LEFT JOIN prompt_applicatie pap ON p.id = pap.prompt_id
            LEFT JOIN applicaties app ON pap.applicatie_id = app.id
            LEFT JOIN prompt_werkzaamheden pw ON p.id = pw.prompt_id
            LEFT JOIN werkzaamheden w ON pw.werkzaamheid_id = w.id
            WHERE 1=1
        `;

        // Dynamische filters toevoegen
        const queryParams = [];
        if (functie) {
            query += ' AND f.naam ILIKE $' + (queryParams.length + 1);
            queryParams.push(`%${functie}%`);
        }
        if (afdeling) {
            query += ' AND a.naam ILIKE $' + (queryParams.length + 1);
            queryParams.push(`%${afdeling}%`);
        }
        if (soort) {
            query += ' AND p.soort ILIKE $' + (queryParams.length + 1);
            queryParams.push(`%${soort}%`);
        }
        if (werkzaamheid) {
            query += ' AND w.naam ILIKE $' + (queryParams.length + 1);
            queryParams.push(`%${werkzaamheid}%`);
        }

        query += `
            GROUP BY p.id
            ORDER BY p.id
            LIMIT 50;
        `;

        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send('Server error');
    }
});


// Revieuw toevoeg.
// API route om een rating toe te voegen aan een prompt
app.post('/api/prompts/:id/rating', async (req, res) => {
    const promptId = parseInt(req.params.id, 10);
    const { rating } = req.body;

    // Controleer of de rating geldig is
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Invalid rating. Must be a number between 1 and 5.' });
    }

    try {
        // Haal de huidige rating en hoeveelheid_rating op
        const queryGet = `
            SELECT rating, hoeveelheid_rating
            FROM prompt
            WHERE id = $1;
        `;
        const result = await pool.query(queryGet, [promptId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Prompt not found.' });
        }

        const currentRating = result.rows[0].rating;
        const currentCount = result.rows[0].hoeveelheid_rating;

        // Bereken de nieuwe rating
        const newCount = currentCount + 1;
        const newRating = ((currentRating * currentCount) + rating) / newCount;

        // Update de nieuwe rating en hoeveelheid_rating in de database
        const queryUpdate = `
            UPDATE prompt
            SET rating = $1, hoeveelheid_rating = $2
            WHERE id = $3;
        `;
        await pool.query(queryUpdate, [newRating, newCount, promptId]);

        res.json({ message: 'Rating added successfully.', newRating, newCount });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send('Server error');
    }
});



// API route om afdelingen en functies op te halen
app.get('/api/afdelingen-functies', async (req, res) => {
    try {
        const query = `
            SELECT a.id AS afdeling_id, a.naam AS afdeling, 
                   f.id AS functie_id, f.naam AS functie
            FROM afdeling a
            JOIN afdeling_functies af ON a.id = af.afdeling_id
            JOIN functies f ON af.functie_id = f.id;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send('Server error');
    }
});

//Afdelingen ophalen
// API route om alle afdelingen op te halen
app.get('/api/afdelingen', async (req, res) => {
    try {
        const query = `
            SELECT id, naam
            FROM afdeling
            ORDER BY naam;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send('Server error');
    }
});

//Functies ophalen
// API route om alle functies op te halen
app.get('/api/functies', async (req, res) => {
    try {
        const query = `
            SELECT id, naam
            FROM functies
            ORDER BY naam;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send('Server error');
    }
});

//Werkzaamheden ophalen
// API route om alle werkzaamheden op te halen
app.get('/api/werkzaamheden', async (req, res) => {
    try {
        const query = `
            SELECT id, naam
            FROM werkzaamheden
            ORDER BY naam;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send('Server error');
    }
});

//Functies van Afdeling:
// API route om functies onder een specifieke afdeling op te halen
app.get('/api/afdelingen/:id/functies', async (req, res) => {
    const afdelingId = parseInt(req.params.id, 10);

    if (isNaN(afdelingId)) {
        return res.status(400).json({ error: 'Invalid afdeling ID' });
    }

    try {
        const query = `
            SELECT f.id, f.naam
            FROM functies f
            INNER JOIN afdeling_functies af ON f.id = af.functie_id
            WHERE af.afdeling_id = $1
            ORDER BY f.naam;
        `;
        const result = await pool.query(query, [afdelingId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No functions found for this afdeling ID' });
        }

        res.json(result.rows);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send('Server error');
    }
});

//Werkzaamheden van Functie
// API route om werkzaamheden onder een specifieke functie op te halen
app.get('/api/functies/:id/werkzaamheden', async (req, res) => {
    const functieId = parseInt(req.params.id, 10);

    if (isNaN(functieId)) {
        return res.status(400).json({ error: 'Invalid functie ID' });
    }

    try {
        const query = `
            SELECT w.id, w.naam
            FROM werkzaamheden w
            INNER JOIN functie_werkzaamheden fw ON w.id = fw.werkzaamheid_id
            WHERE fw.functie_id = $1
            ORDER BY w.naam;
        `;
        const result = await pool.query(query, [functieId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No werkzaamheden found for this functie ID' });
        }

        res.json(result.rows);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send('Server error');
    }
});


// Start de server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
