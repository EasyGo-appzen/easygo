import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import exphbs from 'express-handlebars';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Exotic Theme configurations with completely different color palettes
const themes = {
    default: {
        TPOS: '#00E676', // Neon Green
        FPOS: '#FF1744', // Vivid Red
        FNEG: '#FF6D00', // Deep Orange
        TNEG: '#78909C'  // Blue Gray
    },
    vibrant: {
        TPOS: '#00E5FF', // Electric Cyan
        FPOS: '#FF4081', // Hot Pink
        FNEG: '#FFAB00', // Golden Amber
        TNEG: '#B388FF'  // Lavender Purple
    },
    tropical: {
        TPOS: '#00BFA5', // Tropical Teal
        FPOS: '#FF6F61', // Living Coral
        FNEG: '#FFD54F', // Banana Yellow
        TNEG: '#4DD0E1'  // Caribbean Blue
    },
    ocean: {
        TPOS: '#26C6DA', // Ocean Turquoise
        FPOS: '#FF7043', // Sunset Coral
        FNEG: '#FFB300', // Deep Gold
        TNEG: '#5C6BC0'  // Deep Sea Blue
    },
    sunset: {
        TPOS: '#81C784', // Sage Green
        FPOS: '#EC407A', // Fuchsia Pink
        FNEG: '#FFA726', // Tangerine
        TNEG: '#9575CD'  // Wisteria Purple
    },
    neon: {
        TPOS: '#76FF03', // Electric Lime
        FPOS: '#F50057', // Neon Magenta
        FNEG: '#FFEA00', // Laser Yellow
        TNEG: '#7C4DFF'  // UV Purple
    },
    galaxy: {
        TPOS: '#18FFFF', // Cosmic Aqua
        FPOS: '#D500F9', // Nebula Magenta
        FNEG: '#FFC400', // Star Gold
        TNEG: '#651FFF'  // Deep Space Purple
    },
    aurora: {
        TPOS: '#69F0AE', // Northern Lights Green
        FPOS: '#FF6E40', // Aurora Red
        FNEG: '#FFD180', // Aurora Peach
        TNEG: '#448AFF'  // Polar Blue
    },
    candy: {
        TPOS: '#4CAF50', // Mint Candy
        FPOS: '#E91E63', // Bubblegum Pink
        FNEG: '#FF9800', // Orange Sherbet
        TNEG: '#9C27B0'  // Grape Purple
    },
    fire: {
        TPOS: '#8BC34A', // Lime Fire
        FPOS: '#F44336', // Crimson Flame
        FNEG: '#FF5722', // Burning Orange
        TNEG: '#795548'  // Charcoal
    },
    ice: {
        TPOS: '#00BCD4', // Glacier Cyan
        FPOS: '#E91E63', // Frozen Berry
        FNEG: '#FFC107', // Frost Gold
        TNEG: '#607D8B'  // Ice Gray
    },
    forest: {
        TPOS: '#4CAF50', // Forest Green
        FPOS: '#D32F2F', // Berry Red
        FNEG: '#F57C00', // Autumn Orange
        TNEG: '#5D4037'  // Tree Bark
    }
};

function getThemeColors(themeName = 'default') {
    return themes[themeName] || themes.default;
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Set up Handlebars as the view engine
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'EasyGo Visualizer',
        themes: Object.keys(themes)
    });
});

app.post('/upload', upload.array('csvFile', 10), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const theme = req.body.theme || 'default';
    
    try {
        // Process all uploaded files
        const allResults = [];
        
        for (const file of req.files) {
            const results = [];
            const filePath = file.path;
            
            await new Promise((resolve, reject) => {
                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on('data', (data) => results.push(data))
                    .on('end', () => {
                        allResults.push(...results);
                        // Clean up the uploaded file
                        fs.unlinkSync(filePath);
                        resolve();
                    })
                    .on('error', (error) => {
                        reject(error);
                    });
            });
        }
        
        // Process the combined data with the selected theme
        const processedData = processData(allResults, theme);
        
        // Send the processed data back to the client with theme info
        res.json({
            ...processedData,
            theme: theme,
            availableThemes: Object.keys(themes),
            filesProcessed: req.files.length
        });
    } catch (error) {
        console.error('Error processing data:', error);
        res.status(500).json({ error: 'Error processing data', details: error.message });
    }
});

