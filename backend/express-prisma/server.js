/**
 * DataPulse Standalone Server Runner
 * Authors: Udiksha Agarwal (24BAI0086), Bakya (24BAI0071), Rudra (24BKT0125)
 * Course: BCSE302P Database Systems Lab | Slot: L25+L26
 */

import app from './index.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(` DataPulse Backend API Server is RUNNING`);
  console.log(` Local Port: http://localhost:${PORT}`);
  console.log(` Health: http://localhost:${PORT}/api/health`);
  console.log(` Metrics: http://localhost:${PORT}/api/metrics`);
  console.log(` Contributors:`);
  console.log(`   - Udiksha Agarwal (24BAI0086) - Backend & Security`);
  console.log(`   - Bakya (24BAI0071) - Frontend Lead`);
  console.log(`   - Rudra (24BKT0125) - Cloud Database`);
  console.log(`========================================================`);
});
