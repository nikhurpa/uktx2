class ExcelSyncApp {
    constructor() {
        this.excelFile = null;
        this.configFile = null;
        this.config = null;
        this.totalRows = 0;
        this.processedRows = 0;
        this.batchSize = 100;
        this.isProcessing = false;
        
        this.initEventListeners();
    }

    initEventListeners() {
        document.getElementById('excelFile').addEventListener('change', (e) => {
            this.excelFile = e.target.files[0];
        });

        document.getElementById('configFile').addEventListener('change', (e) => {
            this.configFile = e.target.files[0];
        });

        document.getElementById('startBtn').addEventListener('click', () => {
            this.startProcessing();
        });
    }

    async startProcessing() {
        if (!this.excelFile || !this.configFile) {
            this.addStatusMessage('Please select both Excel and configuration files', 'error');
            return;
        }

        try {
            this.isProcessing = true;
            document.getElementById('startBtn').disabled = true;
            this.clearStatusMessages();
            this.addStatusMessage('Reading configuration file...', 'info');

            // Read config file
            this.config = await this.readConfigFile();
            
            // Validate config
            if (!this.config.unique_id_field) {
                this.addStatusMessage('Warning: unique_id_field not specified in config', 'error');
                this.config.unique_id_field = this.config.unique_id; // Fallback to unique_id
            }
            
            // Read Excel file
            this.addStatusMessage('Reading Excel file...', 'info');
            const excelData = await this.readExcelFile();
            
            this.totalRows = excelData.length;
            this.processedRows = 0;
            
            if (this.totalRows === 0) {
                this.addStatusMessage('No data found in Excel file', 'error');
                return;
            }

            this.addStatusMessage(`Processing ${this.totalRows} rows in batches of ${this.batchSize}`, 'info');
            
            // Start batch processing
            await this.processBatch(excelData);
            
            this.addStatusMessage('Processing completed successfully!', 'success');
            this.updateProgress(100);
            
        } catch (error) {
            this.addStatusMessage(`Error: ${error.message}`, 'error');
            console.error('Processing error:', error);
        } finally {
            this.isProcessing = false;
            document.getElementById('startBtn').disabled = false;
        }
    }

    async readConfigFileOld() {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    // Evaluate the JavaScript object (be careful with this in production)
                    // For security, you might want to validate the content first
                    const config = eval(`(${content})`);
                    resolve(config);
                } catch (error) {
                    reject(new Error('Invalid configuration file format'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read configuration file'));
            };
            
            reader.readAsText(this.configFile);
        });
    }


    async readConfigFile() {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    console.log('Config file content:', content);
                    
                    // Create a function to safely evaluate the content
                    // This is safer than eval() for user-provided content
                    const configFunction = new Function('return ' + content);
                    const config = configFunction();
                    
                    // Validate that we got an object
                    if (typeof config !== 'object' || config === null) {
                        throw new Error('Configuration must be a valid JavaScript object');
                    }
                    
                    resolve(config);
                } catch (error) {
                    console.error('Config parsing error:', error);
                    reject(new Error('Invalid configuration file format: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read configuration file'));
            };
            
            reader.readAsText(this.configFile);
        });
    }
    async readExcelFile() {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                    
                    const sheetName = this.config.sheet || workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    
                    // Convert to JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    // Skip header row and convert to objects
                    const headers = jsonData[0];
                    const rows = jsonData.slice(1).map(row => {
                        const obj = {};
                        headers.forEach((header, index) => {
                            obj[header] = row[index];
                        });
                        return obj;
                    });
                    
                    resolve(rows);
                } catch (error) {
                    reject(new Error('Failed to parse Excel file'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read Excel file'));
            };
            
            reader.readAsArrayBuffer(this.excelFile);
        });
    }

    async processBatch(excelData) {
        const totalBatches = Math.ceil(excelData.length / this.batchSize);
        let batchIndex = 0;
        
        for (let i = 0; i < excelData.length; i += this.batchSize) {
            const batch = excelData.slice(i, i + this.batchSize);
            batchIndex++;
            
            try {
                this.addStatusMessage(`Processing batch ${batchIndex} of ${totalBatches}...`, 'info');
                
                // Process batch
                const response = await this.sendBatchToServer(batch);
                
                this.processedRows += batch.length;
                const progress = Math.round((this.processedRows / this.totalRows) * 100);
                this.updateProgress(progress);
                
                if (response.error) {
                    this.addStatusMessage(`Batch ${batchIndex} error: ${response.error}`, 'error');
                } else {
                    this.addStatusMessage(`Batch ${batchIndex} processed successfully - Inserted: ${response.inserted}, Updated: ${response.updated}`, 'success');
                }
                
                // Small delay to allow UI updates
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                this.addStatusMessage(`Batch ${batchIndex} failed: ${error.message}`, 'error');
                throw error;
            }
        }
    }

    async sendBatchToServer(batch) {
        const formData = new FormData();
        formData.append('batch', JSON.stringify(batch));
        formData.append('config', JSON.stringify(this.config));
        
        try {
            const response = await fetch('process.php', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            throw new Error(`Network error: ${error.message}`);
        }
    }

    updateProgress(percent) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        progressFill.style.width = percent + '%';
        progressText.textContent = percent + '%';
    }

    addStatusMessage(message, type = 'info') {
        const statusContainer = document.getElementById('statusMessages');
        const messageElement = document.createElement('p');
        messageElement.className = type;
        messageElement.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
        statusContainer.appendChild(messageElement);
        statusContainer.scrollTop = statusContainer.scrollHeight;
    }

    clearStatusMessages() {
        document.getElementById('statusMessages').innerHTML = '';
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Load XLSX library (you'll need to include this in your HTML)
    // For production, include this in your HTML: <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    
    // Check if XLSX is available
    if (typeof XLSX === 'undefined') {
        console.error('XLSX library not loaded. Please include it in your HTML.');
    }
    
    const app = new ExcelSyncApp();
});
