const express = require('express');
const Data = require('../models/Data');

const router = express.Router();

// POST - Store data in MongoDB
router.post('/', async (req, res) => {
    try {
        const { name, data } = req.body;
        
        // Validate required fields
        if (!name || !data) {
            return res.status(400).json({ 
                error: 'Both name and data fields are required' 
            });
        }

        // Create new data document
        const newData = new Data({
            name,
            data
        });

        // Save to MongoDB
        const savedData = await newData.save();
        
        res.status(201).json({
            message: 'Data stored successfully',
            data: savedData
        });
    } catch (error) {
        console.error('Error storing data:', error);
        res.status(500).json({ 
            error: 'Internal server error while storing data' 
        });
    }
});

// GET - Retrieve all data
router.get('/', async (req, res) => {
    try {
        const allData = await Data.find().sort({ createdAt: -1 });
        res.json({
            message: 'Data retrieved successfully',
            count: allData.length,
            data: allData
        });
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).json({ 
            error: 'Internal server error while retrieving data' 
        });
    }
});

// GET - Retrieve data by ID
router.get('/:id', async (req, res) => {
    try {
        const data = await Data.findById(req.params.id);
        if (!data) {
            return res.status(404).json({ error: 'Data not found' });
        }
        res.json({
            message: 'Data retrieved successfully',
            data
        });
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).json({ 
            error: 'Internal server error while retrieving data' 
        });
    }
});

module.exports = router;