function processData(data, themeName = 'vibrant') {
    // Group data by Model name and CVM Analysis
    const grouped = data.reduce((acc, row) => {
        const model = row['Model name'] || 'Unknown';
        const cvm = (row['CVM Analysis'] || 'UNKNOWN').toUpperCase();
        const amount = parseFloat(row['Reimbursement amount (USD)'] || 0);
        
        if (!acc[model]) {
            acc[model] = {};
        }
        
        if (!acc[model][cvm]) {
            acc[model][cvm] = { amount: 0, count: 0 };
        }
        
        acc[model][cvm].amount += amount;
        acc[model][cvm].count++;
        
        return acc;
    }, {});
    
    // Log available columns from first row for debugging
    if (data.length > 0) {
        console.log('Available CSV columns:', Object.keys(data[0]));
        console.log('First row sample:', data[0]);
    }
    
    // Group data by Model name and Expense Type for TPOS only
    const expenseTypesByModel = data.reduce((acc, row, index) => {
        const model = row['Model name'] || 'Unknown';
        const cvm = (row['CVM Analysis'] || 'UNKNOWN').toUpperCase();
        
        // Try different possible column names for expense type
        const expenseType = row['Expense Type'] || 
                           row['Expense type'] || 
                           row['expense type'] || 
                           row['ExpenseType'] || 
                           row['Type'] ||
                           row['Category'] ||
                           row['Expense Category'] ||
                           'Unknown';
        
        const amount = parseFloat(row['Reimbursement amount (USD)'] || 0);
        
        // Debug first TPOS entry
        if (cvm === 'TPOS' && index === 0) {
            console.log('First TPOS entry - Expense Type found:', expenseType);
            console.log('First TPOS entry - Full row:', row);
        }
        
        // Only process TPOS entries
        if (cvm === 'TPOS' && expenseType !== 'Unknown') {
            if (!acc[model]) {
                acc[model] = {};
            }
            
            if (!acc[model][expenseType]) {
                acc[model][expenseType] = { amount: 0, count: 0 };
            }
            
            acc[model][expenseType].amount += amount;
            acc[model][expenseType].count++;
        }
        
        return acc;
    }, {});
    
    console.log('Expense types by model:', Object.keys(expenseTypesByModel).length, 'models found');
    console.log('Sample expense types:', expenseTypesByModel);

    // Get unique CVM types that have non-zero amounts
    const allCvmTypes = new Set();
    Object.values(grouped).forEach(modelData => {
        Object.entries(modelData).forEach(([cvm, { amount }]) => {
            if (amount > 0) {
                allCvmTypes.add(cvm);
            }
        });
    });
    
    const cvmTypes = Array.from(allCvmTypes);
    const models = Object.keys(grouped);
    const theme = getThemeColors(themeName);
    
    // Create datasets only for CVM types with data
    const datasets = cvmTypes.map(type => {
        const data = models.map(model => {
            return (grouped[model][type]?.amount || 0);
        });
        
        const count = models.map(model => {
            return (grouped[model][type]?.count || 0);
        });
        
        return {
            label: type,
            data: data,
            count: count,
            backgroundColor: theme[type] || '#95a5a6'
        };
    });

    // Filter out models where both TNEG and FNEG are zero
    const validModels = models.filter((model, modelIndex) => {
        // Check if this model has any non-zero data
        const hasData = datasets.some(ds => ds.data[modelIndex] > 0);
        if (!hasData) return false;
        
        // Check if this model has TNEG or FNEG with non-zero amounts
        const hasTNEG = datasets.some(ds => 
            ds.label === 'TNEG' && ds.data[modelIndex] > 0
        );
        const hasFNEG = datasets.some(ds => 
            ds.label === 'FNEG' && ds.data[modelIndex] > 0
        );
        
        // Keep the model if it has any non-zero TNEG or FNEG
        // or if it has non-zero TPOS or FPOS (regardless of TNEG/FNEG)
        return hasTNEG || hasFNEG || 
               datasets.some(ds => 
                   (ds.label === 'TPOS' || ds.label === 'FPOS') && 
                   ds.data[modelIndex] > 0
               );
    });
    
    // Filter datasets to only include valid models and remove empty TNEG/FNEG datasets
    const filteredDatasets = datasets
        .map(ds => ({
            ...ds,
            data: ds.data.filter((_, i) => validModels.includes(models[i])),
            count: ds.count.filter((_, i) => validModels.includes(models[i]))
        }))
        .filter(ds => 
            // Keep all TPOS and FPOS datasets
            ['TPOS', 'FPOS'].includes(ds.label) || 
            // Only keep TNEG and FNEG if they have non-zero data
            (['TNEG', 'FNEG'].includes(ds.label) && ds.data.some(val => val > 0))
        );

    // Get top 3 expense types for each model
    const top3ExpenseTypes = {};
    Object.keys(expenseTypesByModel).forEach(model => {
        const expenseTypes = expenseTypesByModel[model];
        const sorted = Object.entries(expenseTypes)
            .sort((a, b) => b[1].amount - a[1].amount)
            .slice(0, 3);
        
        top3ExpenseTypes[model] = sorted.map(([type, data]) => ({
            expenseType: type,
            count: data.count,
            amount: data.amount
        }));
    });

    return { 
        models: validModels, 
        datasets: filteredDatasets,
        hasData: validModels.length > 0,
        top3ExpenseTypes: top3ExpenseTypes
    };
}

// Add theme endpoint
app.get('/api/themes', (req, res) => {
    res.json({
        themes: Object.keys(themes),
        currentTheme: 'vibrant'
    });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
});